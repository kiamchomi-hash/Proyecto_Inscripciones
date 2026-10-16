-- Las nueve carreras de los bloques 2 y 3 de Teclab pasan a «Próximamente»
-- (pedido del usuario, 16/10/2026): sin /inscripcion ni preinscripción hasta
-- tener precio, fecha de inicio y opción de HubSpot.
--
-- Correr con: npm run db -- --archivo sql/2026-10-16_teclab_bloques_2_y_3_proximamente.sql

update public.carreras
set proximamente = true, nueva = false
where id between 250 and 258
  and nombre like 'Tecnicatura Superior en %'
  and nivel like 'Teclab - %';
