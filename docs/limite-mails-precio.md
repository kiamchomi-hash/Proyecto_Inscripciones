# Límite de correos de «Ver precio»

El sitio publicado procesa los correos mediante el outbox del Worker y guarda
las reservas en D1. La implementación está en
`cloudflare/src/operativa/consumidores.ts` y `cloudflare/src/operativa/transportes.ts`;
el esquema está en `cloudflare/migrations/`.

Ante un resultado de envío incierto, no borrar reservas ni reintentar sin
verificar primero el resultado del proveedor: podría haber aceptado el correo.
Las pruebas de la operativa están en `cloudflare/tests/`.
