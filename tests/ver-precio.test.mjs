import test from 'node:test';
import assert from 'node:assert/strict';
import * as casas from '../components/formularios/casas.ts';
import * as taxonomia from '../components/index/types.ts';
import * as inicio from '../components/index/inicio-teclab.ts';
import * as cobertura from '../components/formularios/cobertura-pago.ts';
import * as elegirCarrera from '../components/formularios/elegir-carrera.ts';
import * as whatsapp from '../lib/whatsapp.ts';
import * as vigilancia from '../lib/vigilancia-esperado.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const {
  validarPayloadPrecio, fechaArgentina, resultadoPrecio, carreraConPrecio,
  columnaDe, FORMULARIO_PRECIO, TABLA_PRECIOS,
} = casas;

// ── Lógica pura ──

test('el payload de «ver precio» exige carrera y mail válidos, sin nombre', () => {
  const valido = { carreraId: 12, email: '  ana@example.test  ', newsletter: true };
  assert.deepEqual(validarPayloadPrecio(valido), { carreraId: 12, email: 'ana@example.test', newsletter: true });

  // Si llega un nombre, se ignora: con el mail alcanza.
  assert.deepEqual(
    validarPayloadPrecio({ ...valido, nombre: 'Ana' }),
    { carreraId: 12, email: 'ana@example.test', newsletter: true },
  );

  // El newsletter es opt-in: sólo un `true` explícito suscribe.
  assert.equal(validarPayloadPrecio({ ...valido, newsletter: 'true' }).newsletter, false);
  assert.equal(validarPayloadPrecio({ ...valido, newsletter: undefined }).newsletter, false);

  for (const malo of [
    { ...valido, carreraId: 0 },
    { ...valido, carreraId: -3 },
    { ...valido, carreraId: 1.5 },
    { ...valido, carreraId: '12' },
    { ...valido, carreraId: undefined },
    { ...valido, email: '' },
    { ...valido, email: 'no-es-un-mail' },
  ]) {
    assert.equal(validarPayloadPrecio(malo), null, JSON.stringify(malo));
  }
});

test('la fecha de hoy es la de Argentina, no la de UTC', () => {
  // 02:30 UTC del 2 de octubre son las 23:30 del 1 en Buenos Aires.
  assert.equal(fechaArgentina(new Date('2026-10-02T02:30:00Z')), '2026-10-01');
  assert.equal(fechaArgentina(new Date('2026-10-02T03:00:00Z')), '2026-10-02');
  assert.equal(fechaArgentina(new Date('2026-12-31T23:59:00Z')), '2026-12-31');
});

const fila = {
  conceptos: [
    { concepto: 'Matrícula', monto: '$ 64.227,75', descuento: 75 },
    { concepto: 'Bimestre (octubre-noviembre)', monto: '$ 488.131,28', descuento: 24 },
  ],
  total: '$ 552.359,03',
  nota: 'Ese pago cubre un bimestre de cursada.',
  vigente_hasta: '2026-10-01',
};

test('el precio se muestra hasta el último día de la promoción, inclusive', () => {
  assert.deepEqual(resultadoPrecio(fila, '2026-10-01'), {
    estado: 'vigente',
    precio: {
      conceptos: fila.conceptos,
      total: '$ 552.359,03',
      nota: 'Ese pago cubre un bimestre de cursada.',
      vigenteHasta: '2026-10-01',
    },
  });
  assert.equal(resultadoPrecio(fila, '2026-09-15').estado, 'vigente');
});

test('vencido o sin fila, no hay precio en la respuesta', () => {
  const vencido = resultadoPrecio(fila, '2026-10-02');
  assert.deepEqual(vencido, { estado: 'vencido', vigenteHasta: '2026-10-01' });
  assert.equal('precio' in vencido, false);
  assert.deepEqual(resultadoPrecio(null, '2026-10-02'), { estado: 'sin-precio' });
});

test('los conceptos mal formados se descartan en vez de romper la respuesta', () => {
  const sucia = {
    ...fila,
    conceptos: [
      { concepto: 'Matrícula', monto: '$ 1', descuento: '75' },
      { concepto: 'Sin monto' },
      'texto suelto',
      null,
      { concepto: 'Bimestre', monto: '$ 2', descuento: 30, extra: 'no viaja' },
    ],
  };
  assert.deepEqual(resultadoPrecio(sucia, '2026-10-01').precio.conceptos, [
    { concepto: 'Matrícula', monto: '$ 1', descuento: null },
    { concepto: 'Bimestre', monto: '$ 2', descuento: 30 },
  ]);
  assert.deepEqual(resultadoPrecio({ ...fila, conceptos: 'no es lista' }, '2026-10-01').precio.conceptos, []);
});

test('sólo las carreras activas de Teclab tienen «ver precio»', () => {
  assert.equal(carreraConPrecio({ nivel: 'Teclab - Tecnología', activa: true }), true);
  assert.equal(carreraConPrecio({ nivel: 'Teclab - Gestión', activa: true }), true);
  assert.equal(carreraConPrecio({ nivel: 'Teclab - Curso', activa: true }), true);
  assert.equal(carreraConPrecio({ nivel: 'Teclab - Gestión', activa: false }), false);
  assert.equal(carreraConPrecio({ nivel: 'Grado', activa: true }), false);
  assert.equal(carreraConPrecio({ nivel: 'Identidad Argentina', activa: true }), false);
  assert.equal(carreraConPrecio({ nivel: 'Posgrado', activa: true }), false);
});

// ── El endpoint, con Supabase simulado ──

// El mail del precio, real, con sus dependencias inyectadas: el alias `@/` no
// lo resuelve Node pelado.
const mailPrecio = cargarTypescript('components/formularios/mail-precio.ts', {
  '@/components/formularios/cobertura-pago': cobertura,
  '@/components/formularios/elegir-carrera': elegirCarrera,
  '@/components/index/types': taxonomia,
  '@/components/index/inicio-teclab': inicio,
  '@/lib/whatsapp': whatsapp,
  '@/lib/vigilancia-esperado': vigilancia,
});

const SMTP2GO = 'https://api.smtp2go.com/v3/email/send';

function montarEndpoint(t) {
  const anteriores = Object.fromEntries(
    ['NODE_ENV', 'TURNSTILE_SECRET_KEY', 'SMTP2GO_API_KEY'].map(k => [k, process.env[k]]),
  );
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
  process.env.NODE_ENV = 'production';
  process.env.TURNSTILE_SECRET_KEY = 'prueba-simulada';
  delete process.env.SMTP2GO_API_KEY;

  // SMTP2GO simulado: nunca se llama a la API real. `respuestaMail` decide qué
  // contesta (o lanza) y cada pedido queda en `mails`.
  const mails = [];
  let respuestaMail = () => new Response(JSON.stringify({ data: { succeeded: 1, failed: 0 } }), { status: 200 });
  globalThis.fetch = async (url, init) => {
    if (url !== SMTP2GO) throw new Error(`fetch inesperado a ${url}`);
    mails.push({ headers: init.headers, cuerpo: JSON.parse(init.body) });
    return respuestaMail();
  };

  // `after()` de Next: las tareas se guardan y corren cuando el test lo pide,
  // con la respuesta ya armada.
  const pendientes = [];
  const correrPendientes = async () => {
    while (pendientes.length) await pendientes.shift()();
  };

  const estado = {
    carreras: new Map([
      [7, { id: 7, nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología', activa: true }],
      [8, { id: 8, nombre: 'Licenciatura en Administración', nivel: 'Grado', activa: true }],
    ]),
    precios: new Map(),
    errores: {},
    escrituras: [],
    lecturas: [],
    claves: [],
  };

  const supabase = {
    rpc: async (_nombre, args) => { estado.claves.push(args.p_key); return { data: true, error: null }; },
    from: tabla => ({
      insert: async fila => {
        estado.escrituras.push({ tabla, op: 'insert', fila });
        return { error: estado.errores[tabla] ?? null };
      },
      upsert: async (fila, opciones) => {
        estado.escrituras.push({ tabla, op: 'upsert', fila, opciones });
        return { error: estado.errores[tabla] ?? null };
      },
      select: columnas => ({
        eq: (columna, valor) => ({
          maybeSingle: async () => {
            estado.lecturas.push({ tabla, columnas, columna, valor });
            if (estado.errores[`leer:${tabla}`]) return { data: null, error: estado.errores[`leer:${tabla}`] };
            const origen = tabla === 'carreras' ? estado.carreras : tabla === TABLA_PRECIOS ? estado.precios : new Map();
            return { data: origen.get(valor) ?? null, error: null };
          },
        }),
      }),
    }),
  };

  const { POST } = cargarTypescript('app/api/formularios/route.ts', {
    'next/server': { NextResponse: Response, after: tarea => { pendientes.push(tarea); } },
    '@/components/formularios/casas': casas,
    '@/components/formularios/mail-precio': mailPrecio,
    '@/lib/turnstile': { verifyTurnstile: async () => true },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => supabase },
  });

  const enviar = async (payload, kind = 'precio') => {
    const respuesta = await POST(new Request('http://localhost/api/formularios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, token: 'simulado', payload }),
    }));
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  };

  const contestarMail = fn => { respuestaMail = fn; };
  return { estado, enviar, mails, registros, correrPendientes, contestarMail };
}

const pedido = { carreraId: 7, email: 'ana@example.test', newsletter: false };

test('el endpoint rechaza payloads inválidos y carreras sin «ver precio» sin escribir nada', async t => {
  const { estado, enviar } = montarEndpoint(t);
  assert.equal((await enviar({ ...pedido, email: 'mal' })).status, 400);
  assert.equal((await enviar({ ...pedido, carreraId: 8 })).status, 400, 'Siglo 21 todavía no');
  assert.equal((await enviar({ ...pedido, carreraId: 999 })).status, 400, 'carrera inexistente');
  estado.carreras.set(9, { id: 9, nombre: 'Tecnicatura en Venta Directa', nivel: 'Teclab - Gestión', activa: false });
  assert.equal((await enviar({ ...pedido, carreraId: 9 })).status, 400, 'carrera inactiva');
  assert.deepEqual(estado.escrituras, []);
  assert.ok(estado.claves.every(clave => clave.startsWith('precio:')), 'el rate limit tiene su propia cuota');
});

test('el registro entra como consulta de Teclab y devuelve el precio vigente', async t => {
  const { estado, enviar } = montarEndpoint(t);
  estado.precios.set(7, { ...fila, vigente_hasta: '2999-12-31' });

  const { status, cuerpo } = await enviar(pedido);
  assert.equal(status, 201);
  assert.equal(cuerpo.ok, true);
  assert.equal(cuerpo.estado, 'vigente');
  assert.equal(cuerpo.precio.total, '$ 552.359,03');
  assert.deepEqual(cuerpo.precio.conceptos, fila.conceptos);
  assert.equal(cuerpo.precio.vigenteHasta, '2999-12-31');

  assert.equal(estado.escrituras.length, 1, 'sin newsletter no hay suscripción');
  const [lead] = estado.escrituras;
  assert.equal(lead.tabla, 'consultas');
  assert.equal(lead.op, 'insert');
  assert.equal(lead.fila.casa, 'teclab');
  assert.equal(lead.fila.tipo_formulario, FORMULARIO_PRECIO);
  assert.equal(lead.fila.carrera, 'Tecnicatura Superior en Programación');
  assert.equal(lead.fila[columnaDe('email')], 'ana@example.test');
  // El nombre ya no se pide: la columna no viaja y queda en null.
  assert.equal(columnaDe('nombre') in lead.fila, false);
  // Los booleanos van siempre, como en el resto de las consultas.
  assert.equal(lead.fila[columnaDe('equivalencias')], false);

  // El precio se lee de la tabla privada, por la carrera pedida.
  assert.ok(estado.lecturas.some(l => l.tabla === TABLA_PRECIOS && l.columna === 'carrera_id' && l.valor === 7));
});

test('con el checkbox tildado, además suscribe al newsletter de esa carrera', async t => {
  const { estado, enviar } = montarEndpoint(t);
  const { status } = await enviar({ ...pedido, email: 'Ana@Example.Test', newsletter: true });
  assert.equal(status, 201);
  const suscripcion = estado.escrituras.find(e => e.tabla === 'suscripciones_newsletter');
  assert.ok(suscripcion);
  assert.equal(suscripcion.op, 'upsert');
  assert.equal(suscripcion.fila.email, 'ana@example.test');
  assert.equal(suscripcion.fila.carrera_id, 7);
  assert.equal(suscripcion.fila.carrera_nombre, 'Tecnicatura Superior en Programación');
  assert.equal(suscripcion.opciones.onConflict, 'email,carrera_id');
});

test('si falla la suscripción, el lead y el precio salen igual', async t => {
  const { estado, enviar } = montarEndpoint(t);
  estado.precios.set(7, { ...fila, vigente_hasta: '2999-12-31' });
  estado.errores.suscripciones_newsletter = { code: '42501' };
  const { status, cuerpo } = await enviar({ ...pedido, newsletter: true });
  assert.equal(status, 201);
  assert.equal(cuerpo.estado, 'vigente');
});

test('vencido o sin precio, el lead queda registrado y la respuesta no trae montos', async t => {
  const { estado, enviar } = montarEndpoint(t);
  estado.precios.set(7, { ...fila, vigente_hasta: '2000-01-01' });
  let { status, cuerpo } = await enviar(pedido);
  assert.equal(status, 201);
  assert.deepEqual(cuerpo, { ok: true, estado: 'vencido', vigenteHasta: '2000-01-01' });

  estado.precios.clear();
  ({ status, cuerpo } = await enviar(pedido));
  assert.equal(status, 201);
  assert.deepEqual(cuerpo, { ok: true, estado: 'sin-precio' });

  // Si leer la tabla de precios falla, se trata como sin precio: el lead ya entró.
  estado.errores[`leer:${TABLA_PRECIOS}`] = { code: '42501' };
  ({ status, cuerpo } = await enviar(pedido));
  assert.equal(status, 201);
  assert.deepEqual(cuerpo, { ok: true, estado: 'sin-precio' });

  assert.equal(estado.escrituras.filter(e => e.tabla === 'consultas').length, 3);
});

test('si el lead no se guarda, no se muestra el precio', async t => {
  const { estado, enviar } = montarEndpoint(t);
  estado.precios.set(7, { ...fila, vigente_hasta: '2999-12-31' });
  estado.errores.consultas = { code: 'PGRST204' };
  const { status, cuerpo } = await enviar(pedido);
  assert.equal(status, 500);
  assert.equal('precio' in cuerpo, false);
  assert.equal(estado.lecturas.some(l => l.tabla === TABLA_PRECIOS), false);
});

// ── La preinscripción de Teclab trae el precio; el resto de las consultas, no ──

const preinscripcion = {
  email: 'ana@example.test', casa: 'teclab', tipoFormulario: 'preinscripcion',
  carrera: 'Tecnicatura Superior en Programación', carreraId: 7, newsletter: false,
};

test('la preinscripción de Teclab devuelve el precio vigente, con un solo lead', async t => {
  const { estado, enviar } = montarEndpoint(t);
  estado.precios.set(7, { ...fila, vigente_hasta: '2999-12-31' });

  const { status, cuerpo } = await enviar(preinscripcion, 'consulta');
  assert.equal(status, 201);
  assert.deepEqual(cuerpo, {
    ok: true,
    estado: 'vigente',
    precio: { conceptos: fila.conceptos, total: fila.total, nota: fila.nota, vigenteHasta: '2999-12-31' },
  });
  // La consulta no se registra dos veces por traer el precio.
  assert.equal(estado.escrituras.filter(e => e.tabla === 'consultas').length, 1);
  assert.equal(estado.escrituras[0].fila.tipo_formulario, 'preinscripcion');
  assert.ok(estado.lecturas.some(l => l.tabla === TABLA_PRECIOS && l.valor === 7));
});

test('la preinscripción de Teclab con el precio vencido devuelve sólo la vigencia', async t => {
  const { estado, enviar } = montarEndpoint(t);
  estado.precios.set(7, { ...fila, vigente_hasta: '2000-01-01' });
  const { status, cuerpo } = await enviar(preinscripcion, 'consulta');
  assert.equal(status, 201);
  assert.deepEqual(cuerpo, { ok: true, estado: 'vencido', vigenteHasta: '2000-01-01' });
});

test('si no se puede verificar la carrera, la preinscripción ya guardada responde el ok', async t => {
  const { estado, enviar } = montarEndpoint(t);
  estado.precios.set(7, { ...fila, vigente_hasta: '2999-12-31' });
  estado.errores['leer:carreras'] = { code: '42501' };
  const { status, cuerpo } = await enviar(preinscripcion, 'consulta');
  assert.equal(status, 201);
  assert.deepEqual(cuerpo, { ok: true });
  assert.equal(estado.escrituras.filter(e => e.tabla === 'consultas').length, 1);
  assert.equal(estado.lecturas.some(l => l.tabla === TABLA_PRECIOS), false);
});

test('el resto de las consultas responde sólo el ok, sin leer precios', async t => {
  const { estado, enviar } = montarEndpoint(t);
  estado.precios.set(7, { ...fila, vigente_hasta: '2999-12-31' });
  estado.precios.set(8, { ...fila, vigente_hasta: '2999-12-31' });
  for (const payload of [
    { ...preinscripcion, tipoFormulario: 'contacto' },
    { ...preinscripcion, casa: 'siglo21', carreraId: 8 },
    { ...preinscripcion, casa: 'identidad' },
    { ...preinscripcion, carreraId: null },
    // La casa del navegador no alcanza: la carrera 8 es de Siglo 21 en la base.
    { ...preinscripcion, carreraId: 8 },
  ]) {
    const { status, cuerpo } = await enviar(payload, 'consulta');
    assert.equal(status, 201, JSON.stringify(payload));
    assert.deepEqual(cuerpo, { ok: true }, JSON.stringify(payload));
  }
  assert.equal(estado.lecturas.some(l => l.tabla === TABLA_PRECIOS), false);
});

// ── El mail con el resumen del precio (SMTP2GO, después de responder) ──

const CLAVE = 'clave-smtp2go-de-prueba';

test('con precio vigente, «Ver precio» manda un mail por SMTP2GO después de responder', async t => {
  const { estado, enviar, mails, correrPendientes } = montarEndpoint(t);
  process.env.SMTP2GO_API_KEY = CLAVE;
  estado.precios.set(7, { ...fila, vigente_hasta: '2999-12-31' });

  const { status, cuerpo } = await enviar(pedido);
  assert.equal(status, 201);
  assert.equal(cuerpo.estado, 'vigente');
  assert.equal(mails.length, 0, 'la respuesta no espera al mail');

  await correrPendientes();
  assert.equal(mails.length, 1);
  const [mail] = mails;
  assert.equal(mail.headers['X-Smtp2go-Api-Key'], CLAVE);
  assert.equal(mail.headers['Content-Type'], 'application/json');
  assert.deepEqual(mail.cuerpo.to, ['ana@example.test']);
  assert.equal(mail.cuerpo.sender, 'CAU Villa Lugano <inscripciones@siglo21sur.com>');
  assert.equal(mail.cuerpo.subject, 'Precio de Tecnicatura Superior en Programación en Teclab');
  assert.match(mail.cuerpo.html_body, /\$ 552\.359,03/);
  assert.match(mail.cuerpo.text_body, /Promo hasta el 31\/12/);
});

test('la preinscripción de Teclab con precio vigente también manda el mail', async t => {
  const { estado, enviar, mails, correrPendientes } = montarEndpoint(t);
  process.env.SMTP2GO_API_KEY = CLAVE;
  estado.carreras.set(7, {
    ...estado.carreras.get(7), nombre: 'Programación', prefix: 'Tecnicatura Superior',
    nombre_corto: 'Programación', duracion: '2 años',
  });
  estado.precios.set(7, { ...fila, vigente_hasta: '2999-12-31' });

  const { status } = await enviar(preinscripcion, 'consulta');
  assert.equal(status, 201);
  await correrPendientes();
  assert.equal(mails.length, 1);
  assert.deepEqual(mails[0].cuerpo.to, ['ana@example.test']);
  assert.equal(mails[0].cuerpo.subject, 'Precio de Programación en Teclab');
  // La carrera se lee con lo que el mail necesita.
  const lectura = estado.lecturas.find(l => l.tabla === 'carreras');
  for (const columna of ['prefix', 'nombre_corto', 'duracion']) assert.match(lectura.columnas, new RegExp(columna));
});

test('vencido, sin precio o sin mail en la preinscripción, no se manda nada', async t => {
  const { estado, enviar, mails, correrPendientes } = montarEndpoint(t);
  process.env.SMTP2GO_API_KEY = CLAVE;
  estado.precios.set(7, { ...fila, vigente_hasta: '2000-01-01' });
  await enviar(pedido);
  await enviar(preinscripcion, 'consulta');
  estado.precios.clear();
  await enviar(pedido);
  await enviar(preinscripcion, 'consulta');
  estado.precios.set(7, { ...fila, vigente_hasta: '2999-12-31' });
  const { status } = await enviar({ ...preinscripcion, email: '', telefono: '1155555555' }, 'consulta');
  assert.equal(status, 201);
  await correrPendientes();
  assert.equal(mails.length, 0);
});

test('sin SMTP2GO_API_KEY no manda y lo registra, sin tocar la respuesta', async t => {
  const { estado, enviar, mails, registros, correrPendientes } = montarEndpoint(t);
  estado.precios.set(7, { ...fila, vigente_hasta: '2999-12-31' });
  const { status, cuerpo } = await enviar(pedido);
  assert.equal(status, 201);
  assert.equal(cuerpo.estado, 'vigente');
  await correrPendientes();
  assert.equal(mails.length, 0);
  assert.ok(registros.some(r => /SMTP2GO_API_KEY/.test(String(r[0]))), JSON.stringify(registros));
});

test('si SMTP2GO falla o no responde, el lead y el precio salen igual y nada filtra la clave ni el mail', async t => {
  const { estado, enviar, mails, registros, correrPendientes, contestarMail } = montarEndpoint(t);
  process.env.SMTP2GO_API_KEY = CLAVE;
  estado.precios.set(7, { ...fila, vigente_hasta: '2999-12-31' });

  const esperado = (await enviar(pedido)).cuerpo;
  await correrPendientes();

  contestarMail(() => new Response(
    JSON.stringify({ data: { error_code: 'E_ApiResponseCodes.API_EXCEPTION', error: 'falló' } }),
    { status: 500 },
  ));
  const conError = await enviar(pedido);
  assert.equal(conError.status, 201);
  assert.deepEqual(conError.cuerpo, esperado);
  await correrPendientes();

  contestarMail(() => { throw new TypeError('fetch failed'); });
  const caido = await enviar(pedido);
  assert.equal(caido.status, 201);
  assert.deepEqual(caido.cuerpo, esperado);
  await correrPendientes();

  assert.equal(mails.length, 3);
  assert.ok(registros.some(r => /SMTP2GO/.test(String(r[0]))), 'el rechazo queda registrado');
  const salida = JSON.stringify(registros, (_k, v) => (v instanceof Error ? v.message : v));
  assert.equal(salida.includes(CLAVE), false);
  assert.equal(salida.includes('ana@example.test'), false);
});
