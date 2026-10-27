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
  // Las reglas de Teclab del 09/10/2026 se agregaron después de tomar la huella
  // y se prueban aparte, en teclab-proximamente.test.mjs.
  const nuevas = new Set([
    hotelera,
    '/carreras/tecnicatura-superior-en-energias-renovables',
    '/carreras/tecnicatura-superior-en-fintech',
    '/carreras/tecnicatura-superior-en-acompanamiento-terapeutico',
    '/carreras/tecnicatura-superior-en-producto-digital',
    // Agile Coaching (16/10/2026), probada en teclab-bloques-2-y-3.test.mjs.
    '/carreras/tecnicatura-superior-en-gestion-de-equipos-agiles-agile-coaching',
    // Curso de IA de Teclab (21/10/2026), probada en redirect-curso-ia.test.mjs.
    // La otra URL del curso —la de "Curso en"— ya estaba en la huella: cambió
    // su destino de la ficha a la home, así que la huella se volvió a tomar.
    '/carreras/curso-de-actualizacion-profesional-en-inteligencia-artificial',
  ]);
  const redirects = (await config.redirects()).filter(regla => !nuevas.has(regla.source));
  // Huella de las 23 reglas anteriores: rutas, destinos, códigos y condiciones.
  // La última vez se volvió a tomar el 27/10/2026, cuando Energías Renovables de
  // Teclab pasó de apuntar a la ficha renombrada a la home: el renombre quedó
  // como regla propia. Ese mismo día se fue la regla de
  // host del alias viejo, así que ahora son 23.
  const hash = createHash('sha256').update(JSON.stringify(redirects)).digest('hex');
  assert.equal(hash, 'f3235773f5f1fc78a8be76a08a776e69065fed4af693e958efd64369e2deae2c');
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
