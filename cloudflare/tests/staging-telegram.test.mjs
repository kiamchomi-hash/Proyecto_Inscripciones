import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { registrarAlias } from './helpers/alias.mjs';

registrarAlias();
const {
  CLAVE_CUPO, MAXIMO_ENVIOS, crearBusquedaTelegram, enviarTelegramControl, validarPedido,
} = await import('../staging/telegram-controlado.ts');

const chat = '-1001234567890';
const sha = (valor) => createHash('sha256').update(valor).digest('hex');
const token = '123456789:' + 'A'.repeat(35);

/** Base mínima: sólo responde a la consulta de pendientes y al cupo. */
function baseFalsa({ pendientes = [{ id: 7 }] } = {}) {
  return {
    prepare(sql) {
      return {
        bind: () => ({
          all: async () => ({ results: pendientes }),
          first: async () => null,
          run: async () => ({ success: true }),
        }),
        all: async () => ({ results: pendientes }),
        first: async () => null,
        run: async () => ({ success: true }),
      };
    },
  };
}

const entorno = (extra = {}) => ({
  DB: baseFalsa(),
  TELEGRAM_BOT_TOKEN: token,
  TELEGRAM_CHAT_ID: chat,
  STAGING_TELEGRAM_CHAT_SHA256: sha(chat),
  STAGING_TELEGRAM_HABILITADO: 'si',
  ...extra,
});

test('sin bandera, sin token, sin chat autorizado o sin base no toca nada', async () => {
  let llamadas = 0;
  const red = async () => { llamadas++; return new Response('{}'); };
  const casos = [
    [{ STAGING_TELEGRAM_HABILITADO: 'no' }, 503, 'ruta-deshabilitada'],
    [{ TELEGRAM_BOT_TOKEN: undefined }, 503, 'telegram-sin-configurar'],
    [{ TELEGRAM_BOT_TOKEN: 'no-es-token' }, 503, 'telegram-sin-configurar'],
    [{ TELEGRAM_CHAT_ID: 'abc' }, 503, 'telegram-sin-configurar'],
    [{ STAGING_TELEGRAM_CHAT_SHA256: undefined }, 503, 'chat-sin-autorizar'],
    [{ STAGING_TELEGRAM_CHAT_SHA256: 'f'.repeat(64) }, 403, 'chat-no-autorizado'],
    [{ DB: undefined }, 503, 'sin-base'],
  ];
  for (const [cambio, status, error] of casos) {
    const r = await enviarTelegramControl(entorno(cambio), {}, red);
    assert.equal(r.status, status, `caso ${error}`);
    assert.equal((await r.json()).error, error);
  }
  const sinRed = await enviarTelegramControl(entorno(), {}, undefined);
  assert.equal(sinRed.status, 503);
  assert.equal(llamadas, 0, 'ningún caso puede salir a la red');
});

test('el cuerpo sólo admite {}: un campo extra o un tipo raro se rechaza', async () => {
  assert.deepEqual(validarPedido({}), { ok: true });
  for (const [cuerpo, codigo] of [
    [{ chat_id: chat }, 'campo-no-admitido:chatid'],
    [{ cc: 'x' }, 'campo-no-admitido:cc'],
    [{ lote: ['a'] }, 'campo-no-admitido:lote'],
    [[], 'cuerpo-invalido'],
    [null, 'cuerpo-invalido'],
    ['texto', 'cuerpo-invalido'],
  ]) {
    const r = validarPedido(cuerpo);
    assert.equal(r.ok, false);
    assert.equal(r.codigo, codigo);
  }
  const respuesta = await enviarTelegramControl(entorno(), { chat_id: chat }, async () => new Response('{}'));
  assert.equal(respuesta.status, 400);
  assert.equal((await respuesta.json()).error, 'campo-no-admitido:chatid');
});

test('sin aviso pendiente o con varios no elige a ciegas', async () => {
  const vacio = await enviarTelegramControl(entorno({ DB: baseFalsa({ pendientes: [] }) }), {}, async () => new Response('{}'));
  assert.equal(vacio.status, 409);
  assert.equal((await vacio.json()).error, 'sin-aviso-pendiente');

  const varios = await enviarTelegramControl(
    entorno({ DB: baseFalsa({ pendientes: [{ id: 7 }, { id: 8 }] }) }), {}, async () => new Response('{}'),
  );
  assert.equal(varios.status, 409);
  assert.equal((await varios.json()).error, 'multiples-avisos-pendientes');
});

test('el egreso sólo acepta sendMessage por POST y no sigue redirecciones', async () => {
  const buscar = crearBusquedaTelegram(async (url, init) => {
    assert.equal(init.redirect, 'manual');
    return new Response('{"ok":true}', { status: 200 });
  });
  assert.equal((await buscar(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST' })).status, 200);

  await assert.rejects(buscar('https://api.telegram.org/bot123/getUpdates', { method: 'POST' }), /fuera de alcance/);
  await assert.rejects(buscar(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'GET' }), /fuera de alcance/);
  await assert.rejects(buscar('https://ejemplo.invalid/sendMessage', { method: 'POST' }), /fuera de alcance/);

  const redirige = crearBusquedaTelegram(async () => new Response(null, { status: 302, headers: { Location: 'https://otro.invalid' } }));
  await assert.rejects(redirige(`https://api.telegram.org/bot${token}/sendMessage`, { method: 'POST' }), /Redireccion/);
});

test('la clave de cupo y el máximo son fijos del servidor', () => {
  assert.match(CLAVE_CUPO, /^staging-telegram-control:/);
  assert.equal(MAXIMO_ENVIOS, 1);
});
