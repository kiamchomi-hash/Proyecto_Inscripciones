-- Le da a `cau_editor` acceso a `consultas`, que el rol no tenía a propósito.
--
-- El motivo concreto: probar el formulario de punta a punta contra producción
-- deja una fila real, y hasta ahora ningún rol disponible desde local podía
-- verla ni borrarla — la limpieza había que hacerla desde el dashboard.
--
-- Se concede lo mínimo para eso: leer (verificar que el lead entró completo) y
-- borrar (sacar la prueba). **INSERT y UPDATE quedan afuera**: las consultas
-- entran sólo por POST /api/formularios con la service role, que es el
-- invariante que sostiene el modelo de seguridad, y ninguna fila de un lead
-- real se edita a mano.
--
-- Esto amplía el alcance del rol a datos personales. Para volver atrás:
--   REVOKE SELECT, DELETE ON public.consultas FROM cau_editor;
--   DROP POLICY IF EXISTS consultas_editor ON public.consultas;

BEGIN;

GRANT SELECT, DELETE ON public.consultas TO cau_editor;

DROP POLICY IF EXISTS consultas_editor ON public.consultas;
CREATE POLICY consultas_editor ON public.consultas
FOR ALL TO cau_editor
USING (true) WITH CHECK (false);

COMMIT;

-- Verificación: `consultas` tiene que aparecer con SELECT y DELETE, nunca con
-- INSERT ni UPDATE.
SELECT table_name, string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) AS privilegios
FROM information_schema.table_privileges
WHERE grantee = 'cau_editor'
GROUP BY table_name
ORDER BY table_name;
