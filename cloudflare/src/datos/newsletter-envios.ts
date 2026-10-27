/**
 * Reclamo durable del envío semanal. La fila de la suscripción sigue mandando
 * la regla de los siete días (`ultimo_envio_at`); esta tabla arbitra dos cosas
 * que aquella no puede sola:
 *
 * - dos corridas simultáneas no mandan el mismo mail;
 * - un envío que quedó en duda no se repite a ciegas. `en-curso` y `ambiguo`
 *   sólo se resuelven a mano, como el reclamo del outbox.
 *
 * Un rechazo conocido (`error`) sí se puede reintentar: el proveedor dijo que
 * no aceptó y el siguiente barrido vuelve a reclamar la fila.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validar(suscripcionId: unknown, token?: unknown) {
  if (typeof suscripcionId !== 'string' || !UUID.test(suscripcionId)) {
    throw new TypeError('Suscripción inválida.');
  }
  if (token !== undefined && (typeof token !== 'string' || !UUID.test(token))) {
    throw new TypeError('Token inválido.');
  }
}

export const SQL_RECLAMAR = `
  INSERT INTO newsletter_envios(suscripcion_id, token, estado, updated_at)
  VALUES (?1, ?2, 'en-curso', ?3)
  ON CONFLICT(suscripcion_id) DO UPDATE SET
    token = excluded.token,
    estado = 'en-curso',
    ultimo_error = NULL,
    updated_at = excluded.updated_at
  WHERE newsletter_envios.estado = 'error'
     OR (newsletter_envios.estado = 'enviado' AND EXISTS (
       SELECT 1 FROM suscripciones_newsletter s
       WHERE s.id = newsletter_envios.suscripcion_id
         AND (s.ultimo_envio_at IS NULL OR s.ultimo_envio_at <= ?4)
     ))
  RETURNING token`;

/**
 * Toma el reclamo sólo si la fila no está en curso, no es ambigua y su último
 * envío confirmado ya cumplió el plazo. `limite` es el mismo instante de los
 * siete días que usa la consulta de candidatas.
 */
export async function reclamarEnvio(
  db: D1Database, suscripcionId: string, limite: string, ahora: string,
): Promise<string | null> {
  validar(suscripcionId);
  const token = crypto.randomUUID();
  const fila = await db.prepare(SQL_RECLAMAR)
    .bind(suscripcionId, token, ahora, limite).first<{ token: string }>();
  return fila ? token : null;
}

/** Devolver el reclamo sólo cuando consta que no se llamó al proveedor. */
export async function liberarReclamo(db: D1Database, suscripcionId: string, token: string): Promise<boolean> {
  validar(suscripcionId, token);
  const fila = await db.prepare(`DELETE FROM newsletter_envios
    WHERE suscripcion_id = ?1 AND token = ?2 AND estado = 'en-curso' RETURNING suscripcion_id`)
    .bind(suscripcionId, token).first();
  return fila !== null;
}

/**
 * Marca el envío confirmado y la fecha del último envío en un solo batch: si
 * falla una de las dos, no queda una suscripción marcada sin su reclamo ni al
 * revés. La segunda sentencia sólo escribe si la primera encontró el reclamo.
 */
export async function confirmarEnvio(
  db: D1Database, suscripcionId: string, token: string, ahora: string,
): Promise<boolean> {
  validar(suscripcionId, token);
  const resultados = await db.batch([
    db.prepare(`UPDATE newsletter_envios SET estado = 'enviado', ultimo_error = NULL,
      updated_at = ?3 WHERE suscripcion_id = ?1 AND token = ?2 AND estado = 'en-curso'`)
      .bind(suscripcionId, token, ahora),
    db.prepare(`UPDATE suscripciones_newsletter SET ultimo_envio_at = ?2, updated_at = ?2
      WHERE id = ?1 AND changes() = 1`).bind(suscripcionId, ahora),
  ]);
  return (resultados[0]?.meta.changes ?? 0) === 1;
}

async function marcar(
  db: D1Database, suscripcionId: string, token: string,
  estado: 'error' | 'ambiguo', codigo: string | null, ahora: string,
): Promise<boolean> {
  validar(suscripcionId, token);
  // Sólo el código del transporte, acotado; nunca el mail ni el cuerpo.
  const limpio = codigo
    ? String(codigo).replace(/[^\w.-]+/g, '-').slice(0, 120) || null
    : null;
  const fila = await db.prepare(`UPDATE newsletter_envios SET estado = ?3, ultimo_error = ?4,
    updated_at = ?5 WHERE suscripcion_id = ?1 AND token = ?2 AND estado = 'en-curso'
    RETURNING suscripcion_id`)
    .bind(suscripcionId, token, estado, limpio, ahora).first();
  return fila !== null;
}

export const marcarRechazo = (db: D1Database, id: string, token: string, codigo: string | null, ahora: string) =>
  marcar(db, id, token, 'error', codigo, ahora);

export const marcarAmbiguo = (db: D1Database, id: string, token: string, codigo: string | null, ahora: string) =>
  marcar(db, id, token, 'ambiguo', codigo, ahora);
