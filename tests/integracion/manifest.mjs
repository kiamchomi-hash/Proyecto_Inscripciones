import assert from 'node:assert/strict';
import sharp from 'sharp';
const base = process.env.MANIFEST_TEST_URL || 'http://localhost:3107';
const respuesta = await fetch(`${base}/manifest.webmanifest`);
assert.equal(respuesta.status, 200);
assert.match(respuesta.headers.get('content-type'), /application\/manifest\+json/);
const manifest = await respuesta.json();
assert.equal(manifest.id, '/');
assert.equal(manifest.start_url, '/');
assert.equal(manifest.scope, '/');
for (const icono of [...manifest.icons, { src: '/apple-touch-icon.png', sizes: '180x180' }]) {
  const res = await fetch(`${base}${icono.src}`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /image\/png/);
  const meta = await sharp(Buffer.from(await res.arrayBuffer())).metadata();
  assert.equal(`${meta.width}x${meta.height}`, icono.sizes);
}
const htmlRes = await fetch(`${base}/`);
assert.equal(htmlRes.status, 200);
const html = await htmlRes.text();
assert.equal([...html.matchAll(/<link[^>]+rel="manifest"[^>]*>/g)].length, 1);
assert.match(html, /rel="manifest"[^>]+href="\/manifest.webmanifest"/);
assert.equal([...html.matchAll(/<link[^>]+rel="apple-touch-icon"[^>]*>/g)].length, 1);
assert.match(html, /rel="apple-touch-icon"[^>]+href="\/apple-touch-icon.png"/);
assert.match(html, /<link[^>]+rel="canonical"[^>]+href="https:\/\/www.siglo21sur.com\/?"/);
console.log('Manifest JSON/MIME, 3 íconos PNG, enlaces únicos y canónica: OK');
