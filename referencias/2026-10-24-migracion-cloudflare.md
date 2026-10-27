# Fuentes de la migración a Cloudflare

Consultadas el 24/10/2026. Documentación del diseño y del primer incremento local;
no implica que se hayan creado recursos ni validado costos con tráfico real.

- https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/ — soporte de Astro/React, SSR y Workers Assets; su ejemplo de entrypoint es anterior al adaptador actual, se siguió la documentación específica de Astro.
- https://docs.astro.build/en/guides/integrations-guide/cloudflare/ — adaptador 14.4.2, entrypoint actual, importación `cloudflare:workers`, preview workerd, `remoteBindings`, sesiones desactivables e imágenes passthrough.
- https://docs.astro.build/en/guides/integrations-guide/react/ — integración oficial de React e hidratación; no se agregaron componentes visuales de muestra.
- https://vite.dev/config/shared-options#envdir — `envDir: false` deshabilita la carga de archivos de entorno de Vite.
- https://developers.cloudflare.com/workers/local-development/environment-variables/ — flags para deshabilitar dotenv y herencia del entorno; `.dev.vars` se rechaza localmente en vez de utilizarlo en este incremento.
- https://developers.cloudflare.com/workers/development-testing/environment-variables/ — URL anterior redirige a la guía de desarrollo local citada arriba.
- https://developers.cloudflare.com/workers/wrangler/api/ — `createTestHarness`, pruebas del build y overrides de variables; descartado `unstable_dev` por deprecación.
- https://developers.cloudflare.com/workers/platform/pricing/ — mínimo de Workers Paid y consumo incluido; sin promesa de ahorro no medido.
- https://developers.cloudflare.com/d1/platform/pricing/ — costo por filas leídas/escritas y almacenamiento; índices y scans también cuentan.
- https://developers.cloudflare.com/d1/platform/limits/ — límite de 10 GB por base Paid, 2 MB por fila y Time Travel de 30 días.
- https://developers.cloudflare.com/d1/sql-api/sql-statements/ — semántica SQLite y extensiones JSON; no equivalencia con PostgreSQL.
- https://developers.cloudflare.com/d1/worker-api/d1-database/ — bindings, consultas preparadas y atomicidad de `batch()`.
- https://developers.cloudflare.com/workers/runtime-apis/context/ — `waitUntil()` tiene límite de 30 segundos después de responder; no reemplaza una cola durable para trabajos críticos.
- https://developers.cloudflare.com/queues/reference/delivery-guarantees/ — entrega al menos una vez; deduplicación y tratamiento de efectos externos ambiguos.
- https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/ — assets frente a invocaciones dinámicas y facturación.
- https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/ — alternativa con PostgreSQL externo; no elegida por mantener otro proveedor.
- https://registry.npmjs.org/astro/latest — versión y requisito Node consultados antes de instalar.
- https://registry.npmjs.org/@astrojs%2fcloudflare/latest — versión y peer dependencies consultados mediante `npm view`.
- https://registry.npmjs.org/@astrojs%2freact/latest — versión y compatibilidad React consultadas mediante `npm view`.
- https://registry.npmjs.org/wrangler/latest — versión del runner local fijada.
- https://registry.npmjs.org/@astrojs%2fcheck/latest — versión del verificador de Astro fijada.
- https://developers.cloudflare.com/d1/reference/sql-api/ — descartada: devolvió 404; se usó `/d1/sql-api/sql-statements/`.
- https://developers.cloudflare.com/d1/platform/import-export/ — descartada: devolvió 404; no se implementó importación en este bloque.

## Lote 2A: SQL local y concurrencia

- https://developers.cloudflare.com/d1/worker-api/d1-database/ — reconsultada: `batch()` revierte la secuencia completa ante fallo; binding real para pruebas locales, no transacciones SQL manuales.
- https://developers.cloudflare.com/d1/worker-api/prepared-statements/ — parámetros ordenados `?NNN`, `bind`, `all` y `first` para consultas y UPSERT con RETURNING.
- https://developers.cloudflare.com/d1/sql-api/foreign-keys/ — FK activas por defecto, restricciones y cascade; no intentar apagar integridad para fixtures.
- https://developers.cloudflare.com/d1/reference/migrations/ — historial `d1_migrations`, descubrimiento de SQL y reaplicación de sólo pendientes.
- https://developers.cloudflare.com/workers/wrangler/api/ — reconsultada: harness local con configuración inline y `applyD1Migrations`; sin registrar una base remota.
- https://developers.cloudflare.com/d1/platform/limits/ — reconsultada: una base procesa queries en serie, límite de fila 2 MB y 100 parámetros por sentencia; no sustituye prueba de concurrencia.
- https://www.sqlite.org/lang_upsert.html — conflicto por clave compuesta y WHERE del DO UPDATE para reserva condicional.
- https://www.sqlite.org/lang_datefunc.html — `strftime`, precisión milisegundos, fechas civiles y reloj UTC de SQLite.
- https://www.sqlite.org/withoutrowid.html — diferencia entre `INTEGER PRIMARY KEY` (alias de rowid) e `INT PRIMARY KEY`; se añadió NOT NULL para rechazar carrera_id omitido, sin convertir la tabla a WITHOUT ROWID.

## Lote 2B: rate limit y contadores

- https://developers.cloudflare.com/d1/worker-api/d1-database/ — reconsultada: atomicidad por sentencia y rollback de batch; no unir cupo/contador en un batch que borre el intento ante fallo posterior.
- https://developers.cloudflare.com/d1/worker-api/prepared-statements/ — reconsultada: binding ordenado y retorno null de `first()` al no actualizar por WHERE.
- https://developers.cloudflare.com/d1/platform/limits/ — reconsultada: serialización por base; se verificaron además cuotas e incrementos concurrentes en D1 local, sin inferir rendimiento remoto.
- https://www.sqlite.org/lang_upsert.html — reconsultada: WHERE del DO UPDATE convierte el conflicto en no-op; sirve para no incrementar/extender un cupo rechazado.
- https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ — SHA-256 con Web Crypto, equivalente hexadecimal a las claves actuales de Node crypto.

## Lote 2C: enlaces y robot (persistencia local)

- https://developers.cloudflare.com/d1/worker-api/d1-database/ — reconsultada: rollback de batch fallido; no implica que ya esté implementada la transacción de negocio completa ni los efectos externos.
- https://developers.cloudflare.com/d1/sql-api/foreign-keys/ — reconsultada: FK activas y cascade en consultas/enlaces/robot, sin desactivar integridad para fixtures.
- https://developers.cloudflare.com/d1/reference/migrations/ — reconsultada: upgrades por historial desde 0001/0002 a 0003 con datos sintéticos preservados.
- https://www.sqlite.org/lang_returning.html — UPDATE/INSERT con RETURNING para CAS de consumo, encolado único y reporte condicional; sin convertir lecturas de robot en claims.

## Lote 3A: API local, outbox y efectos simulados

- https://developers.cloudflare.com/d1/worker-api/d1-database/ — reconsultada: `batch()` ejecuta las sentencias en orden, no concurrentemente, y ante un fallo aborta o revierte la secuencia completa; base de la transacción enlace+consulta+outbox.
- https://www.sqlite.org/lang_corefunc.html y https://www.sqlite.org/c3ref/last_insert_rowid.html — `changes()` devuelve las filas afectadas por la sentencia anterior; `last_insert_rowid()` devuelve "el INSERT exitoso más reciente", que dentro de un `INSERT ... SELECT` se reevalúa por fila. Por eso el outbox usa `changes()` como guarda y `max(id)` como referencia de la consulta nueva: con tres efectos, `last_insert_rowid()` apuntó a la primera fila del propio outbox y la FK lo rechazó (fallo reproducido y corregido en este lote).
- https://developers.cloudflare.com/fundamentals/reference/http-headers/ — `CF-Connecting-IP` lo envía el borde de Cloudflare y no el cliente; se usa como fuente de la IP de cuota en lugar de `x-forwarded-for`.
- https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ — ya citada en 2B: SHA-256 del `Bearer` del robot sin `node:crypto`; la comparación en tiempo constante es código propio sobre los bytes del digest.
- https://developers.cloudflare.com/workers/runtime-apis/context/ — ya citada en el primer incremento: `waitUntil()` no se usa para trabajos críticos; los efectos quedan en el outbox durable.

## Lote 3B: tablas y adaptadores locales

- https://developers.cloudflare.com/workers/runtime-apis/web-crypto/ — `crypto.subtle` con HMAC y SHA-256, y `crypto.randomUUID()` de la versión 4: base del pase con Web Crypto y de los ids uuid de clases y newsletter.
- https://www.sqlite.org/lang_upsert.html — reconsultada: `ON CONFLICT` con expresión (`ifnull(carrera_id, 0)`) para reproducir `UNIQUE NULLS NOT DISTINCT` del newsletter, y `DO UPDATE` para renovar sin duplicar.
- https://www.sqlite.org/json1.html — `json_valid` y `json_type` con CHECK para guardar `dias`/`horarios` (en Postgres `text[]`) sin perder el contrato.
- https://developers.cloudflare.com/d1/worker-api/d1-database/ — reconsultada: el batch sigue siendo la transacción que hace atómico fila + outbox en FAQ y clases.

## Lote 3C: materias y FK de solicitudes

- https://developers.cloudflare.com/d1/sql-api/foreign-keys/ — reconsultada: D1 aplica FK también en migraciones, no permite desactivarlas con foreign_keys y diferirlas no elimina las acciones cascade. Se reconstruye también el outbox hijo para no perder avisos al retirar solicitudes.
