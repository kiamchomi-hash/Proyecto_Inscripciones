import test from 'node:test';
import assert from 'node:assert/strict';
import { buscarRedireccion } from '../cloudflare/src/entrega/redirects.ts';

const hotelera = '/carreras/licenciatura-en-administracion-hotelera';

test('Hotelera activa no se redirige a la home ni a otra ficha', () => {
  assert.equal(buscarRedireccion(hotelera), null);
});

test('las bajas conocidas siguen yendo a la home con su código', () => {
  for (const [source, estado] of [
    ['/carreras/licenciatura-en-agroinformatica', 301],
    ['/carreras/licenciatura-en-nutricion', 301],
    ['/carreras/licenciatura-en-sociologia', 301],
    ['/carreras/tecnicatura-superior-en-venta-directa', 301],
    ['/carreras/tecnicatura-superior-en-fintech', 308],
    ['/carreras/tecnicatura-superior-en-acompanamiento-terapeutico', 308],
    ['/carreras/tecnicatura-superior-en-producto-digital', 308],
    ['/carreras/diplomatura-en-inteligencia-artificial', 302],
  ]) {
    assert.deepEqual(buscarRedireccion(source), { origen: source, destino: '/', estado }, source);
  }
});
