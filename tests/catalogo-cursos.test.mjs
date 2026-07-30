import test from 'node:test';
import assert from 'node:assert/strict';

import {
  esCarreraVisible,
  getCategoryForCarrera,
} from '../components/index/types.ts';

test('el curso de Teclab aparece dentro de Teclab Tecnología', () => {
  const curso = { nivel: 'Teclab - Curso' };

  assert.equal(getCategoryForCarrera(curso), 'teclab_tecnologia');
  assert.equal(esCarreraVisible(curso), true);
});

test('los cursos históricos de otros niveles continúan ocultos', () => {
  assert.equal(getCategoryForCarrera({ nivel: 'Curso' }), '_hidden');
  assert.equal(getCategoryForCarrera({ nivel: 'APLV - Extragrado' }), '_hidden');
  assert.equal(esCarreraVisible({ nivel: 'Curso' }), false);
});
