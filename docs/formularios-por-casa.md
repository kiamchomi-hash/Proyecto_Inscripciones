# Los formularios por casa: `components/formularios/casas.ts`

Sale de `CLAUDE.md`, que deja la invariante y el puntero. Leer esto antes de tocar un formulario o agregarle un campo.

El sitio tiene **dos formularios por casa** —contacto y preinscripción— y un único componente que los pinta, `components/formularios/formulario-lead.tsx`. Lo que cambia entre uno y otro no está en el componente sino en `casas.ts`, que declara tres cosas:

- **`CAMPOS`**: los campos que existen y, al lado de cada uno, **la columna de `consultas` donde se guarda**. Ahí está el punto: `insertConsulta` arma la fila con `columnaDe()` y no tiene ni un nombre de columna escrito a mano. El 23/08/2026 el endpoint apuntó a nueve columnas inexistentes y, como PostgREST rechaza la fila entera cuando una no existe (PGRST204), **dejaron de entrar todas las consultas del sitio** —home, `/contacto` y los dos de `/teclab`— porque los tres mandan `kind: 'consulta'`. Un test de `security.test.mjs` falla si vuelve a aparecer un literal de columna en el endpoint.
- **`CASAS`**: qué pide cada casa (`siglo21`, `teclab`, `identidad`) en cada modo, y cuáles bloquean el envío. Los obligatorios bloquean **sólo en preinscripción**: un legajo a medias no sirve, una consulta que rebota es un lead perdido. Ojo con las diferencias reales — Siglo 21 pide tipo de documento, tipo de domicilio, torre y barrio, y **no** pide nivel de estudios ni colegio, que son de Teclab.
- **`armarPayload()`**: qué viaja. Los campos que la casa no pide siguen en el estado del componente —si el lead vuelve a esa carrera los encuentra como los dejó— pero no se mandan.

En la home la casa **la define la carrera elegida** y el formulario cambia solo; en `/teclab` va fija por props. `casa` y `tipo_formulario` se guardan en la fila, y con eso el aviso de Telegram encabeza "PREINSCRIPCIÓN — Teclab" o "Consulta — Siglo 21".

El formulario de **contacto** pide sólo nombre, apellido y una vía de respuesta: email o teléfono. Elegir carrera sigue siendo opcional. Localidad queda para la preinscripción, donde sí forma parte del legajo; mostrarla antes sumaba fricción sin bloquear ni mejorar el envío.

En la **preinscripción** se exige todo salvo piso, depto y torre, y lo que cada casa declara en `opcionales` porque su portal no lo exige. Hoy sólo Teclab: el código postal (relevado el 19/10/2026, el portal crea la preinscripción sin él).

Va todo en un archivo a propósito: Node strippea los tipos y corre los `.ts` en los tests, pero **no resuelve imports de valor entre `.ts` sin extensión**, y el `tsconfig` usa `moduleResolution: bundler` sin `allowImportingTsExtensions`. Separarlo deja la lógica sin poder testearse.

Antes de agregar un campo, **verificar que la columna exista de verdad**: desde local se puede con la anon key, `GET /rest/v1/consultas?select=<columna>&limit=1` — un `42703` en la respuesta es la columna que falta. Y después, mandar una consulta real: el incidente pasó porque el `INSERT` nunca se ejecutó contra la tabla.

## Newsletter: el campo `newsletter`

Los formularios que piden mail suman el checkbox «Quiero recibir novedades por mail», **tildado de entrada** (decisión del 02/10/2026): contacto y preinscripción de `formulario-lead.tsx` en las tres casas, el de `/contacto` y la pregunta de `/faq` (en la respuesta personal se muestra sólo cuando el contacto tiene una `@`). Viaja en el payload como `newsletter: boolean`, al lado de los campos, y **no es un campo de `CAMPOS`**: no tiene columna en `consultas` y `insertConsulta` nunca lo escribe ahí.

- Suscribe sólo con un `true` explícito y un mail válido: `email` en `consulta`, `contacto` en `faq` (en la pregunta privada puede ser un WhatsApp, y entonces no se suscribe). La lógica pura está en `casas.ts`, sección *Newsletter* (`mailParaNewsletter`, `carreraIdDe`, `filaNewsletter`).
- Corre **después** de la escritura principal y sólo si salió bien. Hace upsert en `suscripciones_newsletter` con conflicto por `email,carrera_id`, así que repetir renueva. Si falla, se registra y la respuesta sigue siendo 201: el lead ya está guardado.
- La carrera: el formulario de la home y las fichas mandan además `carreraId` (tampoco llega a `consultas`). La API busca el nombre en `carreras` con ese id, no confía en el texto del navegador. Sin carrera, con una que no existe o si falla la lectura, la suscripción entra como **general**, con `carrera_id` y `carrera_nombre` en null. Una general por mail: la unicidad es `NULLS NOT DISTINCT` (`sql/2026-10-02_newsletter_general.sql`).
- `tests/newsletter.test.mjs` cubre con carrera, sin carrera, sin checkbox, el fallo de la suscripción y que `newsletter` no llegue a la fila de `consultas`.

## «Ver precio»: `kind: 'precio'`

El modal de Teclab cambia el mail por el precio de la carrera. Va por el mismo endpoint y en el mismo orden que el resto (sobre → Turnstile y cuota en paralelo → payload → escrituras), con su propia cuota (`precio:<hash>`). La declaración vive en `casas.ts`, sección *Ver precio*: los campos (`CAMPOS_PRECIO`, con la columna de `CAMPOS`), las casas que publican precio (`CASAS_CON_PRECIO`, hoy sólo Teclab), la validación del payload y la decisión de vigencia.

```json
// pedido
{ "kind": "precio", "token": "<turnstile>",
  "payload": { "carreraId": 123, "email": "ana@example.com", "newsletter": true } }

// 201, según la vigencia
{ "ok": true, "estado": "vigente",
  "precio": { "conceptos": [{ "concepto": "Matrícula", "monto": "$ …", "descuento": 75 }],
              "total": "$ …", "nota": "Ese pago cubre un bimestre de cursada.", "vigenteHasta": "2026-10-01" } }
{ "ok": true, "estado": "vencido", "vigenteHasta": "2026-10-01" }
{ "ok": true, "estado": "sin-precio" }
```

- **Sólo se pide el mail**, y es obligatorio, a diferencia de la consulta: es lo que se cambia por el precio. El nombre no se pide; si llega, se ignora y `consultas.nombre` queda en null. `carreraId` tiene que ser un entero; `newsletter` suscribe sólo con un `true` explícito. Un payload inválido o una carrera que no es de Teclab, no existe o no está activa devuelven 400 sin escribir nada. La casa se valida contra el `nivel` de la base, no contra lo que mande el navegador.
- **El lead entra primero**, en `consultas`, con `casa: 'teclab'`, `tipo_formulario: 'precio'`, `tipo: 'Ver precio'` y el nombre de la carrera. El aviso de Telegram sale por el trigger de siempre y muestra "Tipo: Ver precio". Si ese `INSERT` falla, la respuesta es 500 y **no hay precio**.
- Con el checkbox, además suscribe al newsletter de esa carrera, con la misma escritura que el resto de los formularios (ver *Newsletter*, arriba). Si falla, se registra y la respuesta sigue: el lead ya está guardado.
- El precio se lee con la service role de `precios_privados`, tabla sin acceso para `anon` ni `authenticated` (`sql/2026-10-02_precios_carrera.sql`). Si el precio estuviera en el HTML o en una tabla pública, el registro sería decorativo. Se muestra hasta `vigente_hasta` **inclusive**, comparado contra la fecha de Argentina, no la UTC. Vencido, sin fila o con error de lectura, la respuesta no trae montos y la ventana ofrece WhatsApp.
- Los precios los carga `herramientas/ventas/publicar-precios-d1.mjs` (ver [herramientas](herramientas.md)). `tests/ver-precio.test.mjs` cubre la validación, la vigencia y el endpoint con Supabase simulado.

### Mail con el resumen del precio

- **Cuándo**: sólo con precio `vigente`, en «Ver precio» y en la preinscripción de Teclab que devuelve el precio (ahí, sólo si la persona dejó un mail válido, que en ese formulario es opcional). Vencido o sin precio no se manda nada.
- **Cómo**: `POST https://api.smtp2go.com/v3/email/send` con `X-Smtp2go-Api-Key: SMTP2GO_API_KEY`, remitente `CAU Online <inscripciones@siglo21sur.com>` (dominio ya autenticado en SMTP2GO), HTML y texto. Sin la clave no manda y deja un `console.warn`.
- **Nunca bloquea**: corre con `after()`, con el 201 ya enviado, y un timeout de 8 s. Si SMTP2GO rechaza o no responde, el lead y el precio ya salieron; el registro lleva sólo el `status` y el `error_code`, nunca el mail de la persona ni la clave.
- **Plantilla**: el armado es `armarMailPrecio` en `components/formularios/mail-precio.ts` (puro, probado en `tests/mail-precio.test.mjs`); el envío, `mandarPorSmtp2go` del mismo módulo, que comparte con el newsletter y copia el diseño aprobado, `docs/mails/mail-inicio-teclab.html`: si cambia uno, cambia el otro. El titular usa la misma lógica de inicio de clases que la ficha (`inicio-teclab.ts`); el logo es un PNG público en `public/imagenes/teclab/mail/` (Outlook de escritorio no muestra WebP). Es un resumen transaccional: no lleva enlace de baja.
- **Riesgos**: cualquiera puede escribir el mail de otra persona y hacerle llegar un resumen; lo frenan Turnstile y la cuota del endpoint, y el mail no lleva datos de nadie, sólo la carrera y el precio. Pedir el precio varias veces en la misma carrera manda un mail por pedido.

## Newsletter de Teclab: `GET /api/newsletter`

Cron del Worker (`cloudflare/produccion/wrangler.json`, `0 13 * * *`: todos los días a las 10 de Argentina) que le manda a cada suscripción el mail de la plantilla aprobada con el precio vigente de su carrera. No es un formulario: no pasa por `/api/formularios`.

- **Cadencia**: si nunca se le mandó (`ultimo_envio_at` vacío), en la primera corrida con precio vigente: quien se suscribió cuando no había precio o estaba vencido lo recibe apenas se actualiza. Después, cada 7 días desde el último envío. El mail de resumen de «Ver precio» marca `ultimo_envio_at` si la persona está suscripta a esa carrera, así no se repite al día siguiente. La regla va en la consulta (`or` de PostgREST). Volver a suscribirse renueva el consentimiento pero no borra el último envío.
- **Alcance**: suscripciones activas a carreras de Teclab activas con precio `vigente` hoy. Las carreras se leen primero y las suscripciones se filtran por ellas en la misma consulta, para que las que no pueden salir no ocupen el tope todos los días. Siglo 21, Identidad y las generales (sin carrera) quedan afuera hasta tener plantilla. Tope de 50 por corrida, de a una; lo que no entra sale al día siguiente.
- **Autenticación**: igual que `/api/vigilancia`, `Authorization: Bearer CRON_SECRET` (Vercel lo manda solo). Sin la variable responde 503; con otro valor, 401. Sin `SMTP2GO_API_KEY` responde 503 sin leer la base ni mandar nada.
- **El mail**: `armarMailPrecio` con `tipo: 'newsletter'`. Asunto `<nombre corto> en Teclab: <titular>` («Programación en Teclab: las clases arrancan el 14 de octubre»; con la inscripción cerrada, «el precio de esta semana»). Pie «Te escribimos desde el CAU porque pediste novedades de esta carrera en siglo21sur.com.» con «Dejar de recibir novedades» a `/newsletter/baja?id=<id>`.
- **Encabezados de baja**: `custom_headers` de SMTP2GO con `List-Unsubscribe: <https://www.siglo21sur.com/api/newsletter/baja?id=<id>>` y `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058, lo que piden Gmail y Yahoo a los envíos masivos).
- **`ultimo_envio_at`**: se escribe sólo cuando SMTP2GO confirma (`data.succeeded >= 1` sin fallidos). Un rechazo o un timeout cuenta como fallido y la suscripción vuelve a salir al día siguiente. Si el mail salió pero no se pudo marcar, se registra y mañana se repite.
- **Respuesta**: `{ candidatas, enviados, salteados, fallidos }`. Los registros llevan cantidades y códigos de error, nunca mails, ids (el id es la baja) ni la clave.
- **Requiere** la columna `ultimo_envio_at`: `sql/2026-10-03_newsletter_ultimo_envio.sql`, a mano en el SQL Editor. Sin ella la consulta falla y el cron responde 500 sin mandar nada. Después, `npm run db:tipos` (el tipo ya se agregó a mano en `lib/database.types.ts`).

### La baja

- `/newsletter/baja?id=<id>` muestra un botón; abrirla **no** da de baja, porque los escáneres de enlaces de los correos abren todo. Con `?listo=1` confirma. No se indexa y no lee la base.
- `POST /api/newsletter/baja` pone `activo = false`. Toma el id de la query (la baja de un clic de Gmail, responde 200) o del cuerpo del formulario de la página (responde 303 a `/newsletter/baja?listo=1`). Un id que no es UUID es 400; uno que no existe responde igual que uno que sí, para no confirmar suscripciones. La CSP ya permite el envío (`form-action 'self'`).
- `tests/newsletter-envio.test.mjs` cubre el cron (autenticación, la regla de los 7 días, el alcance, los encabezados, la marca sólo con envío confirmado, sin clave) y la baja (los dos caminos, id mal formado o inexistente, y que la página no escriba).

## Autoinscripción de Teclab: dada de baja (27/10/2026)

Existió una autoinscripción: `kind: 'autoinscripcion'`, un pase HMAC para no pedir
un segundo captcha, un enlace personalizado `/inscripcion/<código>` y un robot en
GitHub Actions que cargaba la preinscripción en el Portal Administrativo de
Teclab. **Se retiró todo.** Hoy la preinscripción de Teclab es una consulta como
la de las otras casas: entra en `consultas`, avisa por Telegram y la atención
sigue a mano. El historial está en `odd/tasks/autoinscripcion-teclab.md`.

- Los `kind` válidos son `consulta`, `faq`, `clase` y `precio`. `autoinscripcion`
  y `enlace` devuelven 400 «Solicitud inválida», y no existe el campo `pase`.
- `ROBOT_SECRET`, `ROBOT_GITHUB_TOKEN` y `ROBOT_GITHUB_REPO` ya no existen, igual
  que `/api/robot/autoinscripciones`. La migración
  `cloudflare/migrations/0011_quitar_autoinscripcion.sql` borra las tablas
  `robot_autoinscripciones` y `enlaces_inscripcion` (las dos estaban vacías).
- El formulario no tiene flujo directo, captcha invisible ni botón «Inscribirme»:
  envía con «Enviar preinscripción» y confirma con «Preinscripción enviada» y
  «Nos comunicamos a la brevedad.», con «Ver precio» si la respuesta trae precio
  vigente.


### El precio que quedó

La preinscripción sigue devolviendo el precio vigente cuando lo hay, y el cliente lo ofrece después de confirmar el envío: «Ver precio» abre la pantalla del precio y «Volver» regresa a la confirmación sin otro pedido. **`components/formularios/financiacion-teclab.ts`** sigue alimentando las líneas de «Financiación» de esa pantalla (vigente desde el 26/08/2026; se actualiza con cada placa nueva).

### Carreras anunciadas (`proximamente`)

Una carrera con `proximamente = true` (desde el 10/10/2026, las cinco nuevas de Teclab) todavía no está cargada en la casa, pero acepta la preinscripción: el lead la elige en el formulario, la fila entra en `consultas` y el trigger `on_consulta_insert` avisa por Telegram. **Nada más.** `carreraConPrecio` (`casas.ts`) la descarta, así que la respuesta es sólo `{ ok: true }`: sin precio y sin mail del precio. `tests/preinscripcion-proximamente.test.mjs` lo cubre.

## Alta del lead en la landing de la sede (Teclab)

Teclab asigna el lead a la sede por su landing de HubSpot (`vinculacion.teclab.edu.ar/expo-bs-as-esposito`, portal `5880041`, formulario `a19c1564-e23a-475c-a16a-11aa244c1b9e`, sin captcha). El contrato y su consumidor siguen en el código, pero **ningún alta lo genera** desde la baja de la autoinscripción: el efecto `lead-sede` quedó sin emisor y sólo se envía si existe una fila en el outbox. Si se quiere que cada preinscripción de Teclab vuelva a dar de alta el lead en la sede, hay que encolar ese efecto en `registrarConsulta`.

- **Qué viaja** (`pedidoLeadSede` en `casas.ts`): `firstname`, `lastname`, `email`, `phone`, `carrera`, `provincia` y los ocultos `token_landings` y `empresas_form` (los dos con el id del formulario), con `context.pageUri` y `pageName` de la landing. `cuando_te_recibis_` no se manda; un campo vacío tampoco.
- **`carrera`** tiene que ser exactamente una opción de la lista de HubSpot. `carreraHubspotDe` la saca del nombre de la base por palabras clave normalizadas (acepta nombres viejos y nuevos: Cloud Administration / Servicios en la Nube, Gestión Agraria / Empresa Agraria, Customer Experience / Experiencia del Cliente, Seguros / P.A.S.). Sin opción no se manda nada y queda un `console.warn`.
- **`provincia`** sale de `provinciaHubspotDe`, que compara el texto entero normalizado contra la lista; CABA, Capital Federal y Ciudad (Autónoma) de Buenos Aires van como «Buenos Aires». Teclab no pide provincia, así que se prueba con la localidad; si no coincide («Villa Lugano»), el campo se omite.
- `tests/lead-sede-teclab.test.mjs` cubre el mapeo de carreras y provincias y el armado del pedido.

## El robot de Teclab: dado de baja (27/10/2026)

El robot vivía en el repo privado `cau-robot-teclab` (GitHub Actions) y cargaba la preinscripción en el Portal Administrativo de Teclab. Se retiró junto con la autoinscripción: no quedan `robot_autoinscripciones`, ni `/api/robot/autoinscripciones`, ni los efectos `robot-encolar`, `robot-despacho` y `aviso-robot-error`, ni el chequeo de la vigilancia que avisaba cuando la cola se demoraba. La preinscripción se carga a mano, como antes del 03/10/2026.

Rate limit: RPC `check_form_rate_limit(p_key, p_max_requests, p_window_seconds)` con la IP hasheada en SHA-256. La clave incluye el `kind` (`consulta:<hash>`), así que el tope es **5 pedidos por cada tipo** por 10 min — una misma IP puede mandar 20 en total entre los cuatro (`consulta`, `faq`, `clase` y `precio`). `/api/track-click` usa 60 (navegar 20 tarjetas es uso normal).

Turnstile se verifica en `lib/turnstile.ts`, que además compara el `hostname` que devuelve Cloudflare contra `TURNSTILE_EXPECTED_HOSTNAME` (normaliza `www.`). Sin `TURNSTILE_SECRET_KEY`, el endpoint devuelve 503, salvo en desarrollo con `NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL=1`: sólo ahí acepta `rate-limit-only`. El widget emite ese token únicamente en ese modo y sin site key. **No saltea el rate limit ni la credencial de escritura**: sin `SUPABASE_SERVICE_ROLE_KEY`, un envío que llega a consultar la cuota devuelve 503. Las claves de prueba de Cloudflare son la alternativa para comprobar la integración completa del captcha.

El JSON mal formado y los sobres nulos, arrays o sin discriminadores válidos devuelven 400 antes de consultar captcha o base. `tests/formularios-api.test.mjs` ejecuta el handler con dependencias simuladas y cubre sobre inválido, captcha rechazado, cuota agotada, error de escritura, éxito y aislamiento del modo local.

## Modo demo (sólo desarrollo)

Para recorrer en local todo el frontend de la preinscripción («Ver precio», la preinscripción y «¡Listo!») sin resolver el captcha y sin escribir nada:

1. Sumar `NEXT_PUBLIC_FORMULARIOS_DEMO=1` a `.env.local`.
2. Levantar `npm run dev` (reiniciarlo si ya estaba corriendo: las `NEXT_PUBLIC_` se leen al arrancar).

El chequeo vive en `lib/formularios-demo.ts` y exige además `NODE_ENV=development`: en producción la bandera no cambia nada aunque esté en `1`. Con el modo activo:

- `components/turnstile-widget.tsx` no carga Cloudflare (aunque haya site key), no pinta nada y entrega el token `demo`.
- `POST /api/formularios` valida el sobre y el payload igual que en real (lo inválido sigue dando 400) y responde 201 con la misma forma, sin tocar la base, la cuota, Turnstile, SMTP2GO ni el newsletter. Deja un `console.info` de una línea por envío, sin datos de la persona.
- «Ver precio» y la preinscripción de Teclab devuelven un precio ficticio, fijo y rotulado «(demo)», vigente por 30 días; no se lee `precios_privados`. El resto de los envíos devuelve sólo `{ ok: true }`.
- La casa sale de lo que manda el navegador, no de la base: el modo demo no verifica la carrera.

`tests/formularios-demo.test.mjs` cubre el 201 por cada `kind` sin llamadas a la base ni a la red, el 400 de los payloads inválidos y que fuera de desarrollo todo siga igual.

## Siglo 21: precios 2027 y preinscripción

El catálogo permite consultar el precio con mail y suscripción opcional al newsletter, reutilizando el flujo de Teclab. Los conceptos son matrícula, bimestre 1 y bimestre 2 de 2027. Los importes nunca viajan en el catálogo ni se versionan: se leen de `precios_privados` después de guardar el lead.

El resumen transaccional y el newsletter usan la marca de Universidad Siglo 21 y enlazan a `/carreras/<slug>/inscripcion`, con su formulario de preinscripción. No incluyen financiación ni promociones de Teclab. La autoinscripción de Siglo 21 queda pendiente: el formulario sólo registra la solicitud y la atención continúa manualmente.

La preparación privada local se hace con `herramientas/ventas/publicar-precios-siglo21.mjs --carreras <export-local.json>`, usando el módulo de lista 2027 existente y los alias de carreras. No conecta a la base ni lee credenciales. Genera `ventas/precios/2027/precios-siglo21-web.json`, ignorado por git. `cotizable: false` identifica la lista; no invalida los importes extraídos. No se aplican descuentos ni promociones al export web.

La lista no declara fecha de caducidad y el esquema exige `vigente_hasta NOT NULL`: sin `--vigente-hasta AAAA-MM-DD` confirmado, el export queda marcado como no publicable. No se inventa una vigencia anual. La carga privada y el deploy requieren autorización remota; no se ejecutaron en este trabajo local.
