# Tarjetas de clases de apoyo

## Objetivo y alcance autorizado
Corregir desplazamiento en hover, superposición de nombre/flecha en Otras materias y tamaño/desborde de Computación en /clases-apoyo. Preservar textos y enlaces; no cambiar contenido académico ni agregar copy.

## Tareas
- [x] T1 Corregir layout y hover de tarjetas relacionadas y encabezados de landing. Ruta delegada: CSS y JSX no triviales; preparación y verificación visual requieren lectura enfocada.
- [x] T2 Verificar regresiones, geometría y capturas a 375, 1021 y 1280 px; mostrar capturas al usuario.
- [x] T3 Convertir el ícono de la landing en un sello grande a la izquierda, recortado y con profundidad; mostrar capturas. Ruta delegada por preparación CSS y verificación visual.

## Criterios y controles
Títulos legibles completos, flecha sin superposición, tarjetas inmóviles en hover. Prueba focal con RED/GREEN cuando sea significativa y npm run check. Inspección visual de ambas páginas. Preservar cambios ajenos.

## Entrega
Limpieza localizada estimada menor a 200 líneas, estrategia ask-on-risk. Proyecto trabaja directo en main; no crear ramas ni publicar. Commit y push autorizados explícitamente por el usuario al cerrar los ajustes visuales.

## Progreso
Exploración CodeGraph terminada: tarjetas relacionadas de mínimo 150 px comparten foto, nombre y flecha; landing tiene encabezado en dos columnas que reduce ancho del título. RDD desactivado globalmente. Implementación completada, sin commit.

## Evidencia observada
- RED: ejecución directa `node tests/materias-independientes.test.mjs` falló en las dos regresiones antes de corregir CSS/JSX. El runner dentro del sandbox no mostró diagnóstico útil.
- GREEN: `node --test tests/materias-independientes.test.mjs tests/materia-datos.test.mjs` fuera del sandbox: 21/21.
- `git diff --check` sobre los tres archivos propios: aprobado.
- Chromium: ambas rutas a 375, 1021 y 1280 px; títulos completos, flechas sin intersección y bounding box de tarjetas idéntico antes/después de hover.
- Capturas completas inspeccionadas fuera del repositorio: apoyo-clases-apoyo-375.png, apoyo-clases-apoyo-1280.png, apoyo-computacion-375.png y apoyo-computacion-1280.png. Mostradas al usuario en el chat por el principal.
- npm run check: lint sin errores (27 advertencias existentes), typecheck aprobado. En sandbox fallaron cuatro suites con procesos; repetición fuera del sandbox aprobada: 546/546 tests, código de salida 0.
- No se alteraron textos, enlaces, contenido académico ni cambios ajenos.

- Verificación independiente: 21/21 pruebas directas; Chromium en ambas rutas a 375/1021/1280 sin recorte, superposición ni movimiento; foco y enlaces preservados.
- Spot check principal: prueba focal repetida sin fallos e inspección visual de capturas. Evaluación nativa no disponible por inventario de archivos ajenos sin seguimiento; tratado como riesgo alto y aplicado verificador independiente, sin iniciar RDD (apagado).
- Tareas cerradas con evidencia funcional y visual; sin commit ni publicación.

## Ajuste T3 autorizado
El usuario eligió un ícono grande alineado a la izquierda, parcialmente oculto por el borde y con profundidad. Se reutiliza el SVG existente como capa decorativa de 200 px a -3 rem del borde izquierdo, opacidad 0.14, sin chip, borde ni movimiento. Dos sombras del trazo aportan relieve sin afectar el texto. No se cambia copy ni contenido.

### Evidencia T3
- RED: la regresión del sello falló antes del cambio; GREEN: `node tests/materias-independientes.test.mjs`, 12/12.
- Chromium a 375/1021/1280: siete títulos completos, sello de 200 px recortado a la izquierda, fondo transparente y borde 0; no hay desborde horizontal y la tarjeta conserva idéntica geometría en hover.
- Capturas completas de landing a 375 y 1280 y recorte de las tarjetas a 1280, inspeccionadas visualmente. Mostradas en el chat.
- `git diff --check` de CSS y prueba: aprobado.
- `npm run check` en sandbox: lint sin errores (27 advertencias previas), typecheck aprobado; cuatro suites con subprocesos fallaron. Repetición fuera del sandbox aprobada: 547/547 pruebas, typecheck aprobado y lint sin errores (27 advertencias previas).
- Sin commit ni publicación.

T3: capturas mostradas en chat (detalle y enlaces completos). Verificación independiente 12/12 y Chromium a 375/1021/1280: siete títulos completos, sello de 200px recortado a izquierda, opacidad .14, capas aisladas, sin movimiento ni intercepción de clics. Check completo 547/547 fuera sandbox; sin publicación ni commit.

## Ajuste T4 autorizado
Centrar horizontalmente los títulos de las tarjetas de la landing, sin cambiar sello ni contenido. Cambio acotado a `text-align: center` en `.ca-materia-titulo`.

### Evidencia T4
- `node tests/materias-independientes.test.mjs`: 12/12 aprobadas.
- `git diff --check` sobre CSS: aprobado.
- Chromium a 375, 1021 y 1280 px: los siete títulos tienen alineación centrada y ancho de contenido sin desborde. Sello izquierdo y profundidad preservados.
- Capturas completas a 375/1280 y detalle de tarjetas a 1280 inspeccionados; mostradas en el chat.
- No se corrió nuevamente `npm run check` completo por tratarse de una sola propiedad CSS; no hubo commit ni publicación.

## Ajuste T5 autorizado
Quitar la caja translúcida y el borde de «Ver horarios», agrandar el texto y conservar la flecha. Reducir la presencia del sello y retirar el brillo/sombras de las tarjetas, dejando el relieve en el sello. No se modifican textos, colores por materia, títulos centrados ni enlaces.

### Evidencia T5
- RED: la prueba del sello actualizado y la nueva regresión de acción sin caja fallaron antes de modificar CSS.
- GREEN: `node tests/materias-independientes.test.mjs`: 13/13 aprobadas.
- Chromium a 375, 1021 y 1280 px: siete títulos centrados sin recorte, acción con fondo transparente y borde 0, texto aumentado de 0.59rem a 0.8rem; sello a la izquierda de 200px y opacidad 0.10, tarjeta sin sombras, geometría estable en hover.
- Capturas completas a 375/1280 y detalle de tarjetas a 1280 inspeccionados; mostradas en el chat. Indicador de desarrollo oculto sólo en el navegador de captura.
- `git diff --check` de CSS y prueba: aprobado.
- `npm run check` en sandbox falla las cuatro suites conocidas de subprocesos; repetición fuera del sandbox aprobada: 548/548 pruebas, typecheck aprobado, lint sin errores (27 advertencias previas).
- Sin commit ni publicación.

## Ajuste T6 autorizado
Ocultar las descripciones sólo en las tarjetas de la landing, agrandar el título y centrarlo en ambos ejes dentro del cuerpo. Mantener la acción al pie en un contenedor sólido, opaco y del mismo color para todas las tarjetas activas. La aclaración del usuario aplica el color común sólo a «Ver horarios», no a las superficies por materia. Se conserva el sello izquierdo y el contenido de las páginas de detalle.

### Evidencia T6
- CSS únicamente: las descripciones existentes quedan con `display: none` en la landing, sin borrar datos ni modificar JSX/SEO o páginas de detalle.
- RED observado: dos regresiones fallaron antes de ajustar tamaño, filas y acción sólida. GREEN: `node tests/materias-independientes.test.mjs`, 14/14 aprobadas.
- Chromium a 375, 1021 y 1280 px: siete títulos completos centrados en el cuerpo (error geométrico menor a 0.01 px), descripciones ocultas, sin desborde horizontal; acción opaca `rgb(0,199,177)` y texto oscuro `rgb(1,55,41)` en las cinco tarjetas activas. Hover sin desplazamiento.
- Capturas completas a 375/1280 y detalle de tarjetas a 1280 inspeccionadas; mostradas en el chat.
- `git diff --check` de CSS y pruebas: aprobado. No se repitió `npm run check` completo por ser un ajuste CSS acotado con prueba focal y verificación real en navegador; no se modificó JSX ni lógica.
- Sin commit ni publicación.

T6: capturas de escritorio y celular mostradas inline por el principal. Prueba focal repetida 14/14 y diff check aprobado. Sin publicación; check completo no repetido para este ajuste CSS.

## Ajuste T7 autorizado
Sustituir sólo el color de «Ver horarios» por grafito sólido con texto y flecha blancos, común a todas las tarjetas activas. Se conservan los colores por materia, título y sello.

### Evidencia T7
- RED: la expectativa nueva de grafito falló antes del cambio. GREEN: `node tests/materias-independientes.test.mjs`, 14/14.
- Chromium a 375/1021/1280: las cinco acciones computan fondo opaco `rgb(43,43,47)` y texto blanco; siete títulos sin recorte y hover inmóvil. Contraste blanco/grafito: 14.10:1.
- `git diff --check` de CSS/prueba aprobado. No se repitió check completo: cambio acotado de colores, sin lógica ni JSX.
- Capturas de escritorio/celular y detalle inspeccionadas; falta presentación inline en respuesta final del principal.
- Sin commit ni publicación.

## Ajuste T8 autorizado
Centrar el texto de «Ver horarios» independientemente de la flecha, agrandar los siete títulos y aplicar relieve 3D estático leve. Se conserva la superficie grafito y el resto del diseño.

### Evidencia T8
- RED: dos regresiones fallaron antes del cambio; GREEN: `node tests/materias-independientes.test.mjs`, 15/15.
- Chromium a 375/1021/1280: centro del texto de acción con error máximo 0.008 px; títulos completos de 26/30.63/32.5 px, sin desborde; tarjetas inmóviles en hover. Flecha absoluta al extremo y padding simétrico mantienen el texto centrado.
- Sombras escalonadas de 1/2 px y sombra suave aportan relieve al título sin movimiento ni cambios de color.
- Capturas completas a 375/1280 y detalle de tarjetas a 1280 inspeccionados; mostradas inline en la respuesta final.
- `git diff --check` aprobado. No se repitió check completo por ser CSS acotado, con regresión y navegador reales. Chromium requirió ejecución fuera del sandbox por bloqueo de inicio.
- Sin commit ni publicación.

## Publicación autorizada
El usuario solicitó commit y push. Alcance: CSS de clases de apoyo, navegación entre materias, regresiones y este seguimiento. Se excluyen cambios ajenos y documentación compartida modificada en paralelo. Check completo y control de secretos pendientes de la comprobación final.

### Verificación final para publicación (24/10/2026)
- `npm run check` fuera del sandbox aprobado: 542/542 pruebas, typecheck correcto y lint sin errores (20 advertencias). Dentro del sandbox fallaron las cuatro suites conocidas con subprocesos.
- Control de secretos sobre la selección de los cuatro archivos: aprobado.
- Spot check principal: `node tests/materias-independientes.test.mjs`, 15/15; `git diff --check` focal aprobado.
- RDD desactivado globalmente. Se preservan todos los cambios ajenos; publicación limitada a los cuatro archivos declarados.

## Corrección T9 autorizada
- [x] Corregir el corte interno de Matemática y Computación informado en la captura del usuario. Ruta delegada por diagnóstico CSS y verificación real de tipografía.
- Conservar diseño, textos, títulos centrados, sello y acción grafito. Reproducir con fuentes cargadas y revisar 375/1021/1273/1280 px, incluyendo tamaño raíz ampliado. No publicar hasta validación del principal.

### Evidencia T9
- Causa reproducida: `overflow-wrap: anywhere` permitía partir nombres, mientras el mínimo `2rem` aumentaba el título sin considerar el ancho de su tarjeta. A 1273px con raíz 24px, Matemática y Computación se partían con títulos de 48px, igual que la captura informada.
- Corrección: la tarjeta establece un contenedor de ancho y limita la tipografía a `min(clamp(2rem, 3vw, 2.5rem), 14cqi)`. Se preserva el tamaño habitual y se permiten saltos sólo entre palabras; no cambia ningún texto ni otro elemento visual.
- RED observado en la regresión nueva antes del CSS; GREEN: `node tests/materias-independientes.test.mjs`, 16/16.
- Chromium real, Inter cargada: 375/1021/1273/1280px con raíz normal y 24px, todos los nombres completos sin desborde. Nombres de una palabra en una línea, Apoyo Secundario sólo separa palabras. Tarjetas inmóviles en hover y sin desborde horizontal.
- Capturas completas de escritorio/celular y detalle de tarjetas inspeccionadas en `/tmp/apoyo-t9-*`. La variante escritorio con raíz 24px reproduce la configuración que fallaba y ahora conserva los nombres completos.
- `git diff --check` focal aprobado. Sin commit ni publicación; falta presentación de capturas por el principal.
- `npm run check` fuera del sandbox aprobado: 543/543 pruebas, typecheck correcto y lint sin errores (20 advertencias existentes).
