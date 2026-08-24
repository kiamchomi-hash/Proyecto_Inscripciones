-- La provincia, que pide la preinscripción de Identidad Argentina.
--
-- Es la única de su lista que no tenía columna: "ciudad" ya entraba en
-- `localidad`, "celular" en `telefono` y "domicilio" en `direccion`.
--
-- Correr en el SQL Editor de Supabase.

alter table public.consultas
  add column if not exists provincia text;
