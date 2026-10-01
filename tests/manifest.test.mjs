import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

function cargarManifest() {
  const fuente = readFileSync(new URL('../app/manifest.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(fuente, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  new Function('exports', outputText)(exports);
  return exports.default();
}

test('manifest identifica el sitio público sin prometer funcionamiento offline', () => {
  const manifest = cargarManifest();
  assert.equal(manifest.name, 'Universidad Siglo 21 — CAU Villa Lugano');
  assert.equal(manifest.short_name, 'Siglo 21 CAU');
  for (const campo of ['id', 'start_url', 'scope']) assert.equal(manifest[campo], '/');
  assert.equal(manifest.lang, 'es-AR');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, '#096757');
  assert.equal(manifest.background_color, '#041211');
  assert.deepEqual(manifest.icons.map(icon => icon.sizes), ['192x192', '512x512']);
  assert.ok(manifest.icons.every(icon => icon.purpose === 'any' && icon.type === 'image/png'));
});

test('íconos de instalación y Apple son PNG cuadrados opacos del tamaño declarado', async () => {
  for (const [archivo, lado] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
    const imagen = sharp(fileURLToPath(new URL(`../public/${archivo}`, import.meta.url)));
    const metadata = await imagen.metadata();
    assert.equal(metadata.format, 'png');
    assert.equal(metadata.width, lado);
    assert.equal(metadata.height, lado);
    const { data, info } = await imagen.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 3; i < data.length; i += info.channels) assert.equal(data[i], 255);
  }
});

test('Apple usa el ícono cuadrado y no duplica el manifest automático de Next', () => {
  const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8');
  assert.match(layout, /apple:\s*\{\s*url:\s*'\/apple-touch-icon\.png',\s*sizes:\s*'180x180'/);
  assert.doesNotMatch(layout, /rel=["']manifest["']/);
});
