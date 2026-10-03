-- Suscripciones al newsletter sin carrera.
-- Ejecutar manualmente en el SQL Editor de Supabase. Es idempotente: correrlo
-- dos veces no rompe nada.
--
-- Por qué: `suscripciones_newsletter` (sql/2026-09-16_newsletter_por_carrera.sql)
-- nació para «Ver precio», donde siempre hay una carrera. Desde el 02/10/2026 el
-- checkbox de novedades está también en los formularios que piden mail —contacto,
-- preinscripción, /contacto y la pregunta de /faq—, y varios de ellos se envían
-- sin carrera elegida. Sin este cambio, esa suscripción violaría el NOT NULL de
-- `carrera_id` y se perdería (el endpoint registra el error y sigue, así que el
-- formulario respondería 201 igual).
--
-- La unicidad pasa a ser `UNIQUE NULLS NOT DISTINCT (email, carrera_id)`
-- (Postgres 15+): con la UNIQUE común, dos filas con carrera NULL no chocan entre
-- sí y cada envío sin carrera sumaría una suscripción general repetida. Así hay
-- una general por mail, y el upsert del endpoint (`onConflict: 'email,carrera_id'`)
-- la renueva en vez de duplicarla.
--
-- Los permisos no cambian: RLS activo, sin acceso para anon ni authenticated,
-- y la service role con select/insert/update.

begin;

alter table public.suscripciones_newsletter
  alter column carrera_id drop not null,
  alter column carrera_nombre drop not null;

-- La UNIQUE original no tiene nombre explícito: se busca por columnas, no por
-- el nombre que le haya puesto Postgres.
do $$
declare
  restriccion record;
begin
  for restriccion in
    select c.conname
    from pg_constraint c
    where c.conrelid = 'public.suscripciones_newsletter'::regclass
      and c.contype = 'u'
      and c.conname <> 'suscripciones_newsletter_email_carrera_id_nnd'
      and (
        select array_agg(a.attname::text order by a.attname)
        from unnest(c.conkey) as k(attnum)
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
      ) = array['carrera_id', 'email']
  loop
    execute format('alter table public.suscripciones_newsletter drop constraint %I', restriccion.conname);
  end loop;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.suscripciones_newsletter'::regclass
      and conname = 'suscripciones_newsletter_email_carrera_id_nnd'
  ) then
    alter table public.suscripciones_newsletter
      add constraint suscripciones_newsletter_email_carrera_id_nnd
      unique nulls not distinct (email, carrera_id);
  end if;
end $$;

comment on table public.suscripciones_newsletter is
  'Suscripciones voluntarias a novedades: por carrera, o generales con carrera_id NULL (una por mail).';

commit;

-- Verificación: las dos columnas deben decir YES en is_nullable, y la única
-- restricción UNIQUE debe ser la de NULLS NOT DISTINCT.
select column_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'suscripciones_newsletter'
  and column_name in ('carrera_id', 'carrera_nombre');

select conname, pg_get_constraintdef(oid) as definicion
from pg_constraint
where conrelid = 'public.suscripciones_newsletter'::regclass
  and contype = 'u';
