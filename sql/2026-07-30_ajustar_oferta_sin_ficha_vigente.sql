-- Ajusta la oferta visible después de contrastar las carreras con el catálogo,
-- el sitemap y las fichas públicas de Universidad Siglo 21 el 30/07/2026.
--
-- Criterio:
--   · Administración Hotelera (63) deja de mostrarse como carrera independiente.
--     La universidad sólo la menciona actualmente como doble titulación de
--     Gestión Turística.
--   · Sociología (131) deja de mostrarse como oferta abierta. Su ficha pública
--     ya no existe y la página vigente de Relaciones Internacionales tampoco la
--     ofrece como doble titulación.
--   · Administración Pública (68) conserva su ficha y posicionamiento, pero
--     deja de ofrecer inscripción hasta que la universidad confirme la apertura.
--     No es la misma carrera que Licenciatura en Administración.
--   · Negocios Agroecológicos (110) conserva su ficha como nueva carrera
--     anunciada, pero sin inscripción directa mientras su ficha oficial siga 404.
--
-- Agroinformática (130) y Estadística Aplicada y Análisis Avanzado (132) ya
-- estaban correctamente marcadas como `proximamente` y no se modifican.
--
-- Aplicado en producción el 30/07/2026. El script se conserva como registro
-- reproducible y para disponer de la verificación y la reversión.

update public.carreras
set activa = false,
    updated_at = now()
where id in (63, 131)
  and nombre in ('Administración Hotelera', 'Sociología');
-- Esperado: UPDATE 2

update public.carreras
set proximamente = true,
    updated_at = now()
where id = 68
  and nombre = 'Administración Pública';
-- Esperado: UPDATE 1

update public.carreras
set nueva = true,
    proximamente = true,
    updated_at = now()
where id = 110
  and nombre = 'Negocios Agroecológicos';
-- Esperado: UPDATE 1

-- Verificar los seis casos revisados.
select id, nombre, nivel, activa, nueva, proximamente
from public.carreras
where id in (63, 68, 110, 130, 131, 132)
order by id;

-- Resultado esperado:
--   63  Administración Hotelera                         activa=false
--   68  Administración Pública                         proximamente=true
--  110  Negocios Agroecológicos                        nueva=true, proximamente=true
--  130  Agroinformática                                proximamente=true
--  131  Sociología                                     activa=false
--  132  Estadística Aplicada y Análisis Avanzado       proximamente=true

-- Para revertir únicamente este cambio:
-- update public.carreras set activa = true where id in (63, 131);
-- update public.carreras set proximamente = false where id = 68;
-- update public.carreras set nueva = false, proximamente = false where id = 110;
