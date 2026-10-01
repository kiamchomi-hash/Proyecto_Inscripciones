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
