import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretarNpm, compararVersiones, resumenAviso } from '../herramientas/actualizaciones.mjs';

test('npm outdated distingue actualizaciones de errores', () => {
  assert.deepEqual(interpretarNpm(0, '{}'), []);
  assert.deepEqual(interpretarNpm(1, '{"x":{"current":"1.0.0","latest":"2.0.0"}}'),
    [{ nombre: 'x', instalada: '1.0.0', disponible: '2.0.0' }]);
  assert.throws(() => interpretarNpm(1, ''));
  assert.throws(() => interpretarNpm(2, '{}'));
});

test('versiones estables se comparan numéricamente, no alfabéticamente', () => {
  assert.equal(compararVersiones('v2.3.0', '2.10.0'), true);
  assert.equal(compararVersiones('2.10.0', '2.3.0'), false);
  assert.equal(compararVersiones('2.3.0-beta.1', '2.3.0'), null);
  assert.equal(compararVersiones('desconocida', '2.0.0'), null);
});

test('el aviso no depende de la fecha del informe', () => {
  const resultados = [{ fuente: 'npm', estado: 'actualizaciones', detalle: ['x: 1 → 2'] }];
  assert.equal(resumenAviso(resultados), resumenAviso(structuredClone(resultados)));
  assert.notEqual(resumenAviso(resultados), resumenAviso([{ fuente: 'npm', estado: 'error', detalle: [] }]));
});
