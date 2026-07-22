-- Cierra la lectura pública de datos personales.
-- El anon key viaja en el bundle del navegador: todo lo que anon pueda SELECT es público.
BEGIN;

-- ── consultas / solicitudes_clase: nadie público las lee ──
ALTER TABLE public.consultas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_clase  ENABLE ROW LEVEL SECURITY;
REVOKE SELECT, UPDATE, DELETE ON public.consultas         FROM anon, authenticated;
REVOKE SELECT, UPDATE, DELETE ON public.solicitudes_clase FROM anon, authenticated;

-- ── faq_preguntas: sólo las aprobadas, y sin datos de contacto ──
ALTER TABLE public.faq_preguntas ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE policy_name text;
BEGIN
  FOR policy_name IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'faq_preguntas'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.faq_preguntas', policy_name);
  END LOOP;
END $$;

CREATE POLICY faq_public_read
ON public.faq_preguntas FOR SELECT TO anon, authenticated
USING (estado = 'aprobada');

-- Sin el email/nombre de quien preguntó: la página nunca los usa.
REVOKE SELECT, UPDATE, DELETE ON public.faq_preguntas FROM anon, authenticated;
GRANT SELECT (id, titulo, descripcion, respuesta, estado, destacada, orden, created_at, updated_at)
ON public.faq_preguntas TO anon, authenticated;

COMMIT;
