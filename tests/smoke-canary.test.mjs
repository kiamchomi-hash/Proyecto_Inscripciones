import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import { esperarPortadaCandidata } from '../herramientas/smoke-canary.mjs';

const estable = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const candidata = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const html = version => ({
  status: 200,
  crudo: Buffer.from(`<link href="/__assets/${version}/fuentes/inter-latin.woff2">`),
});

test('espera al canary si el borde todavía devuelve un 200 de la versión estable', async () => {
  const respuestas = [html(estable), html(estable), html(candidata)];
  const pausas = [];
  const resultado = await esperarPortadaCandidata(candidata, async () => respuestas.shift(), {
    esperar: async ms => pausas.push(ms),
  });
  assert.equal(resultado.asset, `/__assets/${candidata}/fuentes/inter-latin.woff2`);
  assert.equal(respuestas.length, 0);
  assert.ok(pausas.length === 2 && pausas.every(ms => ms > 0));
});

test('agota la espera sin aprobar un 200 de la versión anterior', async () => {
  let pedidos = 0;
  await assert.rejects(esperarPortadaCandidata(candidata, async () => {
    pedidos += 1;
    return html(estable);
  }, { intentos: 3, esperar: async () => {} }), new RegExp(`${candidata}.*${estable}`));
  assert.equal(pedidos, 3);
});

test('una portada rota o sin referencias versionadas no se confunde con propagación', async () => {
  for (const [respuesta, motivo] of [
    [{ ...html(candidata), status: 503 }, /HTTP 503/],
    [{ status: 200, crudo: Buffer.from('<link href="/fuentes/inter-latin.woff2">') }, /sin referencias versionadas/],
    [{ status: 200, crudo: Buffer.concat([html(estable).crudo, html(candidata).crudo]) }, /más de una versión/],
  ]) {
    await assert.rejects(esperarPortadaCandidata(candidata, async () => respuesta, {
      esperar: async () => assert.fail('no corresponde reintentar'),
    }), motivo);
  }
});

test('el smoke usa el override desde el primer GET y no avanza si el asset falla', async t => {
  const pedidos = [];
  const server = createServer((req, res) => {
    pedidos.push({ url: req.url, metodo: req.method, override: req.headers['cloudflare-workers-version-overrides'] });
    if (req.url.startsWith('/?')) res.end(html(candidata).crudo);
    else res.writeHead(404).end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());
  await assert.rejects(promisify(execFile)(process.execPath, [
    'herramientas/smoke.mjs', '--rapido',
    `--base=http://127.0.0.1:${server.address().port}`, `--version-worker=${candidata}`,
  ]), /Asset versionado en R2: .*HTTP 404/);
  assert.equal(pedidos.length, 2);
  assert.match(pedidos[0].url, /^\/\?__smoke_canary=[a-f0-9-]+$/);
  assert.equal(pedidos[1].url, `/__assets/${candidata}/fuentes/inter-latin.woff2`);
  assert.ok(pedidos.every(pedido => pedido.metodo === 'GET'
    && pedido.override === `cau-produccion-20261026="${candidata}"`));
});
