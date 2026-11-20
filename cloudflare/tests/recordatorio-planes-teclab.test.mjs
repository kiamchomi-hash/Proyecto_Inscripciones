import test from 'node:test';
import assert from 'node:assert/strict';
import { manejarRecordatorioPlanesTeclab } from '../src/api/recordatorio-planes-teclab.ts';
import { mensajeRecordatorioPlanesTeclab } from '../../lib/recordatorio-planes-teclab.ts';

test('el mensaje pide revisar sólo los planes oficiales de Teclab', () => {
  const texto = mensajeRecordatorioPlanesTeclab();
  assert.match(texto, /planes de estudio de las carreras activas de Teclab/);
  assert.match(texto, /fuentes oficiales/);
  assert.match(texto, /no actualizar/);
});

test('el recordatorio requiere CRON_SECRET antes de enviar', async () => {
  let envios = 0;
  const response = await manejarRecordatorioPlanesTeclab(new Request('https://local.invalid'), {
    telegram: async () => { envios++; return 'enviado'; },
  });

  assert.equal(response.status, 503);
  assert.equal(envios, 0);
});

test('el recordatorio rechaza bearer inválido y no consulta D1', async () => {
  let envios = 0;
  const response = await manejarRecordatorioPlanesTeclab(
    new Request('https://local.invalid', { headers: { Authorization: 'Bearer incorrecto' } }),
    { secretoCron: 'correcto', telegram: async () => { envios++; return 'enviado'; } },
  );

  assert.equal(response.status, 401);
  assert.equal(envios, 0);
});

test('el recordatorio envía a Telegram sin usar D1', async () => {
  const enviados = [];
  const response = await manejarRecordatorioPlanesTeclab(
    new Request('https://local.invalid', { headers: { Authorization: 'Bearer correcto' } }),
    { secretoCron: 'correcto', telegram: async texto => { enviados.push(texto); return 'enviado'; } },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { aviso: 'enviado' });
  assert.deepEqual(enviados, [mensajeRecordatorioPlanesTeclab()]);
});

test('un error del transporte no se informa como un envío exitoso', async () => {
  const response = await manejarRecordatorioPlanesTeclab(
    new Request('https://local.invalid', { headers: { Authorization: 'Bearer correcto' } }),
    { secretoCron: 'correcto', telegram: async () => 'error HTTP 502' },
  );

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { aviso: 'error HTTP 502' });
});
