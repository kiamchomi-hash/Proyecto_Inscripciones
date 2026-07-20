BEGIN;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profesores
    WHERE user_id = auth.uid()
      AND estado = 'aprobado'
      AND rol = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, service_role;

ALTER TABLE public.profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profesores FORCE ROW LEVEL SECURITY;

DO $$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profesores'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profesores', policy_name);
  END LOOP;
END $$;

CREATE POLICY profesores_select_own_or_admin
ON public.profesores FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.current_user_is_admin());

CREATE POLICY profesores_register_pending
ON public.profesores FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND estado = 'pendiente'
  AND rol = 'profesor'
  AND materia_id IS NULL
);

REVOKE UPDATE, DELETE ON public.profesores FROM authenticated;

ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'materias'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.materias', policy_name);
  END LOOP;
END $$;

CREATE POLICY materias_public_read
ON public.materias FOR SELECT TO anon, authenticated
USING (activa = true);

CREATE POLICY materias_approved_update
ON public.materias FOR UPDATE TO authenticated
USING (
  public.current_user_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.profesores
    WHERE user_id = auth.uid()
      AND estado = 'aprobado'
      AND rol = 'profesor'
      AND materia_id = materias.id
  )
)
WITH CHECK (
  public.current_user_is_admin()
  OR EXISTS (
    SELECT 1 FROM public.profesores
    WHERE user_id = auth.uid()
      AND estado = 'aprobado'
      AND rol = 'profesor'
      AND materia_id = materias.id
  )
);

REVOKE UPDATE ON public.materias FROM authenticated;
GRANT UPDATE (descripcion, imagenes, dias_bloqueados, horarios_bloqueados, modo_manana)
ON public.materias TO authenticated;

COMMIT;
