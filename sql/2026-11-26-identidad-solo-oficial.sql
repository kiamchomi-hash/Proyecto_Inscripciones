-- Dejar sólo la oferta que figura en la web oficial de la Academia
-- (https://www.identidadargentina.com.ar, 26/11/2026).
--
-- 1) Oratoria ya no está en el catálogo oficial: se despublica, pero la ficha
--    vieja no queda en 404. El Worker la redirige 301 a la portada de
--    topykly.com.
-- 2) Mindfulness figura con 4 meses en la web oficial; la base tenía 2.
--
-- Escritura en producción: aplicar con `npm run db:d1 -- --archivo ... --escribir`
-- después de la autorización. No es una migración.

UPDATE carreras
SET activa = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 172 AND nombre = 'Diplomatura en Oratoria';

UPDATE carreras
SET duracion = '4 meses',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 174 AND nombre = 'Diplomatura en Mindfulness, Liderazgo Personal y Gestión de Vínculos';
