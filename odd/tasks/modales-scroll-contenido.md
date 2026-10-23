# Scroll de contenido en modales

## Objetivo y alcance autorizado
Corregir desbordes mínimos desde el layout sin recortar lectura ni acciones. Mantener scroll para contenido largo y preservar navegación de año y periodo. No publicar ni tocar datos remotos. Preservar cambios ajenos.

## Problema y criterio
El detector global confunde cualquier overflow con lectura pendiente y deja atributos que ocultan barras. Los planes tienen navegación propia. Antes de ajustar layout, reproducir contra código actual, no un build anterior.

## Tareas
- [x] T1: reproducir en servidor actual, implementar regiones de lectura explícitas y ajuste de layout donde la reproducción lo justifique; probar regresiones y revisar en navegador.

## Ruta y verificación
Delegated direct: análisis y escritura multicomponente. Un escritor, luego verificador independiente si el riesgo es alto/no evaluable. Test-first para contrato determinista; layout se verifica en navegador antes/después. Ejecutar npm run check. Capturas a 1280px y 375px, pantallas bajas, navegación y resize. Sin umbral arbitrario ni recorte de contenido.

## Entrega
Forecast: 200–350 líneas propias, estrategia ask-on-risk si supera 400. Repositorio exige main sin ramas/PR. RDD off global verificado. No push. Commit sólo de archivos propios tras verificaciones.

## Estado
Implementación, npm run check (534/534), regresiones y verificación independiente aprobados. RDD desactivado globalmente; evaluación nativa no evaluable por inventario ajeno no versionado, tratado como riesgo alto y cubierto con verificador independiente. Mirror Engram pendiente de sincronización final.

## Implementación y evidencia (sin commit todavía)
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
- Verificación independiente: pruebas enfocadas y dos scripts Chromium aprobados, sin bloqueantes. Spot check del coordinador: node --test tests/flechas-de-scroll.test.mjs y git diff --check aprobados. Sin push. Commit propio pendiente de registrar.
