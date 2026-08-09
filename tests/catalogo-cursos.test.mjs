import test from 'node:test';
import assert from 'node:assert/strict';

import {
  esCarreraVisible,
  getAreaForCarrera,
  getCategoryForCarrera,
} from '../components/index/types.ts';
import { getEscuelaIA } from '../components/index/identidad-argentina.ts';
import {
  destacarCompetencias,
  getCategoriaTeclabTecnologia,
  getFichaTeclab,
  getMarcoTeclab,
} from '../components/index/teclab.ts';

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

test('Teclab Tecnología se divide en categorías útiles', () => {
  assert.equal(getCategoriaTeclabTecnologia({ nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología' }), 'Desarrollo');
  assert.equal(getCategoriaTeclabTecnologia({ nombre: 'Tecnicatura Superior en Data Science', nivel: 'Teclab - Tecnología' }), 'Datos e IA');
  assert.equal(getCategoriaTeclabTecnologia({ nombre: 'Tecnicatura Superior en Cloud Administration', nivel: 'Teclab - Tecnología' }), 'Infraestructura');
  assert.equal(getCategoriaTeclabTecnologia({ nombre: 'Tecnicatura Superior en Seguridad Informática', nivel: 'Teclab - Tecnología' }), 'Ciberseguridad');
  assert.equal(getCategoriaTeclabTecnologia({ nombre: 'Actualización Profesional en Inteligencia Artificial', nivel: 'Teclab - Curso' }), 'Datos e IA');
});

test('el modal del curso se pinta en ámbar y trae su ficha', () => {
  const curso = { nombre: 'Actualización Profesional en Inteligencia Artificial', nivel: 'Teclab - Curso' };

  assert.deepEqual(getMarcoTeclab(curso), { clase: 'teclab-curso', acento: '#f4aa22' });
  assert.deepEqual(getMarcoTeclab({ nivel: 'Teclab - Tecnología' }), { clase: 'teclab-tecnologia', acento: '#2ee7d7' });
  assert.deepEqual(getMarcoTeclab({ nivel: 'Teclab - Gestión' }), { clase: 'teclab-gestion', acento: '#8e2cf2' });

  // Sin ficha el modal se queda sin foto de portada ni fondo de cierre.
  assert.equal(getFichaTeclab(curso)?.imagen, '/imagenes/teclab/carreras/curso-ia.webp');
});

test('el curso muestra toda su lista de contenidos, la tecnicatura sólo tres', () => {
  const cuatro = ['Herramientas', 'Transformación del trabajo', 'Ética y seguridad', 'Potenciá tu CV'];

  assert.equal(
    destacarCompetencias(cuatro, { nombre: 'Actualización Profesional en Inteligencia Artificial', nivel: 'Teclab - Curso' }).length,
    4,
  );
  assert.equal(
    destacarCompetencias(cuatro, { nombre: 'Tecnicatura Superior en Programación', nivel: 'Teclab - Tecnología' }).length,
    3,
  );
});

test('los filtros académicos reconocen Siglo 21 e Identidad Argentina', () => {
  assert.equal(getAreaForCarrera({ nombre: 'Estadística Aplicada y Análisis Avanzado' }), 'exactas');
  assert.equal(getAreaForCarrera({ nombre: 'Logística Global' }), 'negocios');
  assert.equal(getAreaForCarrera({ nombre: 'Diplomatura en Oratoria' }), 'rrhh');
  assert.equal(getAreaForCarrera({ nombre: 'Diplomatura en Mindfulness' }), 'salud');
  assert.equal(getAreaForCarrera({ nombre: 'Diplomatura en Fraude Financiero y Digital' }), 'tecnologia');
  assert.equal(getAreaForCarrera({ nombre: 'Curso de Constitución de Sociedades S.A.' }), 'derecho');
  assert.equal(getAreaForCarrera({ nombre: 'Diplomatura en Management Hotelero' }), 'negocios');
  assert.equal(getEscuelaIA({ nombre: 'Diplomatura en Inteligencia Artificial' }), 'Tecnología');
});

// Estas seis siguen el tag que la propia Siglo 21 le pone a la carrera en su ficha
// (relevamiento en notas-locales/tags-oficiales-21.md), no la lectura literal del nombre.
test('el área sigue el tag oficial de Siglo 21 donde difiere del nombre', () => {
  assert.equal(getAreaForCarrera({ nombre: 'Martillero, Corredor Público y Corredor Inmobiliario' }), 'derecho');
  assert.equal(getAreaForCarrera({ nombre: 'Comercialización' }), 'comunicacion');
  assert.equal(getAreaForCarrera({ nombre: 'Negocios Digitales' }), 'negocios');
  assert.equal(getAreaForCarrera({ nombre: 'Diseño y Desarrollo de Videojuegos' }), 'comunicacion');
  assert.equal(getAreaForCarrera({ nombre: 'Matemática' }), 'educacion');
  // 'informática' no puede comerse 'Bioinformática': Tecnología se evalúa antes que Salud.
  assert.equal(getAreaForCarrera({ nombre: 'Bioinformática' }), 'salud');
  assert.equal(getAreaForCarrera({ nombre: 'Informática' }), 'tecnologia');
  // El match no exige límite al final: 'ambiental' tiene que seguir tomando 'Ambientales'.
  assert.equal(getAreaForCarrera({ nombre: 'Gestión y Auditorías Ambientales' }), 'ambiente');
});

// `gobierno` va antes que `negocios` en AREA_KEYWORDS justamente por estas dos: si
// se invierte el orden, 'administración' se las lleva a Negocios en silencio.
test('lo público no cae en Negocios por la palabra Administración', () => {
  assert.equal(getAreaForCarrera({ nombre: 'Administración Pública' }), 'gobierno');
  assert.equal(getAreaForCarrera({ nombre: 'Administración y Gestión de Políticas Públicas' }), 'gobierno');
  assert.equal(getAreaForCarrera({ nombre: 'Administración' }), 'negocios');
  assert.equal(getAreaForCarrera({ nombre: 'Administración Agraria' }), 'negocios');
});
