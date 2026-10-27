// Única fase con red remota: GET a la API pública y al sitio actual. No RPC,
// login, listado privado de Storage, POST ni credencial administrativa.
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { parseEnv } from 'node:util';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { CONTRATO, BASE, RAIZ, DIRECTORIO, normalizarFila, validarSnapshot, resumenTablas, huella, asegurarDirectorio, escribirPrivado } from './datos-publicos.mjs';
import { esCarreraVisible } from '../../components/index/types.ts';
import { canonical, titulo, metas, jsonLd, enlaces, normalizarTexto, decodificar } from '../tests/helpers/html.mjs';

export async function paginarPublico(leer, esperado) {
  const filas = []; let ultimo;
  for (let paginas = 0; paginas < 10000; paginas++) {
    const lote = await leer(ultimo);
    assert.ok(Array.isArray(lote) && lote.length <= 100);
    if (!lote.length) { assert.equal(filas.length, esperado, 'Export truncado o fuente cambió'); return filas; }
    for (const f of lote) { assert.ok(ultimo === undefined || f.id > ultimo, 'Página repetida o sin orden'); ultimo = f.id; filas.push(f); }
    assert.ok(filas.length <= esperado, 'Fuente cambió durante paginación');
  }
  throw new Error('Límite de paginación excedido');
}
export const urlsSitemap = xml => [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([,r]) => {
  const loc = /<loc>([^<]+)<\/loc>/.exec(r)?.[1]; assert.ok(loc);
  const u = new URL(decodificar(loc));
  assert.equal(u.origin, BASE); assert.ok(!u.search && !u.hash);
  assert.match(u.pathname, /^\/(?:$|teclab(?:\/inscripcion|\/test-vocacional)?$|clases-apoyo(?:\/[a-z0-9-]+)?$|contacto$|faq$|test-vocacional$|calendario-academico$|sobre-nosotros$|carreras\/[a-z0-9-]+$|novedades\/(?:[0-9]+|articulo\/[a-z0-9-]+)$)/);
  return { url: u.href, lastmod: /<lastmod>([^<]+)<\/lastmod>/.exec(r)?.[1] ?? null,
    imagenes: [...r.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(([,v])=>decodificar(v)) };
});
export function firmaHtml(html, url, respuesta) {
  const m = metas(html);
  const bloques = jsonLd(html);
  for (const bloque of bloques) { assert.ok(!bloque.includes('<'), 'JSON-LD sin escapar'); JSON.parse(bloque); }
  let region = /<main\b[^>]*>([\s\S]*?)<\/main>/.exec(html)?.[1];
  if (!region) region = html.slice(Math.max(0, html.search(/<(?:div class="ca-materia-pagina"|section class="faq-section)/)), html.indexOf('<footer'));
  const internos = enlaces(region || html).map(v => { try { const u = new URL(v, url); return u.origin === BASE ? u.pathname + u.search + u.hash : null; } catch { return null; } }).filter(Boolean);
  return { status: respuesta.status, location: respuesta.headers.get('location'), title: titulo(html), description: m.description ?? null,
    canonical: canonical(html), robots: m.robots ?? null, xRobots: respuesta.headers.get('x-robots-tag'),
    jsonLd: bloques.map(b => JSON.parse(b)), jsonLdEscapado: bloques.every(b => !b.includes('<')),
    texto:normalizarTexto(region || ''), textoSha256: huella(normalizarTexto(region || '')), enlaces: internos,
    imagenes: [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(([,v]) => decodificar(v)) };
}
async function concurrente(items, fn) {
  let i = 0; const result = new Array(items.length);
  await Promise.all(Array.from({ length: Math.min(3, items.length) }, async () => { while (i < items.length) { const j = i++; result[j] = await fn(items[j]); } }));
  return result;
}
export function lectorPublico(origen, anon, buscar = fetch) {
  const api = new URL(origen);
  assert.match(api.hostname, /^[a-z0-9]+\.supabase\.co$/); assert.equal(api.protocol, 'https:');
  if (anon.startsWith('eyJ')) assert.equal(JSON.parse(Buffer.from(anon.split('.')[1], 'base64url')).role, 'anon', 'Sólo clave anon');
  else assert.ok(anon.startsWith('sb_publishable_'), 'Sólo clave pública');
  return async (url, conClave = false) => {
    const u = new URL(url);
    assert.ok(!u.username && !u.password && u.protocol === 'https:');
    if(u.origin === BASE) assert.ok(!/^\/(?:api|inscripcion|admin)(?:\/|$)/i.test(decodeURIComponent(u.pathname)), 'No leer handlers ni enlaces privados');
    assert.ok(u.origin === BASE || (u.origin === api.origin && (/^\/rest\/v1\/(carreras|materias|novedades|faq_preguntas)$/.test(u.pathname) || u.pathname.startsWith('/storage/v1/object/public/'))), 'Origen/ruta remota no autorizado');
    if (conClave) { assert.equal(u.origin, api.origin); assert.match(u.pathname, /^\/rest\/v1\/(carreras|materias|novedades|faq_preguntas)$/); }
    const r = await buscar(u, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(30000), headers: conClave ? { apikey: anon, Authorization: `Bearer ${anon}`, Prefer: 'count=exact' } : {} });
    return r;
  };
}
export async function exportar({ origen, anon, siteKey = '', buscar = fetch }) {
  assert.match(siteKey,/^[a-zA-Z0-9_-]{0,100}$/,'Site key pública inválida');
  const leer = lectorPublico(origen, anon, buscar);
  const leerTablas = async () => {
    const tablas = {}; const cobertura = {};
    for (const [tabla, spec] of Object.entries(CONTRATO)) {
      const url = new URL(`/rest/v1/${tabla}`, origen);
      url.searchParams.set('select', spec.columnas.join(','));
      for (const [k,v] of Object.entries(spec.filtros)) url.searchParams.set(k,v);
      url.searchParams.set('order','id.asc'); url.searchParams.set('limit','100');
      let total;
      const filas = await paginarPublico(async ultimo => {
        if (ultimo !== undefined) url.searchParams.set('id', `gt.${ultimo}`);
        const r = await leer(url, true); assert.equal(r.status, 200, `Lectura pública rechazada: ${tabla}`);
        const n = Number(r.headers.get('content-range')?.split('/')[1]); assert.ok(Number.isSafeInteger(n));
        if (total === undefined) total = n;
        return r.json();
      }, // El total inicial se obtiene sin descargar columnas adicionales.
      await (async () => { const r = await leer(new URL(url), true); assert.equal(r.status,200); await r.arrayBuffer(); const n = Number(r.headers.get('content-range')?.split('/')[1]); assert.ok(Number.isSafeInteger(n)); return n; })());
      tablas[tabla] = filas.filter(f => tabla !== 'carreras' || esCarreraVisible(f)).map(f => normalizarFila(tabla,f));
      cobertura[tabla] = { filtradasEnFuente: filas.length, exportadas: tablas[tabla].length, columnas: spec.columnas };
    }
    return { tablas, cobertura };
  };
  const inicio = new Date().toISOString();
  const primera = await leerTablas(); const segunda = await leerTablas();
  assert.equal(huella(primera.tablas), huella(segunda.tablas), 'Fuente cambió: repetir export completo');
  const snapshot = validarSnapshot({ version: 1, tablas: primera.tablas });
  const sitemapRespuesta = await leer(`${BASE}/sitemap.xml`); assert.equal(sitemapRespuesta.status,200);
  const sitemap = await sitemapRespuesta.text(); const entradas = urlsSitemap(sitemap);
  assert.ok(entradas.length > 0);
  const probes = ['/index.html','/carreras','/novedades','/contactos','/carrera/no-existe','/no-existe'];
  const rutas = [...new Set([...entradas.map(e=>e.url), ...probes.map(p=>BASE+p)])];
  const paginas = await concurrente(rutas, async url => {
    const r = await leer(url); const html = await r.text();
    return { url, ...firmaHtml(html,url,r) };
  });
  const robotsR = await leer(`${BASE}/robots.txt`); assert.equal(robotsR.status,200);
  const robots = await robotsR.text();
  const referencias = new Set(entradas.flatMap(e=>e.imagenes));
  const versionados = new Set(execFileSync('git',['ls-files','-z','--','public'],{cwd:resolve(RAIZ,'..'),encoding:'utf8'}).split('\0'));
  function recorrer(v) {
    if (typeof v === 'string') {
      if (/^(?:\/imagenes\/|https:\/\/[^\s]+\/storage\/v1\/object\/public\/)/.test(v)) referencias.add(v);
      for (const [,u] of v.matchAll(/(?:src|poster)=["']([^"']+)["']/g)) referencias.add(decodificar(u));
    } else if (v && typeof v === 'object') for (const x of Object.values(v)) recorrer(x);
  }
  recorrer(snapshot.tablas);
  for (const p of paginas) for (const src of p.imagenes) {
    const u = new URL(src,BASE);
    referencias.add(u.pathname === '/_next/image' ? u.searchParams.get('url') : src);
  }
  asegurarDirectorio();
  const lote = `${new Date().toISOString().replace(/:/g,'-')}-${randomUUID()}`;
  const dir = resolve(DIRECTORIO,lote); mkdirSync(dir,{mode:0o700});
  const media = await concurrente([...referencias].filter(Boolean).sort(), async referencia => {
    const u = new URL(referencia,BASE);
    if (!(u.origin === BASE || (u.origin === new URL(origen).origin && u.pathname.startsWith('/storage/v1/object/public/')))) return { referencia, estado: 'origen-no-autorizado' };
    const r = await leer(u); const bytes = Buffer.from(await r.arrayBuffer());
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const local = u.origin === BASE ? resolve(RAIZ,'../public', '.'+decodeURIComponent(u.pathname)) : null;
    const versionadoDisponible = local && local.startsWith(resolve(RAIZ,'../public')+'/') && existsSync(local);
    // Sólo los objetos públicos externos al public/ versionado requieren copia.
    if (r.status === 200 && !versionadoDisponible) {
      const archivo = resolve(dir,`media-${sha256}.bin`);
      if (!existsSync(archivo)) writeFileSync(archivo,bytes,{mode:0o600,flag:'wx'});
    }
    return { referencia, status:r.status, bytes:bytes.length, sha256,
      versionadoDisponible: Boolean(versionadoDisponible),
      seguidoPorGit:versionados.has('public'+decodeURIComponent(u.pathname)),
      sha256Local: versionadoDisponible ? createHash('sha256').update(readFileSync(local)).digest('hex') : null };
  });
  const seo = { sitemap, robots, paginas, media };
  const manifest = { alcance: 'contenido-publico-sin-historial', inicio, fin:new Date().toISOString(),
    snapshotSha256:huella(snapshot), seoSha256:huella(seo), configPublica:{turnstileSiteKey:siteKey}, tablas:resumenTablas(snapshot.tablas), cobertura:primera.cobertura };
  escribirPrivado(resolve(dir,'snapshot.json'),snapshot);
  escribirPrivado(resolve(dir,'fuente-seo.json'),seo);
  escribirPrivado(resolve(dir,'manifest.json'),manifest);
  // Puntero sólo dentro del directorio privado conocido; nunca ruta arbitraria.
  const puntero = resolve(DIRECTORIO,'ultimo.json');
  if (existsSync(puntero)) assert.equal((await import('node:fs')).lstatSync(puntero).isSymbolicLink(),false);
  writeFileSync(puntero,JSON.stringify({lote}),{mode:0o600});
  return { lote, tablas:manifest.tablas, urls:entradas.length, media:media.length,
    mediaNo200:media.filter(m=>m.status!==200).length };
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    assert.equal(process.argv.length,2,'No se admiten flags ni destinos remotos');
    const env = parseEnv(readFileSync(resolve(RAIZ,'../.env.local'),'utf8'));
    const r = await exportar({origen:env.NEXT_PUBLIC_SUPABASE_URL,anon:env.NEXT_PUBLIC_SUPABASE_ANON_KEY,siteKey:env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''});
    console.log(JSON.stringify(r));
  } catch (e) { console.error(`Export público no completado (${e.code ?? e.name}). Revisar fuente/contrato sin imprimir credenciales ni filas.`); process.exitCode=1; }
}
