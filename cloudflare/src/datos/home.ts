import type { CarreraCatalogo } from '../../../components/index/types.ts';
import { listarCatalogoPublico, type CarreraCatalogoPublico } from './repositorio.ts';

// Normalización equivalente a `carreraACatalogo()` de `lib/datos/carrera-catalogo.ts`:
// el catálogo no traslada el JSON pesado y los nulos de la base se vuelven los
// valores que espera el componente.
export function aCatalogo(fila: CarreraCatalogoPublico): CarreraCatalogo {
  return {
    ...fila,
    duracion: fila.duracion ?? '',
    titulo: fila.titulo ?? '',
    orden: fila.orden ?? 0,
  };
}

/**
 * Lo que la home muestra del catálogo: sólo carreras visibles y sin Identidad
 * Argentina, que se oculta únicamente acá (su ficha sigue publicada). Mismo
 * filtro que `app/page.tsx`, aplicado después de la taxonomía compartida.
 */
export async function carrerasDeHome(db: D1Database): Promise<CarreraCatalogo[]> {
  const filas = await listarCatalogoPublico(db);
  return filas
    .filter(fila => fila.nivel !== 'Identidad Argentina')
    .map(aCatalogo);
}
