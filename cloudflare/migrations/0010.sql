-- Reclamo durable del envío semanal del newsletter. Evita que dos corridas
-- simultáneas manden el mismo mail y que un resultado incierto se reintente a
-- ciegas: una fila interrumpida queda `en-curso` hasta reconciliación manual.
-- No reemplaza `ultimo_envio_at`, que sigue siendo la regla de los siete días.
CREATE TABLE newsletter_envios (
  suscripcion_id TEXT PRIMARY KEY REFERENCES suscripciones_newsletter(id) ON DELETE CASCADE,
  token TEXT NOT NULL CHECK (length(token) = 36),
  estado TEXT NOT NULL CHECK (estado IN ('en-curso', 'enviado', 'error', 'ambiguo')),
  -- Sólo el código del transporte; nunca el mail, el asunto ni el cuerpo.
  ultimo_error TEXT CHECK (ultimo_error IS NULL OR length(ultimo_error) <= 120),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (length(updated_at) = 24 AND updated_at IS strftime('%Y-%m-%dT%H:%M:%fZ', updated_at))
) STRICT;
