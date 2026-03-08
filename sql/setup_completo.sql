-- ====== PASO 1: Tabla materias ======

CREATE TABLE materias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  label text NOT NULL,
  nombre_profesor text NOT NULL,
  whatsapp text NOT NULL,
  telefono_display text NOT NULL,
  descripcion jsonb NOT NULL DEFAULT '[]',
  imagenes jsonb NOT NULL DEFAULT '[]',
  en_construccion boolean NOT NULL DEFAULT false,
  activa boolean NOT NULL DEFAULT true,
  orden smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_materias_updated_at
  BEFORE UPDATE ON materias
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

ALTER TABLE materias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon puede leer materias activas"
  ON materias FOR SELECT TO anon
  USING (activa = true);


-- ====== PASO 2: Ajustar clases_apoyo ======

ALTER TABLE clases_apoyo
  ADD COLUMN materia_id uuid REFERENCES materias(id) ON DELETE CASCADE;

CREATE INDEX idx_clases_apoyo_materia_fecha
  ON clases_apoyo(materia_id, fecha);

CREATE POLICY "anon puede leer clases futuras"
  ON clases_apoyo FOR SELECT TO anon
  USING (fecha >= CURRENT_DATE);


-- ====== PASO 3: Datos iniciales ======
-- COPIAR DESDE EL ARCHIVO sql/insert_materias.sql


-- ====== PASO 4: Limpieza automatica ======
-- Primero habilitar pg_cron desde Dashboard > Database > Extensions

SELECT cron.schedule('limpiar-clases-pasadas', '0 3 * * *', $$DELETE FROM clases_apoyo WHERE fecha < CURRENT_DATE$$);
