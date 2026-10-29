import test from 'node:test';
import assert from 'node:assert/strict';
import { carreraToSlug } from '../components/index/types.ts';
import { buscarRedireccion } from '../cloudflare/src/entrega/redirects.ts';

test('Videojuegos de Siglo 21 usa la nueva URL sin redirigir las anteriores', () => {
  assert.equal(carreraToSlug({ nombre: 'Diseño y Desarrollo de Videojuegos', prefix: 'Tecnicatura en' }), 'siglo-21-video-juegos');
  assert.equal(buscarRedireccion('/carreras/tecnicatura-en-videojuegos'), null);
  assert.equal(buscarRedireccion('/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos'), null);
  assert.equal(carreraToSlug({ nombre: 'Tecnicatura Superior en Desarrollo de Videojuegos', prefix: 'Tecnicatura Superior en' }), 'tecnicatura-superior-en-desarrollo-de-videojuegos');
});
