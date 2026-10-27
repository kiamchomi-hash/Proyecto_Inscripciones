// Ensayo de la ruta de correo controlado, exclusiva de staging.
// No hay red externa: el transporte es un doble y el egreso real se prueba sólo
// por su guarda de alcance. Ningún test manda un correo.
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createTestHarness } from 'wrangler';
import {
  URL_SMTP2GO, CLAVE_CUPO, MAXIMO_ENVIOS, normalizarDestinatario, validarPedidoControl,
  enviarCorreoControl, crearBusquedaCorreo, leerCuerpo,
} from '../staging/correo-controlado.ts';
import { ultimoSnapshot } from '../scripts/datos-publicos.mjs';
import { importarPublico, verificarPublico } from '../scripts/importar-datos.mjs';
import { validarPublicacionStaging } from '../scripts/staging-remoto.mjs';
import { aislarRed } from '../scripts/verificar-datos.mjs';

const AUTORIZADO = 'control@example.test';

test('fetch nativo en workerd: redirects y entry real con proveedor interceptado', async t => {
  const original = globalThis.fetch;
  const llamadas = [];
  // El harness entrega su egreso a Node. Interceptar ANTES de levantarlo:
  // ningún POST de correo puede llegar al proveedor real, ni siquiera si falla el test.
  globalThis.fetch = async (url, init) => {
    const destino = new URL(typeof url === 'string' ? url : url.url);
    if (destino.origin === 'https://api.smtp2go.com' && destino.pathname === '/v3/email/send') {
      llamadas.push({ metodo: init?.method });
      return Response.json({ data: { succeeded: 1, failed: 0, email_id: 'simulado-local' } });
    }
    if (destino.hostname !== '127.0.0.1' && destino.hostname !== 'localhost') throw Error('Red externa no autorizada');
    return original(url, init);
  };
  const abiertos = [];
  t.after(async () => {
    try { for (const s of abiertos) await s.close(); } finally { globalThis.fetch = original; }
  });
  const config = main => ({ name: 'cau-staging-receptor', main: resolve(main),
    compatibility_date: '2026-10-25', compatibility_flags: ['nodejs_compat'],
    dev: { ip: '127.0.0.1', port: 0 } });
  const sonda = createTestHarness({ workers: [{ config: config('tests/fixtures/worker-fetch-receptor.ts') }] });
  abiertos.push(sonda); await sonda.listen();
  const suelto = await (await sonda.fetch('/desvinculado')).json();
  assert.equal(suelto.nombre, 'TypeError');
  assert.match(suelto.mensaje, /Invalid redirect value/);
  assert.equal(llamadas.length, 0, 'redirect error falla antes del egreso interceptado');
  console.log('Sonda local sin secretos:', JSON.stringify(suelto));
  assert.deepEqual(await (await sonda.fetch('/manual')).json(), { status: 200 });
  assert.equal(llamadas.length, 1);

  const authorization = 'Basic ' + Buffer.from('staging:credencial-sintetica').toString('base64');
  const c = config('staging/publicar-worker.ts');
  c.vars = { APP_STAGE: 'staging', DB_STAGE: 'staging', DB_NAME: c.name,
    STAGING_ACCESS: 'basic-sha256', OUTBOUND_MODE: 'disabled',
    STAGING_AUTH_SHA256: createHash('sha256').update(authorization).digest('hex'),
    STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: AUTORIZADO, SMTP2GO_API_KEY: 'sintetica' };
  c.d1_databases = [{ binding: 'DB', database_name: c.name,
    database_id: '44444444-4444-4444-8444-444444444444', remote: false, migrations_dir: resolve('migrations') }];
  const entry = createTestHarness({ workers: [{ config: c }] });
  abiertos.push(entry); await entry.listen(); await entry.getWorker().applyD1Migrations('DB');
  const pedir = () => entry.fetch('/api/staging-correo', { method: 'POST',
    headers: { Authorization: authorization, 'Content-Type': 'application/json' }, body: JSON.stringify({ para: AUTORIZADO }) });
  const respuesta = await pedir(); const cuerpo = await respuesta.json();
  assert.equal(respuesta.status, 200, JSON.stringify(cuerpo));
  assert.equal(cuerpo.estado, 'accepted');
  assert.equal(llamadas.length, 2, 'sólo un despacho del entry al doble local');
  assert.equal((await pedir()).status, 429);
  assert.equal(llamadas.length, 2, 'cupo impide repetir');
  const { DB } = await entry.getWorker().getEnv();
  assert.equal((await DB.prepare('SELECT request_count FROM form_rate_limits').first()).request_count, 1);
});

test('destinatario: normaliza, exige una sola dirección y rechaza cabeceras', () => {
  assert.equal(normalizarDestinatario('  Control@Example.TEST '), AUTORIZADO);
  for (const invalido of ['', '   ', 'a@b', 'sin-arroba.test', 'dos@example.test,otro@example.test',
    'Nombre <control@example.test>', 'control@example.test;otro@example.test', ['a@example.test'],
    'control@@example.test', 'control@example.test\nBcc: x@y.test', null, undefined, 42]) {
    assert.equal(normalizarDestinatario(invalido), null, String(invalido));
  }
});

test('allowlist: sólo el destinatario autorizado y un único campo admitido', () => {
  assert.deepEqual(validarPedidoControl({ para: AUTORIZADO }, AUTORIZADO), { ok: true, para: AUTORIZADO });
  assert.deepEqual(validarPedidoControl({ para: '  CONTROL@example.test ' }, AUTORIZADO), { ok: true, para: AUTORIZADO });
  assert.deepEqual(validarPedidoControl({ para: 'otro@example.test' }, AUTORIZADO),
    { ok: false, status: 403, codigo: 'destinatario-no-autorizado' });
  for (const campo of ['cc', 'bcc', 'cco', 'lote', 'batch', 'lista', 'to', 'destinatarios', 'ensayo', 'run_id']) {
    const r = validarPedidoControl({ para: AUTORIZADO, [campo]: 'otro@example.test' }, AUTORIZADO);
    assert.equal(r.ok, false);
    assert.equal(r.status, 400);
    assert.match(r.codigo, /^campo-no-admitido:/);
  }
  assert.deepEqual(validarPedidoControl({ para: [AUTORIZADO, 'otro@example.test'] }, AUTORIZADO),
    { ok: false, status: 400, codigo: 'destinatario-invalido' });
  for (const cuerpo of [[], 'texto', null, 7, {}]) {
    assert.equal(validarPedidoControl(cuerpo, AUTORIZADO).ok, false);
  }
  assert.deepEqual(validarPedidoControl({ para: AUTORIZADO }, null),
    { ok: false, status: 503, codigo: 'allowlist-sin-configurar' });
});

test('egreso: sólo el endpoint exacto de SMTP2GO por POST y sin redirecciones', async () => {
  const llamadas = [];
  const buscar = crearBusquedaCorreo((url, init) => {
    llamadas.push({ url, init });
    return Promise.resolve(new Response('{}', { status: 200 }));
  });
  await buscar(URL_SMTP2GO, { method: 'POST' });
  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].init.redirect, 'manual');
  for (const [url, method] of [[URL_SMTP2GO, 'GET'], ['https://api.smtp2go.com/v3/email/otro', 'POST'],
    ['https://example.test/v3/email/send', 'POST'], ['http://api.smtp2go.com/v3/email/send', 'POST']]) {
    await assert.rejects(() => buscar(url, { method }), /fuera de alcance/, `${method} ${url}`);
  }
  assert.equal(llamadas.length, 1, 'ninguna llamada extra llegó a la red real');
  for (const status of [300, 301, 302, 303, 304, 307, 308, 399]) {
    const destinos = [];
    const redirigido = crearBusquedaCorreo(async (url, init) => {
      destinos.push(url);
      assert.equal(init.redirect, 'manual');
      return new Response(null, { status, headers: { Location: 'https://no-autorizado.invalid/' } });
    });
    await assert.rejects(() => redirigido(URL_SMTP2GO, { method: 'POST', redirect: 'follow' }), /Redireccion/);
    assert.deepEqual(destinos, [URL_SMTP2GO], 'no consultar Location ni repetir el POST');
  }
});

test('cuerpo: tamaño acotado y JSON obligatorio', async () => {
  const leer = cuerpo => leerCuerpo(new Request('https://ensayo.invalid/api/staging-correo', {
    method: 'POST', body: cuerpo,
  }));
  assert.deepEqual(await leer(JSON.stringify({ para: AUTORIZADO })), { para: AUTORIZADO });
  await assert.rejects(() => leer(''), /cuerpo-vacio/);
  await assert.rejects(() => leer('no-json'), SyntaxError);
  await assert.rejects(() => leer(JSON.stringify({ para: 'x'.repeat(4000) })), /demasiado-grande/);
});

test('la ruta no existe en el código compartido ni en la aplicación', () => {
  const prohibidos = [];
  const revisar = directorio => {
    for (const nombre of readdirSync(directorio)) {
      const ruta = join(directorio, nombre);
      if (statSync(ruta).isDirectory()) revisar(ruta);
      else if (/\.(?:ts|tsx|astro|mjs)$/.test(nombre)
        && /staging\/(?:acceso|correo-controlado|publicar-worker)/.test(readFileSync(ruta, 'utf8'))) {
        prohibidos.push(ruta);
      }
    }
  };
  revisar(resolve('src'));
  assert.deepEqual(prohibidos, [], 'sólo staging puede importar la ruta de correo');
});

/** Base efímera con las migraciones aplicadas; nunca la de desarrollo. */
async function base() {
  const id = `11111111-1111-4111-8111-${randomBytes(6).toString('hex')}`.slice(0, 36);
  const harness = createTestHarness({ workers: [{ config: {
    name: 'cau-staging-correo-' + randomBytes(4).toString('hex'),
    main: resolve('tests/fixtures/worker-d1.mjs'),
    compatibility_date: '2026-10-25', dev: { ip: '127.0.0.1', port: 0 },
    d1_databases: [{ binding: 'DB', database_name: 'cau-staging-correo', database_id: id,
      migrations_dir: resolve('migrations'), remote: false }],
  } }] });
  await harness.listen();
  await harness.getWorker().applyD1Migrations('DB');
  const { DB } = await harness.getWorker().getEnv();
  return { harness, DB };
}

const entorno = (DB, extra = {}) => ({ DB, SMTP2GO_API_KEY: 'clave-de-prueba', ...extra });

const proveedor = (registro, respuesta) => async (url, init) => {
  registro.push({ url, cuerpo: JSON.parse(init.body) });
  return typeof respuesta === 'function' ? respuesta() : respuesta;
};

test('guardas de configuración: deshabilitada, sin clave y sin transporte', async t => {
  const { harness, DB } = await base();
  t.after(() => harness.close());
  const llamadas = [];
  const buscar = proveedor(llamadas, () => new Response('{}', { status: 200 }));
  const casos = [
    [{ STAGING_CORREO_HABILITADO: undefined }, 'ruta-deshabilitada'],
    [{ STAGING_CORREO_HABILITADO: 'no' }, 'ruta-deshabilitada'],
    [{ STAGING_CORREO_HABILITADO: 'si', SMTP2GO_API_KEY: undefined }, 'smtp-sin-configurar'],
    [{ STAGING_CORREO_HABILITADO: 'si', SMTP2GO_API_KEY: '' }, 'smtp-sin-configurar'],
    [{ STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: undefined }, 'allowlist-sin-configurar'],
    [{ STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: AUTORIZADO, DB: null }, 'sin-base'],
  ];
  for (const [cambio, error] of casos) {
    const r = await enviarCorreoControl(entorno(DB, { STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: AUTORIZADO, ...cambio }), { para: AUTORIZADO }, buscar);
    assert.equal(r.status, 503, error);
    assert.equal((await r.json()).error, error);
  }
  const sinTransporte = await enviarCorreoControl(entorno(DB, {
    STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: AUTORIZADO }), { para: AUTORIZADO });
  assert.equal(sinTransporte.status, 503);
  assert.equal((await sinTransporte.json()).error, 'transporte-no-cableado');
  assert.equal(llamadas.length, 0);
  const filas = await DB.prepare('SELECT count(*) AS n FROM form_rate_limits').first();
  assert.equal(filas.n, 0, 'ninguna guarda consume cupo');
});

test('rechazos de destinatario: otro correo, cc y lote no despachan ni gastan cupo', async t => {
  const { harness, DB } = await base();
  t.after(() => harness.close());
  const llamadas = [];
  const buscar = proveedor(llamadas, () => new Response('{}', { status: 200 }));
  const base_ = { STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: AUTORIZADO };
  const casos = [
    [{ para: 'otro@example.test' }, 403, 'destinatario-no-autorizado'],
    [{ para: AUTORIZADO, cc: 'otro@example.test' }, 400, 'campo-no-admitido:cc'],
    [{ para: AUTORIZADO, bcc: 'otro@example.test' }, 400, 'campo-no-admitido:bcc'],
    [{ para: AUTORIZADO, lote: ['otro@example.test'] }, 400, 'campo-no-admitido:lote'],
    [{ para: [AUTORIZADO, 'otro@example.test'] }, 400, 'destinatario-invalido'],
  ];
  for (const [cuerpo, status, error] of casos) {
    const r = await enviarCorreoControl(entorno(DB, base_), cuerpo, buscar);
    assert.equal(r.status, status, error);
    assert.equal((await r.json()).error, error);
  }
  assert.equal(llamadas.length, 0);
  assert.equal((await DB.prepare('SELECT count(*) AS n FROM form_rate_limits').first()).n, 0);
});

test('nuevo ensayo autorizado conserva reserva histórica y no se renueva al recrear entorno', async t => {
  const { harness, DB } = await base();
  t.after(() => harness.close());
  const historica = 'staging-correo-control:' + createHash('sha256').update(AUTORIZADO).digest('hex');
  await DB.prepare("INSERT INTO form_rate_limits(key,window_started_at,request_count) VALUES (?,strftime('%Y-%m-%dT%H:%M:%fZ','now'),1)").bind(historica).run();
  const antes = await DB.prepare('SELECT * FROM form_rate_limits WHERE key=?').bind(historica).first();
  const llamadas = [];
  const buscar = proveedor(llamadas, () => Response.json({ data: { succeeded: 1, failed: 0 } }));
  const crearEnv = () => entorno(DB, { STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: AUTORIZADO });
  assert.equal((await enviarCorreoControl(crearEnv(), { para: AUTORIZADO }, buscar)).status, 200);
  assert.equal(CLAVE_CUPO, 'staging-correo-control:autorizado-20261026-02', 'ID fijo del servidor, nunca del pedido o del deploy');
  assert.equal((await enviarCorreoControl(crearEnv(), { para: AUTORIZADO }, buscar)).status, 429);
  assert.deepEqual(await DB.prepare('SELECT * FROM form_rate_limits WHERE key=?').bind(historica).first(), antes);
  const filas = await DB.prepare('SELECT request_count FROM form_rate_limits').all();
  assert.deepEqual(filas.results.map(x => x.request_count), [1, 1]);
  assert.equal(llamadas.length, 1);
});

test('envío único: cupo durable, un solo destinatario y reintento bloqueado', async t => {
  const { harness, DB } = await base();
  t.after(() => harness.close());
  const llamadas = [];
  const buscar = proveedor(llamadas, () => Response.json({
    data: { succeeded: 1, failed: 0, email_id: 'prueba-1' },
  }));
  const env = entorno(DB, { STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: AUTORIZADO });
  const primera = await enviarCorreoControl(env, { para: '  CONTROL@example.test ' }, buscar);
  assert.equal(primera.status, 200);
  assert.deepEqual(await primera.json(), { estado: 'accepted', proveedor: 'smtp2go', aceptados: 1, email_id: 'prueba-1' });
  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].url, URL_SMTP2GO);
  assert.deepEqual(llamadas[0].cuerpo.to, [AUTORIZADO]);
  assert.equal(llamadas[0].cuerpo.cc, undefined);
  assert.equal(llamadas[0].cuerpo.bcc, undefined);
  assert.match(llamadas[0].cuerpo.subject, /staging/);
  const fila = await DB.prepare('SELECT key, request_count FROM form_rate_limits').all();
  assert.equal(fila.results.length, 1);
  assert.match(fila.results[0].key, new RegExp('^' + CLAVE_CUPO + ':[a-f0-9]{64}$'), 'la clave es un digest, sin correo');
  assert.equal(fila.results[0].request_count, 1);
  assert.equal(MAXIMO_ENVIOS, 1);
  for (const intento of [{ para: AUTORIZADO }, { para: AUTORIZADO, cc: 'x@example.test' }]) {
    const r = await enviarCorreoControl(env, intento, buscar);
    assert.ok([400, 429].includes(r.status));
  }
  const bloqueado = await enviarCorreoControl(env, { para: AUTORIZADO }, buscar);
  assert.equal(bloqueado.status, 429);
  assert.equal((await bloqueado.json()).error, 'cupo-agotado');
  assert.equal(llamadas.length, 1, 'el reintento no vuelve a despachar');

  // Otra base: el mismo destinatario autorizado ya no puede usarse dos veces.
  const segunda = await base();
  t.after(() => segunda.harness.close());
  const dos = await enviarCorreoControl(entorno(segunda.DB, {
    STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: AUTORIZADO }), { para: AUTORIZADO }, buscar);
  assert.equal(dos.status, 200, 'el cupo vive en la base, no en memoria del proceso');
  assert.equal(llamadas.length, 2);
});

test('transporte incierto y rechazo del proveedor no se reintentan solos', async t => {
  const { harness, DB } = await base();
  t.after(() => harness.close());

  const caidas = [];
  const ambiguo = await enviarCorreoControl(
    entorno(DB, { STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: 'uno@example.test' }),
    { para: 'uno@example.test' }, proveedor(caidas, () => { throw new Error('timeout'); }));
  assert.equal(ambiguo.status, 502);
  assert.equal((await ambiguo.json()).estado, 'ambiguo');
  const reintento = await enviarCorreoControl(
    entorno(DB, { STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: 'uno@example.test' }),
    { para: 'uno@example.test' }, proveedor(caidas, () => { throw new Error('timeout'); }));
  assert.equal(reintento.status, 429);
  assert.equal(caidas.length, 1, 'el ambiguo no se reintenta solo');

  const rechazos = [];
  const rechazo = await enviarCorreoControl(
    entorno(DB, { STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: 'dos@example.test' }),
    { para: 'dos@example.test' },
    proveedor(rechazos, () => Response.json({ data: { error_code: 'invalid_api_key', succeeded: 0, failed: 0 } }, { status: 400 })));
  assert.equal(rechazo.status, 502);
  assert.equal((await rechazo.json()).error, 'invalid_api_key');

  const ilegible = [];
  const sinCuerpo = await enviarCorreoControl(
    entorno(DB, { STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: 'tres@example.test' }),
    { para: 'tres@example.test' }, proveedor(ilegible, () => new Response('no-json', { status: 200 })));
  assert.equal(sinCuerpo.status, 502);
  assert.equal((await sinCuerpo.json()).estado, 'ambiguo');

  const sinExito = [];
  const fallido = await enviarCorreoControl(
    entorno(DB, { STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: 'cuatro@example.test' }),
    { para: 'cuatro@example.test' },
    proveedor(sinExito, () => Response.json({ data: { succeeded: 0, failed: 1 } })));
  assert.equal(fallido.status, 502);
  assert.equal((await fallido.json()).error, 'sin-destinatario');
  for (const [lista, nombre] of [[rechazos, 'rechazo'], [ilegible, 'ilegible'], [sinExito, 'fallido']]) {
    const otro = await enviarCorreoControl(
      entorno(DB, { STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: {
        rechazo: 'dos@example.test', ilegible: 'tres@example.test', fallido: 'cuatro@example.test',
      }[nombre] }),
      { para: { rechazo: 'dos@example.test', ilegible: 'tres@example.test', fallido: 'cuatro@example.test' }[nombre] },
      proveedor(lista, () => Response.json({ data: { succeeded: 1, failed: 0 } })));
    assert.equal(otro.status, 429, nombre);
    assert.equal(lista.length, 1);
  }
});

test('entry publicable: la ruta exige auth, falla cerrada y no sale a la red', async () => {
  const red = aislarRed();
  let s;
  const authorization = 'Basic ' + Buffer.from('staging:' + randomBytes(32).toString('base64url')).toString('base64');
  const config = {
    name: 'cau-staging-correo-entry', main: resolve('staging/publicar-worker.ts'),
    compatibility_date: '2026-10-25', compatibility_flags: ['nodejs_compat'], workers_dev: true,
    preview_urls: false, triggers: { crons: [] }, observability: { enabled: false },
    vars: {
      APP_STAGE: 'staging', DB_STAGE: 'staging', DB_NAME: 'cau-staging-correo-entry',
      STAGING_ACCESS: 'basic-sha256', OUTBOUND_MODE: 'disabled',
      STAGING_CORREO_HABILITADO: 'si', STAGING_CORREO_PARA: AUTORIZADO,
      STAGING_AUTH_SHA256: createHash('sha256').update(authorization).digest('hex'),
    },
    assets: { directory: resolve('dist/client'), binding: 'ASSETS', run_worker_first: true },
    d1_databases: [{ binding: 'DB', database_name: 'cau-staging-correo-entry',
      database_id: '22222222-2222-4222-8222-222222222222', remote: false, migrations_dir: resolve('migrations') }],
    dev: { ip: '127.0.0.1', port: 0 },
  };
  try {
    s = createTestHarness({ workers: [{ config }] });
    await s.listen();
    await s.getWorker().applyD1Migrations('DB');
    const { DB } = await s.getWorker().getEnv();
    const { snapshot } = ultimoSnapshot();
    await importarPublico(DB, snapshot, { escribir: true, destino: { etapa: 'staging', remoto: false, nombre: config.name } });
    const antes = await verificarPublico(DB, snapshot);
    const pedir = (method, cuerpo, headers = {}) => s.fetch('https://ensayo.invalid/api/staging-correo', {
      method, headers: { 'Content-Type': 'application/json', ...headers }, body: cuerpo, redirect: 'manual',
    });
    const json = { para: AUTORIZADO };

    // Sin auth y con auth falsa: 401 antes de leer el cuerpo.
    for (const headers of [{}, { Authorization: 'Basic ZmFsc286ZmFsc28=' }]) {
      const r = await pedir('POST', JSON.stringify(json), headers);
      assert.equal(r.status, 401);
      assert.equal(r.headers.get('cache-control'), 'no-store');
      assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow');
    }
    const auth = { Authorization: authorization };
    // Con auth pero sin clave de SMTP2GO: 503 explícito, sin egreso ni escrituras.
    const sinClave = await pedir('POST', JSON.stringify(json), auth);
    assert.equal(sinClave.status, 503);
    assert.equal((await sinClave.json()).error, 'smtp-sin-configurar');
    // Métodos que no son POST no llegan al despacho.
    for (const method of ['GET', 'PUT', 'DELETE']) {
      const r = await pedir(method, method === 'GET' ? undefined : JSON.stringify(json), auth);
      assert.ok([405, 503].includes(r.status), method);
    }
    // Cuerpo inválido y destinatario ajeno: rechazo sin despacho.
    assert.equal((await pedir('POST', 'no-json', auth)).status, 400);
    assert.equal((await pedir('POST', JSON.stringify({ para: 'otro@example.test' }), auth)).status, 503);
    assert.deepEqual(await verificarPublico(DB, snapshot), antes, 'sin escrituras de la ruta bloqueada');
    assert.equal(red.bloqueados.length, 0, 'ningún intento externo');
  } finally {
    try { await s?.close(); } finally { red.restaurar(); }
  }
});

test('publicación: el ensayo de correo se declara sólo con dos variables acotadas', () => {
  const destino = { autorizado: 'staging-publico-protegido', nombre: 'cau-staging-prueba',
    id: '33333333-3333-4333-8333-333333333333', cuenta: 'a'.repeat(32) };
  const observado = { nombre: destino.nombre, id: destino.id, cuenta: destino.cuenta, creadoParaStaging: true };
  const config = () => ({
    name: destino.nombre, main: '../../staging/publicar-worker.ts', account_id: destino.cuenta,
    compatibility_date: '2026-10-25', compatibility_flags: ['nodejs_compat'], workers_dev: true,
    preview_urls: false, triggers: { crons: [] }, observability: { enabled: false }, upload_source_maps: false,
    vars: { APP_STAGE: 'staging', DB_STAGE: 'staging', DB_NAME: destino.nombre,
      STAGING_ACCESS: 'basic-sha256', OUTBOUND_MODE: 'disabled' },
    assets: { directory: '../../dist/client', binding: 'ASSETS', run_worker_first: true },
    d1_databases: [{ binding: 'DB', database_name: destino.nombre, database_id: destino.id, remote: true }],
  });
  const conCorreo = config();
  conCorreo.vars.STAGING_CORREO_HABILITADO = 'si';
  conCorreo.vars.STAGING_CORREO_PARA = AUTORIZADO;
  assert.equal(validarPublicacionStaging(config(), destino, observado), true);
  assert.equal(validarPublicacionStaging(conCorreo, destino, observado), true);
  const casos = [
    () => { const c = config(); c.vars.STAGING_CORREO_HABILITADO = 'si'; return c; },
    () => { const c = config(); c.vars.STAGING_CORREO_HABILITADO = 'quizas'; return c; },
    () => { const c = config(); c.vars.STAGING_CORREO_PARA = 'Dos@Example.test'; return c; },
    () => { const c = config(); c.vars.STAGING_CORREO_PARA = 'no-es-correo'; return c; },
    () => { const c = config(); c.vars.STAGING_CORREO_LOTE = 'si'; return c; },
    () => { const c = config(); c.vars.SMTP2GO_API_KEY = 'en-config'; return c; },
  ];
  for (const armar of casos) assert.throws(() => validarPublicacionStaging(armar(), destino, observado));
});
