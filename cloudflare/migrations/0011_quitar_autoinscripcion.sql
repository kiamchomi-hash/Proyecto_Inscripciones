-- Baja de la autoinscripción de Teclab (27/10/2026).
--
-- Las dos tablas quedaron sin uso al retirar el robot y el enlace personalizado:
-- ningún alta graba una fila en la cola del robot (no existe `kind:
-- 'autoinscripcion'`) y ningún código crea enlaces desde el corte a Cloudflare.
-- Las dos estaban vacías en producción al aplicar esta migración; se verificó
-- antes con `SELECT COUNT(*)`.
--
-- El CHECK de `outbox.tipo` conserva los valores `robot-*` de 0004/0007: es un
-- superconjunto y no hace falta reconstruir la tabla para dejar de usarlos.

DROP TABLE IF EXISTS robot_autoinscripciones;
DROP TABLE IF EXISTS enlaces_inscripcion;
