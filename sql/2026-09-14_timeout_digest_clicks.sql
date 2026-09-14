-- Amplía el timeout del cron existente del digest diario de 5 a 15 segundos.
-- El 14/09/2026 la Edge Function superó los 5 s y pg_net guardó un timeout.
-- Se reemplaza el job con el mismo nombre y horario: no se crea un segundo cron.

DO $do$
BEGIN
  PERFORM cron.unschedule('digest-clicks-diario')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'digest-clicks-diario');

  PERFORM cron.schedule(
    'digest-clicks-diario',
    '0 12 * * *',
    $cron$
      SELECT net.http_post(
        url     := 'https://yuwfkdehaowkselkhtck.supabase.co/functions/v1/digest-clicks',
        headers := jsonb_build_object(
                     'Content-Type', 'application/json',
                     'Authorization', 'Bearer ' || (
                       SELECT decrypted_secret FROM vault.decrypted_secrets
                       WHERE name = 'WEBHOOK_SECRET'
                     )
                   ),
        body    := '{}'::jsonb,
        timeout_milliseconds := 15000
      );
    $cron$
  );
END
$do$;

SELECT jobname, schedule, active,
       command LIKE '%timeout_milliseconds := 15000%' AS timeout_actualizado
FROM cron.job
WHERE jobname = 'digest-clicks-diario';
