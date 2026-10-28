// El manifiesto de derivadas tiene que estar al día con las fotos de `public/`.
//
// Si alguien cambia una imagen y no corre el generador, el `srcset` apuntaría a
// un hash que ya no existe y el navegador no mostraría nada. El fallo se detecta
// acá, en `npm test`, y no en producción.

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const RAIZ = new URL('..', import.meta.url).pathname;
const MANIFIESTO = `${RAIZ}lib/imagenes/derivadas.ts`;
const DERIVADOS = `${RAIZ}public/derivados`;
const ANCHO_MAXIMO = 1600;

function generar(argumentos = []) {
  return execFileSync('node', ['herramientas/derivar-imagenes.mjs', ...argumentos], { cwd: RAIZ, stdio: 'pipe' });
}

test('el manifiesto de derivadas está al día y todos sus archivos existen', () => {
  // En un clon nuevo los derivados no están (no se versionan): se generan una
  // vez. Si ya están, esto sólo compara, que es lo que hace barato a `npm test`.
  if (!existsSync(DERIVADOS)) generar();

  assert.ok(existsSync(MANIFIESTO), 'Falta lib/imagenes/derivadas.ts: correr node herramientas/derivar-imagenes.mjs');

  try {
    generar(['--verificar']);
  } catch (error) {
    const detalle = error.stderr?.toString() ?? error.message;
    assert.fail(
      `El manifiesto no coincide con las fotos o falta un derivado.\n` +
        `Correr: node herramientas/derivar-imagenes.mjs\n${detalle}`,
    );
  }
});

test('cada entrada del manifiesto declara hash, anchos válidos y sus archivos', () => {
  const texto = readFileSync(MANIFIESTO, 'utf8');
  const entradas = [...texto.matchAll(/^ {2}"(.+)": \{ hash: '([0-9a-f]{8})', anchos: \[([0-9, ]*)\] \},$/gm)];
  assert.ok(entradas.length > 0, 'El manifiesto quedó vacío');

  for (const [, ruta, hash, anchosTexto] of entradas) {
    assert.match(ruta, /^\/imagenes\//, `Ruta inesperada: ${ruta}`);
    const anchos = anchosTexto.split(',').map((a) => Number(a.trim())).filter(Boolean);
    assert.ok(anchos.length > 0, `${ruta} no declara anchos`);
    assert.deepEqual(anchos, [...anchos].sort((a, b) => a - b), `${ruta} declara anchos desordenados`);
    for (const ancho of anchos) {
      assert.ok(Number.isInteger(ancho) && ancho > 0 && ancho <= ANCHO_MAXIMO, `${ruta} declara un ancho inválido: ${ancho}`);
      assert.ok(existsSync(`${DERIVADOS}/${hash}-${ancho}.webp`), `Falta el derivado ${hash}-${ancho}.webp de ${ruta}`);
    }
    assert.equal(new Set(anchos).size, anchos.length, `${ruta} repite un ancho`);
  }
});
