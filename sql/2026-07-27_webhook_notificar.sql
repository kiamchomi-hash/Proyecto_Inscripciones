-- Arregla los avisos de formularios (mail + Telegram), que estaban rotos en silencio.
--
-- QUÉ PASABA
-- El endurecimiento de seguridad le agregó a la Edge Function `notificar` una
-- validación de WEBHOOK_SECRET: sin el header Authorization devuelve 401
-- (supabase/functions/notificar/index.ts:199). Pero el trigger de la base,
-- notify_edge_function(), nunca se actualizó y seguía mandando solo:
--
--     headers := jsonb_build_object('Content-Type', 'application/json')
--
-- Resultado: las consultas se guardaban bien, el trigger disparaba, y la
-- función rechazaba cada llamada con 401. Ni mail ni Telegram, y sin ningún
-- error visible desde la web. Se confirmó en net._http_response:
--
--     id 29 | status_code 401 | Unauthorized | 2026-07-27 03:04:06+00
--
-- LA CORRECCIÓN es agregarle el header. Ya está aplicada en producción
-- (2026-07-27) junto con una rotación del WEBHOOK_SECRET, para que el valor
-- del secret y el del trigger coincidan por construcción.
--
-- NO crear triggers nuevos: ya existen y funcionan.
--   consultas          -> on_consulta_insert
--   solicitudes_clase  -> on_solicitud_clase_insert
--   faq_preguntas      -> on_faq_pregunta_insert
-- Los tres llaman a notify_edge_function(). Duplicarlos duplica los avisos.
--
-- ACTUALIZADO EL 28/08/2026: el secreto ya no va escrito acá.
--
-- Este archivo decía, hasta esa fecha, que si no podías ver el valor en Edge
-- Functions → Secrets lo sacaras del cuerpo de la función con
--
--     SELECT prosrc FROM pg_proc WHERE proname = 'notify_edge_function';
--
-- Que eso funcionara era el problema: `pg_proc` lo lee cualquier rol que pueda
-- conectarse a la base, sin ningún privilegio especial. Ahora el valor vive en
-- el Vault y la función lo lee de `vault.decrypted_secrets`, que sólo alcanza
-- el dueño de la función — de ahí el `SECURITY DEFINER`, que antes no tenía, y
-- el `REVOKE` que va abajo para que nadie la llame por fuera de los triggers.
-- El detalle completo está en `sql/2026-08-28_secretos_al_vault.sql`.
--
-- Reaplicar este archivo es inocuo. Si el secreto todavía no está en el Vault
-- —una base recién hecha, donde esto corre antes que el del 28/08— el bloque
-- de abajo aborta con el mensaje que dice qué cargar. Falla fuerte a propósito:
-- lo contrario deja la función mandando un `Bearer ` vacío, que da 401 sin que
-- el INSERT que lo disparó se entere, que es exactamente el bug que este
-- archivo vino a arreglar.

DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'WEBHOOK_SECRET') THEN
    RAISE EXCEPTION 'Falta WEBHOOK_SECRET en el Vault. Cargarlo primero con el valor de Edge Functions -> Secrets: SELECT vault.create_secret(''<valor>'', ''WEBHOOK_SECRET'');';
  END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION public.notify_edge_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  payload jsonb;
  secreto text;
BEGIN
  payload := jsonb_build_object(
    'type',   TG_OP,
    'table',  TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW)::jsonb
  );

  SELECT decrypted_secret INTO secreto
  FROM vault.decrypted_secrets
  WHERE name = 'WEBHOOK_SECRET';

  IF secreto IS NULL THEN
    RAISE WARNING 'notify_edge_function: WEBHOOK_SECRET no esta en el Vault, el aviso va a dar 401';
  END IF;

  -- net.http_post encola el pedido: no bloquea el INSERT ni lo hace fallar
  -- si la Edge Function está caída. Por eso un 401 acá pasa desapercibido.
  PERFORM net.http_post(
    url     := 'https://yuwfkdehaowkselkhtck.supabase.co/functions/v1/notificar',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || coalesce(secreto, '')
               ),
    body    := payload
  );

  RETURN NEW;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.notify_edge_function() FROM public;

-- ─────────────────────────────────────────────────────────────
-- Verificación. Como los avisos fallan sin hacer ruido, este es el único
-- modo de saber que andan. Conviene repetirlo si se vuelve a tocar el
-- secret o la función.
-- ─────────────────────────────────────────────────────────────
--
--   INSERT INTO public.consultas (nombre, apellido, email, carrera)
--   VALUES ('PRUEBA', 'WEBHOOK', 'prueba@siglo21sur.com', 'Test');
--
--   SELECT id, status_code, content, created
--   FROM net._http_response ORDER BY created DESC LIMIT 3;
--
-- Esperado: status_code 200 y content {"ok":true,"telegram":true}
--   (el 01/08/2026 se sacó el envío por mail: Telegram es el único canal, y
--    por eso la función ahora responde 502 cuando ese envío falla.)
-- Si da 401, el secret del trigger no coincide con el de la Edge Function.
--
-- Y después borrá la fila de prueba:
--   DELETE FROM public.consultas WHERE nombre='PRUEBA' AND apellido='WEBHOOK';
