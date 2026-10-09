# Corregir auditoría de dependencias

## Objetivo
Resolver las nueve alertas altas del CI sin degradar Next/Tailwind ni ocultar auditorías.

## Alcance autorizado
package.json, package-lock.json, tests/dependencias.test.mjs. Actualizar sharp y source-map-js; eliminar rutas transitivas a braces sin parche publicado mediante overrides acotados y pruebas de compatibilidad.

## Tareas
- [ ] T1 Aplicar actualizaciones y overrides mínimos, probar compatibilidad y verificar auditoría, check y build.

## Ruta
Delegada: preparación y cambios no triviales múltiples. RED audit observado: nueve altas. GREEN exigido npm ci, audit, árbol de dependencias, test enfocado, check, build.

## Riesgos y entrega
Alias fast-glob a tinyglobby sólo en plugin Next: probar consumidor real rootDir string/array/glob. Watcher 2.6.0 reemplaza micromatch. Sin force ni downgrade. main según política proyecto; commit/push pendientes de autorización actual. ask-on-risk, estimación 100 líneas autoradas sin lock generado.

## Progreso
Exploración completada, base limpia. braces sin parche; sharp0.35.5 y source-map-js1.2.2 publicados.

### Intento descartado
- RED: test inicial falló por braces presente. Se intentó el alias tinyglobby, pero el consumidor real Next devolvió rutas relativas con barra final en lugar de rutas absolutas.
- La auditoría cero obtenida con ese alias era de un candidato incompatible y no es evidencia de solución. Alias y prueba de ausencia de braces retirados antes de la verificación definitiva.
- No se inventó adaptador ni se relajó la compatibilidad. T1 permanece abierta.

### Estado final T1 (reemplaza los resultados intermedios)
- Alias tinyglobby descartado y retirado, junto con la prueba que exigía ausencia total de braces. La documentación oficial confirma que sus salidas son relativas salvo `absolute: true`; el consumidor Next no envía esa opción: https://superchupu.dev/tinyglobby/documentation.
- Conservados únicamente sharp 0.35.5, source-map-js 1.2.2 y override de watcher 2.6.0 acotado a Tailwind CLI.
- `npm ci`: correcto, 457 paquetes instalados desde lock definitivo.
- `npm audit`: falla, cinco alertas altas transitivas por una vulnerabilidad de braces sin parche, vía eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces. https://github.com/advisories/GHSA-vfj7-8cjw-p6xm.
- `npm ls braces sharp source-map-js --all`: correcto; confirma sharp 0.35.5, source-map-js 1.2.2 y braces 3.0.3 residual en ESLint Next.
- `node --test tests/dependencias.test.mjs`: 1/1 pasa, consumidor Next real cubre cwd predeterminado, string, array, glob sólo directorios, sin coincidencias y entradas no string.
- Smoke nativo del watcher resuelto desde Tailwind CLI: writeSnapshot/getEventsSince observa evento create.
- `npm run check`: correcto, lint sin errores (28 advertencias), typecheck correcto y 367/367 tests pasan. La primera corrida falló 26 tests porque npm ci había eliminado la caché de Gitleaks; tras autorización se restauró con `node herramientas/secretos.mjs instalar` y se repitió check sin bypass.
- `npm run build`: correcto, compilación y generación de 161 páginas completadas.
- `git diff --check`: correcto. next-env.d.ts generado por build restaurado exactamente al baseline HEAD con autorización.
- T1 permanece parcial: no hay reemplazo drop-in verificado para fast-glob; no se ocultó la auditoría ni se usó downgrade/force. Sin commit/push.
