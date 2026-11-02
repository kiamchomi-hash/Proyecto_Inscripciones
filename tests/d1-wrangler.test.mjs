import test from 'node:test';
import assert from 'node:assert/strict';

import { conReintentos, esTransitorio, ejecutarD1, jsonDeSalida, motivoDeFallo } from '../herramientas/d1-wrangler.mjs';

// Salida real de wrangler cuando la API rechaza el token recién renovado
// (02/11/2026, publicador de precios de Siglo 21).
const SALIDA_401 = `{
  "error": {
    "text": "A request to the Cloudflare API (/accounts/<cuenta>/d1/database/cau-produccion) failed.",
    "notes": [
      {
        "text": "Authentication error [code: 10000]"
      }
    ],
    "kind": "error",
    "name": "APIError",
    "code": 10000
  }
}`;

test('el 401 del token recién renovado se reconoce como transitorio', () => {
  const motivo = motivoDeFallo({ stdout: SALIDA_401 });
  assert.match(motivo, /Authentication error \[code: 10000\]/);
  assert.equal(esTransitorio(motivo), true);
});

test('los errores de SQL o de base inexistente no se reintentan', () => {
  for (const motivo of [
    'SQLITE_ERROR: near "SELEC": syntax error',
    'no such table: precios_privados',
    "Couldn't find a D1 DB with name or binding 'base-que-no-existe' in your config or the API.",
    'D1_ERROR: UNIQUE constraint failed: carreras.slug',
  ]) assert.equal(esTransitorio(motivo), false, motivo);
});

test('los 5xx y los cortes de red se reintentan', () => {
  for (const motivo of ['Unavailable 503', 'Internal Server Error', 'fetch failed', 'read ECONNRESET']) {
    assert.equal(esTransitorio(motivo), true, motivo);
  }
});

test('el motivo no arrastra el comando de wrangler', () => {
  const motivo = motivoDeFallo({
    message: 'Command failed: /home/alguien/node wrangler.js d1 execute cau-produccion --remote --yes --file x.sql\nError: D1_ERROR: near "INSERT": syntax error',
    stderr: 'Error: D1_ERROR: near "INSERT": syntax error',
  });
  assert.equal(motivo, 'Error: D1_ERROR: near "INSERT": syntax error');
  assert.doesNotMatch(motivo, /Command failed/);
});

test('reintenta el transitorio y devuelve el primer resultado bueno', () => {
  const esperas = [];
  let intentos = 0;
  const resultado = conReintentos(() => {
    intentos += 1;
    if (intentos < 3) throw Object.assign(new Error('Authentication error [code: 10000]'), { transitorio: true });
    return 'ok';
  }, { esperas: [1, 2, 3], dormir: ms => esperas.push(ms) });
  assert.equal(resultado, 'ok');
  assert.equal(intentos, 3);
  assert.deepEqual(esperas, [1, 2]);
});

test('un fallo que no es transitorio corta en el primer intento', () => {
  let intentos = 0;
  assert.throws(() => conReintentos(() => {
    intentos += 1;
    throw Object.assign(new Error('D1_ERROR: near "SELEC": syntax error'), { transitorio: false });
  }, { esperas: [1], dormir: () => assert.fail('no debería esperar') }), /syntax error/);
  assert.equal(intentos, 1);
});

test('agotadas las esperas, relanza el último error', () => {
  let intentos = 0;
  assert.throws(() => conReintentos(() => {
    intentos += 1;
    throw Object.assign(new Error(`falló (${intentos})`), { transitorio: true });
  }, { esperas: [1, 2], dormir: () => {} }), /falló \(3\)/);
  assert.equal(intentos, 3);
});

test('con --file, el progreso de la subida no rompe la lectura del JSON', () => {
  const salida = '├ Checking if file needs uploading\n│\n├ 🌀 Uploading cau-produccion.sql\n│ 🌀 Uploading complete.\n│\n[\n  { "results": [{ "n": 1 }] }\n]';
  assert.deepEqual(jsonDeSalida(salida), [{ results: [{ n: 1 }] }]);
  assert.equal(jsonDeSalida('sólo texto suelto'), null);
});

test('sin consulta ni archivo, no llama a wrangler', () => {
  assert.throws(() => ejecutarD1({ base: 'cau-produccion' }), /Falta la consulta o el archivo/);
});
