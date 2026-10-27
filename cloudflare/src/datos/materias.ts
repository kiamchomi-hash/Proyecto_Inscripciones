import {
  COLUMNAS_MATERIA_CARD, COLUMNAS_MATERIA_NAV, COLUMNAS_MATERIA_FICHA,
  materiaACard, materiaANavegacion, materiaAFicha,
} from '../../../lib/datos/materia.ts';
import type { Json, Tables } from '../../../lib/database.types.ts';

type Materia = Tables<'materias'>;
type Booleanos = 'en_construccion' | 'modo_manana';
type Colecciones = 'descripcion' | 'imagenes' | 'dias_bloqueados' | 'horarios_bloqueados' | 'texto_seo';
type Fila<K extends keyof Materia> = {
  [P in K]: P extends Booleanos ? number : P extends Colecciones ? string | null : Materia[P];
};
type Card = 'id' | 'slug' | 'label' | 'en_construccion' | 'descripcion';
type Nav = 'id' | 'slug' | 'label' | 'en_construccion' | 'imagenes';
type Ficha = Card | Nav | 'nombre_profesor' | 'whatsapp' | 'telefono_display' | 'orden' |
  'modo_manana' | 'dias_bloqueados' | 'horarios_bloqueados' | 'texto_seo';

const jsonDe = (valor: string | null): Json => valor === null ? null : JSON.parse(valor) as Json;

// Misma proyección y validación de JSON que Next, sin cliente Supabase ni React
// en runtime. Los imports de componentes del módulo compartido son sólo tipos.
export async function listarMateriasPublicas(db: D1Database) {
  const filas = await db.prepare(`SELECT ${COLUMNAS_MATERIA_CARD} FROM materias
    WHERE activa = 1 ORDER BY orden, id`).all<Fila<Card>>();
  return filas.results.map(f => materiaACard({
    ...f, en_construccion: f.en_construccion === 1, descripcion: jsonDe(f.descripcion),
  }));
}

export async function listarNavegacionMaterias(db: D1Database) {
  const filas = await db.prepare(`SELECT ${COLUMNAS_MATERIA_NAV} FROM materias
    WHERE activa = 1 ORDER BY orden, id`).all<Fila<Nav>>();
  return filas.results.map(f => materiaANavegacion({
    ...f, en_construccion: f.en_construccion === 1, imagenes: jsonDe(f.imagenes),
  }));
}

export async function leerMateriaPublica(db: D1Database, slug: string) {
  const fila = await db.prepare(`SELECT ${COLUMNAS_MATERIA_FICHA} FROM materias
    WHERE activa = 1 AND slug = ?1`).bind(slug).first<Fila<Ficha>>();
  if (!fila) return null;
  return materiaAFicha({
    ...fila, en_construccion: fila.en_construccion === 1, modo_manana: fila.modo_manana === 1,
    descripcion: jsonDe(fila.descripcion), imagenes: jsonDe(fila.imagenes),
    dias_bloqueados: jsonDe(fila.dias_bloqueados), horarios_bloqueados: jsonDe(fila.horarios_bloqueados),
    texto_seo: jsonDe(fila.texto_seo),
  });
}
