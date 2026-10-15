# Computación: orden y espaciado

**Estado general: en curso. Publicación de avance; no cerrar ni marcar completada la tarea.**

## Entrega actual autorizada
El usuario autorizó commit y push del avance de Computación, sin cerrar la tarea ni modificar PENDIENTES.md. Commit y push pendientes de ejecución por el coordinador. La revisión nativa sigue no disponible por el fallo previo de sistema de archivos de sólo lectura; no se reintenta ni se cambia su modo. Los registros siguientes conservan la evidencia histórica de cada ajuste.

## Objetivo y problema
Acercar el contenido útil al inicio, integrar el regreso al encabezado y separar el estado vacío del borde inferior, sólo en Computación.

## Alcance autorizado
- app/clases-apoyo/[materia]/page.tsx
- app/clases-apoyo/computacion.css
- components/clases-apoyo/computacion/computacion-pixel.tsx
- components/clases-apoyo/navegacion-materia.tsx
- components/clases-apoyo/reserva/reserva-clase.tsx
- tests/materias-independientes.test.mjs

## Restricciones y entrega
Preservar el diseño pixel, el contenido existente, las demás materias y los cambios ajenos. Sin formularios reales ni publicación. Trabajo sobre main por regla específica del proyecto. Una unidad coherente; previsión menor a 200 líneas. Estrategia ask-on-risk. Commit y revisión pendientes del coordinador.

## Tareas
- [x] T1 — Integrar regreso en encabezado, subir herramientas y texto existente antes de la reserva, corregir aire inferior.
  - Ruta: delegada; preparación de escritura y varios archivos.
  - Aceptación: enlace accesible compacto; herramientas y descripción antes del calendario; sin texto duplicado; aire inferior visible; selección de días funcional; sin overflow a 375 y 1280 px.
  - Checks: node --test tests/materias-independientes.test.mjs (RED/GREEN), npm run check, capturas de página completa y prueba local de selección sin envío.

## Progreso y siguiente paso
Implementado y verificado; commit y revisión pendientes del coordinador.
- Regresión: node --test --test-isolation=none tests/materias-independientes.test.mjs: RED (4 pasan, 1 falla por falta del encabezado compacto); GREEN (5/5).
- npm run check: primer intento restringido falló en cuatro archivos que ejecutan subprocesos. Repetido con permiso fuera del sandbox: lint sin errores (28 advertencias previas), typecheck OK, 444/444 tests OK.
- git diff --check: OK.
- QA en servidor existente localhost:3000: 1280 y 375 px sin overflow horizontal; descripción única y anterior al calendario; herramientas antes de descripción. Seleccionar el 16/10/2026 muestra doce horarios, deseleccionar restituye estado vacío; separación inferior medida 35,2 px en móvil. Sin envíos.
- Capturas completas: computacion-orden-desktop.png y computacion-orden-mobile.png en el directorio temporal (artefactos locales, no versionados).
- Consola dev: aviso CSP sobre eval de React en desarrollo; no se cambió la política.
- Diff de código/prueba: cinco archivos, 55 altas y 19 bajas. No se tocó reserva-clase.tsx ni cambios ajenos.
- Estrategia ask-on-risk sin umbral alcanzado; commit/revisión/publicación pendientes. Siguiente paso: revisión del coordinador y entrega visual al usuario.

## Cierre de la comprobación
- Verificación independiente: sin hallazgos bloqueantes; regresión 5/5 y diff sin errores. El coordinador repitió la regresión: 5/5.
- Revisión nativa no disponible: STATUS falló de forma segura antes de mutar, por sistema de archivos de sólo lectura. No se reintentó ni se modificó el modo de revisión.
- Sin commit ni publicación; cambios locales listos para revisión visual del usuario.

## T2 — Logos y nuevo orden solicitado
- [x] Incorporar logos originales a Programación, conservar Python disponible y seis tecnologías próximas.
- [x] Mover Sobre las clases de Computación debajo de toda la reserva (calendario y horarios).
Ruta delegada por preparación y varios archivos. Aceptación: recursos locales seguros, proporciones y colores originales, sin desborde a 375/1280 px; herramientas y programación antes de reservar, descripción después. El pedido actual reemplaza expresamente el orden anterior de T1. Verificación: regresión RED/GREEN, npm run check, diff --check, QA y capturas. Sin commit/push; revisión nativa no se reintenta por fallo pre_native previo.

### Evidencia de T2
Regresión RED: dos fallos esperados (orden anterior y .py sin logos); GREEN: 7/7. Diff sin errores. QA local: siete logos cargados y completos, seis próximas estáticas sin botones/enlaces; sin overflow a 375/1280 px. Descripción después de toda la reserva, separación 22,75 px. Seleccionar 16/10/2026 muestra doce horarios; deseleccionar vuelve al estado vacío; no se enviaron formularios. Capturas completas computacion-logos-desktop.png y computacion-logos-mobile.png, en temporal, revisadas visualmente.
Fuentes y licencias: referencias/2026-10-15-computacion-logos.md. Python/PostgreSQL: SVG compactos Devicon MIT, marcas originales; C++: isocpp/logos (Jeremy Kratz, Standard C++ Foundation, sin presumir licencia abierta no declarada); HTML5: W3C CC BY 3.0; CSS: CSS-Next CC0; JavaScript: comunidad JSConf MIT; SQL: símbolo neutro propio, no marca de proveedor. Licencias MIT/CC0 conservadas con los recursos.
Check restringido: lint sin errores (28 advertencias), tipos correctos, cuatro pruebas con subprocesos fallan por sandbox (deploy/pre-push/secretos/supabase-local-safety). Repetición aprobada: npm run check finalizó con lint sin errores (28 advertencias), tipos correctos y 446/446 pruebas. Sin commit/push ni cambio del modo de revisión. Próximo paso: entregar capturas al usuario. Commit/revisión nativa pendientes por política de coordinación.

## T3 — Contacto inicial y programación descriptiva
- [x] Subir el único bloque de consultas por WhatsApp inmediatamente debajo del encabezado.
- [x] Quitar fondos y sombras añadidos a los logos de Programación, sin alterar marcas ni las herramientas existentes.
- [x] Describir Python y cada tecnología próxima sin inventar temario, duración ni prestaciones.
Ruta delegada: preparación y cambios en varios archivos. Alcance: herramientas.tsx, computacion-pixel.tsx, computacion.css y regresión de materias independientes. Se preservan la reserva y la descripción posterior. Pronóstico menor a 150 líneas nuevas. Sin commit/push por coordinación. Revisión nativa no reintentada por fallo pre_native previo.
Causa comprobada: el SVG de Python no tiene panel externo; el fondo crema y sombra vienen del contenedor compartido .hr-ficha-logo. Las tarjetas futuras también agregan un panel con fondo y borde; se retiran sólo en .pg. Los escudos y cuadrados propios de las marcas se conservan.
Checks realizados: regresión RED/GREEN, npm run check, diff --check y QA local a 375/1280 px con capturas completas desde arriba.

### Evidencia de T3
Regresión RED: fallaron los dos casos esperados (Python sin descripción y contacto al final); GREEN 8/8. npm run check: primera ejecución restringida falló en deploy/pre-push/secretos/supabase-local-safety por subprocesos; repetición aprobada completó lint (0 errores, 28 advertencias), tipos correctos y 447/447 pruebas. git diff --check aprobado.
QA local en servidor existente localhost:3000: orden encabezado → contacto único → herramientas → Programación → reserva completa → Sobre las clases; fondos calculados del contenedor Python y próximas transparentes, sombra Python none; siete logos cargados; seis próximas sin controles. Sin overflow a 375/1280 px. Seleccionar 16/10/2026 muestra doce horarios; deseleccionar restituye estado vacío. Sin envíos ni navegación externa.
Capturas completas desde scrollY=0 y con imágenes/fuentes estables: computacion-pulido-desktop.png y computacion-pulido-mobile.png en temporal, inspeccionadas visualmente. Overlay de Next oculto sólo para captura. La primera espera de decode de imágenes diferidas se destrabó cargándolas eager sólo en el navegador; Chromium local no pudo arrancar por sandbox y no se reintentó, se usó el navegador conectado disponible. No se cambió el servidor.
Copy Python: «Python para dar tus primeros pasos en programación y automatizar tareas.» Próximas: C++ desarrolla software; HTML estructura contenido; CSS estilos y diseño; JavaScript interactividad; PostgreSQL sistema relacional; SQL consultas. Marcas originales preservadas, ninguna modificación de SVG ni de herramientas productivas.
Sin commit, push ni revisión nativa reintentada; próximo paso: mostrar capturas y revisión final del coordinador.
