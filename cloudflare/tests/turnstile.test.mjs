import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizarHost, hostsPermitidos, verificarTurnstile, TIMEOUT_TURNSTILE_MS } from '../src/api/turnstile.ts';

const SECRETO = 'secreto-sintetico-de-prueba';

/** Doble de `fetch`: registra el pedido y devuelve lo que diga cada caso. */
function buscarFalso(respuesta) {
  const pedidos = [];
  const buscar = async (url, init) => {
    pedidos.push({ url, init });
    if (respuesta instanceof Error) throw respuesta;
    return respuesta;
  };
  return { buscar, pedidos };
}

const json = (cuerpo, status = 200) => new Response(JSON.stringify(cuerpo), {
  status, headers: { 'Content-Type': 'application/json' },
});

test('verifica con siteverify, manda secreto, respuesta e IP y no sale a la red', async () => {
  const { buscar, pedidos } = buscarFalso(json({ success: true, hostname: 'www.siglo21sur.com' }));
  const ok = await verificarTurnstile('token-sintetico', '203.0.113.9', {
    secreto: SECRETO, hostnamesPermitidos: 'siglo21sur.com', buscar,
  });
  assert.equal(ok, true);
  assert.equal(pedidos.length, 1);
  const { url, init } = pedidos[0];
  assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers['Content-Type'], 'application/x-www-form-urlencoded');
  const cuerpo = init.body;
  assert.equal(cuerpo.get('secret'), SECRETO);
  assert.equal(cuerpo.get('response'), 'token-sintetico');
  assert.equal(cuerpo.get('remoteip'), '203.0.113.9');
  assert.ok(init.signal, 'timeout de 8 s como el módulo vigente');
  assert.equal(TIMEOUT_TURNSTILE_MS, 8_000);
});

test('sin IP no manda remoteip; sin lista no compara hostname', async () => {
  const { buscar, pedidos } = buscarFalso(json({ success: true, hostname: 'otro.example' }));
  assert.equal(await verificarTurnstile('token', undefined, { secreto: SECRETO, buscar }), true);
  assert.equal(pedidos[0].init.body.get('remoteip'), null);
  assert.equal(pedidos[0].init.body.get('secret'), SECRETO);
});

test('rechaza success falso, respuesta no-ok, hostname ajeno y red caída', async () => {
  const falso = buscarFalso(json({ success: false, 'error-codes': ['invalid-input-response'] }));
  assert.equal(await verificarTurnstile('t', '1.2.3.4', { secreto: SECRETO, buscar: falso.buscar }), false);

  const roto = buscarFalso(new Response('error', { status: 500 }));
  assert.equal(await verificarTurnstile('t', '1.2.3.4', { secreto: SECRETO, buscar: roto.buscar }), false);

  const ajeno = buscarFalso(json({ success: true, hostname: 'sitio-clonado.example' }));
  assert.equal(await verificarTurnstile('t', '1.2.3.4', {
    secreto: SECRETO, hostnamesPermitidos: 'siglo21sur.com', buscar: ajeno.buscar,
  }), false);

  const caido = buscarFalso(new Error('ECONNRESET'));
  assert.equal(await verificarTurnstile('t', '1.2.3.4', { secreto: SECRETO, buscar: caido.buscar }), false);

  const ilegible = buscarFalso(new Response('no es json', { status: 200 }));
  assert.equal(await verificarTurnstile('t', '1.2.3.4', { secreto: SECRETO, buscar: ilegible.buscar }), false);
});

test('sin secreto lanza, como el módulo vigente: el handler decide el 503', async () => {
  const { buscar } = buscarFalso(json({ success: true }));
  await assert.rejects(() => verificarTurnstile('t', '1.2.3.4', { secreto: '', buscar }), /Turnstile no configurado/);
});

test('el hostname se compara sin protocolo, puerto, path ni www', () => {
  assert.equal(normalizarHost('HTTPS://WWW.Siglo21sur.com:443/carreras?x=1'), 'siglo21sur.com');
  assert.equal(normalizarHost('  siglo21sur.com  '), 'siglo21sur.com');
  assert.equal(normalizarHost('http://www.teclab.edu.ar/'), 'teclab.edu.ar');
  assert.equal(normalizarHost(null), '');
  assert.deepEqual(hostsPermitidos('siglo21sur.com, WWW.teclab.edu.ar ,,'), ['siglo21sur.com', 'teclab.edu.ar']);
  assert.deepEqual(hostsPermitidos(undefined), []);
});
