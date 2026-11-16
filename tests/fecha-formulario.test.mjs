import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fechaEntradaAIso,
  fechaIsoAEntrada,
  normalizarEntradaFecha,
} from '../components/formularios/fecha.ts';

test('la fecha del estado ISO se muestra como DD/MM/AAAA', () => {
  assert.equal(fechaIsoAEntrada('2008-01-09'), '09/01/2008');
  assert.equal(fechaIsoAEntrada(''), '');
  assert.equal(fechaIsoAEntrada('2008-1-9'), '');
});

test('normaliza la escritura numérica con barras sin perder los dígitos', () => {
  assert.equal(normalizarEntradaFecha('13012008'), '13/01/2008');
  assert.equal(normalizarEntradaFecha('13/01/2008'), '13/01/2008');
  assert.equal(normalizarEntradaFecha('13/01/20089'), '13/01/2008');
});

test('convierte fechas válidas a ISO y rechaza fechas imposibles', () => {
  assert.equal(fechaEntradaAIso('09/01/2008'), '2008-01-09');
  assert.equal(fechaEntradaAIso('29/02/2000'), '2000-02-29');
  assert.equal(fechaEntradaAIso('29/02/1900'), null);
  assert.equal(fechaEntradaAIso('31/04/2008'), null);
  assert.equal(fechaEntradaAIso('00/01/2008'), null);
  assert.equal(fechaEntradaAIso('1/01/2008'), null);
  assert.equal(fechaEntradaAIso('09/01/08'), null);
});
