import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { construirManifiestoAssets } from '../scripts/sincronizar-assets-r2.mjs';
import { versionarReferenciasTexto } from '../src/entrega/assets-r2.ts';

const VERSION = 'f2663f9a-d5b8-4577-a2f6-debc5f34ad48';
const CLIENT = fileURLToPath(new URL('../dist/client/', import.meta.url));
const PREFIJOS_ASSET = /(?<![\w:])\/(?:_astro|imagenes|fuentes|folletos|planes|derivados)\//;

async function archivos(dir) {
  const resultado = [];
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name);
    if (entrada.isDirectory()) resultado.push(...await archivos(ruta));
    else if (entrada.isFile()) resultado.push(ruta);
  }
  return resultado;
}

test('el build no deja referencias locales sin versionar en CSS o JavaScript', async () => {
  const lista = await archivos(join(CLIENT, '_astro'));
  const texto = lista.filter(ruta => /\.(?:css|js)$/.test(ruta));
  assert.ok(texto.length > 0, 'el build debe generar CSS o JavaScript en _astro');
  for (const archivo of texto) {
    const contenido = await readFile(archivo, 'utf8');
    const salida = versionarReferenciasTexto(contenido, VERSION);
    assert.doesNotMatch(salida, PREFIJOS_ASSET, archivo);
  }
});

test('el manifiesto del build cubre assets publicables y sólo usa objetos deduplicables', async () => {
  const { manifiesto, objetos } = await construirManifiestoAssets(CLIENT, VERSION);
  const rutas = Object.keys(manifiesto.files);
  assert.ok(rutas.some(ruta => ruta.startsWith('_astro/')));
  assert.ok(rutas.some(ruta => ruta.startsWith('imagenes/')));
  assert.ok(rutas.some(ruta => ruta.startsWith('fuentes/')));
  assert.ok(rutas.some(ruta => ruta.startsWith('folletos/')));
  assert.ok(rutas.every(ruta => !ruta.startsWith('/') && !ruta.includes('\\')));
  assert.ok(objetos.size <= rutas.length);
});
