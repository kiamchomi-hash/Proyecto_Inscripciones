import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { createTestHarness } from 'wrangler';
import { insertarCatalogo } from './fixtures/catalogo-home.mjs';
import { jsonLd } from './helpers/html.mjs';

// Pruebas del paquete compilado en workerd con D1 efímero y el mismo fixture
// sintético de siempre. Nada sale de 127.0.0.1 y no se arranca ningún otro
// servidor: el contraste con el sitio anterior vive en
// `referencia-home.test.mjs`, contra referencias guardadas.

const CONFIG = './dist/server/wrangler.json';

test('baja compilada: GET/HEAD no escriben, POST confirma D1, inválidos y fallos sin fuga', async t => {
  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  const { DB } = await worker.getEnv();
  const id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  await DB.prepare('INSERT INTO suscripciones_newsletter(id,email) VALUES (?,?)').bind(id, 'baja@example.invalid').run();
  assert.equal((await astro.fetch(`/newsletter/baja?id=${id}`)).status, 200);
  assert.equal((await astro.fetch('/newsletter/baja?listo=1')).status, 200);
  for (const method of ['GET', 'HEAD', 'PUT', 'DELETE']) {
    const r = await astro.fetch(`/api/newsletter/baja?id=${id}`, { method });
    assert.equal(r.status, 405);
    assert.equal(r.headers.get('allow'), 'POST');
  }
  assert.equal(await DB.prepare('SELECT activo FROM suscripciones_newsletter').first('activo'), 1);
  const invalido = await astro.fetch('/api/newsletter/baja?id=no-valido', { method: 'POST' });
  assert.equal(invalido.status, 400);
  const r = await astro.fetch(`/api/newsletter/baja?id=${id}`, { method: 'POST', body: 'List-Unsubscribe=One-Click' });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(await DB.prepare('SELECT activo FROM suscripciones_newsletter').first('activo'), 0);
  await DB.prepare('DROP TABLE suscripciones_newsletter').run();
  const fallo = await astro.fetch(`/api/newsletter/baja?id=${id}`, { method: 'POST' });
  assert.equal(fallo.status, 500);
  assert.equal(fallo.headers.get('location'), null);
  assert.deepEqual(await fallo.json(), { error: 'No se pudo procesar la baja' });
});

test('baja compilada: en producción escribe en D1 y no queda en 503', async t => {
  // Regresión: el adaptador gateaba la base a `APP_STAGE=local`, así que el sitio
  // publicado respondía 503 a toda baja. Con las etiquetas de producción la base
  // se resuelve igual y la baja se aplica.
  const astro = createTestHarness({
    workers: [{
      configPath: CONFIG,
      vars: { APP_STAGE: 'produccion', DB_STAGE: 'produccion', DB_NAME: 'cau-produccion' },
    }],
  });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  const { DB } = await worker.getEnv();
  const id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  await DB.prepare('INSERT INTO suscripciones_newsletter(id,email) VALUES (?,?)').bind(id, 'baja-produccion@example.invalid').run();
  const r = await astro.fetch(`/api/newsletter/baja?id=${id}`, { method: 'POST', body: 'List-Unsubscribe=One-Click' });
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { ok: true });
  assert.equal(await DB.prepare('SELECT activo FROM suscripciones_newsletter').first('activo'), 0);
});

test('fichas compiladas: sin datos privados públicos, no-store y la ruta del enlace ya no existe', async t => {
  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  const { DB } = await worker.getEnv();
  await insertarCatalogo(DB);
  for (const ruta of ['/carreras/tecnicatura-en-programacion', '/carreras/tecnicatura-en-programacion/inscripcion']) {
    const r = await astro.fetch(ruta);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('cache-control'), 'no-store');
    const html = await r.text();
    assert.doesNotMatch(html, /ana\.sintetica@example\.invalid|Dato sintético|1111111111/);
    assert.doesNotMatch(html, /123\.456|Precio sintético/);
  }
  // La autoinscripción se dio de baja el 27/10/2026: no queda página de enlace.
  assert.equal((await astro.fetch('/inscripcion/EnlaceSinteticoLocal1234567890ABCD')).status, 404);
  // Igual que en Next: sin datos de contacto no se escribe, y sin captcha no hay servicio.
  const antes = await DB.prepare('SELECT count(*) AS n FROM consultas').first('n');
  const contacto = { casa: 'teclab', tipoFormulario: 'contacto', email: 'lead@example.invalid', telefono: '1111111111' };
  for (const token of [null, 'invalido']) {
    const r = await astro.fetch('/api/formularios', {method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({kind:'consulta', token, payload:contacto})});
    assert.equal(r.status, token ? 503 : 400, 'sin secreto/configuración no se registra la consulta');
  }
  assert.equal(await DB.prepare('SELECT count(*) AS n FROM consultas').first('n'), antes);
  await DB.prepare('UPDATE carreras SET descripcion=?1 WHERE id=11').bind('Texto </script><script>globalThis.noEjecutar=1</script>').run();
  const escapado = await (await astro.fetch('/carreras/licenciatura-en-administracion')).text();
  assert.ok(jsonLd(escapado).some(s => s.includes('\\u003c/script')));
  assert.doesNotMatch(escapado, /<script>globalThis\.noEjecutar/);
  for (const familia of ['silkscreen','dm-sans']) {
    const aviso = await astro.fetch(`/licencias/${familia}.txt`);
    assert.equal(aviso.status, 200);
    assert.match(await aviso.text(), /SIL OPEN FONT LICENSE Version 1\.1/);
  }
});

test('los assets versionados se sirven desde ../public sin copiarse al paquete', async t => {
  assert.ok(!existsSync(new URL('../public', import.meta.url)),
    'cloudflare/public no debe existir: los assets viven en la raíz.');
  assert.ok(existsSync(new URL('../../public/imagenes/og/default.jpg', import.meta.url)),
    'faltan los assets versionados de la raíz');

  const config = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8');
  assert.match(config, /publicDir:\s*publico/);
  assert.match(config, /new URL\('\.\.\/public', import\.meta\.url\)/);

  assert.ok(existsSync(new URL('../dist/client/favicon.ico', import.meta.url)));

  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();

  for (const [ruta, tipo] of [
    ['/favicon.ico', /^image\/(x-icon|vnd\.microsoft\.icon)$/],
    ['/icon.png', /^image\/png$/],
    ['/apple-touch-icon.png', /^image\/png$/],
    ['/imagenes/og/default.jpg', /^image\/jpeg$/],
    ['/imagenes/Modales/Licenciatura en Higiene, Seguridad y Medio ambiente del Trabajo/LIC. EN HIGIENE Y SEGURIDAD LANDING_HERO WEB.webp', /^image\/webp$/],
    ['/imagenes/teclab/logo-teclab.webp', /^image\/webp$/],
    ['/imagenes/imagenes_cau/siglo21-marca.svg', /^image\/svg\+xml$/],
    ['/fuentes/inter-latin.woff2', /^font\/woff2$/],
    ['/fuentes/unbounded-latin.woff2', /^font\/woff2$/],
  ]) {
    const respuesta = await astro.fetch(ruta);
    assert.equal(respuesta.status, 200, ruta);
    assert.match(respuesta.headers.get('content-type') ?? '', tipo, ruta);
  }
});

test('las fuentes de marca se sirven autoalojadas, sin pedir nada a Google', async t => {
  // Los dos archivos son los del subconjunto `latin` que descarga next/font en
  // el sitio vigente; la firma `wOF2` confirma que el binario no se corrompió.
  for (const archivo of ['inter-latin.woff2', 'unbounded-latin.woff2']) {
    const ruta = new URL(`../../public/fuentes/${archivo}`, import.meta.url);
    assert.ok(existsSync(ruta), `falta public/fuentes/${archivo}`);
    const bytes = readFileSync(ruta);
    assert.equal(bytes.subarray(0, 4).toString('ascii'), 'wOF2', archivo);
    assert.ok(bytes.length > 30_000, `${archivo} quedó truncado (${bytes.length} bytes)`);
  }
  for (const licencia of ['OFL-Inter.txt', 'OFL-Unbounded.txt']) {
    const texto = readFileSync(new URL(`../../public/fuentes/${licencia}`, import.meta.url), 'utf8');
    assert.match(texto, /SIL OPEN FONT LICENSE Version 1\.1/i, licencia);
  }

  const css = readFileSync(new URL('../../estilos/fuentes.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /fonts\.(googleapis|gstatic)\.com/, 'ningún origen externo de fuentes');
  // Las dos familias se llaman como en Next: el CSS compartido las pide por
  // nombre literal (`body { font-family: 'Inter' }`, navbar `'Unbounded'`).
  assert.match(css, /@font-face\s*{[^}]*font-family:\s*'Inter';[^}]*font-weight:\s*100 900/);
  assert.match(css, /@font-face\s*{[^}]*font-family:\s*'Inter';[^}]*font-display:\s*swap/);
  for (const peso of ['400', '600', '700', '800', '900']) {
    assert.match(css, new RegExp(`@font-face\\s*{[^}]*font-family:\\s*'Unbounded';[^}]*font-weight:\\s*${peso}`),
      `falta el peso ${peso} de Unbounded`);
  }
  assert.match(css, /--font-inter:\s*'Inter'/);
  assert.match(css, /--font-unbounded:\s*'Unbounded'/);
  // El subconjunto latin llega hasta U+00FF: acentos y ñ de la home incluidos.
  assert.match(css, /unicode-range:\s*U\+\?\?/);

  const astro = createTestHarness({ workers: [{ configPath: CONFIG }] });
  t.after(() => astro.close());
  await astro.listen();
  const worker = astro.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo((await worker.getEnv()).DB);

  const home = await astro.fetch('/');
  const html = await home.text();
  assert.equal(home.status, 200);
  // Precarga de las dos familias, del mismo origen y con CORS de fuente.
  for (const familia of ['inter-latin', 'unbounded-latin']) {
    assert.match(html, new RegExp(
      `<link rel="preload" href="/fuentes/${familia}\\.woff2" as="font" type="font/woff2" crossorigin`,
    ), `falta la precarga de ${familia}`);
  }
  assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/, 'la home no debe pedir fuentes externas');
  // La hoja compilada usa las URLs locales, no las de next/font.
  const hojas = readdirSync(new URL('../dist/client/_astro/', import.meta.url))
    .filter(nombre => nombre.endsWith('.css'));
  const compilado = hojas.map(nombre => readFileSync(
    new URL(`../dist/client/_astro/${nombre}`, import.meta.url), 'utf8',
  )).join('\n');
  assert.match(compilado, /url\(\/fuentes\/inter-latin\.woff2\)/);
  assert.match(compilado, /url\(\/fuentes\/unbounded-latin\.woff2\)/);
  assert.doesNotMatch(compilado, /_next\/static\/media/);
});