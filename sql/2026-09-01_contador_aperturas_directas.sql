-- Separa las aperturas de la ficha pública de los clics que abren el modal.
-- Correr a mano en el SQL Editor de Supabase antes de probar la funcionalidad.
BEGIN;

ALTER TABLE public.career_clicks
  ADD COLUMN IF NOT EXISTS origen text NOT NULL DEFAULT 'modal';

ALTER TABLE public.career_clicks DROP CONSTRAINT IF EXISTS career_clicks_pkey;
ALTER TABLE public.career_clicks
  ADD CONSTRAINT career_clicks_pkey PRIMARY KEY (fecha, carrera, origen);

ALTER TABLE public.career_clicks DROP CONSTRAINT IF EXISTS career_clicks_origen_check;
ALTER TABLE public.career_clicks
  ADD CONSTRAINT career_clicks_origen_check CHECK (origen IN ('modal', 'directa'));

CREATE OR REPLACE FUNCTION public.registrar_click_carrera(
  p_carrera text,
  p_origen text DEFAULT 'modal'
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.career_clicks (fecha, carrera, clicks, origen)
  VALUES ((now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date, p_carrera, 1, p_origen)
  ON CONFLICT (fecha, carrera, origen)
  DO UPDATE SET clicks = public.career_clicks.clicks + 1;
END;
$$;

DROP FUNCTION IF EXISTS public.registrar_click_carrera(text);
REVOKE ALL ON FUNCTION public.registrar_click_carrera(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_click_carrera(text, text) TO service_role;

COMMIT;
