-- Marca Agroinformatica como anunciada pero sin inscripcion abierta.
--
-- Contexto: es la carrera que mejor rankea del sitio (posicion 3,6 en
-- "agroinformatica siglo 21", el mejor activo que tiene) pero no se puede
-- cursar todavia. La ficha se queda para no perder esa posicion; lo que cambia
-- es que deja de ofrecer inscribirse y pasa a captar el aviso.
--
-- El codigo ya lee esta columna (components/index/types.ts). Mientras la columna
-- no exista, el campo llega undefined y todo se comporta como hasta ahora, asi
-- que el deploy y este script son independientes.
--
-- Correr en el SQL Editor del dashboard de Supabase.

alter table public.carreras
  add column if not exists proximamente boolean not null default false;

update public.carreras
set proximamente = true
where nombre = 'Agroinformática';
-- Esperado: UPDATE 1

-- Verificar
select id, nombre, nivel, activa, proximamente
from public.carreras
where proximamente = true;

-- Para revertir:
--   update public.carreras set proximamente = false where nombre = 'Agroinformática';
