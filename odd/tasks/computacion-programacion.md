# Computación: programación independiente

**Estado general: en curso. Publicación de avance; no cerrar ni marcar completada la tarea.**

## Entrega actual autorizada
El usuario autorizó commit y push del avance de Computación, sin cerrar la tarea ni modificar PENDIENTES.md. Commit y push pendientes de ejecución por el coordinador. La revisión nativa sigue no disponible por el fallo previo de sistema de archivos de sólo lectura; no se reintenta ni se cambia su modo. Los registros siguientes conservan la evidencia histórica de cada ajuste.

## Objetivo y alcance
Separar Programación de las herramientas de Computación, con Python disponible y C++, HTML, CSS, JavaScript, PostgreSQL y SQL como Próximamente. Sin nueva página, reserva ni cambios en la base. Conservar las correcciones locales previas y los archivos ajenos.

## Tareas
- [x] T1: agregar bloque independiente con el estilo pixel existente; verificar estados y adaptación móvil.

## Criterios de aceptación
Python disponible; seis tecnologías próximas sin controles de reserva; encabezado y herramientas antes del calendario; sin desborde horizontal a 375 y 1280 px.

## Superficies autorizadas
- components/clases-apoyo/computacion/herramientas.tsx
- components/clases-apoyo/computacion/computacion-pixel.tsx
- app/clases-apoyo/computacion.css
- tests/materias-independientes.test.mjs
- odd/tasks/computacion-programacion.md

## Ruta y entrega
T1 delegada: preparación y cambios en varios archivos. Pronóstico menor a 200 líneas autorales. Estrategia ask-on-risk. Sin commit ni push por instrucción del coordinador; revisión nativa pendiente por fallo previo pre_native de permisos.

## Verificación
Test estructural RED → GREEN con node --test --test-isolation=none tests/materias-independientes.test.mjs; npm run check; git diff --check; navegador localhost y capturas de página completa a 1280/375 px.

## Progreso
Implementación y comprobaciones observadas. RED: 5/6, falló el caso nuevo antes de implementar. GREEN: 6/6. npm run check aprobado: lint sin errores (28 advertencias), tipos correctos y 445/445 pruebas. La primera corrida restringida falló en deploy, pre-push, secretos y supabase-local-safety; la ejecución aprobada fuera de esas restricciones pasó completa. git diff --check sin errores. Navegador local: scrollWidth = innerWidth a 1280 y 375 px; seis tecnologías próximas, ninguna con controles de reserva. Capturas completas revisadas en /tmp (escritorio y celular). No se tocó el servidor ni se enviaron formularios.

Commit y revisión nativa pendientes del coordinador, sin push. Próximo paso: mostrar capturas al usuario y cerrar según la política del repositorio.

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

## T4 — Restituir casillas rectangulares
- [x] Encerrar logo y nombre de cada tecnología próxima en la misma casilla rectangular de las herramientas; conservar las descripciones fuera de la casilla y el estado Próximamente.
Ruta delegada, corrección acotada. El fondo transparente del logo no implica eliminar el rectángulo exterior: T3 confundió ambas superficies. Se conserva Python sin panel crema, contacto inicial y reserva sin cambios. Comprobaciones: regresión RED/GREEN, lint, tipos, diff y capturas 1280/375 px. Sin commit ni push.

### Evidencia de T4
Regresión observada RED antes de implementar (casillas ausentes) y GREEN 9/9 después. Se reutilizan hr-casilla, hr-casilla-logo y hr-casilla-nombre: mismos bordes, fondo oscuro y letra pixel que las herramientas. Descripciones y Próximamente quedan debajo de cada casilla. No son botones ni reciben hover que sugiera interacción. Python conserva el logo transparente sin panel crema. WhatsApp y orden de reserva no se tocaron. Capturas pendientes del coordinador: tanto Playwright como Chrome DevTools rechazaron acceso al perfil ya en uso; no se cerró ni reinició ningún navegador.

Lint focalizado y tsc --noEmit aprobados; git diff --check aprobado. QA final con Chromium local separado en localhost:3000: seis casillas con borde 3px y mismo fondo rgb(12,59,49), sin desborde a 1280/375 px. Capturas completas computacion-tarjetas-desktop.png y computacion-tarjetas-mobile.png; detalle computacion-tarjetas-detalle.png. Se inició servidor auxiliar en 3001 al estar 3000 ocupado, sin tocar el servidor existente; capturas tomadas en 3000.

## T5 — Selección de tecnologías en el cuadro superior
- [x] Reemplazar las fichas estáticas por siete casillas seleccionables, Python inicial, descripción y estado únicamente en la ficha superior.
Ruta delegada por preparación y cambios en componente, estilos y regresión. La aclaración del usuario reemplaza la decisión de T4 de usar casillas estáticas y descripciones inferiores: no era un requisito del usuario. Se replica Herramientas con botones nativos, aria-pressed y fichas siempre montadas para mantener la altura. Próximamente es informativo y no habilita reservas. Se conservan WhatsApp inicial, logos transparentes y descripción después de la reserva. Sin commit/push ni reintento de revisión nativa. Checks: RED/GREEN focalizado, npm run check, diff --check, siete selecciones y teclado en navegador local y capturas 1280/375 px.

### Evidencia de T5
RED observado 6/9 antes de implementar (tres regresiones); GREEN 9/9. Siete casillas nativas con aria-pressed, selección inicial Python y un único estado activo. La ficha superior actualiza logo, nombre, descripción y Disponible/Próximamente. No quedan textos bajo las casillas ni se agregan controles de reserva. Se conserva transparencia de logos y borde de la ficha. QA local Playwright: siete selecciones, retorno a Python y Tab+Enter/Space aprobados en 1280/375 px; altura estable de Programación 325,5/649,84 px; sin overflow. Capturas completas desde scrollY=0 y sin overlay: /tmp/computacion-selector-desktop.png y /tmp/computacion-selector-mobile.png; detalles Python y JavaScript en computacion-selector-python.png y computacion-selector-detalle.png, inspeccionados. No se enviaron formularios ni se alteraron servidores. Chromium restringido falló por sandbox; repetición aprobada y aislada pasó.
Suite completa: npm run check aprobado fuera de restricciones de subprocesos: lint 0 errores/28 advertencias, tipos correctos y 448/448 pruebas. Primera corrida restringida: cuatro fallos ambientales en deploy/pre-push/secretos/supabase-local-safety. git diff --check aprobado. Sin commit/push ni revisión nativa reintentada. Próximo paso: entrega de capturas por el coordinador.

## T6 — Igualar exactamente la superficie visual
- [x] Reutilizar escena, ficha e inventario de Herramientas sin variantes de fondo, columnas ni espaciado.
Ruta delegada. Causa comprobada: .pg-escena reemplazaba .hr-escena (sin trama), .pg-inventario imponía 7/3/2 columnas frente a 12/6/4, y .pg .hr-ficha-logo retiraba fondo y sombra. La petición actual de identidad visual reemplaza esas excepciones anteriores. Mantener selección, estados y marcas originales; comprobar igualdad calculada a 1280/375 px. Sin commit/push.

### Evidencia de T6
RED observado: 7/9; fallaron la igualdad de superficies y las clases de casillas. GREEN: 9/9. Eliminadas variantes pg-escena, pg-inventario y pg-casilla; reutilizadas hr-escena, hr-fichas, hr-inventario y hr-casilla sin overrides de fondo/bordes/columnas. Los nombres largos parten en dos líneas, igual que PowerPoint. grid-auto-rows:1fr compartido iguala todas las filas: la QA detectó que la primera fila móvil de Programación era menor sin esta regla.
Igualdad calculada de fondo, borde, sombra, padding, gap y grilla en escena/ficha/logo/inventario/casillas en 1280 y 375 px; casillas 78,328125 × 86,15625 px en escritorio y 68 × 86,15625 px en celular. Columnas 12/6/4 compartidas; redondeos subpíxel normalizados a décima sólo al comparar grillas. Ficha y trama idénticas; sólo contenido y estado difieren. Siete selecciones, Enter/Space, altura estable y sin overflow aprobados. WhatsApp y reserva intactos, ningún formulario enviado. Capturas completas computacion-identico-desktop.png y computacion-identico-mobile.png y comparación de ambos bloques computacion-identico-comparacion.png, en temporal; inspeccionadas visualmente.
npm run check aprobado: lint sin errores (28 advertencias), tipos correctos, 448/448 pruebas. Primera corrida restringida: cuatro fallos de subprocesos conocidos; repetición aprobada completa. Chromium restringido falló por sandbox; repetición local aislada aprobada. git diff --check aprobado. Sin commit/push ni revisión nativa reintentada. Próximo paso: entrega visual por el coordinador.
