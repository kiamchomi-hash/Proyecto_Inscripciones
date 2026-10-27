import {
  COLUMNAS_CATALOGO, esCarreraVisible, type CarreraCatalogo, type CarreraOpcion,
} from '../../../components/index/types.ts';
import { esCursoTeclab, esTeclab } from '../../../components/index/teclab.ts';
import { tieneInscripcionPropia } from '../../../components/carreras/inscripcion-carrera.tsx';

// Lecturas de `/teclab` y `/teclab/inscripcion` sobre D1, con las mismas
// columnas y los mismos filtros que las dos páginas vigentes. La proyección es
// explícita: ni precio ni descuentos ni el resto de la fila salen de acá.
//
// La taxonomía y los clasificadores son los compartidos (`esCarreraVisible`,
// `esTeclab`, `esCursoTeclab`, `tieneInscripcionPropia`), aplicados sobre la
// proyección igual que en el sitio. El orden reproduce el `.order('orden')` de
// PostgREST: ascendente y con los nulos al final.

/** Los tres niveles que pide la página de Teclab (`in('nivel', […])`). */
const NIVELES_TECLAB = ['Teclab - Tecnología', 'Teclab - Gestión', 'Teclab - Curso'] as const;

type FilaCatalogo = Pick<CarreraCatalogo,
  'id' | 'nombre' | 'nivel' | 'duracion' | 'titulo' | 'modalidad' | 'prefix' |
  'nombre_corto' | 'orden'> & {
    activa: number; destacada: number; nueva: number; proximamente: number; tieneSlides: number;
  };

/**
 * La oferta de `/teclab`: activas, de los tres niveles de Teclab y visibles en
 * la taxonomía. `tieneSlides` se resuelve en SQL, como en la home: el JSON de
 * los slides no viaja al catálogo.
 */
export async function carrerasDeTeclab(db: D1Database): Promise<CarreraCatalogo[]> {
  const filas = await db.prepare(`SELECT ${COLUMNAS_CATALOGO},
    CASE WHEN json_type(slides) = 'array' AND json_array_length(slides) > 0 THEN 1 ELSE 0 END AS tieneSlides
    FROM carreras WHERE activa = 1 AND nivel IN (?1, ?2, ?3)
    ORDER BY orden NULLS LAST, id`).bind(...NIVELES_TECLAB).all<FilaCatalogo>();
  return filas.results
    .filter(fila => esCarreraVisible(fila) && (esTeclab(fila) || esCursoTeclab(fila)))
    .map(fila => ({
      ...fila,
      activa: fila.activa === 1,
      destacada: fila.destacada === 1,
      nueva: fila.nueva === 1,
      proximamente: fila.proximamente === 1,
      tieneSlides: fila.tieneSlides === 1,
    }));
}

/**
 * Las opciones de `/teclab/inscripcion`: lo mínimo que muestra el selector,
 * sin `slides` ni el detalle. `proximamente` se lee para descartar las carreras
 * anunciadas y no viaja al navegador.
 */
export async function opcionesInscripcionTeclab(db: D1Database): Promise<CarreraOpcion[]> {
  const filas = await db.prepare(`SELECT id, nombre, nivel, duracion, proximamente FROM carreras
    WHERE activa = 1 ORDER BY orden NULLS LAST, id`).all<{
    id: number; nombre: string; nivel: string; duracion: string | null; proximamente: number;
  }>();
  return filas.results
    .map(fila => ({ ...fila, proximamente: fila.proximamente === 1 }))
    .filter(tieneInscripcionPropia)
    .map(({ id, nombre, nivel, duracion }) => ({ id, nombre, nivel, duracion: duracion ?? '' }));
}
