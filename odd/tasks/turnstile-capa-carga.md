# Capa de carga de Turnstile

## Objetivo
Cubrir el widget visible mientras carga, en todos los consumidores, y revelarlo al estar listo sin alterar el modo invisible.

## Alcance autorizado
components/turnstile-widget.tsx y tests/turnstile-widget.test.mjs. Sin push ni cambios remotos. Trabajo sobre main según política del proyecto.

## Tareas
- [x] T1 — Corregir capa compartida y agregar regresión determinista. Ruta delegada: lectura preparatoria y lógica con tests.
- [x] T2 — Verificar npm run check y capturas desktop/mobile con widget simulado; registrar limitaciones y revisión nativa.

## Criterios
La carga tapa completamente el iframe incluso con fondos transparentes. Widget visible e interactivo después de carga, en tamaños normal y compacto. Invisible sin cambios.

## Comprobaciones
RED/GREEN de regresión cuando sea runnable; npm run check; capturas del modal Teclab y formulario compartido (1280 y 375 px). No enviar formularios reales.

## Entrega
ask-on-risk; previsión menor de 200 líneas; un commit coherente si todos los checks requeridos pasan. Sin publicación.

## Estado
Implementación y comprobaciones funcionales completas. Revisión nativa de riesgo medio omitida para este candidato por decisión explícita del usuario; commit y push autorizados. Cambios ajenos preservados: docs/herramientas.md y odd/tasks/precios-diarios-linux.md.

## Evidencia
- Causa: el marcador sin z-index queda detrás del iframe y el fondo semitransparente de Teclab deja verlo. Se mantiene la apariencia existente y se oculta el contenedor con visibility/opacity hasta load; el marcador usa z-10.
- El fallback de 10 s ahora también se arma si render() insertó el iframe inmediatamente. La carga y el desmontaje limpian timeout, observer y listener.
- RED: node --test tests/turnstile-widget.test.mjs, cuatro fallos observados antes de implementar. GREEN: cinco casos aprobados, componente TSX ejecutado con hooks/DOM controlados, sin red; incluye flexible/compact, iframe tardío, fallback e invisible.
- npm run check: lint sin errores (27 advertencias en archivos no modificados), typecheck aprobado, 342 tests aprobados. Repetido después de agregar opacity, aprobado.
- Navegador local con Playwright y mock Cloudflare: modal Teclab y Contacto a 1280/375 px, carga demorada y revelado después del load. Modal flexible a 1280/375 y compact a 300 px (iframe 150 px); botón dentro del iframe interactivo después de cargar, sin enviar formularios.
- Capturas fuera de git: screenshots/turnstile-carga/{teclab,contacto}-{1280,375}-{cargando,listo}.png. Detalles del modal: teclab-{1280,375}-{cargando,listo}-detalle.png.
- Limitación: el desafío real de Cloudflare no se ejercitó; modo invisible verificado por ejecución determinista, no con desafío real de navegador.
- Sin push, cambios remotos ni commit por el trabajador. T2 cerrada: spot check del coordinador, 5/5 tests y captura móvil revisada. Revisión omitida sólo para este candidato (declined_this_candidate), sin aprobación fabricada.
