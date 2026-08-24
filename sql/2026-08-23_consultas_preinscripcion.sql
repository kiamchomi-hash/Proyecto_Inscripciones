-- Columnas que faltaban en `consultas` para los datos de preinscripción.
--
-- El 23/08/2026 el endpoint /api/formularios empezó a escribir catorce campos
-- nuevos, pero siete no existían en la tabla. PostgREST rechaza el INSERT
-- entero cuando una columna no existe (PGRST204), así que dejaron de entrar
-- TODAS las consultas: la home, /contacto y los dos formularios de /teclab.
--
-- Las otras dos diferencias no se arreglan acá sino en el código: la tabla ya
-- tenía `localidad_nacimiento` y `direccion`, y el endpoint las llamaba
-- `lugar_nacimiento` y `domicilio`.
--
-- Correr en el SQL Editor de Supabase ANTES de deployar el arreglo del endpoint.

alter table public.consultas
  add column if not exists direccion_numero text,
  add column if not exists direccion_piso text,
  add column if not exists direccion_departamento text,
  add column if not exists nivel_estudios text,
  add column if not exists colegio text,
  add column if not exists colegio_localidad text,
  add column if not exists medio_pago text;
