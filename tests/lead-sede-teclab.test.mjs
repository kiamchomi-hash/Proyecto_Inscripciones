import test from 'node:test';
import assert from 'node:assert/strict';
import * as casas from '../components/formularios/casas.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

// El insert de la autoinscripción pide el id de vuelta (`.insert().select('id').single()`)
// para la cola del robot: el resultado se puede esperar directo o encadenado.
const conId = resultado => {
  const r = { select: () => r, single: async () => ({ data: resultado.error ? null : { id: 41 }, ...resultado }), then: (a, b) => Promise.resolve(resultado).then(a, b) };
  return r;
};

const {
  carreraHubspotDe, provinciaHubspotDe, camposLeadSede, pedidoLeadSede,
  LEAD_SEDE_URL, LEAD_SEDE_FORMULARIO, TABLA_ENLACES,
} = casas;

// ── Lógica pura ──

test('las carreras de Teclab se traducen a la opción exacta de la landing', () => {
  for (const [nuestra, opcion] of [
    ['Tecnicatura Superior en Programación', 'Programación'],
    ['Tecnicatura Superior en Cloud Administration', 'Administración de servicios en la nube (Cloud Administration)'],
    ['Técnico Superior en Administración de Servicios en la Nube', 'Administración de servicios en la nube (Cloud Administration)'],
    ['Tecnicatura Superior en Seguros', 'Seguros'],
    ['Tecnicatura Superior en Productor Asesor de Seguros (P.A.S.)', 'Seguros'],
    ['Tecnicatura Superior en Gestión Agraria', 'Gestion de la empresa agraria'],
    ['Tecnicatura Superior en Gestión de la Empresa Agraria', 'Gestion de la empresa agraria'],
    ['Actualización Profesional en Inteligencia Artificial', 'Curso Inteligencia Artificial'],
    ['Tecnicatura Superior en Data Science', 'Data Science'],
    ['Tecnicatura Superior en Seguridad Informática', 'Seguridad informática'],
    ['Tecnicatura Superior en Redes Informáticas', 'Redes informáticas'],
    ['Tecnicatura Superior en Quality Assurance', 'Quality Assurance'],
    ['Tecnicatura Superior en Marketing Digital', 'Marketing Digital'],
    ['Tecnicatura Superior en Inbound Marketing', 'Inbound Marketing'],
    ['Tecnicatura Superior en Customer Experience', 'Customer Experience'],
    ['Tecnicatura Superior en Experiencia del Cliente', 'Customer Experience'],
    ['Tecnicatura Superior en Gestión Contable', 'Gestion contable'],
    ['Tecnicatura Superior en Relaciones Laborales', 'Relaciones laborales'],
    ['Tecnicatura Superior en Gestión Hotelera', 'Gestion hotelera'],
    ['Tecnicatura Superior en Planificación y Organización de Eventos', 'Planificacion y organizacion de eventos'],
    ['Tecnicatura Superior en Periodismo y Nuevas Tecnologías', 'Periodismo y nuevas tecnologías'],
  ]) {
    assert.equal(carreraHubspotDe(nuestra), opcion, nuestra);
  }
  // Venta Directa salió de la oferta y la landing no la tiene.
  assert.equal(carreraHubspotDe('Tecnicatura Superior en Venta Directa'), null);
  assert.equal(carreraHubspotDe('Licenciatura en Administración'), null);
  assert.equal(carreraHubspotDe(''), null);
  assert.equal(carreraHubspotDe(null), null);
});

test('la provincia se normaliza a la lista de la landing; CABA es Buenos Aires', () => {
  for (const [texto, opcion] of [
    ['Córdoba', 'Cordoba'],
    ['  entre ríos ', 'Entre Rios'],
    ['RIO NEGRO', 'Río Negro'],
    ['Tucumán', 'Tucuman'],
    ['Buenos Aires', 'Buenos Aires'],
    ['Provincia de Buenos Aires', 'Buenos Aires'],
    ['CABA', 'Buenos Aires'],
    ['C.A.B.A.', 'Buenos Aires'],
    ['Capital Federal', 'Buenos Aires'],
    ['Ciudad Autónoma de Buenos Aires', 'Buenos Aires'],
    ['Ciudad de Buenos Aires', 'Buenos Aires'],
    ['Tierra del Fuego', 'Tierra del Fuego'],
  ]) {
    assert.equal(provinciaHubspotDe(texto), opcion, texto);
  }
  for (const desconocida of ['Villa Lugano', 'Montevideo', '', null, undefined]) {
    assert.equal(provinciaHubspotDe(desconocida), null, String(desconocida));
  }
});

test('los campos del alta llevan los ocultos y omiten lo que no tiene opción', () => {
  const campos = camposLeadSede({
    carrera: 'Tecnicatura Superior en Programación',
    nombre: ' Ana ', apellido: 'Pérez', email: 'ana@example.test', telefono: '11 1234-5678',
    localidad: 'CABA',
  });
  const porNombre = Object.fromEntries(campos.map(c => [c.name, c.value]));
  assert.ok(campos.every(c => c.objectTypeId === '0-1'));
  assert.deepEqual(porNombre, {
    firstname: 'Ana',
    lastname: 'Pérez',
    email: 'ana@example.test',
    phone: '+54 11 1234-5678',
    carrera: 'Programación',
    provincia: 'Buenos Aires',
    token_landings: LEAD_SEDE_FORMULARIO,
    empresas_form: LEAD_SEDE_FORMULARIO,
  });
  assert.equal('cuando_te_recibis_' in porNombre, false);

  const sinProvincia = camposLeadSede({ carrera: 'Tecnicatura Superior en Seguros', email: 'a@b.co', localidad: 'Villa Lugano' });
  assert.equal(sinProvincia.some(c => c.name === 'provincia'), false);
  assert.equal(sinProvincia.some(c => c.name === 'phone'), false, 'vacío no viaja');

  // Sin prefijo, el portal de Teclab toma `11 …` como un número de Estados Unidos.
  const tel = t => camposLeadSede({ carrera: 'Tecnicatura Superior en Seguros', email: 'a@b.co', telefono: t }).find(c => c.name === 'phone').value;
  assert.equal(tel('011 1234-5678'), '+54 11 1234-5678');
  assert.equal(tel('54 9 11 1234-5678'), '+54 9 11 1234-5678');
  assert.equal(tel('+54 9 351 123-4567'), '+54 9 351 123-4567');

  assert.equal(camposLeadSede({ carrera: 'Tecnicatura Superior en Venta Directa', email: 'a@b.co' }), null);
  assert.equal(camposLeadSede({ carrera: 'Tecnicatura Superior en Seguros', email: 'no-es-mail' }), null);
});

test('el pedido apunta al formulario de la sede con el contexto de la landing', () => {
  const pedido = pedidoLeadSede({ carrera: 'Tecnicatura Superior en Seguros', email: 'a@b.co' });
  assert.equal(pedido.url, `https://api.hsforms.com/submissions/v3/integration/submit/5880041/${LEAD_SEDE_FORMULARIO}`);
  assert.equal(LEAD_SEDE_URL, pedido.url);
  assert.deepEqual(pedido.body.context, {
    pageUri: 'https://vinculacion.teclab.edu.ar/expo-bs-as-esposito',
    pageName: 'EXPO BS AS ESPOSITO',
  });
  assert.ok(Array.isArray(pedido.body.fields));
  assert.equal(pedidoLeadSede({ carrera: 'Otra', email: 'a@b.co' }), null);
});

// ── El endpoint, con Supabase y HubSpot simulados ──

const legajo = {
  casa: 'teclab', tipoFormulario: 'preinscripcion',
  nombre: 'Ana', apellido: 'Pérez', dni: '30.123.456', sexo: 'Femenino',
  fechaNacimiento: '1990-04-12', lugarNacimiento: 'CABA', nacionalidad: 'Argentina',
  estadoCivil: 'Soltero/a', domicilio: 'Av. Siempre Viva', domicilioNumero: '742',
  domicilioPiso: '', domicilioDepartamento: '', codigoPostal: '1439', localidad: 'CABA',
  nivelEstudios: 'Secundario completo', colegio: 'Escuela N° 1', colegioLocalidad: 'CABA',
  email: 'ana@example.test', telefono: '11 1234-5678',
};

const CODIGO = 'Ab3dEf6hIj9kLm2nOp5qRs8tUv';

/** Un PostgREST mínimo en memoria: filtros eq/in/is, update, insert y upsert. */
function baseEnMemoria(tablas) {
  return {
    rpc: async () => ({ data: true, error: null }),
    from(tabla) {
      const filtros = [];
      let cambios = null;
      const filas = () => (tablas[tabla] ?? []).filter(fila => filtros.every(f => f(fila)));
      const q = {
        select: () => q,
        eq: (c, v) => { filtros.push(f => f[c] === v); return q; },
        in: (c, vs) => { filtros.push(f => vs.includes(f[c])); return q; },
        is: (c, v) => { filtros.push(f => f[c] === v); return q; },
        limit: () => q,
        maybeSingle: async () => ({ data: filas()[0] ?? null, error: null }),
        update: valores => { cambios = valores; return q; },
        insert: fila => { (tablas.escrituras ??= []).push({ tabla, fila }); return conId({ error: null }); },
        upsert: async () => ({ error: null }),
        then(resolver, rechazar) {
          const afectadas = filas();
          if (cambios) for (const fila of afectadas) Object.assign(fila, cambios);
          return Promise.resolve({ data: afectadas, error: null }).then(resolver, rechazar);
        },
      };
      return q;
    },
  };
}

function montarEndpoint(t, respuestaHubspot = async () => new Response('{}', { status: 200 })) {
  const anteriores = Object.fromEntries(['NODE_ENV', 'TURNSTILE_SECRET_KEY'].map(k => [k, process.env[k]]));
  const logError = console.error;
  const logWarn = console.warn;
  const errores = [];
  t.after(() => {
    console.error = logError;
    console.warn = logWarn;
    for (const [k, v] of Object.entries(anteriores)) {
      if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  });
  console.error = (...args) => errores.push(args);
  console.warn = (...args) => errores.push(args);
  process.env.NODE_ENV = 'production';
  process.env.TURNSTILE_SECRET_KEY = 'prueba-simulada';

  const tablas = {
    carreras: [{ id: 7, nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología' }],
    consultas: [{
      id: 41, casa: 'teclab', tipo_formulario: 'preinscripcion',
      carrera: 'Tecnicatura Superior en Programación',
      nombre: 'Ana', apellido: 'Pérez', dni: '30123456', sexo: 'Femenino',
      fecha_nacimiento: '1990-04-12', localidad_nacimiento: 'CABA', nacionalidad: 'Argentina',
      estado_civil: 'Soltero/a', direccion: 'Av. Siempre Viva', direccion_numero: '742',
      direccion_piso: null, direccion_departamento: null, codigo_postal: '1439', localidad: 'Villa Lugano',
      nivel_estudios: 'Secundario completo', colegio: 'Escuela N° 1', colegio_localidad: 'CABA',
      email: 'ana@ejemplo.com', telefono: '11 5555-1234',
    }],
    [TABLA_ENLACES]: [{ codigo: CODIGO, consulta_id: 41, vence_at: '2099-01-01T00:00:00Z', usado_at: null }],
  };
  const supabase = baseEnMemoria(tablas);

  // Nada sale a la red: `fetch` queda simulado y `after` sólo encola.
  const llamadas = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    llamadas.push({ url: String(url), init, cuerpo: JSON.parse(init.body) });
    return respuestaHubspot();
  });
  const programadas = [];

  const { POST } = cargarTypescript('app/api/formularios/route.ts', {
    'next/server': { NextResponse: Response, after: tarea => { programadas.push(tarea); } },
    '@/components/formularios/casas': casas,
    '@/lib/turnstile': { verifyTurnstile: async () => true },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => supabase },
  });

  const enviar = async (kind, payload) => {
    const respuesta = await POST(new Request('http://localhost/api/formularios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, token: 'simulado', payload }),
    }));
    // Lo que `after` corre con la respuesta ya enviada.
    await Promise.all(programadas.splice(0).map(tarea => tarea()));
    return respuesta.status;
  };

  return { enviar, llamadas, errores, tablas };
}

test('una autoinscripción guardada da de alta el lead en la landing de la sede una sola vez', async t => {
  const { enviar, llamadas } = montarEndpoint(t);
  assert.equal(await enviar('autoinscripcion', { ...legajo, carreraId: 7 }), 201);

  assert.equal(llamadas.length, 1);
  const [{ url, init, cuerpo }] = llamadas;
  assert.equal(url, LEAD_SEDE_URL);
  assert.equal(init.method, 'POST');
  assert.equal(init.headers['Content-Type'], 'application/json');
  assert.ok(init.signal, 'lleva un timeout');
  const porNombre = Object.fromEntries(cuerpo.fields.map(c => [c.name, c.value]));
  assert.equal(porNombre.carrera, 'Programación');
  assert.equal(porNombre.email, 'ana@example.test');
  assert.equal(porNombre.firstname, 'Ana');
  assert.equal(porNombre.lastname, 'Pérez');
  assert.equal(porNombre.phone, '+54 11 1234-5678');
  assert.equal(porNombre.provincia, 'Buenos Aires');
  assert.equal(porNombre.token_landings, LEAD_SEDE_FORMULARIO);
  assert.equal(cuerpo.context.pageUri, 'https://vinculacion.teclab.edu.ar/expo-bs-as-esposito');
});

test('la autoinscripción por enlace también da de alta el lead', async t => {
  const { enviar, llamadas } = montarEndpoint(t);
  assert.equal(await enviar('enlace', { codigo: CODIGO }), 201);
  assert.equal(llamadas.length, 1);
  const porNombre = Object.fromEntries(llamadas[0].cuerpo.fields.map(c => [c.name, c.value]));
  assert.equal(porNombre.email, 'ana@ejemplo.com');
  assert.equal(porNombre.carrera, 'Programación');
  assert.equal('provincia' in porNombre, false, 'Villa Lugano no es una provincia');
});

test('si HubSpot falla o no contesta, la autoinscripción responde 201 igual y no se loguean datos personales', async t => {
  for (const [motivo, respuesta] of [
    ['error 400', async () => new Response('{"status":"error"}', { status: 400 })],
    ['timeout', async () => { throw new DOMException('timeout', 'TimeoutError'); }],
    ['red caída', async () => { throw new TypeError('fetch failed'); }],
  ]) {
    await t.test(motivo, async st => {
      const { enviar, llamadas, errores } = montarEndpoint(st, respuesta);
      assert.equal(await enviar('autoinscripcion', { ...legajo, carreraId: 7 }), 201);
      assert.equal(llamadas.length, 1);
      assert.ok(errores.length >= 1, 'el fallo queda registrado');
      const logueado = JSON.stringify(errores, (_k, v) => (v instanceof Error ? v.message : v));
      for (const dato of ['ana@example.test', 'Pérez', '1234-5678']) {
        assert.equal(logueado.includes(dato), false, `no loguea ${dato}`);
      }
    });
  }
});

test('una carrera sin opción en la landing no llama a HubSpot y la autoinscripción entra igual', async t => {
  const { enviar, llamadas, tablas } = montarEndpoint(t);
  tablas.carreras[0].nombre = 'Tecnicatura Superior en Venta Directa';
  assert.equal(await enviar('autoinscripcion', { ...legajo, carreraId: 7 }), 201);
  assert.equal(llamadas.length, 0);
});

test('una consulta común no da de alta el lead en la landing', async t => {
  const { enviar, llamadas } = montarEndpoint(t);
  assert.equal(await enviar('consulta', {
    casa: 'teclab', tipoFormulario: 'contacto', carrera: 'Tecnicatura Superior en Programación',
    nombre: 'Ana', apellido: 'Pérez', email: 'ana@example.test', telefono: '11 1234-5678',
  }), 201);
  assert.equal(llamadas.length, 0);
});
