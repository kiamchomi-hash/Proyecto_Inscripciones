-- Abrir dos carreras anunciadas de Siglo 21. La universidad ya las publica
-- como oferta vigente a distancia, con plan y aperturas (verificado el
-- 26/11/2026):
--   https://21.edu.ar/carreras-y-programas/licenciatura-en-administracion-publica
--   https://21.edu.ar/carreras-y-programas/tecnicatura-universitaria-en-negocios-agroecologicos
-- Quitar `proximamente` las habilita en la preinscripción y en la publicación
-- de precios. El plan y los slides ya estaban cargados y se compararon contra
-- la ficha oficial: coinciden.
-- Aplicar con: npm run db:d1 -- --archivo sql/2026-11-26-abrir-administracion-publica-negocios-agroecologicos.sql --escribir

UPDATE carreras
SET proximamente = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 68
  AND nombre = 'Administración Pública'
  AND activa = 1
  AND proximamente = 1;

UPDATE carreras
SET proximamente = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 110
  AND nombre = 'Negocios Agroecológicos'
  AND activa = 1
  AND proximamente = 1;
