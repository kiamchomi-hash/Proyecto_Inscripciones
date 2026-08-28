-- Fase 1: saca los secretos de webhook del cuerpo de las funciones y los pasa
-- al Vault. NO rota nada: el valor que viaja por la red es el mismo antes y
-- despues, asi que no hay ventana en la que los avisos respondan 401.
--
-- QUE PASABA
-- notify_revalidar() y notify_edge_function() llevaban el token escrito como
-- literal adentro del jsonb_build_object del header, y el job
-- 'digest-clicks-diario' lo tenia pegado en su `command` (el format() de
-- sql/2026-07-27_cron_digest_clicks.sql lo mete al programarlo).
--
-- pg_proc es legible por cualquier rol que pueda conectarse a la base: no hace
-- falta ningun privilegio especial para hacer
--
--     SELECT prosrc FROM pg_proc WHERE proname = 'notify_edge_function';
--
-- asi que REVALIDATE_SECRET (32 caracteres) y WEBHOOK_SECRET (64) quedaban a la
-- vista de cualquier credencial de conexion, incluido cau_editor, que se creo
-- justamente para no tener alcance de mas. cron.job es mas cerrado (cau_editor
-- se come un 'permission denied for schema cron'), pero guarda el mismo valor.
--
-- No expone datos de leads: anon y authenticated no tienen LOGIN, asi que desde
-- el navegador no se llega. Lo que habilita es forzar revalidaciones, que gasta
-- ISR Writes en silencio, y falsificar avisos de Telegram.
--
-- COMO QUEDA
-- Los dos secretos pasan a vault.secrets, que guarda cifrado y solo se descifra
-- leyendo la vista vault.decrypted_secrets. Esa vista la alcanza el dueño de la
-- funcion, no quien la dispara, y por eso las dos funciones tienen que ser
-- SECURITY DEFINER (notify_revalidar ya lo era; notify_edge_function pasa a
-- serlo aca, con su REVOKE al lado).
--
-- El valor no se pega a mano: se lee del literal que todavia esta en pg_proc,
-- que es el vigente. Si no lo encuentra, aborta en vez de dejar el trigger
-- mandando un 'Bearer ' vacio.
--
-- Correr entero en el SQL Editor del dashboard. Es idempotente.

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- ─────────────────────────────────────────────────────────────
-- 1. Los valores vigentes, del literal viejo al Vault
-- ─────────────────────────────────────────────────────────────

DO $do$
DECLARE
  v_nombre text;
  v_origen text;
  v_valor  text;
  v_id     uuid;
BEGIN
  FOREACH v_nombre IN ARRAY ARRAY['REVALIDATE_SECRET', 'WEBHOOK_SECRET'] LOOP
    v_origen := CASE v_nombre
                  WHEN 'REVALIDATE_SECRET' THEN 'notify_revalidar'
                  ELSE 'notify_edge_function'
                END;

    SELECT (regexp_match(prosrc, 'Bearer\s+([^''"\s]+)'))[1]
    INTO v_valor
    FROM pg_proc
    WHERE proname = v_origen
    LIMIT 1;

    -- Si la funcion ya fue migrada, el literal no esta y el valor ya vive en el
    -- Vault: reaplicar el archivo no tiene que romper nada.
    IF v_valor IS NULL OR v_valor = '' THEN
      IF EXISTS (SELECT 1 FROM vault.secrets WHERE name = v_nombre) THEN
        RAISE NOTICE '% ya estaba en el Vault, no habia literal que migrar', v_nombre;
        CONTINUE;
      END IF;
      RAISE EXCEPTION 'No se pudo leer % del literal de %() ni encontrarlo en el Vault. Pegarlo a mano con vault.create_secret().', v_nombre, v_origen;
    END IF;

    SELECT id INTO v_id FROM vault.secrets WHERE name = v_nombre;

    IF v_id IS NULL THEN
      PERFORM vault.create_secret(
        v_valor,
        v_nombre,
        format('Bearer que manda la base. Lo consume %s. Rotarlo obliga a tocar tambien el dashboard que lo valida.',
               CASE v_nombre
                 WHEN 'REVALIDATE_SECRET' THEN 'POST /api/revalidar en Vercel'
                 ELSE 'las Edge Functions notificar y digest-clicks'
               END)
      );
      RAISE NOTICE '% creado en el Vault', v_nombre;
    ELSE
      PERFORM vault.update_secret(v_id, v_valor);
      RAISE NOTICE '% actualizado en el Vault', v_nombre;
    END IF;
  END LOOP;
END
$do$;

-- ─────────────────────────────────────────────────────────────
-- 2. notify_revalidar(): el literal sale, entra la lectura del Vault
-- ─────────────────────────────────────────────────────────────
--
-- SECURITY DEFINER ya venia de antes por otro motivo (el panel admin escribe en
-- `materias` con el rol authenticated, que no necesariamente puede usar el
-- schema net). Ahora ademas es lo que habilita leer el Vault.
--
-- search_path queda en public, asi que vault.decrypted_secrets va calificado.

CREATE OR REPLACE FUNCTION public.notify_revalidar()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  fila    jsonb;
  antes   jsonb;
  secreto text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    fila := to_jsonb(OLD);
  ELSE
    fila := to_jsonb(NEW);
  END IF;

  IF TG_OP = 'UPDATE' THEN
    antes := to_jsonb(OLD);
  END IF;

  SELECT decrypted_secret INTO secreto
  FROM vault.decrypted_secrets
  WHERE name = 'REVALIDATE_SECRET';

  -- WARNING y no EXCEPTION: que falte el secreto tiene que dejar la pagina
  -- vieja, no voltear el UPDATE que la publica.
  IF secreto IS NULL THEN
    RAISE WARNING 'notify_revalidar: REVALIDATE_SECRET no esta en el Vault, la revalidacion va a dar 401';
  END IF;

  -- Solo los campos con los que /api/revalidar arma las rutas. Mandar la fila
  -- entera haria viajar los slides de cada carrera por HTTP al pedo.
  PERFORM net.http_post(
    url     := 'https://www.siglo21sur.com/api/revalidar',
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'Authorization', 'Bearer ' || coalesce(secreto, '')
               ),
    body    := jsonb_build_object(
                 'tabla',    TG_TABLE_NAME,
                 'accion',   TG_OP,
                 'slug',     fila->>'slug',
                 'nombre',   fila->>'nombre',
                 'prefix',   fila->>'prefix',
                 'nivel',    fila->>'nivel',
                 'anterior', CASE WHEN antes IS NULL THEN NULL ELSE jsonb_build_object(
                               'slug',   antes->>'slug',
                               'nombre', antes->>'nombre',
                               'prefix', antes->>'prefix'
                             ) END
               )
  );

  RETURN NULL;  -- AFTER trigger: el valor de retorno se ignora.
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.notify_revalidar() FROM public;

-- ─────────────────────────────────────────────────────────────
-- 3. notify_edge_function(): idem, y ademas pasa a SECURITY DEFINER
-- ─────────────────────────────────────────────────────────────
--
-- Venia sin SECURITY DEFINER, o sea que corria con el rol que hace el INSERT
-- (service_role en los formularios publicos). Ese rol no llega al Vault, asi
-- que la funcion tiene que definirse con el privilegio de su dueño. El REVOKE
-- de abajo es lo que impide que alguien la llame por fuera de los triggers.

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
  -- si la Edge Function esta caida. Por eso un 401 aca pasa desapercibido.
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
-- 4. El job del digest, reprogramado sin el secreto adentro
-- ─────────────────────────────────────────────────────────────
--
-- El command viejo tenia el token pegado por el format() del script que lo
-- programo. Este lo lee del Vault en cada corrida, asi que rotar no obliga a
-- reprogramar el job.

DO $do$
BEGIN
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

-- ─────────────────────────────────────────────────────────────
-- 5. Verificacion de que no quedo ningun literal
-- ─────────────────────────────────────────────────────────────
--
-- Las tres filas tienen que dar tiene_literal = false. Si alguna da true, ese
-- lugar no se migro y sigue expuesto.

SELECT 'pg_proc: ' || proname                    AS lugar,
       (prosrc ~ 'Bearer\s+[A-Za-z0-9_-]{8,}')   AS tiene_literal
FROM pg_proc
WHERE proname IN ('notify_revalidar', 'notify_edge_function')
UNION ALL
SELECT 'cron.job: ' || jobname,
       (command ~ 'Bearer\s+[A-Za-z0-9_-]{8,}')
FROM cron.job
WHERE jobname = 'digest-clicks-diario'
ORDER BY lugar;

-- Y los dos secretos tienen que estar en el Vault, con largo 32 y 64.
SELECT s.name,
       length(d.decrypted_secret) AS largo,
       s.created_at,
       s.updated_at
FROM vault.secrets s
JOIN vault.decrypted_secrets d ON d.id = s.id
WHERE s.name IN ('REVALIDATE_SECRET', 'WEBHOOK_SECRET')
ORDER BY s.name;

-- ─────────────────────────────────────────────────────────────
-- 6. Que los tres caminos siguen andando (mismo valor, tiene que dar 200)
-- ─────────────────────────────────────────────────────────────
--
-- net.http_post encola: el pedido recien sale cuando la transaccion commitea,
-- asi que cada disparo y su SELECT van por separado.
--
-- a) Revalidacion. Sobre carreras y no sobre faq_preguntas, que esta vacia:
--    un UPDATE que toca cero filas no dispara nada y parece que fallo.
--
--   UPDATE public.carreras SET orden = orden WHERE id = (
--     SELECT id FROM public.carreras WHERE activa ORDER BY id LIMIT 1
--   );
--
--   SELECT id, status_code, content, created
--   FROM net._http_response ORDER BY created DESC LIMIT 3;
--
--   Esperado: 200 y {"ok":true,"rutas":[...]}.
--
-- b) Aviso de formulario. Deja una fila real, se borra despues.
--
--   INSERT INTO public.consultas (nombre, apellido, email, carrera)
--   VALUES ('PRUEBA', 'VAULT', 'prueba@siglo21sur.com', 'Test');
--
--   SELECT id, status_code, content, created
--   FROM net._http_response ORDER BY created DESC LIMIT 3;
--
--   Esperado: 200 y {"ok":true,"telegram":true}.
--   La fila de prueba se borra desde local, sin volver al dashboard:
--   npm run db "DELETE FROM consultas WHERE nombre='PRUEBA' AND apellido='VAULT'"
--
-- c) Digest. Dispara el job a mano sin esperar a las 9.
--
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
--   Esperado: 200. Un 401 en cualquiera de los tres significa que el valor que
--   quedo en el Vault no es el que valida el consumidor.
--
-- La Fase 2 (rotar los dos, porque estuvieron legibles) esta en
-- sql/2026-08-28_rotar_secretos.sql.
