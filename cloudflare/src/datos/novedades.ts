import type { Novedad } from '@/components/novedades/novedades-page';

// Proyecciones idénticas a las dos páginas Next. Nunca entrega created_at ni
// contenido en el listado. D1 permanece detrás de SSR, sin endpoint nuevo.
const LISTADO = 'id, titulo, extracto, fecha, tag, imagen_url, href, slug, pinned';
const ARTICULO = 'id, titulo, contenido, extracto, fecha, tag, imagen_url, slug, updated_at';
export interface Articulo {
  id: number; titulo: string; contenido: string | null; extracto: string | null;
  fecha: string; tag: string; imagen_url: string | null; slug: string; updated_at: string | null;
}
export function numeroPagina(valor: string): number | null {
  const n = parseInt(valor, 10);
  return !Number.isNaN(n) && n >= 1 && String(n) === valor ? n : null;
}
export const totalPaginas = (total: number) => Math.max(1, 1 + Math.ceil(Math.max(0, total - 3) / 6));
type Fila = Omit<Novedad, 'pinned'> & { pinned: number };
const novedad = (fila: Fila): Novedad => ({ ...fila, pinned: fila.pinned === 1 });

export async function listarNovedades(db: D1Database, valor: string) {
  const currentPage = numeroPagina(valor);
  if (currentPage === null) return null;
  const total = await db.prepare('SELECT count(*) AS total FROM novedades WHERE publicada = 1 AND pinned = 0').first<number>('total');
  const totalPages = totalPaginas(total ?? 0);
  if (currentPage > totalPages) return null;
  const offset = currentPage === 1 ? 0 : 3 + (currentPage - 2) * 6;
  const [fijada, lista] = await Promise.all([
    currentPage === 1 ? db.prepare(`SELECT ${LISTADO} FROM novedades WHERE publicada = 1 AND pinned = 1 ORDER BY fecha DESC LIMIT 1`).first<Fila>() : null,
    db.prepare(`SELECT ${LISTADO} FROM novedades WHERE publicada = 1 AND pinned = 0 ORDER BY fecha DESC LIMIT ? OFFSET ?`)
      .bind(currentPage === 1 ? 3 : 6, offset).all<Fila>(),
  ]);
  return { currentPage, totalPages, pinnedItem: fijada ? novedad(fijada) : null, items: lista.results.map(novedad) };
}

export async function leerArticulo(db: D1Database, slug: string): Promise<Articulo | null> {
  const { results } = await db.prepare(`SELECT ${ARTICULO} FROM novedades WHERE slug = ? AND publicada = 1 LIMIT 2`).bind(slug).all<Articulo>();
  // maybeSingle de PostgREST rechaza duplicados: no se inventa unicidad remota
  // ni se elige arbitrariamente una fila cuando hay dos artículos con el slug.
  if (results.length > 1) throw new Error('Slug de novedad ambiguo');
  return results[0] ?? null;
}
