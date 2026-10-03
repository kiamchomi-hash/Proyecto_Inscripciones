import test from 'node:test';
import assert from 'node:assert/strict';
import * as casas from '../components/formularios/casas.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const { mailParaNewsletter, filaNewsletter, TABLA_NEWSLETTER, CONFLICTO_NEWSLETTER, CAMPOS } = casas;

// ── Lógica pura ──

test('sólo un `true` explícito y un mail válido suscriben', () => {
  assert.equal(mailParaNewsletter({ newsletter: true, email: '  Ana@Example.Test ' }, 'email'), 'ana@example.test');
  assert.equal(mailParaNewsletter({ newsletter: true, contacto: 'ana@example.test' }, 'contacto'), 'ana@example.test');
  for (const payload of [
    { newsletter: false, email: 'ana@example.test' },
    { newsletter: 'true', email: 'ana@example.test' },
    { email: 'ana@example.test' },
    { newsletter: true, email: '' },
    { newsletter: true, email: 'no-es-un-mail' },
    { newsletter: true },
  ]) {
    assert.equal(mailParaNewsletter(payload, 'email'), null, JSON.stringify(payload));
  }
  // En la FAQ privada el contacto puede ser un WhatsApp: no se suscribe.
  assert.equal(mailParaNewsletter({ newsletter: true, contacto: '+54 9 11 1234-5678' }, 'contacto'), null);
});

test('la fila lleva la carrera si la hay, o null si es general', () => {
  const ahora = new Date('2026-10-02T12:00:00Z');
  assert.deepEqual(filaNewsletter('ana@example.test', { id: 7, nombre: 'Tecnicatura' }, ahora), {
    email: 'ana@example.test', carrera_id: 7, carrera_nombre: 'Tecnicatura', activo: true,
    consentimiento_at: '2026-10-02T12:00:00.000Z',
  });
  assert.deepEqual(filaNewsletter('ana@example.test', null, ahora), {
    email: 'ana@example.test', carrera_id: null, carrera_nombre: null, activo: true,
    consentimiento_at: '2026-10-02T12:00:00.000Z',
  });
});

test('`newsletter` no es un campo de `consultas`', () => {
  assert.equal('newsletter' in CAMPOS, false);
  for (const definicion of Object.values(CAMPOS)) assert.notEqual(definicion.columna, 'newsletter');
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
  const errores = [];
  console.error = (...args) => { errores.push(args); };
  process.env.NODE_ENV = 'production';
  process.env.TURNSTILE_SECRET_KEY = 'prueba-simulada';

  const estado = {
    carreras: new Map([[7, { id: 7, nombre: 'Licenciatura en Administración' }]]),
    errores: {},
    escrituras: [],
    logs: errores,
  };

  const supabase = {
    rpc: async () => ({ data: true, error: null }),
    from: tabla => ({
      insert: async fila => {
        estado.escrituras.push({ tabla, op: 'insert', fila });
        return { error: estado.errores[tabla] ?? null };
      },
      upsert: async (fila, opciones) => {
        estado.escrituras.push({ tabla, op: 'upsert', fila, opciones });
        if (estado.errores.lanzar === tabla) throw new Error('caída de red');
        return { error: estado.errores[tabla] ?? null };
      },
      select: () => ({
        eq: (_columna, valor) => ({
          maybeSingle: async () => {
            if (estado.errores[`leer:${tabla}`]) return { data: null, error: estado.errores[`leer:${tabla}`] };
            return { data: tabla === 'carreras' ? estado.carreras.get(valor) ?? null : null, error: null };
          },
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

  const enviar = async (kind, payload) => {
    const respuesta = await POST(new Request('http://localhost/api/formularios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, token: 'simulado', payload }),
    }));
    return { status: respuesta.status, cuerpo: await respuesta.json() };
  };

  const suscripciones = () => estado.escrituras.filter(e => e.tabla === TABLA_NEWSLETTER);
  return { estado, enviar, suscripciones };
}

const consulta = {
  casa: 'siglo21', tipoFormulario: 'contacto', nombre: 'Ana', email: 'Ana@Example.Test',
  carrera: 'Licenciatura en Administración', tipo: 'Licenciaturas',
};

test('consulta con carrera: suscribe a esa carrera, después del lead', async t => {
  const { estado, enviar, suscripciones } = montarEndpoint(t);
  const { status } = await enviar('consulta', { ...consulta, carreraId: 7, newsletter: true });
  assert.equal(status, 201);
  assert.deepEqual(estado.escrituras.map(e => e.tabla), ['consultas', TABLA_NEWSLETTER]);
  const [suscripcion] = suscripciones();
  assert.equal(suscripcion.op, 'upsert');
  assert.equal(suscripcion.fila.email, 'ana@example.test');
  assert.equal(suscripcion.fila.carrera_id, 7);
  // El nombre sale de la base, no de lo que diga el navegador.
  assert.equal(suscripcion.fila.carrera_nombre, 'Licenciatura en Administración');
  assert.equal(suscripcion.opciones.onConflict, CONFLICTO_NEWSLETTER);
});

test('consulta sin carrera, o con una que no existe: suscripción general', async t => {
  const { enviar, suscripciones } = montarEndpoint(t);
  assert.equal((await enviar('consulta', { ...consulta, carrera: null, newsletter: true })).status, 201);
  assert.equal((await enviar('consulta', { ...consulta, carreraId: 999, newsletter: true })).status, 201);
  assert.equal((await enviar('consulta', { ...consulta, carreraId: '7', newsletter: true })).status, 201);
  const filas = suscripciones().map(s => s.fila);
  assert.equal(filas.length, 3);
  for (const fila of filas) {
    assert.equal(fila.carrera_id, null);
    assert.equal(fila.carrera_nombre, null);
    assert.equal(fila.email, 'ana@example.test');
  }
});

test('sin el checkbox, o sin mail, no hay suscripción', async t => {
  const { estado, enviar, suscripciones } = montarEndpoint(t);
  assert.equal((await enviar('consulta', { ...consulta, carreraId: 7, newsletter: false })).status, 201);
  assert.equal((await enviar('consulta', { ...consulta, carreraId: 7 })).status, 201);
  assert.equal((await enviar('consulta', { ...consulta, email: '', telefono: '11 1234-5678', newsletter: true })).status, 201);
  assert.equal(suscripciones().length, 0);
  assert.equal(estado.escrituras.filter(e => e.tabla === 'consultas').length, 3);
});

test('`newsletter` y `carreraId` nunca llegan a la fila de `consultas`', async t => {
  const { estado, enviar } = montarEndpoint(t);
  await enviar('consulta', { ...consulta, carreraId: 7, newsletter: true });
  await enviar('consulta', { ...consulta, casa: 'toString', tipoFormulario: null, carreraId: 7, newsletter: true });
  for (const { fila } of estado.escrituras.filter(e => e.tabla === 'consultas')) {
    assert.equal('newsletter' in fila, false);
    assert.equal('carreraId' in fila, false);
    assert.equal('carrera_id' in fila, false);
  }
});

test('si la suscripción falla, la consulta responde 201 igual', async t => {
  const { estado, enviar } = montarEndpoint(t);
  estado.errores[TABLA_NEWSLETTER] = { code: '23502' };
  assert.equal((await enviar('consulta', { ...consulta, carreraId: 7, newsletter: true })).status, 201);
  estado.errores.lanzar = TABLA_NEWSLETTER;
  assert.equal((await enviar('consulta', { ...consulta, newsletter: true })).status, 201);
  estado.errores.lanzar = null;
  delete estado.errores[TABLA_NEWSLETTER];
  estado.errores['leer:carreras'] = { code: '42501' };
  assert.equal((await enviar('consulta', { ...consulta, carreraId: 7, newsletter: true })).status, 201);
  assert.ok(estado.logs.length >= 2, 'los fallos se registran');
});

test('si el lead no se guarda, no se suscribe', async t => {
  const { estado, enviar, suscripciones } = montarEndpoint(t);
  estado.errores.consultas = { code: 'PGRST204' };
  assert.equal((await enviar('consulta', { ...consulta, carreraId: 7, newsletter: true })).status, 500);
  assert.equal((await enviar('consulta', { ...consulta, email: 'mal', newsletter: true })).status, 400);
  assert.equal(suscripciones().length, 0);
});

test('pregunta de la FAQ: suscripción general con el mail del contacto', async t => {
  const { enviar, suscripciones } = montarEndpoint(t);
  const pregunta = { titulo: '¿Cómo se rinde?', modo: 'publica', contacto: 'Ana@Example.Test' };
  assert.equal((await enviar('faq', { ...pregunta, newsletter: true })).status, 201);
  assert.equal((await enviar('faq', { ...pregunta, newsletter: false })).status, 201);
  assert.equal((await enviar('faq', { ...pregunta, modo: 'privada', contacto: '11 1234-5678', newsletter: true })).status, 201);
  const filas = suscripciones().map(s => s.fila);
  assert.equal(filas.length, 1);
  assert.equal(filas[0].email, 'ana@example.test');
  assert.equal(filas[0].carrera_id, null);
});
