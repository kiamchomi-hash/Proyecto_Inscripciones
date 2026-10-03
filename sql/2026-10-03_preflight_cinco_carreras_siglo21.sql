-- Sólo lectura: comprobar rol, filas objetivo y ausencia de las dos licenciaturas.
BEGIN READ ONLY;
SELECT current_user AS rol, has_table_privilege(current_user,'public.carreras','SELECT') AS puede_leer, has_table_privilege(current_user,'public.carreras','INSERT') AS puede_insertar, has_table_privilege(current_user,'public.carreras','UPDATE') AS puede_actualizar;
SELECT id,nombre,prefix,nivel,modalidad,activa,orden,updated_at
FROM public.carreras
WHERE id IN (18,63,77) OR (nivel='Grado' AND lower(trim(nombre)) IN ('ambiente y energías renovables','licenciatura en ambiente y energías renovables','hidrocarburos y geociencias','licenciatura en hidrocarburos y geociencias'))
ORDER BY id;
COMMIT;
