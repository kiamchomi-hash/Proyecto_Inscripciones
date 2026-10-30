import test from 'node:test';
import assert from 'node:assert/strict';
import { carreraACatalogo } from '../lib/datos/carrera-catalogo.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const fila = {
  id: 7, nombre: 'Abogacía', nivel: 'Grado', duracion: null, titulo: null,
  modalidad: 'Virtual', prefix: null, nombre_corto: null, orden: null,
  activa: true, destacada: false, nueva: false, proximamente: false,
};

test('el catálogo normaliza columnas anulables y no transporta los slides', () => {
  for (const [slides, tieneSlides] of [[null, false], [[], false], [[{ type: 'portada' }], true], [{ texto: 'JSON que no es lista' }, false]]) {
    const catalogo = carreraACatalogo({ ...fila, slides });
    assert.equal(catalogo.tieneSlides, tieneSlides);
    assert.equal(catalogo.duracion, '');
    assert.equal(catalogo.titulo, '');
    assert.equal(catalogo.orden, 0);
    assert.equal(Object.hasOwn(catalogo, 'slides'), false);
    assert.equal(catalogo.id, fila.id);
    assert.equal(catalogo.nivel, fila.nivel);
  }
});

test('el catálogo conserva el texto y el orden existentes', () => {
  const catalogo = carreraACatalogo({ ...fila, duracion: '5 años', titulo: 'Abogado', orden: 9, slides: [] });
  assert.equal(catalogo.duracion, '5 años');
  assert.equal(catalogo.titulo, 'Abogado');
  assert.equal(catalogo.orden, 9);
});

test('el filtro por casa acota el catálogo a los niveles de esa institución', () => {
  const tipos = cargarTypescript('components/index/types.ts', {});

  assert.deepEqual(tipos.nivelesDeCasa('siglo21'), ['Grado', 'Grado (CCC)', 'Pregrado']);
  assert.deepEqual(tipos.nivelesDeCasa('teclab'), ['Teclab - Tecnología', 'Teclab - Curso', 'Teclab - Gestión']);

  assert.equal(tipos.casaDelNivel('Grado'), 'siglo21');
  assert.equal(tipos.casaDelNivel('Pregrado'), 'siglo21');
  assert.equal(tipos.casaDelNivel('Teclab - Curso'), 'teclab');
  assert.equal(tipos.casaDelNivel('Identidad Argentina'), 'identidad');
  assert.equal(tipos.casaDelNivel('Posgrado'), null);

  assert.equal(tipos.casaDelParametro('siglo21'), 'siglo21');
  assert.equal(tipos.casaDelParametro('teclab'), 'teclab');
  assert.equal(tipos.casaDelParametro('todas'), null);
  assert.equal(tipos.casaDelParametro(null), null);
  assert.equal(tipos.casaDelParametro(''), null);

  // Cada nivel del catálogo pertenece a una sola casa: si dos se pisan, el
  // filtro deja de ser un corte y pasa a ser una suma.
  const vistos = new Map();
  for (const casa of tipos.CASAS) {
    for (const nivel of casa.niveles) {
      assert.equal(vistos.has(nivel), false, `${nivel} está en dos casas`);
      vistos.set(nivel, casa.id);
      assert.equal(tipos.casaDelNivel(nivel), casa.id);
    }
  }
});
