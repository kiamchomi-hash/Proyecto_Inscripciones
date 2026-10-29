import './helpers/alias.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { crearD1, insertarCarrera } from './helpers/d1.mjs';
import { listarNovedades, leerArticulo, numeroPagina, totalPaginas } from '../src/datos/novedades.ts';
import { sanitizeContent } from '../../lib/sanitize-content.ts';
import { NOVEDADES, insertarNovedades, XSS } from './fixtures/novedades.mjs';
import { createTestHarness } from 'wrangler';
import { metas } from './helpers/html.mjs';

test('novedades: paginado canónico, total 3+6 y fronteras, sin tocar D1 ante inválidos', async () => {
  for (const [cantidad, total] of [[0,1],[1,1],[3,1],[4,2],[9,2],[10,3],[15,3],[16,4]]) assert.equal(totalPaginas(cantidad), total);
  for (const valor of ['0','-1','01','1.0','1e0','1abc','abc','+1',' 1','NaN','Infinity']) {
    assert.equal(numeroPagina(valor), null);
    assert.equal(await listarNovedades({}, valor), null);
  }
  assert.equal(numeroPagina('1'), 1);
});

test('novedades D1: publicación, fecha DESC, destacada más nueva, límites y proyecciones', async t => {
  const { db } = await crearD1(t);
  assert.deepEqual(await listarNovedades(db, '1'), { currentPage:1, totalPages:1, pinnedItem:null, items:[] });
  assert.equal(await listarNovedades(db, '2'), null);
  await insertarNovedades(db);
  const primera = await listarNovedades(db, '1');
  assert.equal(primera.pinnedItem.id, 1);
  assert.equal(primera.pinnedItem.pinned, true);
  assert.equal(primera.totalPages, 3);
  assert.deepEqual(primera.items.map(f=>f.id), [3,4,5]);
  assert.deepEqual((await listarNovedades(db,'2')).items.map(f=>f.id), [6,7,8,9,10,11]);
  assert.deepEqual((await listarNovedades(db,'3')).items.map(f=>f.id), [12,14,15,16,17]);
  assert.equal((await listarNovedades(db,'2')).pinnedItem, null);
  assert.equal(await listarNovedades(db,'4'), null);
  assert.equal(await listarNovedades(db,'999999999999999999'), null);
  assert.deepEqual(Object.keys(primera.items[0]).sort(), ['id','titulo','extracto','fecha','tag','imagen_url','href','slug','pinned'].sort());
  await db.prepare('DELETE FROM novedades WHERE pinned = 1').run();
  assert.equal((await listarNovedades(db,'1')).pinnedItem, null);
  assert.equal((await listarNovedades(db,'1')).items.length, 3);
});

test('artículos D1: slug exacto parametrizado, borrador ausente y duplicado rechazado', async t => {
  const { db } = await crearD1(t);
  await insertarNovedades(db);
  const articulo = await leerArticulo(db,'novedad-sintetica-1');
  assert.equal(articulo.titulo, NOVEDADES[0].titulo);
  assert.deepEqual(Object.keys(articulo).sort(), ['id','titulo','contenido','extracto','fecha','tag','imagen_url','slug','updated_at'].sort());
  for (const slug of ['novedad-sintetica-13','inexistente','NOVEDAD-SINTETICA-1', "' OR 1=1 --",'']) assert.equal(await leerArticulo(db,slug), null);
  await insertarNovedades(db,[{...NOVEDADES[0],id:100}]);
  await assert.rejects(leerArticulo(db,'novedad-sintetica-1'), /ambiguo/);
  await db.prepare('DROP TABLE novedades').run();
  await assert.rejects(listarNovedades(db,'1'));
  await assert.rejects(leerArticulo(db,'uno'));
});

test('sanitizador vigente: XSS eliminado, enlaces/imagenes/clases permitidos, embeds no admitidos', () => {
  // En HTML un `>` dentro de un atributo entrecomillado no cierra el meta.
  // La comparación debe leer el valor real, no cortar antes y ocultar el dato.
  assert.equal(metas('<meta property="og:title" content="Prueba </script><script>NO_EJECUTAR</script>">')['og:title'],
    'Prueba </script><script>NO_EJECUTAR</script>');
  const limpio = sanitizeContent(XSS);
  assert.doesNotMatch(limpio, /<script|<iframe|<svg|onerror|onclick|onload|javascript:|data:|style=|intrusa|XSS_NOVEDAD/i);
  assert.match(limpio, /class="art-nota"/);
  for (const href of ['https://example.invalid','mailto:fixture@example.invalid','tel:123']) assert.ok(limpio.includes(`href="${href}"`));
  assert.match(limpio, /rel="noopener noreferrer"/);
  assert.match(limpio, /src="\/icon.png"/);
  assert.equal(sanitizeContent('<script>SOLO_SCRIPT</script>'), '');
  assert.match(sanitizeContent('<img src="https://example.invalid/foto.jpg" loading="lazy" width="200" alt="Foto"><a href="/contacto">Contacto</a>'), /src="https:/);
});

test('upgrade 0008 → 0009 conserva tablas, datos, secuencia e historial, reaplicable', async t => {
  const dir = mkdtempSync(join(tmpdir(),'cau-novedades-'));
  t.after(()=>rmSync(dir,{recursive:true,force:true}));
  for (let n=1;n<=8;n++) copyFileSync(new URL(`../migrations/000${n}.sql`,import.meta.url),join(dir,`000${n}.sql`));
  const { db, worker } = await crearD1(t,true,dir);
  await insertarCarrera(db);
  await db.prepare("INSERT INTO outbox(id,tipo,clave) VALUES (90,'aviso-lead','conservado')").run();
  await db.prepare("INSERT INTO outbox_reclamos VALUES (90,'reclamo-previo','2026-10-25T12:00:00Z')").run();
  await db.prepare('UPDATE outbox_barrido SET cursor=90 WHERE id=1').run();
  await db.prepare("INSERT INTO outbox(id,tipo,clave) VALUES (91,'aviso-lead','fixture-upgrade')").run();
  await db.prepare('DELETE FROM outbox WHERE id = 91').run();
  const antes = (await db.prepare("SELECT name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all()).results;
  copyFileSync(new URL('../migrations/0009.sql',import.meta.url),join(dir,'0009.sql'));
  await worker.applyD1Migrations('DB');
  await insertarNovedades(db);
  await worker.applyD1Migrations('DB');
  assert.equal(await db.prepare('SELECT count(*) AS n FROM d1_migrations').first('n'),9);
  assert.equal(await db.prepare('SELECT nombre FROM carreras WHERE id=1').first('nombre'),'Carrera sintética');
  const despues = (await db.prepare("SELECT name,sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name").all()).results;
  for (const tabla of antes) assert.deepEqual(despues.find(f=>f.name===tabla.name),tabla);
  assert.equal(await db.prepare("INSERT INTO outbox(tipo,clave) VALUES ('aviso-lead','despues') RETURNING id").first('id'),92);
  assert.equal(await db.prepare('SELECT count(*) AS n FROM novedades').first('n'),NOVEDADES.length);
  assert.equal(await db.prepare('SELECT token FROM outbox_reclamos WHERE efecto_id=90').first('token'),'reclamo-previo');
  assert.equal(await db.prepare('SELECT cursor FROM outbox_barrido WHERE id=1').first('cursor'),90);
  assert.deepEqual((await db.prepare('PRAGMA foreign_key_check').all()).results,[]);
  await assert.rejects(db.prepare("UPDATE novedades SET publicada=2 WHERE id=1").run(), /CHECK/);
});

test('SSR compilado: listado vacío, sin fijada, sólo fijada, fuera de rango y sin publicar borradores', async t => {
  const astro = createTestHarness({workers:[{configPath:'./dist/server/wrangler.json'}]});
  t.after(()=>astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  const { DB:db } = await worker.getEnv();
  const vacio = await astro.fetch('/novedades/1');
  assert.equal(vacio.status,200);
  // `/novedades` conserva el 308 de `next.config.ts`, con la query incluida.
  // `redirect: 'manual'` evita que el harness siga el salto y oculte el código.
  for (const ruta of ['/novedades','/novedades/']) {
    const salto = await astro.fetch(ruta, { redirect: 'manual' });
    assert.equal(salto.status,308);
    assert.equal(salto.headers.get('location'),'/novedades/1');
  }
  assert.equal((await astro.fetch('/novedades?pagina=2', { redirect: 'manual' })).headers.get('location'),'/novedades/1?pagina=2');
  assert.equal(vacio.headers.get('cache-control'),'no-store');
  // El listado es público: como en Next, no lleva X-Robots-Tag. El noindex
  // queda para APIs, rutas privadas y el 404 (ver tests/entrega.test.mjs).
  assert.equal(vacio.headers.get('x-robots-tag'), null);
  assert.match(await vacio.text(), /<h1 class="sr-only">Novedades<\/h1>/);
  assert.equal((await astro.fetch('/novedades/2')).status,404);
  await insertarNovedades(db,[NOVEDADES[0]]);
  assert.match(await (await astro.fetch('/novedades/1')).text(), /Novedad destacada sintética/);
  await db.prepare('DELETE FROM novedades WHERE id=1').run();
  await insertarNovedades(db,[NOVEDADES[2],NOVEDADES.find(f=>!f.publicada)]);
  const sinFijada = await (await astro.fetch('/novedades/1')).text();
  assert.match(sinFijada,/Novedad sintética 3/);
  assert.doesNotMatch(sinFijada,/Destacado|BORRADOR_NO_PUBLICO/);
  assert.equal((await astro.fetch('/novedades/articulo/novedad-sintetica-13')).status,404);
  await db.prepare('DROP TABLE novedades').run();
  for (const ruta of ['/novedades/1','/novedades/articulo/uno']) assert.equal((await astro.fetch(ruta)).status,500);
});
