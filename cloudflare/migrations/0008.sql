-- Exclusión durable por intención. Nunca expira ni se roba automáticamente:
-- una interrupción puede haber ocurrido después de aceptar el proveedor.
CREATE TABLE outbox_reclamos (
  efecto_id INTEGER PRIMARY KEY REFERENCES outbox(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE outbox_barrido (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  cursor INTEGER NOT NULL CHECK (cursor >= 0)
) STRICT;
INSERT INTO outbox_barrido(id,cursor) VALUES (1,0);
