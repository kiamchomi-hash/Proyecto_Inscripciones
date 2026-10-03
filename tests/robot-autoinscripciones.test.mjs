import test from 'node:test';
import assert from 'node:assert/strict';
import * as casas from '../components/formularios/casas.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const {
  TABLA_ROBOT, MAX_DETALLE_ROBOT, columnaDe,
  despachoRobot, validarResultadoRobot, idRobot,
} = casas;

const REPO = 'kiamchomi-hash/cau-robot-teclab';
const SECRETO = 'secreto-de-prueba';

// ── Lógica pura ──

test('el despacho a GitHub lleva sólo el id y se omite sin repo o sin token', () => {
  const pedido = despachoRobot(REPO, 'tok', 5);
  assert.equal(pedido.url, `https://api.github.com/repos/${REPO}/dispatches`);
  assert.equal(pedido.init.method, 'POST');
  assert.equal(pedido.init.headers.Authorization, 'Bearer tok');
  assert.equal(pedido.init.headers.Accept, 'application/vnd.github+json');
  assert.equal(pedido.init.headers['X-GitHub-Api-Version'], '2022-11-28');
  assert.deepEqual(JSON.parse(pedido.init.body), { event_type: 'autoinscripcion', client_payload: { id: 5 } });

  assert.equal(despachoRobot(undefined, 'tok', 5), null);
  assert.equal(despachoRobot(REPO, undefined, 5), null);
  assert.equal(despachoRobot('no es un repo', 'tok', 5), null);
});

test('el resultado del robot se valida y el detalle se trunca', () => {
  assert.deepEqual(validarResultadoRobot({ id: 3, estado: 'cargada' }), { id: 3, estado: 'cargada', detalle: '' });
  assert.equal(validarResultadoRobot({ id: 3, estado: 'error', detalle: 'x'.repeat(500) }).detalle.length, MAX_DETALLE_ROBOT);
  for (const malo of [null, [], {}, { id: 0, estado: 'cargada' }, { id: 3, estado: 'pendiente' }, { id: 'tres', estado: 'error' }]) {
    assert.equal(validarResultadoRobot(malo), null, JSON.stringify(malo));
  }
  assert.equal(idRobot('12'), 12);
  assert.equal(idRobot('-1'), null);
  assert.equal(idRobot('1.5'), null);
});

// ── Supabase en memoria ──

const consulta = {
  id: 41, casa: 'teclab', tipo_formulario: 'autoinscripcion',
  carrera: 'Tecnicatura Superior en Programación',
  nombre: 'Ana', apellido: 'Pérez', dni: '30123456', sexo: 'Femenino',
  fecha_nacimiento: '1990-04-12', localidad_nacimiento: 'CABA', nacionalidad: 'Argentina',
  estado_civil: 'Soltero/a', direccion: 'Av. Siempre Viva', direccion_numero: '742',
  direccion_piso: null, direccion_departamento: null, codigo_postal: '1439', localidad: 'Villa Lugano',
  nivel_estudios: 'Secundario completo', colegio: 'Escuela N° 1', colegio_localidad: 'CABA',
  email: 'ana_perez@example.test', telefono: '11 1234-5678',
};

/** Un PostgREST mínimo: filtros, orden, tope, update e insert con `.select().single()`. */
function baseEnMemoria(tablas, fallas = {}) {
  const escrituras = [];
  let siguienteId = 100;
  const cliente = {
    rpc: async () => ({ data: true, error: null }),
    from(tabla) {
      const filtros = [];
      let cambios = null;
      let tope = Infinity;
      const filas = () => (tablas[tabla] ??= []).filter(fila => filtros.every(filtro => filtro(fila)));
      const q = {
        select: () => q,
        eq: (c, v) => { filtros.push(f => f[c] === v); return q; },
        in: (c, vs) => { filtros.push(f => vs.includes(f[c])); return q; },
        is: (c, v) => { filtros.push(f => f[c] === v); return q; },
        order: () => q,
        limit: n => { tope = n; return q; },
        maybeSingle: async () => ({ data: filas()[0] ?? null, error: null }),
        update: valores => { cambios = valores; return q; },
        upsert: async () => ({ error: null }),
        insert: fila => {
          if (fallas.insert?.[tabla]) throw fallas.insert[tabla];
          const error = fallas.error?.[tabla] ?? null;
          const nueva = error ? null : { id: tabla === 'consultas' ? 41 : siguienteId++, ...fila };
          if (nueva) {
            tablas[tabla].push(nueva);
            escrituras.push({ tabla, op: 'insert', fila });
          }
          const resultado = { data: nueva && { id: nueva.id }, error };
          const r = { select: () => r, single: async () => resultado, then: (a, b) => Promise.resolve(resultado).then(a, b) };
          return r;
        },
        then(resolver, rechazar) {
          const afectadas = filas().slice(0, tope);
          if (cambios) {
            for (const fila of afectadas) Object.assign(fila, cambios);
            escrituras.push({ tabla, op: 'update', cambios, filas: afectadas.length });
          }
          return Promise.resolve({ data: afectadas, error: null }).then(resolver, rechazar);
        },
      };
      return q;
    },
  };
  return { cliente, escrituras };
}

function entorno(t, valores) {
  const anteriores = Object.fromEntries(Object.keys(valores).map(k => [k, process.env[k]]));
  t.after(() => {
    for (const [k, v] of Object.entries(anteriores)) {
      if (v === undefined) delete process.env[k]; else process.env[k] = v;
    }
  });
  for (const [k, v] of Object.entries(valores)) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
}

function capturarLogs(t) {
  const logs = [];
  const originales = { error: console.error, warn: console.warn, info: console.info };
  t.after(() => Object.assign(console, originales));
  console.error = (...args) => logs.push(args);
  console.warn = (...args) => logs.push(args);
  console.info = (...args) => logs.push(args);
  return logs;
}

const sinDatosPersonales = logs => {
  const texto = JSON.stringify(logs, (_k, v) => (v instanceof Error ? v.message : v));
  for (const dato of ['ana_perez@example.test', 'ana@example.test', 'Pérez', '30123456', '1234-5678']) {
    assert.equal(texto.includes(dato), false, `no loguea ${dato}`);
  }
};

// ── Al guardar la autoinscripción ──

const legajo = {
  casa: 'teclab', tipoFormulario: 'preinscripcion',
  nombre: 'Ana', apellido: 'Pérez', dni: '30.123.456', sexo: 'Femenino',
  fechaNacimiento: '1990-04-12', lugarNacimiento: 'CABA', nacionalidad: 'Argentina',
  estadoCivil: 'Soltero/a', domicilio: 'Av. Siempre Viva', domicilioNumero: '742',
  domicilioPiso: '', domicilioDepartamento: '', codigoPostal: '1439', localidad: 'CABA',
  nivelEstudios: 'Secundario completo', colegio: 'Escuela N° 1', colegioLocalidad: 'CABA',
  email: 'ana@example.test', telefono: '11 1234-5678', carreraId: 7,
};

function montarFormularios(t, { robot = true, fallas = {}, respuestaGithub } = {}) {
  entorno(t, {
    NODE_ENV: 'production',
    TURNSTILE_SECRET_KEY: 'prueba-simulada',
    ROBOT_GITHUB_REPO: robot ? REPO : undefined,
    ROBOT_GITHUB_TOKEN: robot ? 'tok-github' : undefined,
  });
  const logs = capturarLogs(t);
  const tablas = {
    carreras: [{ id: 7, nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología' }],
    consultas: [],
    [TABLA_ROBOT]: [],
  };
  const { cliente, escrituras } = baseEnMemoria(tablas, fallas);

  // Nada sale a la red: GitHub y HubSpot quedan simulados.
  const github = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    if (String(url).startsWith('https://api.github.com/')) {
      github.push({ url: String(url), init });
      return respuestaGithub ? respuestaGithub() : new Response(null, { status: 204 });
    }
    return new Response('{}', { status: 200 });
  });
  const programadas = [];
  const { POST } = cargarTypescript('app/api/formularios/route.ts', {
    'next/server': { NextResponse: Response, after: tarea => { programadas.push(tarea); } },
    '@/components/formularios/casas': casas,
    '@/lib/turnstile': { verifyTurnstile: async () => true },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => cliente },
  });

  const enviar = async () => {
    const respuesta = await POST(new Request('http://localhost/api/formularios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'autoinscripcion', token: 'simulado', payload: legajo }),
    }));
    await Promise.all(programadas.splice(0).map(tarea => tarea()));
    return respuesta.status;
  };
  return { enviar, tablas, escrituras, github, logs };
}

test('la autoinscripción guardada crea la fila del robot y lo despacha sólo con el id', async t => {
  const { enviar, tablas, github, logs } = montarFormularios(t);
  assert.equal(await enviar(), 201);

  assert.equal(tablas[TABLA_ROBOT].length, 1);
  const fila = tablas[TABLA_ROBOT][0];
  assert.deepEqual(Object.keys(fila).sort(), ['consulta_id', 'id']);
  assert.equal(fila.consulta_id, 41);

  assert.equal(github.length, 1);
  const [{ url, init }] = github;
  assert.equal(url, `https://api.github.com/repos/${REPO}/dispatches`);
  assert.equal(init.headers.Authorization, 'Bearer tok-github');
  assert.ok(init.signal, 'lleva un timeout');
  assert.deepEqual(JSON.parse(init.body), { event_type: 'autoinscripcion', client_payload: { id: fila.id } });
  sinDatosPersonales(logs);
});

test('sin token ni repo no despacha: la fila queda pendiente y se avisa en el registro', async t => {
  const { enviar, tablas, github, logs } = montarFormularios(t, { robot: false });
  assert.equal(await enviar(), 201);
  assert.equal(tablas[TABLA_ROBOT].length, 1);
  assert.equal(github.length, 0);
  assert.ok(logs.some(args => String(args[0]).includes('Robot')), 'queda registrado');
});

test('si falla la fila del robot o el despacho, la autoinscripción responde 201 igual', async t => {
  for (const [motivo, opciones, despachos] of [
    ['error de base', { fallas: { error: { [TABLA_ROBOT]: { code: '42P01' } } } }, 0],
    ['excepción al insertar', { fallas: { insert: { [TABLA_ROBOT]: new Error('caída') } } }, 0],
    ['GitHub 401', { respuestaGithub: async () => new Response('no', { status: 401 }) }, 1],
    ['GitHub caído', { respuestaGithub: async () => { throw new TypeError('fetch failed'); } }, 1],
  ]) {
    await t.test(motivo, async st => {
      const { enviar, tablas, github, logs } = montarFormularios(st, opciones);
      assert.equal(await enviar(), 201);
      assert.equal(tablas.consultas.length, 1, 'la consulta quedó guardada');
      assert.equal(github.length, despachos);
      assert.ok(logs.length >= 1, 'el fallo queda registrado');
      sinDatosPersonales(logs);
    });
  }
});

// ── El endpoint del robot ──

function montarRobot(t, { secreto = SECRETO, filas = [], telegram = async () => 'enviado' } = {}) {
  // `null` deja la variable sin definir: `undefined` tomaría el valor por defecto.
  entorno(t, { ROBOT_SECRET: secreto ?? undefined });
  const logs = capturarLogs(t);
  const tablas = { consultas: [{ ...consulta }], [TABLA_ROBOT]: filas.map(f => ({ consulta_id: 41, intentos: 0, detalle: null, ...f })) };
  const { cliente, escrituras } = baseEnMemoria(tablas);
  const avisos = [];
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('no debería salir a la red'); });

  const { GET, POST } = cargarTypescript('app/api/robot/autoinscripciones/route.ts', {
    'next/server': { NextResponse: Response },
    '@/components/formularios/casas': casas,
    '@/lib/supabase-admin': { createSupabaseAdmin: () => cliente },
    '@/lib/telegram': { enviarTelegram: async texto => { avisos.push(texto); return telegram(); } },
  });

  const autorizacion = { Authorization: `Bearer ${SECRETO}` };
  const pedir = async (consultaUrl = '', headers = autorizacion) => {
    const respuesta = await GET(new Request(`http://localhost/api/robot/autoinscripciones${consultaUrl}`, { headers }));
    return { status: respuesta.status, cuerpo: await respuesta.json(), respuesta };
  };
  const informar = async (cuerpo, headers = autorizacion) => {
    const respuesta = await POST(new Request('http://localhost/api/robot/autoinscripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
    }));
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  };
  return { pedir, informar, tablas, escrituras, avisos, logs };
}

test('sin ROBOT_SECRET responde 503 y con un secreto equivocado 401', async t => {
  await t.test('sin configurar', async st => {
    const { pedir, informar } = montarRobot(st, { secreto: null });
    assert.equal((await pedir('?id=1')).status, 503);
    assert.equal((await informar({ id: 1, estado: 'cargada' })).status, 503);
  });
  await t.test('secreto equivocado o ausente', async st => {
    const { pedir, informar, escrituras } = montarRobot(st, { filas: [{ id: 1, estado: 'pendiente' }] });
    assert.equal((await pedir('?id=1', { Authorization: 'Bearer otro' })).status, 401);
    assert.equal((await pedir('?id=1', {})).status, 401);
    assert.equal((await pedir('?id=1', { Authorization: SECRETO })).status, 401);
    assert.equal((await informar({ id: 1, estado: 'cargada' }, { Authorization: 'Bearer otro' })).status, 401);
    assert.deepEqual(escrituras, []);
  });
});

test('GET con id devuelve el legajo sólo de una fila pendiente o con error', async t => {
  const { pedir } = montarRobot(t, {
    filas: [
      { id: 1, estado: 'pendiente' },
      { id: 2, estado: 'error', intentos: 1 },
      { id: 3, estado: 'cargada', intentos: 1 },
    ],
  });

  const { status, cuerpo, respuesta } = await pedir('?id=1');
  assert.equal(status, 200);
  assert.equal(respuesta.headers.get('cache-control'), 'no-store');
  assert.equal(cuerpo.id, 1);
  assert.equal(cuerpo.estado, 'pendiente');
  assert.equal(cuerpo.intentos, 0);
  assert.equal(cuerpo.carrera, 'Tecnicatura Superior en Programación');
  assert.equal(cuerpo.datos.dni, consulta[columnaDe('dni')]);
  assert.equal(cuerpo.datos.lugarNacimiento, 'CABA');
  assert.equal(cuerpo.datos.domicilio, 'Av. Siempre Viva');
  assert.equal(cuerpo.datos.colegioLocalidad, 'CABA');
  assert.equal(cuerpo.datos.email, 'ana_perez@example.test');
  assert.equal(cuerpo.datos.domicilioPiso, '');

  assert.equal((await pedir('?id=2')).cuerpo.estado, 'error');
  assert.equal((await pedir('?id=3')).status, 404);
  assert.equal((await pedir('?id=99')).status, 404);
  assert.equal((await pedir('?id=abc')).status, 400);
});

test('GET sin id lista los pendientes, con tope', async t => {
  const filas = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, consulta_id: i + 1, estado: 'pendiente' }));
  filas.push({ id: 30, consulta_id: 30, estado: 'cargada' }, { id: 31, consulta_id: 31, estado: 'error' });
  const { pedir } = montarRobot(t, { filas });
  const { status, cuerpo } = await pedir();
  assert.equal(status, 200);
  assert.equal(cuerpo.ids.length, 20);
  assert.ok(cuerpo.ids.every(id => id <= 25));
});

test('POST cargada actualiza la fila sin avisar', async t => {
  const { informar, tablas, avisos } = montarRobot(t, { filas: [{ id: 1, estado: 'pendiente' }] });
  const { status, cuerpo } = await informar({ id: 1, estado: 'cargada', detalle: 'ok' });
  assert.equal(status, 200);
  assert.deepEqual(cuerpo, { ok: true, id: 1, estado: 'cargada', intentos: 0 });
  const fila = tablas[TABLA_ROBOT][0];
  assert.equal(fila.estado, 'cargada');
  assert.equal(fila.detalle, 'ok');
  assert.ok(fila.updated_at);
  assert.equal(avisos.length, 0);
});

test('POST error suma un intento, trunca el detalle y avisa por Telegram para cargarla a mano', async t => {
  const { informar, tablas, avisos } = montarRobot(t, { filas: [{ id: 2, estado: 'pendiente', intentos: 1 }] });
  const { status, cuerpo } = await informar({ id: 2, estado: 'error', detalle: `No encontró la localidad ${'x'.repeat(400)}` });
  assert.equal(status, 200);
  assert.equal(cuerpo.intentos, 2);
  assert.equal(cuerpo.aviso, 'enviado');
  const fila = tablas[TABLA_ROBOT][0];
  assert.equal(fila.estado, 'error');
  assert.equal(fila.intentos, 2);
  assert.equal(fila.detalle.length, MAX_DETALLE_ROBOT);

  assert.equal(avisos.length, 1);
  for (const dato of ['Ana Pérez', '30123456', 'ana_perez@example.test', 'Tecnicatura Superior en Programación', 'No encontró la localidad', 'intento 2']) {
    assert.ok(avisos[0].includes(dato), `el aviso incluye ${dato}`);
  }
});

test('POST error responde ok aunque Telegram falle, y rechaza cuerpos inválidos o filas cerradas', async t => {
  const { informar, logs } = montarRobot(t, {
    filas: [{ id: 2, estado: 'pendiente' }, { id: 3, estado: 'cargada' }],
    telegram: async () => 'error HTTP 500',
  });
  const { status, cuerpo } = await informar({ id: 2, estado: 'error', detalle: 'paso caído' });
  assert.equal(status, 200);
  assert.equal(cuerpo.aviso, 'error HTTP 500');
  sinDatosPersonales(logs);

  assert.equal((await informar('no es json')).status, 400);
  assert.equal((await informar({ id: 2, estado: 'pendiente' })).status, 400);
  assert.equal((await informar({ id: 99, estado: 'cargada' })).status, 404);
  assert.equal((await informar({ id: 3, estado: 'error' })).status, 409);
});
