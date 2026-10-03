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
  validarPayloadAutoinscripcion, carreraConAutoinscripcion, columnaDe,
  FORMULARIO_AUTOINSCRIPCION, TIPO_AUTOINSCRIPCION, TABLA_NEWSLETTER,
} = casas;

// Una preinscripción de Teclab completa, con lo que manda el paso 1.
const datos = {
  casa: 'teclab',
  tipoFormulario: 'preinscripcion',
  nombre: 'Ana',
  apellido: 'Pérez',
  dni: '30.123.456',
  sexo: 'Femenino',
  fechaNacimiento: '1990-04-12',
  lugarNacimiento: 'CABA',
  nacionalidad: 'Argentina',
  estadoCivil: 'Soltero/a',
  domicilio: 'Av. Siempre Viva',
  domicilioNumero: '742',
  domicilioPiso: '',
  domicilioDepartamento: '',
  codigoPostal: '1439',
  localidad: 'Villa Lugano',
  nivelEstudios: 'Secundario completo',
  colegio: 'Escuela N° 1',
  colegioLocalidad: 'CABA',
  email: 'ana@example.test',
  telefono: '11 1234-5678',
};

const pedido = { ...datos, carreraId: 7, newsletter: false };

// ── Lógica pura ──

test('el payload exige carrera, DNI y los obligatorios del paso 1; el medio de pago ya no se pide', () => {
  assert.deepEqual(validarPayloadAutoinscripcion(pedido), {
    carreraId: 7, email: 'ana@example.test', newsletter: false,
  });
  assert.equal(validarPayloadAutoinscripcion({ ...pedido, newsletter: true }).newsletter, true);
  assert.equal(validarPayloadAutoinscripcion({ ...pedido, newsletter: 'true' }).newsletter, false);
  // Un medio de pago que mande un navegador viejo se ignora: ni suma ni rechaza.
  assert.deepEqual(
    validarPayloadAutoinscripcion({ ...pedido, medioPago: { medio: 'Bitcoin' } }),
    validarPayloadAutoinscripcion(pedido),
  );
  // Piso y depto son opcionales por lo que son.
  const sinOpcionales = { ...pedido };
  delete sinOpcionales.domicilioPiso;
  delete sinOpcionales.domicilioDepartamento;
  assert.ok(validarPayloadAutoinscripcion(sinOpcionales));

  for (const [motivo, malo] of [
    ['sin carrera', { ...pedido, carreraId: undefined }],
    ['carrera no entera', { ...pedido, carreraId: '7' }],
    ['sin DNI', { ...pedido, dni: '' }],
    ['DNI corto', { ...pedido, dni: '1234' }],
    ['sin nombre', { ...pedido, nombre: '   ' }],
    ['sin colegio', { ...pedido, colegio: '' }],
    ['sin fecha', { ...pedido, fechaNacimiento: undefined }],
    ['nacionalidad inventada', { ...pedido, nacionalidad: 'Marciana' }],
    ['mail inválido', { ...pedido, email: 'no-es-mail' }],
    ['teléfono inválido', { ...pedido, telefono: 'abc' }],
  ]) {
    assert.equal(validarPayloadAutoinscripcion(malo), null, motivo);
  }
});

test('sólo las carreras de Teclab admiten autoinscripción', () => {
  assert.equal(carreraConAutoinscripcion({ nivel: 'Teclab - Tecnología' }), true);
  assert.equal(carreraConAutoinscripcion({ nivel: 'Teclab - Gestión' }), true);
  assert.equal(carreraConAutoinscripcion({ nivel: 'Teclab - Curso' }), true);
  assert.equal(carreraConAutoinscripcion({ nivel: 'Grado' }), false);
  assert.equal(carreraConAutoinscripcion({ nivel: 'Identidad Argentina' }), false);
  assert.equal(carreraConAutoinscripcion({ nivel: 'Posgrado' }), false);
});

// ── El endpoint, con Supabase simulado ──

function montarEndpoint(t) {
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

  const estado = {
    carreras: new Map([
      [7, { id: 7, nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología' }],
      [8, { id: 8, nombre: 'Licenciatura en Administración', nivel: 'Grado' }],
      [9, { id: 9, nombre: 'Diplomatura en Oratoria', nivel: 'Identidad Argentina' }],
    ]),
    escrituras: [],
    claves: [],
  };

  const supabase = {
    rpc: async (_nombre, args) => { estado.claves.push(args.p_key); return { data: true, error: null }; },
    from: tabla => ({
      insert: fila => { estado.escrituras.push({ tabla, op: 'insert', fila }); return conId({ error: null }); },
      upsert: async fila => { estado.escrituras.push({ tabla, op: 'upsert', fila }); return { error: null }; },
      select: () => ({
        eq: (_columna, valor) => ({
          maybeSingle: async () => ({ data: tabla === 'carreras' ? estado.carreras.get(valor) ?? null : null, error: null }),
        }),
      }),
    }),
  };

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
      body: JSON.stringify({ kind: 'autoinscripcion', token: 'simulado', payload }),
    }));
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  };

  return { estado, enviar };
}

test('el endpoint rechaza payloads inválidos y carreras que no son de Teclab sin escribir nada', async t => {
  const { estado, enviar } = montarEndpoint(t);
  assert.equal((await enviar({ ...pedido, dni: '' })).status, 400);
  assert.equal((await enviar({ ...pedido, carreraId: 8 })).status, 400, 'Siglo 21');
  assert.equal((await enviar({ ...pedido, carreraId: 9 })).status, 400, 'Identidad Argentina');
  assert.equal((await enviar({ ...pedido, carreraId: 999 })).status, 400, 'carrera inexistente');
  assert.deepEqual(estado.escrituras, []);
  assert.ok(estado.claves.every(clave => clave.startsWith('autoinscripcion:')), 'el rate limit tiene su propia cuota');
});

test('la autoinscripción entra como consulta de Teclab marcada, sin medio de pago', async t => {
  const { estado, enviar } = montarEndpoint(t);
  const { status, cuerpo } = await enviar({
    ...pedido,
    // Lo que diga el navegador sobre la carrera no manda: sale de la base.
    carrera: 'Otra cosa',
    // Un navegador con la versión anterior en caché todavía lo puede mandar.
    medioPago: { medio: 'Tarjeta de crédito', banco: 'Galicia', marca: 'Visa' },
  });
  assert.equal(status, 201);
  assert.deepEqual(cuerpo, { ok: true });

  assert.equal(estado.escrituras.length, 1, 'sin newsletter no hay suscripción');
  const { tabla, fila } = estado.escrituras[0];
  assert.equal(tabla, 'consultas');
  assert.equal(fila.tipo_formulario, FORMULARIO_AUTOINSCRIPCION);
  assert.equal(fila.tipo_formulario, 'autoinscripcion');
  assert.equal(fila.tipo, TIPO_AUTOINSCRIPCION);
  assert.equal(fila.casa, 'teclab');
  assert.equal(fila.carrera, 'Tecnicatura Superior en Programación');
  assert.equal('medio_pago' in fila, false, 'el portal de Teclab pide la tarjeta: no se guarda medio de pago');
  assert.equal(fila[columnaDe('dni')], '30123456');
  assert.equal(fila[columnaDe('colegio')], 'Escuela N° 1');
  assert.equal(fila[columnaDe('email')], 'ana@example.test');
  assert.equal(fila[columnaDe('equivalencias')], false, 'Teclab no acredita equivalencias');
  for (const ajeno of ['newsletter', 'carreraId', 'medioPago']) {
    assert.equal(ajeno in fila, false, `${ajeno} no llega a consultas`);
  }
});

test('con el checkbox, la autoinscripción suscribe al newsletter de la carrera', async t => {
  const { estado, enviar } = montarEndpoint(t);
  assert.equal((await enviar({ ...pedido, email: 'Ana@Example.test', newsletter: true })).status, 201);
  assert.equal(estado.escrituras.length, 2);
  const suscripcion = estado.escrituras[1];
  assert.equal(suscripcion.tabla, TABLA_NEWSLETTER);
  assert.equal(suscripcion.op, 'upsert');
  assert.equal(suscripcion.fila.email, 'ana@example.test');
  assert.equal(suscripcion.fila.carrera_id, 7);
});
