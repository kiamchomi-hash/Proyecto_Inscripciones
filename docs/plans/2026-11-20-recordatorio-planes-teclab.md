# Recordatorio de planes de Teclab Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enviar por Telegram recordatorios recurrentes para revisar los planes de estudio oficiales de Teclab el 1 de marzo, el 1 de agosto y el 15 de diciembre a las 17:00 de Buenos Aires.

**Architecture:** Agregar dos Cron Triggers de Cloudflare en UTC: `0 20 1 3,8 *` para marzo y agosto, y `0 20 15 12 *` para diciembre. El despachador del Worker reconocerá esas expresiones y llamará a un handler protegido con el `CRON_SECRET`, que enviará un mensaje fijo usando la configuración de Telegram ya existente. La tarea no leerá ni escribirá D1 y no alterará los recordatorios actuales.

**Tech Stack:** Cloudflare Workers, Astro API routes, TypeScript, Wrangler JSON, Node.js tests.

---

### Task 1: Implementar el mensaje y el handler autenticado

**Files:**
- Create: `lib/recordatorio-planes-teclab.ts`
- Create: `cloudflare/src/api/recordatorio-planes-teclab.ts`
- Create: `cloudflare/src/pages/api/recordatorio-planes-teclab.ts`
- Test: `cloudflare/tests/recordatorio-planes-teclab.test.mjs`

**Steps:**
1. Escribir pruebas para el texto, rechazo sin `CRON_SECRET`, rechazo con bearer incorrecto y envío exitoso mediante el puerto Telegram simulado.
2. Ejecutar `node --test cloudflare/tests/recordatorio-planes-teclab.test.mjs` y confirmar que falla por los módulos ausentes.
3. Implementar el texto neutral: revisar los planes de las carreras activas de Teclab contra fuentes oficiales; no cambiar planes si no se pueden verificar o las fuentes discrepan.
4. Implementar el handler reutilizando `rechazoBearer` y el patrón de respuesta de `cloudflare/src/api/recordatorio-teclab.ts`. No consultar D1.
5. Cablear la ruta Astro con `secretoCron()` y `telegramCron()`.
6. Repetir la prueba focal y confirmar que pasa sin realizar llamadas reales a Telegram.

### Task 2: Conectar el despachador y las expresiones Cron

**Files:**
- Modify: `cloudflare/src/operativa/produccion.ts`
- Modify: `cloudflare/scripts/local.mjs`
- Modify: `cloudflare/produccion/wrangler.json`
- Test: `cloudflare/tests/produccion-operativa.test.mjs`
- Test: `cloudflare/tests/publicacion.test.mjs`

**Steps:**
1. Agregar pruebas que exijan el mapeo exacto de las dos expresiones cron al nuevo handler y que mantengan intactos los crons existentes.
2. Ejecutar `node --test cloudflare/tests/produccion-operativa.test.mjs` y confirmar el fallo inicial.
3. Agregar nombres de tarea dedicados, validar expresiones de `CRONES` y despachar cada una al endpoint `recordatorio-planes-teclab`.
4. Incorporar a `wrangler.json` los crons `0 20 1 3,8 *` y `0 20 15 12 *`, conservando las seis expresiones vigentes.
5. Ejecutar `node --test cloudflare/tests/produccion-operativa.test.mjs cloudflare/tests/publicacion.test.mjs`.
6. Revisar que la configuración de producción y el registro de crons coincidan exactamente.

### Task 3: Documentar la rutina y verificar

**Files:**
- Modify: `docs/rutinas.md`
- Verify: `cloudflare/`

**Steps:**
1. Añadir a la sección Teclab la revisión recurrente de los planes y sus fechas de aviso, manteniéndola fuera de `PENDIENTES.md`.
2. Desde `cloudflare/`, ejecutar `npm run check` y resolver fallos atribuibles al cambio.
3. Revisar `git diff` para confirmar que los recordatorios previos no cambiaron y que no se añadió ninguna escritura D1 ni un mensaje real de prueba.
4. Ejecutar `npm run publicar:ensayo` desde `cloudflare/` y confirmar build y dry-run satisfactorios.
5. Integrar y publicar el cambio en producción, dado que el usuario autorizó activar el aviso de Telegram.
6. Verificar el workflow de publicación y el estado de los Cron Triggers; informar las tres fechas y la zona horaria efectiva.
