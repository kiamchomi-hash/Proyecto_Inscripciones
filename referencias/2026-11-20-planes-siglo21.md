# Contraste de planes al 20/11/2026

Comparación del plan publicado en `www.siglo21sur.com/carreras/<slug>` contra la fuente oficial de cada casa. Se cotejaron las materias por cuatrimestre; se ignoraron abreviaturas, saltos de línea, títulos intermedios, requisitos de ingreso, resoluciones y bloques comerciales de las páginas oficiales. No se escribió en D1 durante esta revisión.

## Teclab: 25 carreras

Fuente: `https://teclab.edu.ar/carrera/<slug>/` (los 25 slugs salen de `https://teclab.edu.ar/carrera-sitemap.xml`).

- Veinte carreras: las mismas materias en el sitio y en la fuente.
- Cinco corregidas el 20/11 y ya aplicadas en D1 (`sql/2026-11-20-corregir-planes-teclab.sql`): Cloud Administration, Seguridad Informática, Seguros, Inbound Marketing y Logística. Verificado en producción: 16/16, 16/16, 15/15, 16/16 y 16/15 materias (en Logística el único ítem extra del sitio es el número de resolución). Fuentes: `referencias/2026-11-20-planes-teclab.md`.
- Dos aparentes diferencias en Programación y Relaciones Laborales resultaron ser un error del extractor: descartaba las líneas que empiezan con «Experiencia» por confundirlas con el bloque de testimonios de la página. La consulta a D1 mostró que ambas filas ya tienen esas materias (`id 217`: «Experiencia de usuario» en el 1er cuatrimestre; `id 230`: «Experiencia de las personas», «Transformación e innovación organizacional», «Práctica profesional I» y «Práctica profesional II» en el 2do cuatrimestre del 2do año). Corregido el extractor, las 25 carreras comparan sin diferencias. No hubo escritura: el `UPDATE` preparado con esos datos devolvió `changes: 0` y se descartó.

## Siglo 21: 69 carreras

Fuente: `https://21.edu.ar/carreras-y-programas/<slug>/`. El mapeo slug del sitio → URL oficial está en `odd/tasks/relevamiento-preliminar-planes-2026-11-09.md`.

- 46 carreras: mismas materias y mismos cuatrimestres.
- 21 carreras: la cuenta y las materias coinciden; las diferencias que aparecen en la comparación automática son efectos de la extracción, no cambios de plan. Los casos revisados uno por uno:
  - Líneas partidas en la fuente (`Introducción a la Ciencia Política y a las Relaciones / Internacionales`; `La Educación a Distancia y los Desafíos Tutoriales del / E-Learning`; `Coaching y Coordinación de Equipos / Periodísticos de Alto Desempeño`).
  - Líneas unidas en la fuente (`Contabilidad de Costos Derecho Empresario`, `Formulación y Evaluación de Proyectos Bioética`, `Herramientas Matemáticas I – Álgebra Física`).
  - Abreviaturas del sitio (`Introducción a TIC` frente a `Introducción a Tecnologías de Información y Comunicaciones`; `Dcho.` frente a `Derecho`).
  - Bloques que no son materias: títulos intermedios y dobles titulaciones, requisitos de ingreso, créditos electivos y "Práctica Solidaria".
  - `licenciatura-en-hidrocarburos-y-geociencias`: el sitio agrupa las tres materias del noveno cuatrimestre dentro del octavo como "Otros requisitos, Noveno Cuatrimestre"; la fuente las muestra en un noveno cuatrimestre. Las materias son las mismas.
  - `licenciatura-en-informatica`: la fuente llama "Primer año" a los cuatrimestres 1 a 4 y no muestra la etiqueta "Segundo año"; el sitio usa la numeración habitual de dos cuatrimestres por año. Las materias son las mismas.
  - `siglo-21-video-juegos`: la fuente expresa los créditos electivos y el examen de idiomas en una nota al pie; el sitio los lista como dos ítems.
- Dos carreras de tecnicatura universitaria no usan cuatrimestres en la fuente, sino años o semestres; se compararon a mano y coinciden:
  - https://21.edu.ar/carreras-y-programas/tecnicatura-universitaria-en-diseno-y-animacion-digital (18 materias, agrupadas por año).
  - https://21.edu.ar/carreras-y-programas/tecnicatura-universitaria-en-marketing-y-publicidad-digital (16 materias, agrupadas por semestre; la fuente escribe "Plan de Marketing Digita").

## Alcance

La revisión compara el contenido publicado, no el texto de los PDFs oficiales. No cubre las carreras de Identidad Argentina: esas son de otra casa y sus planes se rehicieron el 09/11 desde los programas oficiales (`sql/2026-11-09-planes-identidad.sql` y `sql/2026-11-09-planes-quitar-extras.sql`).
