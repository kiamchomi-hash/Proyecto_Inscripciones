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
-- Si necesitás reaplicar esto, reemplazá <WEBHOOK_SECRET> por el valor de
-- Edge Functions → Secrets. Si ahí no podés verlo, el valor vigente está
-- guardado en el cuerpo de la función:
--
--     SELECT prosrc FROM pg_proc WHERE proname = 'notify_edge_function';

CREATE OR REPLACE FUNCTION public.notify_edge_function()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type',   TG_OP,
    'table',  TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', row_to_json(NEW)::jsonb
  );

  -- net.http_post encola el pedido: no bloquea el INSERT ni lo hace fallar
  -- si la Edge Function está caída. Por eso un 401 acá pasa desapercibido.
  PERFORM net.http_post(
    url     := 'https://yuwfkdehaowkselkhtck.supabase.co/functions/v1/notificar',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer <WEBHOOK_SECRET>'
               ),
    body    := payload
  );

  RETURN NEW;
END;
$fn$;

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
