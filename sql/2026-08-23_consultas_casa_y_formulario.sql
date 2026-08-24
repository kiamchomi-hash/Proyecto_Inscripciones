-- El discriminador: de qué casa vino la consulta y desde qué formulario.
--
-- Sin esto, una preinscripción de Teclab y una consulta suelta de la home
-- llegan idénticas al aviso de Telegram y al panel, y sólo se distinguen
-- mirando cuántos campos vinieron llenos.
--
-- Las filas anteriores al cambio quedan en null, que es lo correcto: de esas
-- no sabemos de qué casa vinieron.
--
-- Correr en el SQL Editor de Supabase.

alter table public.consultas
  add column if not exists casa text,
  add column if not exists tipo_formulario text;

-- Los valores los pone components/formularios/casas.ts. La restricción es
-- laxa a propósito: si mañana entra una casa nueva, el INSERT no tiene que
-- empezar a rebotar antes de que alguien corra una migración.
comment on column public.consultas.casa is
  'siglo21 | teclab | identidad. Null en las filas previas al 23/08/2026.';
comment on column public.consultas.tipo_formulario is
  'contacto | preinscripcion. Null en las filas previas al 23/08/2026.';
