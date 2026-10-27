import test from 'node:test';
import assert from 'node:assert/strict';
import * as casas from '../components/formularios/casas.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

// El modo demo de formularios (`NEXT_PUBLIC_FORMULARIOS_DEMO=1`) deja recorrer
// en local todos los pasos sin captcha y sin escribir nada. Sólo vale con
// `NODE_ENV=development`: fuera de ahí, la bandera no cambia nada.

const VARIABLES = ['NODE_ENV', 'TURNSTILE_SECRET_KEY', 'NEXT_PUBLIC_FORMULARIOS_DEMO', 'NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL'];

const legajoTeclab = {
  casa: 'teclab', tipoFormulario: 'preinscripcion',
  nombre: 'Ana', apellido: 'Pérez', dni: '30.123.456', sexo: 'Femenino',
  fechaNacimiento: '1990-04-12', lugarNacimiento: 'CABA', nacionalidad: 'Argentina',
  estadoCivil: 'Soltero/a', domicilio: 'Av. Siempre Viva', domicilioNumero: '742',
  domicilioPiso: '', domicilioDepartamento: '', codigoPostal: '1439', localidad: 'Villa Lugano',
  nivelEstudios: 'Secundario completo', colegio: 'Escuela N° 1', colegioLocalidad: 'CABA',
  email: 'ana@example.test', telefono: '11 1234-5678',
};

function montar(t, entorno) {
  const anteriores = Object.fromEntries(VARIABLES.map(k => [k, process.env[k]]));
  const logError = console.error;
  const logInfo = console.info;
  t.after(() => {
    console.error = logError;
    console.info = logInfo;
    for (const [k, v] of Object.entries(anteriores)) {
      if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  });
  for (const k of VARIABLES) delete process.env[k];
  Object.assign(process.env, entorno);

  const llamadas = { supabase: 0, turnstile: 0, after: 0, fetch: 0 };
  const infos = [];
  console.error = () => {};
  console.info = (...args) => { infos.push(args.map(String).join(' ')); };
  t.mock.method(globalThis, 'fetch', async () => { llamadas.fetch++; throw new Error('Red no permitida'); });

  const tabla = () => {
    const q = {
      select: () => q, eq: () => q, ilike: () => q, gte: () => q, limit: () => q, in: () => q, is: () => q,
      maybeSingle: async () => ({ data: null, error: null }),
      single: async () => ({ data: { id: 1 }, error: null }),
      insert: () => q, update: () => q, upsert: async () => ({ error: null }),
      then: resolver => resolver({ data: [], error: null }),
    };
    return q;
  };
  const { POST } = cargarTypescript('app/api/formularios/route.ts', {
    'next/server': { NextResponse: Response, after: () => { llamadas.after++; } },
    '@/components/formularios/casas': casas,
    '@/lib/formularios-demo': cargarTypescript('lib/formularios-demo.ts', {}),
    '@/lib/turnstile': { verifyTurnstile: async () => { llamadas.turnstile++; return false; } },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => {
      llamadas.supabase++;
      return { rpc: async () => ({ data: true, error: null }), from: tabla };
    } },
  });
  const enviar = async cuerpo => {
    const respuesta = await POST(new Request('http://localhost/api/formularios', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo),
    }));
    return { status: respuesta.status, datos: await respuesta.json() };
  };
  return { enviar, llamadas, infos };
}

const DEMO_DEV = { NODE_ENV: 'development', NEXT_PUBLIC_FORMULARIOS_DEMO: '1' };

test('demo en desarrollo: 201 por cada kind sin Supabase, Turnstile, red ni tareas diferidas', async t => {
  const { enviar, llamadas, infos } = montar(t, DEMO_DEV);
  const envios = [
    { kind: 'consulta', token: 'demo', payload: { casa: 'siglo21', tipoFormulario: 'contacto', email: 'ana@example.test', newsletter: true } },
    { kind: 'consulta', token: 'demo', payload: { ...legajoTeclab, carreraId: 7, newsletter: true } },
    { kind: 'faq', token: 'demo', payload: { titulo: '¿Cuándo empiezan las clases?', contacto: 'ana@example.test' } },
    { kind: 'clase', token: 'demo', payload: { rows: [{ materia_id: '00000000-0000-0000-0000-000000000001', telefono: '11 1234-5678', dias: ['Lunes'], horarios: ['10:00-11:00'] }] } },
    { kind: 'precio', token: 'demo', payload: { carreraId: 7, email: 'ana@example.test', newsletter: true } },
  ];
  for (const cuerpo of envios) {
    const { status, datos } = await enviar(cuerpo);
    assert.equal(status, 201, `${cuerpo.kind}: ${JSON.stringify(datos)}`);
    assert.equal(datos.ok, true);
  }
  assert.deepEqual(llamadas, { supabase: 0, turnstile: 0, after: 0, fetch: 0 });
  // Un aviso de una línea por envío, sin datos personales.
  assert.equal(infos.length, envios.length);
  for (const linea of infos) {
    assert.match(linea, /demo/i);
    assert.doesNotMatch(linea, /ana@example|Pérez|30\.123|1234-5678/);
  }
});

test('demo en desarrollo: «Ver precio» y la preinscripción traen el precio de la casa', async t => {
  const { enviar } = montar(t, DEMO_DEV);
  const hoy = casas.fechaArgentina(new Date());

  const precio = await enviar({ kind: 'precio', token: 'demo', payload: { carreraId: 7, email: 'ana@example.test' } });
  assert.equal(precio.status, 201);
  assert.equal(precio.datos.estado, 'vigente');
  assert.ok(precio.datos.precio.conceptos.length > 0);
  assert.match(precio.datos.precio.total, /^\$ /);
  assert.match(precio.datos.precio.vigenteHasta, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(precio.datos.precio.vigenteHasta >= hoy);
  assert.match(JSON.stringify(precio.datos.precio), /demo/i, 'el precio se reconoce como de demo');

  const teclab = await enviar({ kind: 'consulta', token: 'demo', payload: { ...legajoTeclab, carreraId: 7 } });
  assert.equal(teclab.status, 201);
  assert.equal(teclab.datos.estado, 'vigente');
  assert.deepEqual(teclab.datos.precio, precio.datos.precio);

  // Siglo 21 también publica precio: la preinscripción lo trae igual.
  const siglo = await enviar({ kind: 'consulta', token: 'demo', payload: { casa: 'siglo21', tipoFormulario: 'preinscripcion', email: 'ana@example.test', carreraId: 3 } });
  assert.equal(siglo.datos.estado, 'vigente');
  assert.deepEqual(siglo.datos.precio, precio.datos.precio);
  // Identidad no está en CASAS_CON_PRECIO: sólo el ok.
  const identidad = await enviar({ kind: 'consulta', token: 'demo', payload: { casa: 'identidad', tipoFormulario: 'preinscripcion', email: 'ana@example.test', carreraId: 5 } });
  assert.deepEqual(identidad.datos, { ok: true });
  // Los contactos responden sólo el ok, como en real.
  const contactoTeclab = await enviar({ kind: 'consulta', token: 'demo', payload: { casa: 'teclab', tipoFormulario: 'contacto', email: 'ana@example.test', carreraId: 7 } });
  assert.deepEqual(contactoTeclab.datos, { ok: true });
});

test('demo en desarrollo: un sobre o un payload inválido sigue dando 400', async t => {
  const { enviar, llamadas } = montar(t, DEMO_DEV);
  const invalidos = [
    { kind: 'desconocido', token: 'demo', payload: {} },
    { kind: 'consulta', payload: { email: 'ana@example.test' } },
    { kind: 'consulta', token: 'demo', payload: { telefono: 'abc' } },
    { kind: 'consulta', token: 'demo', payload: {} },
    { kind: 'faq', token: 'demo', payload: { titulo: 'Hola', contacto: '' } },
    { kind: 'clase', token: 'demo', payload: { rows: [null] } },
    { kind: 'precio', token: 'demo', payload: { carreraId: 7, email: 'no-es-un-mail' } },
    // Los kinds de la autoinscripción están dados de baja: 400 como cualquier
    // otro sobre desconocido, aunque el payload venga completo.
    { kind: 'autoinscripcion', token: 'demo', payload: { ...legajoTeclab, carreraId: 7 } },
    { kind: 'enlace', token: 'demo', payload: { codigo: 'Ab3dEf6hIj9kLm2nOp5qRs8tUv' } },
  ];
  for (const cuerpo of invalidos) {
    assert.equal((await enviar(cuerpo)).status, 400, JSON.stringify(cuerpo));
  }
  assert.deepEqual(llamadas, { supabase: 0, turnstile: 0, after: 0, fetch: 0 });
});

test('fuera de desarrollo la bandera no cambia nada', async t => {
  await t.test('producción sin secreto: 503, como siempre', async t => {
    const { enviar, llamadas, infos } = montar(t, { NODE_ENV: 'production', NEXT_PUBLIC_FORMULARIOS_DEMO: '1' });
    const { status } = await enviar({ kind: 'consulta', token: 'demo', payload: { casa: 'siglo21', tipoFormulario: 'contacto', email: 'ana@example.test' } });
    assert.equal(status, 503);
    assert.equal(llamadas.supabase, 0);
    assert.equal(infos.length, 0);
  });

  await t.test('producción con secreto: el token de demo pasa por Turnstile y se rechaza', async t => {
    const { enviar, llamadas } = montar(t, { NODE_ENV: 'production', NEXT_PUBLIC_FORMULARIOS_DEMO: '1', TURNSTILE_SECRET_KEY: 'prueba-simulada' });
    const consulta = await enviar({ kind: 'consulta', token: 'demo', payload: { casa: 'siglo21', tipoFormulario: 'contacto', email: 'ana@example.test' } });
    assert.equal(consulta.status, 403);
    assert.equal(llamadas.turnstile, 1);
    assert.ok(llamadas.supabase > 0, 'la cuota corre como en real');
    // Un kind dado de baja ni siquiera llega al captcha: rebota en el sobre.
    const auto = await enviar({ kind: 'autoinscripcion', token: 'demo', payload: { ...legajoTeclab, carreraId: 7 } });
    assert.equal(auto.status, 400, 'la autoinscripción ya no existe');
  });

  await t.test('test (NODE_ENV=test) tampoco activa la demo', async t => {
    const { enviar } = montar(t, { NODE_ENV: 'test', NEXT_PUBLIC_FORMULARIOS_DEMO: '1' });
    const { status } = await enviar({ kind: 'precio', token: 'demo', payload: { carreraId: 7, email: 'ana@example.test' } });
    assert.equal(status, 503);
  });

  await t.test('desarrollo con la bandera en 0: comportamiento normal', async t => {
    const { enviar } = montar(t, { NODE_ENV: 'development', NEXT_PUBLIC_FORMULARIOS_DEMO: '0' });
    const { status } = await enviar({ kind: 'precio', token: 'demo', payload: { carreraId: 7, email: 'ana@example.test' } });
    assert.equal(status, 503);
  });
});

test('el helper de la bandera exige desarrollo y el valor 1', async t => {
  const anteriores = Object.fromEntries(VARIABLES.map(k => [k, process.env[k]]));
  t.after(() => {
    for (const [k, v] of Object.entries(anteriores)) {
      if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  });
  const { formulariosDemoActivo, TOKEN_DEMO } = cargarTypescript('lib/formularios-demo.ts', {});
  assert.equal(typeof TOKEN_DEMO, 'string');
  const casos = [
    ['development', '1', true], ['development', '0', false], ['development', undefined, false],
    ['development', 'true', false], ['production', '1', false], ['test', '1', false], [undefined, '1', false],
  ];
  for (const [entorno, bandera, esperado] of casos) {
    if (entorno === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = entorno;
    if (bandera === undefined) delete process.env.NEXT_PUBLIC_FORMULARIOS_DEMO; else process.env.NEXT_PUBLIC_FORMULARIOS_DEMO = bandera;
    assert.equal(formulariosDemoActivo(), esperado, `${entorno}/${bandera}`);
  }
});
