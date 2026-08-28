-- Revalidacion on-demand: la base le avisa a Next cuando cambia el contenido.
--
-- POR QUE
-- Cada pagina cachea lo suyo: la home una hora, las fichas de carrera y las
-- novedades veinticuatro, y /faq y /clases-apoyo/<materia> no declaran
-- revalidate, o sea que se congelan hasta el proximo deploy. Cargar una carrera
-- y tener que pushear cualquier cosa para verla publicada era el sintoma.
-- Con esto, un UPDATE en el SQL Editor se ve en el sitio a los pocos segundos.
--
-- NO confundir con notify_edge_function(), que es otra cosa: aquel avisa por
-- Telegram cuando entra un formulario (consultas, solicitudes_clase,
-- faq_preguntas) y estos rehacen paginas cuando cambia el contenido. Son
-- triggers distintos, con nombres distintos, y faq_preguntas tiene uno de cada
-- familia: on_faq_pregunta_insert avisa, on_faq_preguntas_revalidar rehace.
--
-- SECURITY DEFINER a proposito: el panel admin escribe en `materias` con el rol
-- `authenticated`, que no necesariamente puede usar el schema net. Sin esto, un
-- profesor bloqueando un horario se comeria un error y el UPDATE fallaria.
--
-- El secreto NO se pega aca. Desde el 28/08/2026 vive en el Vault y la funcion
-- lo lee de vault.decrypted_secrets: tenerlo escrito en el cuerpo lo dejaba a
-- la vista de cualquier rol que pudiera conectarse, porque pg_proc es legible
-- sin ningun privilegio especial. El detalle esta en
-- sql/2026-08-28_secretos_al_vault.sql.
--
-- Por eso este archivo se puede reaplicar sin deshacer nada. Si el secreto
-- todavia no esta en el Vault -- una base recien hecha, donde este archivo
-- corre antes que el del 28/08 --, el bloque de abajo aborta con el mensaje
-- que dice que cargarlo primero. Falla fuerte a proposito: la alternativa era
-- dejar el trigger mandando un 'Bearer ' vacio, que da 401 sin que el UPDATE
-- que lo disparo se entere de nada.

DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'REVALIDATE_SECRET') THEN
    RAISE EXCEPTION 'Falta REVALIDATE_SECRET en el Vault. Cargarlo primero con el valor que esta en Vercel (Settings -> Environment Variables): SELECT vault.create_secret(''<valor>'', ''REVALIDATE_SECRET'');';
  END IF;
END
$guard$;

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

-- Un trigger por tabla de contenido. DROP IF EXISTS primero para que reaplicar
-- el archivo no duplique nada.
DROP TRIGGER IF EXISTS on_carreras_revalidar ON public.carreras;
CREATE TRIGGER on_carreras_revalidar
AFTER INSERT OR UPDATE OR DELETE ON public.carreras
FOR EACH ROW EXECUTE FUNCTION public.notify_revalidar();

DROP TRIGGER IF EXISTS on_novedades_revalidar ON public.novedades;
CREATE TRIGGER on_novedades_revalidar
AFTER INSERT OR UPDATE OR DELETE ON public.novedades
FOR EACH ROW EXECUTE FUNCTION public.notify_revalidar();

DROP TRIGGER IF EXISTS on_materias_revalidar ON public.materias;
CREATE TRIGGER on_materias_revalidar
AFTER INSERT OR UPDATE OR DELETE ON public.materias
FOR EACH ROW EXECUTE FUNCTION public.notify_revalidar();

DROP TRIGGER IF EXISTS on_faq_preguntas_revalidar ON public.faq_preguntas;
CREATE TRIGGER on_faq_preguntas_revalidar
AFTER INSERT OR UPDATE OR DELETE ON public.faq_preguntas
FOR EACH ROW EXECUTE FUNCTION public.notify_revalidar();

-- ─────────────────────────────────────────────────────────────
-- Verificacion. net.http_post encola: el pedido recien sale cuando la
-- transaccion commitea, asi que el UPDATE y el SELECT van por separado.
-- ─────────────────────────────────────────────────────────────
--
-- Va sobre `carreras` y no sobre `faq_preguntas` porque esa tabla esta vacia:
-- un UPDATE que toca cero filas no dispara nada y parece que fallo.
--
--   UPDATE public.carreras SET orden = orden WHERE id = (
--     SELECT id FROM public.carreras WHERE activa ORDER BY id LIMIT 1
--   );
--
--   SELECT id, status_code, content, created
--   FROM net._http_response ORDER BY created DESC LIMIT 3;
--
-- Esperado: status_code 200 y content {"ok":true,"rutas":["/",...]}.
--   401 -> el secreto del trigger no es el que tiene Vercel.
--   503 -> falta REVALIDATE_SECRET en Vercel (o el deploy es anterior).
--   400 -> la tabla no esta mapeada en app/api/revalidar/route.ts.
--   403 -> lo esta frenando el firewall de Vercel; habilitar el pedido ahi.
