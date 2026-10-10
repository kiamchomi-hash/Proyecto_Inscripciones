import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import * as casas from '../components/formularios/casas.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

// Las carreras anunciadas (`proximamente = true`) aceptan la preinscripción y
// nada más: la fila entra en `consultas`, el trigger `on_consulta_insert` avisa
// por Telegram y ahí termina. Todavía no están cargadas en Teclab, así que no
// hay precio, mail del precio, pase, autoinscripción, HubSpot ni robot.

const { carreraConAutoinscripcion, carreraConPrecio, casaDeCarrera, CASAS_CON_AUTOINSCRIPCION, TABLA_PRECIOS } = casas;

const conId = resultado => {
  const r = { select: () => r, single: async () => ({ data: resultado.error ? null : { id: 41 }, ...resultado }), then: (a, b) => Promise.resolve(resultado).then(a, b) };
  return r;
};

const ABIERTA = { id: 7, nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología', activa: true, proximamente: false };
const ANUNCIADA = { id: 10, nombre: 'Tecnicatura Superior en Gestión de Alimentos', nivel: 'Teclab - Gestión', activa: true, proximamente: true };

const legajo = {
  casa: 'teclab', tipoFormulario: 'preinscripcion', nombre: 'Ana', apellido: 'Pérez', dni: '30.123.456',
  sexo: 'Femenino', fechaNacimiento: '1990-04-12', lugarNacimiento: 'CABA', nacionalidad: 'Argentina',
  estadoCivil: 'Soltero/a', domicilio: 'Av. Siempre Viva', domicilioNumero: '742', domicilioPiso: '',
  domicilioDepartamento: '', codigoPostal: '1439', localidad: 'Villa Lugano', nivelEstudios: 'Secundario completo',
  colegio: 'Escuela N° 1', colegioLocalidad: 'CABA', email: 'ana@example.test', telefono: '11 1234-5678',
};

// ── Las reglas de la casa ──

test('una anunciada no tiene precio ni autoinscripción, aunque sea de Teclab', () => {
  assert.equal(carreraConAutoinscripcion(ABIERTA), true);
  assert.equal(carreraConAutoinscripcion(ANUNCIADA), false);
  assert.equal(carreraConPrecio(ABIERTA), true);
  assert.equal(carreraConPrecio(ANUNCIADA), false);
});

test('el endpoint lee `proximamente` de la base en cada consulta de carrera', () => {
  const ruta = readFileSync('app/api/formularios/route.ts', 'utf8');
  const lecturas = [...ruta.matchAll(/\.from\('carreras'\)\s*\.select\('([^']+)'\)/g)].map(m => m[1]);
  // La del newsletter sólo quiere el nombre; las demás deciden precio,
  // pase o autoinscripción y tienen que traer el dato, no creerle al navegador.
  const decisivas = lecturas.filter(columnas => columnas !== 'id, nombre');
  assert.ok(decisivas.length >= 4, `lecturas: ${lecturas.join(' | ')}`);
  for (const columnas of decisivas) assert.match(columnas, /\bproximamente\b/, columnas);
});

// ── El endpoint, con Supabase simulado ──

function montarEndpoint(t) {
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

  const carreras = [ABIERTA, ANUNCIADA];
  const enlaces = [];
  const consultas = [];
  const estado = { escrituras: [], lecturas: [], pases: 0 };

  const supabase = {
    rpc: async () => ({ data: true, error: null }),
    from(tabla) {
      estado.lecturas.push(tabla);
      const filtros = [];
      let cambios = null;
      const filas = () => (tabla === 'carreras' ? carreras : tabla === casas.TABLA_ENLACES ? enlaces : tabla === 'consultas' ? consultas : [])
        .filter(fila => filtros.every(f => f(fila)));
      const q = {
        select: () => q,
        eq: (columna, valor) => { filtros.push(f => f[columna] === valor); return q; },
        in: (columna, valores) => { filtros.push(f => valores.includes(f[columna])); return q; },
        is: (columna, valor) => { filtros.push(f => f[columna] === valor); return q; },
        ilike: () => q, gte: () => q, limit: () => q,
        maybeSingle: async () => ({ data: filas()[0] ?? null, error: null }),
        update: valores => { cambios = valores; return q; },
        insert: fila => { estado.escrituras.push({ tabla, fila }); return conId({ error: null }); },
        upsert: async fila => { estado.escrituras.push({ tabla, fila }); return { error: null }; },
        then(a, b) {
          const afectadas = filas();
          if (cambios) {
            for (const fila of afectadas) Object.assign(fila, cambios);
            estado.escrituras.push({ tabla, cambios });
          }
          return Promise.resolve({ data: afectadas, error: null }).then(a, b);
        },
      };
      return q;
    },
  };

  const pases = cargarTypescript('lib/pase-autoinscripcion.ts', { 'server-only': {} });
  const { POST } = cargarTypescript('app/api/formularios/route.ts', {
    'next/server': { NextResponse: Response },
    '@/components/formularios/casas': casas,
    '@/lib/turnstile': { verifyTurnstile: async () => true },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => supabase },
    '@/lib/pase-autoinscripcion': { ...pases, emitirPase: (...args) => { estado.pases++; return pases.emitirPase(...args); } },
  });

  const pedir = async sobre => {
    const respuesta = await POST(new Request('http://localhost/api/formularios', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sobre),
    }));
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  };
  return { estado, pedir, enlaces, consultas };
}

test('la preinscripción de una anunciada se guarda y no lee precio, ni manda mail, ni emite pase', async t => {
  const { estado, pedir } = montarEndpoint(t);
  const payload = { ...legajo, carrera: ANUNCIADA.nombre, carreraId: ANUNCIADA.id, newsletter: false };
  const { status, cuerpo } = await pedir({ kind: 'consulta', token: 'simulado', payload });
  assert.equal(status, 201);
  assert.deepEqual(cuerpo, { ok: true });
  assert.equal(estado.escrituras.length, 1);
  assert.equal(estado.escrituras[0].tabla, 'consultas', 'la fila entra y el trigger avisa por Telegram');
  assert.equal(estado.escrituras[0].fila.carrera, ANUNCIADA.nombre);
  assert.equal(estado.escrituras[0].fila.tipo_formulario, 'preinscripcion');
  assert.equal(estado.lecturas.includes(TABLA_PRECIOS), false, 'sin precio no hay mail del precio');
  assert.equal(estado.pases, 0);

  // Control: la misma preinscripción de una carrera abierta sigue igual.
  const abierta = await pedir({ kind: 'consulta', token: 'simulado', payload: { ...payload, carrera: ABIERTA.nombre, carreraId: ABIERTA.id } });
  assert.equal(abierta.status, 201);
  assert.ok('estado' in abierta.cuerpo, 'la abierta trae el estado del precio');
  assert.equal(typeof abierta.cuerpo.pase, 'string');
  assert.ok(estado.lecturas.includes(TABLA_PRECIOS));
});

test('la autoinscripción y «Ver precio» de una anunciada se rechazan sin escribir', async t => {
  const { estado, pedir } = montarEndpoint(t);
  const auto = await pedir({ kind: 'autoinscripcion', token: 'simulado', payload: { ...legajo, carreraId: ANUNCIADA.id, newsletter: false } });
  assert.equal(auto.status, 400);
  assert.equal(auto.cuerpo.error, 'Carrera inválida');
  const precio = await pedir({ kind: 'precio', token: 'simulado', payload: { carreraId: ANUNCIADA.id, email: 'ana@example.test' } });
  assert.equal(precio.status, 400);
  assert.deepEqual(estado.escrituras, []);

  // Control: la abierta entra.
  const abierta = await pedir({ kind: 'autoinscripcion', token: 'simulado', payload: { ...legajo, carreraId: ABIERTA.id, newsletter: false } });
  assert.equal(abierta.status, 201);
});

test('el enlace de una preinscripción de anunciada se rechaza sin marcarlo usado ni escribir', async t => {
  const { estado, pedir, enlaces, consultas } = montarEndpoint(t);
  const codigo = 'Ab3dEf6hIj9kLm2nOp5qRs8tUv';
  enlaces.push({ codigo, consulta_id: 41, vence_at: '2099-01-01T00:00:00Z', usado_at: null });
  // El legajo completo, como lo guarda la preinscripción: si faltara un dato
  // el enlace se rechazaría por eso y la prueba no diría nada de la carrera.
  consultas.push({
    id: 41, created_at: '2026-10-03T12:00:00Z', casa: 'teclab', tipo_formulario: 'preinscripcion',
    tipo: 'Tecnicaturas', carrera: ANUNCIADA.nombre, nombre: 'Ana', apellido: 'Pérez', dni: '30156456',
    sexo: 'Femenino', fecha_nacimiento: '1990-04-12', localidad_nacimiento: 'CABA', nacionalidad: 'Argentina',
    estado_civil: 'Soltero/a', direccion: 'Av. Siempre Viva', direccion_numero: '742', direccion_piso: null,
    direccion_departamento: null, codigo_postal: '1439', localidad: 'Villa Lugano',
    nivel_estudios: 'Secundario completo', colegio: 'Escuela N° 1', colegio_localidad: 'CABA',
    email: 'ana@ejemplo.com', telefono: '11 5555-1234', equivalencias: false, medio_pago: null,
  });
  const { status, cuerpo } = await pedir({ kind: 'enlace', token: 'simulado', payload: { codigo } });
  assert.equal(status, 400);
  assert.match(cuerpo.error, /enlace/i);
  assert.deepEqual(estado.escrituras, []);
  assert.equal(enlaces[0].usado_at, null);

  // Control: con una carrera abierta el mismo enlace sí entra.
  consultas[0].carrera = ABIERTA.nombre;
  assert.equal((await pedir({ kind: 'enlace', token: 'simulado', payload: { codigo } })).status, 201);
  assert.ok(enlaces[0].usado_at);
});

// ── El formulario ──

const fuente = readFileSync('components/formularios/formulario-lead.tsx', 'utf8');
const js = texto => ts.transpileModule(texto, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

test('el formulario no sigue al precio ni a «Inscribirme» con una anunciada', () => {
  const calculo = fuente.slice(fuente.indexOf('  const casaDeLaCarrera = casaDeCarrera(carrera);'), fuente.indexOf('  // Entrada directa:'));
  assert.ok(calculo.includes('conAutoinscripcion'));
  const conAuto = (carrera, esPreinscripcion = true) => new Function(
    'carrera', 'esPreinscripcion', 'casaDeCarrera', 'CASAS_CON_AUTOINSCRIPCION',
    js(`${calculo}\nreturn conAutoinscripcion;`),
  )(carrera, esPreinscripcion, casaDeCarrera, CASAS_CON_AUTOINSCRIPCION);
  assert.equal(conAuto(ABIERTA), true);
  assert.equal(conAuto({ id: 10, nombre: ANUNCIADA.nombre, nivel: ANUNCIADA.nivel, proximamente: true }), false);
  assert.equal(conAuto(ABIERTA, false), false);
  // Sin `conAutoinscripcion` el envío termina en la confirmación simple
  // (`setListo(true)`): ni el paso del precio ni el de «Inscribirme».
  const fin = fuente.slice(fuente.indexOf('    if (conAutoinscripcion) {\n      setPreinscripcionEnviada(true);'));
  assert.match(fin, /irAPaso\(precio \? 'precio' : 'gestionar'\);\s*return;\s*\}\s*setListo\(true\);/);
});

// ── La ficha ──

test('la ficha de una anunciada lleva a la preinscripción, con «Preinscribite»', () => {
  const ficha = readFileSync('components/carreras/career-detail.tsx', 'utf8');
  assert.doesNotMatch(ficha, /proximamente \? '#formulario'/);
  // Encabezado, CTA fijo y lateral: los tres conservan «Preinscribite».
  assert.equal(ficha.match(/\{carrera\.proximamente \? 'Preinscribite' : 'Quiero inscribirme'\}/g)?.length, 3);
  assert.match(ficha, /destino="#preinscripcion"/);
});
