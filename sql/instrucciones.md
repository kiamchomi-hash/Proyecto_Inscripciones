# Setup Base de Datos — Clases de Apoyo

## Orden de ejecucion

Correr cada paso por separado en el SQL Editor de Supabase.

### Paso 1 — Extensiones

Ir a Dashboard > Database > Extensions y habilitar:
- moddatetime
- pg_cron

### Paso 2 — Crear tabla materias

```sql
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
```

### Paso 3 — Trigger updated_at

```sql
CREATE TRIGGER set_materias_updated_at
  BEFORE UPDATE ON materias
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
```

### Paso 4 — RLS materias

```sql
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon puede leer materias activas"
  ON materias FOR SELECT TO anon
  USING (activa = true);
```

### Paso 5 — Ajustar clases_apoyo

```sql
ALTER TABLE clases_apoyo
  ADD COLUMN materia_id uuid REFERENCES materias(id) ON DELETE CASCADE;

CREATE INDEX idx_clases_apoyo_materia_fecha
  ON clases_apoyo(materia_id, fecha);

CREATE POLICY "anon puede leer clases futuras"
  ON clases_apoyo FOR SELECT TO anon
  USING (fecha >= CURRENT_DATE);
```

### Paso 6 — Insertar materias

Abrir el archivo `sql/insert_materias.sql` con un editor de texto, copiar TODO el contenido y pegarlo en el SQL Editor de Supabase.

NO copiar desde la terminal, copiar desde el archivo directamente para evitar saltos de linea dentro del JSON.

### Paso 7 — Limpieza automatica (pg_cron)

```sql
SELECT cron.schedule('limpiar-clases-pasadas', '0 3 * * *', $$DELETE FROM clases_apoyo WHERE fecha < CURRENT_DATE$$);
```

Esto borra automaticamente las clases con fecha pasada todos los dias a las 03:00 UTC (00:00 Argentina).
