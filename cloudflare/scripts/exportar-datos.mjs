// Exporta únicamente datos públicos de D1 y páginas públicas del sitio.
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { CONTRATO, BASE, RAIZ, DIRECTORIO, validarSnapshot, resumenTablas, huella, asegurarDirectorio, escribirPrivado } from './datos-publicos.mjs';
import { extraerDatosPublicos, lectorD1Produccion } from './copia-datos-publicos.mjs';
import { canonical, titulo, metas, jsonLd, enlaces, normalizarTexto, decodificar } from '../tests/helpers/html.mjs';

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
export function lectorPublico(buscar = fetch) {
  return async url => {
    const u = new URL(url);
    assert.ok(!u.username && !u.password && u.protocol === 'https:');
    assert.equal(u.origin, BASE, 'Origen remoto no autorizado');
    assert.ok(!/^\/(?:api|inscripcion|admin)(?:\/|$)/i.test(decodeURIComponent(u.pathname)), 'No leer handlers ni enlaces privados');
    return buscar(u, { method: 'GET', redirect: 'manual', signal: AbortSignal.timeout(30000) });
  };
}
export async function exportar({ db = lectorD1Produccion(), siteKey = '', buscar = fetch } = {}) {
  assert.match(siteKey,/^[a-zA-Z0-9_-]{0,100}$/,'Site key pública inválida');
  const leer = lectorPublico(buscar);
  const inicio = new Date().toISOString();
  const primera = await extraerDatosPublicos(db);
  const segunda = await extraerDatosPublicos(db);
  assert.equal(huella(primera), huella(segunda), 'Fuente cambió: repetir export completo');
  const snapshot = validarSnapshot(primera);
  const cobertura = Object.fromEntries(Object.entries(CONTRATO).map(([tabla, spec]) =>
    [tabla, { exportadas: snapshot.tablas[tabla].length, columnas: spec.columnas }]));
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
    if (u.origin !== BASE) return { referencia, estado: 'origen-no-autorizado' };
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
    snapshotSha256:huella(snapshot), seoSha256:huella(seo), configPublica:{turnstileSiteKey:siteKey}, tablas:resumenTablas(snapshot.tablas), cobertura };
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
    const config = JSON.parse(readFileSync(resolve(RAIZ, 'produccion/wrangler.json'), 'utf8'));
    const r = await exportar({ siteKey: config.vars.PUBLIC_TURNSTILE_SITE_KEY });
    console.log(JSON.stringify(r));
  } catch (e) { console.error(`Export público no completado (${e.code ?? e.name}). Revisar fuente/contrato sin imprimir credenciales ni filas.`); process.exitCode=1; }
}
