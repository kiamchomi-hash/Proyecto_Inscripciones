// La portada del modal de Teclab lleva un solo parrafo por carrera
// (DESCRIPCIONES_MODAL). Su largo esta acotado: mas corto queda vacio en
// escritorio y mas largo no entra sin scroll en 375x740 (medido el 22/11/2026).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DESCRIPCIONES_MODAL,
  DESCRIPCION_MODAL_MIN,
  DESCRIPCION_MODAL_MAX,
  getDescripcionModalTeclab,
} from '../components/index/teclab.ts';

test('cada descripcion del modal de Teclab respeta el largo minimo y maximo', () => {
  for (const { match, texto } of DESCRIPCIONES_MODAL) {
    assert.ok(
      texto.length >= DESCRIPCION_MODAL_MIN && texto.length <= DESCRIPCION_MODAL_MAX,
      `${match}: ${texto.length} caracteres (rango ${DESCRIPCION_MODAL_MIN}-${DESCRIPCION_MODAL_MAX})`,
    );
  }
});

test('ningun match de descripcion le gana a otro por estar contenido en su nombre', () => {
  for (const { match, texto } of DESCRIPCIONES_MODAL) {
    assert.equal(getDescripcionModalTeclab({ nombre: `Tecnicatura Superior en ${match}` }), texto, match);
  }
});
