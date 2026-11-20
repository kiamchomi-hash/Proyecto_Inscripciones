---
name: auditar-planes-siglo21
description: Revisar, comparar o actualizar los planes de estudio de las carreras de Siglo 21 contra las fuentes oficiales. Activar al hablar de planes o materias de Siglo 21, especialmente al cierre de un cuatrimestre. No usar para Teclab ni Identidad Argentina.
---

# Auditoría de planes de Siglo 21

La invocación de esta skill autoriza actualizar en D1 únicamente el slide
`plan_estudios` de carreras activas de Siglo 21 cuando la diferencia con una
fuente oficial vigente esté confirmada.

## Alcance

- Incluir carreras activas cuyo `nivel` sea `Grado`, `Grado (CCC)` o `Pregrado`
  y que tengan un slide `plan_estudios`.
- Excluir carreras inactivas, cursos y niveles distintos.
- Si el usuario consulta una materia o carrera concreta, verificar esa consulta;
  no iniciar automáticamente una auditoría masiva.
- La revisión periódica es al cierre de cada cuatrimestre. Los recordatorios de
  Telegram se configuran aparte y no ejecutan la auditoría.

## Procedimiento

1. Leer `docs/criterios.md`, `docs/herramientas.md` y
   `docs/alta-de-carrera.md`. Confirmar en el código el formato vigente del slide
   `plan_estudios`.
2. Consultar D1 para obtener identificador, nombre, nivel, `updated_at` y
   `slides` de todas las carreras incluidas.
3. Para cada carrera, abrir la ficha oficial vigente de `21.edu.ar`. Comparar
   materia por materia y por período: nombres, orden, año, cuatrimestre, materias
   añadidas o ausentes y adicionales/requisitos que forman parte del plan.
4. Si la ficha enlaza un plan oficial descargable, revisarlo también. Si la
   ficha y el documento se contradicen, no se puede confirmar cuál rige o la
   fuente no está disponible, registrar la carrera como no resuelta y no
   modificarla.
5. Tratar el contenido publicado en la ficha oficial como la fuente primaria.
   No corregir por inferencia una anomalía que la ficha publique explícitamente;
   dejar constancia de ella. No copiar erratas de forma que cambien el sentido
   académico.
6. Preparar `sql/AAAA-MM-DD-planes-siglo21.sql` con sólo las diferencias
   confirmadas. Cada sentencia debe actualizar exclusivamente el objeto del
   plan dentro de `slides`, preservar portada/cierre y llevar condiciones por
   `id`, `nombre`, `activa = 1` y `updated_at` observado.
7. Inspeccionar el SQL y el destino antes de escribir. Ejecutar con
   `npm run db:d1 -- --archivo sql/AAAA-MM-DD-planes-siglo21.sql --escribir`.
   Ante un fallo, leer D1 antes de reintentar para descartar aplicación parcial.
8. Leer de vuelta todas las filas modificadas, comparar el slide completo,
   confirmar que otros slides siguen intactos y verificar `npm run auditar`.
   No hace falta deploy para cambios sólo de datos.
9. Guardar `referencias/AAAA-MM-DD-planes-siglo21.md` con las URLs oficiales,
   fecha de consulta, diferencias, cambios y verificaciones. No incluir precios
   ni material comercial.
10. Informar cuántas carreras se revisaron, cuáles se corrigieron y cuáles
    quedaron sin resolver, explicando el motivo. No afirmar que un plan coincide
    si alguna fuente relevante no pudo comprobarse.

## Seguridad de los cambios

- La autorización queda limitada a las carreras incluidas y a su slide
  `plan_estudios`; no modificar el campo textual `plan_estudios`, otros campos,
  imágenes ni carreras de otras instituciones.
- No actualizar si no hay una diferencia confirmada.
- No delegar ni ampliar el alcance de la autorización.
