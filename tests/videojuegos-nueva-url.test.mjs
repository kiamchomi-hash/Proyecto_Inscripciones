import test from 'node:test';
import assert from 'node:assert/strict';
import { carreraToSlug } from '../components/index/types.ts';
import { buscarRedireccion } from '../cloudflare/src/entrega/redirects.ts';

test('Videojuegos de Siglo 21 usa la nueva URL y las anteriores redirigen a ella', () => {
  assert.equal(carreraToSlug({ nombre: 'Diseño y Desarrollo de Videojuegos', prefix: 'Tecnicatura en' }), 'siglo-21-video-juegos');
  // Las URLs viejas no redirigían y la `/inscripcion` quedó indexada: en Google
  // aparecía una página en blanco. Ahora consolidan en la ficha vigente.
  assert.deepEqual(buscarRedireccion('/carreras/tecnicatura-en-videojuegos'),
    { origen: '/carreras/tecnicatura-en-videojuegos', destino: '/carreras/siglo-21-video-juegos', estado: 301 });
  assert.deepEqual(buscarRedireccion('/carreras/tecnicatura-en-videojuegos/inscripcion'),
    { origen: '/carreras/tecnicatura-en-videojuegos/inscripcion', destino: '/carreras/siglo-21-video-juegos', estado: 301 });
  assert.equal(buscarRedireccion('/carreras/tecnicatura-en-diseno-y-desarrollo-de-videojuegos'), null);
  assert.equal(carreraToSlug({ nombre: 'Tecnicatura Superior en Desarrollo de Videojuegos', prefix: 'Tecnicatura Superior en' }), 'tecnicatura-superior-en-desarrollo-de-videojuegos');
});
