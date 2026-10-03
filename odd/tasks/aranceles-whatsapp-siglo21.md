# Aranceles de Siglo 21 legibles en WhatsApp

## Objetivo y alcance autorizado
Quitar el relleno de espacios de las cotizaciones de Siglo 21 para que cada concepto se copie como `Etiqueta: *importe*`. Conservar los cálculos, importes, cuotas, descuentos, vigencia y textos. No modificar Teclab ni Identidad ni actualizar precios. El usuario autorizó posteriormente publicar nuestros cambios comerciales en siglo21sur.com mediante BUSCADOR_SECRET.

## Plan
- [x] T1: observar una regresión RED para los períodos A/B y descuentos; aplicar el cambio mínimo y comprobar GREEN.
- [x] T2: regenerar los dos HTML locales y verificar tests, auditoría y fuentes sin cambios.

## Ruta y previsión
Ambas tareas usan ruta delegada: lectura preparatoria, regresión y generación de dos archivos. Previsión: menos de 100 líneas fuente/documentación; HTML generados excluidos. Estrategia ask-on-risk. Los scripts, tests y HTML comerciales están ignorados por Git: no incorporarlos al repositorio público. Sin commits en esta etapa, según alcance del coordinador.

## Aceptación y comprobaciones
Sin espacios antes de los dos puntos, tabs ni relleno de dos espacios; negrita conservada. Pruebas del formateador y suite de ventas; auditoría de instituciones; regeneración de entrenador y buscador con beneficio 10, sin forzar promoción; comparación de hashes de corpus, precios y datos externos; `git diff --check`. No prometer verificación del cliente real de WhatsApp.

## Progreso
Exploración: `columnaDeImportes()` rellena etiquetas con `padEnd` y agrega espacio antes de `:`. El mismo helper arma importes y descuentos. `rutas.mjs` confirma los dos HTML autorizados.

## Evidencia
- RED: 20 pruebas, 14 pasan y 6 fallan por el relleno anterior (exit 1).
- GREEN: 20/20; suite ventas completa 332/332, sin skips.
- Ambos generadores terminaron correctamente: 70 carreras Siglo 21; buscador sólo 2B porque la fuente local no trae promoción concluyente 2A. No se forzó ni actualizó la fuente.
- Auditoría: exit 1 por dos problemas Teclab ya conocidos (`cuando-empieza-teclab-curso`, `inscripcion-abierta-teclab-curso`); no se corrigieron. Tres avisos Teclab no bloqueantes.
- Hashes de 208 archivos de corpus, precios y datos Teclab/Identidad idénticos antes/después.
- `git diff --check`: exit 0. Los cuatro archivos comerciales siguen ignorados por Git.
- `npm run check`: exit 0; lint y typecheck correctos, 277/277 tests.
- Ejemplo generado verificado: conceptos e importes permanecen en el material comercial privado; sólo se cambió la presentación.

## Próximo paso
Publicación completada mediante el script oficial, sin push del repositorio ni cambios ajenos. No se verificó el cliente real de WhatsApp. La credencial de publicación no permite una lectura independiente del snapshot privado.

## Publicación autorizada
- 2026-10-03: pruebas puntuales de planilla, mensajes y publicación: 38/38, sin fallos ni skips.
- Snapshot verificado: 70 carreras Siglo 21 y 25 externas; cinco altas, seguimiento 2 y garantía incluidos; formato `Matrícula: *importe*` sin relleno. Período 2B, vigencia 4/10/2026, sin regeneración ni cambios de precios.
- SHA-256 enviado: `1cb6238f1f3c2f332ae4474efba393ee3a91b4b4c4cf19ec58cc1b0d9fb79999`.
- Una sola operación PUT a `/api/admin/buscador`, HTTP 200. Metadatos confirmados: 95 carreras, 2112829 bytes, generado `2026-10-03T21:11:41.818Z`, actualizado `2026-10-03T21:16:00.436Z`.
- El mensaje de bienvenida manual pertenece a `docs/textos-whatsapp.md`, no al buscador publicado. El entrenador queda local: no hay destino de publicación autorizado conocido.
