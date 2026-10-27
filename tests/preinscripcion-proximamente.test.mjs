import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as casas from '../components/formularios/casas.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

// Las carreras anunciadas (`proximamente = true`) aceptan la preinscripción y
// nada más: la fila entra en `consultas`, el trigger `on_consulta_insert` avisa
// por Telegram y ahí termina. Todavía no están cargadas en Teclab, así que no
// hay precio ni mail del precio. Desde el 27/10/2026 tampoco hay
// autoinscripción, pase, enlace ni HubSpot: eso se dio de baja.

const { carreraConPrecio, TABLA_PRECIOS } = casas;

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

test('una anunciada no tiene precio, aunque sea de Teclab', () => {
  assert.equal(carreraConPrecio(ABIERTA), true);
  assert.equal(carreraConPrecio(ANUNCIADA), false);
});

test('el endpoint lee `proximamente` de la base al decidir el precio', () => {
  const ruta = readFileSync('app/api/formularios/route.ts', 'utf8');
  const lecturas = [...ruta.matchAll(/\.from\('carreras'\)\s*\.select\('([^']+)'\)/g)].map(m => m[1]);
  // La del newsletter sólo quiere el nombre; la que decide el precio tiene que
  // traer el dato de la base, no creerle al navegador.
  const decisivas = lecturas.filter(columnas => columnas !== 'id, nombre');
  assert.ok(decisivas.length >= 1, `lecturas: ${lecturas.join(' | ')}`);
  for (const columnas of decisivas) {
    assert.match(columnas, /\bproximamente\b/, columnas);
    assert.match(columnas, /\bactiva\b/, columnas);
  }
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
  const consultas = [];
  const estado = { escrituras: [], lecturas: [] };

  const supabase = {
    rpc: async () => ({ data: true, error: null }),
    from(tabla) {
      estado.lecturas.push(tabla);
      const filtros = [];
      let cambios = null;
      const filas = () => (tabla === 'carreras' ? carreras : tabla === 'consultas' ? consultas : [])
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

  const { POST } = cargarTypescript('app/api/formularios/route.ts', {
    'next/server': { NextResponse: Response, after: () => {} },
    '@/components/formularios/casas': casas,
    '@/lib/turnstile': { verifyTurnstile: async () => true },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => supabase },
  });

  const pedir = async sobre => {
    const respuesta = await POST(new Request('http://localhost/api/formularios', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sobre),
    }));
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  };
  return { estado, pedir, consultas };
}

test('la preinscripción de una anunciada se guarda y no lee precio ni manda mail', async t => {
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

  // Control: la misma preinscripción de una carrera abierta sigue igual.
  const abierta = await pedir({ kind: 'consulta', token: 'simulado', payload: { ...payload, carrera: ABIERTA.nombre, carreraId: ABIERTA.id } });
  assert.equal(abierta.status, 201);
  assert.ok('estado' in abierta.cuerpo, 'la abierta trae el estado del precio');
  assert.ok(estado.lecturas.includes(TABLA_PRECIOS));
});

test('«Ver precio» de una anunciada se rechaza sin escribir, y la autoinscripción ya no existe', async t => {
  const { estado, pedir } = montarEndpoint(t);
  // El kind de la autoinscripción rebota en el sobre: no llega ni a la base.
  const auto = await pedir({ kind: 'autoinscripcion', token: 'simulado', payload: { ...legajo, carreraId: ANUNCIADA.id, newsletter: false } });
  assert.equal(auto.status, 400);
  assert.equal(auto.cuerpo.error, 'Solicitud inválida');
  const precio = await pedir({ kind: 'precio', token: 'simulado', payload: { carreraId: ANUNCIADA.id, email: 'ana@example.test' } });
  assert.equal(precio.status, 400);
  assert.equal(precio.cuerpo.error, 'Carrera inválida');
  assert.deepEqual(estado.escrituras, []);

  // Control: la abierta sí se puede consultar.
  const abierta = await pedir({ kind: 'precio', token: 'simulado', payload: { carreraId: ABIERTA.id, email: 'ana@example.test' } });
  assert.equal(abierta.status, 201);
});

// ── El formulario ──

const fuente = readFileSync('components/formularios/formulario-lead.tsx', 'utf8');

test('el formulario confirma la preinscripción de una anunciada y no le ofrece precio', () => {
  // Ya no hay una segunda decisión: toda preinscripción confirma de inmediato y
  // el precio se pide después, con «Ver precio».
  assert.match(fuente, /setPrecioCarrera\(carrera\?\.proximamente \? null : precio\)/);
  assert.match(fuente, /if \(esPreinscripcion\) \{[\s\S]*irAPaso\('confirmacion'\)/);
  assert.doesNotMatch(fuente, /'gestionar'|onSaltear|conAutoinscripcion|flujoAuto/);
});

// ── La ficha ──

test('la ficha de una anunciada lleva a la preinscripción, con «Preinscribite»', () => {
  const ficha = readFileSync('components/carreras/career-detail.tsx', 'utf8');
  assert.doesNotMatch(ficha, /proximamente \? '#formulario'/);
  // Encabezado, CTA fijo y lateral: los tres conservan «Preinscribite».
  assert.equal(ficha.match(/\{carrera\.proximamente \? 'Preinscribite' : 'Quiero inscribirme'\}/g)?.length, 3);
  assert.match(ficha, /destino="#preinscripcion"/);
});
