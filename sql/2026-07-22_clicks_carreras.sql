-- Conteo diario de aperturas de tarjetas + digest de las 20hs por Telegram.
-- Guarda sólo agregados: ni IP, ni sesión, ni nada que identifique a la persona.
BEGIN;

CREATE TABLE IF NOT EXISTS public.career_clicks (
  fecha   date    NOT NULL DEFAULT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date,
  carrera text    NOT NULL,
  clicks  integer NOT NULL DEFAULT 0,
  PRIMARY KEY (fecha, carrera)
);

ALTER TABLE public.career_clicks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.career_clicks FROM anon, authenticated;

-- Incrementa el contador del día. Sólo la alcanza el service_role desde /api/track-click.
CREATE OR REPLACE FUNCTION public.registrar_click_carrera(p_carrera text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.career_clicks (fecha, carrera, clicks)
  VALUES ((now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date, p_carrera, 1)
  ON CONFLICT (fecha, carrera)
  DO UPDATE SET clicks = public.career_clicks.clicks + 1;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_click_carrera(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_click_carrera(text) TO service_role;

COMMIT;

-- ─────────────────────────────────────────────────────────────
-- Cron del digest: 23:00 UTC = 20:00 en Buenos Aires.
-- Reemplazá <WEBHOOK_SECRET> por el mismo valor que está en
-- Edge Functions → Secrets antes de ejecutar este bloque.
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('digest-clicks-diario')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'digest-clicks-diario');

SELECT cron.schedule(
  'digest-clicks-diario',
  '0 23 * * *',
  $cron$
    SELECT net.http_post(
      url     := 'https://yuwfkdehaowkselkhtck.supabase.co/functions/v1/digest-clicks',
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'Authorization', 'Bearer <WEBHOOK_SECRET>'
                 ),
      body    := '{}'::jsonb
    );
  $cron$
);
