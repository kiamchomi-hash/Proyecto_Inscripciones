# Resumen del precio por mail (Teclab)

## Objetivo

Cuando el sitio le muestra a alguien el precio vigente de una carrera de Teclab, le manda además un mail con el resumen: carrera, conceptos, total, qué cubre el pago, vigencia, financiación y los accesos para inscribirse o escribir por WhatsApp. Así le queda guardado.

## Decisión (usuario, 03/10/2026)

El envío sale por la API de SMTP2GO, desde `inscripciones@siglo21sur.com`. Resend no sirve: la cuenta es compartida con topykly y el plan gratis permite un solo dominio.

## Hechos verificados

- API (https://developers.smtp2go.com/docs/send-an-email): `POST https://api.smtp2go.com/v3/email/send`, header `X-Smtp2go-Api-Key`, cuerpo JSON con `sender`, `to` (array), `subject`, `html_body`, `text_body`. Éxito: 200 con `data.succeeded`/`data.failed`; error: `data.error_code`/`data.error`.
- El dominio ya está autenticado en SMTP2GO (DKIM `s776964._domainkey` y return-path `em776964`, CNAME en gris en Cloudflare; DMARC `p=reject`). Ver la memoria `mail-del-dominio-sale-por-smtp2go`.
- Hoy ningún código del sitio manda mails. La casilla de newsletter sólo guarda en `suscripciones_newsletter`.

## Cuándo se manda

- `kind: 'precio'` («Ver precio» del modal) con precio vigente.
- Preinscripción de Teclab con precio vigente (la que ya devuelve el precio, ver `odd/tasks/precio-en-autoinscripcion-teclab.md`).
- Vencido o sin precio: no se manda nada.

## Plantilla (usuario, 03/10/2026)

El mail usa el diseño ya aprobado el 02/10 en la sesión «Pendientes que afecten ventas Teclab», rescatado de su registro (la vista previa vivía en una carpeta temporal que se borró): `docs/mails/mail-inicio-teclab.html`. Fondo `#070f17`, tarjeta con borde azul, logo de Teclab blanco, píldora con la carrera, titular, tabla «Precio» con concepto/precio/descuento, total grande en cian, línea de cobertura, botón «Quiero inscribirme» azul y «Consultar por WhatsApp» con borde verde, cierre «Para lo que viene sos *imprescindible*» y pie con «Dejar de recibir novedades». Una sola plantilla para el resumen del precio y para el newsletter. Lo que había escrito el primer writer con otro diseño se reemplaza.

## Tareas

- [x] T1. Armado puro del mail (asunto, HTML y texto) con test. Ruta: delegada (writer).
- [x] T2. Envío por SMTP2GO desde `/api/formularios`, después de responder (`after()`), sin cambiar la respuesta ni tumbarla si falla; sin clave configurada no manda y lo registra. Tests. Ruta: delegada (mismo writer).
- [ ] T3. Documentación (falta sólo `.env.example`): `.env.example`, `docs/variables-de-entorno.md`, `docs/formularios-por-casa.md`. Ruta: delegada (mismo writer).
- [ ] T5. Newsletter: a quien se suscribe, un mail con la misma plantilla cada X días (no por inicio de clases). Tarea aparte; falta definir X y la baja. Ruta: pendiente.
- [ ] T4. El usuario crea la clave de API en SMTP2GO y la carga en Vercel como `SMTP2GO_API_KEY` (Sensitive), y después redeploy. Ruta: usuario.

## Riesgos

- Cualquiera puede escribir el mail de otra persona y hacerle llegar un resumen. Lo frenan Turnstile y el rate limit del endpoint; el mail no contiene datos de nadie más que la carrera y el precio.
- Tocar «Ver precio» varias veces en la misma carrera manda un mail por pedido.

## Progreso

- 03/10/2026: documento creado; T1 a T3 delegadas a un writer.
- 03/10/2026: T1 y T2 hechas, T3 casi (ruta delegada, un writer). T1: `components/formularios/mail-precio.ts` rehecho sobre la plantilla aprobada; recibe `hoy` y el titular sale de `inicioTeclab` (antes del 14/10 «Las clases arrancan el 14 de octubre», hasta el 03/11 «Tenés tiempo hasta el 3 de noviembre», después «El precio de tu carrera»); pie transaccional sin enlace de baja; logo PNG de 280 px en `public/imagenes/teclab/mail/logo-teclab-blanco.png`, también en la plantilla de `docs/mails/`. T2: envío con `after()` revisado; el armado se importa adentro de la tarea porque los otros tests cargan el endpoint sin él. T3: `docs/variables-de-entorno.md` y `docs/formularios-por-casa.md`; **`.env.example` pendiente** (el writer no tiene permiso de lectura sobre ese archivo). Evidencia: `tests/mail-precio.test.mjs` RED (no cargaba) y GREEN 12/12; `tests/ver-precio.test.mjs` 21/21 (sin el envío, 4 fallan); lint 0 errores; typecheck ok; `npm test` 305/305. Muestra: `.playwright-mcp/mail-precio-muestra.png`.
- 03/10/2026 (parent): la píldora y el WhatsApp usan el nombre como la ficha (prefijo de la base + nombre: «Tecnicatura Superior en Programación»); `carreraFullName` se comía el «Superior». Test con el prefijo real de la base: RED 2 fallas, GREEN 12/12. `.env.example` sin tocar: los permisos bloquean leerlo, lo agrega el usuario.
