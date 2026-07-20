-- Eliminación irreversible del módulo y todos los datos personales de alumnos.
-- Ejecutar una sola vez con un rol propietario de la base.
BEGIN;

DROP TABLE IF EXISTS public.alumnos_analiticos CASCADE;
DROP TABLE IF EXISTS public.alumnos_pagos CASCADE;
DROP TABLE IF EXISTS public.alumnos_cau CASCADE;

COMMIT;
