-- Programa el digest diario de clicks, que nunca llego a correr.
--
-- Por que fallo: el bloque del cron en sql/2026-07-22_clicks_carreras.sql pedia
-- reemplazar <WEBHOOK_SECRET> a mano antes de ejecutarlo. Nunca se ejecuto, asi
-- que cron.job quedo vacio y la Edge Function digest-clicks nunca se invoco.
--
-- Este script no pide pegar el secreto: lo saca del trigger notify_edge_function,
-- que ya tiene el valor vigente (se roto el 27/07). Si no lo encuentra, aborta
-- en vez de programar un job que responderia 401 todas las noches.
--
-- Correr en el SQL Editor del dashboard de Supabase.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $do$
DECLARE
  v_secret text;
BEGIN
  SELECT (regexp_match(prosrc, 'Bearer\s+([^''"\s]+)'))[1]
  INTO v_secret
  FROM pg_proc
  WHERE proname = 'notify_edge_function'
  LIMIT 1;

  IF v_secret IS NULL OR v_secret = '' THEN
    RAISE EXCEPTION 'No se pudo leer el WEBHOOK_SECRET de notify_edge_function. Programar a mano con el bloque comentado al final.';
  END IF;

  -- Idempotente: si el job ya existe, lo reemplaza.
  PERFORM cron.unschedule('digest-clicks-diario')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'digest-clicks-diario');

  -- 12:00 UTC = 09:00 en Buenos Aires.
  PERFORM cron.schedule(
    'digest-clicks-diario',
    '0 12 * * *',
    format($f$
      SELECT net.http_post(
        url     := 'https://yuwfkdehaowkselkhtck.supabase.co/functions/v1/digest-clicks',
        headers := jsonb_build_object(
                     'Content-Type',  'application/json',
                     'Authorization', 'Bearer %s'
                   ),
        body    := '{}'::jsonb
      );
    $f$, v_secret)
  );
END
$do$;

-- 1. El job tiene que aparecer activo
select jobid, jobname, schedule, active
from cron.job
where jobname = 'digest-clicks-diario';

-- 2. Probarlo sin esperar a las 9hs: dispara el digest ahora mismo
--    (mandalo y revisa el paso 3; deberia llegar el mensaje de Telegram)
select net.http_post(
  url     := 'https://yuwfkdehaowkselkhtck.supabase.co/functions/v1/digest-clicks',
  headers := (select jsonb_build_object(
                'Content-Type',  'application/json',
                'Authorization', 'Bearer ' || (regexp_match(prosrc, 'Bearer\s+([^''"\s]+)'))[1]
              )
              from pg_proc where proname = 'notify_edge_function' limit 1),
  body    := '{}'::jsonb
);

-- 3. Ver como respondio. Esperado: 200. Un 401 significa que el secreto del
--    trigger no coincide con el de la Edge Function.
select id, status_code, content, created
from net._http_response
order by created desc
limit 3;

-- ─────────────────────────────────────────────────────────────
-- Fallback: si el DO block aborto porque no encontro el secreto,
-- pegar el valor de Edge Functions -> Secrets -> WEBHOOK_SECRET.
-- ─────────────────────────────────────────────────────────────
-- select cron.schedule(
--   'digest-clicks-diario',
--   '0 12 * * *',
--   $cron$
--     SELECT net.http_post(
--       url     := 'https://yuwfkdehaowkselkhtck.supabase.co/functions/v1/digest-clicks',
--       headers := jsonb_build_object(
--                    'Content-Type',  'application/json',
--                    'Authorization', 'Bearer <WEBHOOK_SECRET>'
--                  ),
--       body    := '{}'::jsonb
--     );
--   $cron$
-- );
