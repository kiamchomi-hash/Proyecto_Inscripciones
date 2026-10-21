-- Esquema mínimo sintético, NO réplica ni migración de producción.
CREATE TABLE public.guardrails_fixture (id integer PRIMARY KEY);
COMMENT ON TABLE public.guardrails_fixture IS 'cau-guardrails-local';
REVOKE ALL ON public.guardrails_fixture FROM anon, authenticated;
CREATE TABLE public.materias (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre text, activa boolean NOT NULL DEFAULT true,
 descripcion text, imagenes jsonb, dias_bloqueados jsonb, horarios_bloqueados jsonb, modo_manana boolean DEFAULT false
);
CREATE TABLE public.profesores (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid UNIQUE REFERENCES auth.users(id),
 estado text NOT NULL DEFAULT 'pendiente', rol text NOT NULL DEFAULT 'profesor', materia_id uuid REFERENCES public.materias(id)
);
CREATE TABLE public.consultas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), carrera text, tipo text, casa text, tipo_formulario text,
 nombre text, apellido text, tipo_documento text, dni text, sexo text, fecha_nacimiento text,
 localidad_nacimiento text, nacionalidad text, estado_civil text, pais_residencia text, tipo_domicilio text,
 direccion text, direccion_numero text, direccion_piso text, direccion_departamento text, torre text,
 barrio text, codigo_postal text, provincia text, localidad text, nivel_estudios text, colegio text,
 colegio_localidad text, equivalencias boolean NOT NULL DEFAULT false, email text, telefono text
);
CREATE TABLE public.faq_preguntas (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), titulo text, descripcion text, respuesta text,
 estado text NOT NULL DEFAULT 'pendiente', destacada boolean DEFAULT false, orden integer DEFAULT 0,
 created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), modo text, contacto text, nombre_contacto text
);
CREATE TABLE public.solicitudes_clase (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), materia_id uuid REFERENCES public.materias(id),
 dias text[], horarios text[], nombre text, telefono text, bloqueo_semanal boolean DEFAULT false
);
-- Punto de partida permisivo: los SQL de seguridad deben cerrar estos grants.
GRANT ALL ON public.materias, public.profesores, public.consultas, public.faq_preguntas, public.solicitudes_clase TO anon, authenticated, service_role;
GRANT ALL ON public.guardrails_fixture TO service_role;

-- PRERREQUISITOS DE PERMISOS 21/10
-- Storage HTTP está deshabilitado: esta tabla sólo prueba SQL/RLS, no su API.
CREATE SCHEMA IF NOT EXISTS storage;
CREATE TABLE IF NOT EXISTS storage.objects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text NOT NULL, name text NOT NULL,
 UNIQUE (bucket_id, name)
);
COMMENT ON TABLE storage.objects IS 'cau-guardrails-local';
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated, service_role;
DROP POLICY IF EXISTS fixture_objects_read ON storage.objects;
CREATE POLICY fixture_objects_read ON storage.objects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Upload autenticado novedades" ON storage.objects;
CREATE POLICY "Upload autenticado novedades" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'novedades');
DROP POLICY IF EXISTS "Delete autenticado novedades" ON storage.objects;
CREATE POLICY "Delete autenticado novedades" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'novedades');
CREATE TABLE IF NOT EXISTS public.precios_carreras (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), valor integer);
CREATE TABLE IF NOT EXISTS public.precios_meta (id text PRIMARY KEY, valor text);
ALTER TABLE public.precios_carreras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precios_meta ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.precios_carreras TO anon, authenticated, service_role;
GRANT SELECT, UPDATE ON public.precios_meta TO anon, authenticated, service_role;
GRANT ALL ON public.precios_meta TO service_role;
DROP POLICY IF EXISTS fixture_prices_read ON public.precios_carreras;
CREATE POLICY fixture_prices_read ON public.precios_carreras FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS fixture_meta_read ON public.precios_meta;
CREATE POLICY fixture_meta_read ON public.precios_meta FOR SELECT TO anon, authenticated USING (true);
-- Las policies vulnerables sólo exigen rol, sin estado. Octubre debe reemplazarlas.
DROP POLICY IF EXISTS admin_insert_precios_carreras ON public.precios_carreras;
CREATE POLICY admin_insert_precios_carreras ON public.precios_carreras FOR INSERT TO authenticated
 WITH CHECK (EXISTS (SELECT 1 FROM public.profesores WHERE user_id = auth.uid() AND rol = 'admin'));
DROP POLICY IF EXISTS admin_delete_precios_carreras ON public.precios_carreras;
CREATE POLICY admin_delete_precios_carreras ON public.precios_carreras FOR DELETE TO authenticated
 USING (EXISTS (SELECT 1 FROM public.profesores WHERE user_id = auth.uid() AND rol = 'admin'));
DROP POLICY IF EXISTS admin_update_precios_meta ON public.precios_meta;
CREATE POLICY admin_update_precios_meta ON public.precios_meta FOR UPDATE TO authenticated
 USING (EXISTS (SELECT 1 FROM public.profesores WHERE user_id = auth.uid() AND rol = 'admin'));
-- Funciones sintéticas sin avisos, red ni triggers instalados: se prueba su ACL.
CREATE OR REPLACE FUNCTION public.check_faq_rate_limit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.check_solicitud_rate_limit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION public.update_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$;
GRANT EXECUTE ON FUNCTION public.check_faq_rate_limit(), public.check_solicitud_rate_limit(), public.update_updated_at() TO PUBLIC, anon, authenticated, service_role;
DROP POLICY IF EXISTS "Allow anonymous inserts with validation" ON public.consultas;
CREATE POLICY "Allow anonymous inserts with validation" ON public.consultas FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS faq_anon_insert ON public.faq_preguntas;
CREATE POLICY faq_anon_insert ON public.faq_preguntas FOR INSERT TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon puede insertar solicitudes limitado" ON public.solicitudes_clase;
CREATE POLICY "anon puede insertar solicitudes limitado" ON public.solicitudes_clase FOR INSERT TO anon WITH CHECK (true);
