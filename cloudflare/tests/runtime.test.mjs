import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createTestHarness } from 'wrangler';
import { setTimeout } from 'node:timers/promises';
import { insertarCatalogo } from './fixtures/catalogo-home.mjs';

const configPath = './dist/server/wrangler.json';
const CENTINELA = 'cau-centinela-ficticia-no-publicar';

test('build sin variables del padre ni secretos en los artefactos', () => {
  assert.equal(process.env.PUBLIC_CF_CENTINELA, undefined);
  assert.equal(process.env.CLOUDFLARE_API_TOKEN, undefined);
  assert.equal(process.env.SECRETO_AJENO_DE_PRUEBA, undefined);
  function revisar(directorio) {
    for (const entry of readdirSync(directorio, { withFileTypes: true })) {
      const path = new URL(entry.name, directorio);
      if (entry.isDirectory()) revisar(new URL(`${entry.name}/`, directorio));
      else assert.ok(!readFileSync(path).includes(Buffer.from(CENTINELA)), entry.name);
    }
  }
  revisar(new URL('../dist/', import.meta.url));

  // Analítica: no se cuela ningún proveedor externo, y el
  // guard de GA de los componentes compartidos no queda como referencia rota.
  const prohibidos = ['googletagmanager.com', 'google-analytics.com', 'NEXT_PUBLIC_GA_ID'];
  function revisarCliente(directorio) {
    for (const entry of readdirSync(directorio, { withFileTypes: true })) {
      const path = new URL(entry.name, directorio);
      if (entry.isDirectory()) revisarCliente(new URL(`${entry.name}/`, directorio));
      else if (/\.(?:js|mjs)$/.test(entry.name)) {
        const texto = readFileSync(path, 'utf8');
        for (const prohibido of prohibidos) {
          assert.equal(texto.includes(prohibido), false, `${entry.name}: ${prohibido}`);
        }
      }
    }
  }
  revisarCliente(new URL('../dist/client/', import.meta.url));
});

test('Astro compilado responde en workerd con guardas locales y catálogo de D1', async t => {
  const server = createTestHarness({ workers: [{ configPath }] });
  t.after(() => server.close());
  await server.listen();

  const runtime = await server.getWorker().getEnv();
  assert.equal(runtime.APP_STAGE, 'local');
  assert.equal(runtime.SECRETO_AJENO_DE_PRUEBA, undefined);
  assert.equal(runtime.CLOUDFLARE_API_TOKEN, undefined);
  assert.equal(runtime.PUBLIC_CF_CENTINELA, undefined);

  // La home lee el catálogo de D1: sin migraciones la consulta falla, así que
  // se siembra el fixture sintético antes de pedirla.
  const worker = server.getWorker();
  await worker.applyD1Migrations('DB');
  await insertarCatalogo(runtime.DB);

  for (const [path, status, robots] of [
    ['/', 200, null], ['/api/estado', 200, 'noindex'], ['/no-existe', 404, 'noindex, nofollow'],
    ['/.env.local', 404, 'noindex, nofollow'], ['/wrangler.json', 404, 'noindex, nofollow'],
  ]) {
    const respuesta = await server.fetch(path);
    assert.equal(respuesta.status, status, path);
    // Igual que Next: la home pública no lleva X-Robots-Tag; la API y el 404 sí.
    assert.equal(respuesta.headers.get('x-robots-tag'), robots, path);
    assert.equal(respuesta.headers.get('cache-control'), 'no-store', path);
    assert.equal(respuesta.headers.get('x-content-type-options'), 'nosniff', path);
    assert.equal(respuesta.headers.get('strict-transport-security'),
      'max-age=63072000; includeSubDomains; preload', path);
    assert.equal(respuesta.headers.get('permissions-policy'),
      'camera=(), microphone=(), geolocation=(), payment=(), usb=()', path);
    assert.equal(respuesta.headers.get('referrer-policy'), 'strict-origin-when-cross-origin', path);
    assert.match(respuesta.headers.get('content-security-policy'), /frame-ancestors 'none'/);
    if (path === '/api/estado') assert.deepEqual(await respuesta.json(), { ok: true });
    else {
      const html = await respuesta.text();
      assert.match(html, /<html lang="es(-AR)?">/);
      assert.doesNotMatch(html, /centinela/i);
      assert.doesNotMatch(html, /googletagmanager\.com|google-analytics\.com/i);
      if (path === '/') assert.match(html, /Licenciatura en Administración/);
      else assert.match(html, /<main><\/main>/);
    }
  }
});

test('la variable se lee en runtime sin reconstruir; configuración inesperada falla cerrada', async t => {
  const server = createTestHarness({
    workers: [{ configPath, vars: { APP_STAGE: 'no-habilitado' } }],
  });
  t.after(() => server.close());
  await server.listen();
  const respuesta = await server.fetch('/api/estado');
  assert.equal(respuesta.status, 503);
  assert.deepEqual(await respuesta.json(), { ok: false });
  assert.equal(respuesta.headers.get('cache-control'), 'no-store');
});

test('handlers compilados consumen Queues y cron sobre D1 local sin transportes externos', async t => {
  const server = createTestHarness({ workers: [{ configPath }] });
  t.after(() => server.close());
  await server.listen();
  const worker = server.getWorker();
  await worker.applyD1Migrations('DB');
  const { DB, EFECTOS } = await worker.getEnv();
  assert.ok(EFECTOS);
  await DB.prepare("INSERT INTO consultas(id,email) VALUES (1,'fixture@example.invalid')").run();
  await DB.prepare(`INSERT INTO outbox(id,tipo,clave,consulta_id) VALUES
    (1,'newsletter-alta','cola',1),(2,'aviso-lead','sin-transporte',1)`).run();
  await EFECTOS.send({ tipo: 'efecto', id: 1 });
  const plazo = Date.now() + 15000;
  let fila;
  do {
    fila = await DB.prepare('SELECT estado FROM outbox WHERE id=1').first();
    if (fila.estado === 'enviado') break;
    await setTimeout(30);
  } while (Date.now() < plazo);
  assert.equal(fila.estado, 'enviado', 'el productor local debe invocar el queue real compilado');
  await EFECTOS.send({ tipo: 'efecto', id: 1 });
  await DB.prepare("INSERT INTO outbox(id,tipo,clave,consulta_id) VALUES (3,'newsletter-alta','cron',1)").run();
  const resultado = await worker.scheduled({ cron: '*/5 * * * *', scheduledTime: new Date() });
  assert.equal(resultado.outcome, 'ok');
  assert.equal((await DB.prepare('SELECT estado FROM outbox WHERE id=3').first()).estado, 'enviado');
  assert.equal((await DB.prepare('SELECT estado,intentos FROM outbox WHERE id=2').first()).estado, 'pendiente');
  assert.equal((await DB.prepare('SELECT count(*) AS n FROM suscripciones_newsletter').first()).n, 1);
  // Sin secreto/captcha local explícito la ruta pública no puede escribir.
  const respuesta = await server.fetch('/api/formularios', { method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'faq', token: 'fixture', payload: {} }) });
  assert.equal(respuesta.status, 503);
});

test('formulario HTTP compilado publica a EFECTOS local sin captcha ni secretos reales', async t => {
  const server = createTestHarness({ workers: [{ configPath,
    vars: { FORMULARIOS_PRUEBA_LOCAL: '1' } }] });
  t.after(() => server.close());
  await server.listen();
  const worker = server.getWorker();
  await worker.applyD1Migrations('DB');
  const { DB } = await worker.getEnv();
  const respuesta = await server.fetch('/api/formularios', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'faq', token: 'rate-limit-only', payload: {
      titulo: 'Pregunta sintética', contacto: 'http@example.invalid', newsletter: true,
    } }),
  });
  assert.equal(respuesta.status, 201);
  assert.deepEqual(await respuesta.json(), { ok: true });
  const plazo = Date.now() + 15000;
  let fila;
  do {
    fila = await DB.prepare("SELECT estado FROM outbox WHERE tipo='newsletter-alta'").first();
    if (fila?.estado === 'enviado') break;
    await setTimeout(30);
  } while (Date.now() < plazo);
  assert.equal(fila?.estado, 'enviado', 'sin cron debe llegar por el productor de la API');
  assert.equal((await DB.prepare('SELECT email FROM suscripciones_newsletter').first()).email, 'http@example.invalid');
  assert.equal((await DB.prepare("SELECT estado FROM outbox WHERE tipo='aviso-lead'").first()).estado, 'pendiente');
});

test('APIs nuevas compiladas: métodos, autenticación y configuración ausente', async t => {
  const server = createTestHarness({ workers: [{ configPath }] });
  t.after(() => server.close());
  await server.listen();
  const worker = server.getWorker();
  await worker.applyD1Migrations('DB');

  // Sólo el método del contrato; el resto es 405 con `Allow`, no el 404 de Astro.
  for (const [ruta, metodo, allow] of [
    ['/api/newsletter', 'POST', 'GET'],
    ['/api/recordatorio-teclab', 'POST', 'GET'],
    ['/api/track-click', 'GET', 'POST'],
    ['/api/track-direct-open', 'GET', 'POST'],
    ['/api/revalidar', 'GET', 'POST'],
    ['/api/vigilancia', 'POST', 'GET'],
    ['/api/alertas-analytics', 'GET', 'POST'],
  ]) {
    const respuesta = await server.fetch(ruta, { method: metodo });
    assert.equal(respuesta.status, 405, ruta);
    assert.equal(respuesta.headers.get('allow'), allow, ruta);
    assert.equal(respuesta.headers.get('x-robots-tag'), 'noindex', ruta);
  }

  // Sin secreto no se atiende ningún cron ni trigger.
  for (const ruta of ['/api/newsletter', '/api/recordatorio-teclab', '/api/vigilancia']) {
    const respuesta = await server.fetch(ruta);
    assert.equal(respuesta.status, 503, ruta);
    assert.match((await respuesta.json()).error, /CRON_SECRET sin configurar/, ruta);
  }
  const revalidarSinSecreto = await server.fetch('/api/revalidar', { method: 'POST', body: '{}' });
  assert.equal(revalidarSinSecreto.status, 503);
  assert.match((await revalidarSinSecreto.json()).error, /REVALIDATE_SECRET sin configurar/);

  // Telemetría y alertas fallan cerrado sin base/configuración, sin romper al visitante.
  const track = await server.fetch('/api/track-click', {
    method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.50' },
    body: JSON.stringify({ carrera: 'Carrera sintética' }),
  });
  assert.equal(track.status, 200);
  assert.deepEqual(await track.json(), { ok: true });
  const { DB } = await worker.getEnv();
  assert.equal((await DB.prepare("SELECT clicks FROM career_clicks WHERE origen='modal'").first('clicks')), 1);

  // Un clic de móvil llega hasta el envío; sin transporte configurado es 502.
  // (Desde escritorio el handler contesta 200 sin avisar, a propósito.)
  const alerta = await server.fetch('/api/alertas-analytics', {
    method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.51' },
    body: JSON.stringify({ evento: 'whatsapp', datos: { origen: '/carreras/x', movil: 1 } }),
  });
  assert.equal(alerta.status, 502);
  assert.deepEqual(await alerta.json(), { ok: false });

  // No se llama `/api/vigilancia` con secreto: eso dispararía el barrido del
  // sitio publicado. La corrida exitosa se prueba sólo con transporte doble.
});

test('crons compilados: secreto correcto, SMTP/Telegram ausente y revalidación', async t => {
  const server = createTestHarness({ workers: [{ configPath, vars: {
    CRON_SECRET: 'cron-sintetico', REVALIDATE_SECRET: 'rev-sintetico',
  } }] });
  t.after(() => server.close());
  await server.listen();
  const worker = server.getWorker();
  await worker.applyD1Migrations('DB');

  for (const ruta of ['/api/newsletter', '/api/recordatorio-teclab', '/api/vigilancia']) {
    const respuesta = await server.fetch(ruta, { headers: { authorization: 'Bearer otro' } });
    assert.equal(respuesta.status, 401, ruta);
  }
  const revalidarOtro = await server.fetch('/api/revalidar', {
    method: 'POST', headers: { authorization: 'Bearer otro' }, body: '{}',
  });
  assert.equal(revalidarOtro.status, 401);

  const sinCorreo = await server.fetch('/api/newsletter', {
    headers: { authorization: 'Bearer cron-sintetico' },
  });
  assert.equal(sinCorreo.status, 503);
  assert.match((await sinCorreo.json()).error, /transporte de correo sin configurar/);

  // Sin Telegram el recordatorio responde igual que el handler vigente.
  const recordatorio = await server.fetch('/api/recordatorio-teclab', {
    headers: { authorization: 'Bearer cron-sintetico' },
  });
  assert.equal(recordatorio.status, 200);
  assert.deepEqual(await recordatorio.json(), { aviso: 'sin configurar' });

  const revalidar = await server.fetch('/api/revalidar', {
    method: 'POST', headers: { authorization: 'Bearer rev-sintetico' },
    body: JSON.stringify({ tabla: 'faq_preguntas', accion: 'UPDATE' }),
  });
  assert.equal(revalidar.status, 200);
  assert.deepEqual(await revalidar.json(), { ok: true, rutas: ['/faq'] });

  const tablaRara = await server.fetch('/api/revalidar', {
    method: 'POST', headers: { authorization: 'Bearer rev-sintetico' },
    body: JSON.stringify({ tabla: 'sin-mapa' }),
  });
  assert.equal(tablaRara.status, 400);
  assert.match((await tablaRara.json()).error, /tabla sin rutas asociadas/);
});

test('newsletter compilado con binding y base vacía no inventa envíos', async t => {
  // El binding viaja en la configuración, no en `vars`: se arma una copia al
  // lado de la compilada para no romper las rutas relativas del build.
  const conBinding = './dist/server/wrangler-newsletter.json';
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  writeFileSync(conBinding, JSON.stringify({ ...config, send_email: [{ name: 'EMAIL' }] }));
  t.after(() => rmSync(conBinding, { force: true }));

  const server = createTestHarness({ workers: [{ configPath: conBinding, vars: {
    CRON_SECRET: 'cron-sintetico',
  } }] });
  t.after(() => server.close());
  await server.listen();
  const worker = server.getWorker();
  await worker.applyD1Migrations('DB');
  const respuesta = await server.fetch('/api/newsletter', {
    headers: { authorization: 'Bearer cron-sintetico' },
  });
  assert.equal(respuesta.status, 200);
  assert.deepEqual(await respuesta.json(), { candidatas: 0, enviados: 0, salteados: 0, fallidos: 0 });
});
