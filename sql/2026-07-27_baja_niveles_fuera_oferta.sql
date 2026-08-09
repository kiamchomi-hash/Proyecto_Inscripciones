-- Baja de los niveles que quedaron fuera de la oferta del sitio
--
-- Contexto: Posgrado, APLV/Extragrado, Certificaciones y Cursos ya no aparecen en
-- ningun lado. esCarreraVisible() (components/index/types.ts:111) los filtra del
-- catalogo, de las opciones del formulario, de app/sitemap.ts y de
-- generateStaticParams(), y /carreras/{slug} les devuelve 404.
--
-- Esto los da de baja tambien en la base, para que dejen de contar como oferta
-- activa. Son 19 filas de 115: quedan las 96 de la oferta vigente.
--
-- Correr en el SQL Editor del dashboard de Supabase.

-- 1. Antes: confirmar que son 19 y ver cuales
select id, nombre, nivel
from public.carreras
where activa = true
  and nivel in ('Posgrado', 'APLV - Extragrado', 'Certificación', 'Curso')
order by nivel, nombre;

-- 2. La baja
update public.carreras
set activa = false
where activa = true
  and nivel in ('Posgrado', 'APLV - Extragrado', 'Certificación', 'Curso');
-- Esperado: UPDATE 19

-- 3. Despues: el recuento por nivel tiene que dar 96 activas en seis niveles
select nivel, count(*) as activas
from public.carreras
where activa = true
group by nivel
order by nivel;
-- Esperado: Grado 36, Pregrado 25, Identidad Argentina 11, Teclab - Gestion 11,
-- Grado (CCC) 7, Teclab - Tecnologia 6  ->  total 96

-- Para revertir:
-- update public.carreras
-- set activa = true
-- where activa = false
--   and nivel in ('Posgrado', 'APLV - Extragrado', 'Certificación', 'Curso');
