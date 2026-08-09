-- Novedades: cargar imagen_url en los 10 articulos publicados.
--
-- Contexto: las 10 novedades estaban con imagen_url NULL, asi que las tarjetas del
-- listado caian en el placeholder y al compartir cualquier articulo no salia miniatura.
-- `npm run auditar` las venia marcando como problema.
--
-- Estas rutas apuntan a la foto LIMPIA (sin texto encima), que es la que usan la
-- tarjeta del listado y la cabecera del articulo. La imagen para compartir es otra
-- —lleva el titulo compuesto— y no se guarda en la base: la sirve generateMetadata
-- desde /imagenes/og/<slug>.jpg. Las dos las genera `node herramientas/generar-og.mjs`.
--
-- Correr en el SQL Editor de Supabase. Desde la maquina local no hay credencial de
-- escritura: la service role esta marcada Sensitive en Vercel.

begin;

update public.novedades set imagen_url = '/imagenes/novedades/segundo-semestre-2026-inicio-3-de-agosto.jpg'
  where slug = 'segundo-semestre-2026-inicio-3-de-agosto';

update public.novedades set imagen_url = '/imagenes/novedades/documentacion-legajo-inscripcion.jpg'
  where slug = 'documentacion-legajo-inscripcion';

update public.novedades set imagen_url = '/imagenes/novedades/que-es-el-cau-villa-lugano.jpg'
  where slug = 'que-es-el-cau-villa-lugano';

update public.novedades set imagen_url = '/imagenes/novedades/clases-de-apoyo-como-reservar-turno.jpg'
  where slug = 'clases-de-apoyo-como-reservar-turno';

update public.novedades set imagen_url = '/imagenes/novedades/carreras-de-grado-a-distancia.jpg'
  where slug = 'carreras-de-grado-a-distancia';

update public.novedades set imagen_url = '/imagenes/novedades/tecnicaturas-pregrado-dos-tres-anos.jpg'
  where slug = 'tecnicaturas-pregrado-dos-tres-anos';

update public.novedades set imagen_url = '/imagenes/novedades/teclab-tecnicaturas-online.jpg'
  where slug = 'teclab-tecnicaturas-online';

update public.novedades set imagen_url = '/imagenes/novedades/identidad-argentina-diplomaturas.jpg'
  where slug = 'identidad-argentina-diplomaturas';

update public.novedades set imagen_url = '/imagenes/novedades/ivu-universitario-21-inicio-cursada.jpg'
  where slug = 'ivu-universitario-21-inicio-cursada';

update public.novedades set imagen_url = '/imagenes/novedades/donde-queda-el-cau-villa-lugano.jpg'
  where slug = 'donde-queda-el-cau-villa-lugano';

-- Control: tienen que salir 10 filas, todas con imagen_url cargada y ninguna NULL.
select
  count(*) filter (where imagen_url is not null) as con_imagen,
  count(*) filter (where imagen_url is null)     as sin_imagen
from public.novedades
where publicada = true;

commit;

-- Ojo con el orden de publicacion: los archivos tienen que estar en produccion antes
-- de correr esto. Si se corre primero el UPDATE, las tarjetas apuntan a un 404 hasta
-- que termine el deploy.
