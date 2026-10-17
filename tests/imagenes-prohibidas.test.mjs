import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// Imágenes que no se usan más (docs/criterios.md). El banner de Siglo 21 trae
// texto y logo, y como portada de carrera se veía recortado.
const PROHIBIDAS = ['Header_1920x450-1'];

// sql/ y la fixture de las cinco altas quedan afuera: son el registro de lo
// que se corrió en su momento, no lo que se publica hoy.
const CARPETAS = ['app', 'components', 'lib'];
const EXTENSIONES = new Set(['.ts', '.tsx', '.js', '.mjs', '.css', '.json']);

function archivos(dir) {
  return readdirSync(dir).flatMap(nombre => {
    const ruta = path.join(dir, nombre);
    if (statSync(ruta).isDirectory()) return archivos(ruta);
    return EXTENSIONES.has(path.extname(nombre)) ? [ruta] : [];
  });
}

test('ninguna imagen prohibida aparece en el código del sitio', () => {
  const usos = CARPETAS.flatMap(archivos).flatMap(ruta => {
    const texto = readFileSync(ruta, 'utf8');
    return PROHIBIDAS.filter(nombre => texto.includes(nombre)).map(nombre => `${ruta}: ${nombre}`);
  });
  assert.deepEqual(usos, []);
});
