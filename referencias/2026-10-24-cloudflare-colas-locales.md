# Fuentes de Queues/cron y evaluación del plan

- https://developers.cloudflare.com/queues/platform/pricing/ — Free disponible; operaciones, retención y costo Paid.
- https://developers.cloudflare.com/workers/platform/pricing/ — base USD 5, incluidos y assets; no es factura final.
- https://developers.cloudflare.com/workers/platform/limits/ — CPU HTTP/cron, requests, assets y triggers por plan.
- https://developers.cloudflare.com/d1/platform/pricing/ — filas/índices, almacenamiento y cortes del Free.
- https://developers.cloudflare.com/d1/platform/limits/ — 50/1000 consultas por invocación, tamaño por base y Time Travel; batch cuenta como una invocación D1.
- https://developers.cloudflare.com/queues/configuration/batching-retries/ — ack/retry por mensaje, tres reintentos, demora y DLQ.
- https://developers.cloudflare.com/workers/configuration/cron-triggers/ — UTC, cron y prueba local manual, sin ejecución periódica automática local.
- https://docs.astro.build/en/guides/integrations-guide/cloudflare/ — entrypoint propio con `handle` de `@astrojs/cloudflare/handler`; contrastado con paquete instalado 14.4.2.
- https://developers.cloudflare.com/queues/configuration/local-development/ — emulación local y falta de concurrencia nativa de consumidores.

Contrastes con paquetes fijados, sin modificarlos: `node_modules/wrangler/wrangler-dist/cli.js`
(`createTestHarness`, outbound vía `globalThis.fetch` y `update`);
`node_modules/miniflare/dist/src/index.js` (`Runtime.updateConfig/dispose`, SIGKILL)
y `node_modules/miniflare/dist/src/workers/queues/broker.worker.js` (retries/DLQ,
mensajes en memoria, sin TTL y descarte sin consumidor). Rutas relativas a
`cloudflare/`, Miniflare 5.20261019.2-beta.
