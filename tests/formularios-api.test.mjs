import test from 'node:test';
import assert from 'node:assert/strict';
import * as casas from '../components/formularios/casas.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

test('el endpoint valida el sobre, captcha, cuota y resultado de escritura', async t => {
  const anteriores = Object.fromEntries(['NODE_ENV', 'TURNSTILE_SECRET_KEY', 'NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL'].map(k => [k, process.env[k]]));
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
  let captcha = true, cuota = true, errorBase = null;
  const filas = [];
  let verificaciones = 0;
  const { POST } = cargarTypescript('app/api/formularios/route.ts', {
    'next/server': { NextResponse: Response },
    '@/components/formularios/casas': casas,
    '@/lib/turnstile': { verifyTurnstile: async () => { verificaciones++; return captcha; } },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => ({
      rpc: async () => ({ data: cuota, error: null }),
      from: tabla => ({ insert: async fila => { filas.push({ tabla, fila }); return { error: errorBase }; } }),
    }) },
  });
  const enviar = cuerpo => POST(new Request('http://localhost/api/formularios', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: cuerpo,
  }));
  const valido = { kind: 'consulta', token: 'simulado', payload: { email: 'prueba@example.test', casa: 'siglo21', tipoFormulario: 'contacto' } };
  for (const cuerpo of ['{', 'null', '[]', '1', JSON.stringify({ ...valido, payload: [] }), JSON.stringify({ ...valido, payload: null })]) {
    assert.equal((await enviar(cuerpo)).status, 400, cuerpo);
  }
  // Los kinds de la autoinscripción se dieron de baja el 27/10/2026: rebotan en
  // el sobre, antes del captcha y de la cuota.
  for (const kind of ['autoinscripcion', 'enlace']) {
    const cuerpo = JSON.stringify({ kind, token: 'simulado', payload: { ...valido.payload, dni: '30123456', codigo: 'Ab3dEf6hIj9kLm2nOp5qRs8tUv' } });
    assert.equal((await enviar(cuerpo)).status, 400, kind);
  }
  assert.equal(verificaciones, 0);
  assert.equal(filas.length, 0);
  captcha = false;
  assert.equal((await enviar(JSON.stringify(valido))).status, 403);
  captcha = true; cuota = false;
  assert.equal((await enviar(JSON.stringify(valido))).status, 429);
  assert.equal(filas.length, 0);
  cuota = true;
  assert.equal((await enviar(JSON.stringify({ ...valido, payload: { telefono: 'abc' } }))).status, 400);
  assert.equal((await enviar(JSON.stringify({ kind: 'clase', token: 'simulado', payload: { rows: [null] } }))).status, 400);
  errorBase = { code: 'PGRST204' };
  assert.equal((await enviar(JSON.stringify(valido))).status, 500);
  errorBase = null;
  assert.equal((await enviar(JSON.stringify(valido))).status, 201);
  assert.equal(filas.at(-1).tabla, 'consultas');
  assert.equal(filas.at(-1).fila[casas.columnaDe('email')], 'prueba@example.test');
  assert.equal((await enviar(JSON.stringify({ ...valido, payload: { ...valido.payload, casa: 'toString' } }))).status, 201);
  assert.equal(filas.at(-1).fila.casa, null);

  delete process.env.TURNSTILE_SECRET_KEY;
  process.env.NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL = '1';
  const sinCaptcha = JSON.stringify({ ...valido, token: 'rate-limit-only' });
  const cantidad = filas.length;
  assert.equal((await enviar(sinCaptcha)).status, 503, 'producción nunca acepta el modo local');
  assert.equal(filas.length, cantidad);
  process.env.NODE_ENV = 'development';
  process.env.NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL = '0';
  assert.equal((await enviar(sinCaptcha)).status, 503);
  process.env.NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL = '1';
  assert.equal((await enviar(sinCaptcha)).status, 201);
});

// Caracterización de las filas: el handler real corre sin red ni tareas externas.
function montarFilas(t) {
  const anterior = process.env.TURNSTILE_SECRET_KEY;
  process.env.TURNSTILE_SECRET_KEY = 'prueba-simulada';
  t.after(() => {
    if (anterior === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = anterior;
  });
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Red no permitida en esta prueba'); });
  const filas = [];
  const carrera = { id: 7, nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología', activa: true, proximamente: false };
  const supabase = {
    rpc: async () => ({ data: true, error: null }),
    from: tabla => {
      const consulta = {
        select: () => consulta,
        eq: () => consulta,
        maybeSingle: async () => ({ data: tabla === 'carreras' ? carrera : null, error: null }),
        insert: fila => { filas.push({ tabla, fila }); return consulta; },
        single: async () => ({ data: { id: 41 }, error: null }),
        then: resolver => resolver({ error: null }),
      };
      return consulta;
    },
  };
  const { POST } = cargarTypescript('app/api/formularios/route.ts', {
    'next/server': { NextResponse: Response, after: () => {} },
    '@/components/formularios/casas': casas,
    '@/lib/turnstile': { verifyTurnstile: async () => true },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => supabase },
  });
  const enviar = async (payload, kind = 'consulta') => {
    const respuesta = await POST(new Request('http://localhost/api/formularios', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, token: 'simulado', payload }),
    }));
    assert.equal(respuesta.status, 201, JSON.stringify(await respuesta.json()));
    assert.equal(filas.at(-1).tabla, 'consultas');
    return filas.at(-1).fila;
  };
  return { enviar, carrera };
}

const datosPersonales = {
  nombre: 'Ana', apellido: 'Pérez', tipoDocumento: 'DNI', dni: '30.123.456',
  sexo: 'Femenino', fechaNacimiento: '1990-04-12', lugarNacimiento: 'CABA',
  nacionalidad: 'Argentina', estadoCivil: 'Soltero/a', paisResidencia: 'Argentina',
  tipoDomicilio: 'Particular', domicilio: 'Calle de prueba', domicilioNumero: '742',
  domicilioPiso: '2', domicilioDepartamento: 'A', torre: '1', barrio: 'Lugano',
  codigoPostal: '1439', provincia: 'Buenos Aires', localidad: 'CABA',
  nivelEstudios: 'Secundario completo', colegio: 'Escuela de prueba', colegioLocalidad: 'CABA',
  equivalencias: true, email: 'ana@example.test', telefono: '11 1234-5678',
};

function esperadosDe(campos) {
  return Object.fromEntries(campos.map(campo => [casas.columnaDe(campo),
    campo === 'dni' ? '30123456' : datosPersonales[campo]]));
}

test('las tres casas y los dos modos mantienen campos, valores y exclusiones exactos', async t => {
  const { enviar } = montarFilas(t);
  for (const casa of ['siglo21', 'teclab', 'identidad']) {
    for (const tipoFormulario of ['contacto', 'preinscripcion']) {
      const campos = casas.camposDe(casa, tipoFormulario);
      const fila = await enviar({ ...datosPersonales, casa, tipoFormulario,
        nombre: '  Ana  ', carrera: ' Carrera elegida ', tipo: ' Consulta ',
        id: 999, direccion: 'Columna sin campo', created_at: 'no guardar', ajeno: 'no guardar' });
      assert.deepEqual(fila, {
        carrera: 'Carrera elegida', tipo: 'Consulta', casa, tipo_formulario: tipoFormulario,
        ...esperadosDe(campos), equivalencias: campos.includes('equivalencias'),
      }, `${casa}/${tipoFormulario}`);
    }
  }
});

test('el legado sin discriminadores conserva la unión de campos y la tolerancia de DNI y opciones', async t => {
  const { enviar } = montarFilas(t);
  const campos = [...new Set(Object.values(casas.CASAS).flatMap(casa => [...casa.contacto, ...casa.preinscripcion]))];
  for (const discriminadores of [{}, { casa: 'desconocida', tipoFormulario: 'inválido' }]) {
    const fila = await enviar({ ...datosPersonales, ...discriminadores,
      dni: '123', sexo: 'opción ajena', nacionalidad: 42, domicilioPiso: {}, ajeno: true });
    assert.deepEqual(fila, {
      carrera: null, tipo: null, casa: null, tipo_formulario: null,
      ...esperadosDe(campos), dni: null, sexo: null, nacionalidad: null, direccion_piso: null,
    });
  }
});

test('sólo true booleano activa el checkbox; ausente o fuera de la casa queda false', async t => {
  const { enviar } = montarFilas(t);
  for (const equivalencias of [true, false, 'true', 'false', 1, 0, {}, null, undefined]) {
    const fila = await enviar({ email: 'ana@example.test', casa: 'siglo21', tipoFormulario: 'contacto', equivalencias });
    assert.equal(fila.equivalencias, equivalencias === true);
  }
  for (const casa of ['teclab', 'identidad']) {
    const fila = await enviar({ email: 'ana@example.test', casa, tipoFormulario: 'contacto', equivalencias: true });
    assert.equal(fila.equivalencias, false);
  }
});

test('«Ver precio» mantiene la fila exacta sin copiar claves del navegador', async t => {
  const { enviar, carrera } = montarFilas(t);
  assert.deepEqual(await enviar({ ...datosPersonales, carreraId: 7, carrera: 'Otra', casa: 'siglo21', id: 999 }, 'precio'), {
    carrera: carrera.nombre, tipo: casas.TIPO_PRECIO, casa: 'teclab',
    tipo_formulario: casas.FORMULARIO_PRECIO, email: datosPersonales.email, equivalencias: false,
  });
});
