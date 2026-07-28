-- Corrige la lista de Teclab Gestion en la novedad 'teclab-tecnicaturas-online'.
--
-- Problema: el encabezado decia "Teclab Gestion (11 carreras)" y la lista tenia
-- 6 items, porque agrupaba carreras que en la tabla `carreras` son filas
-- separadas ("Marketing Digital e Inbound Marketing" son dos, "Gestion
-- Contable, Seguros y Relaciones Laborales" son tres). La cuenta cerraba
-- -2+2+3+2+1+1 = 11- pero el lector veia 6 items bajo un titulo que decia 11.
--
-- Los 11 nombres salen de una consulta a `carreras` del 27/07/2026:
--   select prefix, nombre from public.carreras
--   where nivel = 'Teclab - Gestion' order by nombre;
-- Se usa la columna `nombre` tal cual, que ya incluye "Tecnicatura Superior en"
-- -por eso carreraFullName() en components/index/types.ts la devuelve sin
-- anteponer el prefix.
--
-- El bloque de Teclab Tecnologia no se toca: sus 6 items ya coincidian.
--
-- Correr en el SQL Editor del dashboard de Supabase.

begin;

update public.novedades
set contenido = $html$
<p>Además de la oferta de la universidad, desde el CAU podés inscribirte en las tecnicaturas del <strong>Instituto Técnico Superior Teclab</strong>. Son <strong>17 carreras</strong>, todas de <strong>2 años</strong>, divididas en dos familias.</p>

<h2>Teclab Tecnología (6 carreras)</h2>
<ul>
  <li>Tecnicatura Superior en Programación</li>
  <li>Tecnicatura Superior en Data Science</li>
  <li>Tecnicatura Superior en Cloud Administration</li>
  <li>Tecnicatura Superior en Seguridad Informática</li>
  <li>Tecnicatura Superior en Redes Informáticas</li>
  <li>Tecnicatura Superior en Quality Assurance</li>
</ul>

<h2>Teclab Gestión (11 carreras)</h2>
<ul>
  <li>Tecnicatura Superior en Marketing Digital</li>
  <li>Tecnicatura Superior en Inbound Marketing</li>
  <li>Tecnicatura Superior en Customer Experience</li>
  <li>Tecnicatura Superior en Venta Directa</li>
  <li>Tecnicatura Superior en Gestión Contable</li>
  <li>Tecnicatura Superior en Seguros</li>
  <li>Tecnicatura Superior en Relaciones Laborales</li>
  <li>Tecnicatura Superior en Gestión Hotelera</li>
  <li>Tecnicatura Superior en Planificación y Organización de Eventos</li>
  <li>Tecnicatura Superior en Gestión Agraria</li>
  <li>Tecnicatura Superior en Periodismo y Nuevas Tecnologías</li>
</ul>

<h2>Para quién es</h2>
<p>El perfil de Teclab es técnico y corto: dos años, contenido aplicado y carreras armadas junto con empresas del rubro. Si buscás entrar rápido al mercado en un puesto técnico —desarrollo, datos, infraestructura, marketing— es el camino más directo del catálogo.</p>

<p>Abrí cualquier ficha de Teclab en <a href="/">el catálogo</a> para ver el plan de estudios completo. La inscripción y las consultas se hacen desde el CAU, por <a href="https://wa.me/5491166522722" target="_blank">WhatsApp</a> o por <a href="/contacto">el formulario de contacto</a>.</p>
$html$
where slug = 'teclab-tecnicaturas-online';

commit;

-- Verificacion. Tiene que dar: filas = 1, items_gestion = 11, items_total = 17.
select
  count(*)                                              as filas,
  sum((length(contenido) - length(replace(contenido, '<li>', ''))) / 4) as items_total,
  sum((length(split_part(contenido, 'Teclab Gestión (11 carreras)', 2))
       - length(replace(split_part(contenido, 'Teclab Gestión (11 carreras)', 2), '<li>', ''))) / 4)
                                                        as items_gestion
from public.novedades
where slug = 'teclab-tecnicaturas-online';

-- Despues de correrlo: revalidar/redeploy para que el ISR (revalidate = 3600)
-- tome el texto nuevo en /novedades/articulo/teclab-tecnicaturas-online.
