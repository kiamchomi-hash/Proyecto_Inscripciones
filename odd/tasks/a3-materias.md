# A3: validar materias públicas

## Objetivo
Validar los campos JSON de materias antes del render público, sin cambiar diseño, datos ni panel admin.

## Alcance y autorización
Trabajo local autorizado por el usuario. Main, sin ramas, commit ni push. Sin consultas remotas, build, instalaciones ni cambios de permisos. RDD desactivado globalmente.

## Tareas
- [x] M1: adaptadores tipados de listado/detalle con proyecciones exactas y rechazo explícito de JSON corrupto; integrar ambas páginas y pruebas negativas.
- [x] M2: verificar regresiones enfocadas y typecheck; documentar alcance y pruebas.

Ruta delegada por lectura preparatoria y múltiples archivos no triviales. Estimación 300 líneas; estrategia ask-on-risk. Si supera 400 líneas, informar antes de commit (no autorizado).

## Aceptación
Conservar contenido válido, fallback texto_seo, navegación mínima y separación por materia. No casts amplios, datos privados ni éxito parcial con datos inválidos.

## Verificación
RED real de páginas simuladas; luego node --test tests/materia-datos.test.mjs tests/materias-independientes.test.mjs tests/resiliencia.test.mjs; npm run typecheck; git diff --check. Check global pendiente: contiene fixtures npm ci con posible red, no autorizados. No build.

## Recuperación
Espejo odd/a3-materias/tasks. Completado por pedido del usuario el 17/10/2026; se conservan las comprobaciones omitidas. Commit pendiente de solicitud explícita.

## Evidencia local de implementación
- M1 implementada y verificada localmente: adaptador de materias, proyecciones literales y contratos negativos; completada por pedido del usuario, sin afirmar check global ni publicación.
- RED observado: las páginas reales simuladas aceptaban `descripcion: 42` e `imagenes: ['/foto', 42]` (dos `Missing expected rejection`). Tras la implementación, los diez casos de `tests/materia-datos.test.mjs` pasan.
- `node --test tests/materia-datos.test.mjs`: pasa.
- `node --test tests/materia-datos.test.mjs tests/materias-independientes.test.mjs tests/resiliencia.test.mjs`: pasa. El primer intento detectó que el mock de resiliencia omitía el nuevo módulo; se amplió la superficie autorizada y ahora carga el adaptador real, sin cambiar expectativas.
- `npm run typecheck`: pasa, incluidos contratos de proyección incompleta y JSON sin validar.
- `npm run lint`: pasa con 28 advertencias en archivos no modificados.
- `git diff --check`: pasa.
- Check global omitido por autorización: sus fixtures pueden ejecutar npm ci y usar red. Sin build, datos remotos, commit ni push.
- Verificación independiente: 24/24 pruebas enfocadas con `--test-isolation=none`, typecheck y diff --check aprobados; sin hallazgos nuevos accionables. Spot check del coordinador: repetición de las 24 pruebas y diff --check aprobados.
- Evaluación nativa no clasificable por archivos nuevos sin declarar; tratada como high para exigir verificador independiente. RDD off respetado: sin ciclo de revisión ni consentimiento.
- M1 y M2 completadas en su alcance local por pedido del usuario el 17/10/2026. Check global, build, commit y publicación no realizados. Próximo paso: check global con autorización para fixtures de instalación; commit sólo por solicitud del usuario.
