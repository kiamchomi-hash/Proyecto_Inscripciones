# Mensaje de precio de Teclab

## Objetivo

Que el mensaje de precio de Teclab en el bot de respuestas no corte la conversación: hasta el 09/10/2026, de unos 150 leads ninguno compró, y según el usuario la charla se cae justo cuando recibe el precio.

## Problema

La respuesta `precio-teclab` (`ventas/corpus/teclab.json`) abre con la tabla de aranceles y el total, no dice qué se lleva la persona y cierra con «¿Con qué medio de pago te gustaría abonar?», que da la compra por hecha.

## Alcance

Nuevo texto de `precio-teclab`, aprobado por el usuario en la conversación del 09/10/2026:

1. Valor antes del número: título oficial en 2 años, 100% online, sin horarios fijos, y el título intermedio de la carrera al terminar el primer año.
2. Cómo se paga: por cuatrimestre, matrícula y dos bimestres. Con el cuatrimestre empezado, la matrícula y el bimestre que queda; al inicio, la matrícula y los dos bimestres. Misma regla que `components/formularios/cobertura-pago.ts` (Reglamento de Teclab, 4.1).
3. La tabla con el porcentaje de descuento de cada concepto y el total para arrancar.
4. La equivalencia por mes: el total para arrancar dividido por los meses que cubre (2 por bimestre). Dicha como equivalencia, porque Teclab no cobra por mes.
5. Las 3 cuotas sin interés con Visa o Mastercard bancaria, con el importe de cada una (`carreras/teclab/financiacion-teclab-oficial.json`).
6. Que cada cuatrimestre siguiente se paga de nuevo, matrícula y dos bimestres.
7. La vigencia del descuento y el cierre «¿Te quedó alguna duda?».

Fuera de alcance: los cursos incluidos (el usuario los descartó por poco relevantes) y los seguimientos posteriores al precio.

## Criterios de aceptación

- El mensaje se arma solo para cada tecnicatura, con sus importes, su título intermedio y la variante de pago que corresponda.
- Si falta un dato (título intermedio, desglose, precios vigentes), la respuesta no inventa: se apaga y contesta la anterior o la que confirma.
- Tests de `herramientas/ventas/tests/` en verde y las dos páginas regeneradas.

## Tareas

- [x] T1. Marcadores nuevos, nuevo texto de `precio-teclab`, tests y regeneración de las dos páginas (ruta: delegada; disparador: 2+ archivos no triviales y lectura previa de las herramientas de ventas).

## Verificación

- `node --test herramientas/ventas/tests/*.test.mjs`
- `node herramientas/ventas/auditar-instituciones.mjs`
- Ejemplo resuelto para Seguros contra el aprobado.

## Progreso

Documento creado el 09/10/2026. Las herramientas y el corpus están gitignorados: el cambio no viaja en commits, sólo este documento.

09/10/2026, T1 cerrada (ruta delegada):

- Marcadores nuevos: `tablaArranque`, `pagoArranque`, `mesesArranque` y `equivalenciaMensual` (`arranqueTeclab` en `extraer-externos.mjs`), `cuotasSinInteres` y `valorCuotaSinInteres` (`cuotasSinInteresTeclab` en `contexto-carreras.mjs`, leen `financiacion-teclab-oficial.json`). El título intermedio usa el marcador existente `certificadoIntermedio` (`planes-teclab.json`).
- Corpus de Teclab, intención `precio-total`, en este orden: `precio-teclab` (mensaje aprobado), `precio-teclab-sin-certificado` (sin la frase del título intermedio), `precio-teclab-anterior` (texto viejo de respaldo). `precio-teclab-detalle` y `precio-teclab-sin-inicio` llevan `ausente: [tablaArranque]` para no salir al lado del nuevo.
- Tests: `tests/mensaje-precio-teclab.test.mjs` (13 casos). RED observado (faltaba la exportación), después GREEN. Suite completa: 396 de 397; la que falla, «las palabras clave son las mismas que las del sitio», ya fallaba antes del cambio.
- `auditar-instituciones.mjs`: los mismos 2 problemas de antes (vocabulario de Identidad en dos respuestas del curso), ninguno nuevo.
- `carreras-externas.json` de Teclab regenerado: sólo cambian los marcadores nuevos. Las dos páginas regeneradas con `--descuento-beneficio 10`, sin publicar.
- Las 16 tecnicaturas resuelven `precio-teclab` con su título intermedio; el ejemplo de Seguros coincide con el aprobado salvo la vigencia, que sale con año («09/10/2026») porque usa `{promoHasta}`.
