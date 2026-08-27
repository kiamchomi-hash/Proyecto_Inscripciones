-- Retira la guía de Academia Identidad Argentina de la sección Novedades.
-- La fila se conserva para no perder el contenido histórico.

update public.novedades
set publicada = false
where slug = 'identidad-argentina-diplomaturas';

select id, titulo, slug, publicada
from public.novedades
where slug = 'identidad-argentina-diplomaturas';
