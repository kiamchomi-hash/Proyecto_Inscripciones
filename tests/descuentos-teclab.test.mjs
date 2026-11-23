import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promoTeclab, hoyArgentina } from '../components/carreras/descuentos-teclab.ts';
import { sortearVarianteTicket, ticketsSegunVariante, esVarianteTicket } from '../lib/ab-ticket-teclab.ts';

const conceptos = [
  { concepto: 'Matrícula', descuento: 75, monto: '$1' },
  { concepto: 'Bimestre (marzo-mayo)', descuento: 25, monto: '$2' },
  { concepto: 'Bimestre (junio-julio)', descuento: 25, monto: '$3' },
];

test('separa el descuento de la matrícula y el de los bimestres', () => {
  assert.deepEqual(promoTeclab(conceptos, '2026-11-23', '2026-11-23'), { matricula: 75, bimestres: 25, vigenteHasta: '2026-11-23' });
});

test('la matrícula puede ir al 100 %; un bimestre no', () => {
  const p = promoTeclab([{ concepto: 'Matrícula', descuento: 100 }, { concepto: 'Bimestre (marzo-mayo)', descuento: 100 }], '2026-12-01', '2026-11-23');
  assert.deepEqual(p, { matricula: 100, bimestres: null, vigenteHasta: '2026-12-01' });
});

test('vencida no hay tickets; el día de vigencia todavía vale', () => {
  assert.equal(promoTeclab(conceptos, '2026-11-22', '2026-11-23'), null);
  assert.notEqual(promoTeclab(conceptos, '2026-11-23', '2026-11-23'), null);
});

test('con dos porcentajes distintos promete el menor', () => {
  const mezcla = [{ concepto: 'Bimestre (marzo-mayo)', descuento: 35 }, { concepto: 'Bimestre (junio-julio)', descuento: 20 }];
  assert.equal(promoTeclab(mezcla, '2026-12-01', '2026-11-23')?.bimestres, 20);
});

test('sin descuentos no hay tickets', () => {
  assert.equal(promoTeclab([{ concepto: 'Bimestre (marzo-mayo)', descuento: 0 }], '2026-12-01', '2026-11-23'), null);
});

test('al pasar al día siguiente en Argentina, no en UTC', () => {
  // 02:30 UTC del 24 son las 23:30 del 23 en Buenos Aires.
  assert.equal(hoyArgentina(new Date('2026-11-24T02:30:00Z')), '2026-11-23');
});

test('la página no recibe montos', () => {
  assert.deepEqual(Object.keys(promoTeclab(conceptos, '2026-11-23', '2026-11-23')).sort(), ['bimestres', 'matricula', 'vigenteHasta']);
});

test('A/B: 50 % sin ticket, 25 % borde blanco, 25 % borde azul', () => {
  assert.equal(sortearVarianteTicket(0), 'control');
  assert.equal(sortearVarianteTicket(0.499), 'control');
  assert.equal(sortearVarianteTicket(0.5), 'bimestres');
  assert.equal(sortearVarianteTicket(0.749), 'bimestres');
  assert.equal(sortearVarianteTicket(0.75), 'bimestres-azul');
  assert.equal(sortearVarianteTicket(0.9999), 'bimestres-azul');
  const cuenta = {};
  for (let i = 0; i < 8000; i++) { const v = sortearVarianteTicket(i / 8000); cuenta[v] = (cuenta[v] ?? 0) + 1; }
  assert.deepEqual(cuenta, { control: 4000, bimestres: 2000, 'bimestres-azul': 2000 });
});

test('A/B: lo que ve cada grupo: sólo el ticket de los bimestres', () => {
  const promo = promoTeclab(conceptos, '2026-11-23', '2026-11-23');
  const soloBimestres = { ...promo, matricula: null };
  assert.equal(ticketsSegunVariante(promo, 'control'), null);
  assert.deepEqual(ticketsSegunVariante(promo, 'bimestres'), { promo: soloBimestres, borde: 'blanco' });
  assert.deepEqual(ticketsSegunVariante(promo, 'bimestres-azul'), { promo: soloBimestres, borde: 'azul' });
  assert.equal(ticketsSegunVariante({ ...promo, bimestres: null }, 'bimestres'), null);
});

test('A/B: una cookie con otro valor no se toma como grupo', () => {
  assert.equal(esVarianteTicket('bimestres-azul'), true);
  assert.equal(esVarianteTicket('ambos'), false);
  assert.equal(esVarianteTicket('todos'), false);
  assert.equal(esVarianteTicket(undefined), false);
});
