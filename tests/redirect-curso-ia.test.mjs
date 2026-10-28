import test from 'node:test';
import assert from 'node:assert/strict';
import { buscarRedireccion } from '../cloudflare/src/entrega/redirects.ts';

// El curso de IA de Teclab salió de la oferta el 21/10/2026 (carrera 235
// inactiva). Quedaron dos URLs indexadas y las dos van a la home, como el resto
// de las bajas: la de "Curso de", publicada desde el 01/08, y la de "Curso en",
// el slug provisorio de los dos primeros días.

const SLUGS = [
  '/carreras/curso-de-actualizacion-profesional-en-inteligencia-artificial',
  '/carreras/curso-en-actualizacion-profesional-en-inteligencia-artificial',
];

test('las dos URLs del curso de IA van a la home con un redirect permanente', () => {
  for (const source of SLUGS) {
    assert.deepEqual(buscarRedireccion(source), { origen: source, destino: '/', estado: 301 }, source);
  }
});

test('ninguna URL del curso de IA queda apuntando a otra ficha', () => {
  // La regla vieja mandaba "Curso en" a "Curso de": con la carrera dada de baja
  // eso era un redirect a un 404.
  for (const source of SLUGS) assert.equal(buscarRedireccion(source)?.destino, '/', source);
});
