import test from 'node:test';
import assert from 'node:assert/strict';
import { crearD1 } from './helpers/d1.mjs';
import { manejarConsultaStaging, crearBusquedaCaptcha, CLAVE_ENSAYO, ACCION } from '../staging/formulario-controlado.ts';
import { mensajeRechazoEnsayo } from '../../components/formularios/errores-ensayo.ts';
import { montarTurnstile } from '../src/entrega/turnstile.ts';
import { validarPublicacionStaging } from '../scripts/staging-remoto.mjs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { createTestHarness } from 'wrangler';

const host = 'cau-staging-ensayo.cuenta.workers.dev';
const email = 'control@example.test';
const payload = { casa: null, tipoFormulario: 'contacto', carrera: null, tipo: null,
  modalidad: null, equivalencias: false, nombre: 'Prueba', apellido: 'Staging', email,
  telefono: '', localidad: '', newsletter: false };
const cuerpo = (extra = {}) => ({ kind: 'consulta', token: 'token-sintetico', payload: { ...payload }, ...extra });
const env = DB => ({ DB, STAGING_FORMULARIO_HABILITADO: 'si', STAGING_CORREO_PARA: email,
  TURNSTILE_SECRET_KEY: 'sintetica', TURNSTILE_EXPECTED_HOSTNAME: host });
const pedir = (DB, body, buscar, cambio = {}, origin = `https://${host}`) => manejarConsultaStaging(new Request(`https://${host}/api/formularios`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, 'cf-connecting-ip': '203.0.113.1' }, body: JSON.stringify(body),
}), { ...env(DB), ...cambio }, buscar);
const proveedor = async () => Response.json({ success: true, hostname: host, action: ACCION });
const cantidad = async (db, tabla) => (await db.prepare(`SELECT count(*) AS n FROM ${tabla}`).first()).n;

test('consulta staging: fail-closed, origen, sobre, allowlist y datos acotados', async t => {
  const { db } = await crearD1(t); let llamadas = 0;
  const buscar = async () => { llamadas++; return proveedor(); };
  assert.equal((await pedir(db, cuerpo(), buscar, { STAGING_FORMULARIO_HABILITADO: 'no' })).status, 503);
  assert.equal((await pedir(db, cuerpo(), buscar, { TURNSTILE_SECRET_KEY: undefined })).status, 503);
  assert.equal((await pedir(db, cuerpo(), buscar, { TURNSTILE_EXPECTED_HOSTNAME: undefined })).status, 503);
  assert.equal((await pedir(db, cuerpo(), buscar, {}, 'https://ajeno.invalid')).status, 403);
  for (const body of [cuerpo({ kind: 'precio' }), cuerpo({ token: '' }), cuerpo({ payload: { ...payload, newsletter: true } }),
    cuerpo({ payload: { ...payload, email: 'otro@example.test' } }), cuerpo({ payload: { ...payload, dni: 'no-permitido' } }),
    cuerpo({ run_id: 'otro' }), cuerpo({ payload: { ...payload, telefono: '<script>' } })]) {
    assert.ok([400, 403].includes((await pedir(db, body, buscar)).status));
  }

  // Motivo seguro por campo: nombre del campo, nunca su valor.
  const rechazo = async cambio => {
    const r = await pedir(db, cuerpo({ payload: { ...payload, ...cambio } }), buscar);
    return { status: r.status, ...(await r.json()) };
  };
  for (const [campo, valor] of [['nombre', 'Nombre Real'], ['apellido', 'Real'],
    ['telefono', '11 5555 5555'], ['localidad', 'Villa Lugano'], ['newsletter', true]]) {
    assert.deepEqual(await rechazo({ [campo]: valor }),
      { status: 400, error: 'campo-fuera-de-ensayo', campo }, campo);
  }
  assert.deepEqual(await rechazo({ carrera: 'Alguna' }),
    { status: 400, error: 'campo-fuera-de-ensayo', campo: 'datos' }, 'contrato interno');
  const sinToken = await pedir(db, cuerpo({ token: '   ' }), buscar);
  assert.deepEqual({ status: sinToken.status, ...(await sinToken.json()) },
    { status: 400, error: 'token-faltante' });
  assert.equal((await (await pedir(db, cuerpo({ run_id: 'otro' }), buscar)).json()).error, 'campo-no-admitido');
  const otroEmail = await pedir(db, cuerpo({ payload: { ...payload, email: 'otro@example.test' } }), buscar);
  assert.deepEqual({ status: otroEmail.status, ...(await otroEmail.json()) },
    { status: 403, error: 'contacto-no-autorizado' });

  assert.equal(llamadas, 0);
  assert.equal(await cantidad(db, 'consultas'), 0);
  assert.equal(await cantidad(db, 'outbox'), 0);
});

test('texto recortado: un espacio de más no rompe un envío correcto', async t => {
  const { db } = await crearD1(t);
  const r = await pedir(db, cuerpo({ payload: { ...payload, nombre: '  Prueba ', apellido: 'Staging  ',
    telefono: '   ', localidad: '\t' } }), proveedor);
  assert.equal(r.status, 201, await r.clone().text());
  assert.equal(await cantidad(db, 'consultas'), 1);
  assert.deepEqual(await db.prepare('SELECT tipo, estado FROM outbox').first(),
    { tipo: 'aviso-lead', estado: 'pendiente' });
});

test('captcha rechazado, hostname/action incorrectos y caída: ninguna persistencia', async t => {
  const { db } = await crearD1(t);
  for (const buscar of [async () => Response.json({ success: false }),
    async () => Response.json({ success: true, hostname: 'otro.invalid', action: ACCION }),
    async () => Response.json({ success: true, hostname: host, action: 'otra' }),
    async () => { throw Error('caída sintética'); }]) {
    assert.equal((await pedir(db, cuerpo(), buscar)).status, 403);
  }
  assert.equal(await cantidad(db, 'consultas'), 0);
  assert.equal(await cantidad(db, 'outbox'), 0);
  assert.equal((await db.prepare('SELECT count(*) AS n FROM form_rate_limits WHERE key=?').bind(CLAVE_ENSAYO).first()).n, 0);
});

test('flujo normal persiste consulta y aviso pendiente sin transporte; cupo estable', async t => {
  const { db } = await crearD1(t);
  assert.equal((await pedir(db, cuerpo(), proveedor)).status, 201);
  assert.equal(await cantidad(db, 'consultas'), 1);
  const efecto = await db.prepare('SELECT tipo,estado,intentos FROM outbox').first();
  assert.deepEqual(efecto, { tipo: 'aviso-lead', estado: 'pendiente', intentos: 0 });
  assert.equal(await cantidad(db, 'suscripciones_newsletter'), 0);
  assert.equal((await pedir(db, cuerpo(), async () => Response.json({ success: false, 'error-codes': ['timeout-or-duplicate'] }))).status, 403);
  assert.equal((await pedir(db, cuerpo(), proveedor)).status, 429);
  assert.equal(await cantidad(db, 'consultas'), 1);
  assert.equal((await db.prepare('SELECT request_count FROM form_rate_limits WHERE key=?').bind(CLAVE_ENSAYO).first()).request_count, 1);
});

test('Siteverify: egreso sólo POST exacto, sin seguir redirecciones', async () => {
  let llamadas = 0;
  const buscar = crearBusquedaCaptcha(async (_url, init) => { llamadas++; assert.equal(init.redirect, 'manual'); return Response.json({ success: false }); });
  await buscar('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST' });
  await assert.rejects(() => buscar('https://api.smtp2go.com/v3/email/send', { method: 'POST' }));
  await assert.rejects(() => buscar('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'GET' }));
  assert.equal(llamadas, 1);
  const redireccion = crearBusquedaCaptcha(async () => new Response(null, { status: 302, headers: { Location: 'https://otro.invalid' } }));
  await assert.rejects(() => redireccion('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST' }));
});

test('widget lleva la acción de staging del documento, sin cambiar las otras superficies', async () => {
  let recibida;
  const control = montarTurnstile({ sitio: 'sitio-sintetico', contenedor: {}, ventana: {},
    documento: { querySelector: () => ({ getAttribute: () => ACCION }) },
    onVerify() {}, cargar: async () => ({ render: (_n, opciones) => { recibida = opciones.action; return 'id-local'; }, remove() {} }) });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(recibida, ACCION); control.desmontar();
});

test('config publicable: widget exclusivo, sin secretos planos ni banderas simultáneas', () => {
  const destino = { autorizado: 'staging-publico-protegido', nombre: 'cau-staging-ensayo', id: '11111111-1111-4111-8111-111111111111', cuenta: 'a'.repeat(32) };
  const observado = { ...destino, creadoParaStaging: true };
  const c = { name: destino.nombre, main: '../../staging/publicar-worker.ts', account_id: destino.cuenta,
    compatibility_date: '2026-10-25', compatibility_flags: ['nodejs_compat'], workers_dev: true, preview_urls: false,
    triggers: { crons: [] }, observability: { enabled: false }, upload_source_maps: false,
    assets: { directory: '../../dist/client', binding: 'ASSETS', run_worker_first: true },
    d1_databases: [{ binding: 'DB', database_name: destino.nombre, database_id: destino.id, remote: true }],
    vars: { APP_STAGE: 'staging', DB_STAGE: 'staging', DB_NAME: destino.nombre, STAGING_ACCESS: 'basic-sha256', OUTBOUND_MODE: 'disabled',
      STAGING_CORREO_HABILITADO: 'no', STAGING_CORREO_PARA: email, STAGING_FORMULARIO_HABILITADO: 'si',
      TURNSTILE_EXPECTED_HOSTNAME: host, PUBLIC_TURNSTILE_SITE_KEY: '0xSintetico' } };
  assert.equal(validarPublicacionStaging(c, destino, observado), true);
  for (const cambio of [{ TURNSTILE_EXPECTED_HOSTNAME: 'www.siglo21sur.com' }, { TURNSTILE_SECRET_KEY: 'no-permitir' },
    { PUBLIC_TURNSTILE_SITE_KEY: '' }, { STAGING_CORREO_HABILITADO: 'si' }]) {
    assert.throws(() => validarPublicacionStaging({ ...c, vars: { ...c.vars, ...cambio } }, destino, observado));
  }
});

test('motivo visible del ensayo: códigos seguros, sin valores ni datos del pedido', () => {
  const esperados = [
    [{ error: 'campo-fuera-de-ensayo', campo: 'nombre' }, /nombre tiene que ser/],
    [{ error: 'campo-fuera-de-ensayo', campo: 'apellido' }, /apellido tiene que ser/],
    [{ error: 'campo-fuera-de-ensayo', campo: 'telefono' }, /teléfono vacío/],
    [{ error: 'campo-fuera-de-ensayo', campo: 'localidad' }, /localidad vacía/],
    [{ error: 'campo-fuera-de-ensayo', campo: 'newsletter' }, /Destildá/],
    [{ error: 'campo-fuera-de-ensayo', campo: 'otro' }, /formulario de contacto/],
    [{ error: 'contacto-no-autorizado' }, /correo autorizado/],
    [{ error: 'token-faltante' }, /verificación de seguridad/],
    [{ error: 'CAPTCHA inválido' }, /verificación de seguridad/],
    [{ error: 'cupo-ensayo-agotado' }, /único envío/],
    [{ error: 'formulario-staging-deshabilitado' }, /cerrado ahora/],
    [{ error: 'origen-no-autorizado' }, /No se pudo validar/],
    [{ error: 'solicitud-invalida' }, /No se pudo validar/],
    [{ error: 'campo-no-admitido' }, /No se pudo validar/],
  ];
  for (const [detalle, patron] of esperados) {
    const mensaje = mensajeRechazoEnsayo(detalle);
    assert.equal(typeof mensaje, 'string', detalle.error);
    assert.match(mensaje, patron);
    assert.ok(!mensaje.includes('@'), 'nunca muestra el correo esperado');
    assert.ok(!/token|stack|api.?key/i.test(mensaje));
  }
  assert.equal(mensajeRechazoEnsayo({ error: 'otro-codigo' }), null);
  assert.equal(mensajeRechazoEnsayo(null), null);
  assert.equal(mensajeRechazoEnsayo({}), null);
});

test('fallo de escritura conserva cupo y no crea consulta ni efecto parcial', async t => {
  const { db } = await crearD1(t);
  const fallida = { prepare: db.prepare.bind(db), batch: async () => { throw Error('Fallo sintético de persistencia'); } };
  assert.equal((await pedir(fallida, cuerpo(), proveedor)).status, 500);
  assert.equal(await cantidad(db, 'consultas'), 0);
  assert.equal(await cantidad(db, 'outbox'), 0);
  assert.equal((await db.prepare('SELECT request_count FROM form_rate_limits WHERE key=?').bind(CLAVE_ENSAYO).first()).request_count, 1);
  assert.equal((await pedir(db, cuerpo(), proveedor)).status, 429);
});

test('entry workerd: Basic, acción HTML, Siteverify interceptado y outbox pendiente', async t => {
  const original = globalThis.fetch; let verificaciones = 0; let s;
  globalThis.fetch = async (url, init) => {
    const destino = new URL(typeof url === 'string' ? url : url.url);
    if (destino.href === 'https://challenges.cloudflare.com/turnstile/v0/siteverify') {
      verificaciones++; assert.equal(init.method, 'POST');
      return proveedor();
    }
    if (!['127.0.0.1', 'localhost'].includes(destino.hostname)) throw Error('Egreso no autorizado');
    return original(url, init);
  };
  t.after(async () => { try { await s?.close(); } finally { globalThis.fetch = original; } });
  const authorization = 'Basic ' + Buffer.from('staging:credencial-sintetica').toString('base64');
  const c = { name: 'cau-staging-formulario', main: resolve('staging/publicar-worker.ts'),
    compatibility_date: '2026-10-25', compatibility_flags: ['nodejs_compat'], dev: { ip: '127.0.0.1', port: 0 },
    vars: { ...env(undefined), APP_STAGE: 'staging', DB_STAGE: 'staging', DB_NAME: 'cau-staging-formulario',
      STAGING_ACCESS: 'basic-sha256', OUTBOUND_MODE: 'disabled', PUBLIC_TURNSTILE_SITE_KEY: '0xSintetico',
      STAGING_AUTH_SHA256: createHash('sha256').update(authorization).digest('hex') },
    d1_databases: [{ binding: 'DB', database_name: 'cau-staging-formulario', database_id: '55555555-5555-4555-8555-555555555555', remote: false, migrations_dir: resolve('migrations') }] };
  delete c.vars.DB;
  s = createTestHarness({ workers: [{ config: c }] }); await s.listen(); await s.getWorker().applyD1Migrations('DB');
  const enviar = (auth = true) => s.fetch(`https://${host}/api/formularios`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: `https://${host}`, ...(auth ? { Authorization: authorization } : {}) }, body: JSON.stringify(cuerpo()) });
  assert.equal((await enviar(false)).status, 401); assert.equal(verificaciones, 0);
  const html = await (await s.fetch(`https://${host}/contacto`, { headers: { Authorization: authorization } })).text();
  assert.match(html, /name="turnstile-action" content="staging_contacto"/);
  assert.match(html, /name="formularios-detalle" content="ensayo"/);
  const respuesta = await enviar(); assert.equal(respuesta.status, 201, await respuesta.text());
  assert.equal(verificaciones, 1);
  assert.equal(respuesta.headers.get('cache-control'), 'no-store');
  const { DB } = await s.getWorker().getEnv();
  assert.equal(await cantidad(DB, 'consultas'), 1);
  assert.deepEqual(await DB.prepare('SELECT tipo,estado,intentos FROM outbox').first(), { tipo: 'aviso-lead', estado: 'pendiente', intentos: 0 });
});
