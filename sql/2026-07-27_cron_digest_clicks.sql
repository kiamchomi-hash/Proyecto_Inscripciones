-- Programa el digest diario de clicks, que nunca llego a correr.
--
-- Por que fallo: el bloque del cron en sql/2026-07-22_clicks_carreras.sql pedia
-- reemplazar <WEBHOOK_SECRET> a mano antes de ejecutarlo. Nunca se ejecuto, asi
-- que cron.job quedo vacio y la Edge Function digest-clicks nunca se invoco.
--
-- ACTUALIZADO EL 28/08/2026: el secreto sale del Vault, no de pg_proc.
--
-- Este script sacaba el valor del cuerpo de notify_edge_function con un
-- regexp_match sobre prosrc, y lo pegaba con format() adentro del `command` del
-- job. O sea que dejaba una tercera copia del secreto en cron.job, ademas de
-- las dos que ya estaban en pg_proc. Las tres se eliminaron: ahora el job lee
-- vault.decrypted_secrets en cada corrida, asi que rotar el secreto no obliga a
-- reprogramarlo. Ver sql/2026-08-28_secretos_al_vault.sql.
--
-- Correr en el SQL Editor del dashboard de Supabase. Es idempotente y
-- reaplicarlo no deshace nada.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $do$
BEGIN
  -- Se chequea antes de programar y no adentro del job: un job que corre a las
  -- 9 y da 401 no lo mira nadie, y este error se ve al pegar el script.
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'WEBHOOK_SECRET') THEN
    RAISE EXCEPTION 'Falta WEBHOOK_SECRET en el Vault. Cargarlo primero con el valor de Edge Functions -> Secrets: SELECT vault.create_secret(''<valor>'', ''WEBHOOK_SECRET'');';
  END IF;

  -- Idempotente: si el job ya existe, lo reemplaza.
  PERFORM cron.unschedule('digest-clicks-diario')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'digest-clicks-diario');

  -- 12:00 UTC = 09:00 en Buenos Aires.
  PERFORM cron.schedule(
    'digest-clicks-diario',
    '0 12 * * *',
    $cron$
      SELECT net.http_post(
        url     := 'https://yuwfkdehaowkselkhtck.supabase.co/functions/v1/digest-clicks',
        headers := jsonb_build_object(
                     'Content-Type',  'application/json',
                     'Authorization', 'Bearer ' || (
                       SELECT decrypted_secret FROM vault.decrypted_secrets
                       WHERE name = 'WEBHOOK_SECRET'
                     )
                   ),
        body    := '{}'::jsonb
      );
    $cron$
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
  headers := jsonb_build_object(
               'Content-Type',  'application/json',
               'Authorization', 'Bearer ' || (
                 select decrypted_secret from vault.decrypted_secrets
                 where name = 'WEBHOOK_SECRET'
               )
             ),
  body    := '{}'::jsonb
);

-- 3. Ver como respondio. Esperado: 200. Un 401 significa que el valor del Vault
--    no es el que valida la Edge Function; revisar cual de los dos quedo viejo.
select id, status_code, content, created
from net._http_response
order by created desc
limit 3;

-- ─────────────────────────────────────────────────────────────
-- Si el DO block aborto porque el secreto no esta en el Vault
-- ─────────────────────────────────────────────────────────────
--
-- Cargarlo con el valor de Edge Functions -> Secrets -> WEBHOOK_SECRET y
-- volver a correr el archivo entero. El fallback viejo, que programaba el job
-- con el secreto pegado a mano, se saco: era la tercera copia del valor en la
-- base y es lo que este archivo dejo de hacer el 28/08/2026.
--
--   select vault.create_secret('<valor>', 'WEBHOOK_SECRET');
