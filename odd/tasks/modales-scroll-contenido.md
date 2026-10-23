# Scroll de contenido en modales

## Objetivo y alcance autorizado
Corregir desbordes mínimos desde el layout sin recortar lectura ni acciones. Mantener scroll para contenido largo y preservar navegación de año y periodo. No publicar ni tocar datos remotos. Preservar cambios ajenos.

## Problema y criterio
El detector global confunde cualquier overflow con lectura pendiente y deja atributos que ocultan barras. Los planes tienen navegación propia. Antes de ajustar layout, reproducir contra código actual, no un build anterior.

## Tareas
- [x] T1: reproducir en servidor actual, implementar regiones de lectura explícitas y ajuste de layout donde la reproducción lo justifique; probar regresiones y revisar en navegador.

- [x] T2: restaurar el salto entre periodos en el plan; verificar específicamente bimestre/cuatrimestre además del cambio de año, desktop y móvil. Reabierto por reporte del usuario tras publicación; la verificación anterior cubrió años pero no acreditó este control. Ruta delegated direct por diagnóstico y corrección de comportamiento.

- [x] T3: eliminar superposición de la flecha genérica con acciones, en particular Teclab después de Ver precios y cierre S21. Verificar todas las posiciones de scroll, pantallas bajas y texto ampliado.

## Ruta y verificación
Delegated direct: análisis y escritura multicomponente. Un escritor, luego verificador independiente si el riesgo es alto/no evaluable. Test-first para contrato determinista; layout se verifica en navegador antes/después. Ejecutar npm run check. Capturas a 1280px y 375px, pantallas bajas, navegación y resize. Sin umbral arbitrario ni recorte de contenido.

## Entrega
Forecast: 200–350 líneas propias, estrategia ask-on-risk si supera 400. Repositorio exige main sin ramas/PR. RDD off global verificado. No push. Commit sólo de archivos propios tras verificaciones.

## Estado
Implementación T1/T2/T3, npm run check (538/538), regresiones y verificación independiente aprobados. RDD desactivado globalmente; evaluación nativa no evaluable por inventario ajeno no versionado, tratado como riesgo alto y cubierto con verificador independiente. Seguimiento espejado en Engram bajo odd/modales-scroll-contenido/tasks.

## Implementación y evidencia
- Reproducción actual: Abogacía a 375 × 560 tenía 7 px de desborde en portada. La foto no cedía espacio (`flex-shrink-0`). Su flex-basis ahora conserva el tamaño preferido y cede hasta 6 rem, sin reducir lectura; desborde final: 0 px.
- Detector reemplazado por contrato positivo `data-scroll-lectura`; mide líneas/acciones reales, no padding. Planes e índices quedan fuera, sin modificar sus controles ni sus barras. Se mantienen barras nativas de respaldo.
- Se observa contenido tardío, fuentes, carga de imágenes y tamaños de las regiones. No se escriben atributos imperativos de presentación. Cierre centrado con márgenes seguros cuando sobra alto.
- RED observado: cuatro regresiones iniciales fallaron contra fuente anterior; GREEN observado tras implementar. Seis regresiones totales.
- Verificación final: `npm run check` PASS, lint + tipos + 534/534 pruebas (65,3 s de suite); `git diff --check` PASS. Primera corrida también aprobada, con 532 pruebas antes de añadir dos casos.
- Navegador actual: portada sin overflow en 1280 × 720, 1366 × 768, 375 × 667, 375 × 812, 812 × 375 y 375 × 560. S21 conserva navegación de año (scrollTop 174 tras clic), Teclab conserva índice; ninguna flecha genérica en planes.
- Teclado End con texto ampliado llega a scrollTop 305 de 305; Teclab móvil conserva Ver Segundo Año e Inicio (clic mueve 261 px). Cero errores JavaScript observados.
- Fixture local del componente real: padding no genera aviso; texto tardío sí; fin y vuelta arriba actualizan; resize de región también. Texto al 125 % conserva lectura larga y llegada al final.
- Detalle y limitaciones: `referencias/2026-10-23-modales-scroll.md`.
- Next dev actualizó automáticamente encabezado de AGENTS.md y rutas generadas de next-env.d.ts; no forman parte de la corrección y quedan para decisión del coordinador.
- Verificación independiente: pruebas enfocadas y dos scripts Chromium aprobados, sin bloqueantes. Spot check del coordinador: node --test tests/flechas-de-scroll.test.mjs y git diff --check aprobados. Sin push. Commit de implementación: `ef3e2fb` (213 adiciones + 49 eliminaciones, 262 líneas propias). Sin publicación.

## Ampliación confirmada por el usuario
El salto de periodos se reporta ausente en todas las fichas. Además la flecha de bajar tapa WhatsApp tras Ver precios en Teclab. No conservar indicadores flotantes sobre acciones: resolver espacio del control en el componente común. No publicar nuevos cambios sin autorización.

## Segunda revisión: períodos y carril de lectura
- Causa verificada: el salto de cuatrimestre S21 era exclusivamente móvil desde `6d9bffa`; Teclab no tenía salto de período explícito. La verificación de T1 sólo probó años. El indicador genérico absoluto sí tapaba WhatsApp durante el scroll; confirmado en Abogacía y capturas aportadas de Teclab.
- Se implementaron selector con etiquetas académicas reales y salto al siguiente período en los dos planes, en flujo, manteniendo índice anual. Se eligen destinos visibles y se actualiza la disponibilidad al cambiar de tamaño.
- El indicador accesible ocupa un carril propio, sólo en la fila de lectura de los carruseles. Header, navegación y footer mantienen todo su ancho. Se conserva el carril al final del scroll; no se activa sólo por padding.
- La condición `overflow: clip` del marco impide el scroll horizontal imperativo que un foco podía provocar sobre el wrapper oculto. Se agregó regresión estructural.
- La prueba de precio mostrado intercepta API y captcha en el navegador local con datos ficticios rotulados. No envió leads ni alteró producción; «Ver precio» permanece intacto.
- Ronda final congelada: `npm run check` PASS, lint + tipos + 538/538 pruebas (64 s de suite); `git diff --check` de archivos propios PASS. Cambio de año, resize y regreso al slide PASS en S21/Teclab. Indicador accesible con Enter, Tab y Shift+Tab PASS. Verificación independiente final aprobada: S21 y Teclab en 1280 × 720, 375 × 667, 375 × 560 y 375 × 560 con texto 125 %, cierre y precio ficticio, 21 posiciones de scroll por estado, navegación y foco. Los asserts previos contaban financiación cerrada o slides recortados; checkVisibility y elementsFromPoint confirmaron que no había superposición visible. Sin cambios de fuente del verificador. Spot check del coordinador: pruebas enfocadas y capturas aprobadas. Evidencia temporal de navegador: independent-periodos-all.log. Sin push de esta segunda revisión.
- Excepción de tamaño: la corrección coherente supera aproximadamente 400 líneas sumadas, principalmente por retirar el antiguo bloque de botones flotantes y temporizadores. Se mantiene la regla específica del repositorio: main, sin ramas ni PRs; no se fragmenta artificialmente el arreglo.

- Estado final T2/T3: 538/538 pruebas aprobadas y verificación independiente completa. Capturas de flecha separada y navegación mostradas al usuario. Commit de T2/T3: `f338996` (230 adiciones y 264 eliminaciones, incluidas pruebas y seguimiento); no publicar sin autorización nueva.
