import test from 'node:test';
import assert from 'node:assert/strict';
import { crearD1 } from './helpers/d1.mjs';
import { manejarAlertaCloudflare } from '../src/api/alerta-cloudflare.ts';

// El destino webhook de Cloudflare Notifications apunta a este endpoint y lo
// firma con `cf-webhook-auth`. Estos tests fijan lo único que puede romperse en
// silencio: que sin secreto no reenvíe, que con el secreto equivocado no
// reenvíe, que el texto que llega al chat sea el aviso y no el payload, y que
// el tope por IP corte recién después de validar la firma.

const SECRETO = 'secreto-de-prueba';

const pedir = (cuerpo, headers = {}) => new Request('https://local.test/api/alerta-cloudflare', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.7', ...headers },
  body: JSON.stringify(cuerpo),
});

const telegram = () => {
  const enviados = [];
  const fn = async (texto) => { enviados.push(texto); return true; };
  return { enviados, fn };
};

const aviso = {
  name: 'Uso D1: filas leídas',
  text: 'Ha superado el umbral configurado.',
  data: { producto: 'd1_rows_read' },
  ts: '2026-10-28T13:00:00Z',
};

test('sin secreto configurado falla cerrado y no reenvía', async () => {
  const { enviados, fn } = telegram();
  const res = await manejarAlertaCloudflare(
    pedir(aviso, { 'cf-webhook-auth': SECRETO }), null, { telegram: fn },
  );
  assert.equal(res.status, 503);
  assert.equal(enviados.length, 0);
});

test('con el secreto equivocado responde 401 y no reenvía', async () => {
  const { enviados, fn } = telegram();
  const res = await manejarAlertaCloudflare(
    pedir(aviso, { 'cf-webhook-auth': 'otro' }), null, { telegram: fn, secreto: SECRETO },
  );
  assert.equal(res.status, 401);
  assert.equal(enviados.length, 0);
});

test('con el secreto correcto manda nombre y texto, sin el resto del payload', async () => {
  const { enviados, fn } = telegram();
  const res = await manejarAlertaCloudflare(
    pedir(aviso, { 'cf-webhook-auth': SECRETO }), null, { telegram: fn, secreto: SECRETO },
  );
  assert.equal(res.status, 200);
  assert.equal(enviados.length, 1);
  assert.match(enviados[0], /Uso D1: filas leídas/);
  assert.match(enviados[0], /Ha superado el umbral configurado/);
  assert.doesNotMatch(enviados[0], /d1_rows_read|2026-10-28T13:00:00Z/);
});

test('un cuerpo sin nombre ni texto no reenvía', async () => {
  const { enviados, fn } = telegram();
  const res = await manejarAlertaCloudflare(
    pedir({ data: {} }, { 'cf-webhook-auth': SECRETO }), null, { telegram: fn, secreto: SECRETO },
  );
  assert.equal(res.status, 400);
  assert.equal(enviados.length, 0);
});

test('si Telegram falla, responde 502 para que Cloudflare reintente', async () => {
  const res = await manejarAlertaCloudflare(
    pedir(aviso, { 'cf-webhook-auth': SECRETO }), null,
    { telegram: async () => false, secreto: SECRETO },
  );
  assert.equal(res.status, 502);
});

test('el tope por IP corta a partir del sexto aviso y no manda el resto', async (t) => {
  const { db } = await crearD1(t);
  const { enviados, fn } = telegram();
  const entorno = { telegram: fn, secreto: SECRETO };

  for (let i = 0; i < 5; i += 1) {
    const res = await manejarAlertaCloudflare(pedir(aviso, { 'cf-webhook-auth': SECRETO }), db, entorno);
    assert.equal(res.status, 200);
  }
  const sexto = await manejarAlertaCloudflare(pedir(aviso, { 'cf-webhook-auth': SECRETO }), db, entorno);
  assert.equal(sexto.status, 200);
  assert.deepEqual(await sexto.json(), { ok: true, skipped: true });
  assert.equal(enviados.length, 5);
});

test('un pedido sin firma no consume el tope de quien sí la tiene', async (t) => {
  const { db } = await crearD1(t);
  const { enviados, fn } = telegram();
  const entorno = { telegram: fn, secreto: SECRETO };

  for (let i = 0; i < 8; i += 1) {
    const res = await manejarAlertaCloudflare(pedir(aviso, { 'cf-webhook-auth': 'intruso' }), db, entorno);
    assert.equal(res.status, 401);
  }
  const res = await manejarAlertaCloudflare(pedir(aviso, { 'cf-webhook-auth': SECRETO }), db, entorno);
  assert.equal(res.status, 200);
  assert.equal(enviados.length, 1);
});
