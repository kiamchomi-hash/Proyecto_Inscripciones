-- Suscripciones voluntarias a novedades de una carrera.
-- Ejecutar manualmente en el SQL Editor de Supabase.

create table if not exists public.suscripciones_newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  carrera_id bigint not null references public.carreras(id),
  carrera_nombre text not null,
  activo boolean not null default true,
  consentimiento_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email, carrera_id)
);

alter table public.suscripciones_newsletter enable row level security;
revoke all on public.suscripciones_newsletter from anon, authenticated;
grant select, insert, update on public.suscripciones_newsletter to service_role;

comment on table public.suscripciones_newsletter is 'Suscripciones voluntarias a novedades segmentadas por carrera.';
