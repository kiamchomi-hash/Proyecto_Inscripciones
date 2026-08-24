-- Los tres campos que pide la ficha del portal de Siglo 21 y no existían.
--
-- `tipo_documento` acompaña a `dni`, que guarda sólo el número. `tipo_domicilio`
-- y `torre` son de la sección Domicilios.
--
-- El teléfono NO se parte en código de país / área / móvil como en el portal:
-- en el formulario web va en un campo solo, y sigue guardándose en `telefono`.
--
-- Correr en el SQL Editor de Supabase.

alter table public.consultas
  add column if not exists tipo_documento text,
  add column if not exists tipo_domicilio text,
  add column if not exists torre text;
