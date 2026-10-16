-- Ejecutar manualmente en el SQL Editor ANTES de desplegar el backend.
-- Sólo «Ver precio»: una reserva por correo/carrera cada 168 horas.
begin;

create table if not exists public.reservas_mail_precio (
  email text not null check (email = lower(btrim(email)) and length(email) between 3 and 254),
  carrera_id bigint not null references public.carreras(id) on delete cascade,
  reservado_at timestamptz not null default now(),
  primary key (email, carrera_id)
);

alter table public.reservas_mail_precio enable row level security;
revoke all on table public.reservas_mail_precio from public, anon, authenticated, service_role;

-- El propietario ejecuta el INSERT; service_role sólo puede invocar esta RPC.
-- Sin reloj ni duración provistos por el cliente. El ON CONFLICT bloquea la fila
-- y vuelve a evaluar el plazo tras esperar una reserva concurrente.
create or replace function public.reservar_mail_precio(p_email text, p_carrera_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  correo text := lower(btrim(p_email));
  ahora timestamptz := statement_timestamp();
  reservado boolean := false;
begin
  if correo is null or length(correo) not between 3 and 254
     or p_carrera_id is null or p_carrera_id < 1 then
    return false;
  end if;

  insert into public.reservas_mail_precio as reserva (email, carrera_id, reservado_at)
  values (correo, p_carrera_id, ahora)
  on conflict (email, carrera_id) do update
    set reservado_at = excluded.reservado_at
    where reserva.reservado_at <= ahora - interval '168 hours'
  returning true into reservado;

  return coalesce(reservado, false);
end;
$$;

revoke all on function public.reservar_mail_precio(text, bigint) from public, anon, authenticated;
grant execute on function public.reservar_mail_precio(text, bigint) to service_role;

comment on table public.reservas_mail_precio is
  'Reservas de Ver precio, independientes del consentimiento y del resultado SMTP.';

commit;
