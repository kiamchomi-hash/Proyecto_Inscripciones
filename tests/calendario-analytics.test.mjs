import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

test('clasifica sólo salidas internas desde el calendario hacia la oferta', () => {
  const analytics = cargarTypescript('lib/analytics.ts', { '@/lib/analytics-destino': { track: () => {} } });
  const origen = 'https://www.siglo21sur.com/calendario-academico';
  const salida = href => analytics.destinoDesdeCalendario('/calendario-academico', href, origen);

  assert.equal(salida('https://www.siglo21sur.com/?casa=siglo21#filtros-categoria'), 'oferta');
  assert.equal(salida('https://www.siglo21sur.com/#filtros-categoria'), 'oferta');
  assert.equal(salida('https://www.siglo21sur.com/'), 'oferta');
  assert.equal(salida('https://www.siglo21sur.com/teclab'), 'teclab');
  assert.equal(salida('https://www.siglo21sur.com/carreras/abogacia'), 'carrera');
  assert.equal(salida('https://www.siglo21sur.com/carreras/abogacia/inscripcion'), 'preinscripcion');
  assert.equal(salida('https://www.siglo21sur.com/contacto'), 'contacto');
  assert.equal(analytics.destinoDesdeCalendario('/', 'https://www.siglo21sur.com/#filtros-categoria', origen), null);
  assert.equal(salida('https://21.edu.ar/carreras/abogacia'), null);
  assert.equal(salida('https://www.siglo21sur.com/clases-apoyo'), null);
  assert.equal(salida('https://www.siglo21sur.com/faq'), null);
});

test('registra la salida en el navegador y la manda al servidor para contarla en D1', () => {
  const eventos = [];
  const pedidos = [];
  const ventanaPrevia = globalThis.window;
  const fetchPrevio = globalThis.fetch;
  // El módulo de producción no manda nada sin navegador, que es justo lo que
  // evita que un render en el servidor cuente una salida que no existió.
  globalThis.window = {};
  globalThis.fetch = (url, opciones) => {
    pedidos.push({ url, cuerpo: JSON.parse(opciones.body) });
    return Promise.resolve({ ok: true });
  };

  try {
    const analytics = cargarTypescript('lib/analytics.ts', {
      '@/lib/analytics-destino': { track: (nombre, datos) => eventos.push({ nombre, datos }) },
    });

    analytics.trackSalidaCalendario('oferta');
    analytics.trackSalidaCalendario('teclab');
  } finally {
    if (ventanaPrevia === undefined) delete globalThis.window;
    else globalThis.window = ventanaPrevia;
    globalThis.fetch = fetchPrevio;
  }

  assert.deepEqual(eventos, [
    { nombre: 'calendario-salida', datos: { origen: 'calendario', destino: 'oferta' } },
    { nombre: 'calendario-salida', datos: { origen: 'calendario', destino: 'teclab' } },
  ]);
  assert.deepEqual(pedidos, [
    { url: '/api/alertas-analytics', cuerpo: { evento: 'calendario-salida', datos: { destino: 'oferta' } } },
    { url: '/api/alertas-analytics', cuerpo: { evento: 'calendario-salida', datos: { destino: 'teclab' } } },
  ]);
});

test('sin navegador no manda nada al servidor', () => {
  const pedidos = [];
  const fetchPrevio = globalThis.fetch;
  globalThis.fetch = (url, opciones) => { pedidos.push({ url, opciones }); return Promise.resolve({}); };
  try {
    const analytics = cargarTypescript('lib/analytics.ts', { '@/lib/analytics-destino': { track: () => {} } });
    analytics.trackSalidaCalendario('oferta');
  } finally {
    globalThis.fetch = fetchPrevio;
  }
  assert.deepEqual(pedidos, []);
});
