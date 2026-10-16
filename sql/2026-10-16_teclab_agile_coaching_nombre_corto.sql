-- «Gestión de Equipos Ágiles (Agile Coaching)» pasa a «Agile Coaching» (pedido
-- del usuario, 16/10/2026): el título de la ficha ocupaba tres líneas. El título
-- oficial del egresado no cambia. El slug viejo redirige desde next.config.ts.
--
-- Requiere el código con el redirect y los matchers por «agile coaching» ya publicado.
-- Correr con: npm run db -- --archivo sql/2026-10-16_teclab_agile_coaching_nombre_corto.sql

update public.carreras
set nombre = 'Tecnicatura Superior en Agile Coaching',
    nombre_corto = 'Agile Coaching'
where id = 257
  and nombre = 'Tecnicatura Superior en Gestión de Equipos Ágiles (Agile Coaching)';
