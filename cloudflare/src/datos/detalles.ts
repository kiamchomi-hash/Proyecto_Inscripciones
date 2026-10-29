import { COLUMNAS_FICHA_DETALLE, carreraADetalle } from '../../../lib/datos/carrera-detalle.ts';
import { esCarreraVisible, type CarreraDetalle } from '../../../components/index/types.ts';
import type { Json, Tables } from '../../../lib/tipos-datos.ts';

// El detalle que abre cada modal del catálogo (`/api/carreras-detalle`). Son
// las seis columnas de `COLUMNAS_DETALLE`, ni una más: la fila completa tiene
// precios y descuentos privados que no se publican por spread.

type FilaDetalle = Pick<Tables<'carreras'>, 'id' | 'nivel' | keyof CarreraDetalle>
  & { slides: string | null };

export async function listarDetallePublico(db: D1Database): Promise<Record<number, CarreraDetalle>> {
  const filas = await db.prepare(`SELECT ${COLUMNAS_FICHA_DETALLE} FROM carreras
    WHERE activa = 1 ORDER BY id`).all<FilaDetalle>();
  // Igual que el handler vigente: primero la taxonomía y después la validación;
  // una fila que no se lista tampoco necesita que se le mande la ficha.
  const detalle: Record<number, CarreraDetalle> = {};
  for (const fila of filas.results) {
    if (!esCarreraVisible(fila)) continue;
    // `slides` es TEXT JSON en D1 y ya viene validado por el CHECK de la tabla;
    // el validador compartido vuelve a recorrerlo y rechaza lo que no cumpla.
    detalle[fila.id] = carreraADetalle({
      ...fila,
      slides: fila.slides === null ? null : JSON.parse(fila.slides) as Json,
    });
  }
  return detalle;
}

export { ErrorDetalleCarrera } from '../../../lib/datos/carrera-detalle.ts';
