// Datos de marca y clasificacion de la Academia Identidad Argentina (convenio).
// Fuente: fichas oficiales de diplomaturas (campo "Escuela") y manual de marca
// (azul #0090C1 / amarillo #F1CF1C sobre fondo #101820).

import type { Carrera } from './types';

// Escuela a la que pertenece cada programa, segun la ficha oficial.
// La clave es una palabra distintiva del nombre en Supabase; la etiqueta va
// abreviada para que entre en el chip de la tarjeta.
const ESCUELAS: { match: string; escuela: string }[] = [
  { match: 'oratoria', escuela: 'Liderazgo' },
  { match: 'equipos de alto desempeño', escuela: 'Liderazgo' },
  { match: 'rrhh', escuela: 'Tecnología' },
  { match: 'fraude', escuela: 'Tecnología' },
  { match: 'inteligencia artificial', escuela: 'Tecnología' },
  { match: 'mindfulness', escuela: 'Bienestar' },
  { match: 'bienestar integral', escuela: 'Bienestar' },
  { match: 'marketing para emprendedores', escuela: 'Negocios' },
  { match: 'compliance', escuela: 'Negocios' },
  { match: 'constitución de sociedades', escuela: 'Derecho' },
  { match: 'management hotelero', escuela: 'Administración' },
];

export function getEscuelaIA(carrera: Carrera): string | null {
  const nombre = carrera.nombre.toLowerCase();
  return ESCUELAS.find(e => nombre.includes(e.match))?.escuela ?? null;
}
