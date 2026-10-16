import test from 'node:test';
import assert from 'node:assert/strict';
import { preciosVencidos } from '../lib/vigilancia-precios.ts';

// 16/10/2026 a las 10:00 en Argentina.
const ahora = new Date('2026-10-16T13:00:00Z');

test('precios vencidos hace unas horas no avisan: la corrida temprana los renueva', () => {
  assert.equal(preciosVencidos([{ institucion: 'Teclab', vigente_hasta: '2026-10-15' }], ahora), null);
});

test('precios vencidos hace más de un día avisan con la institución y la fecha', () => {
  const aviso = preciosVencidos([{ institucion: 'siglo21', vigente_hasta: '2026-10-14' }], ahora);
  assert.match(aviso, /Siglo 21/);
  assert.match(aviso, /14\/10\/2026/);
});

test('alcanza con una fila vigente de la institución para no avisar', () => {
  const filas = [
    { institucion: 'Teclab', vigente_hasta: '2026-10-01' },
    { institucion: 'Teclab', vigente_hasta: '2026-10-16' },
  ];
  assert.equal(preciosVencidos(filas, ahora), null);
});

test('avisa sólo por la institución vencida', () => {
  const aviso = preciosVencidos(
    [
      { institucion: 'Teclab', vigente_hasta: '2026-10-10' },
      { institucion: 'siglo21', vigente_hasta: '2026-10-16' },
    ],
    ahora,
  );
  assert.match(aviso, /Teclab/);
  assert.doesNotMatch(aviso, /Siglo 21/);
});

test('sin filas o con una fecha ilegible no avisa ni rompe', () => {
  assert.equal(preciosVencidos([], ahora), null);
  assert.equal(preciosVencidos([{ institucion: 'Teclab', vigente_hasta: 'no es fecha' }], ahora), null);
});
