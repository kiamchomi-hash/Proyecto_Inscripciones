# Queues y cron locales Implementation Plan

**Goal:** conectar fetch/queue/scheduled sin habilitar emisiones externas ni recursos remotos.

**Architecture:** entrypoint estándar delega HTTP al handler instalado de Astro; adaptadores puros reciben D1, cola y transportes. Reclamo durable por intención antes de cualquier preparación; no se vence ni roba automáticamente un reclamo de resultado incierto. Cursor durable y rotativo acota el barrido sin bloquear filas posteriores.

**Tech Stack:** Astro 7, adaptador Cloudflare 14, Wrangler 4, D1/Queues locales, Node test.

Diseño y ejecución ya autorizados. Sin commits, delegación, pagos ni publicación.

1. Agregar regresiones D1 de concurrencia, excepción ambigua y barrido sin inanición en `cloudflare/tests/programados.test.mjs`; ejecutar en rojo.
2. Agregar `migrations/0008.sql` y reclamo/cursor en outbox/consumidores; repetir regresiones y suites existentes.
3. Crear `src/worker.ts` y `src/operativa/programados.ts`; conectar productor a formularios y robot. Declarar únicamente D1 ficticio, Queues y cron locales; transportes externos ausentes deliberadamente.
4. Ajustar guardas exactas y probar handlers compilados con el harness local, sin red externa. Ejecutar `npm --prefix cloudflare run check`, `npm run check` y `git diff --check`.
5. Documentar evaluación Free/Paid, garantías y recuperación manual; guardar URLs oficiales y resultados exactos.
