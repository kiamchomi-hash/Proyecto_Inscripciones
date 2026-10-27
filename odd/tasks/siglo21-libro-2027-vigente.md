# Siglo 21: el libro 2027 pasa a ser el vigente

## Objetivo

El aviso diario de precios y el bot de WhatsApp juzgan y cotizan Siglo 21 con el libro "1 2027" (`ventas/precios/2027/precios-lista-1-2027.json`) en lugar del libro "2 2026" (`ventas/precios/precios-vigentes.json`).

## Problema

El 19/10/2026 la carga diaria salió con código 1 y "NO SE PUEDE COTIZAR — la promoción venció" porque `estadoDePrecios()` mira la promo 2B 2026 (vencida el 18/10). La inscripción ya es para 2027 (`PENDIENTES.md`) y la promo 1A 2027 está vigente hasta el 21/10. El buscador y la web ya usan 2027; el bot y el aviso no.

## Alcance autorizado

- Aviso diario (`estado-precios.mjs`, código de salida de `actualizar-todo.mjs`) con el libro 2027.
- Bot: el corpus y los contextos cotizan Siglo 21 con las cotizaciones verificadas 2027 (`cotizacionVerificada2027`).
- No se cambia `cotizable:false` del snapshot 2027: es un control de identidad en cinco lugares.
- No se muestran precios 2026 en ningún lado.

## Restricciones

- Todo importe del bot exige `preciosVigentes` (`.claude/skills/bot_respuestas/SKILL.md`).
- `herramientas/ventas/` y `ventas/` están gitignorados: el código no se commitea; sólo este documento.
- La promo 1A 2027 vence el 21/10/2026 y `promociones["1B"]` es `null`: al vencer, el aviso vuelve a marcar fallo y el bot deja de cotizar. Es el comportamiento esperado.

## Tareas

- [x] T1 — Aviso: `estadoDePrecios()` juzga Siglo 21 por el libro 2027 (fecha `extraidoEn`, vencimiento de la promo del período 2027 vigente). Ruta: delegada (writer).
- [x] T2 — Bot: contextos y corpus cotizan con `cotizacionVerificada` 1A 2027, `anioAranceles: 2027`, conceptos Matrícula/Bimestre 1/Bimestre 2; el buscador deja de anular `preciosVigentes` de Siglo 21 en 2027. Ruta: delegada (writer).
- [x] T3 — La corrida diaria deja de descargar el libro 2026 (19/10/2026: "2026 ya no se ofrece, todo 2027"). Lo que todavía lea el archivo 2026 ya guardado se lista, no se rompe. Ruta: delegada (writer).
- [x] T4 — Relanzar la carga de Siglo 21 y verificar estado, bot y publicación. Ruta: inline.

## Criterios de aceptación

- `estado-precios.mjs` informa Siglo 21 "al día" con el libro 2027 vigente y "la promoción venció" cuando su promo pasó.
- Una pregunta de precio de Abogacía al bot devuelve los importes 2027 verificados (Matrícula 402.480 con promo; total coherente con el libro).
- Tests de `herramientas/ventas/tests/` en verde (corridos desde la raíz del repo).

## Verificación

`node --test herramientas/ventas/tests/*.test.mjs` desde la raíz.

## Progreso

- 19/10/2026: documento creado tras el mapeo.
- 19/10/2026: T1-T3 hechos por el writer; `node --test herramientas/ventas/tests/*.test.mjs` 594/594 (base 586/586), RED observado antes de cada comportamiento nuevo. Abogacía 1A cotiza Matrícula 402.480 / Bimestre 1.140.984 / Bimestre 760.680 / Total 2.304.144; ningún importe 2026 en contextos, respuestas ni buscador.
- 19/10/2026: T4 `actualizar-todo.mjs --auto --solo siglo21` salió con código 0: Siglo 21 al día (vence 21/10/2026), buscador publicado.
- Siguen leyendo el archivo 2026 ya guardado, sólo para la lista de carreras: generar-buscador, publicar-precios-siglo21, calcular-precios-2027, cotizaciones-masivas-2027, generar-entrenador, relevar-financiacion, planilla-precios-siglo21.
- 19/10/2026: las 6 cuotas vuelven al mensaje 2027 (decisión del usuario: están en el Excel de CASA, y ahí valen total / 6, verificado con Abogacía 2026). El buscador las agrega debajo del total, salvo en valores de referencia vencidos, y `cotizar-2027` deja de quitarlas. Tests comerciales en verde.

## Pendiente

- El 22/10/2026 vence la promo 1A y 1B no tiene promo: el aviso vuelve a marcar fallo y el bot deja de cotizar hasta que Siglo 21 cargue la nueva.
