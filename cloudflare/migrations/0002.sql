-- Infraestructura parcial, sin políticas HTTP ni jobs de limpieza nuevos.
CREATE TABLE form_rate_limits (
  key TEXT NOT NULL PRIMARY KEY,
  window_started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) CHECK (
    length(window_started_at) = 24 AND window_started_at IS strftime('%Y-%m-%dT%H:%M:%fZ', window_started_at)
  ),
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count BETWEEN 0 AND 2147483647)
) STRICT;

CREATE TABLE career_clicks (
  fecha TEXT NOT NULL CHECK (length(fecha) = 10 AND fecha IS date(fecha, '+0 days')),
  carrera TEXT NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks BETWEEN 0 AND 2147483647),
  origen TEXT NOT NULL DEFAULT 'modal' CHECK (origen IN ('modal', 'directa')),
  PRIMARY KEY (fecha, carrera, origen)
) STRICT;

CREATE INDEX career_clicks_digest ON career_clicks(fecha, origen, clicks DESC);
