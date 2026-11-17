import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventarioImagenes, pluginInventario } from '../scripts/inventario-imagenes.mjs';

test('el inventario normal recorre las imágenes y el fijo conserva sólo las rutas pedidas', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'cau-inventario-imagenes-'));
  try {
    mkdirSync(join(raiz, 'carreras'), { recursive: true });
    mkdirSync(join(raiz, 'novedades'));
    writeFileSync(join(raiz, 'carreras', 'abogacia.webp'), 'imagen');
    writeFileSync(join(raiz, 'novedades', 'articulo.jpg'), 'foto');
    writeFileSync(join(raiz, 'ignorado.txt'), 'texto');

    const completo = inventarioImagenes(raiz);
    assert.deepEqual(completo.map(imagen => imagen.ruta), [
      '/imagenes/carreras/abogacia.webp',
      '/imagenes/novedades/articulo.jpg',
    ]);
    assert.deepEqual(
      inventarioImagenes(raiz, ['/imagenes/novedades/articulo.jpg']),
      [completo[1]],
    );
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('el inventario fijo rechaza rutas repetidas, ausentes y listas mal formadas', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'cau-inventario-imagenes-'));
  try {
    assert.throws(() => inventarioImagenes(raiz, ['/imagenes/no.webp']), /no existe/);
    assert.throws(() => inventarioImagenes(raiz, ['/imagenes/no.webp', '/imagenes/no.webp']), /rutas únicas/);
    assert.throws(() => inventarioImagenes(raiz, 'no-es-una-lista'), /lista de rutas/);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('el plugin emite el inventario fijo únicamente para su módulo virtual', () => {
  const raiz = mkdtempSync(join(tmpdir(), 'cau-inventario-imagenes-'));
  try {
    writeFileSync(join(raiz, 'abogacia.webp'), 'imagen');
    const plugin = pluginInventario(raiz, ['/imagenes/abogacia.webp']);
    assert.equal(plugin.resolveId('virtual:inventario-imagenes'), '\0virtual:inventario-imagenes');
    assert.deepEqual(JSON.parse(plugin.load('\0virtual:inventario-imagenes').replace('export default ', '')), [{
      ruta: '/imagenes/abogacia.webp',
      carpeta: '(sueltas)',
      subcarpeta: null,
      bytes: 6,
    }]);
    assert.equal(plugin.load('otro-modulo'), undefined);
  } finally {
    rmSync(raiz, { recursive: true, force: true });
  }
});

test('el fixture E2E contiene sólo imágenes existentes en public/imagenes', () => {
  const raiz = fileURLToPath(new URL('../../public/imagenes/', import.meta.url));
  const fixture = new URL('./fixtures/inventario-imagenes-e2e.json', import.meta.url);
  const rutas = JSON.parse(readFileSync(fixture, 'utf8'));
  assert.ok(rutas.length >= 10);
  assert.deepEqual(inventarioImagenes(raiz, rutas).map(imagen => imagen.ruta), rutas);
});
