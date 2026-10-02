import type { Tables } from '@/lib/database.types';
import type { CarreraCatalogo } from '@/components/index/types';

type FilaCatalogo = Pick<Tables<'carreras'>,
  'id' | 'nombre' | 'nivel' | 'duracion' | 'titulo' | 'modalidad' | 'prefix' |
  'nombre_corto' | 'orden' | 'activa' | 'destacada' | 'nueva' | 'proximamente' | 'slides'
>;

/** Normaliza columnas anulables sin trasladar el JSON pesado al catálogo. */
export function carreraACatalogo({ slides, ...fila }: FilaCatalogo): CarreraCatalogo {
  return {
    ...fila,
    duracion: fila.duracion ?? '',
    titulo: fila.titulo ?? '',
    orden: fila.orden ?? 0,
    tieneSlides: Array.isArray(slides) && slides.length > 0,
  };
}
