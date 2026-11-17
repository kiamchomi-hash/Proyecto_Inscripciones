import test from 'node:test';
import assert from 'node:assert/strict';
import {
  servirAssetR2, versionarReferenciasTexto, versionarUrlAsset,
} from '../src/entrega/assets-r2.ts';

const VERSION = 'f2663f9a-d5b8-4577-a2f6-debc5f34ad48';
const DIGEST = 'a'.repeat(64);
const request = (pathname, method = 'GET') => new Request(`https://www.siglo21sur.com${pathname}`, { method });

function harness({ path = '_astro/app.js', content = 'contenido', contentType = 'image/webp' } = {}) {
  const guardados = new Map();
  const bucket = {
    lecturas: [],
    async get(key) {
      this.lecturas.push(key);
      if (key === `manifests/${VERSION}.json`) {
        return {
          body: new Response(JSON.stringify({
            version: VERSION,
            files: { [path]: { digest: DIGEST, contentType, size: Buffer.byteLength(content) } },
          })).body,
          httpEtag: '"manifest"',
        };
      }
      if (key === `objects/${DIGEST}`) {
        return {
          body: new Response(content).body,
          httpEtag: '"abc"',
          size: Buffer.byteLength(content),
        };
      }
      return null;
    },
  };
  const cache = {
    async match(req) { return guardados.get(req.url); },
    async put(req, response) { guardados.set(req.url, response); },
  };
  const contexto = { waitUntil(promise) { void promise; } };
  return { bucket, cache, contexto };
}

test('ignora rutas fuera del espacio reservado a assets R2', async () => {
  const { bucket, cache, contexto } = harness();
  assert.equal(await servirAssetR2(request('/imagenes/logo.webp'), bucket, cache, contexto), null);
});

test('versiona sólo assets locales conocidos y conserva query y fragmento', () => {
  assert.equal(
    versionarUrlAsset('/_astro/app.js?v=1#modulo', 'https://www.siglo21sur.com/', VERSION),
    `https://www.siglo21sur.com/__assets/${VERSION}/_astro/app.js?v=1#modulo`,
  );
  assert.equal(
    versionarUrlAsset('https://externo.example/a.js', 'https://www.siglo21sur.com/', VERSION),
    'https://externo.example/a.js',
  );
  assert.equal(
    versionarUrlAsset('https://www.siglo21sur.com/imagenes/logo.webp', 'http://www.siglo21sur.com/', VERSION),
    `https://www.siglo21sur.com/__assets/${VERSION}/imagenes/logo.webp`,
  );
  assert.equal(
    versionarUrlAsset('/carreras/abogacia', 'https://www.siglo21sur.com/', VERSION),
    '/carreras/abogacia',
  );
});

test('versiona referencias anidadas en módulos y CSS sin tocar rutas de API', () => {
  const fuente = `import("/_astro/otra.js");url("/fuentes/t.woff2");fetch("/api/datos");const x="/imagenes/"+id`;
  assert.equal(
    versionarReferenciasTexto(fuente, VERSION),
    `import("/__assets/${VERSION}/_astro/otra.js");url("/__assets/${VERSION}/fuentes/t.woff2");fetch("/api/datos");const x="/__assets/${VERSION}/imagenes/"+id`,
  );
});

test('versionarUrlAsset mantiene las URLs al pedir una versión no válida', () => {
  assert.equal(
    versionarUrlAsset('/imagenes/logo.webp', 'https://www.siglo21sur.com/', 'no-version'),
    '/imagenes/logo.webp',
  );
});

test('lee sólo el objeto bajo versión y ruta permitidas, con cache inmutable', async () => {
  const h = harness();
  const response = await servirAssetR2(request(`/__assets/${VERSION}/_astro/app.js`), h.bucket, h.cache, h.contexto);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'contenido');
  assert.deepEqual(h.bucket.lecturas, [`manifests/${VERSION}.json`, `objects/${DIGEST}`]);
  assert.equal(response.headers.get('Content-Type'), 'image/webp');
  assert.equal(response.headers.get('ETag'), `"${DIGEST}"`);
  assert.equal(response.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
});

test('sirve las lecturas cacheadas sin volver a R2', async () => {
  const h = harness({ path: 'imagenes/logo.webp' });
  const path = `/__assets/${VERSION}/imagenes/logo.webp`;
  await servirAssetR2(request(path), h.bucket, h.cache, h.contexto);
  const response = await servirAssetR2(request(path), h.bucket, h.cache, h.contexto);
  assert.equal(await response.text(), 'contenido');
  assert.deepEqual(h.bucket.lecturas, [`manifests/${VERSION}.json`, `objects/${DIGEST}`]);
});

test('HEAD comparte metadata sin cuerpo y métodos de escritura no se permiten', async () => {
  const h = harness({ path: 'imagenes/logo.webp' });
  const path = `/__assets/${VERSION}/imagenes/logo.webp`;
  const head = await servirAssetR2(request(path, 'HEAD'), h.bucket, h.cache, h.contexto);
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const put = await servirAssetR2(request(path, 'PUT'), h.bucket, h.cache, h.contexto);
  assert.equal(put.status, 405);
  assert.equal(put.headers.get('Allow'), 'GET, HEAD');
  assert.equal(h.bucket.lecturas.length, 2);
});

test('rechaza versiones y segmentos de ruta inválidos sin consultar R2', async () => {
  const h = harness();
  for (const path of ['/__assets/latest/a.js', `/__assets/${VERSION}/../secret`, `/__assets/${VERSION}/`]) {
    const response = await servirAssetR2(request(path), h.bucket, h.cache, h.contexto);
    assert.equal(response.status, 404);
  }
  assert.deepEqual(h.bucket.lecturas, []);
});

test('decodifica nombres de archivo Unicode y rechaza separadores codificados', async () => {
  const h = harness({ path: 'imagenes/Escribanía.jpg' });
  const unicode = await servirAssetR2(
    request(`/__assets/${VERSION}/imagenes/Escriban%C3%ADa.jpg`), h.bucket, h.cache, h.contexto,
  );
  assert.equal(unicode.status, 200);
  assert.ok(h.bucket.lecturas.includes(`objects/${DIGEST}`));
  const traversal = await servirAssetR2(
    request(`/__assets/${VERSION}/imagenes/%2e%2e%2fsecreto`), h.bucket, h.cache, h.contexto,
  );
  assert.equal(traversal.status, 404);
  assert.deepEqual(h.bucket.lecturas, [
    `manifests/${VERSION}.json`, `objects/${DIGEST}`,
  ]);
});

test('sirve CSS/JS con referencias reescritas a la misma versión', async () => {
  const h = harness({
    path: 'assets/app.js',
    content: 'import("/_astro/chunk.js");const src=`/imagenes/${name}`',
    contentType: 'text/javascript; charset=utf-8',
  });
  const response = await servirAssetR2(request(`/__assets/${VERSION}/assets/app.js`), h.bucket, h.cache, h.contexto);
  assert.equal(
    await response.text(),
    `import("/__assets/${VERSION}/_astro/chunk.js");const src=\`/__assets/${VERSION}/imagenes/\${name}\``,
  );
  assert.equal(response.headers.get('ETag'), null);
});

test('las respuestas parciales nunca contaminan la caché completa', async () => {
  const h = harness({ path: 'manual.pdf' });
  const response = await servirAssetR2(
    new Request(`https://www.siglo21sur.com/__assets/${VERSION}/manual.pdf`, {
      headers: { Range: 'bytes=0-2' },
    }),
    h.bucket,
    h.cache,
    h.contexto,
  );
  assert.equal(response.status, 200);
  assert.equal(h.bucket.lecturas.length, 2);
  assert.equal(await h.cache.match(new Request(`https://www.siglo21sur.com/__assets/${VERSION}/manual.pdf`)), undefined);
});

test('falla cerrado si el binding R2 no está disponible', async () => {
  const response = await servirAssetR2(
    request(`/__assets/${VERSION}/_astro/app.js`),
    undefined,
    undefined,
    { waitUntil() {} },
  );
  assert.equal(response.status, 503);
});
