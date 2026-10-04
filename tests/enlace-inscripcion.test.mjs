import test from 'node:test';
import assert from 'node:assert/strict';
import * as casas from '../components/formularios/casas.ts';
import * as enlace from '../supabase/functions/notificar/enlace.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

// El insert de la autoinscripción pide el id de vuelta (`.insert().select('id').single()`)
// para la cola del robot: el resultado se puede esperar directo o encadenado.
const conId = resultado => {
  const r = { select: () => r, single: async () => ({ data: resultado.error ? null : { id: 41 }, ...resultado }), then: (a, b) => Promise.resolve(resultado).then(a, b) };
  return r;
};

const {
  ocultarDni, ocultarEmail, estadoEnlace, esCodigoEnlace, propsInscripcionEnlace,
  validarPayloadEnlace, columnaDe, FORMULARIO_AUTOINSCRIPCION, TABLA_ENLACES,
  TABLA_NEWSLETTER,
} = casas;

const CODIGO = 'Ab3dEf6hIj9kLm2nOp5qRs8tUv';
const AHORA = new Date('2026-10-03T15:00:00Z');

// Una preinscripción de Teclab tal como queda en `consultas`.
const consulta = {
  id: 41,
  created_at: '2026-10-03T12:00:00Z',
  casa: 'teclab',
  tipo_formulario: 'preinscripcion',
  tipo: 'Tecnicaturas',
  carrera: 'Tecnicatura Superior en Programación',
  nombre: 'Ana',
  apellido: 'Pérez',
  dni: '30156456',
  sexo: 'Femenino',
  fecha_nacimiento: '1990-04-12',
  localidad_nacimiento: 'CABA',
  nacionalidad: 'Argentina',
  estado_civil: 'Soltero/a',
  direccion: 'Av. Siempre Viva',
  direccion_numero: '742',
  direccion_piso: null,
  direccion_departamento: null,
  codigo_postal: '1439',
  localidad: 'Villa Lugano',
  nivel_estudios: 'Secundario completo',
  colegio: 'Escuela N° 1',
  colegio_localidad: 'CABA',
  email: 'ana@ejemplo.com',
  telefono: '11 5555-1234',
  equivalencias: false,
  medio_pago: null,
};

// ── Lo que se oculta ──

test('el DNI se muestra con los puntos y sólo el principio y el final', () => {
  assert.equal(ocultarDni('30156456'), '30.1••.•56');
  assert.equal(ocultarDni('30.156.456'), '30.1••.•56');
  assert.equal(ocultarDni('1234567'), '1.23•.•67');
  assert.equal(ocultarDni(''), '');
  assert.equal(ocultarDni(null), '');
});

test('el mail deja ver la primera letra y el dominio', () => {
  assert.equal(ocultarEmail('ana@ejemplo.com'), 'a••@ejemplo.com');
  assert.equal(ocultarEmail('Z@x.io'), 'Z••@x.io');
  assert.equal(ocultarEmail('sin-arroba'), '');
  assert.equal(ocultarEmail(undefined), '');
});

// ── Vigencia del enlace ──

test('el enlace vale hasta que vence o se usa', () => {
  const fila = { codigo: CODIGO, consulta_id: 41, vence_at: '2026-10-10T12:00:00Z', usado_at: null };
  assert.equal(estadoEnlace(fila, AHORA), 'valido');
  assert.equal(estadoEnlace(null, AHORA), 'inexistente');
  assert.equal(estadoEnlace({ ...fila, vence_at: '2026-10-03T14:59:59Z' }, AHORA), 'vencido');
  assert.equal(estadoEnlace({ ...fila, vence_at: AHORA.toISOString() }, AHORA), 'vencido');
  assert.equal(estadoEnlace({ ...fila, usado_at: '2026-10-04T10:00:00Z' }, AHORA), 'usado');
  assert.equal(estadoEnlace({ ...fila, usado_at: '2026-10-04T10:00:00Z', vence_at: '2026-01-01T00:00:00Z' }, AHORA), 'usado');
});

test('el código tiene un formato fijo: lo demás no llega a la base', () => {
  assert.equal(esCodigoEnlace(CODIGO), true);
  assert.equal(esCodigoEnlace('corto'), false);
  assert.equal(esCodigoEnlace(`${CODIGO}'; drop`), false);
  assert.equal(esCodigoEnlace(42), false);
});

// ── Lo que llega al navegador ──

test('las props del cliente llevan sólo el resumen oculto, nunca el legajo', () => {
  const props = propsInscripcionEnlace({
    codigo: CODIGO,
    consulta,
    carrera: { nombre: 'Tecnicatura Superior en Programación', url: '/carreras/tecnicatura-superior-en-programacion' },
    filaPrecio: {
      conceptos: [{ concepto: 'Matrícula', monto: '$ 10.000', descuento: 50 }],
      total: '$ 30.000', nota: null, vigente_hasta: '2026-10-31',
    },
    ahora: AHORA,
  });

  assert.deepEqual(props.datos, {
    nombre: 'Ana Pérez',
    dni: '30.1••.•56',
    email: 'a••@ejemplo.com',
    carrera: 'Tecnicatura Superior en Programación',
  });
  assert.equal(props.completo, true);
  assert.equal(props.precio.estado, 'vigente');

  const serializado = JSON.stringify(props);
  for (const privado of ['30156456', '156', 'Siempre Viva', '742', '1439', '5555', 'ana@', 'Escuela', '1990-04-12', 'Femenino']) {
    assert.equal(serializado.includes(privado), false, `${privado} no viaja al navegador`);
  }
});

test('las props conservan el legajo incompleto y el precio vencido como referencia', () => {
  const props = propsInscripcionEnlace({
    codigo: CODIGO,
    consulta: { ...consulta, dni: null },
    carrera: { nombre: 'X', url: '/carreras/x' },
    filaPrecio: { conceptos: [], total: '$ 1', nota: null, vigente_hasta: '2026-10-02' },
    ahora: AHORA,
  });
  assert.equal(props.completo, false);
  assert.deepEqual(props.precio, {
    estado: 'vencido', vigenteHasta: '2026-10-02',
    precio: { conceptos: [], total: '$ 1', nota: null, vigenteHasta: '2026-10-02' },
  });
});

test('el payload por enlace pide sólo un código válido; el medio de pago ya no se pide', () => {
  assert.deepEqual(validarPayloadEnlace({ codigo: CODIGO }), { codigo: CODIGO, newsletter: false });
  assert.deepEqual(validarPayloadEnlace({ codigo: CODIGO, newsletter: true }), { codigo: CODIGO, newsletter: true });
  // Lo que mande una página vieja en caché se ignora.
  assert.deepEqual(validarPayloadEnlace({ codigo: CODIGO, medioPago: { medio: 'Bitcoin' } }), { codigo: CODIGO, newsletter: false });
  assert.equal(validarPayloadEnlace({ codigo: 'x' }), null);
  assert.equal(validarPayloadEnlace({}), null);
});

// ── El endpoint, con Supabase simulado en memoria ──

/** Un PostgREST mínimo: filtra con eq/in/is y aplica update e insert. */
function baseEnMemoria(tablas, escrituras) {
  return {
    rpc: async () => ({ data: true, error: null }),
    from(tabla) {
      const filtros = [];
      let cambios = null;
      const filas = () => (tablas[tabla] ?? []).filter(fila => filtros.every(filtro => filtro(fila)));
      const consulta = {
        select: () => consulta,
        eq: (columna, valor) => { filtros.push(fila => fila[columna] === valor); return consulta; },
        in: (columna, valores) => { filtros.push(fila => valores.includes(fila[columna])); return consulta; },
        is: (columna, valor) => { filtros.push(fila => fila[columna] === valor); return consulta; },
        limit: () => consulta,
        maybeSingle: async () => ({ data: filas()[0] ?? null, error: null }),
        update: valores => { cambios = valores; return consulta; },
        insert: fila => { escrituras.push({ tabla, op: 'insert', fila }); return conId({ error: tablas.errorInsert ?? null }); },
        upsert: async fila => { escrituras.push({ tabla, op: 'upsert', fila }); return { error: null }; },
        then(resolver, rechazar) {
          const afectadas = filas();
          if (cambios) {
            for (const fila of afectadas) Object.assign(fila, cambios);
            escrituras.push({ tabla, op: 'update', cambios, filas: afectadas.length });
          }
          return Promise.resolve({ data: afectadas, error: null }).then(resolver, rechazar);
        },
      };
      return consulta;
    },
  };
}

function montarEndpoint(t, { enlaceFila = {}, consultaFila = {} } = {}) {
  const anteriores = Object.fromEntries(['NODE_ENV', 'TURNSTILE_SECRET_KEY'].map(k => [k, process.env[k]]));
  const logError = console.error;
  t.after(() => {
    console.error = logError;
    for (const [k, v] of Object.entries(anteriores)) {
      if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  });
  console.error = () => {};
  process.env.NODE_ENV = 'production';
  process.env.TURNSTILE_SECRET_KEY = 'prueba-simulada';

  const tablas = {
    [TABLA_ENLACES]: [{ codigo: CODIGO, consulta_id: 41, vence_at: '2099-01-01T00:00:00Z', usado_at: null, ...enlaceFila }],
    consultas: [{ ...consulta, ...consultaFila }],
    carreras: [
      { id: 8, nombre: 'Tecnicatura Superior en Programación', nivel: 'Grado' },
      { id: 7, nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología' },
    ],
  };
  const escrituras = [];
  const supabase = baseEnMemoria(tablas, escrituras);

  const { POST } = cargarTypescript('app/api/formularios/route.ts', {
    'next/server': { NextResponse: Response },
    '@/components/formularios/casas': casas,
    '@/lib/turnstile': { verifyTurnstile: async () => true },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => supabase },
  });

  const enviar = async payload => {
    const respuesta = await POST(new Request('http://localhost/api/formularios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'enlace', token: 'simulado', payload }),
    }));
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  };
  return { tablas, escrituras, enviar };
}

const pedido = { codigo: CODIGO };

test('por enlace, la autoinscripción entra con los datos guardados, sin medio de pago, y el enlace queda usado', async t => {
  const { tablas, escrituras, enviar } = montarEndpoint(t);
  const { status, cuerpo } = await enviar(pedido);
  assert.equal(status, 201);
  assert.deepEqual(cuerpo, { ok: true });

  const insert = escrituras.find(e => e.op === 'insert');
  assert.equal(insert.tabla, 'consultas');
  assert.equal(insert.fila.tipo_formulario, FORMULARIO_AUTOINSCRIPCION);
  assert.equal(insert.fila.casa, 'teclab');
  assert.equal(insert.fila.carrera, 'Tecnicatura Superior en Programación');
  assert.equal('medio_pago' in insert.fila, false, 'el portal de Teclab pide la tarjeta');
  assert.equal(insert.fila[columnaDe('dni')], '30156456');
  assert.equal(insert.fila[columnaDe('domicilio')], 'Av. Siempre Viva');
  assert.equal(insert.fila[columnaDe('email')], 'ana@ejemplo.com');
  assert.equal('id' in insert.fila, false, 'el id de la preinscripción no se copia');

  assert.ok(tablas[TABLA_ENLACES][0].usado_at, 'el enlace queda marcado');
  assert.equal(escrituras.some(e => e.tabla === TABLA_NEWSLETTER), false, 'sin newsletter explícito no suscribe');

  // El mismo enlace no sirve dos veces.
  const segunda = await enviar(pedido);
  assert.equal(segunda.status, 400);
  assert.equal(escrituras.filter(e => e.op === 'insert').length, 1);
});

test('por enlace, uno vencido, usado o inexistente se rechaza sin escribir', async t => {
  for (const [nombre, opciones] of [
    ['vencido', { enlaceFila: { vence_at: '2020-01-01T00:00:00Z' } }],
    ['usado', { enlaceFila: { usado_at: '2026-10-01T00:00:00Z' } }],
    ['de otra casa', { consultaFila: { casa: 'siglo21' } }],
    ['legajo incompleto', { consultaFila: { dni: null } }],
  ]) {
    await t.test(nombre, async st => {
      const { escrituras, enviar } = montarEndpoint(st, opciones);
      assert.equal((await enviar(pedido)).status, 400);
      assert.equal(escrituras.length, 0);
    });
  }
  await t.test('inexistente o con código mal formado', async st => {
    const { escrituras, enviar } = montarEndpoint(st);
    assert.equal((await enviar({ ...pedido, codigo: 'Zz3dEf6hIj9kLm2nOp5qRs8tUv' })).status, 400);
    assert.equal((await enviar({ ...pedido, codigo: 'corto' })).status, 400);
    assert.equal(escrituras.length, 0);
  });
});

test('por enlace, si el insert falla el enlace se libera para reintentar', async t => {
  const { tablas, enviar } = montarEndpoint(t);
  tablas.errorInsert = { code: 'PGRST204' };
  assert.equal((await enviar(pedido)).status, 500);
  assert.equal(tablas[TABLA_ENLACES][0].usado_at, null);
});

// ── La Edge Function `notificar` ──

test('el código del enlace es al azar, largo y sin caracteres que rompan el Markdown de Telegram', () => {
  const vistos = new Set();
  for (let i = 0; i < 200; i++) {
    const codigo = enlace.nuevoCodigo();
    assert.match(codigo, /^[A-Za-z0-9]{32}$/);
    assert.equal(esCodigoEnlace(codigo), true, 'el formato coincide con el que acepta el sitio');
    vistos.add(codigo);
  }
  assert.equal(vistos.size, 200);
});

test('sólo las preinscripciones de Teclab llevan enlace', () => {
  assert.equal(enlace.correspondeEnlace('consultas', consulta), true);
  assert.equal(enlace.correspondeEnlace('consultas', { ...consulta, casa: 'siglo21' }), false);
  assert.equal(enlace.correspondeEnlace('consultas', { ...consulta, tipo_formulario: 'autoinscripcion' }), false);
  assert.equal(enlace.correspondeEnlace('consultas', { ...consulta, id: undefined }), false);
  assert.equal(enlace.correspondeEnlace('faq_preguntas', consulta), false);
});

test('el aviso suma el enlace; si crearlo falla, el aviso sale igual', async () => {
  const pedidos = [];
  const fetchOk = async (url, init) => { pedidos.push({ url, init }); return new Response(null, { status: 201 }); };
  const texto = await enlace.agregarEnlace('AVISO', consulta, {
    supabaseUrl: 'https://proyecto.supabase.co',
    serviceRoleKey: 'clave-simulada',
    sitioUrl: 'https://www.siglo21sur.com/',
    fetch: fetchOk,
    generar: () => CODIGO,
  });
  assert.equal(texto, `AVISO\n\n🔗 *Enlace para inscribirse:* https://www.siglo21sur.com/inscripcion/${CODIGO}`);
  assert.equal(pedidos[0].url, 'https://proyecto.supabase.co/rest/v1/enlaces_inscripcion');
  assert.deepEqual(JSON.parse(pedidos[0].init.body), { codigo: CODIGO, consulta_id: 41 });
  assert.equal(pedidos[0].init.headers.Authorization, 'Bearer clave-simulada');

  const errores = [];
  const deps = { supabaseUrl: 'https://p.supabase.co', serviceRoleKey: 'k', sitioUrl: 'https://x', log: (...a) => errores.push(a) };
  assert.equal(await enlace.agregarEnlace('AVISO', consulta, { ...deps, fetch: async () => new Response('no', { status: 401 }) }), 'AVISO');
  assert.equal(await enlace.agregarEnlace('AVISO', consulta, { ...deps, fetch: async () => { throw new Error('red'); } }), 'AVISO');
  assert.equal(await enlace.agregarEnlace('AVISO', consulta, { ...deps, serviceRoleKey: '' }), 'AVISO');
  assert.equal(errores.length, 3);
  assert.equal(await enlace.agregarEnlace('AVISO', { ...consulta, casa: 'siglo21' }, deps), 'AVISO');
});
