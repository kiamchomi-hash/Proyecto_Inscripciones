-- Outbox local de efectos externos y soporte mínimo de la API de formularios.
-- Sólo cola y estados: no hay consumidores reales, ni Queues, ni datos importados.
-- No modifica 0001–0003 ni publica endpoints con binding remoto.

CREATE TABLE outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT CHECK (id BETWEEN 1 AND 9007199254740991),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'aviso-lead', 'newsletter-alta', 'mail-precio',
    'lead-sede', 'robot-encolar', 'robot-despacho', 'aviso-robot-error'
  )),
  -- Idempotencia explícita: una intención por (tipo, clave). Nunca datos personales.
  clave TEXT NOT NULL CHECK (length(clave) BETWEEN 1 AND 120),
  consulta_id INTEGER REFERENCES consultas(id) ON DELETE CASCADE,
  -- Parámetros del envío (por ejemplo la carrera del mail). Sin PII.
  detalle TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'error', 'ambiguo', 'omitido')),
  intentos INTEGER NOT NULL DEFAULT 0 CHECK (intentos BETWEEN 0 AND 2147483647),
  -- Sólo el código o el tipo de error; nunca el mensaje del proveedor ni datos de la persona.
  ultimo_error TEXT CHECK (ultimo_error IS NULL OR length(ultimo_error) <= 120),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (tipo, clave),
  CHECK (length(created_at) = 24 AND created_at IS strftime('%Y-%m-%dT%H:%M:%fZ', created_at)),
  CHECK (length(updated_at) = 24 AND updated_at IS strftime('%Y-%m-%dT%H:%M:%fZ', updated_at))
) STRICT;

CREATE INDEX outbox_pendientes ON outbox(id) WHERE estado = 'pendiente';
CREATE INDEX outbox_consulta ON outbox(consulta_id);
