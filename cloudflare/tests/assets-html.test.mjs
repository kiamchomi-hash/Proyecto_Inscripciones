import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createTestHarness } from 'wrangler';
import { insertarCatalogo } from './fixtures/catalogo-home.mjs';

test('el Worker versiona las referencias de assets en el HTML SSR', async () => {
  const harness = createTestHarness({ workers: [{ configPath: './produccion/wrangler.json' }] });
  await harness.listen();
  try {
    const worker = harness.getWorker();
    await worker.applyD1Migrations('DB');
    await insertarCatalogo((await worker.getEnv()).DB);
    const respuesta = await harness.fetch('https://www.siglo21sur.com/');
    assert.match(respuesta.headers.get('content-type') ?? '', /text\/html/);
    const html = await respuesta.text();
    const versiones = [...html.matchAll(/\/__assets\/([0-9a-f-]{36})\//gi)].map(match => match[1]);
    assert.ok(versiones.length > 0, 'el HTML tiene que incluir assets versionados');
    assert.equal(new Set(versiones).size, 1, 'todos los recursos de la respuesta comparten la versión que la generó');
    assert.match(html, /property="og:image" content="https?:\/\/www\.siglo21sur\.com\/__assets\//);

    const assetVersion = versiones[0];
    const ruta = 'imagenes/og/default.jpg';
    const bytes = new TextEncoder().encode('fixture asset R2');
    const digest = createHash('sha256').update(bytes).digest('hex');
    const entorno = await worker.getEnv();
    await entorno.ASSETS_HISTORICOS.put(`objects/${digest}`, bytes, {
      httpMetadata: { contentType: 'image/jpeg' },
    });
    await entorno.ASSETS_HISTORICOS.put(`manifests/${assetVersion}.json`, JSON.stringify({
      version: assetVersion,
      files: { [ruta]: { digest, contentType: 'image/jpeg', size: bytes.byteLength } },
    }), { httpMetadata: { contentType: 'application/json' } });
    const imagen = await harness.fetch(`https://www.siglo21sur.com/__assets/${assetVersion}/${ruta}`);
    assert.equal(imagen.status, 200);
    assert.equal(await imagen.text(), 'fixture asset R2');
  } finally {
    await harness.close();
  }
});
