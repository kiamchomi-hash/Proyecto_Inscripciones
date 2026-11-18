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

// El versionado reescribe texto dentro de `script:not([src])`. Si lo escribe
// como texto HTML, `&&` sale como `&amp;&amp;` y el navegador no puede parsear
// el runtime de Astro: la página queda sin hidratar y ningún formulario
// funciona. Pasó en producción y el E2E no lo vio porque corre el entry de
// desarrollo, no el de producción.
test('los scripts inline del HTML llegan sin entidades HTML', async () => {
  const harness = createTestHarness({ workers: [{ configPath: './produccion/wrangler.json' }] });
  await harness.listen();
  try {
    const worker = harness.getWorker();
    await worker.applyD1Migrations('DB');
    await insertarCatalogo((await worker.getEnv()).DB);
    const html = await (await harness.fetch('https://www.siglo21sur.com/')).text();
    const ejecutables = [...html.matchAll(/<script(?![^>]*\ssrc=)(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)]
      .map(coincidencia => coincidencia[1]);
    assert.ok(ejecutables.length > 0, 'la home tiene que traer scripts inline');
    assert.ok(ejecutables.some(texto => texto.includes('&&') || texto.includes('=>')),
      'algún script inline tiene que traer && o => para que esta prueba sirva');
    for (const texto of ejecutables) {
      assert.doesNotMatch(texto, /&(?:amp|lt|gt);/,
        'el script inline viaja escapado: el navegador no lo parsea y la isla no hidrata');
    }
  } finally {
    await harness.close();
  }
});

// Esta sonda arma la página a mano: necesita, en el mismo texto, una referencia
// de asset y los operadores crudos. En las páginas reales hoy no coinciden, así
// que sin una página armada el arreglo del versionado no quedaría cubierto.
test('el versionado reescribe rutas dentro de scripts sin escapar el código', async () => {
  const harness = createTestHarness({ workers: [{ config: {
    name: 'versionado-html',
    main: './tests/fixtures/worker-versionado.ts',
    compatibility_date: '2026-10-25',
    dev: { ip: '127.0.0.1', port: 0 },
  } }] });
  await harness.listen();
  try {
    const html = await (await harness.fetch('https://www.siglo21sur.com/')).text();
    assert.match(html, /const suma = 1 && 2;/, 'el script conserva sus operadores');
    assert.match(html, /\(\) => '\/__assets\/[0-9a-f-]{36}\/imagenes\/logo\.webp'/);
    assert.match(html, /\.a > \.b\{/, 'el estilo conserva el combinador');
    assert.doesNotMatch(html, /&(?:amp|lt|gt);/, 'el texto reescrito no puede quedar escapado');
    const bloque = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    assert.ok(bloque, 'el JSON-LD tiene que seguir en la página');
    const datos = JSON.parse(bloque[1]);
    assert.equal(datos.nombre, 'A & B');
    assert.match(datos.imagen, /^\/__assets\/[0-9a-f-]{36}\/imagenes\/og\/default\.jpg$/);
  } finally {
    await harness.close();
  }
});
