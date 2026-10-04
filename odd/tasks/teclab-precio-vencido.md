# Precio vencido de Teclab como referencia

## Objetivo y motivo
Mostrar la última promoción vencida como referencia, sin presentarla como una oferta vigente.

## Alcance autorizado
- components/formularios/casas.ts
- components/index/ver-precio-teclab.tsx
- tests/ver-precio.test.mjs
- tests/enlace-inscripcion.test.mjs
- odd/tasks/teclab-precio-vencido.md

Sólo cambios locales. Sin escrituras remotas, deploy, commits ni push por el ejecutor.

## Plan
- [x] T1: Conservar los montos saneados en la respuesta vencida y mostrarlos con aviso, sin financiación. Mantener los estados vigente y sin precio. Implementación y comprobaciones iniciales completas; commit bc5710495aa984c5af84d7c0448c4c9d80688aac. Ajuste posterior solicitado: botón «Quiero inscribirme» arriba de WhatsApp, sin modificar precios ni API; commit del ajuste pendiente.

Ruta: delegada directa; requiere lectura preparatoria y cambios en varios archivos.
Pronóstico: aproximadamente 150 líneas editadas. Entrega: ask-on-risk.
Commit: bc5710495aa984c5af84d7c0448c4c9d80688aac. Evaluación nativa: medium, under_budget; no corresponde iniciar revisión de este tramo (145 líneas con documento).

## Aceptación
- Estado vencido conserva vigencia original y montos saneados.
- Aviso visible: promoción vencida y valores sólo de referencia.
- Actualización prevista el 5 de octubre alrededor de las 8 h; aviso omitido desde 2026-10-05T11:00:00Z.
- Sin financiación para vencido; por pedido explícito posterior, botón «Quiero inscribirme» arriba de WhatsApp cuando hay slug, dirigido al formulario existente. WhatsApp sigue sólido.
- Sin cambios de mails, vigencia inclusiva en Argentina ni comportamiento de preinscripción.
- Estados vigente y sin precio conservados.

## Comprobaciones
- RED y GREEN: node --test tests/ver-precio.test.mjs.
- npm run check.
- UI simulada local y capturas escritorio 1280 / móvil 375 si disponible.

## Evidencia
- RED previo documentado: `node --test tests/ver-precio.test.mjs`, 22 pruebas, 18 aprobadas y 4 fallidas por ausencia de montos vencidos (`teclab-red.log`, artefacto temporal no versionado).
- GREEN final: `node --test tests/ver-precio.test.mjs tests/enlace-inscripcion.test.mjs`, 41/41 aprobadas.
- `npm run check`: salida 0; lint sin errores y con 27 advertencias, typecheck aprobado, 327/327 pruebas aprobadas. Primer intento interrumpido con salida 143 durante lint; repetición completa aprobada.
- `git diff --check`: aprobado. Cambios de código y pruebas: 100 líneas agregadas más eliminadas (69 agregadas, 31 eliminadas); documento no incluido en ese conteo.
- UI local simulada con el componente real y sus estilos (`modales.css` y `globals.css` compilado), sin tráfico de producción ni POST. Estados vencido (1280/375), vigente (375) y sin precio (375) comprobados. Capturas `teclab-vencido-1280.png` y `teclab-vencido-375.png` en artefactos temporales del ejecutor, para entrega por el coordinador.
- Lectura de código: el vencido conserva el saneamiento, fecha inclusiva argentina, registro de lead y estado diferenciado; no muestra financiación. La preinscripción mantiene su lógica basada en el estado, con DTO actualizado en su prueba.
- Sin commit ni push del ejecutor. Evaluación del commit: medium, review_due=false, under_budget. Prueba focal repetida por coordinador: 41/41.
- Ajuste posterior del CTA: RED de UI simulada observado antes del cambio («falta CTA inscripción»); GREEN con href exacto, orden visual encima de WhatsApp y omisión sin slug. UI revisada en 1280/375; estados vigente y sin precio conservados. Pruebas focales repetidas: 41/41. `npm run check` del ajuste: salida 0, 327/327 pruebas, typecheck aprobado y lint con 27 advertencias sin errores. `git diff --check` aprobado.

## Próximo paso
Coordinador entrega capturas actualizadas y resuelve commit del ajuste. Publicación pendiente de autorización; no se realizó push.
