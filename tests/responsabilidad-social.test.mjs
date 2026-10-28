import test from 'node:test';
import assert from 'node:assert/strict';
import { buscarRedireccion } from '../cloudflare/src/entrega/redirects.ts';

test('la ficha ofrecida de Responsabilidad y Gestión Social no redirige a la home', () => {
  assert.equal(buscarRedireccion('/carreras/tecnicatura-en-responsabilidad-y-gestion-social'), null);
  for (const source of ['/carreras/licenciatura-en-agroinformatica', '/carreras/tecnicatura-superior-en-venta-directa']) {
    assert.equal(buscarRedireccion(source)?.destino, '/');
  }
});
