# Carreras nuevas de Teclab como «Próximamente»

## Objetivo

Publicar una ficha `/carreras/<slug>` por cada carrera nueva que anunció Teclab, para que
empiecen a indexar y junten avisos antes de que abra la inscripción.

## Problema y por qué

El Dashboard Comercial (v4.0, 05/10/2026) nombra cinco carreras nuevas —Fintech,
Acompañamiento Terapéutico, Producto Digital, Gestión de Alimentos y Energías
Renovables— pero su Knowledge Pack está vacío: no hay plan, duración, título ni nombre
oficial. teclab.edu.ar todavía no las publica. El usuario decidió (09/10/2026) publicar
fichas de «Próximamente» con sólo lo confirmado, en vez de fichas completas con datos
inventados.

## Alcance

- La columna `carreras.proximamente` ya resuelve ficha, catálogo, sitemap de
  `/inscripcion` y meta description. Las cinco entran como filas Teclab con
  `activa = true, proximamente = true`.
- El código asume hoy que una `proximamente` es de Siglo 21 y tiene duración y título.
  Hay que adaptarlo a una Teclab sin datos.

## Restricciones

- No inventar plan, duración, título, certificado, partner ni articulación con Siglo 21.
- Los nombres (`Tecnicatura Superior en <X>`) son provisorios: si el oficial difiere, se
  corrige la fila y el slug viejo redirige.
- Las filas se escriben con `npm run db` (rol `cau_editor`). El trigger revalida al
  instante, así que el código tiene que estar publicado antes que las filas.

## Tareas

- [x] T1. Código: ficha, meta description, JSON-LD, modal, formularios y franja de
  articulación toleran una Teclab `proximamente` sin duración, título ni plan. Aviso de
  «Próximamente» con la institución correcta. Tests.
- [x] T2. SQL de alta de las cinco filas (`sql/2026-10-09_teclab_carreras_proximamente.sql`).
- [x] T3. Publicar: push (deploy), correr el SQL, verificar fichas en producción y en el
  sitemap.

## Criterios de aceptación

- Cada ficha muestra el aviso de Teclab, «Avisame cuando abra» y «A confirmar» donde
  falta el dato. No muestra «null», «Universidad Siglo 21 anunció» ni la articulación.
- La meta description no promete duración ni título.
- No hay página `/inscripcion` para ellas y el formulario de preinscripción no las ofrece.
- `npm run check` en verde.

## Ruta y evidencia

- Exploración delegada (mapa de ficha, sitemap, formularios y tests).
- T1: delegado a un escritor (más de dos archivos no triviales).

## Progreso

- 09/10/2026: documento creado.
- 09/10/2026: T1 y T2 hechos (escritor delegado + filtros del catálogo y auditoría
  inline). `npm run check`: 390/390 tests, lint sin errores. Tests nuevos en
  `tests/teclab-proximamente.test.mjs` (RED observado en 6 de 8 antes de implementar).
  Pendiente de decidir: foto de portada (cae en la genérica del sitio).
- 09/10/2026: T3 hecho. Push `f521a9f` (deploy Ready), SQL corrido con `npm run db`
  (ids 242-246). En producción las cinco fichas dan 200, muestran el aviso de Teclab y
  «A confirmar», sin «null» ni el aviso de Siglo 21; están en el sitemap y
  `/inscripcion` da 404. Siguiente: foto de portada propia y completar con el Knowledge
  Pack cuando Teclab lo publique.
- 09/10/2026: Gestión de Alimentos completada con la capacitación de admisión de Teclab
  (`sql/2026-10-09_gestion_alimentos_datos_oficiales.sql`): duración, título,
  certificado intermedio, plan por año, competencias y cinco preguntas frecuentes. Área
  Ambiente y Agro y término del test vocacional. Sigue `proximamente`: faltan precio,
  fecha de inicio, `CARRERAS_HUBSPOT` y la ficha oficial en teclab.edu.ar.
- 09/10/2026: las cinco anunciadas llevan «2 años» (confirmado por el usuario) y el
  badge «Próximamente» va en la cabecera de la tarjeta, al lado de la duración.
- 09/10/2026: alta de una sexta, Gestión de Proyectos Mineros, con los datos de la
  capacitación de admisión (`sql/2026-10-09_teclab_gestion_proyectos_mineros.sql`):
  tipo Gestión, área Ambiente y Agro, término del test vocacional y portada de dominio
  público (Bingham Canyon, Wikimedia Commons). Mismos pendientes que Alimentos.
- 09/10/2026: Energías Renovables pasa a su nombre oficial, Gestión de Energías
  Renovables, con los datos de la capacitación
  (`sql/2026-10-09_gestion_energias_renovables_datos_oficiales.sql`). El slug viejo
  redirige con un 301 desde `next.config.ts`.
