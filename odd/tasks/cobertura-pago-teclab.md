# Qué cubre el pago de Teclab (pendiente 33)

## Objetivo

Que «Ver precio» y el enlace personalizado (`/inscripcion/<codigo>`) digan con claridad qué cubre el pago de Teclab, cuánto dura la carrera en cuatrimestres y bimestres, y que cada cuatrimestre se vuelve a pagar matrícula y bimestres. Debe valer para los dos períodos del año, no sólo para el segundo.

## Hechos verificados

- Reglamento Institucional de Teclab, 4.1 (citado en `ventas/corpus/teclab.json`): «el pago de la matrícula y aranceles tienen una periodicidad cuatrimestral».
- Al inicio del cuatrimestre se paga matrícula + los dos bimestres; a mitad (junio u octubre), matrícula + el único bimestre que queda.
- Las 16 tecnicaturas activas duran «2 años» (4 cuatrimestres, 8 bimestres); el curso dura «4 semanas» y es pago único, sin bimestres.
- El robot de precios (`herramientas/ventas/extraer-externos.mjs`, fuera de git) rotula los bimestres siempre 2A/2B (agosto-septiembre, octubre-noviembre) aunque lee el período real con `periodoTeclab(fila)`.

## Tareas

- [x] T1. Texto de cobertura con los meses y el cuatrimestre siguiente (`components/formularios/cobertura-pago.ts`, `tests/cobertura-pago.test.mjs`). Ruta: inline.
- [x] T2. Sumar la duración: «La carrera tiene N cuatrimestres (2N bimestres), y cada uno se paga aparte: matrícula y bimestres.» en «Ver precio» y en el enlace. Ruta: delegada (writer; 6 archivos).
- [x] T3. Robot: rotular los bimestres según el período leído (1A/1B o 2A/2B); sin período, «Primer bimestre» / «Segundo bimestre». Ruta: delegada (mismo writer).

## Criterios de aceptación

- 2B: «Cubre la matrícula y lo que queda del cuatrimestre: el bimestre de octubre y noviembre. La carrera tiene 4 cuatrimestres (8 bimestres), y cada uno se paga aparte: matrícula y bimestres.»
- 1A: los rótulos dicen marzo-abril y mayo-junio, y el texto «de marzo a junio».
- Sin duración conocida queda «El cuatrimestre siguiente se paga de nuevo, matrícula y bimestres.»
- El slide de precio sigue sin scroll en 375x667.

## Checks

`npm run check`; `node --test herramientas/ventas/tests/cobertura-periodos.test.mjs`; medición del slide en el navegador.

## Riesgo abierto

Los importes los lee de los campos `bimestre2A`/`bimestre2B` del simulador. No se sabe si en el primer cuatrimestre se llaman igual; no se toca hasta verlo.

## Progreso

- 03/10/2026: T1 hecha (4/4 tests, 281/281 suite). Pendiente commit junto con el mail recordado de «Ver precio».
- 03/10/2026: T2 hecha (writer delegado). `coberturaDelPago(conceptos, duracion?)`: «2 años» → 4 cuatrimestres (8 bimestres); «N meses» sólo si N/4 es entero; otra cosa, cierre genérico. Detector de bimestre pasa a `/\bbimestre\b/i` («Primer bimestre» cuenta). Duración cableada en «Ver precio» (`carrera.duracion`) y en el enlace (`select ... duracion`, demo con «2 años»). En `propsInscripcionEnlace` la duración entra opcional y sale `string | null`. RED 3/8 → GREEN 8/8. T3 hecha: `rotulosBimestresTeclab(periodo)` en el robot y usada en `desgloseTeclab`; RED (export faltante) → GREEN 3/3, suite de ventas 333/333. Checks: lint 0 errores (27 warnings previos), typecheck ok, `npm test` 285/285. Pendiente: medir el slide en 375x667 y commit.
- 03/10/2026: verificación del parent: `node --test tests/cobertura-pago.test.mjs` 8/8; `/inscripcion/demo` muestra el texto con «4 cuatrimestres (8 bimestres)»; slide de precio en 375x667 sin scroll (413/413, aclaración en 3 renglones). Pendiente: commit.
