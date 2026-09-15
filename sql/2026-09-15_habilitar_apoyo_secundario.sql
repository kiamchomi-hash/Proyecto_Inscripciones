-- Habilita la ficha de apoyo para nivel secundario.
-- Ejecutar manualmente en el SQL Editor de Supabase.
UPDATE public.materias
SET en_construccion = false
WHERE slug = 'sec'
  AND activa = true;

SELECT slug, label, en_construccion, activa
FROM public.materias
WHERE slug = 'sec';
