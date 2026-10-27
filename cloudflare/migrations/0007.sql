-- FK pendiente de clases, sin apagar integridad ni inventar padres. Si hay filas
-- de 3B, cargar sus materias entre 0006 y 0007: una huérfana aborta esta migración.
-- No se extrapola el cascade de `clases_apoyo` (otra tabla histórica): NO ACTION
-- hasta contrastar la acción real de solicitudes_clase en el inventario remoto.
CREATE TABLE solicitudes_clase_nueva (
  id TEXT NOT NULL PRIMARY KEY CHECK (length(id) = 36),
  materia_id TEXT NOT NULL REFERENCES materias(id) CHECK (length(materia_id) = 36),
  dias TEXT NOT NULL CHECK (json_valid(dias) AND json_type(dias) = 'array'),
  horarios TEXT NOT NULL CHECK (json_valid(horarios) AND json_type(horarios) = 'array'),
  nombre TEXT,
  telefono TEXT NOT NULL,
  bloqueo_semanal INTEGER NOT NULL DEFAULT 0 CHECK (bloqueo_semanal IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (length(created_at) = 24 AND created_at IS strftime('%Y-%m-%dT%H:%M:%fZ', created_at))
) STRICT;
INSERT INTO solicitudes_clase_nueva
  SELECT id, materia_id, dias, horarios, nombre, telefono, bloqueo_semanal, created_at FROM solicitudes_clase;

-- El outbox hijo se copia ANTES de retirar la tabla vieja: DROP del padre con
-- ON DELETE CASCADE borraría sus avisos aunque se difiera la comprobación de FK.
CREATE TABLE outbox_nueva (
  id INTEGER PRIMARY KEY AUTOINCREMENT CHECK (id BETWEEN 1 AND 9007199254740991),
  tipo TEXT NOT NULL CHECK (tipo IN (
    'aviso-lead', 'newsletter-alta', 'mail-precio',
    'lead-sede', 'robot-encolar', 'robot-despacho', 'aviso-robot-error'
  )),
  clave TEXT NOT NULL CHECK (length(clave) BETWEEN 1 AND 120),
  consulta_id INTEGER REFERENCES consultas(id) ON DELETE CASCADE,
  detalle TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'enviado', 'error', 'ambiguo', 'omitido')),
  intentos INTEGER NOT NULL DEFAULT 0 CHECK (intentos BETWEEN 0 AND 2147483647),
  ultimo_error TEXT CHECK (ultimo_error IS NULL OR length(ultimo_error) <= 120),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  faq_id INTEGER REFERENCES faq_preguntas(id) ON DELETE CASCADE,
  clase_id TEXT REFERENCES solicitudes_clase_nueva(id) ON DELETE CASCADE,
  UNIQUE (tipo, clave),
  CHECK (length(created_at) = 24 AND created_at IS strftime('%Y-%m-%dT%H:%M:%fZ', created_at)),
  CHECK (length(updated_at) = 24 AND updated_at IS strftime('%Y-%m-%dT%H:%M:%fZ', updated_at))
) STRICT;
INSERT INTO outbox_nueva
  SELECT id, tipo, clave, consulta_id, detalle, estado, intentos, ultimo_error,
    created_at, updated_at, faq_id, clase_id FROM outbox;
-- Conservar el máximo histórico incluso si la última fila fue borrada. No
-- restaurar sólo max(id): reutilizar un id podría repetir la clave de una entrega.
UPDATE sqlite_sequence SET seq = max(seq, ifnull((SELECT seq FROM sqlite_sequence WHERE name = 'outbox'), 0))
  WHERE name = 'outbox_nueva';
DROP TABLE outbox;
DROP TABLE solicitudes_clase;
ALTER TABLE solicitudes_clase_nueva RENAME TO solicitudes_clase;
ALTER TABLE outbox_nueva RENAME TO outbox;
CREATE INDEX solicitudes_clase_materia ON solicitudes_clase(materia_id);
CREATE INDEX outbox_pendientes ON outbox(id) WHERE estado = 'pendiente';
CREATE INDEX outbox_consulta ON outbox(consulta_id);
