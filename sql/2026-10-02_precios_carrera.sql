-- Precios por carrera para «Ver precio», en una tabla privada.
--
-- El modal de Teclab ofrece ver el precio a cambio de nombre y mail. Si el
-- precio viajara en el HTML o en una tabla legible por `anon`, ese registro
-- sería decorativo: cualquiera lo leería con la anon key, que es pública. Por
-- eso esta tabla no tiene ningún acceso para `anon` ni `authenticated`, y el
-- precio lo devuelve POST /api/formularios (kind `precio`) con la service role
-- recién después de guardar el lead en `consultas`.
--
-- No confundir con `precios_carreras` (en plural), que es la tabla vieja de
-- precios de Siglo 21 y no tiene nada que ver con esta.
--
-- Quién hace qué:
--   - `cau_editor` escribe: `herramientas/ventas/publicar-precios.mjs` carga
--     acá los precios que ya resolvió el pipeline local.
--   - `service_role` sólo lee: la API no escribe precios.
--   - `anon` y `authenticated`: nada.
--
-- `vigente_hasta` es el último día de la promoción. Vencido, la API no muestra
-- el precio y ofrece WhatsApp: un precio viejo dicho por el sitio es una
-- promesa que después no se puede cumplir.
--
-- Correr en el SQL Editor de Supabase. Se puede repetir sin romper nada.

BEGIN;

CREATE TABLE IF NOT EXISTS public.precios_privados (
  carrera_id     bigint PRIMARY KEY REFERENCES public.carreras(id) ON DELETE CASCADE,
  institucion    text NOT NULL,
  -- Una línea por concepto, en el orden en que se muestran:
  --   [{"concepto": "Matrícula", "monto": "$ 64.227,75", "descuento": 75}]
  -- El monto va como texto ya formateado, igual que lo cotiza el pipeline:
  -- la API lo muestra tal cual y no hace cuentas.
  conceptos      jsonb NOT NULL CHECK (jsonb_typeof(conceptos) = 'array'),
  total          text NOT NULL,
  -- Qué cubre el pago (por ejemplo, un bimestre de cursada). Opcional.
  nota           text,
  vigente_hasta  date NOT NULL,
  actualizado_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.precios_privados IS
  'Precio vigente por carrera para «Ver precio». Privada: sólo la lee la API con service role, después de registrar el lead.';

-- RLS activo y ninguna política para anon/authenticated: aunque un GRANT se
-- colara por los privilegios por defecto del esquema, no verían ninguna fila.
ALTER TABLE public.precios_privados ENABLE ROW LEVEL SECURITY;

-- Los privilegios por defecto de `public` en Supabase les conceden todo a
-- anon, authenticated y service_role en cada tabla nueva. Se limpian y se
-- concede lo justo.
REVOKE ALL ON public.precios_privados FROM anon, authenticated, service_role;
GRANT SELECT ON public.precios_privados TO service_role;

-- `cau_editor` no tiene BYPASSRLS: sin una política propia vería cero filas y
-- el upsert del publicador fallaría. La política es permisiva a propósito,
-- como las demás del rol: el límite lo pone el GRANT.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.precios_privados TO cau_editor;
DROP POLICY IF EXISTS precios_privados_editor ON public.precios_privados;
CREATE POLICY precios_privados_editor ON public.precios_privados
FOR ALL TO cau_editor
USING (true) WITH CHECK (true);

-- El registro de «Ver precio» entra en `consultas` con este discriminador.
-- La columna no tiene restricción (ver 2026-08-23_consultas_casa_y_formulario.sql);
-- sólo se actualiza la documentación.
COMMENT ON COLUMN public.consultas.tipo_formulario IS
  'contacto | preinscripcion | precio. Null en las filas previas al 23/08/2026.';

COMMIT;

-- Verificación 1: `precios_privados` tiene que aparecer sólo para cau_editor
-- (SELECT, INSERT, UPDATE, DELETE) y service_role (SELECT). Si aparece anon o
-- authenticated, se concedió de más.
SELECT grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.table_privileges
WHERE table_schema = 'public' AND table_name = 'precios_privados'
GROUP BY grantee
ORDER BY grantee;

-- Verificación 2: RLS activo y una sola política, la de cau_editor.
SELECT c.relrowsecurity AS rls, p.polname, p.polroles::regrole[]
FROM pg_class c
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE c.oid = 'public.precios_privados'::regclass;
