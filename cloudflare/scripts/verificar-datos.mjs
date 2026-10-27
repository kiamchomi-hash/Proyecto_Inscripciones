// Fase exclusivamente local. No lee dotenv ni credenciales; el snapshot no es
// SQL y nunca se ejecuta como instrucciones. Cada ensayo recibe un D1 nuevo.
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { existsSync, chmodSync } from 'node:fs';
import { userInfo } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { createTestHarness } from 'wrangler';
import { BASE, RAIZ, ultimoSnapshot, huella, escribirPrivado } from './datos-publicos.mjs';
import { importarPublico, verificarPublico } from './importar-datos.mjs';
import { urlsSitemap, firmaHtml } from './exportar-datos.mjs';
import { robotsDeRuta } from '../src/entrega/cabeceras.ts';

export function aislarRed() {
  const original = globalThis.fetch;
  const bloqueados = [];
  globalThis.fetch = (input, init) => {
    const u = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (!['127.0.0.1','localhost','[::1]'].includes(u.hostname)) {
      bloqueados.push(u.hostname);
      return Promise.reject(new Error('Red externa bloqueada en ensayo público local'));
    }
    return original(input,init);
  };
  return { bloqueados, restaurar: () => { globalThis.fetch = original; } };
}
export function referenciasImagenes(imagenes) {
  return imagenes.map(src=>{
    let u = new URL(src,BASE);
    if(u.pathname === '/_next/image') u = new URL(u.searchParams.get('url'),BASE);
    u.searchParams.delete('dpl');
    return u.href;
  });
}
export async function crearDestino(siteKey = '') {
  assert.match(siteKey,/^[a-zA-Z0-9_-]{0,100}$/);
  const identidad = `cau-publico-${randomUUID()}`;
  const config = {
    name: identidad, main: resolve(RAIZ,'dist/server/entry.mjs'),
    compatibility_date:'2026-10-24',compatibility_flags:['nodejs_compat'],
    no_bundle:true,rules:[{type:'ESModule',globs:['**/*.js','**/*.mjs']}],
    vars:{APP_STAGE:'local',PUBLIC_TURNSTILE_SITE_KEY:siteKey}, dev:{ip:'127.0.0.1',port:0},
    assets:{binding:'ASSETS',directory:resolve(RAIZ,'dist/client')},
    d1_databases:[{binding:'DB',database_name:identidad,database_id:randomUUID(),migrations_dir:resolve(RAIZ,'migrations'),remote:false}],
  };
  assert.ok(!config.queues && !config.triggers && !config.services && !config.r2_buckets);
  const server = createTestHarness({workers:[{config}]});
  try {
    const {url} = await server.listen(); assert.equal(url.hostname,'127.0.0.1');
    const worker = server.getWorker(); await worker.applyD1Migrations('DB');
    return {server, db:(await worker.getEnv()).DB, identidad,url};
  } catch (e) { await server.close(); throw e; }
}
export async function verificarLote() {
  const lote = ultimoSnapshot();
  assert.equal(huella(lote.seo),lote.manifest.seoSha256,'Referencia SEO alterada');
  const red = aislarRed(); let destino;
  try {
    // Se prueba la guarda antes de crear el runtime o importar una sola fila.
    await assert.rejects(fetch('https://example.invalid/'));
    red.bloqueados.length = 0;
    destino = await crearDestino(lote.manifest.configPublica?.turnstileSiteKey ?? '');
    const inicio = new Date().toISOString();
    const permisoLocal = { escribir: true, destino: { etapa: 'local', remoto: false, nombre: destino.identidad } };
    await importarPublico(destino.db,lote.snapshot,permisoLocal);
    const integridad = await verificarPublico(destino.db,lote.snapshot);
    assert.deepEqual(await destino.db.prepare('SELECT id,cursor FROM outbox_barrido').all().then(r=>r.results),[{id:1,cursor:0}]);
    const repeticion = await importarPublico(destino.db,lote.snapshot,permisoLocal);
    assert.equal(repeticion.repeticion,Object.values(lote.snapshot.tablas).some(f=>f.length));
    const r = await destino.server.fetch('/sitemap.xml',{redirect:'manual'}); assert.equal(r.status,200);
    const sitemapLocal = await r.text();
    const fuente = urlsSitemap(lote.seo.sitemap), local = urlsSitemap(sitemapLocal);
    const mapa = entradas => new Map(entradas.map(e=>[e.url,e]));
    const a = mapa(fuente), b = mapa(local);
    const faltantes = [...a.keys()].filter(u=>!b.has(u));
    const extras = [...b.keys()].filter(u=>!a.has(u));
    const sitemapDiferencias = [...a.keys()].filter(u=>b.has(u) && !isDeepStrictEqual(a.get(u),b.get(u)));
    const paginas = [];
    for (const p of lote.seo.paginas) {
      const u = new URL(p.url); assert.equal(u.origin,BASE);
      const respuesta = await destino.server.fetch(u.pathname,{redirect:'manual'});
      const html = await respuesta.text();
      const firma = firmaHtml(html,p.url,respuesta);
      // El cuerpo vacío de un 308 no tiene semántica SEO. El 404 conserva su
      // estado/noindex aunque no replica la página de error de Next.
      const campos = p.status === 200 && firma.status === 200
        ? ['status','location','title','description','canonical','robots','jsonLd','textoSha256','enlaces'] : ['status','location'];
      const diferencias = campos.filter(c=>!isDeepStrictEqual(p[c],firma[c]));
      if(p.status === 200 && firma.status === 200
        && !isDeepStrictEqual(referenciasImagenes(p.imagenes),referenciasImagenes(firma.imagenes))) diferencias.push('imagenes');
      const xEsperado = robotsDeRuta(u.pathname,respuesta.status);
      // La política por ruta y la meta noindex se inspeccionan, sin desactivar
      // guardas locales para que la comparación parezca un pase productivo.
      assert.equal(firma.xRobots,xEsperado);
      const palabrasFuente = (p.texto ?? '').split(' '), palabrasLocal = firma.texto.split(' ');
      let primera = 0; while(primera < palabrasFuente.length && palabrasFuente[primera] === palabrasLocal[primera]) primera++;
      const tramo = diferencias.includes('textoSha256') ? {fuente:palabrasFuente.slice(Math.max(0,primera-3),primera+8).join(' '),local:palabrasLocal.slice(Math.max(0,primera-3),primera+8).join(' ')} : null;
      paginas.push({url:p.url,status:respuesta.status,diferencias,tramo,robotsFuente:p.robots,robotsLocal:firma.robots,
        xRobotsFuente:p.xRobots,xRobotsLocal:firma.xRobots,jsonLdEscapado:firma.jsonLdEscapado});
    }
    const robotsR = await destino.server.fetch('/robots.txt');
    const robotsIgual = (await robotsR.text()).replace(/\s+/g,' ').trim() === lote.seo.robots.replace(/\s+/g,' ').trim();
    const mediaLocal = [];
    for (const media of lote.seo.media) {
      const u = new URL(media.referencia,BASE);
      if (u.origin !== BASE || media.status !== 200) continue;
      // Dispatch interno HTTPS canónico: Workers Assets normaliza nombres con
      // comas mediante 307. No seguir ese Location con fetch de red; se valida
      // y se vuelve a despachar dentro del mismo harness (máximo tres saltos).
      let virtual = new URL(u.pathname+u.search,BASE), r;
      const saltos = [];
      for(let i=0;i<4;i++) {
        r = await destino.server.fetch(virtual.href,{redirect:'manual'});
        if(![301,302,307,308].includes(r.status)) break;
        const siguiente = new URL(r.headers.get('location'),virtual);
        assert.equal(siguiente.origin,BASE);
        assert.equal(decodeURIComponent(siguiente.pathname),decodeURIComponent(u.pathname));
        saltos.push(r.status);virtual=siguiente;
      }
      const bytes = Buffer.from(await r.arrayBuffer());
      mediaLocal.push({ruta:u.pathname,status:r.status,
        saltos,huellaIgual:createHash('sha256').update(bytes).digest('hex') === media.sha256});
    }
    const capturas = [];
    const cache = resolve(userInfo().homedir,'.cache/ms-playwright');
    assert.ok(existsSync(cache),'Falta Chromium local; no se descarga automáticamente');
    process.env.PLAYWRIGHT_BROWSERS_PATH = cache;
    const { chromium } = await import('playwright');
    const navegador = await chromium.launch({args:['--dns-prefetch-disable','--disable-background-networking']});
    try {
      for (const [perfil,viewport] of [['escritorio',{width:1440,height:900}],['movil',{width:390,height:844}]]) {
        const contexto = await navegador.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'});
        // Ningún script/captcha/media de terceros llega a salir del navegador.
        await contexto.route('**/*',route => new URL(route.request().url()).origin === destino.url.origin
          && ['GET','HEAD'].includes(route.request().method()) ? route.continue() : route.abort());
        const pagina = await contexto.newPage();
        for (const [nombre,ruta] of [['home','/'],['carrera','/carreras/licenciatura-en-administracion']]) {
          await pagina.goto(new URL(ruta,destino.url).href,{waitUntil:'load'});
          await pagina.evaluate(()=>document.fonts.ready);
          const archivo = `captura-${nombre}-${perfil}-${Date.now()}.png`;
          const path = resolve(lote.dir,archivo);
          await pagina.screenshot({path,fullPage:false});chmodSync(path,0o600);capturas.push(archivo);
        }
        await contexto.close();
      }
    } finally { await navegador.close(); }
    // Las capturas tampoco pueden dejar telemetría o trabajos privados: sus
    // POST se abortan antes de llegar a la aplicación, y se vuelve a cotejar.
    await verificarPublico(destino.db,lote.snapshot);
    const informe = {alcance:'contenido-publico-sin-historial',inicio,fin:new Date().toISOString(),capturas,
      destino:destino.identidad,efimero:true,cron:false,queues:false,credenciales:false,
      redExternaBloqueada:true,intentosExternos:red.bloqueados.length,integridad,
      sitemap:{fuente:fuente.length,local:local.length,faltantes,extras,diferencias:sitemapDiferencias},
      robotsIgual,paginas,media:lote.seo.media,mediaLocal,
      resumen:{paginas:paginas.length,conDiferencias:paginas.filter(p=>p.diferencias.length).length,
        no200:paginas.filter(p=>p.status!==200 && ![301,302,307,308,404].includes(p.status)).length}};
    assert.equal(red.bloqueados.length,0,'La aplicación intentó red externa');
    informe.paridadPublica = !faltantes.length && !extras.length && !sitemapDiferencias.length
      && robotsIgual && paginas.every(p=>!p.diferencias.length)
      && mediaLocal.every(m=>m.status===200 && m.huellaIgual);
    const nombre = `verificacion-${new Date().toISOString().replace(/:/g,'-')}.json`;
    escribirPrivado(resolve(lote.dir,nombre),informe);
    console.log(JSON.stringify({informe:`.local/datos-publicos/${lote.dir.split('/').at(-1)}/${nombre}`,tablas:integridad.tablas,
      privadasVacias:Object.keys(integridad.privadas).length,sitemap:informe.sitemap,resumen:informe.resumen,robotsIgual,
      mediaLocal:{verificadas:mediaLocal.length,fallos:mediaLocal.filter(m=>m.status!==200||!m.huellaIgual).length},paridadPublica:informe.paridadPublica}));
    return informe;
  } finally { try { await destino?.server.close(); } finally { red.restaurar(); } }
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try { assert.equal(process.argv.length,2); const r=await verificarLote(); if(!r.paridadPublica) process.exitCode=1; }
  catch(e) { console.error(`Ensayo público no completado (${e.code ?? e.name}); sin imprimir filas ni secretos.`); process.exitCode=1; }
}
