import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

test('clasifica sólo salidas internas desde el calendario hacia inicio o carreras', () => {
  const analytics = cargarTypescript('lib/analytics.ts', { '@vercel/analytics': { track: () => {} } });
  const origen = 'https://www.siglo21sur.com/calendario-academico';

  assert.equal(analytics.destinoDesdeCalendario('/calendario-academico', 'https://www.siglo21sur.com/', origen), 'inicio');
  assert.equal(analytics.destinoDesdeCalendario('/calendario-academico', 'https://www.siglo21sur.com/#filtros-categoria', origen), 'carreras');
  assert.equal(analytics.destinoDesdeCalendario('/calendario-academico', 'https://www.siglo21sur.com/carreras/abogacia', origen), 'carreras');
  assert.equal(analytics.destinoDesdeCalendario('/', 'https://www.siglo21sur.com/#filtros-categoria', origen), null);
  assert.equal(analytics.destinoDesdeCalendario('/calendario-academico', 'https://21.edu.ar/carreras/abogacia', origen), null);
  assert.equal(analytics.destinoDesdeCalendario('/calendario-academico', 'https://www.siglo21sur.com/contacto', origen), null);
});

test('registra un evento de salida con origen y destino, sin datos personales', () => {
  const eventos = [];
  const analytics = cargarTypescript('lib/analytics.ts', {
    '@vercel/analytics': { track: (nombre, datos) => eventos.push({ nombre, datos }) },
  });

  analytics.trackSalidaCalendario('carreras');
  analytics.trackSalidaCalendario('inicio');
  assert.deepEqual(eventos, [
    { nombre: 'calendario-salida', datos: { origen: 'calendario', destino: 'carreras' } },
    { nombre: 'calendario-salida', datos: { origen: 'calendario', destino: 'inicio' } },
  ]);
});
