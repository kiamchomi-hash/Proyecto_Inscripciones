import test from 'node:test';
import assert from 'node:assert/strict';
import { COBERTURA_PAGO, coberturaDelPago } from '../components/formularios/cobertura-pago.ts';

const matricula = { concepto: 'Matrícula', monto: '$ 64.227,75', descuento: 75 };
const TEXTO = 'Este pago cubre la matrícula y los bimestres detallados. El cuatrimestre siguiente requiere un nuevo pago de matrícula y bimestres.';

test('el texto dice qué cubre el pago y que el cuatrimestre siguiente se vuelve a pagar', () => {
  assert.equal(COBERTURA_PAGO, TEXTO);
});

test('con uno o dos bimestres el texto es el mismo: no cuenta ni nombra meses', () => {
  assert.equal(coberturaDelPago([matricula, { concepto: 'Bimestre (octubre-noviembre)', monto: '$ 1', descuento: null }]), TEXTO);
  assert.equal(coberturaDelPago([
    matricula,
    { concepto: 'Bimestre (agosto-septiembre)', monto: '$ 1', descuento: null },
    { concepto: 'Bimestre (octubre-noviembre)', monto: '$ 1', descuento: null },
  ]), TEXTO);
});

test('reconoce el bimestre que el robot rotula sin período', () => {
  assert.equal(coberturaDelPago([{ concepto: 'Primer bimestre', monto: '$ 1', descuento: null }]), TEXTO);
});

test('sin bimestres (pago único) no afirma nada', () => {
  assert.equal(coberturaDelPago([matricula]), null);
  assert.equal(coberturaDelPago([]), null);
});
