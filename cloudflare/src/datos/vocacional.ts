import { esCarreraVisible } from '../../../components/index/types.ts';
import { esTeclab } from '../../../components/index/teclab.ts';
import type { CarreraTestTeclab } from '../../../components/test-vocacional-teclab/test-vocacional-teclab.tsx';

type Opcion = { id: number; nombre: string; nivel: string; prefix: string | null; orden: number };

export async function opcionesVocacional(db: D1Database): Promise<Opcion[]> {
  const filas = await db.prepare(`SELECT id, nombre, nivel, prefix, orden FROM carreras
    WHERE activa = 1 ORDER BY orden NULLS LAST, id`).all<Opcion>();
  return filas.results.filter(c => esCarreraVisible(c) && c.nivel !== 'Identidad Argentina');
}

export async function opcionesVocacionalTeclab(db: D1Database): Promise<CarreraTestTeclab[]> {
  const filas = await db.prepare(`SELECT id, nombre, nombre_corto, prefix, nivel, orden, proximamente
    FROM carreras WHERE activa = 1 AND nivel IN (?1, ?2)
    ORDER BY orden NULLS LAST, id`).bind('Teclab - Tecnología', 'Teclab - Gestión')
    .all<Omit<CarreraTestTeclab, 'proximamente'> & { proximamente: number }>();
  return filas.results.filter(c => esCarreraVisible(c) && esTeclab(c))
    .map(c => ({ ...c, proximamente: c.proximamente === 1, orden: c.orden ?? Number.MAX_SAFE_INTEGER }));
}
