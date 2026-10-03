-- Cola del robot que carga las autoinscripciones de Teclab, en una tabla privada.
--
-- Cada autoinscripción de Teclab (`consultas` con `tipo_formulario =
-- 'autoinscripcion'`, por el formulario o por el enlace) deja acá una fila
-- `pendiente`. El robot (repo privado `cau-robot-teclab`, GitHub Actions) crea
-- la preinscripción en el Portal Administrativo de Teclab y marca el resultado:
-- `cargada` o `error`. Un error avisa por Telegram para cargarla a mano.
--
-- Los datos personales no viajan a GitHub: el despacho (`repository_dispatch`)
-- lleva sólo el `id` de esta tabla, y el robot pide el legajo a
-- `GET /api/robot/autoinscripciones?id=<id>`, protegido con `ROBOT_SECRET`.
-- Por lo mismo, `detalle` es el motivo técnico del resultado («no encontró la
-- localidad», «DNI ya registrado»), nunca un dato de la persona.
--
-- Quién hace qué:
--   - `POST /api/formularios` (kinds `autoinscripcion` y `enlace`) inserta la
--     fila con la service role, con la consulta ya guardada, y despacha el robot.
--   - `/api/robot/autoinscripciones` la lee y la actualiza con la service role.
--   - `anon` y `authenticated`: nada.
--
-- Correr en el SQL Editor de Supabase. Se puede repetir sin romper nada.
-- Después: `npm run db:tipos` para regenerar lib/database.types.ts (los tipos
-- de esta tabla se agregaron a mano con el mismo formato).

BEGIN;

CREATE TABLE IF NOT EXISTS public.robot_autoinscripciones (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  -- Una fila por autoinscripción: un reintento del despacho no puede cargar
  -- dos veces a la misma persona.
  consulta_id bigint NOT NULL UNIQUE REFERENCES public.consultas(id) ON DELETE CASCADE,
  estado      text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'cargada', 'error')),
  intentos    integer NOT NULL DEFAULT 0,
  -- El motivo del último resultado, truncado a 300 caracteres por el sitio.
  -- Sin datos personales.
  detalle     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- El barrido del robot pide las pendientes: un índice parcial alcanza.
CREATE INDEX IF NOT EXISTS robot_autoinscripciones_pendientes_idx
  ON public.robot_autoinscripciones (id)
  WHERE estado = 'pendiente';

COMMENT ON TABLE public.robot_autoinscripciones IS
  'Cola del robot que carga las autoinscripciones de Teclab en su portal. Privada: sólo la service role (API del sitio). Sin datos personales.';

-- RLS activo y ninguna política: aunque un GRANT se colara por los privilegios
-- por defecto del esquema, anon y authenticated no verían ninguna fila.
ALTER TABLE public.robot_autoinscripciones ENABLE ROW LEVEL SECURITY;

-- Los privilegios por defecto de `public` en Supabase les conceden todo a
-- anon, authenticated y service_role en cada tabla nueva. Se limpian y se
-- concede lo justo: la service role crea, lee y marca el resultado; nunca
-- borra (el borrado viene en cascada con la consulta).
REVOKE ALL ON public.robot_autoinscripciones FROM anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.robot_autoinscripciones TO service_role;

COMMIT;

-- Verificación 1: sólo service_role (INSERT, SELECT, UPDATE). Si aparece anon
-- o authenticated, se concedió de más.
SELECT grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.table_privileges
WHERE table_schema = 'public' AND table_name = 'robot_autoinscripciones'
GROUP BY grantee
ORDER BY grantee;

-- Verificación 2: RLS activo.
SELECT relname, relrowsecurity
FROM pg_class
WHERE oid = 'public.robot_autoinscripciones'::regclass;

-- Verificación 3, con el sitio deployado: después de una autoinscripción de
-- prueba tiene que aparecer su fila. Sin `ROBOT_GITHUB_TOKEN` queda
-- `pendiente`; con el robot andando pasa a `cargada` o `error`.
--
-- SELECT r.id, r.estado, r.intentos, r.detalle, r.updated_at
-- FROM public.robot_autoinscripciones r
-- ORDER BY r.id DESC LIMIT 5;
