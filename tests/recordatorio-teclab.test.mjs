import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mensajeRecordatorioTeclab, sinIntroNueva } from '../lib/recordatorio-teclab.ts';

// Recordatorio semanal de los seguimientos de fondo de Teclab (`docs/rutinas.md`),
// que el cron de Vercel manda por Telegram.

const conIntro = { nombre: 'Tecnicatura Superior en Seguros', descripcion: 'Estudiá seguros a distancia y formate. Salida.' };
const sinIntro = { nombre: 'Tecnicatura Superior en Algo Nuevo', descripcion: 'Aprendé algo. Podés trabajar en empresas.' };
const vacia = { nombre: 'Tecnicatura Superior en Otra', descripcion: null };

test('detecta las fichas que todavía no tienen la intro nueva', () => {
  assert.deepEqual(sinIntroNueva([conIntro, sinIntro, vacia]).map(c => c.nombre), [
    'Tecnicatura Superior en Algo Nuevo',
    'Tecnicatura Superior en Otra',
  ]);
});

test('el mensaje recuerda los dos seguimientos y lista las fichas pendientes', () => {
  const texto = mensajeRecordatorioTeclab([conIntro, sinIntro]);
  assert.match(texto, /diseño de las fichas/);
  assert.match(texto, /intro/);
  assert.match(texto, /Algo Nuevo/);
  assert.doesNotMatch(texto, /Seguros/);
});

test('sin fichas pendientes, el mensaje lo dice', () => {
  assert.match(mensajeRecordatorioTeclab([conIntro]), /todas las fichas.*tienen la intro nueva/i);
});

test('sin lectura de la base, el mensaje avisa que no se pudo revisar', () => {
  assert.match(mensajeRecordatorioTeclab(null), /no se pudo/i);
});

test('el cron semanal está declarado en vercel.json', () => {
  const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.ok(config.crons.some(c => c.path === '/api/recordatorio-teclab' && c.schedule === '0 12 * * 1'));
});
