# Migración completa a Cloudflare: diseño aprobado

El 24/10/2026 el usuario aprobó Astro + React + Workers + D1/R2 para
reemplazar Next.js, Vercel y Supabase. La decisión histórica del 18/10 en
`docs/criterios.md` trataba sólo de hosting con OpenNext: no se corrige ni se
reescribe. Esta aprobación abre un alcance nuevo.

## Arquitectura destino

- Astro con adaptador oficial de Workers; React conserva los componentes
  interactivos, sus estilos y textos. Páginas fijas prerenderizadas; contenido
  editable renderizado en servidor. Sin caché de HTML mutable al principio:
  publicación inmediata sin reconstruir el sitio; optimización posterior medida.
- API Workers con los contratos actuales. Sólo el backend accede a D1 mediante
  bindings y SQL parametrizado. El navegador nunca recibe credenciales ni acceso
  directo a tablas privadas. Lecturas públicas con proyecciones explícitas.
- D1 conserva contenido, leads, precios privados, reservas, enlaces y estados del
  robot. Se convierten JSONB, fechas, UUID, booleanos, secuencias y SQL PostgreSQL
  a semántica SQLite sin cambiar IDs ni contratos públicos.
- R2 conserva archivos de Storage, con inventario y huellas independientes de la
  base. Mantener rutas públicas propias cuando sea posible; reescribir referencias
  embebidas y comprobar imágenes, video, Range, Content-Type y permisos.
- Outbox en la misma transacción que la escritura de negocio. Queues transporta
  referencias, no legajos completos; consumidores con deduplicación, reintentos
  acotados y cola de fallos. Cron Triggers reemplaza los tres crons de Vercel y los
  jobs PostgreSQL que el inventario remoto confirme activos.
- Secretos sólo en runtime, separados de variables públicas. Builds sin heredar
  `.env.local`, tokens o contraseñas. No usar `define: process.env` ni copiar el
  entorno completo al bundle. Mantener controles de secretos y check antes de
  cualquier publicación futura.

## Qué no cambia

UI, copy, formularios por casa, URLs, códigos de redirects, títulos, canonical,
JSON-LD, sitemap, robots/noindex, oferta visible e imágenes. Se conservan los
helpers puros y contratos de `components/formularios/casas.ts` y
`components/index/types.ts`. SMTP2GO, Telegram, Turnstile, HubSpot, Google
Analytics/Search Console y el robot privado de GitHub Actions siguen siendo
integraciones externas; Cloudflare no reemplaza esos servicios.

Los scripts comerciales privados siguen locales. Los publicadores de precios y
el extractor de planes dejarán `pg`/Supabase por una API autenticada de alcance
acotado. El corpus y motor del bot no necesitan mudarse a Workers ni versionarse.

## Seguridad y semántica que deben reconstruirse

RLS/grants, funciones PL/pgSQL y RPC, triggers HTTP, pg_net, pg_cron y Vault no
son portables a D1. La autorización pasa al backend y sus pruebas negativas.
Preservar rate limit atómico, límite de correo por dirección/carrera de 168 horas,
consumo único de enlaces, consentimiento/baja y transiciones del robot.

Queues entrega al menos una vez. No prometer entrega exactamente una vez de
correo o Telegram: un timeout después de aceptación externa es ambiguo. Mantener
la reserva y no reintentar automáticamente un correo ambiguo, como hoy. La
outbox evita perder trabajos entre confirmar D1 y publicar en la cola.

El panel fue eliminado (`b1e3ac2`); no recrear login por inercia. Inventariar Auth,
profesores y consumidores externos antes de retirar Supabase. Rehacer el embudo
de eventos y sus lectores, digest, WAF y alertas, sin duplicar la vigilancia ya
existente. Cabeceras deben cubrir también assets, redirects, errores y APIs.

## Gates antes de datos reales o corte

1. Inventario autorizado de esquema, tamaños, usuarios, buckets, jobs, permisos,
   referencias de archivos, consumidores y costos reales; sin publicar valores.
2. Respaldo completo cifrado y restauración aislada comprobada, incluidos objetos
   y configuración. `cau_editor` no alcanza; seguir `docs/recuperacion-supabase.md`.
   Acordar y medir RPO/RTO. Un fixture no acredita recuperación de producción.
3. Paridad funcional, visual, SEO, seguridad y operativa en destino aislado, sin
   correo/Telegram/robot reales ni indexación accidental.
4. Un único escritor y un único ejecutor de avisos/crons durante el corte.
   Pausa breve de escrituras, delta final validado y activación coordinada.
5. Rollback con pausa y reconciliación de escrituras posteriores al corte antes
   de volver al origen. Revertir DNS o código solo no recupera esos datos.
   Mantener proveedores anteriores hasta demostrar estabilidad y recuperación.

## Costos y alternativa

Workers Paid parte de USD 5/mes, no de un precio final garantizado. Medir requests,
CPU, filas leídas/escritas, almacenamiento, operaciones R2/Queues y observabilidad.
D1 Paid limita cada base a 10 GB y cada fila a 2 MB; Time Travel retiene 30 días.
Supabase está documentado en Free: retirarlo no ahorra una suscripción por sí solo.

Alternativa evaluada: PostgreSQL administrado externo mediante Hyperdrive con
Astro/Workers/R2. Menos conversión SQL, pero otro proveedor/costo y no concentra
todo en Cloudflare. No es la arquitectura aprobada. OpenNext mantiene Next.js y
no satisface el objetivo.

## Entrega actual

Sólo documentación y primera base local aislada en `cloudflare/`, sin migrar UI,
contenido ni datos. Sin deploy, DNS, facturación, recursos remotos, commits ni
push. Plan: [bloques y aceptación](2026-10-24-cloudflare.md).
Fuentes: [enlaces consultados](../../referencias/2026-10-24-migracion-cloudflare.md).
