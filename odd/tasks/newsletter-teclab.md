# Newsletter de Teclab cada 7 días (pendiente 37)

## Objetivo

A cada suscripción activa a una carrera de Teclab, mandarle cada 7 días el mail con la plantilla de `docs/mails/mail-inicio-teclab.html` y el precio vigente de su carrera, con baja de un clic.

## Decisiones (usuario, 03/10/2026)

- Cada 7 días desde la suscripción, no por inicio de clases.
- Arranca sólo con suscripciones a carreras de Teclab (la plantilla es de Teclab). Siglo 21, Identidad y las generales quedan para después.
- Sale por SMTP2GO, desde `inscripciones@siglo21sur.com`, igual que el resumen del precio (`odd/tasks/mail-precio-teclab.md`).

## Hechos verificados

- `suscripciones_newsletter` tiene `id` (uuid), `email`, `carrera_id`, `carrera_nombre`, `activo`, `consentimiento_at`, `created_at`, `updated_at`. Falta `ultimo_envio_at`: `sql/2026-10-03_newsletter_ultimo_envio.sql`, lo corre el usuario.
- `vercel.json` ya tiene un cron (`/api/vigilancia`, cada 6 h) autenticado con `CRON_SECRET`.
- SMTP2GO: `custom_headers` es un array de `{ header, value }` (https://developers.smtp2go.com/reference/send-standard-email).

## Tareas

- [x] T1. SQL de `ultimo_envio_at`. Ruta: inline (escrito); lo corrió el usuario el 03/10/2026 y `npm run db:tipos` ya trae la columna.
- [x] T2. Variante newsletter de `armarMailPrecio`: asunto propio, pie «Te escribimos desde el CAU porque pediste novedades de esta carrera en siglo21sur.com.» con «Dejar de recibir novedades». Ruta: delegada (writer).
- [x] T3. Cron `/api/newsletter`: suscripciones activas de Teclab con 7 días desde el último envío (o el consentimiento), precio vigente, envío por SMTP2GO con `List-Unsubscribe` y `List-Unsubscribe-Post`, y `ultimo_envio_at` recién con el envío confirmado. Ruta: delegada (mismo writer).
- [x] T4. Baja: página `/newsletter/baja?id=…` con botón, y `POST /api/newsletter/baja` que pone `activo = false` (también la usa el clic de Gmail). Ruta: delegada (mismo writer).
- [x] T5. Documentación y tests. Ruta: delegada (mismo writer).
- [ ] T6. El usuario corre el SQL y activa SMTP2GO (pendiente 36).

## Progreso

- 03/10/2026: documento creado; SQL escrito y copiado al portapapeles; T2 a T5 delegadas a un writer.
- 03/10/2026: T2 a T5 hechas (ruta delegada, un writer). T2: `armarMailPrecio` con `tipo: 'newsletter'` y `bajaUrl` (asunto «Programación en Teclab: las clases arrancan el 14 de octubre», neutro «el precio de esta semana»; pie del CAU con baja real); sin tipo, el resumen no cambia. El envío quedó en `mandarPorSmtp2go` del mismo módulo y `/api/formularios` lo usa (mismos registros). T3: `GET /api/newsletter` (cron `0 13 * * *`), lee las carreras de Teclab activas con precio vigente y filtra las suscripciones por ellas en la consulta, con la regla de 7 días en un `or`, tope 50, de a una, `custom_headers` con `List-Unsubscribe` y `List-Unsubscribe-Post`, y `ultimo_envio_at` sólo con envío confirmado. T4: `POST /api/newsletter/baja` (id en la query: 200; en el cuerpo: 303 a `?listo=1`; no UUID: 400; inexistente: 200) y `/newsletter/baja` con botón, sin escribir al abrirla, noindex. La CSP ya tiene `form-action 'self'`. T5: `docs/formularios-por-casa.md` y `docs/variables-de-entorno.md`. Evidencia: `tests/mail-precio.test.mjs` RED 3 fallas, GREEN 17/17; `tests/newsletter-envio.test.mjs` RED (no cargaba), GREEN 15/15; `tests/ver-precio.test.mjs` 21/21; lint 0 errores (27 avisos previos); typecheck ok; `npm test` 325/325. `ultimo_envio_at` se agregó a mano en `lib/database.types.ts`: **después de correr el SQL, `npm run db:tipos`** y revisar el diff. Hasta correr el SQL el cron responde 500 sin mandar nada.
- 03/10/2026 (parent, pedidos del usuario): el cuerpo del mail ya no lleva el titular grande («Las clases arrancan…», ocupaba demasiado alto); queda la línea chica bajo la píldora y la fecha sigue en el asunto del newsletter. «Quiero inscribirme» del mail lleva a la ficha con `?desde=mail` (`PARAMETRO_DESDE`/`VALOR_DESDE_MAIL` en elegir-carrera.ts) y `components/carreras/resaltar-inscripcion.tsx` hace titilar el contorno del botón de inscripción del encabezado (4 vueltas; fijo con reducir movimiento) y limpia la dirección. Tests del mail RED 4 → GREEN; Playwright 390x844: clase puesta, URL limpia, contorno de transparente a blanco. `npm run db:tipos` regenerado tras el SQL.
