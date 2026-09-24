import type { AreaId } from '@/components/index/types';

type Opcion = { areas: Partial<Record<AreaId, number>>; niveles?: string[]; terminos?: string[] };
type Pregunta = { opciones: Opcion[] };
type CarreraConOrden = { nombre: string; nivel?: string; prefix?: string | null; orden: number };

export function alternarSeleccion(actual: number[], indice: number, maximo: number) {
  if (actual.includes(indice)) return actual.filter(valor => valor !== indice);
  return actual.length < maximo ? [...actual, indice] : actual;
}

export function porcentajeAfinidad(puntos: number) {
  return Math.min(100, Math.max(0, Math.round(puntos * 4)));
}

export function avanzarRespuestas(respuestas: number[][], paso: number, indices: number[]) {
  const anterior = respuestas[paso];
  const sinCambios = anterior?.length === indices.length && anterior.every(indice => indices.includes(indice));
  if (sinCambios) return respuestas;
  return [...respuestas.slice(0, paso), indices];
}

export function puntuarRespuestas(preguntas: Pregunta[], respuestas: number[][]) {
  const areas: Partial<Record<AreaId, number>> = {};
  const niveles: string[] = [];
  const terminos: string[] = [];
  respuestas.forEach((indices, paso) => {
    const elegidas = indices.map(indice => preguntas[paso]?.opciones[indice]).filter((opcion): opcion is Opcion => Boolean(opcion));
    if (!elegidas.length) return;
    for (const opcion of elegidas) {
      for (const [area, valor] of Object.entries(opcion.areas)) {
        areas[area as AreaId] = (areas[area as AreaId] ?? 0) + (valor ?? 0) / elegidas.length;
      }
      niveles.push(...opcion.niveles ?? []);
      terminos.push(...opcion.terminos ?? []);
    }
  });
  return { areas, niveles: [...new Set(niveles)], terminos: [...new Set(terminos)] };
}

export function ordenarAreas<T>(areas: Partial<Record<AreaId, number>>, carreras: T[], areaDe: (carrera: T) => AreaId | null) {
  return (Object.entries(areas) as [AreaId, number][])
    .filter(([area, puntos]) => puntos > 0 && carreras.some(carrera => areaDe(carrera) === area))
    .sort(([, puntosA], [, puntosB]) => puntosB - puntosA)
    .slice(0, 3);
}

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
}

export function recomendarPorArea<T extends CarreraConOrden>(
  ranking: [AreaId, number][], carreras: T[], areaDe: (carrera: T) => AreaId | null,
  terminos: string[], niveles: string[], cantidad: number,
) {
  return ranking.map(([area, puntos]) => ({
    area, puntos,
    carreras: carreras.filter(carrera => areaDe(carrera) === area)
      .sort((a, b) => {
        const puntaje = (carrera: T) => {
          const descripcion = normalizar(`${carrera.nivel ?? ''} ${carrera.prefix ?? ''} ${carrera.nombre}`);
          return terminos.filter(termino => descripcion.includes(normalizar(termino))).length;
        };
        const nivel = (carrera: T) => niveles.some(valor => normalizar(`${carrera.nivel ?? ''} ${carrera.prefix ?? ''} ${carrera.nombre}`).includes(normalizar(valor))) ? 1 : 0;
        return puntaje(b) - puntaje(a) || nivel(b) - nivel(a) || a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es');
      }).slice(0, cantidad),
  }));
}
