-- Contenido local de materias. Defaults del destino según SQL/tipos versionados;
-- el inventario remoto sigue pendiente. No inserta padres ni datos de producción.
CREATE TABLE materias (
  id TEXT NOT NULL PRIMARY KEY CHECK (
    length(id) = 36 AND substr(id, 9, 1) = '-' AND substr(id, 14, 1) = '-'
    AND substr(id, 19, 1) = '-' AND substr(id, 24, 1) = '-'
    AND length(replace(id, '-', '')) = 32 AND replace(id, '-', '') NOT GLOB '*[^0-9a-fA-F]*'
  ),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  nombre_profesor TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  telefono_display TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(descripcion)),
  imagenes TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(imagenes)),
  en_construccion INTEGER NOT NULL DEFAULT 0 CHECK (en_construccion IN (0, 1)),
  activa INTEGER NOT NULL DEFAULT 1 CHECK (activa IN (0, 1)),
  orden INTEGER NOT NULL DEFAULT 0 CHECK (orden BETWEEN -32768 AND 32767),
  modo_manana INTEGER NOT NULL DEFAULT 0 CHECK (modo_manana IN (0, 1)),
  dias_bloqueados TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(dias_bloqueados)),
  horarios_bloqueados TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(horarios_bloqueados)),
  texto_seo TEXT CHECK (texto_seo IS NULL OR json_valid(texto_seo)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (length(created_at) = 24 AND created_at IS strftime('%Y-%m-%dT%H:%M:%fZ', created_at)),
  CHECK (length(updated_at) = 24 AND updated_at IS strftime('%Y-%m-%dT%H:%M:%fZ', updated_at))
) STRICT;
CREATE INDEX materias_publicas ON materias(activa, orden, id);
