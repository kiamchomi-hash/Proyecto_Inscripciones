-- Newsletter: cuándo se le mandó el último mail a cada suscripción.
-- El cron /api/newsletter manda a las suscripciones activas cuyo último envío
-- (o, si nunca se les mandó, el consentimiento) tiene 7 días o más, y recién
-- con el envío confirmado actualiza esta columna.
ALTER TABLE public.suscripciones_newsletter
  ADD COLUMN IF NOT EXISTS ultimo_envio_at timestamptz;
