import type { Json, Tables } from '@/lib/database.types';
import type { MateriaCard } from '@/components/clases-apoyo/clases-apoyo-landing';
import type { MateriaDB } from '@/components/clases-apoyo/tipos';
import type { MateriaOtra } from '@/components/clases-apoyo/navegacion-materia';

export const COLUMNAS_MATERIA_CARD = 'id, slug, label, en_construccion, descripcion' as const;
export const COLUMNAS_MATERIA_NAV = 'id, slug, label, en_construccion, imagenes' as const;
export const COLUMNAS_MATERIA_BASICA = 'id, slug, label, nombre_profesor, whatsapp, telefono_display, descripcion, imagenes, en_construccion, orden, modo_manana, dias_bloqueados, horarios_bloqueados' as const;
export const COLUMNAS_MATERIA_FICHA = `${COLUMNAS_MATERIA_BASICA}, texto_seo` as const;

type FilaCard = Pick<Tables<'materias'>, keyof MateriaCard>;
type FilaNav = Pick<Tables<'materias'>, 'id' | 'slug' | 'label' | 'en_construccion' | 'imagenes'>;
type FilaBasica = Pick<Tables<'materias'>, Exclude<keyof MateriaDB, 'texto_seo'>>;
type FilaFicha = FilaBasica & Pick<Tables<'materias'>, 'texto_seo'>;
export type MateriaFicha = MateriaDB & { texto_seo: string[] | null };

/** Identifica la fila y el campo sin exponer el contenido corrupto. */
export class ErrorDatosMateria extends Error {
  constructor(readonly id: string, readonly ruta: string) {
    super(`Materia inválida ${id}: ${ruta}`);
    this.name = 'ErrorDatosMateria';
  }
}

function textos(valor: Json, id: string, ruta: string): string[] | null {
  if (valor === null) return null;
  if (!Array.isArray(valor)) throw new ErrorDatosMateria(id, ruta);
  return Array.from(valor, (elemento, indice) => {
    if (typeof elemento !== 'string') throw new ErrorDatosMateria(id, `${ruta}[${indice}]`);
    return elemento;
  });
}

export function materiaACard(fila: FilaCard): MateriaCard {
  return {
    id: fila.id, slug: fila.slug, label: fila.label, en_construccion: fila.en_construccion,
    descripcion: textos(fila.descripcion, fila.id, 'descripcion'),
  };
}

export function materiaANavegacion(fila: FilaNav): MateriaOtra {
  const imagenes = textos(fila.imagenes, fila.id, 'imagenes');
  return {
    id: fila.id, slug: fila.slug, label: fila.label, en_construccion: fila.en_construccion,
    foto: imagenes?.[0] ?? null,
  };
}

export function materiaAFichaBasica(fila: FilaBasica): MateriaFicha {
  return {
    ...materiaACard(fila),
    nombre_profesor: fila.nombre_profesor,
    whatsapp: fila.whatsapp,
    telefono_display: fila.telefono_display,
    // Los consumidores ya tratan null como una colección sin contenido.
    descripcion: textos(fila.descripcion, fila.id, 'descripcion') ?? [],
    imagenes: textos(fila.imagenes, fila.id, 'imagenes') ?? [],
    orden: fila.orden,
    modo_manana: fila.modo_manana,
    dias_bloqueados: textos(fila.dias_bloqueados, fila.id, 'dias_bloqueados') ?? [],
    horarios_bloqueados: textos(fila.horarios_bloqueados, fila.id, 'horarios_bloqueados') ?? [],
    texto_seo: null,
  };
}

export function materiaAFicha(fila: FilaFicha): MateriaFicha {
  return { ...materiaAFichaBasica(fila), texto_seo: textos(fila.texto_seo, fila.id, 'texto_seo') };
}
