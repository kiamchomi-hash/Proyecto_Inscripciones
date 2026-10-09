import test from 'node:test';
import assert from 'node:assert/strict';
import { autoinscripcionesDemoradas, MINUTOS_DEMORA_ROBOT } from '../lib/vigilancia-robot.ts';

const ahora = new Date('2026-10-09T12:00:00Z');
const hace = minutos => new Date(ahora.getTime() - minutos * 60_000).toISOString();

test('una autoinscripción pendiente hace más de la demora tolerada genera aviso', () => {
  const aviso = autoinscripcionesDemoradas([{ created_at: hace(MINUTOS_DEMORA_ROBOT + 1) }], ahora);
  assert.match(aviso, /1 autoinscripción de Teclab/);
  assert.match(aviso, /PC de la sede/);
});

test('las pendientes recientes no avisan: el robot todavía puede estar corriendo', () => {
  assert.equal(autoinscripcionesDemoradas([{ created_at: hace(5) }], ahora), null);
  assert.equal(autoinscripcionesDemoradas([], ahora), null);
});

test('con varias demoradas cuenta todas e informa la más vieja en horas', () => {
  const aviso = autoinscripcionesDemoradas(
    [{ created_at: hace(45) }, { created_at: hace(26 * 60) }, { created_at: hace(10) }],
    ahora,
  );
  assert.match(aviso, /2 autoinscripciones de Teclab/);
  assert.match(aviso, /la más vieja, hace 26 h/);
});

test('una fecha ilegible no se toma por demorada ni rompe el chequeo', () => {
  assert.equal(autoinscripcionesDemoradas([{ created_at: 'no es fecha' }], ahora), null);
});
