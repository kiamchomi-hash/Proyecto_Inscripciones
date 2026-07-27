-- Despublica las 58 novedades de relleno.
--
-- Contexto: se cargaron para probar la feature, no son historial real del CAU.
-- Medido en Search Console el 27/07: de una muestra de 10 URLs, 5 estaban
-- indexadas y el articulo con mejor perfil junto 2 impresiones y 0 clics en 90
-- dias. Son avisos institucionales ("cierre administrativo por fiestas") que
-- nadie busca, y ademas inventan hechos del CAU que no ocurrieron.
--
-- Con publicada = false alcanza, no hace falta tocar codigo:
--   - app/novedades/articulo/[slug]/page.tsx filtra por publicada y cae en notFound() -> 404
--   - generateStaticParams() deja de generarlas
--   - app/sitemap.ts las saca del sitemap
-- Google va a ir soltando las indexadas al encontrar el 404.
--
-- Correr en el SQL Editor del dashboard de Supabase.

-- 1. Antes: 58 publicadas, ninguna posterior al 2026-02-13
select count(*) as publicadas, min(fecha) as desde, max(fecha) as hasta
from public.novedades
where publicada = true;

-- 2. La poda
update public.novedades
set publicada = false
where publicada = true;
-- Esperado: UPDATE 58

-- 3. Despues: tiene que dar 0
select count(*) as publicadas
from public.novedades
where publicada = true;

-- Las filas quedan en la tabla. Cuando confirmes que no queres recuperar
-- ninguna, se pueden borrar:
--   delete from public.novedades where publicada = false;

-- Para revertir la poda:
--   update public.novedades set publicada = true;
