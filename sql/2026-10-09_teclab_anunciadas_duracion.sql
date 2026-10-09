-- Las cinco tecnicaturas anunciadas de Teclab duran 2 años (confirmado por el
-- usuario el 09/10/2026). Gestión de Alimentos ya lo tenía; esto completa las otras
-- cuatro para que la tarjeta y la ficha muestren la duración.
--
-- Correr con: npm run db -- --archivo sql/2026-10-09_teclab_anunciadas_duracion.sql

UPDATE carreras SET duracion = '2 años'
WHERE id IN (242, 243, 244, 245) AND proximamente AND duracion IS NULL;
