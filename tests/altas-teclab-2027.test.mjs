import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { getAreaForCarrera } from '../components/index/types.ts';
import {
  getCategoriaTeclabTecnologia,
  getTipoTeclab,
  getPortadaTeclab,
  articulaConSiglo21,
} from '../components/index/teclab.ts';
import { getResolucionesTeclab } from '../components/index/resoluciones-teclab.ts';
import { perfilDe } from '../components/test-vocacional-teclab/puntaje.ts';

const ia = {
  nombre: 'Tecnicatura Superior en Diseño y Desarrollo de Inteligencia Artificial',
  nivel: 'Teclab - Tecnología',
};
const negocios = {
  nombre: 'Tecnicatura Superior en Administración de Negocios Digitales Financieros',
  nivel: 'Teclab - Gestión',
};

test('Diseño y Desarrollo de IA: área, categoría, portada, sin resolución ni articulación', () => {
  assert.equal(getAreaForCarrera(ia), 'tecnologia');
  assert.equal(getCategoriaTeclabTecnologia(ia), 'Datos e IA');
  assert.equal(articulaConSiglo21(ia), false);
  assert.equal(getResolucionesTeclab(ia), null);
  assert.equal(perfilDe(ia), 'gestion-inteligencia-artificial');
  const portada = getPortadaTeclab(ia);
  assert.ok(portada);
  assert.ok(existsSync(`public${portada}`));
});

test('Negocios Digitales Financieros: área, tipo, portada, sin resolución ni articulación', () => {
  assert.equal(getAreaForCarrera(negocios), 'negocios');
  assert.equal(getTipoTeclab(negocios), 'Negocios');
  assert.equal(articulaConSiglo21(negocios), false);
  assert.equal(getResolucionesTeclab(negocios), null);
  assert.equal(perfilDe(negocios), 'finanzas-digitales');
  const portada = getPortadaTeclab(negocios);
  assert.ok(portada);
  assert.ok(existsSync(`public${portada}`));
});
