import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import * as casas from '../components/formularios/casas.ts';
import * as taxonomia from '../components/index/types.ts';
import * as inicio from '../components/index/inicio-teclab.ts';
import * as cobertura from '../components/formularios/cobertura-pago.ts';
import * as elegirCarrera from '../components/formularios/elegir-carrera.ts';
import * as whatsapp from '../lib/whatsapp.ts';
import * as vigilancia from '../lib/vigilancia-esperado.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

// El newsletter semanal de Teclab (`/api/newsletter`, cron de Vercel) y su
// baja (`/api/newsletter/baja` y la página `/newsletter/baja`). Supabase y
// SMTP2GO están simulados: ningún test sale a la red ni escribe en la base.

const { TABLA_NEWSLETTER, TABLA_PRECIOS } = casas;

const mailPrecio = cargarTypescript('components/formularios/mail-precio.ts', {
  '@/components/formularios/cobertura-pago': cobertura,
  '@/components/formularios/elegir-carrera': elegirCarrera,
  '@/components/index/types': taxonomia,
  '@/components/index/inicio-teclab': inicio,
  '@/lib/whatsapp': whatsapp,
  '@/lib/vigilancia-esperado': vigilancia,
});

const SMTP2GO = 'https://api.smtp2go.com/v3/email/send';
const SECRETO = 'secreto-del-cron';
const CLAVE = 'clave-smtp2go-de-prueba';
const DIA = 24 * 60 * 60 * 1000;
const haceDias = dias => new Date(Date.now() - dias * DIA).toISOString();

const ID = {
  vieja: '11111111-1111-4111-8111-111111111111',
  nunca: '22222222-2222-4222-8222-222222222222',
  reciente: '33333333-3333-4333-8333-333333333333',
  nueva: '44444444-4444-4444-8444-444444444444',
  inactiva: '55555555-5555-4555-8555-555555555555',
  siglo: '66666666-6666-4666-8666-666666666666',
  general: '77777777-7777-4777-8777-777777777777',
  vencida: '88888888-8888-4888-8888-888888888888',
  otra: '99999999-9999-4999-8999-999999999999',
};

const precioVigente = {
  conceptos: [{ concepto: 'Matrícula', monto: '$ 64.227,75', descuento: 75 }],
  total: '$ 64.227,75',
  nota: null,
  vigente_hasta: '2999-12-31',
};

/**
 * Un cliente de Supabase de juguete: cada consulta encadenada se evalúa sobre
 * las filas en memoria. El `or(...)` del cron se interpreta como la regla de
 * los 7 días, con la fecha límite que trae la expresión.
 */
function supabaseSimulado(estado) {
  const reglaOr = expr => {
    const limite = expr.match(/lte\.([^,)]+)/)?.[1];
    return f => (f.ultimo_envio_at ? f.ultimo_envio_at <= limite : f.consentimiento_at <= limite);
  };
  const ejecutar = q => {
    estado.consultas.push(q);
    const error = estado.errores[`${q.op}:${q.tabla}`];
    if (error) return { data: null, error };
    const filas = estado.tablas[q.tabla] ?? [];
    const elegidas = filas.filter(f => q.filtros.every(filtro => filtro(f)));
    if (q.op === 'update') {
      for (const fila of elegidas) Object.assign(fila, q.valores);
      return { data: null, error: null };
    }
    return { data: elegidas.slice(0, q.limite ?? Infinity).map(f => ({ ...f })), error: null };
  };
  return {
    from: tabla => {
      const q = { tabla, op: 'select', filtros: [] };
      const b = {
        select: columnas => { q.columnas = columnas; return b; },
        update: valores => { q.op = 'update'; q.valores = valores; return b; },
        eq: (c, v) => { q.filtros.push(f => f[c] === v); (q.eq ??= {})[c] = v; return b; },
        in: (c, vs) => { q.filtros.push(f => vs.includes(f[c])); (q.in ??= {})[c] = vs; return b; },
        or: expr => { q.or = expr; q.filtros.push(reglaOr(expr)); return b; },
        order: () => b,
        limit: n => { q.limite = n; return b; },
        then: (ok, mal) => Promise.resolve().then(() => ejecutar(q)).then(ok, mal),
      };
      return b;
    },
  };
}

function montar(t) {
  const anteriores = Object.fromEntries(['CRON_SECRET', 'SMTP2GO_API_KEY'].map(k => [k, process.env[k]]));
  const logError = console.error;
  const logWarn = console.warn;
  const fetchOriginal = globalThis.fetch;
  t.after(() => {
    console.error = logError;
    console.warn = logWarn;
    globalThis.fetch = fetchOriginal;
    for (const [k, v] of Object.entries(anteriores)) {
      if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  });
  const registros = [];
  console.error = (...args) => registros.push(args);
  console.warn = (...args) => registros.push(args);
  process.env.CRON_SECRET = SECRETO;
  process.env.SMTP2GO_API_KEY = CLAVE;

  const mails = [];
  let respuestaMail = () => new Response(JSON.stringify({ data: { succeeded: 1, failed: 0 } }), { status: 200 });
  globalThis.fetch = async (url, init) => {
    if (url !== SMTP2GO) throw new Error(`fetch inesperado a ${url}`);
    const cuerpo = JSON.parse(init.body);
    mails.push({ headers: init.headers, cuerpo });
    return respuestaMail(cuerpo);
  };

  const suscripcion = (id, extra) => ({
    id, email: `${id.slice(0, 4)}@example.test`, carrera_id: 7, carrera_nombre: 'Programación',
    activo: true, consentimiento_at: haceDias(30), ultimo_envio_at: null, ...extra,
  });
  const estado = {
    tablas: {
      carreras: [
        { id: 7, nombre: 'Programación', prefix: 'Tecnicatura Superior en', nombre_corto: 'Programación', duracion: '2 años', nivel: 'Teclab - Tecnología', activa: true },
        { id: 8, nombre: 'Administración', prefix: 'Licenciatura en', nombre_corto: null, duracion: '4 años', nivel: 'Grado', activa: true },
        { id: 9, nombre: 'Venta Directa', prefix: 'Tecnicatura Superior en', nombre_corto: null, duracion: '2 años', nivel: 'Teclab - Gestión', activa: false },
        { id: 10, nombre: 'Redes', prefix: 'Tecnicatura Superior en', nombre_corto: 'Redes', duracion: '2 años', nivel: 'Teclab - Tecnología', activa: true },
      ],
      [TABLA_PRECIOS]: [
        { carrera_id: 7, ...precioVigente },
        { carrera_id: 8, ...precioVigente },
        { carrera_id: 9, ...precioVigente },
        { carrera_id: 10, ...precioVigente, vigente_hasta: '2000-01-01' },
      ],
      [TABLA_NEWSLETTER]: [
        suscripcion(ID.vieja, { ultimo_envio_at: haceDias(8) }),
        suscripcion(ID.nunca),
        suscripcion(ID.reciente, { ultimo_envio_at: haceDias(2) }),
        suscripcion(ID.nueva, { consentimiento_at: haceDias(3) }),
        suscripcion(ID.inactiva, { activo: false }),
        suscripcion(ID.siglo, { carrera_id: 8 }),
        suscripcion(ID.general, { carrera_id: null, carrera_nombre: null }),
        suscripcion(ID.vencida, { carrera_id: 10 }),
        suscripcion(ID.otra, { carrera_id: 9 }),
      ],
    },
    errores: {},
    consultas: [],
  };
  const supabase = supabaseSimulado(estado);
  const deps = {
    'next/server': { NextResponse: Response },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => supabase },
    '@/components/formularios/casas': casas,
    '@/components/formularios/mail-precio': mailPrecio,
    '@/lib/vigilancia-esperado': vigilancia,
  };
  const { GET } = cargarTypescript('app/api/newsletter/route.ts', deps);
  const { POST } = cargarTypescript('app/api/newsletter/baja/route.ts', deps);

  const correr = async (autorizacion = `Bearer ${SECRETO}`) => {
    const headers = autorizacion ? { authorization: autorizacion } : {};
    const respuesta = await GET(new Request('http://localhost/api/newsletter', { headers }));
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  };
  const fila = id => estado.tablas[TABLA_NEWSLETTER].find(f => f.id === id);
  const destinatarios = () => mails.map(m => m.cuerpo.to[0]);
  const contestarMail = fn => { respuestaMail = fn; };
  return { estado, correr, POST, mails, registros, fila, destinatarios, contestarMail };
}

// ── El cron ──

test('el cron se autentica como /api/vigilancia: 503 sin secreto, 401 si no coincide', async t => {
  const { correr, mails, estado } = montar(t);
  assert.equal((await correr(null)).status, 401);
  assert.equal((await correr('Bearer otro')).status, 401);
  assert.equal((await correr(SECRETO)).status, 401, 'sin el prefijo Bearer');
  delete process.env.CRON_SECRET;
  assert.equal((await correr()).status, 503);
  assert.equal(mails.length, 0);
  assert.deepEqual(estado.consultas, []);
});

test('manda a las suscripciones de Teclab con 7 días desde el último envío o el consentimiento', async t => {
  const { correr, fila, destinatarios, estado } = montar(t);
  const { status, cuerpo } = await correr();
  assert.equal(status, 200);
  assert.deepEqual(cuerpo, { candidatas: 2, enviados: 2, salteados: 0, fallidos: 0 });
  assert.deepEqual(destinatarios().sort(), [fila(ID.vieja).email, fila(ID.nunca).email].sort());

  // La regla de los 7 días va en la consulta, con su tope por corrida.
  const lectura = estado.consultas.find(q => q.tabla === TABLA_NEWSLETTER && q.op === 'select');
  assert.equal(lectura.eq.activo, true);
  assert.match(lectura.or, /ultimo_envio_at\.is\.null/);
  assert.match(lectura.or, /consentimiento_at\.lte\./);
  assert.match(lectura.or, /ultimo_envio_at\.lte\./);
  assert.ok(lectura.limite > 0 && lectura.limite <= 100);
  // Sólo carreras de Teclab activas con precio vigente: ni Siglo 21, ni la
  // inactiva, ni la de precio vencido, ni las generales.
  assert.deepEqual(lectura.in.carrera_id, [7]);
});

test('el mail es el newsletter de la plantilla, con la baja de un clic en los encabezados', async t => {
  const { correr, mails, fila } = montar(t);
  await correr();
  const mail = mails.find(m => m.cuerpo.to[0] === fila(ID.vieja).email);
  assert.equal(mail.headers['X-Smtp2go-Api-Key'], CLAVE);
  assert.equal(mail.cuerpo.sender, 'CAU Villa Lugano <inscripciones@siglo21sur.com>');
  assert.match(mail.cuerpo.subject, /^Programación en Teclab: /);
  assert.match(mail.cuerpo.html_body, /\$ 64\.227,75/);
  assert.match(mail.cuerpo.html_body, /pediste novedades de esta carrera/);
  assert.ok(mail.cuerpo.html_body.includes(`href="https://www.siglo21sur.com/newsletter/baja?id=${ID.vieja}"`));
  assert.deepEqual(mail.cuerpo.custom_headers, [
    { header: 'List-Unsubscribe', value: `<https://www.siglo21sur.com/api/newsletter/baja?id=${ID.vieja}>` },
    { header: 'List-Unsubscribe-Post', value: 'List-Unsubscribe=One-Click' },
  ]);
});

test('ultimo_envio_at se actualiza sólo con el envío confirmado', async t => {
  const { correr, fila, contestarMail } = montar(t);
  const antes = fila(ID.vieja).ultimo_envio_at;
  contestarMail(cuerpo => cuerpo.to[0] === fila(ID.nunca).email
    ? new Response(JSON.stringify({ data: { succeeded: 1, failed: 0 } }), { status: 200 })
    : new Response(JSON.stringify({ data: { succeeded: 0, failed: 1, error_code: 'E_X' } }), { status: 200 }));
  const { cuerpo } = await correr();
  assert.deepEqual(cuerpo, { candidatas: 2, enviados: 1, salteados: 0, fallidos: 1 });
  assert.equal(fila(ID.vieja).ultimo_envio_at, antes, 'el rechazo no cuenta como envío');
  const nuevo = Date.parse(fila(ID.nunca).ultimo_envio_at);
  assert.ok(Math.abs(Date.now() - nuevo) < 60_000);

  // Corrida siguiente: la que salió ya no es candidata; la rechazada, sí.
  contestarMail(() => { throw new TypeError('fetch failed'); });
  const segunda = await correr();
  assert.deepEqual(segunda.cuerpo, { candidatas: 1, enviados: 0, salteados: 0, fallidos: 1 });
  assert.equal(fila(ID.vieja).ultimo_envio_at, antes);
});

test('un fallo no corta la corrida y los registros no llevan mails, ids ni la clave', async t => {
  const { correr, registros, fila, contestarMail, mails } = montar(t);
  let primero = true;
  contestarMail(() => {
    if (primero) { primero = false; return new Response('{}', { status: 500 }); }
    return new Response(JSON.stringify({ data: { succeeded: 1, failed: 0 } }), { status: 200 });
  });
  const { cuerpo } = await correr();
  assert.equal(mails.length, 2);
  assert.deepEqual(cuerpo, { candidatas: 2, enviados: 1, salteados: 0, fallidos: 1 });
  const salida = JSON.stringify(registros);
  for (const secreto of [CLAVE, fila(ID.vieja).email, fila(ID.nunca).email, ID.vieja, ID.nunca]) {
    assert.equal(salida.includes(secreto), false, secreto);
  }
});

test('sin SMTP2GO_API_KEY no manda ni toca la base', async t => {
  const { correr, mails, estado, registros } = montar(t);
  delete process.env.SMTP2GO_API_KEY;
  const { status, cuerpo } = await correr();
  assert.equal(status, 503);
  assert.deepEqual(
    { candidatas: cuerpo.candidatas, enviados: cuerpo.enviados, salteados: cuerpo.salteados, fallidos: cuerpo.fallidos },
    { candidatas: 0, enviados: 0, salteados: 0, fallidos: 0 },
  );
  assert.equal(mails.length, 0);
  assert.equal(estado.consultas.some(q => q.op === 'update'), false);
  assert.ok(registros.some(r => /SMTP2GO_API_KEY/.test(String(r[0]))));
});

test('sin carreras de Teclab con precio vigente no hay candidatas', async t => {
  const { correr, mails, estado } = montar(t);
  estado.tablas[TABLA_PRECIOS] = estado.tablas[TABLA_PRECIOS].map(p => ({ ...p, vigente_hasta: '2000-01-01' }));
  const { status, cuerpo } = await correr();
  assert.equal(status, 200);
  assert.deepEqual(cuerpo, { candidatas: 0, enviados: 0, salteados: 0, fallidos: 0 });
  assert.equal(mails.length, 0);
});

test('si falla la lectura de la base responde 500 sin mandar nada', async t => {
  const { correr, mails, estado } = montar(t);
  estado.errores[`select:${TABLA_NEWSLETTER}`] = { code: '42501' };
  assert.equal((await correr()).status, 500);
  assert.equal(mails.length, 0);
});

// ── La baja ──

const pedirBaja = (POST, { query = '', cuerpo = '' } = {}) => POST(new Request(`http://localhost/api/newsletter/baja${query}`, {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: cuerpo,
}));

test('el POST de un clic (Gmail) da de baja por el id de la URL', async t => {
  const { POST, fila } = montar(t);
  const respuesta = await pedirBaja(POST, { query: `?id=${ID.vieja}`, cuerpo: 'List-Unsubscribe=One-Click' });
  assert.equal(respuesta.status, 200);
  assert.equal(fila(ID.vieja).activo, false);
  assert.equal(fila(ID.nunca).activo, true, 'sólo esa suscripción');
});

test('el botón de la página da de baja por el cuerpo y vuelve a la confirmación', async t => {
  const { POST, fila } = montar(t);
  const respuesta = await pedirBaja(POST, { cuerpo: `id=${ID.nunca}` });
  assert.equal(respuesta.status, 303);
  assert.equal(new URL(respuesta.headers.get('location')).pathname + new URL(respuesta.headers.get('location')).search, '/newsletter/baja?listo=1');
  assert.equal(fila(ID.nunca).activo, false);
});

test('un id mal formado es 400 y uno que no existe responde 200 igual', async t => {
  const { POST, estado } = montar(t);
  for (const query of ['', '?id=', '?id=no-es-un-uuid', `?id=${ID.vieja}x`]) {
    assert.equal((await pedirBaja(POST, { query })).status, 400, query);
  }
  assert.equal(estado.consultas.length, 0, 'sin id válido no se toca la base');
  const desconocido = await pedirBaja(POST, { query: '?id=abcdefab-cdef-4abc-8def-abcdefabcdef' });
  assert.equal(desconocido.status, 200);
  assert.ok(estado.tablas[TABLA_NEWSLETTER].filter(f => f.id !== ID.inactiva).every(f => f.activo));
});

test('si la base falla, la baja responde 500', async t => {
  const { POST, estado } = montar(t);
  estado.errores[`update:${TABLA_NEWSLETTER}`] = { code: '42501' };
  assert.equal((await pedirBaja(POST, { query: `?id=${ID.vieja}` })).status, 500);
});

// ── La página ──

const { default: PaginaBaja, metadata } = cargarTypescript('app/newsletter/baja/page.tsx', {
  './baja.css': {},
  '@/components/formularios/mail-precio': mailPrecio,
});

const pintar = async parametros => renderToStaticMarkup(await PaginaBaja({ searchParams: Promise.resolve(parametros) }));

test('la página no da de baja al abrirla: muestra un botón que hace el POST', async () => {
  // No importa Supabase: abrir el enlace (o que lo abra un escáner) no escribe.
  const html = await pintar({ id: ID.vieja });
  assert.match(html, /<form[^>]*method="post"/i);
  assert.match(html, /action="\/api\/newsletter\/baja"/);
  assert.ok(html.includes(`name="id" value="${ID.vieja}"`));
  assert.match(html, /Dejar de recibir novedades/);
});

test('con listo=1 confirma la baja; sin id válido no ofrece el botón', async () => {
  assert.match(await pintar({ listo: '1' }), /Listo, no vas a recibir más novedades\./);
  for (const parametros of [{}, { id: 'x' }, { id: [ID.vieja, ID.nunca] }]) {
    const html = await pintar(parametros);
    assert.doesNotMatch(html, /<form/, JSON.stringify(parametros));
  }
});

test('la página no se indexa', () => {
  assert.deepEqual(metadata.robots, { index: false, follow: false });
});
