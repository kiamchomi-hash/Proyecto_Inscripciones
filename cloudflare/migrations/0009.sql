-- Contrato local de lib/database.types.ts; defaults y unicidad remotos pendientes
-- del inventario autorizado. No se modifica ninguna tabla anterior.
CREATE TABLE novedades (
  id INTEGER PRIMARY KEY AUTOINCREMENT CHECK (id BETWEEN 1 AND 9007199254740991),
  titulo TEXT NOT NULL,
  contenido TEXT,
  extracto TEXT,
  fecha TEXT NOT NULL,
  tag TEXT NOT NULL,
  imagen_url TEXT,
  href TEXT,
  slug TEXT,
  pinned INTEGER NOT NULL CHECK (pinned IN (0, 1)),
  publicada INTEGER NOT NULL CHECK (publicada IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;
CREATE INDEX novedades_listado ON novedades(publicada, pinned, fecha DESC);
CREATE INDEX novedades_slug ON novedades(slug, publicada);
