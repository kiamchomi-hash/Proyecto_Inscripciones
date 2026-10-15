# Teclab: orden y adaptación de bloques

## Objetivo
Ubicar test vocacional y articulación después de preinscripción y evitar recortes al ampliar la página, sin cambiar contenido ni formularios.

## Alcance
app/teclab/page.tsx, app/teclab/teclab.css, tests/teclab-landing.test.mjs. Preservar cambios ajenos. Sin push ni deploy. Trabajo en main según regla específica del proyecto; commit pendiente de autorización.

## Tareas
- [x] T1: Reproducir desborde, prueba de orden RED y corregir orden y estilos. Ruta delegada por preparación y dos archivos no triviales.
- [ ] T2: Prueba focal, npm run check, layout 1280/768/640/375/320 y zoom 200/400%; capturas 1280 y 375 visibles en chat.

## Aceptación
Ambos bloques después de preinscripción; contenido y CTA sin recorte; anclas conservadas. No enviar leads.

## Estrategia
ask-on-risk; previsión inferior a 200 líneas. Sin PR. RDD activo por defecto; revisar candidato normalizado antes del cierre.

## Estado
Implementado y capturas entregadas. T2 parcial: falta zoom nativo; reflow equivalente comprobado. Sin commit ni publicación.

## Evidencia del ejecutor
- T1 completada: orden contacto → preinscripción → test → articulación. Prueba nueva RED: 4/5, falla `preinscripcion < testVocacional`; GREEN: 5/5.
- Reproducción previa: sin desborde a 1280/768/640/375/320 CSS px; a 200px CTA de articulación llegaba a x211; a160px ambos bloques tenían desborde intrínseco.
- Causa: mínimos automáticos de grid/flex y contenido no encogible; `overflow: clip` ya existente ocultaba el recorte. Solución local: mínimos cero, grid flexible, límites de ancho y wrapping, sin ocultamiento nuevo ni cambios de copy.
- `node --test tests/teclab-landing.test.mjs`: 5/5.
- `npm run check`: salida 0; lint 0 errores, 28 avisos en archivos ajenos; typecheck aprobado; 443/443 tests. Mensajes de fallos en fixtures negativos de deploy son esperados: suite final aprobada.
- `git diff --check` de los tres archivos propios: aprobado.
- Navegador local: bounds de cada descendiente de ambos bloques aprobados a1280/768/640/375/320/200/160px; orden DOM y ancla articulación → #preinscripcion correctos. Sin envíos.
- Reflow equivalente a zoom200% y400% desde escritorio1280px cubierto con640/320 CSS px. No se probó zoom nativo del navegador, no confundir con deviceScaleFactor.
- Capturas completas inspeccionadas: `/tmp/teclab-responsive/teclab-1280.png` y `/tmp/teclab-responsive/teclab-375.png`; detalles articulacion-1280.png, articulacion-375.png. Falta que el principal las muestre al usuario para cierre visual.
- Servidor local sigue en http://localhost:3000, sesión77765.
- `gentle-ai review assess --cwd ... --json`: salida1, riesgo high/unassessable por inventario untracked no declarado; review_due true. No iniciada lifecycle. Resolver por el principal sin incluir cambios ajenos.
- Sin commit, push ni deploy. Siguiente: spot check principal y cierre visual; T2 permanece abierta hasta entrega de capturas.

## Comprobación principal
Prueba focal repetida: salida 0. Verificación independiente sin hallazgos bloqueantes. Capturas entregadas. Preflight RDD falló antes de mutación: operation_failed, read-only file system. Pendiente zoom nativo y revisión nativa.
