# A3: validar el detalle de carreras

## Objetivo y alcance

Reemplazar casts amplios del detalle por adaptadores del esquema generado y
validación de las cinco variantes de slides, sin modificar la presentación.
El usuario autorizó continuar A3 y usar Astra. La lectura remota autorizada de
id, nivel y slides de carreras activas ya se completó; no se autorizan escrituras
remotas ni nuevas consultas de otras columnas.

## Evidencia y criterio

89 filas activas compatibles normalizando opcionales null a ausencia: ocho
imagen_mobile y una pagina.derecha. Proyectar sólo campos declarados; ignorar
claves extra. Mantener slides null y listas vacías. Datos estructuralmente
inválidos deben impedir publicar un conjunto parcial como éxito: API 502 sin
cabecera pública de caché, página propaga error contextual. Filtrar oferta
oculta antes de validar. No incluir columnas privadas de la fila completa.

## Tarea

- [ ] A3-D1: adaptador, validación runtime, integración API/página, pruebas y
  actualización de documentación.
  Ruta: delegada, por lógica nueva en múltiples archivos y lectura preparatoria.
  Aceptación: cinco variantes y opcionales verificadas; datos corruptos rechazados;
  nulabilidades reales aceptadas; tipos inferidos sin casts de Carrera[].
  Prueba inicial RED: GET real con materias:42 en un plan devuelve hoy 200 y debe
  devolver 502. Luego GREEN con casos válidos, límites y proyecciones exactas.

## Verificación

- node --test tests/carrera-detalle.test.mjs
- node --test tests/carrera-detalle.test.mjs tests/carrera-catalogo.test.mjs tests/resiliencia.test.mjs
- npm run check
- git diff --check
- Build pendiente: necesita lecturas remotas adicionales, no ejecutarlo bajo la
  autorización acotada actual.

## Entrega y recuperación

Estrategia ask-on-risk; estimación 350 líneas propias, excluidos generados.
Sin ramas/PR: manda la regla específica del proyecto, trabajo sobre main.
Sin commit ni push en esta intervención; cambios visuales ajenos preservados.
RDD está habilitado por defecto; evaluación y consentimiento nativos pendientes.
Rollback: sólo archivos de esta unidad, conservando los cambios anteriores de A3.
Espejo Engram: odd/a3-detalle-carreras/tasks.

## Avance observado

A3-D1 implementada y verificada funcionalmente, sin cierre de revisión nativa.
RED observado: GET con materias:42 devolvía 200 frente al 502 esperado.
GREEN: 11/11 pruebas nuevas; selección con catálogo/resiliencia 18/18.
`npm run check`: 183/183 aprobadas, sin omitidas, typecheck correcto y 27
advertencias de lint. Verificador Astra independiente: 18/18, typecheck exit 0,
sin hallazgos accionables. Spot check del padre: git diff --check aprobado.
Unidad real: 487 altas y 22 bajas (509 líneas), por las cinco variantes recursivas
y sus pruebas; sin recortar cobertura para ajustarse a la estimación.

Evaluación nativa: high/unassessable por archivos sin seguimiento no declarados.
El preflight incluye además cambios visuales ajenos. Se conservó la transición
de selección pendiente, sin START ni consentimiento ni aprobación inventada.
No se mezclaron esos cambios ni se creó commit para forzar la revisión.

Siguiente paso: acotar la revisión nativa y obtener consentimiento; build sólo
con autorización de sus lecturas remotas adicionales. Materias, sitemap y armado
dinámico de consultas siguen fuera de esta unidad y pendientes en A3.
