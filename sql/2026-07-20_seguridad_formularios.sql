BEGIN;

CREATE TABLE IF NOT EXISTS public.form_rate_limits (
  key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0
);

ALTER TABLE public.form_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.form_rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.check_form_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_seconds integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_row public.form_rate_limits%ROWTYPE;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_key));

  SELECT * INTO current_row
  FROM public.form_rate_limits
  WHERE key = p_key;

  IF NOT FOUND OR current_row.window_started_at < now() - make_interval(secs => p_window_seconds) THEN
    INSERT INTO public.form_rate_limits (key, window_started_at, request_count)
    VALUES (p_key, now(), 1)
    ON CONFLICT (key) DO UPDATE
      SET window_started_at = EXCLUDED.window_started_at,
          request_count = 1;
    RETURN true;
  END IF;

  IF current_row.request_count >= p_max_requests THEN
    RETURN false;
  END IF;

  UPDATE public.form_rate_limits
  SET request_count = request_count + 1
  WHERE key = p_key;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.check_form_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_form_rate_limit(text, integer, integer) TO service_role;

-- Las escrituras públicas sólo pasan por /api/formularios.
REVOKE INSERT ON public.consultas FROM anon, authenticated;
REVOKE INSERT ON public.faq_preguntas FROM anon, authenticated;
REVOKE INSERT ON public.solicitudes_clase FROM anon, authenticated;

COMMIT;
