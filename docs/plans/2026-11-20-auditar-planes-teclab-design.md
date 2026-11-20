# Diseño: auditoría periódica de planes de Teclab

## Objetivo

Crear una skill de OpenCode para revisar los planes de estudio de las carreras
activas de Teclab, especialmente al cierre de cada cuatrimestre, y corregir en
D1 las diferencias confirmadas contra las fuentes oficiales.

## Flujo

1. Activar la skill cuando el usuario pida revisar planes de Teclab; no crear un
   recordatorio ni una ejecución automática.
2. Leer la lista vigente de carreras activas de Teclab desde D1 y su plan
   publicado.
3. Consultar la ficha oficial de cada carrera y el PDF oficial enlazado desde
   esa ficha. Comparar materias y período por período, sin usar el sitio del CAU
   como fuente para decidir el contenido.
4. Si las fuentes oficiales discrepan entre sí o no se pueden verificar,
   registrar la carrera como no resuelta y no modificarla.
5. Aplicar la autorización permanente que concede la invocación de esta skill
   únicamente para cambiar `carreras.plan_estudios` de las filas Teclab activas
   con diferencias confirmadas. No alterar otros campos, instituciones ni
   carreras inactivas o anunciadas.
6. Preparar SQL fechado con `WHERE` por `id` y nombre; ejecutar con la
   herramienta `npm run db:d1 -- --escribir` y verificar cada cambio mediante
   lectura de vuelta. Si una escritura falla, consultar D1 antes de reintentar
   para descartar cambios parciales.
7. Verificar las páginas públicas afectadas, guardar las fuentes y el resultado
   en `referencias/AAAA-MM-DD-planes-teclab.md` e informar cambios, bloqueos y
   verificaciones.

## Instalación en el proyecto

La skill vivirá en `.claude/skills/auditar-planes-teclab/SKILL.md`, con el
enlace selectivo correspondiente en `.agents/skills/` y la excepción de uso en
`opencode.jsonc`, siguiendo el patrón existente de skills del repositorio.

## Límites

- La skill es manual: no programa ni envía avisos al final del cuatrimestre.
- No publica código ni hace deploy; el contenido de las fichas se sirve desde
  D1.
- Si la fuente primaria no permite determinar el plan con certeza, no inventa
  ni completa materias por inferencia.

## Aprobación

Diseño aprobado por el usuario el 20/11/2026.
