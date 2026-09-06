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
