import { leerRelojBase } from '../datos/reloj.ts';

// Cola de intenciones externas. La tabla es la única autoridad: no se usa memoria,
// KV ni `waitUntil` para trabajos críticos. Las claves no llevan datos personales.

export const TIPOS_EFECTO = [
  'aviso-lead', 'newsletter-alta', 'mail-precio',
  'lead-sede',
] as const;
export type TipoEfecto = (typeof TIPOS_EFECTO)[number];

/**
 * `pendiente`: nunca se intentó (o se reintentó a mano).
 * `enviado`: terminal; repetir el aviso no lo reinicia.
 * `error`: fallo conocido del transporte; se reintenta sólo si alguien lo pide.
 * `ambiguo`: el proveedor pudo haber entregado; nunca se reintenta automáticamente.
 * `omitido`: no correspondía enviarlo (por ejemplo, reserva de 168 h vigente).
 */
export const ESTADOS_EFECTO = ['pendiente', 'enviado', 'error', 'ambiguo', 'omitido'] as const;
export type EstadoEfecto = (typeof ESTADOS_EFECTO)[number];

export interface Efecto {
  tipo: TipoEfecto;
  /** Parámetros del envío, nunca datos personales. */
  detalle?: Record<string, unknown> | null;
}

export interface FilaOutbox {
  id: number;
  tipo: TipoEfecto;
  clave: string;
  consulta_id: number | null;
  faq_id: number | null;
  clase_id: string | null;
  detalle: string | null;
  estado: EstadoEfecto;
  intentos: number;
  ultimo_error: string | null;
  created_at: string;
  updated_at: string;
}

/** Tope de un barrido; no crea política de reintentos, sólo acota el lote. */
export const TOPE_LOTE_OUTBOX = 20;

const COLUMNAS = `id,tipo,clave,consulta_id,faq_id,clase_id,detalle,estado,intentos,ultimo_error,created_at,updated_at`;

function validarEfectos(efectos: readonly Efecto[]) {
  const vistos = new Set<string>();
  for (const efecto of efectos) {
    if (!TIPOS_EFECTO.includes(efecto.tipo)) throw new TypeError('Efecto desconocido.');
    if (vistos.has(efecto.tipo)) throw new TypeError('Efecto repetido en el mismo alta.');
    vistos.add(efecto.tipo);
  }
}

const filasDeEfectos = (efectos: readonly Efecto[]) => {
  const filas = efectos.map((_, i) => `SELECT ?${i * 2 + 1} AS tipo, ?${i * 2 + 2} AS detalle`);
  const valores = efectos.flatMap(efecto => [
    efecto.tipo, efecto.detalle ? JSON.stringify(efecto.detalle) : null,
  ]);
  return { sql: filas.join(' UNION ALL '), valores };
};

/**
 * Una sola sentencia para todos los efectos de una consulta recién insertada.
 * Se apoya en que la sentencia anterior del mismo batch insertó exactamente una
 * fila (`changes()`) y en que `max(id)` es la consulta recién insertada: la
 * transacción tiene un solo escritor y nadie más inserta entre las dos
 * sentencias. No se usa `last_insert_rowid()` porque devuelve el INSERT exitoso
 * más reciente y se reevalúa por fila dentro de un `INSERT ... SELECT`: con tres
 * efectos, la segunda fila apuntaba al id de la primera del outbox y la FK falló.
 * Si la consulta no entró (por ejemplo, un enlace que ya se consumió), no se
 * encola nada.
 */
export function sentenciaEfectos(db: D1Database, efectos: readonly Efecto[]): D1PreparedStatement | null {
  if (efectos.length === 0) return null;
  validarEfectos(efectos);
  const { sql, valores } = filasDeEfectos(efectos);
  return db.prepare(`INSERT INTO outbox(tipo, clave, consulta_id, detalle)
    SELECT f.tipo, 'consulta:' || (SELECT max(id) FROM consultas), (SELECT max(id) FROM consultas), f.detalle
    FROM (${sql}) AS f
    WHERE changes() = 1
    ON CONFLICT(tipo, clave) DO NOTHING
    RETURNING id`).bind(...valores);
}

/** Los efectos de una pregunta: mismo mecanismo, anclados a `faq_preguntas`. */
export function sentenciaEfectosFaq(db: D1Database, efectos: readonly Efecto[]): D1PreparedStatement | null {
  if (efectos.length === 0) return null;
  validarEfectos(efectos);
  const { sql, valores } = filasDeEfectos(efectos);
  return db.prepare(`INSERT INTO outbox(tipo, clave, faq_id, detalle)
    SELECT f.tipo, 'faq:' || (SELECT max(id) FROM faq_preguntas), (SELECT max(id) FROM faq_preguntas), f.detalle
    FROM (${sql}) AS f
    WHERE changes() = 1
    ON CONFLICT(tipo, clave) DO NOTHING
    RETURNING id`).bind(...valores);
}

/**
 * Los avisos de una solicitud de clases: una fila por cada clase insertada, con
 * el id ya generado por la API (uuid). La guarda exige que el INSERT anterior
 * haya escrito exactamente todas: si una falla, el batch entero revierte.
 */
export function sentenciaEfectosClase(
  db: D1Database, claseIds: readonly string[], efectos: readonly Efecto[],
): D1PreparedStatement | null {
  if (claseIds.length === 0) return null;
  for (const id of claseIds) {
    if (typeof id !== 'string' || id.length !== 36) throw new TypeError('ID de clase inválido.');
  }
  validarEfectos(efectos);
  const permitidos = new Set(['aviso-lead']);
  for (const efecto of efectos) {
    // El formulario de clases pide teléfono, no mail: no hay newsletter que suscribir.
    if (!permitidos.has(efecto.tipo)) throw new TypeError('Efecto no admitido en clases.');
  }
  const filas: string[] = [];
  const valores: unknown[] = [];
  for (const id of claseIds) {
    for (const efecto of efectos) {
      filas.push(`SELECT ?${valores.length + 1} AS tipo, ?${valores.length + 2} AS clase_id, ?${valores.length + 3} AS detalle`);
      valores.push(efecto.tipo, id, efecto.detalle ? JSON.stringify(efecto.detalle) : null);
    }
  }
  const esperadas = claseIds.length;
  return db.prepare(`INSERT INTO outbox(tipo, clave, clase_id, detalle)
    SELECT f.tipo, 'clase:' || f.clase_id, f.clase_id, f.detalle
    FROM (${filas.join(' UNION ALL ')}) AS f
    WHERE changes() = ?${valores.length + 1}
    ON CONFLICT(tipo, clave) DO NOTHING
    RETURNING id`).bind(...valores, esperadas);
}

export async function leerEfecto(db: D1Database, id: number): Promise<FilaOutbox | null> {
  if (!Number.isSafeInteger(id) || id < 1) throw new TypeError('ID de efecto inválido.');
  return db.prepare(`SELECT ${COLUMNAS} FROM outbox WHERE id = ?1`).bind(id).first<FilaOutbox>();
}

/** Sólo pendientes: un ambiguo no vuelve a salir solo y un enviado es terminal. */
export async function listarPendientes(db: D1Database, limite = TOPE_LOTE_OUTBOX, despuesDe = 0) {
  if (!Number.isInteger(limite) || limite < 1 || limite > 100) throw new TypeError('Límite inválido.');
  if (!Number.isSafeInteger(despuesDe) || despuesDe < 0) throw new TypeError('Cursor inválido.');
  return (await db.prepare(`SELECT ${COLUMNAS} FROM outbox
    WHERE estado = 'pendiente' AND id > ?1 ORDER BY id LIMIT ?2`)
    .bind(despuesDe, limite).all<FilaOutbox>()).results;
}

/** Rotación durable y acotada: los pendientes sin transporte no monopolizan el cron. */
export async function listarParaBarrido(db: D1Database, limite = TOPE_LOTE_OUTBOX) {
  if (!Number.isInteger(limite) || limite < 1 || limite > 100) throw new TypeError('Límite inválido.');
  const { cursor } = (await db.prepare('SELECT cursor FROM outbox_barrido WHERE id=1')
    .first<{ cursor: number }>())!;
  const siguientes = await listarPendientes(db, limite, cursor);
  const filas = siguientes.length ? siguientes : await listarPendientes(db, limite);
  if (filas.length) await db.prepare('UPDATE outbox_barrido SET cursor=?1 WHERE id=1')
    .bind(filas.at(-1)!.id).run();
  return filas;
}

export async function reclamarEfecto(db: D1Database, id: number): Promise<string | null> {
  const token = crypto.randomUUID();
  const fila = await db.prepare(`INSERT INTO outbox_reclamos(efecto_id,token,created_at)
    SELECT id,?2,?3 FROM outbox WHERE id=?1 AND estado='pendiente'
    ON CONFLICT(efecto_id) DO NOTHING RETURNING efecto_id`)
    .bind(id, token, await leerRelojBase(db)).first();
  return fila ? token : null;
}

export async function liberarReclamo(db: D1Database, id: number, token: string) {
  await db.prepare('DELETE FROM outbox_reclamos WHERE efecto_id=?1 AND token=?2').bind(id, token).run();
}

/** Sólo se usa al confirmar que NO se llamó al proveedor por falta de configuración. */
export async function devolverSinTransporte(db: D1Database, id: number) {
  await db.prepare("UPDATE outbox SET estado='pendiente', ultimo_error=NULL WHERE id=?1 AND estado='ambiguo'")
    .bind(id).run();
}

/** El intento se persiste antes de llamar al transporte; no se reembolsa después. */
export async function marcarIntento(db: D1Database, id: number): Promise<boolean> {
  const fila = await db.prepare(`UPDATE outbox SET intentos = intentos + 1, updated_at = ?2
    WHERE id = ?1 AND estado = 'pendiente' RETURNING id`).bind(id, await leerRelojBase(db)).first();
  return fila !== null;
}

/** Terminal: una entrega repetida no cambia el estado ni la fecha original. */
export async function marcarEnviado(db: D1Database, id: number): Promise<boolean> {
  const fila = await db.prepare(`UPDATE outbox SET estado = 'enviado', updated_at = ?2
    WHERE id = ?1 AND estado <> 'enviado' RETURNING id`).bind(id, await leerRelojBase(db)).first();
  return fila !== null;
}

async function marcarFallo(db: D1Database, id: number, estado: 'error' | 'ambiguo', codigo: string) {
  // Sólo el código del transporte: ni el mensaje crudo ni datos de la persona.
  const limpio = String(codigo ?? 'desconocido').replace(/[^\w.-]+/g, '-').slice(0, 120) || 'desconocido';
  const fila = await db.prepare(`UPDATE outbox SET estado = ?2, ultimo_error = ?3, updated_at = ?4
    WHERE id = ?1 AND estado <> 'enviado' RETURNING id`)
    .bind(id, estado, limpio, await leerRelojBase(db)).first();
  return fila !== null;
}

export const marcarError = (db: D1Database, id: number, codigo: string) => marcarFallo(db, id, 'error', codigo);
export const marcarAmbiguo = (db: D1Database, id: number, codigo: string) => marcarFallo(db, id, 'ambiguo', codigo);

export async function marcarOmitido(db: D1Database, id: number, motivo: string): Promise<boolean> {
  const fila = await db.prepare(`UPDATE outbox SET estado = 'omitido', ultimo_error = ?2, updated_at = ?3
    WHERE id = ?1 AND estado = 'pendiente' RETURNING id`)
    .bind(id, motivo.slice(0, 120), await leerRelojBase(db)).first();
  return fila !== null;
}

/**
 * Reintento explícito de un error conocido. Nunca de un ambiguo: ahí no se sabe
 * si el proveedor entregó, y reintentar podría duplicar el envío.
 */
export async function reintentar(db: D1Database, id: number): Promise<boolean> {
  const fila = await db.prepare(`UPDATE outbox SET estado = 'pendiente', updated_at = ?2
    WHERE id = ?1 AND estado = 'error' RETURNING id`).bind(id, await leerRelojBase(db)).first();
  return fila !== null;
}

/** Resumen de un barrido, sin datos de las personas. */
export interface ResumenConsumo {
  leidos: number;
  enviados: number;
  errores: number;
  ambiguos: number;
  omitidos: number;
  sinTransporte: number;
}
