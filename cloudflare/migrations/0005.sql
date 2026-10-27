-- Tablas que la API de formularios necesitaba para dejar de responder 503, más las
-- dos columnas del outbox que anclan avisos de FAQ y de clases. Local y sintético:
-- no importa datos, no crea triggers ni jobs y no cambia 0001–0004.

CREATE TABLE faq_preguntas (
  id INTEGER PRIMARY KEY AUTOINCREMENT CHECK (id BETWEEN 1 AND 9007199254740991),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  -- La respuesta la escribe quien modera. El envío del público no la completa.
  respuesta TEXT,
  -- 'pendiente' deja la fila fuera de la vista pública, que filtra por
  -- estado='aprobada' AND destacada. El valor por defecto real de Supabase no se
  -- pudo verificar sin acceso remoto: queda como punto del inventario del bloque 5.
  estado TEXT NOT NULL DEFAULT 'pendiente',
  destacada INTEGER NOT NULL DEFAULT 0 CHECK (destacada IN (0, 1)),
  orden INTEGER,
  modo TEXT NOT NULL CHECK (modo IN ('publica', 'privada')),
  contacto TEXT NOT NULL,
  nombre_contacto TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (length(created_at) = 24 AND created_at IS strftime('%Y-%m-%dT%H:%M:%fZ', created_at)),
  CHECK (length(updated_at) = 24 AND updated_at IS strftime('%Y-%m-%dT%H:%M:%fZ', updated_at))
) STRICT;
CREATE INDEX faq_preguntas_publicas ON faq_preguntas(estado, destacada, orden);

CREATE TABLE solicitudes_clase (
  -- El id real es uuid: lo genera la API con crypto.randomUUID().
  id TEXT NOT NULL PRIMARY KEY CHECK (length(id) = 36),
  -- FK a `materias` pendiente: la tabla todavía no está migrada a D1. El formato
  -- del id lo valida la API, no la base.
  materia_id TEXT NOT NULL CHECK (length(materia_id) = 36),
  -- Postgres usa text[]; en SQLite va JSON con la misma forma (array de textos).
  dias TEXT NOT NULL CHECK (json_valid(dias) AND json_type(dias) = 'array'),
  horarios TEXT NOT NULL CHECK (json_valid(horarios) AND json_type(horarios) = 'array'),
  nombre TEXT,
  telefono TEXT NOT NULL,
  bloqueo_semanal INTEGER NOT NULL DEFAULT 0 CHECK (bloqueo_semanal IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (length(created_at) = 24 AND created_at IS strftime('%Y-%m-%dT%H:%M:%fZ', created_at))
) STRICT;
CREATE INDEX solicitudes_clase_materia ON solicitudes_clase(materia_id);

CREATE TABLE suscripciones_newsletter (
  -- Es el id de la baja del mail: uuid, tal como lo exige esIdSuscripcion.
  id TEXT NOT NULL PRIMARY KEY CHECK (length(id) = 36),
  email TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  carrera_id INTEGER REFERENCES carreras(id),
  carrera_nombre TEXT,
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  consentimiento_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ultimo_envio_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (length(consentimiento_at) = 24 AND consentimiento_at IS strftime('%Y-%m-%dT%H:%M:%fZ', consentimiento_at)),
  CHECK (length(created_at) = 24 AND created_at IS strftime('%Y-%m-%dT%H:%M:%fZ', created_at)),
  CHECK (length(updated_at) = 24 AND updated_at IS strftime('%Y-%m-%dT%H:%M:%fZ', updated_at))
) STRICT;
-- Equivalente a `UNIQUE NULLS NOT DISTINCT (email, carrera_id)`: SQLite trata los
-- NULL como distintos, así que la general (carrera_id NULL) se unifica con 0.
CREATE UNIQUE INDEX suscripciones_newsletter_email_carrera
  ON suscripciones_newsletter(email, ifnull(carrera_id, 0));

-- Ancla de los avisos que no nacen de una consulta. Sin estas columnas el outbox
-- no podría referenciar la fila de FAQ o de clase que originó el aviso.
ALTER TABLE outbox ADD COLUMN faq_id INTEGER REFERENCES faq_preguntas(id) ON DELETE CASCADE;
ALTER TABLE outbox ADD COLUMN clase_id TEXT REFERENCES solicitudes_clase(id) ON DELETE CASCADE;
