import test from 'node:test';
import assert from 'node:assert/strict';
import { carreraACatalogo } from '../lib/datos/carrera-catalogo.ts';

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
