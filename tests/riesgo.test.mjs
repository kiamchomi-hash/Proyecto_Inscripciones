import test from 'node:test';
import assert from 'node:assert/strict';
import { clasificarRiesgo, NIVELES } from '../herramientas/riesgo.mjs';

test('clasifica documentación como riesgo bajo', () => {
  assert.deepEqual(clasificarRiesgo(['docs/guia.md']), {
    nivel: 'bajo',
    verificaciones: ['npm run check'],
  });
});

test('clasifica código compartido como riesgo medio', () => {
  assert.deepEqual(clasificarRiesgo(['lib/validacion.ts']), {
    nivel: 'medio',
    verificaciones: ['npm run check'],
  });
});

test('clasifica cambios de API o configuración de producción como riesgo alto', () => {
  const resultado = clasificarRiesgo(['cloudflare/src/api/formularios.ts']);
  assert.equal(resultado.nivel, 'alto');
  assert.deepEqual(resultado.verificaciones, [
    'npm run check',
    'npm --prefix cloudflare run build',
    'pruebas del área afectada',
    'npm --prefix cloudflare run check',
  ]);
});

test('toma el mayor riesgo y no duplica controles en cambios mixtos', () => {
  const resultado = clasificarRiesgo(['docs/guia.md', 'cloudflare/migrations/0001.sql']);
  assert.equal(resultado.nivel, 'alto');
  assert.equal(new Set(resultado.verificaciones).size, resultado.verificaciones.length);
});

test('rechaza rutas inválidas y declara el orden de niveles', () => {
  assert.throws(() => clasificarRiesgo(['../secreto']), TypeError);
  assert.throws(() => clasificarRiesgo(['/etc/passwd']), TypeError);
  assert.deepEqual(NIVELES, ['bajo', 'medio', 'alto']);
});
