-- Soporte de FK y legajo para enlaces/robot. No publica la API de consultas ni avisos.
CREATE TABLE consultas (
  id INTEGER PRIMARY KEY AUTOINCREMENT CHECK (id BETWEEN 1 AND 9007199254740991),
  apellido TEXT,
  barrio TEXT,
  carrera TEXT,
  casa TEXT,
  codigo_postal TEXT,
  colegio TEXT,
  colegio_localidad TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  direccion TEXT,
  direccion_departamento TEXT,
  direccion_numero TEXT,
  direccion_piso TEXT,
  dni TEXT,
  email TEXT,
  equivalencias INTEGER CHECK (equivalencias IS NULL OR equivalencias IN (0, 1)),
  estado_civil TEXT,
  fecha_nacimiento TEXT,
  localidad TEXT,
  localidad_nacimiento TEXT,
  medio_pago TEXT,
  modalidad TEXT,
  nacionalidad TEXT,
  nivel_estudios TEXT,
  nombre TEXT,
  pais_residencia TEXT,
  provincia TEXT,
  sexo TEXT,
  telefono TEXT,
  tipo TEXT,
  tipo_documento TEXT,
  tipo_domicilio TEXT,
  tipo_formulario TEXT,
  torre TEXT
) STRICT;

CREATE TABLE enlaces_inscripcion (
  codigo TEXT NOT NULL PRIMARY KEY CHECK (length(codigo) BETWEEN 22 AND 64 AND codigo NOT GLOB '*[^A-Za-z0-9]*'),
  consulta_id INTEGER NOT NULL REFERENCES consultas(id) ON DELETE CASCADE,
  creado_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  vence_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+7 days')),
  usado_at TEXT,
  CHECK (length(creado_at) = 24 AND creado_at IS strftime('%Y-%m-%dT%H:%M:%fZ', creado_at)),
  CHECK (length(vence_at) = 24 AND vence_at IS strftime('%Y-%m-%dT%H:%M:%fZ', vence_at)),
  CHECK (usado_at IS NULL OR (length(usado_at) = 24 AND usado_at IS strftime('%Y-%m-%dT%H:%M:%fZ', usado_at)))
) STRICT;
CREATE INDEX enlaces_inscripcion_consulta ON enlaces_inscripcion(consulta_id);

CREATE TABLE robot_autoinscripciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT CHECK (id BETWEEN 1 AND 9007199254740991),
  consulta_id INTEGER NOT NULL UNIQUE REFERENCES consultas(id) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'cargada', 'error')),
  intentos INTEGER NOT NULL DEFAULT 0 CHECK (intentos BETWEEN 0 AND 2147483647),
  detalle TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
) STRICT;
CREATE INDEX robot_autoinscripciones_pendientes ON robot_autoinscripciones(id) WHERE estado = 'pendiente';
