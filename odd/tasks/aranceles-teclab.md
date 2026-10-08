# Aranceles de carreras Teclab

## Objetivo y alcance autorizado
Aclarar la cobertura junto al arancel y cerrar con un paso hacia la inscripción. Sustituir la promesa genérica de seis cuotas por Visa o Mastercard bancarizada en uno o tres pagos sin interés. No modificar importes, descuentos, fuentes oficiales, otras instituciones ni mensajes de cursos (salvo el marcador compartido de financiación). Trabajo local, sin publicación ni commits de material comercial ignorado.

## Tareas y ruta
- [x] T1 Corregir financiación corta y prueba de regresión. Ruta delegada: lectura previa a escritura.
- [x] T2 Reordenar tres variantes del precio de carrera, agregar cierre, probar y regenerar ambas páginas. Ruta delegada: varios archivos no triviales.

## Aceptación y comprobaciones
RED antes de implementación; GREEN con los tests de financiación y bot; suite comercial completa; auditoría de instituciones; regeneración de entrenador y buscador con `--descuento-beneficio 10`, sin `--promocion`. Mantener guardia `preciosVigentes`, requisitos y omisión de inicio desconocido. Huellas de corpus Siglo 21/Identidad y fuentes Teclab sin cambios. Sin commits ni push: archivos comerciales ignorados y autorización sólo local. Pronóstico menor a 100 líneas propias; estrategia ask-on-risk.

## Fallas ambientales conocidas
Auditoría base: dos errores de vocabulario de Identidad en respuestas de curso Teclab `cuando-empieza-teclab-curso` e `inscripcion-abierta-teclab-curso`; fuera de alcance.

## Progreso
Implementación local finalizada; verificación global parcial. RED observado antes de implementar: fallaban las nuevas expectativas de financiación corta y orden/cierre. GREEN: 87/87 pruebas de bot y financiación. Suite comercial completa: 381 pruebas, 379 pasan y 2 fallan con timeout Playwright esperando Abogacía en `precios-lista-2027-buscador.test.mjs` (HTML offline 2027 y prioridad mensaje en vivo). No se atribuyen a la base sin comprobar. Auditoría conserva los dos errores base mencionados.

Ambos generadores terminan correctamente con `--descuento-beneficio 10`, sin promoción forzada. Páginas HTML: cero ocurrencias del marcador antiguo, marcador nuevo presente. Tres variantes renderizadas con contexto sintético; cobertura antes de financiación, sin fecha cuando falta inicio y bloqueo al faltar `preciosVigentes`. Huellas SHA256 de corpus Siglo 21/Identidad, financiación oficial y catálogo Teclab idénticas al inicio. No se renovaron importes ni fechas vencidas; retomado 08/10/2026. Cambios staged ajenos preservados. No `npm run check`: sin lógica versionada de sitio modificada; pruebas comerciales son las aplicables. No commit ni push: material comercial ignorado. Próximo paso: verificar por separado los dos timeouts de la suite; no ampliar alcance de esta corrección.

Mirror Engram: topic `odd/aranceles-teclab/tasks`, observación inicial 883.

## Cierre de entrega local (08/10/2026)
El usuario autorizó el commit del registro. Los archivos comerciales siguen ignorados y no se incluyen en el repositorio público. Verificación independiente: 87/87 pruebas focalizadas aprobadas; los dos timeouts de precios 2027 se deben a que el selector exacto «Abogacía» no coincide con «AbogacíaFecha vencida». No se corrigieron fuera de alcance. Antes del commit, `npm run check` aprobó lint (28 advertencias, cero errores), typecheck y 366/366 pruebas del sitio. La entrega no incluye publicación de las páginas comerciales ni cambios de formularios preparados en otros chats.
