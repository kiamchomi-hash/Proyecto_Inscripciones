import test from 'node:test';
import assert from 'node:assert/strict';
import { puntuarRespuestas, ordenarAreas, recomendarPorArea, alternarSeleccion } from '../components/test-vocacional/resultado.ts';

const preguntas = [
  { opciones: [{ areas: { tecnologia: 5 } }, { areas: { salud: 5 } }, { areas: { negocios: 5 } }] },
  { opciones: [{ areas: { tecnologia: 4 }, terminos: ['software'] }, { areas: { salud: 4 }, terminos: ['terapia'] }] },
];
const carreras = [
  { id: 1, area: 'tecnologia', nombre: 'Software', orden: 2 },
  { id: 2, area: 'tecnologia', nombre: 'Redes', orden: 1 },
  { id: 3, area: 'salud', nombre: 'Terapia', orden: 3 },
  { id: 4, area: 'negocios', nombre: 'Gestión', orden: 4 },
];

test('una selección múltiple conserva el peso total de una pregunta', () => {
  const { areas } = puntuarRespuestas(preguntas, [[0, 1, 2], [0, 1]]);
  assert.equal(areas.tecnologia, 5 / 3 + 2);
  assert.equal(areas.salud, 5 / 3 + 2);
  assert.equal(areas.negocios, 5 / 3);
});

test('volver y cambiar respuesta elimina afinidad y términos anteriores', () => {
  const antes = puntuarRespuestas(preguntas, [[0], [0]]);
  const despues = puntuarRespuestas(preguntas, [[1], [1]]);
  assert.deepEqual(antes.terminos, ['software']);
  assert.deepEqual(despues.areas, { salud: 9 });
  assert.deepEqual(despues.terminos, ['terapia']);
});

test('el límite de selección se aplica también por teclado/clic repetido', () => {
  assert.deepEqual(alternarSeleccion([0, 1, 2], 3, 3), [0, 1, 2]);
  assert.deepEqual(alternarSeleccion([0, 1], 1, 3), [0]);
});

test('muestra carreras de varias áreas de afinidad sin forzar una principal', () => {
  const afinidad = puntuarRespuestas(preguntas, [[0, 1], [0, 1]]);
  const ranking = ordenarAreas(afinidad.areas, carreras, carrera => carrera.area);
  const grupos = recomendarPorArea(ranking, carreras, carrera => carrera.area, afinidad.terminos, [], 3);
  assert.deepEqual(grupos.map(grupo => grupo.area), ['tecnologia', 'salud']);
  assert.deepEqual(grupos[0].carreras.map(carrera => carrera.id), [1, 2]);
  assert.deepEqual(grupos[1].carreras.map(carrera => carrera.id), [3]);
});
