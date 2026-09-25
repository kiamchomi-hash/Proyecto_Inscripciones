-- Repara el texto UTF-8 interpretado como Windows-1252 en dos novedades.
-- Se ejecuta una sola vez con `npm run db -- --archivo sql/2026-09-25_corregir_codificacion_novedades.sql`.
-- El carácter ‰ representa el byte 0x89 de «É» en Windows-1252.

UPDATE public.novedades
SET titulo = convert_from(convert_to(titulo, 'LATIN1'), 'UTF8'),
    contenido = convert_from(convert_to(replace(contenido, 'Ã‰', 'Ã' || chr(137)), 'LATIN1'), 'UTF8'),
    extracto = convert_from(convert_to(extracto, 'LATIN1'), 'UTF8'),
    updated_at = now()
WHERE slug = 'que-hace-un-administrador-cloud'
  AND titulo LIKE '%Ã%';

UPDATE public.novedades
SET titulo = convert_from(convert_to(titulo, 'LATIN1'), 'UTF8'),
    contenido = convert_from(convert_to(replace(contenido, 'Ã‰', 'Ã' || chr(137)), 'LATIN1'), 'UTF8'),
    extracto = convert_from(convert_to(extracto, 'LATIN1'), 'UTF8'),
    tag = convert_from(convert_to(tag, 'LATIN1'), 'UTF8'),
    updated_at = now()
WHERE slug = 'que-hace-un-procurador'
  AND titulo LIKE '%Ã%';