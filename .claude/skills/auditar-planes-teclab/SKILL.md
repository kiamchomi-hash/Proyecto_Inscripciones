---
name: auditar-planes-teclab
description: Revisar, comparar o actualizar planes de estudio y materias de las carreras de Teclab contra sus fuentes oficiales. Activar cuando la conversación trate planes de Teclab, especialmente al cierre de un cuatrimestre; también al consultar una materia si hace falta verificar el plan vigente. No usar para planes de Siglo 21 o Identidad Argentina.
---

# Auditoría de planes de Teclab

Revisar los planes publicados de las carreras activas de Teclab contra fuentes oficiales. La invocación de esta skill autoriza corregir en D1 únicamente `carreras.plan_estudios` cuando la discrepancia esté confirmada.

## Alcance

- Incluir sólo carreras activas de Teclab; excluir `proximamente`, inactivas y cursos.
- No cambiar otros campos, instituciones, carreras ni la estructura del sitio.
- Si el usuario pregunta por una materia o un plan concreto, verificar y responder esa consulta; no convertirla automáticamente en una auditoría masiva.
- La revisión periódica habitual es al cierre de cada cuatrimestre. No crear cron ni otros avisos: el recordatorio de Telegram está configurado aparte.

## Procedimiento

1. Leer `docs/criterios.md`, `docs/herramientas.md` y `docs/alta-de-carrera.md`. Confirmar el formato vigente de `plan_estudios` en código y datos antes de preparar cambios.
2. Consultar D1 para obtener las carreras activas de Teclab, sus identificadores, nombres y planes actuales. No usar la base comercial ni el JSON del bot como fuente del plan.
3. Para cada carrera incluida, consultar la ficha oficial de Teclab y el PDF oficial enlazado desde esa ficha. Guardar URL, título del documento y fecha de consulta. Comparar materia por materia y por período: denominación, orden, año, cuatrimestre y materias añadidas o ausentes.
4. Si la ficha y el PDF discrepan, el documento no es accesible o el período no puede determinarse con certeza, marcar esa carrera como no resuelta y no modificarla. No completar huecos por inferencia.
5. Preparar `sql/AAAA-MM-DD-planes-teclab.sql` con sólo los `UPDATE` confirmados. Cada sentencia debe limitarse a `plan_estudios` y llevar `WHERE id = ... AND nombre = ...`; revisar el SQL y el destino antes de escribir.
6. Ejecutar usando el procedimiento vigente de `docs/herramientas.md` y `npm run db:d1 -- --archivo sql/AAAA-MM-DD-planes-teclab.sql --escribir`. Si falla, leer D1 antes de reintentar para descartar una aplicación parcial.
7. Leer de vuelta las filas modificadas y comparar el valor completo. Verificar las fichas públicas afectadas, incluida la representación del plan. No considerar el deploy como requisito para un cambio sólo de datos.
8. Guardar `referencias/AAAA-MM-DD-planes-teclab.md` con las fuentes oficiales por carrera, fecha, diferencias halladas, cambios aplicados y verificaciones. No incluir contenido comercial ni precios.
9. Informar cuántas carreras se revisaron, cuáles se corrigieron y cuáles quedaron sin resolver, con el motivo. No afirmar que una carrera coincide si alguna fuente relevante no pudo comprobarse.

## Seguridad de los cambios

- Antes de escribir, confirmar que el archivo SQL contiene sólo las carreras y el campo autorizados.
- No actualizar D1 si no hay al menos una diferencia confirmada.
- No delegar ni ampliar el alcance de la autorización a otros campos.
