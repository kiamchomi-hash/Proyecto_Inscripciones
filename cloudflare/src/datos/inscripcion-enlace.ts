import { CASAS, CAMPOS, camposDe, columnaDe, consultaConEnlace, esCodigoEnlace,
  estadoEnlace, propsInscripcionEnlace, type PropsInscripcionEnlace } from '../../../components/formularios/casas.ts';
import { carreraToSlug } from '../../../components/index/types.ts';
import { leerEnlace } from './enlaces.ts';
import { leerPrecioPrivado } from './repositorio.ts';
import { leerRelojBase } from './reloj.ts';

export type CargaEnlace = { estado: 'invalido'; carreraUrl: string | null }
  | { estado: 'valido'; props: PropsInscripcionEnlace };

/** No consume el código: sólo POST /api/formularios conserva esa autoridad. */
export async function cargarInscripcionEnlace(db: D1Database, codigo: string): Promise<CargaEnlace> {
  const invalido = (carreraUrl: string | null = null): CargaEnlace => ({ estado: 'invalido', carreraUrl });
  if (!esCodigoEnlace(codigo)) return invalido();
  const enlace = await leerEnlace(db, codigo);
  if (!enlace) return invalido();
  // Las columnas provienen sólo del contrato del código; jamás del pedido HTTP.
  const columnas = [...new Set(['casa', 'tipo_formulario', 'carrera',
    ...camposDe('teclab', 'preinscripcion').map(c => columnaDe(CAMPOS[c]))])];
  const consulta = await db.prepare(`SELECT ${columnas.join(',')} FROM consultas WHERE id=?1`)
    .bind(enlace.consulta_id).first<Record<string, unknown>>();
  if (!consultaConEnlace(consulta) || !consulta || typeof consulta.carrera !== 'string') return invalido();
  const niveles = CASAS.teclab.niveles;
  const carrera = await db.prepare(`SELECT id,nombre,prefix,duracion FROM carreras
    WHERE nombre=?1 AND nivel IN (${niveles.map((_, i) => `?${i + 2}`).join(',')}) LIMIT 1`)
    .bind(consulta.carrera, ...niveles).first<{ id: number; nombre: string; prefix: string | null; duracion: string | null }>();
  if (!carrera) return invalido();
  const carreraUrl = `/carreras/${carreraToSlug(carrera)}`;
  const ahora = new Date(await leerRelojBase(db));
  if (estadoEnlace(enlace, ahora) !== 'valido') return invalido(carreraUrl);
  // Un fallo del repositorio no se convierte en precio ni confirmación ficticios.
  const filaPrecio = await leerPrecioPrivado(db, carrera.id);
  return { estado: 'valido', props: propsInscripcionEnlace({ codigo, consulta,
    carrera: { nombre: carrera.nombre, url: carreraUrl, duracion: carrera.duracion }, filaPrecio, ahora }) };
}
