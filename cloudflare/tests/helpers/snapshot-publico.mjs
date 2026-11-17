import { CONTRATO, validarSnapshot } from '../../scripts/datos-publicos.mjs';

const filaVacia = tabla => Object.fromEntries(CONTRATO[tabla].columnas.map(columna => [columna, null]));

export function snapshotPublicoMinimo() {
  const carrera = {
    ...filaVacia('carreras'),
    id: 1,
    nombre: 'Licenciatura en Administración',
    nivel: 'Pregrado',
    modalidad: 'A distancia',
    activa: true,
    destacada: false,
    nueva: false,
    proximamente: false,
    slides: [],
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-02T00:00:00Z',
  };
  const novedad = {
    ...filaVacia('novedades'),
    id: 1,
    titulo: 'Novedad de prueba',
    contenido: '<p>Contenido de prueba.</p>',
    extracto: 'Contenido de prueba.',
    fecha: '2026-10-01',
    tag: 'Institucional',
    imagen_url: null,
    href: null,
    slug: 'novedad-de-prueba',
    pinned: false,
    publicada: true,
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-02T00:00:00Z',
  };
  return validarSnapshot({
    version: 1,
    tablas: { carreras: [carrera], materias: [], novedades: [novedad], faq_preguntas: [] },
  });
}
