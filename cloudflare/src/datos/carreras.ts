import { COLUMNAS_CARRERA_PUBLICA, carreraAPublica } from '../../../lib/datos/carrera-detalle.ts';
import { esCarreraVisible, carreraToSlug, type Carrera } from '../../../components/index/types.ts';
import type { Tables } from '../../../lib/tipos-datos.ts';

type Fila = Omit<Tables<'carreras'>, 'slides' | 'activa' | 'destacada' | 'nueva' | 'proximamente'> & {
  slides: string | null; activa: number; destacada: number; nueva: number; proximamente: number;
};

/** Proyección pública explícita compartida con Next: nunca SELECT * ni precios. */
export async function carrerasPublicas(db: D1Database): Promise<Carrera[]> {
  const filas = await db.prepare(`SELECT ${COLUMNAS_CARRERA_PUBLICA} FROM carreras
    WHERE activa=1 ORDER BY orden NULLS LAST, id`).all<Fila>();
  return filas.results.filter(esCarreraVisible).map(f => carreraAPublica({
    ...f, slides: f.slides === null ? null : JSON.parse(f.slides),
    activa: f.activa === 1, destacada: f.destacada === 1,
    nueva: f.nueva === 1, proximamente: f.proximamente === 1,
  }));
}

export function carreraPorSlug(carreras: Carrera[], slug: string) {
  return carreras.find(c => carreraToSlug(c) === slug)
    ?? carreras.find(c => carreraToSlug(c) === slug.toLowerCase().replace(/_/g, '-'));
}
