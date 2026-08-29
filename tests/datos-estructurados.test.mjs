import test from 'node:test';
import assert from 'node:assert/strict';

import { duracionISO } from '../lib/duracion-iso.ts';

test('las duraciones enteras salen en ISO 8601', () => {
  assert.equal(duracionISO('4 años'), 'P4Y');
  assert.equal(duracionISO('2 años'), 'P2Y');
  assert.equal(duracionISO('1 mes'), 'P1M');
  assert.equal(duracionISO('4 meses'), 'P4M');
  assert.equal(duracionISO('4 semanas'), 'P4W');
});

test('medio año se escribe en meses, porque P2.5Y no existe', () => {
  assert.equal(duracionISO('2.5 años'), 'P2Y6M');
  assert.equal(duracionISO('4 años y medio'), 'P4Y6M');
});

test('el titulo previo de un CCC es un requisito, no parte de la duracion', () => {
  assert.equal(duracionISO('Título previo + 2 años'), 'P2Y');
  assert.equal(duracionISO('Título previo + 1.5 años'), 'P1Y6M');
});

test('el total entre parentesis no es lo que dura el programa', () => {
  // Escribania: se cursa 1 año sobre un titulo de Abogacia que ya se tiene.
  // Declarar los 5 años seria afirmarle a Google algo falso.
  assert.equal(duracionISO('Título de Abogacía + 1 año (5 años)'), 'P1Y');
});

test('lo que no se entiende no se declara', () => {
  assert.equal(duracionISO('Consultar'), null);
  assert.equal(duracionISO(''), null);
  assert.equal(duracionISO(null), null);
  assert.equal(duracionISO(undefined), null);
  assert.equal(duracionISO('a convenir'), null);
});
