-- Cierra los hallazgos accionables de los Advisors de Supabase revisados el
-- 21/10/2026. Se corre a mano en el SQL Editor del dashboard: el rol acotado
-- `cau_editor` no alcanza ni `storage` ni `auth`.
--
-- Contexto completo en docs/seguridad.md (bitácora del 21/10/2026).
-- Reversible: cada DROP POLICY deja el nombre de la policy anterior comentado.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Storage: el bucket `novedades` quedaba escribible por cualquier cuenta.
--
-- `disable_signup: false` en Auth, así que cualquiera puede crearse una cuenta
-- con un mail descartable y confirmarla. Las dos policies de `novedades` sólo
-- miraban `bucket_id`, sin rol ni estado: esa cuenta podía subir y borrar las
-- imágenes de las novedades del sitio. Se alinean con las de `clases-apoyo`,
-- que sí exigen admin aprobado.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Upload autenticado novedades" ON storage.objects;
DROP POLICY IF EXISTS "Delete autenticado novedades" ON storage.objects;
-- Permite reaplicar el archivo sin colisionar con las policies nuevas.
DROP POLICY IF EXISTS "Admin sube imagenes de novedades" ON storage.objects;
DROP POLICY IF EXISTS "Admin borra imagenes de novedades" ON storage.objects;

CREATE POLICY "Admin sube imagenes de novedades"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'novedades'
  AND (SELECT private.current_user_is_admin())
);

CREATE POLICY "Admin borra imagenes de novedades"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'novedades'
  AND (SELECT private.current_user_is_admin())
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Policies de admin que sólo miraban `rol` y no `estado`.
--
-- `private.current_user_is_admin()` exige `estado = 'aprobado'` además del rol.
-- Las de precios dejaban escribir a una cuenta con rol admin pero pendiente o
-- rechazada.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS admin_insert_precios_carreras ON public.precios_carreras;
CREATE POLICY admin_insert_precios_carreras
ON public.precios_carreras
FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.current_user_is_admin()));

DROP POLICY IF EXISTS admin_delete_precios_carreras ON public.precios_carreras;
CREATE POLICY admin_delete_precios_carreras
ON public.precios_carreras
FOR DELETE
TO authenticated
USING ((SELECT private.current_user_is_admin()));

DROP POLICY IF EXISTS admin_update_precios_meta ON public.precios_meta;
CREATE POLICY admin_update_precios_meta
ON public.precios_meta
FOR UPDATE
TO authenticated
USING ((SELECT private.current_user_is_admin()))
WITH CHECK ((SELECT private.current_user_is_admin()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Funciones de trigger ejecutables por `anon`.
--
-- Son `RETURNS trigger`: Postgres no las deja invocar sueltas, así que no hay
-- entrada real. Se revoca igual porque no hay motivo para que `anon` tenga
-- EXECUTE, y el Advisor lo marca en cada revisión. Las tablas siguen
-- disparándolas: el permiso se chequea al crear el trigger, no al ejecutarlo.
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.check_faq_rate_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_solicitud_rate_limit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Policies de INSERT para `anon` que ya no pueden dispararse.
--
-- Desde el 20/07/2026 el INSERT sobre las tres tablas de formularios está
-- revocado para anon y authenticated, y el único camino es
-- POST /api/formularios con service role. Estas policies quedaron huérfanas:
-- hoy no hacen nada y el día que alguien reponga un GRANT vuelven a abrir la
-- puerta que se cerró en julio.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow anonymous inserts with validation" ON public.consultas;
DROP POLICY IF EXISTS faq_anon_insert ON public.faq_preguntas;
DROP POLICY IF EXISTS "anon puede insertar solicitudes limitado" ON public.solicitudes_clase;

COMMIT;
