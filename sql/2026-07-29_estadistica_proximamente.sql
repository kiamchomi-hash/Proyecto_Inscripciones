-- Marca la Tecnicatura en Estadística Aplicada y Análisis Avanzado (id 132)
-- como anunciada pero sin inscripción abierta.
--
-- Motivo: es la otra carrera que marcaba `npm run auditar` el 29/07/2026 (sin
-- plan de estudios y sin slides, disparando el mail de /api/notificar-carrera
-- en cada visita). A diferencia de Sociología, acá no hay de dónde sacar el
-- temario: la universidad no lo publicó en ningún lado. Se buscó el 29/07 en
--
--   · contenidos.21.edu.ar/pdf/carreras/pregrado/  → 404 en todas las variantes
--     del slug (el patrón `tec-<nombre>.pdf` existe y responde 200 para otras
--     tecnicaturas, así que el 404 es ausencia, no error de URL)
--   · 21.edu.ar/carreras-y-programas/…            → 404
--   · el sitemap de 21.edu.ar                     → no figura
--   · inscribite.21.edu.ar                        → 404
--
-- Lo único público es un posteo del CAU Corrientes: 2 años, modalidad flexible,
-- inicio en octubre. Nada de eso alcanza para publicar un plan de estudios.
--
-- `proximamente` es el mismo mecanismo que ya usa Agroinformática
-- (sql/2026-07-27_carreras_proximamente.sql): la ficha se conserva —y con ella
-- la posición en Google— pero deja de prometer lo que no tiene. La auditoría
-- baja el caso de problema a aviso.
--
-- ── Dos cambios visibles, para que no sorprendan ──
-- 1. La píldora de la tarjeta pasa de "Nueva" a "Próximamente": el badge de
--    careers-catalog.tsx da prioridad a `proximamente` sobre `nueva`, y la fila
--    tiene las dos en true. Se deja `nueva` como está para no perder el dato
--    cuando esto se revierta.
-- 2. El botón de la ficha pasa de "Quiero inscribirme" a "Avisame cuando abra"
--    (career-detail.tsx). Si Villa Lugano ya está tomando inscripciones para el
--    inicio de octubre, este script NO es lo que corresponde: lo que corresponde
--    es conseguir el temario y cargarlo.
--
-- Correr en el SQL Editor del dashboard de Supabase.

update public.carreras
set proximamente = true,
    updated_at = now()
where id = 132;
-- Esperado: UPDATE 1

-- Verificar: deberían quedar dos, Agroinformática (130) y esta.
select id, nombre, nivel, activa, nueva, proximamente
from public.carreras
where proximamente = true
order by id;

-- Para revertir:
--   update public.carreras set proximamente = false where id = 132;
