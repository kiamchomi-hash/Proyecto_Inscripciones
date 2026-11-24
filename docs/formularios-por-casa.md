# Formularios por casa

El sitio publicado usa `components/formularios/formulario-lead.tsx` y
`components/formularios/casas.ts`. Este último declara los campos, sus columnas
de `consultas`, los requisitos por casa y el armado del payload.

`POST /api/formularios` se implementa en `cloudflare/src/api/formularios.ts`.
Valida el pedido y guarda en D1 la consulta y los efectos asociados; el outbox
gestiona los avisos y, cuando corresponda, las altas de newsletter y los correos.
Antes de agregar un campo, verificar la columna en las migraciones de
`cloudflare/migrations/` y en la base D1; probar el recorrido en local, sin
enviar una consulta de prueba a producción.

Para «Ver precio», el servidor consulta `precios_privados` en D1 y devuelve el
precio sólo cuando está vigente. El formulario pide el mail en las dos casas y,
en Teclab, también el celular (obligatorio); el lead se guarda en `consultas`
con `tipo_formulario = 'precio'`. En Teclab ese registro dispara el aviso de
Telegram «Vio el precio»; en Siglo 21 se guarda sin aviso (24/11/2026). Los
correos se procesan mediante el outbox.
Las suscripciones y bajas se implementan en `cloudflare/src/datos/newsletter.ts`;
el envío programado vive en `cloudflare/src/api/newsletter.ts`.

Los controles del sitio publicado se ejecutan con `npm run check` desde
`cloudflare/`; las pruebas de campos compartidos están en `tests/`.
