-- Enlaces de inscripción de Teclab, en una tabla privada.
--
-- Cada preinscripción de Teclab trae en el aviso de Telegram un enlace para
-- reenviarle a la persona: https://www.siglo21sur.com/inscripcion/<codigo>.
-- Al abrirlo ve el precio vigente de su carrera y un resumen oculto de sus
-- datos, elige el medio de pago y queda creada la autoinscripción sin volver a
-- tipear nada.
--
-- El código es al azar (32 letras y números, unos 190 bits) y es lo único que
-- viaja en la URL: ningún dato personal. Vence a los 7 días o al usarse.
--
-- Quién hace qué:
--   - La Edge Function `notificar` inserta el código con la service role,
--     cuando el INSERT en `consultas` es una preinscripción de Teclab. No se
--     crea ningún trigger nuevo: es el mismo aviso de `on_consulta_insert`.
--   - La página `/inscripcion/[codigo]` y `POST /api/formularios`
--     (kind `enlace`) lo leen y lo marcan usado con la service role.
--   - `anon` y `authenticated`: nada. Con la anon key, que es pública, no se
--     puede listar ni adivinar ningún enlace.
--
-- Correr en el SQL Editor de Supabase. Se puede repetir sin romper nada.
-- Después: `npm run db:tipos` para regenerar lib/database.types.ts (los tipos
-- de esta tabla se agregaron a mano con el mismo formato) y redeployar
-- `notificar` (ver docs/notas-operativas.md).

BEGIN;

CREATE TABLE IF NOT EXISTS public.enlaces_inscripcion (
  -- Mismo formato que exigen la Edge Function y el sitio (`esCodigoEnlace` en
  -- components/formularios/casas.ts). Sin `_` ni `-`: rompen el Markdown del
  -- aviso de Telegram.
  codigo      text PRIMARY KEY CHECK (codigo ~ '^[A-Za-z0-9]{22,64}$'),
  consulta_id bigint NOT NULL REFERENCES public.consultas(id) ON DELETE CASCADE,
  creado_at   timestamptz NOT NULL DEFAULT now(),
  vence_at    timestamptz NOT NULL DEFAULT now() + interval '7 days',
  usado_at    timestamptz
);

-- El FK no crea índice solo: sin esto, borrar una consulta recorre la tabla.
CREATE INDEX IF NOT EXISTS enlaces_inscripcion_consulta_id_idx
  ON public.enlaces_inscripcion (consulta_id);

COMMENT ON TABLE public.enlaces_inscripcion IS
  'Enlace personal de inscripción de cada preinscripción de Teclab. Privada: sólo la service role (Edge Function notificar y la API del sitio).';

-- RLS activo y ninguna política: aunque un GRANT se colara por los privilegios
-- por defecto del esquema, anon y authenticated no verían ninguna fila.
ALTER TABLE public.enlaces_inscripcion ENABLE ROW LEVEL SECURITY;

-- Los privilegios por defecto de `public` en Supabase les conceden todo a
-- anon, authenticated y service_role en cada tabla nueva. Se limpian y se
-- concede lo justo: la service role crea, lee y marca usado; nunca borra (el
-- borrado viene en cascada con la consulta).
REVOKE ALL ON public.enlaces_inscripcion FROM anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.enlaces_inscripcion TO service_role;

COMMIT;

-- Verificación 1: sólo service_role (INSERT, SELECT, UPDATE). Si aparece anon
-- o authenticated, se concedió de más.
SELECT grantee, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.table_privileges
WHERE table_schema = 'public' AND table_name = 'enlaces_inscripcion'
GROUP BY grantee
ORDER BY grantee;

-- Verificación 2: RLS activo.
SELECT relname, relrowsecurity
FROM pg_class
WHERE oid = 'public.enlaces_inscripcion'::regclass;

-- Verificación 3, después de redeployar `notificar`: una preinscripción de
-- Teclab de prueba tiene que dejar su enlace. OJO: esto manda un aviso real
-- por Telegram. El DELETE de la consulta borra el enlace en cascada.
--
-- INSERT INTO public.consultas (nombre, apellido, email, carrera, casa, tipo_formulario)
-- VALUES ('PRUEBA', 'ENLACE', 'prueba@siglo21sur.com', 'Test', 'teclab', 'preinscripcion');
--
-- SELECT id, status_code, content, created
-- FROM net._http_response ORDER BY created DESC LIMIT 3;
--
-- SELECT e.codigo, e.vence_at, e.usado_at
-- FROM public.enlaces_inscripcion e
-- JOIN public.consultas c ON c.id = e.consulta_id
-- WHERE c.nombre = 'PRUEBA' AND c.apellido = 'ENLACE';
--
-- DELETE FROM public.consultas WHERE nombre = 'PRUEBA' AND apellido = 'ENLACE';
