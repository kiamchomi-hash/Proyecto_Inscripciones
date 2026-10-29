import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { articulaConSiglo21, getCategoriaTeclabTecnologia, getTipoTeclab, parsePlanTeclab } from '../components/index/teclab.ts';
import { getAreaForCarrera } from '../components/index/types.ts';
import { perfilDe, puntuar, PREGUNTAS } from '../components/test-vocacional-teclab/puntaje.ts';

test('las carreras tienen su categoría y no prometen articulación no confirmada', () => {
  const ambiental = { nombre: 'Tecnicatura Superior en Gestión Ambiental', nivel: 'Teclab - Gestión' };
  const videojuegos = { nombre: 'Tecnicatura Superior en Desarrollo de Videojuegos', nivel: 'Teclab - Tecnología' };
  assert.equal(getTipoTeclab(ambiental), 'Gestión');
  assert.equal(getCategoriaTeclabTecnologia(videojuegos), 'Desarrollo');
  assert.equal(articulaConSiglo21(ambiental), false);
  assert.equal(articulaConSiglo21(videojuegos), false);
  assert.equal(getAreaForCarrera(ambiental), 'ambiente');
  assert.equal(getAreaForCarrera(videojuegos), 'tecnologia');
  assert.equal(perfilDe(ambiental), 'ambiental');
  assert.equal(perfilDe(videojuegos), 'videojuegos');
  const tema = PREGUNTAS.findIndex(p => p.eje === 'Tema');
  const opcion = PREGUNTAS[tema].opciones.findIndex(o => o.texto === 'Desarrollo de videojuegos');
  const respuestas = Array(PREGUNTAS.length).fill(-1);
  respuestas[tema] = opcion;
  assert.equal(puntuar(respuestas).videojuegos, 8);
});

test('los dos planes se separan en dos años y cuatro cuatrimestres', () => {
  const sql = readFileSync(new URL('../sql/2026-10-29-alta-teclab-ambiental-videojuegos.sql', import.meta.url), 'utf8');
  const planes = [...sql.matchAll(/'Primer Año \| 1er cuatrimestre[\s\S]*?Práctica Profesionalizante'/g)];
  assert.equal(planes.length, 2);
  for (const [plan] of planes) {
    const periodos = parsePlanTeclab(plan.slice(1, -1));
    assert.deepEqual(periodos.map(p => p.año), ['Primer Año', 'Primer Año', 'Segundo Año', 'Segundo Año']);
    assert.deepEqual(periodos.map(p => p.materias.length), [4, 4, 4, 3]);
  }
});
