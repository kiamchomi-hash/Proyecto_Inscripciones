-- Verificacion de los avisos de formulario (Telegram, unico canal).
--
-- CUANDO CORRERLO: cada vez que se toque WEBHOOK_SECRET, la Edge Function
-- `notificar` o el trigger notify_edge_function(). Los avisos fallan en
-- silencio -- net.http_post encola sin bloquear, asi que el INSERT responde 201
-- aunque la notificacion se caiga. Del 20 al 27/07/2026 estuvieron rotos y la
-- web no dio ni un error.
--
-- COMO: pegar todo en el SQL Editor de Supabase y correr un PASO por vez
-- (seleccionar el bloque y Run). No se puede de una sola pasada: pg_net recien
-- despacha el pedido cuando la transaccion commitea, asi que un pg_sleep dentro
-- del mismo bloque que el INSERT espera al pedido que todavia no salio.
--
-- Prueba las TRES tablas, no solo consultas: los tres triggers llaman a la
-- misma funcion, pero es la unica forma de confirmar que los tres siguen atados.


-- ─────────────────────────────────────────────────────────────
-- PASO 1 — disparar los tres triggers
-- ─────────────────────────────────────────────────────────────

INSERT INTO public.consultas (nombre, apellido, email, carrera)
VALUES ('PRUEBA', 'WEBHOOK', 'prueba@siglo21sur.com', 'Test');

INSERT INTO public.faq_preguntas (titulo, descripcion, modo, contacto)
VALUES ('PRUEBA WEBHOOK - ignorar', 'Fila de verificacion automatica.', 'publica', 'prueba@siglo21sur.com');

INSERT INTO public.solicitudes_clase (materia_id, dias, horarios, nombre, telefono, bloqueo_semanal)
SELECT id, ARRAY['lunes'], ARRAY['18:00-19:00'], 'PRUEBA WEBHOOK', '1100000000', false
FROM public.materias
WHERE activa = true
LIMIT 1;


-- ─────────────────────────────────────────────────────────────
-- PASO 2 — esperar y mirar las respuestas
--
-- Esperado: tres filas con status_code 200 y
--   {"ok":true,"telegram":true}
--
-- 401  -> el secreto del trigger no coincide con el de la Edge Function.
--         Ver sql/2026-07-27_webhook_notificar.sql para reponer el header.
-- 502  -> la funcion corrio pero Telegram rechazo el mensaje. Revisar
--         TELEGRAM_BOT_TOKEN y TELEGRAM_CHAT_ID en los secrets.
-- 0 filas nuevas -> el trigger no disparo. Revisar el PASO 4.
-- ─────────────────────────────────────────────────────────────

SELECT pg_sleep(8);

SELECT id, status_code, content, created
FROM net._http_response
ORDER BY created DESC
LIMIT 5;


-- ─────────────────────────────────────────────────────────────
-- PASO 3 — limpiar las filas de prueba
-- ─────────────────────────────────────────────────────────────

DELETE FROM public.consultas
WHERE nombre = 'PRUEBA' AND apellido = 'WEBHOOK';

DELETE FROM public.faq_preguntas
WHERE titulo = 'PRUEBA WEBHOOK - ignorar';

DELETE FROM public.solicitudes_clase
WHERE nombre = 'PRUEBA WEBHOOK';


-- ─────────────────────────────────────────────────────────────
-- PASO 4 (solo si algo no disparo) — que triggers hay realmente
--
-- Esperado: exactamente tres filas, una por tabla. Si aparece alguna de mas,
-- hay un trigger duplicado y los avisos se mandan repetidos: borrar el sobrante,
-- NO crear triggers nuevos.
-- ─────────────────────────────────────────────────────────────

SELECT c.relname AS tabla, t.tgname AS trigger, p.proname AS funcion
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND c.relname IN ('consultas', 'faq_preguntas', 'solicitudes_clase')
ORDER BY c.relname;
