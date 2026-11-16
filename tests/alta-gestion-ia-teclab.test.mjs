import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { getAreaForCarrera } from '../components/index/types.ts';
import { getCategoriaTeclabTecnologia, getFichaTeclab, articulaConSiglo21 } from '../components/index/teclab.ts';
import { getResolucionesTeclab } from '../components/index/resoluciones-teclab.ts';
import { perfilDe, PREGUNTAS, puntuar, PERFILES } from '../components/test-vocacional-teclab/puntaje.ts';

const carrera = {
  nombre: 'Tecnicatura Superior en Gestión de Inteligencia Artificial y Transformación Digital',
  nivel: 'Teclab - Tecnología',
};

test('alta de Gestión de IA: categoría, imagen, dictamen y articulación', () => {
  assert.equal(getAreaForCarrera(carrera), 'tecnologia');
  assert.equal(getCategoriaTeclabTecnologia(carrera), 'Datos e IA');
  assert.equal(articulaConSiglo21(carrera), false);
  const ficha = getFichaTeclab(carrera);
  assert.ok(ficha);
  assert.ok(existsSync(`public${ficha.imagen}`));
  assert.match(getResolucionesTeclab(carrera).dictamen, /3427\/26/);
  assert.equal(perfilDe(carrera), 'gestion-inteligencia-artificial');
});

test('todos los perfiles pueden ganar solos con las respuestas posibles', () => {
  const ganadores = new Set();
  function recorrer(respuestas) {
    if (respuestas.length < PREGUNTAS.length) {
      PREGUNTAS[respuestas.length].opciones.forEach((_, i) => recorrer([...respuestas, i]));
      return;
    }
    const puntos = puntuar(respuestas);
    const maximo = Math.max(...PERFILES.map(({ id }) => puntos[id] ?? 0));
    const mejores = PERFILES.filter(({ id }) => (puntos[id] ?? 0) === maximo);
    if (mejores.length === 1) ganadores.add(mejores[0].id);
  }
  recorrer([]);
  assert.deepEqual(PERFILES.map(({ id }) => id).filter(id => !ganadores.has(id)), []);
});
