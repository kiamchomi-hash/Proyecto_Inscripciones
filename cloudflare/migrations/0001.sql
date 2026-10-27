-- Esquema destino parcial: catálogo, precio privado y reserva de correo.
-- Sólo fixtures locales por ahora. No equivale al esquema completo de Supabase.
CREATE TABLE carreras (
  id INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 9007199254740991),
  nombre TEXT NOT NULL,
  nivel TEXT NOT NULL,
  modalidad TEXT NOT NULL,
  activa INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1)),
  destacada INTEGER NOT NULL DEFAULT 0 CHECK (destacada IN (0, 1)),
  nueva INTEGER NOT NULL DEFAULT 0 CHECK (nueva IN (0, 1)),
  proximamente INTEGER NOT NULL DEFAULT 0 CHECK (proximamente IN (0, 1)),
  orden INTEGER,
  prefix TEXT,
  nombre_corto TEXT,
  duracion TEXT,
  titulo TEXT,
  area TEXT,
  descripcion TEXT,
  enfoque TEXT,
  plan_estudios TEXT,
  seccion_duracion TEXT,
  seccion_modalidad TEXT,
  slides TEXT CHECK (slides IS NULL OR json_valid(slides)),
  descuento_especial TEXT CHECK (descuento_especial IS NULL OR json_valid(descuento_especial)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE INDEX carreras_catalogo_orden ON carreras(orden, id) WHERE activa = 1;

CREATE TABLE precios_privados (
  -- INT (no INTEGER) evita el alias rowid y la asignación automática de un ID omitido.
  carrera_id INT NOT NULL PRIMARY KEY REFERENCES carreras(id) ON DELETE CASCADE,
  institucion TEXT NOT NULL,
  conceptos TEXT NOT NULL CHECK (json_valid(conceptos) AND json_type(conceptos) = 'array'),
  total TEXT NOT NULL,
  nota TEXT,
  -- Fecha civil, no timestamp: no debe desplazarse al día anterior en Argentina.
  vigente_hasta TEXT NOT NULL CHECK (
    length(vigente_hasta) = 10 AND vigente_hasta IS date(vigente_hasta, '+0 days')
  ),
  actualizado_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;

CREATE TABLE reservas_mail_precio (
  email TEXT NOT NULL CHECK (email = lower(trim(email)) AND length(email) BETWEEN 3 AND 254),
  carrera_id INTEGER NOT NULL REFERENCES carreras(id) ON DELETE CASCADE,
  reservado_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) CHECK (
    length(reservado_at) = 24 AND reservado_at IS strftime('%Y-%m-%dT%H:%M:%fZ', reservado_at)
  ),
  PRIMARY KEY (email, carrera_id)
) STRICT;

CREATE INDEX reservas_mail_precio_carrera ON reservas_mail_precio(carrera_id);
