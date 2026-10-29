import { COLUMNAS_CATALOGO, esCarreraVisible } from '../../../components/index/types.ts';
import type { Tables } from '../../../lib/tipos-datos.ts';
import { leerRelojBase } from './reloj.ts';

// Se comparten los contratos puros, sin clientes ni credenciales externos.
export type CarreraCatalogoPublico = Pick<Tables<'carreras'>,
  'id' | 'nombre' | 'nivel' | 'duracion' | 'titulo' | 'modalidad' | 'prefix' |
  'nombre_corto' | 'orden' | 'activa' | 'destacada' | 'nueva' | 'proximamente'>
  & { tieneSlides: boolean };

type Flags = 'activa' | 'destacada' | 'nueva' | 'proximamente' | 'tieneSlides';
type FilaCatalogo = Omit<CarreraCatalogoPublico, Flags> & Record<Flags, number>;

export async function listarCatalogoPublico(db: D1Database): Promise<CarreraCatalogoPublico[]> {
  // COLUMNAS_CATALOGO es una constante del código, nunca texto recibido por API.
  const filas = await db.prepare(`SELECT ${COLUMNAS_CATALOGO},
    CASE WHEN json_type(slides) = 'array' AND json_array_length(slides) > 0 THEN 1 ELSE 0 END AS tieneSlides
    FROM carreras WHERE activa = 1 ORDER BY orden NULLS LAST, id`).all<FilaCatalogo>();
  return filas.results.filter(esCarreraVisible).map(fila => ({
    ...fila, activa: fila.activa === 1, destacada: fila.destacada === 1,
    nueva: fila.nueva === 1, proximamente: fila.proximamente === 1,
    tieneSlides: fila.tieneSlides === 1,
  }));
}

function idValido(id: unknown): id is number {
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0;
}

// Este acceso es sólo para backend. No autoriza entregar un precio sin lead:
// la validación de casa, vigencia y el registro de consulta pertenecen a la API futura.
export async function leerPrecioPrivado(db: D1Database, carreraId: number) {
  if (!idValido(carreraId)) throw new TypeError('ID de carrera inválido.');
  const fila = await db.prepare(`SELECT conceptos, total, nota, vigente_hasta
    FROM precios_privados WHERE carrera_id = ?1`).bind(carreraId)
    .first<{ conceptos: string; total: string; nota: string | null; vigente_hasta: string }>();
  return fila ? { ...fila, conceptos: JSON.parse(fila.conceptos) as unknown[] } : null;
}

// El tercer parámetro procede exclusivamente del reloj de base en la función de
// abajo. Se exporta el SQL para probar fronteras exactas sin reloj del cliente.
// Una única sentencia arbitra la clave; no hay SELECT previo de la reserva.
export const SQL_RESERVA_MAIL = `
  INSERT INTO reservas_mail_precio(email, carrera_id, reservado_at) VALUES (?1, ?2, ?3)
  ON CONFLICT (email, carrera_id) DO UPDATE SET reservado_at = excluded.reservado_at
  WHERE reservas_mail_precio.reservado_at <= strftime('%Y-%m-%dT%H:%M:%fZ', ?3, '-168 hours')
  RETURNING 1 AS reservado`;

export async function reservarMailPrecio(db: D1Database, email: unknown, carreraId: unknown): Promise<boolean> {
  const correo = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (correo.length < 3 || correo.length > 254 || !idValido(carreraId)) return false;
  const ahora = await leerRelojBase(db);
  const fila = await db.prepare(SQL_RESERVA_MAIL).bind(correo, carreraId, ahora).first();
  // No se libera al fallar SMTP: reservar no significa que el proveedor entregó.
  return fila !== null;
}
