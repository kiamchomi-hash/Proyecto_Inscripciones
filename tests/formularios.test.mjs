import test from 'node:test';
import assert from 'node:assert/strict';

import { CAMPOS, columnaDe } from '../components/formularios/casas.ts';

test('cada campo declara la columna real de la tabla', () => {
  // Las dos que rompieron produccion el 23/08: la tabla las llama asi.
  assert.equal(columnaDe('lugarNacimiento'), 'localidad_nacimiento');
  assert.equal(columnaDe('domicilio'), 'direccion');
});

test('ningun campo comparte columna con otro', () => {
  const columnas = Object.values(CAMPOS).map(campo => campo.columna);
  assert.equal(new Set(columnas).size, columnas.length);
});
