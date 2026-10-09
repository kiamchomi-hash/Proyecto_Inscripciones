import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import config from '../next.config.ts';

const hotelera = '/carreras/licenciatura-en-administracion-hotelera';

test('Hotelera activa no se redirige a la home ni a otra ficha', async () => {
  const redirects = await config.redirects();
  assert.equal(redirects.some(regla => regla.source === hotelera), false);
});

test('se conservan exactamente las demás reglas de redirección', async () => {
  // Energías Renovables (09/10/2026) se agregó después de tomar la huella y se
  // prueba aparte, en teclab-proximamente.test.mjs.
  const nuevas = new Set([hotelera, '/carreras/tecnicatura-superior-en-energias-renovables']);
  const redirects = (await config.redirects()).filter(regla => !nuevas.has(regla.source));
  // Huella de las 23 reglas anteriores: rutas, destinos, códigos y condiciones.
  const hash = createHash('sha256').update(JSON.stringify(redirects)).digest('hex');
  assert.equal(hash, '9dd3b994436cc68a6e8964c02aa2b9670e41c1700d8665bec271e0249343eeda');
  for (const source of [
    '/carreras/licenciatura-en-agroinformatica',
    '/carreras/licenciatura-en-nutricion',
    '/carreras/licenciatura-en-sociologia',
    '/carreras/tecnicatura-superior-en-venta-directa',
  ]) {
    assert.deepEqual(redirects.find(regla => regla.source === source), {
      source, destination: '/', statusCode: 301,
    });
  }
});
