-- Fase 2: rota los dos secretos de webhook.
--
-- Va DESPUES de sql/2026-08-28_secretos_al_vault.sql. Ese saco los literales de
-- pg_proc y del cron; este cambia los valores, que hay que cambiar igual porque
-- estuvieron legibles para cualquier credencial de conexion mientras vivieron
-- ahi adentro. Sacarlos de la vista no deshace el que ya los leyo.
--
-- La Fase 1 es lo que hace esto barato: la base tiene ahora el secreto en UN
-- solo lugar (vault.secrets), asi que rotar es este UPDATE de una linea y no
-- reescribir dos funciones y reprogramar un job.
--
-- EL ORDEN IMPORTA, y es distinto para cada uno.
--
-- El header lo manda la base y lo valida el consumidor: mientras uno tenga el
-- valor nuevo y el otro el viejo, ese camino responde 401. La ventana no se
-- puede eliminar, solo achicar, asi que el orden es el que hace que la ventana
-- caiga donde menos duele y el paso lento vaya primero.
--
--   REVALIDATE_SECRET
--   1. Vercel -> Settings -> Environment Variables -> REVALIDATE_SECRET = nuevo.
--   2. Redeploy. Un cambio de env var no toma efecto sin uno (el bundle lee la
--      variable en build). Esto es lo lento: son un par de minutos.
--   3. Cuando el deploy este Ready, correr el bloque 1 de abajo.
--   Durante la ventana, una carrera que se edite queda con la pagina vieja
--   hasta que venza su revalidate. Se arregla solo, y si hay apuro se fuerza
--   con un POST a /api/revalidar con tabla 'todo'.
--
--   WEBHOOK_SECRET
--   1. npx supabase secrets set WEBHOOK_SECRET=<nuevo>
--      (o Dashboard -> Edge Functions -> Secrets). Toma efecto en la proxima
--      invocacion, sin redeploy.
--   2. Correr el bloque 2 de abajo, seguido.
--   Durante la ventana, un formulario que entre se guarda igual pero no manda
--   el aviso de Telegram: el INSERT responde 201 aunque net.http_post cobre un
--   401. O sea que el lead no se pierde, pero nadie se entera hasta que se mire
--   la tabla. Hacerlo en un rato de poco trafico y verificar al toque.
--
-- Los valores nuevos NO van escritos en este archivo: el repo es publico.
-- Generarlos con herramientas/generar-secretos.mjs, que ademas deja el SQL
-- listo para pegar.

-- ─────────────────────────────────────────────────────────────
-- Bloque 1: REVALIDATE_SECRET (despues del redeploy de Vercel)
-- ─────────────────────────────────────────────────────────────

SELECT vault.update_secret(
  (SELECT id FROM vault.secrets WHERE name = 'REVALIDATE_SECRET'),
  '<NUEVO_REVALIDATE_SECRET>'
);

-- Verificar en la misma corrida. Esperado: 200 y {"ok":true,"rutas":[...]}.
UPDATE public.carreras SET orden = orden WHERE id = (
  SELECT id FROM public.carreras WHERE activa ORDER BY id LIMIT 1
);

-- (en un SELECT aparte, que net.http_post recien despacha al commitear)
--   SELECT id, status_code, content, created
--   FROM net._http_response ORDER BY created DESC LIMIT 3;

-- ─────────────────────────────────────────────────────────────
-- Bloque 2: WEBHOOK_SECRET (despues de supabase secrets set)
-- ─────────────────────────────────────────────────────────────

SELECT vault.update_secret(
  (SELECT id FROM vault.secrets WHERE name = 'WEBHOOK_SECRET'),
  '<NUEVO_WEBHOOK_SECRET>'
);

-- Verificar los dos consumidores, que son dos Edge Functions distintas y las
-- dos validan contra el mismo WEBHOOK_SECRET.
--
-- a) notificar
--   INSERT INTO public.consultas (nombre, apellido, email, carrera)
--   VALUES ('PRUEBA', 'ROTACION', 'prueba@siglo21sur.com', 'Test');
--
--   Esperado: 200 y {"ok":true,"telegram":true}. Despues, desde local:
--   npm run db "DELETE FROM consultas WHERE nombre='PRUEBA' AND apellido='ROTACION'"
--
-- b) digest-clicks
--   SELECT net.http_post(
--     url     := 'https://yuwfkdehaowkselkhtck.supabase.co/functions/v1/digest-clicks',
--     headers := jsonb_build_object(
--                  'Content-Type',  'application/json',
--                  'Authorization', 'Bearer ' || (
--                    SELECT decrypted_secret FROM vault.decrypted_secrets
--                    WHERE name = 'WEBHOOK_SECRET'
--                  )
--                ),
--     body    := '{}'::jsonb
--   );
--
--   Esperado: 200. Si da 401, el valor del Vault y el del secret de Edge
--   Functions no coinciden: revisar cual de los dos quedo sin actualizar.
--
-- ─────────────────────────────────────────────────────────────
-- Lo que NO hay que olvidarse
-- ─────────────────────────────────────────────────────────────
--
-- El .env.local de las dos maquinas puede tener REVALIDATE_SECRET pegado de
-- antes. No lo usa nada en local (el trigger vive en la base), pero si quedo
-- ahi el valor viejo conviene actualizarlo o borrarlo para no confundirse en
-- el proximo diagnostico. WEBHOOK_SECRET no va nunca en .env.local: lo
-- consumen solo las Edge Functions.
--
-- alerta-firewall NO se toca: valida VERCEL_WEBHOOK_SECRET, que es otro
-- secreto, lo emite Vercel al crear el webhook y nunca estuvo en la base.
