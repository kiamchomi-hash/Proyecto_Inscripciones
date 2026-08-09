-- Corrige los hallazgos accionables de Security y Performance Advisors.
-- Los avisos informativos de índices sin uso y tablas internas sin policies
-- se conservan de forma intencional.
BEGIN;

-- Estas tablas pertenecen al módulo de alumnos descartado. La migración aborta
-- si aparecieron datos desde la auditoría, para no eliminar información.
DO $$
DECLARE
  table_name text;
  row_count bigint;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'alumnos_analiticos',
    'alumnos_pagos',
    'alumnos_cau'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('SELECT count(*) FROM public.%I', table_name)
        INTO row_count;

      IF row_count <> 0 THEN
        RAISE EXCEPTION
          'No se elimina public.%: contiene % filas',
          table_name,
          row_count;
      END IF;
    END IF;
  END LOOP;
END;
$$;

DROP TABLE IF EXISTS public.alumnos_analiticos;
DROP TABLE IF EXISTS public.alumnos_pagos;
DROP TABLE IF EXISTS public.alumnos_cau;

-- El helper de administración participa de RLS y por eso debe ser
-- SECURITY DEFINER. Se mueve fuera de public para que PostgREST no lo exponga
-- como RPC y se fija un search_path vacío.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profesores
    WHERE user_id = (SELECT auth.uid())
      AND estado = 'aprobado'
      AND rol = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION private.current_user_is_admin()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.current_user_is_admin()
  TO authenticated, service_role;

-- Recrea las policies con auth.uid() y helpers evaluados una sola vez por
-- sentencia, no una vez por cada fila.
DROP POLICY IF EXISTS profesores_select_own_or_admin
  ON public.profesores;
CREATE POLICY profesores_select_own_or_admin
ON public.profesores
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR (SELECT private.current_user_is_admin())
);

DROP POLICY IF EXISTS profesores_register_pending
  ON public.profesores;
CREATE POLICY profesores_register_pending
ON public.profesores
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND estado = 'pendiente'
  AND rol = 'profesor'
  AND materia_id IS NULL
);

DROP POLICY IF EXISTS materias_approved_update
  ON public.materias;
CREATE POLICY materias_approved_update
ON public.materias
FOR UPDATE
TO authenticated
USING (
  (SELECT private.current_user_is_admin())
  OR EXISTS (
    SELECT 1
    FROM public.profesores
    WHERE user_id = (SELECT auth.uid())
      AND estado = 'aprobado'
      AND rol = 'profesor'
      AND materia_id = materias.id
  )
)
WITH CHECK (
  (SELECT private.current_user_is_admin())
  OR EXISTS (
    SELECT 1
    FROM public.profesores
    WHERE user_id = (SELECT auth.uid())
      AND estado = 'aprobado'
      AND rol = 'profesor'
      AND materia_id = materias.id
  )
);

DROP POLICY IF EXISTS "Admins can manage plantillas"
  ON public.plantillas_mensajes;
CREATE POLICY "Admins can manage plantillas"
ON public.plantillas_mensajes
FOR ALL
TO authenticated
USING ((SELECT private.current_user_is_admin()))
WITH CHECK ((SELECT private.current_user_is_admin()));

-- Ya no quedan policies que dependan de estos helpers expuestos.
DROP FUNCTION IF EXISTS public.current_user_is_admin();
DROP FUNCTION IF EXISTS public.is_admin();

-- notify_edge_function se dispara sólo desde tablas cuyas escrituras públicas
-- ya están revocadas. service_role conserva la capacidad necesaria.
ALTER FUNCTION public.notify_edge_function() SECURITY INVOKER;
REVOKE ALL ON FUNCTION public.notify_edge_function()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_edge_function()
  TO service_role;

-- Es una función de event trigger: no necesita ser invocable como RPC.
REVOKE ALL ON FUNCTION public.rls_auto_enable()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable()
  TO service_role;

-- Los buckets son públicos y sus URLs funcionan sin policies SELECT. Al
-- quitar estas policies se evita que anon enumere todos los objetos. Se
-- identifican por su condición, no por el nombre, porque una policy histórica
-- de novedades quedó guardada con mojibake.
DO $$
DECLARE
  policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND (
        qual LIKE '%bucket_id = ''clases-apoyo''%'
        OR qual LIKE '%bucket_id = ''novedades''%'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY %I ON storage.objects',
      policy_name
    );
  END LOOP;
END;
$$;

COMMIT;
