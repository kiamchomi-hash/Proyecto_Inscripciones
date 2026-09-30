import test from 'node:test';
import assert from 'node:assert/strict';
import config from '../next.config.ts';

test('la ficha ofrecida de Responsabilidad y Gestión Social no redirige a la home', async () => {
  const redirects = await config.redirects();
  assert.equal(redirects.find(r => r.source === '/carreras/tecnicatura-en-responsabilidad-y-gestion-social'), undefined);
  for (const source of ['/carreras/licenciatura-en-agroinformatica', '/carreras/tecnicatura-superior-en-venta-directa']) {
    assert.equal(redirects.find(r => r.source === source)?.destination, '/');
  }
});
