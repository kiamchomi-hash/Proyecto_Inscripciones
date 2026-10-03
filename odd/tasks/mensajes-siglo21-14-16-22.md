# Mensajes de Siglo 21: pendientes 14, 16 y 22

Actualizar la atención comercial de Siglo 21, sin modificar Teclab ni diseño.

## Alcance autorizado

- Segundo seguimiento complementario, sin fechas ni precios no confirmados.
- Bienvenida manual sólo para inscripción confirmada, sin automatizaciones.
- Garantía de adaptación con condiciones verificadas en La Nube 21 y Reglamento 14.3.C; disponible en el corpus general sin universalizarla.
- No cambiar motor, fuentes de precios, credenciales ni archivos ajenos. Material comercial gitignorado permanece local.

## Tareas

- [x] T14: segundo seguimiento de Siglo 21 agregado, primer seguimiento intacto; aislamiento comprobado. El pendiente global de otras casas permanece abierto.
- [x] T16: bienvenida manual corregida, sólo para inscripción confirmada; no representa un envío automático.
- [x] T22: intención específica de garantía agregada a Siglo 21 y disponible en General, fuentes registradas y condiciones comprobadas.
- [x] Tdiag: diagnóstico y comentario corregidos; datos, oferta, precios, períodos y HTML intactos, con RED/GREEN observado.

## Ruta y unidad de trabajo

Delegada: lectura preparatoria y múltiples archivos no triviales. Una unidad coherente de mensajes comerciales con tres resultados comprobables. Trabajar en main por regla específica del proyecto, sin ramas ni PRs. No publicar ni hacer push. Estrategia ask-on-risk; estimación menor de 200 líneas versionadas. Corpus, pruebas comerciales y HTML no se fuerzan a git.

## Criterios y verificaciones

Observar RED en la prueba local nueva antes de implementar y GREEN después. Ejecutar pruebas comerciales completas, auditoría institucional, ambos generadores con --descuento-beneficio 10 y npm run check. Revisar ambos HTML, preguntas de garantía y corpus de otras casas sin cambios. No pasar --promocion ni actualizar precios. Registrar cualquier fallo preexistente o dato local vencido sin arreglos fuera de alcance.

## Evidencia y siguiente paso

Fuentes públicas verificadas el 03/10/2026: La Nube 21, becas y beneficios (widget público), y Reglamento Institucional 14.3.C. Sin vigencia comercial inventada. Espejo inicial Engram #542 confirmado por el padre; el espejo de esta actualización debe sincronizarlo el padre.

- RED observado: prueba nueva antes de la implementación, exit 1 por ausencia del segundo seguimiento, intención de garantía y condición de bienvenida.
- GREEN: `node --test herramientas/ventas/tests/mensajes-siglo21.test.mjs`, 9/9, exit 0. Se ajustó el chequeo de números para no confundir el nombre institucional «Siglo 21» con una fecha o importe.
- `node --test herramientas/ventas/tests/*.test.mjs`: 321/321, sin skips, exit 0.
- `node herramientas/ventas/auditar-instituciones.mjs`: exit 1, dos problemas preexistentes de vocabulario en Teclab (`cuando-empieza` e `inscripcion-abierta`); sin problemas nuevos en Siglo 21. No se corrigieron fuera de alcance.
- Ambos generadores con `--descuento-beneficio 10`: exit 0; HTML nuevos contienen segundo seguimiento y garantía. Buscador informa 65 carreras, una sin precio y ocho sin ficha; sólo 2B porque 2A local no trae tabla de promociones. Sin actualizar fuentes ni forzar promociones.
- `npm run check`: exit 0, lint + typecheck + 242 tests, sin skips. No incluye tests comerciales locales.
- `git diff --check` sobre documentación propia: exit 0.
- Hashes SHA-256 antes/después idénticos: Teclab `42e0be8d2b68bf61e2d67bc9dcf068691e4387a4c906dcf7406a1f9e7a504c8c`; Identidad `bd5c6e1c8b5db7f5bd0c78590415801810adc936d91bf6d13c2b6858e4b19bce`; común `b02e389ef78c68d848a2bd4c2f96e871dbb907433862c5839d0e310197c06300`.

**Estado de la unidad: parcial por auditoría institucional fallida fuera del alcance.** Los tres resultados solicitados tienen prueba local; no se declara auditoría global limpia ni publicación. Corpus, test comercial y HTML siguen gitignorados y no se fuerzan al repo público.

Verificación independiente: prueba focalizada 9/9 y suite comercial 321/321; respuestas embebidas coinciden en ambos HTML. Condiciones de garantía contrastadas nuevamente contra fuentes oficiales. Hashes de las otras casas coinciden.

Investigación posterior concluida: los ocho casos `sinFicha` son exclusiones explícitas por alias `null`, no extracciones fallidas. Nutrición tiene ficha académica sin fila de precios y la oferta oficial actual es presencial en Córdoba. 2A tiene importes base, pero no promoción comprobable; cotizar 2B es coherente con el calendario actual. No se infiere oferta del CAU de la oferta general universitaria, ni se declara pérdida de contenido previa sin HTML anterior.

RDD: evaluación del árbol actual no concluyente por numerosos archivos ajenos sin seguimiento; devuelve high/unassessable. Se realizó verificación independiente del alcance propio, no se inició revisión de cambios ajenos. Commit local y revisión de un candidato aislado pendientes; unidad no cerrada por comprobaciones parciales. Sin commit ni push. Espejo actualizado por el padre.

## Corrección autorizada del diagnóstico

Tdiag sigue ruta delegada. Agregar función pura de diagnóstico y usarla en stdout; corregir comentario que promete mostrar fichas sin precio. Mantener `sinFicha` en los datos por compatibilidad, distinguir su contador como exclusiones deliberadas por alias y el de `sinPrecio` como fichas sin fila en la planilla. No cambiar catálogo, precios, períodos, corpus ni HTML.

Evidencia Tdiag: test con fixture RED, exit 1 por función de diagnóstico ausente; GREEN 2/2, exit 0. Suite comercial 323/323, sin skips, exit 0; `node --check herramientas/ventas/generar-buscador.mjs`, exit 0. El resultado real es 65 carreras, una ficha sin fila de precios y ocho excluidas por alias. `sinFicha` sigue en los datos por compatibilidad; sólo stdout usa los rótulos veraces `fichasSinFilaDePrecios` y `excluidasPorAlias`.

Datos devueltos por `construirDatos` byte-equivalentes antes/después al excluir únicamente su timestamp de ejecución: SHA-256 `3fcfcf260fe3f133d2547c951c5877248cb01293d538e6f2bb8e03ba7d1ba027`. Hashes de ambos HTML y fuente de precios también idénticos. No se ejecutó el generador mutante ni se regeneraron páginas/corpus. No aplica `npm run check` raíz a estos scripts comerciales ignorados fuera del bundle. Sin commit ni push. Siguiente paso: padre revisa cambio local, confirma espejo y evalúa cierre; la auditoría ajena de Teclab permanece fuera del alcance.
