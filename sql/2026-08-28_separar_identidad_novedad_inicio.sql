-- La novedad de inicio de clases comunica en conjunto Universidad Siglo 21 y
-- Teclab. Academia Identidad Argentina tiene otra lógica de comisiones y no se
-- mezcla con esas dos propuestas.

begin;

update public.novedades
set contenido = replace(
  replace(
    contenido,
    E'\r\n<p>Las <a href="/novedades/articulo/identidad-argentina-diplomaturas">diplomaturas de Identidad Argentina</a> funcionan distinto: abren comisiones nuevas casi todos los meses y, si la comisión recién arrancó, todavía se puede entrar con la cursada empezada.</p>',
    ''
  ),
  E'\r\n    <tr><td><a href="/novedades/articulo/identidad-argentina-diplomaturas">Diplomaturas de Identidad Argentina</a></td><td class="art-valor">1 a 6 meses</td></tr>',
  ''
)
where slug = 'inicio-de-clases';

commit;

select id, slug
from public.novedades
where slug = 'inicio-de-clases'
  and contenido not like '%Identidad Argentina%';
