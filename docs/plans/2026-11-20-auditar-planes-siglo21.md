# Auditar planes de Siglo 21 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Crear una skill para comparar y actualizar con seguridad los planes de Siglo 21, y enviar avisos de revisión por Telegram el 1 de marzo, el 1 de agosto y el 15 de diciembre a las 17:00 de Buenos Aires.

**Architecture:** La skill será una guía manual en `.claude/skills`, enlazada selectivamente para OpenCode y limitada a slides `plan_estudios` de carreras activas de Grado, Grado (CCC) y Pregrado. Un handler de Telegram independiente enviará el aviso de Siglo 21; las dos expresiones Cron existentes se conservarán y cada ejecución despachará ambos avisos institucionales sin consultar D1.

**Tech Stack:** Markdown, enlace simbólico Git, JSONC, Node.js tests, TypeScript, Astro y Cloudflare Workers.

---

### Task 1: Crear la skill de auditoría de Siglo 21

**Files:**
- Create: `.claude/skills/auditar-planes-siglo21/SKILL.md`
- Create symlink: `.agents/skills/auditar-planes-siglo21`
- Modify: `opencode.jsonc`
- Modify: `herramientas/secretos.mjs`
- Test: `tests/secretos.test.mjs`

**Step 1: Escribir pruebas para la allowlist**

Agregar un caso que compruebe que el enlace `.agents/skills/auditar-planes-siglo21` se acepta sólo con el destino `../../.claude/skills/auditar-planes-siglo21`, siguiendo el test de Teclab.

**Step 2: Ejecutar la prueba focal y verificar el fallo**

Run: `node --test tests/secretos.test.mjs`

Expected: falla para el nuevo enlace todavía no declarado.

**Step 3: Escribir el procedimiento de la skill**

El archivo debe incluir frontmatter `name: auditar-planes-siglo21` y una descripción que la active ante consultas sobre planes o materias de Siglo 21. Incluir alcance activo (Grado, Grado CCC y Pregrado con slide), comparación de ficha oficial y documento oficial enlazado, registro de discrepancias no resueltas, SQL acotado por id/nombre/activo/revisión, verificación posterior y referencia fechada.

La autorización de la skill se limita al objeto `plan_estudios` dentro de `slides`. Debe preservar portada, cierre y otras columnas. Si el usuario consulta sólo una carrera, no iniciar auditoría masiva.

**Step 4: Conectar la skill al descubrimiento**

Crear el enlace simbólico selectivo, añadir el destino a `herramientas/secretos.mjs` y habilitar `skill:auditar-planes-siglo21` junto a las excepciones existentes de `opencode.jsonc`.

**Step 5: Repetir la prueba**

Run: `node --test tests/secretos.test.mjs`

Expected: PASS, incluyendo aceptación del destino correcto y rechazo de uno distinto.

### Task 2: Implementar el texto y handler del aviso de Siglo 21

**Files:**
- Create: `lib/recordatorio-planes-siglo21.ts`
- Create: `cloudflare/src/api/recordatorio-planes-siglo21.ts`
- Create: `cloudflare/src/pages/api/recordatorio-planes-siglo21.ts`
- Create: `cloudflare/tests/recordatorio-planes-siglo21.test.mjs`
- Modify: `cloudflare/scripts/local.mjs`

**Step 1: Escribir pruebas del mensaje y del handler**

Cubrir el texto neutral del aviso, rechazo cuando falta `CRON_SECRET`, bearer inválido sin envío y envío exitoso por un transporte Telegram simulado. Confirmar que el handler no lee D1.

**Step 2: Ejecutar la prueba para comprobar el fallo inicial**

Run: `node --test cloudflare/tests/recordatorio-planes-siglo21.test.mjs`

Expected: falla porque aún no existen los módulos nuevos.

**Step 3: Implementar el mensaje y handler**

Seguir el patrón de `lib/recordatorio-planes-teclab.ts` y `cloudflare/src/api/recordatorio-planes-teclab.ts`: texto separado por institución, autenticación con `rechazoBearer`, respuesta JSON y estado no exitoso si Telegram falla.

**Step 4: Cablear la ruta Astro**

La ruta `/api/recordatorio-planes-siglo21` debe reutilizar `secretoCron()` y `telegramCron()`, y rechazar métodos distintos de GET con 405.

**Step 5: Registrar el test en las verificaciones locales**

Añadir el test nuevo al grupo focal de recordatorios en `cloudflare/scripts/local.mjs`, conservando los tests existentes.

**Step 6: Ejecutar la prueba focal**

Run: `node --test cloudflare/tests/recordatorio-planes-siglo21.test.mjs`

Expected: PASS sin llamadas a Telegram real.

### Task 3: Despachar ambos avisos con los Cron Triggers existentes

**Files:**
- Modify: `cloudflare/src/operativa/produccion.ts`
- Modify: `cloudflare/tests/produccion-operativa.test.mjs`
- Verify: `cloudflare/produccion/wrangler.json`
- Verify: `cloudflare/tests/publicacion.test.mjs`

**Step 1: Extender las pruebas del dispatcher**

Para cada cron de planes, comprobar que se envía exactamente un aviso de Teclab y uno de Siglo 21 por transportes simulados; que la respuesta informa el resultado de ambos; y que un fallo de uno no oculte el resultado del otro.

**Step 2: Ejecutar la prueba focal y verificar el fallo**

Run: `node --test cloudflare/tests/produccion-operativa.test.mjs`

Expected: falla por la ausencia del aviso nuevo en el despacho.

**Step 3: Ampliar el despacho**

Cuando la expresión corresponda al seguimiento de planes, invocar una vez cada handler independiente usando el mismo secreto y transporte simulado. Devolver un estado agregado no exitoso si alguno falla, sin afirmar que ambos avisos se enviaron.

**Step 4: Conservar el calendario vigente**

Verificar que `cloudflare/produccion/wrangler.json` conserva exactamente `0 20 1 3,8 *` y `0 20 15 12 *`; no agregar expresiones duplicadas. Confirmar que las pruebas de publicación siguen validando el contrato existente.

**Step 5: Ejecutar pruebas focales**

Run: `node --test cloudflare/tests/produccion-operativa.test.mjs cloudflare/tests/publicacion.test.mjs cloudflare/tests/recordatorio-planes-teclab.test.mjs cloudflare/tests/recordatorio-planes-siglo21.test.mjs`

Expected: PASS y ninguna petición de prueba sale a Telegram real.

### Task 4: Documentar la rutina y verificar la integración

**Files:**
- Modify: `docs/rutinas.md`
- Verify: `.claude/skills/auditar-planes-siglo21/SKILL.md`
- Verify: `.agents/skills/auditar-planes-siglo21`
- Verify: `opencode.jsonc`
- Verify: `cloudflare/produccion/wrangler.json`

**Step 1: Documentar el seguimiento recurrente**

Agregar una rutina Siglo 21 con alcance de carreras y fechas de aviso, junto a Teclab. Aclarar que el recordatorio no realiza la auditoría. No agregar la rutina a `PENDIENTES.md`.

**Step 2: Ejecutar las verificaciones de la raíz**

Run: `npm run check`

Expected: lint, typecheck y tests de raíz PASS.

**Step 3: Ejecutar las verificaciones del Worker**

Run: `npm run check`

Working directory: `cloudflare/`

Expected: controles del paquete Cloudflare PASS. Resolver sólo fallos atribuibles al cambio.

**Step 4: Revisar el diff y el contrato operativo**

Confirmar que el cambio no altera otros crons ni añade llamadas reales a Telegram en tests; que la skill tiene permiso configurado; y que sólo los tres avisos institucionales esperados se despachan en las fechas indicadas.

**Step 5: Publicar y comprobar la activación**

Integrar el cambio mediante el flujo de publicación establecido. Verificar que el workflow terminó correctamente y que Cloudflare conserva los Cron Triggers esperados. No enviar una notificación de prueba al chat real.
