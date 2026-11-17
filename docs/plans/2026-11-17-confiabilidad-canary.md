# Verificación y recuperación gradual Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reforzar las verificaciones por riesgo y desplegar versiones del Worker gradualmente, con promoción o rollback automáticos sin alterar D1.

**Architecture:** El publicador local clasificará los cambios y ejecutará controles proporcionales; CI añadirá CodeQL con una transición explícita de observación a bloqueo para alertas nuevas. El workflow de producción publicará una versión de Worker, comprobará su disponibilidad y contrato, dirigirá una fracción del tráfico, ejecutará smoke y promoverá o revertirá el Worker. Los assets generados deberán identificar la versión que los sirve antes de habilitar el canary; la regla de transformación de Cloudflare será una precondición, no un cambio silencioso de credenciales.

**Tech Stack:** GitHub Actions, CodeQL, Node.js, Wrangler, Cloudflare Workers Versions, Astro, pruebas Node.

---

## Estado de implementación

- Clasificación local de riesgo conectada al publicador; el mayor nivel del diff
  añade controles Cloudflare. Pruebas locales y `npm run check` pasan.
- CodeQL quedó integrado en observación dentro del workflow de verificación y es
  una dependencia del deploy. No bloquea por alertas hasta establecer la línea
  base en GitHub.
- Se aprobó versionar las URLs con el ID de Worker, mantener manifiestos por
  versión y deduplicar bytes en R2 con SHA-256. La aprobación cubre trabajo
  local; no la creación del bucket ni cambios remotos.
- El servicio R2, el sincronizador, la secuencia canary y los contratos locales
  están implementados. El usuario autorizó que el canary dependa de afinidad
  entre requests; la regla remota no está creada ni verificada.
- El publicador quedó con una barrera cerrada. Requiere la variable de Actions
  `CANARY_VERSION_AFFINITY_CONFIGURED=true`, que sólo se define después de
  verificar la regla en ambos dominios. Falta además el bucket y la credencial
  R2. No se habilitó tráfico gradual ni se tocaron recursos remotos.
- El build, los tests del canary/publicador y las demás suites del check de
  `cloudflare/` pasaron. Se corrigieron dos pruebas E2E para abrir el calendario
  desde su botón accesible. El E2E completo sigue fallando sólo en la captura
  móvil de `/imagenes`: el inventario local de imágenes no coincide con el
  baseline visual (331 archivos locales frente a 337 rastreados por Git); no se
  regeneró la referencia para no normalizar una diferencia de contenido.

## Condiciones de seguridad y publicación

- No cambiar el push directo a `main` ni pedir aprobación humana.
- No usar proveedor/modelo de IA pago.
- No ejecutar migraciones ni escrituras en D1.
- No desplegar producción ni editar reglas remotas durante el desarrollo local.
- Antes de habilitar gradual deployments, comprobar los permisos de la zona
  y demostrar con pruebas que todos los assets están version-pinned.
- El token de despliegue no recibe permisos de escritura de zona. Si la cuenta
  requiere un token adicional, se documenta el permiso mínimo y se pide la
  credencial/acción explícita antes de usarlo.
- No activar el canary si la elegibilidad, la regla o el smoke no pueden
  verificarse; el comportamiento seguro es detener el deploy, no publicar al
  100% como fallback.
- En un gradual deployment los requests sucesivos pueden llegar a versiones
  distintas. El HTML de la candidata apunta a `/__assets/<id>/...`, que sólo
  entiende el código nuevo; sin afinidad, una petición de asset puede caer en la
  versión estable y romper la página. La regla requerida asigna
  `Cloudflare-Workers-Version-Key` al IP de origen para los dos dominios propios.
  La variable de GitHub es una atestación operativa, no una comprobación remota
  automática de la regla.

## Task 1: Clasificación de riesgo local

**Files:**
- Create: `herramientas/riesgo.mjs`
- Modify: `herramientas/deploy-check.mjs`
- Modify: `herramientas/deploy.mjs`
- Test: `tests/riesgo.test.mjs`
- Test: `tests/deploy.test.mjs`
- Modify: `docs/verificacion.md`

**Steps:**
1. Añadir pruebas para clasificar cambios de documentación, código compartido,
   frontend, formularios/datos, seguridad y configuración de producción.
2. Ejecutar `node --test tests/deploy.test.mjs`; confirmar que las nuevas
   expectativas fallan antes de implementar.
3. Implementar clasificación determinista por rutas Git, con reglas conservadoras
   cuando un archivo cruce áreas.
4. Hacer que el chequeo del candidato ejecute las verificaciones pertinentes y
   falle cerrado ante scripts faltantes, errores o salida incompleta.
5. Probar rutas típicas y desconocidas, incluyendo archivos renombrados y
   cambios que toquen más de un nivel.
6. Correr `npm test` y `npm run check`.

## Task 2: CodeQL gratuito y transición de línea base

**Files:**
- Modify: `.github/workflows/verificar.yml`
- Modify: `docs/verificacion.md`
- Test: `tests/` (contrato del workflow, si ya existe un patrón de pruebas YAML)

**Steps:**
1. Verificar en GitHub que CodeQL/code scanning está disponible para este repo y
   confirmar el lenguaje soportado antes de fijar el workflow.
2. Añadir workflow de CodeQL en modo observación, activado en push a `main`,
   workflow dispatch y cron; fijar permisos mínimos y versiones de actions.
3. Validar YAML y ejecutar el análisis local/CI de prueba.
4. Revisar la línea base: no bloquear por alertas preexistentes; definir el
   criterio reproducible para identificar alertas nuevas altas/críticas.
5. Sólo cuando la línea base sea verificable, conectar el resultado al gate de
   publicación; un error de análisis o fuente ausente no se cuenta como limpio.
6. Documentar qué hallazgos bloquean y cómo revisar alertas existentes.

## Task 3: Inventario, URLs versionadas y pruebas de cobertura de assets

**Files:**
- Modify: `cloudflare/astro.config.mjs`
- Modify: `cloudflare/scripts/` (generador de manifiesto de assets)
- Create: `cloudflare/src/entrega/assets-versionados.ts`
- Create: `cloudflare/tests/assets-versionados.test.mjs`
- Modify: `cloudflare/CORTE.md`

**Steps:**
1. Tomar una build limpia y enumerar todos los assets del HTML, CSS, JS,
   manifiestos, preload, `srcset`, importaciones dinámicas y rutas construidas
   desde código.
2. Añadir pruebas contractuales que detecten una referencia de asset que no
   llegue a una ruta inmutable y que detecten colisiones de contenido.
3. Generar URLs ` /__assets/<worker-version>/<ruta-original>` para las
   referencias locales conocidas; no cambiar URLs externas ni rutas de navegación.
4. Integrar la resolución en build para CSS/JS y en el HTML SSR para atributos
   (`src`, `href`, `srcset`, `poster` y preload); mantener referencias JS a
   través de la tabla generada, no de un replace textual sin parseo.
5. Hacer que el control falle cerrado ante rutas dinámicas no cubiertas,
   recursos ausentes, versión inválida o digest incorrecto.
6. Probar HTML cacheado de una versión anterior contra un manifiesto posterior y
   confirmar que cada URL sigue identificando el mismo contenido.

## Task 4: Integración R2 y caché de borde

**Files:**
- Modify: `cloudflare/produccion/wrangler.json`
- Modify: `cloudflare/produccion/worker.ts`
- Create: `cloudflare/src/entrega/almacen-assets.ts`
- Create: `cloudflare/tests/almacen-assets.test.mjs`
- Create: `cloudflare/scripts/sincronizar-assets-r2.mjs`
- Create: `cloudflare/tests/sincronizar-assets-r2.test.mjs`
- Modify: `cloudflare/scripts/publicar.mjs`
- Modify: `cloudflare/tests/publicacion.test.mjs`
- Modify: `docs/herramientas.md`
- Modify: `cloudflare/CORTE.md`

**Steps:**
1. Agregar tests para lectura sólo de rutas versionadas válidas, respuesta 404
   para claves ausentes y rechazo de métodos de escritura/listado.
2. Implementar lectura del manifiesto inmutable de la versión y de objetos
   `objects/<sha256>` con metadata HTTP correcta y caché de borde.
3. Implementar la sincronización idempotente de objetos deduplicados y publicar
   el manifiesto al final; modo de plan por defecto y escritura sólo con bandera.
4. Verificar que la respuesta de R2 preserve `ETag`, soporte `HEAD` y solicitudes
   `Range` si el tipo de asset lo requiere.
5. Agregar binding R2 a la configuración declarativa sin crear el bucket remoto;
   el nombre/identificador se documenta como precondición pendiente.
6. Añadir al publicador un paso de sincronización idempotente de assets antes de
   subir la versión Worker; nunca borrar objetos durante deploy o rollback.
7. Probar en mocks que un fallo de upload bloquea publicación, que no se suben
   archivos ajenos al manifiesto y que repetir la operación no cambia contenido.
8. No desplegar ni crear recursos remotos en esta tarea.

## Task 5: Canary, promoción y rollback del Worker

**Files:**
- Modify: `.github/workflows/verificar.yml`
- Modify: `.github/workflows/publicar.yml`
- Modify: `cloudflare/scripts/publicar.mjs`
- Modify: `cloudflare/tests/publicacion.test.mjs`
- Modify: `cloudflare/CORTE.md`

**Steps:**
1. Añadir pruebas de contrato para la secuencia: upload de candidata, sincronizar
   assets R2 con el ID asignado, desplegar candidata al 0%, dividir tráfico
   inicial 5%, smoke, promoción 100%.
2. Añadir pruebas de rollback ante smoke fallido, error de CLI, timeout o
   precondición desconocida; ningún fallo debe dejar la candidata en 100%.
3. Confirmar en la documentación y en Wrangler instalado la sintaxis actual de
   `versions upload`, `versions deploy` y consulta/rollback antes de escribir
   comandos del workflow.
4. Implementar la secuencia con IDs explícitos, concurrencia compartida y
   comprobación de que el SHA sigue siendo punta de `main`.
5. Capturar logs/resultado sin secretos; el rollback sólo selecciona una versión
   previa del Worker y nunca ejecuta comandos D1.
6. Probar el flujo con mocks y un ensayo `--dry-run`; no ejecutar producción en
   esta tarea. El gate de R2 debe fallar si el bucket no existe o la credencial
   de upload no está configurada. La afinidad entre requests también debe estar
   verificada antes de abrir la barrera.
7. Si el smoke del canary falla, hacer rollback del Worker y fallar el workflow
   original para que el incidente quede visible.

## Task 6: Registro de checks e incidentes

**Files:**
- Modify: `.github/workflows/verificar.yml`
- Create: `docs/incidentes/LEER.md` o documentar formato en `cloudflare/CORTE.md`
- Modify: `docs/verificacion.md`

**Steps:**
1. Escribir un resumen de Actions con SHA, riesgo, checks, versión candidata,
   porcentaje, smoke, promoción y rollback.
2. Asegurar que el resumen nunca se marque como éxito si un dato no pudo
   recuperarse.
3. Definir plantilla corta para anotar incidentes y reversiones, sin crear
   métricas ficticias ni requerir tiempos humanos.
4. Probar resumen en éxito, rollback y error antes de publicación.

## Task 7: Verificación integral local

**Files:**
- Todos los archivos modificados por Tasks 1–6.

**Steps:**
1. Correr tests dirigidos de clasificación, assets y publicación.
2. Correr `npm run check` en la raíz.
3. Correr `npm --prefix cloudflare run build` y los tests del área modificada.
4. Correr `npm --prefix cloudflare run check` por ser un cambio amplio del
   publicador y del Worker.
5. Correr `npm run secretos` y revisar el diff/staging para excluir cualquier
   cambio ajeno preexistente.
6. Sólo después de aprobar las verificaciones, commitear los archivos propios y
   pushear a `main` conforme al criterio del proyecto.
7. Tras el push, verificar Actions y producción; si el verificador no está
   disponible, informar que el deploy quedó sin confirmar y no repetirlo a ciegas.
