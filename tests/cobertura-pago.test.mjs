import test from 'node:test';
import assert from 'node:assert/strict';
import { coberturaDelPago } from '../components/formularios/cobertura-pago.ts';

const matricula = { concepto: 'Matrícula', monto: '$ 64.227,75', descuento: 75 };

test('con un bimestre dice que cubre lo que queda del cuatrimestre y que el siguiente se paga entero', () => {
  const texto = coberturaDelPago([matricula, { concepto: 'Bimestre (octubre-noviembre)', monto: '$ 488.131,28', descuento: 24 }]);
  assert.equal(texto, 'Cubre la matrícula y lo que queda del cuatrimestre: el bimestre de octubre y noviembre. El cuatrimestre siguiente se paga de nuevo, matrícula y bimestres.');
});

test('al inicio del cuatrimestre dice que cubre el cuatrimestre completo', () => {
  const texto = coberturaDelPago([
    matricula,
    { concepto: 'Bimestre (agosto-septiembre)', monto: '$ 488.131,28', descuento: 24 },
    { concepto: 'Bimestre (octubre-noviembre)', monto: '$ 488.131,28', descuento: 24 },
  ]);
  assert.equal(texto, 'Cubre la matrícula y el cuatrimestre completo, de agosto a noviembre. El cuatrimestre siguiente se paga de nuevo, matrícula y bimestres.');
});

test('sin meses en el rótulo no inventa fechas', () => {
  const texto = coberturaDelPago([{ concepto: 'Bimestre 2B', monto: '$ 1', descuento: null }]);
  assert.equal(texto, 'Cubre lo que queda del cuatrimestre: un bimestre de cursada. El cuatrimestre siguiente se paga de nuevo, matrícula y bimestres.');
});

test('sin bimestres no afirma nada', () => {
  assert.equal(coberturaDelPago([matricula]), null);
  assert.equal(coberturaDelPago([]), null);
});

const CIERRE_DOS_AÑOS = 'La carrera tiene 4 cuatrimestres (8 bimestres), y cada uno se paga aparte: matrícula y bimestres.';

test('con la duración dice cuántos cuatrimestres y bimestres tiene la carrera (2B)', () => {
  const texto = coberturaDelPago([matricula, { concepto: 'Bimestre (octubre-noviembre)', monto: '$ 1', descuento: null }], '2 años');
  assert.equal(texto, `Cubre la matrícula y lo que queda del cuatrimestre: el bimestre de octubre y noviembre. ${CIERRE_DOS_AÑOS}`);
});

test('en el primer cuatrimestre (1A/1B) dice de marzo a junio', () => {
  const texto = coberturaDelPago([
    matricula,
    { concepto: 'Bimestre (marzo-abril)', monto: '$ 1', descuento: null },
    { concepto: 'Bimestre (mayo-junio)', monto: '$ 1', descuento: null },
  ], '2 años');
  assert.equal(texto, `Cubre la matrícula y el cuatrimestre completo, de marzo a junio. ${CIERRE_DOS_AÑOS}`);
});

test('reconoce «Primer bimestre» y «Segundo bimestre» sin inventar meses', () => {
  const texto = coberturaDelPago([
    matricula,
    { concepto: 'Primer bimestre', monto: '$ 1', descuento: null },
    { concepto: 'Segundo bimestre', monto: '$ 1', descuento: null },
  ], '2 años');
  assert.equal(texto, `Cubre la matrícula y el cuatrimestre completo. ${CIERRE_DOS_AÑOS}`);
});

test('una duración que no son años ni meses enteros cae en el cierre genérico', () => {
  const texto = coberturaDelPago([matricula, { concepto: 'Bimestre (octubre-noviembre)', monto: '$ 1', descuento: null }], '4 semanas');
  assert.equal(texto, 'Cubre la matrícula y lo que queda del cuatrimestre: el bimestre de octubre y noviembre. El cuatrimestre siguiente se paga de nuevo, matrícula y bimestres.');
});
