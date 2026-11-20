import test from 'node:test';
import assert from 'node:assert/strict';
import { manejarRecordatorioPlanesSiglo21 } from '../src/api/recordatorio-planes-siglo21.ts';
import { mensajeRecordatorioPlanesSiglo21 } from '../../lib/recordatorio-planes-siglo21.ts';

test('el mensaje pide revisar los planes oficiales de Siglo 21', () => {
  const texto = mensajeRecordatorioPlanesSiglo21();
  assert.match(texto, /planes de estudio de las carreras activas de Siglo 21/);
  assert.match(texto, /fuentes oficiales/);
  assert.match(texto, /no actualizar/);
});

test('el recordatorio requiere CRON_SECRET antes de enviar', async () => {
  let envios = 0;
  const response = await manejarRecordatorioPlanesSiglo21(new Request('https://local.invalid'), {
    telegram: async () => { envios++; return 'enviado'; },
  });

  assert.equal(response.status, 503);
  assert.equal(envios, 0);
});

test('el recordatorio rechaza bearer inválido y no consulta D1', async () => {
  let envios = 0;
  const response = await manejarRecordatorioPlanesSiglo21(
    new Request('https://local.invalid', { headers: { Authorization: 'Bearer incorrecto' } }),
    { secretoCron: 'correcto', telegram: async () => { envios++; return 'enviado'; } },
  );

  assert.equal(response.status, 401);
  assert.equal(envios, 0);
});

test('el recordatorio envía a Telegram sin usar D1', async () => {
  const enviados = [];
  const response = await manejarRecordatorioPlanesSiglo21(
    new Request('https://local.invalid', { headers: { Authorization: 'Bearer correcto' } }),
    { secretoCron: 'correcto', telegram: async texto => { enviados.push(texto); return 'enviado'; } },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { aviso: 'enviado' });
  assert.deepEqual(enviados, [mensajeRecordatorioPlanesSiglo21()]);
});

test('un error del transporte no se informa como un envío exitoso', async () => {
  const response = await manejarRecordatorioPlanesSiglo21(
    new Request('https://local.invalid', { headers: { Authorization: 'Bearer correcto' } }),
    { secretoCron: 'correcto', telegram: async () => 'error HTTP 502' },
  );

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { aviso: 'error HTTP 502' });
});
