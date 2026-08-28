-- Rol de Postgres para editar contenido desde la máquina local.
--
-- Hasta ahora, desde local no había ninguna credencial de escritura: todo
-- INSERT/UPDATE se copiaba al SQL Editor del dashboard. La alternativa obvia
-- era bajar la service role, pero esa saltea RLS en TODAS las tablas: con ella
-- una consulta mal escrita puede leer o pisar `consultas` (datos personales de
-- leads), `solicitudes_clase` o `profesores`.
--
-- `cau_editor` es la versión acotada: escribe las cuatro tablas de contenido y
-- no tiene ningún privilegio sobre las tablas de formularios. No es disciplina,
-- es Postgres: un UPDATE contra `consultas` con este rol falla con
-- "permission denied for table consultas".
--
-- Se conecta por el pooler con su propia contraseña (ver herramientas/db.mjs),
-- no por PostgREST, así que no hace falta tocar el JWT ni el `authenticator`.
--
-- ANTES DE CORRER: reemplazar CAMBIAR_ESTA_CLAVE por una contraseña larga
-- generada al azar. Es la única vez que se ve; después vive en .env.local.

BEGIN;

-- ── El rol ──
-- Sin atributos: los defaults ya son los restrictivos (NOSUPERUSER,
-- NOCREATEDB, NOCREATEROLE, NOBYPASSRLS). No se declaran explícitamente porque
-- fijar esos flags requiere superusuario y `postgres` en Supabase no lo es.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'cau_editor') THEN
    CREATE ROLE cau_editor LOGIN PASSWORD 'CAMBIAR_ESTA_CLAVE';
  ELSE
    ALTER ROLE cau_editor WITH LOGIN PASSWORD 'CAMBIAR_ESTA_CLAVE';
  END IF;
END $$;

-- Una consulta que se cuelga no deja la conexión tomada para siempre.
ALTER ROLE cau_editor SET statement_timeout = '30s';

GRANT USAGE ON SCHEMA public TO cau_editor;

-- Nada de lo que sigue le da acceso a `auth`, `storage` ni al resto de los
-- esquemas de Supabase: no se le concede USAGE sobre ninguno.

-- ── Contenido: lee y escribe ──
-- DELETE queda afuera a propósito en las cuatro. Una carrera sale de la oferta
-- cambiando `nivel`/`activa`, no borrando la fila; una novedad se despublica.
GRANT SELECT, INSERT, UPDATE ON public.carreras  TO cau_editor;
GRANT SELECT, INSERT, UPDATE ON public.novedades TO cau_editor;
GRANT SELECT, INSERT, UPDATE ON public.materias  TO cau_editor;

-- ── faq_preguntas: por columna, porque la fila trae datos de contacto ──
-- La operación real es responder una pregunta (respuesta/estado/destacada/
-- orden). `contacto` y `nombre_contacto` son de quien preguntó y no se
-- conceden ni para leer. Sin INSERT: las preguntas entran por el formulario.
GRANT SELECT (id, titulo, descripcion, modo, respuesta, estado, destacada, orden, created_at, updated_at)
  ON public.faq_preguntas TO cau_editor;
GRANT UPDATE (titulo, descripcion, respuesta, estado, destacada, orden, updated_at)
  ON public.faq_preguntas TO cau_editor;

-- ── Secuencias de los id, para que el INSERT pueda numerar ──
DO $$
DECLARE
  tabla text;
  secuencia text;
BEGIN
  FOREACH tabla IN ARRAY ARRAY['carreras', 'novedades', 'materias'] LOOP
    secuencia := pg_get_serial_sequence('public.' || tabla, 'id');
    IF secuencia IS NOT NULL THEN
      EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %s TO cau_editor', secuencia);
    END IF;
  END LOOP;
END $$;

-- ── Políticas de RLS ──
-- Las tablas tienen RLS activo (hay un event trigger, `rls_auto_enable`, que lo
-- prende en cada tabla nueva), así que con el GRANT solo el rol vería cero
-- filas. Las políticas son permisivas a propósito: el límite de verdad lo pone
-- el GRANT de arriba, no el USING. Poner el criterio en los dos lados es lo que
-- después nadie mantiene sincronizado.
DROP POLICY IF EXISTS carreras_editor      ON public.carreras;
DROP POLICY IF EXISTS novedades_editor     ON public.novedades;
DROP POLICY IF EXISTS materias_editor      ON public.materias;
DROP POLICY IF EXISTS faq_preguntas_editor ON public.faq_preguntas;

CREATE POLICY carreras_editor      ON public.carreras      FOR ALL TO cau_editor USING (true) WITH CHECK (true);
CREATE POLICY novedades_editor     ON public.novedades     FOR ALL TO cau_editor USING (true) WITH CHECK (true);
CREATE POLICY materias_editor      ON public.materias      FOR ALL TO cau_editor USING (true) WITH CHECK (true);
CREATE POLICY faq_preguntas_editor ON public.faq_preguntas FOR ALL TO cau_editor USING (true) WITH CHECK (true);

COMMIT;

-- ── Verificación ──
-- Tiene que listar exactamente las cuatro tablas de arriba y ninguna más.
-- Si aparece `consultas`, `solicitudes_clase`, `profesores`, `form_rate_limits`
-- o `career_clicks`, algo se concedió de más y hay que revocarlo.
SELECT table_name, string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.table_privileges
WHERE grantee = 'cau_editor'
GROUP BY table_name
ORDER BY table_name;
