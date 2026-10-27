/**
 * Alta y renovación de una suscripción al newsletter, con la misma semántica que
 * el upsert del sitio vigente: conflicto por `email,carrera_id`, la repetición
 * renueva (`activo`, `consentimiento_at`) en vez de duplicar, y sin carrera queda
 * una general por mail (en SQLite, `ifnull(carrera_id, 0)` unifica los NULL).
 *
 * No es un efecto externo: se escribe en la misma base. El outbox lo usa como
 * intención durable para que un fallo no pierda el consentimiento.
 */

export interface AltaNewsletter {
  email: string;
  carrera: { id: number; nombre: string } | null;
  /** Instante del consentimiento; por defecto, el reloj de la base. */
  ahora?: string;
}

export const SQL_SUSCRIBIR = `
  INSERT INTO suscripciones_newsletter(id, email, carrera_id, carrera_nombre, activo, consentimiento_at)
  VALUES (?1, ?2, ?3, ?4, 1, COALESCE(?5, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')))
  ON CONFLICT(email, ifnull(carrera_id, 0)) DO UPDATE SET
    activo = 1,
    consentimiento_at = excluded.consentimiento_at,
    carrera_nombre = excluded.carrera_nombre,
    updated_at = excluded.consentimiento_at
  RETURNING id`;

/** El mail, en minúsculas y sin espacios: así lo guarda y lo busca el cron. */
function correo(valor: unknown): string {
  const email = typeof valor === 'string' ? valor.trim().toLowerCase() : '';
  if (email.length < 3 || email.length > 254) throw new TypeError('Mail inválido.');
  return email;
}

/** Devuelve el `id` de la suscripción (el de la baja del mail). */
export async function suscribirNewsletter(db: D1Database, alta: AltaNewsletter): Promise<string> {
  const email = correo(alta.email);
  const carreraId = alta.carrera === null ? null : alta.carrera.id;
  if (carreraId !== null && (!Number.isSafeInteger(carreraId) || carreraId < 1)) {
    throw new TypeError('Carrera inválida.');
  }
  const id = crypto.randomUUID();
  const fila = await db.prepare(SQL_SUSCRIBIR)
    .bind(id, email, carreraId, alta.carrera?.nombre ?? null, alta.ahora ?? null)
    .first<{ id: string }>();
  if (!fila) throw new Error('No se pudo guardar la suscripción.');
  return fila.id;
}

/** Baja de un clic: el cron lee `activo`, así que la baja no borra la fila. */
export async function darDeBaja(db: D1Database, id: unknown): Promise<boolean> {
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    throw new TypeError('ID de suscripción inválido.');
  }
  const fila = await db.prepare(`UPDATE suscripciones_newsletter SET activo = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?1 RETURNING id`).bind(id.toLowerCase()).first();
  return fila !== null;
}
