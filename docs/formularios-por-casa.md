# Los formularios por casa: `components/formularios/casas.ts`

Sale de `CLAUDE.md`, que deja la invariante y el puntero. Leer esto antes de tocar un formulario o agregarle un campo.

El sitio tiene **dos formularios por casa** —contacto y preinscripción— y un único componente que los pinta, `components/formularios/formulario-lead.tsx`. Lo que cambia entre uno y otro no está en el componente sino en `casas.ts`, que declara tres cosas:

- **`CAMPOS`**: los campos que existen y, al lado de cada uno, **la columna de `consultas` donde se guarda**. Ahí está el punto: `insertConsulta` arma la fila con `columnaDe()` y no tiene ni un nombre de columna escrito a mano. El 23/08/2026 el endpoint apuntó a nueve columnas inexistentes y, como PostgREST rechaza la fila entera cuando una no existe (PGRST204), **dejaron de entrar todas las consultas del sitio** —home, `/contacto` y los dos de `/teclab`— porque los tres mandan `kind: 'consulta'`. Un test de `security.test.mjs` falla si vuelve a aparecer un literal de columna en el endpoint.
- **`CASAS`**: qué pide cada casa (`siglo21`, `teclab`, `identidad`) en cada modo, y cuáles bloquean el envío. Los obligatorios bloquean **sólo en preinscripción**: un legajo a medias no sirve, una consulta que rebota es un lead perdido. Ojo con las diferencias reales — Siglo 21 pide tipo de documento, tipo de domicilio, torre y barrio, y **no** pide nivel de estudios ni colegio, que son de Teclab.
- **`armarPayload()`**: qué viaja. Los campos que la casa no pide siguen en el estado del componente —si el lead vuelve a esa carrera los encuentra como los dejó— pero no se mandan.

En la home la casa **la define la carrera elegida** y el formulario cambia solo; en `/teclab` va fija por props. `casa` y `tipo_formulario` se guardan en la fila, y con eso el aviso de Telegram encabeza "PREINSCRIPCIÓN — Teclab" o "Consulta — Siglo 21".

El formulario de **contacto** pide sólo nombre, apellido y una vía de respuesta: email o teléfono. Elegir carrera sigue siendo opcional. Localidad queda para la preinscripción, donde sí forma parte del legajo; mostrarla antes sumaba fricción sin bloquear ni mejorar el envío.

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
- Los precios los carga `herramientas/ventas/publicar-precios.mjs` (ver [herramientas](herramientas.md)). `tests/ver-precio.test.mjs` cubre la validación, la vigencia y el endpoint con Supabase simulado.

## Autoinscripción de Teclab: `kind: 'autoinscripcion'`

Quien elige gestionar su inscripción en Teclab manda la preinscripción completa. No hay medio de pago: desde el 03/10/2026 el formulario no lo pregunta, porque el portal del alumno pide la tarjeta y decide la financiación por su cuenta. Hay dos entradas al carrusel de `formulario-lead.tsx` (la pregunta y el «¡Listo!» en `autoinscripcion-teclab.tsx`), sólo con una carrera de Teclab elegida:

- **Directa**: la ficha con `?inscripcion=auto#preinscripcion` (`urlAutoinscripcion()` en `elegir-carrera.ts`). La usan «Inscribite ya» del precio vigente en «Ver precio» y el botón «Quiero inscribirme» del mail. El parámetro se lee en el navegador, así la página sigue siendo estática. Datos («Paso 1 de 2», botón «Inscribirme», Turnstile invisible) → «¡Listo!» («Paso 2 de 2»), con **un solo envío**, el de la autoinscripción, que sale desde los datos.
- **Normal**: la preinscripción se envía como siempre (`kind: 'consulta'`, con su aviso) y, en vez del cartel de enviada, sigue el paso «¿Querés gestionar tu inscripción?» con un botón «Inscribirme» y un Turnstile invisible. «Ahora no» deja el cartel de siempre; «Inscribirme» hace el **segundo envío**, con un token nuevo (los tokens son de un solo uso), y pasa al «¡Listo!».

```json
{ "kind": "autoinscripcion", "token": "<turnstile>",
  "payload": { "carreraId": 123, "nombre": "…", "dni": "…", "…": "los campos de la preinscripción de Teclab",
               "newsletter": true } }
```

- La validación es estricta (`validarPayloadAutoinscripcion` en `casas.ts`, sección *Autoinscripción*): todos los obligatorios de la preinscripción de Teclab, opciones de su lista, DNI de 7 a 9 dígitos y mail y teléfono válidos. Un `medioPago` que mande una página vieja en caché se ignora. Con esos datos se crea la cuenta del alumno, así que nada entra a medias: un payload inválido devuelve 400 sin escribir.
- La carrera se busca por `carreraId` y la casa sale de su `nivel`: una carrera que no es de Teclab o no existe devuelve 400.
- Entra en `consultas` con `casa: 'teclab'`, `tipo_formulario: 'autoinscripcion'`, `tipo: 'Autoinscripción'`, el nombre de la carrera de la base y el legajo armado con `columnaDe()`, igual que la preinscripción. La columna `medio_pago` sigue en la tabla, pero ya no se escribe (las filas anteriores al 03/10/2026 la pueden tener). El aviso de Telegram sale por el trigger de siempre y muestra el tipo.
- `newsletter` funciona como en el resto. En la entrada normal el segundo envío manda `false`: la suscripción ya salió con la preinscripción.
- Por ahora no dispara nada externo: el robot que carga la preinscripción en el portal de Teclab (T4 de `odd/tasks/autoinscripcion-teclab.md`) va donde lo marca el comentario de `registrarAutoinscripcion`.
- `tests/autoinscripcion.test.mjs` cubre la validación, la casa y el endpoint con Supabase simulado.

### La financiación y el precio que quedaron

**`components/formularios/financiacion-teclab.ts`** es la placa oficial de financiación del período vuelta datos (vigente desde el 26/08/2026; se actualiza con cada placa nueva). Hoy lo usa sólo «Ver precio», para las líneas de «Financiación» bajo el total. Hasta el 03/10/2026 alimentaba también la cuota del panel de la tarjeta, que se fue con el paso del medio de pago.

La preinscripción de Teclab responde `{ "ok": true }`, como el resto de las consultas: hasta el 03/10/2026 sumaba el precio para ese panel, y «Ver precio» lo guardaba en el `sessionStorage` de la pestaña. Las dos cosas se sacaron con el paso del medio de pago. El único que devuelve precio es «Ver precio».

## Enlace de inscripción de Teclab: `kind: 'enlace'`

Cada preinscripción de Teclab (`casa: 'teclab'`, `tipo_formulario: 'preinscripcion'`) trae al final del aviso de Telegram una línea «Enlace para inscribirse» con `https://www.siglo21sur.com/inscripcion/<codigo>`, lista para reenviarle a la persona. Al abrirla ve el precio vigente de su carrera, un resumen de sus datos y un botón «Inscribirme»; al confirmar queda creada la misma autoinscripción de arriba, sin volver a tipear nada.

- **El código** lo crea la Edge Function `notificar` cuando llega el aviso (no hay trigger nuevo) y lo guarda con la service role en `enlaces_inscripcion` (`sql/2026-10-03_enlaces_inscripcion.sql`, tabla privada sin acceso para `anon` ni `authenticated`). Son 32 letras y números al azar; sin `_` ni `-` porque rompen el Markdown del aviso. La URL no lleva ningún dato personal. Vence a los 7 días (`vence_at`) o al usarse (`usado_at`). Si no se puede crear, el aviso sale igual, sin la línea.
- **La página** `app/inscripcion/[codigo]/page.tsx` es dinámica (`force-dynamic`, nada se cachea) y `noindex, nofollow`. Lee con la service role el enlace, la preinscripción, la carrera (por nombre, entre los niveles de Teclab) y el precio de `precios_privados`, con la misma vigencia que «Ver precio». Al navegador llega sólo lo que arma `propsInscripcionEnlace` en `casas.ts`: nombre y apellido, DNI oculto (`30.1••.•56`), mail oculto (`a••@ejemplo.com`), la carrera y el precio. Nunca el DNI completo, el domicilio ni el teléfono.
- Enlace inexistente, vencido o usado: un mismo mensaje con WhatsApp de Teclab y el enlace a la carrera (o a `/teclab` si no se sabe cuál). No distingue los casos para no confirmar códigos a quien prueba. Si lo guardado no alcanza para crear la cuenta (la preinscripción se guarda con la validación tolerante de la consulta), en lugar de «Inscribirme» ofrece WhatsApp.
- La confirmación reusa `PasoInscribirme` y `PasoListo` de `autoinscripcion-teclab.tsx` (`components/formularios/inscripcion-enlace.tsx`), con un solo Turnstile invisible.

```json
{ "kind": "enlace", "token": "<turnstile>",
  "payload": { "codigo": "<32 letras y números>" } }
```

- Mismo orden que el resto (sobre → Turnstile y cuota en paralelo, con su propia cuota `enlace:<hash>` → payload). `validarPayloadEnlace` exige un código con el formato de la tabla; `newsletter` sólo suscribe con un `true` explícito y la página no lo manda, porque ya se ofreció en la preinscripción.
- El legajo **no viaja desde el navegador**: sale de la preinscripción guardada (`payloadDesdeConsulta`, columna por columna desde `CAMPOS`) y pasa por la misma validación estricta (`validarPayloadAutoinscripcion`) y el mismo armado (`insertarAutoinscripcion` en el endpoint) que la autoinscripción del formulario. Ahí está el comentario `// T4:` del robot: lo cruzan las dos entradas.
- El enlace se marca usado **antes** de escribir, con un `UPDATE … WHERE usado_at IS NULL`: dos envíos simultáneos no crean dos autoinscripciones. Si el `INSERT` falla, se libera para reintentar.
- Enlace inexistente, vencido, usado, de otra casa o con legajo incompleto: 400 `El enlace ya no es válido`, sin escribir nada. Error de base: 500.
- `tests/enlace-inscripcion.test.mjs` cubre lo oculto, la vigencia, que las props del cliente no traigan el legajo, el endpoint con un Supabase en memoria (escritura, marca, rechazo de vencidos y usados, liberación) y la parte de la Edge Function (formato del código, qué filas llevan enlace y que el aviso salga aunque el enlace falle).

## Alta del lead en la landing de la sede (Teclab)

Teclab asigna el lead a la sede por su landing de HubSpot (`vinculacion.teclab.edu.ar/expo-bs-as-esposito`, portal `5880041`, formulario `a19c1564-e23a-475c-a16a-11aa244c1b9e`, sin captcha). Cada autoinscripción guardada —las dos entradas: `kind: 'autoinscripcion'` y `kind: 'enlace'`, que pasan por `insertarAutoinscripcion`— manda además los datos a ese formulario desde el servidor, por la API pública de HubSpot (`POST https://api.hsforms.com/submissions/v3/integration/submit/<portal>/<formulario>`). La persona nunca entra a la landing. Ningún otro `kind` lo hace.

- **Qué viaja** (`pedidoLeadSede` en `casas.ts`): `firstname`, `lastname`, `email`, `phone`, `carrera`, `provincia` y los ocultos `token_landings` y `empresas_form` (los dos con el id del formulario), con `context.pageUri` y `pageName` de la landing. `cuando_te_recibis_` no se manda; un campo vacío tampoco.
- **`carrera`** tiene que ser exactamente una opción de la lista de HubSpot. `carreraHubspotDe` la saca del nombre de la base por palabras clave normalizadas (acepta nombres viejos y nuevos: Cloud Administration / Servicios en la Nube, Gestión Agraria / Empresa Agraria, Customer Experience / Experiencia del Cliente, Seguros / P.A.S.). Sin opción (hoy, Venta Directa) no se manda nada y queda un `console.warn`.
- **`provincia`** sale de `provinciaHubspotDe`, que compara el texto entero normalizado contra la lista; CABA, Capital Federal y Ciudad (Autónoma) de Buenos Aires van como «Buenos Aires». Teclab no pide provincia, así que se prueba con la localidad; si no coincide («Villa Lugano»), el campo se omite.
- **Cuándo y cómo falla**: corre con `after()` de `next/server`, con la respuesta ya enviada, y un `AbortSignal.timeout` de 5 s. Nunca cambia la respuesta: la autoinscripción ya está guardada y contesta 201 igual. Un rechazo de HubSpot, un timeout o una red caída quedan en `console.error('[formularios] …')` con el `status` o el tipo de error, nunca con datos personales. No hay reintento.
- Sin variables de entorno nuevas ni cambios de CSP (el pedido sale del servidor). `tests/lead-sede-teclab.test.mjs` cubre el mapeo de carreras y provincias, el armado y el endpoint con `fetch` simulado: una sola llamada por autoinscripción (formulario y enlace), 201 aunque HubSpot falle o no conteste, y ninguna llamada para una consulta común.

## El robot de Teclab: `robot_autoinscripciones`

Cada autoinscripción guardada (las mismas dos entradas, en `insertarAutoinscripcion`) se le pasa al robot que la carga en el Portal Administrativo de Teclab (repo privado `cau-robot-teclab`, GitHub Actions). **Los datos personales nunca viajan a GitHub**: el despacho lleva sólo un id y el robot pide el legajo al sitio.

- **Al guardar**: el INSERT en `consultas` devuelve su `id` (`.select('id').single()`). Con `after()`, el endpoint crea la fila en `robot_autoinscripciones` (tabla privada, `sql/2026-10-03_robot_autoinscripciones.sql`, estado `pendiente`) y despacha `POST https://api.github.com/repos/$ROBOT_GITHUB_REPO/dispatches` con `{ event_type: 'autoinscripcion', client_payload: { id } }` y un timeout de 5 s. Sin `ROBOT_GITHUB_REPO` o `ROBOT_GITHUB_TOKEN` no despacha (queda un `console.warn`) y la fila espera al barrido. Nada de esto cambia el 201; los registros llevan el `status` o el tipo de error, nunca datos personales.
- **`GET /api/robot/autoinscripciones?id=<id>`**, con `Authorization: Bearer $ROBOT_SECRET` (comparado en tiempo constante; sin la variable, 503; mal, 401): `{ id, estado, intentos, carrera, datos }`, donde `datos` es el legajo de la preinscripción de Teclab con las claves de `CAMPOS` (`nombre`, `apellido`, `dni`, `sexo`, `fechaNacimiento`, `lugarNacimiento`, `nacionalidad`, `estadoCivil`, `domicilio`, `domicilioNumero`, `domicilioPiso`, `domicilioDepartamento`, `codigoPostal`, `localidad`, `nivelEstudios`, `colegio`, `colegioLocalidad`, `email`, `telefono`), armado con `payloadDesdeConsulta`. Sólo para filas `pendiente` o `error` (un error se reintenta); `cargada` o inexistente, 404. Sin `id`: `{ ids }` de hasta 20 pendientes, para barrer lo que no se despachó.
- **`POST /api/robot/autoinscripciones`** con `{ id, estado: 'cargada' | 'error', detalle }`: actualiza la fila (`detalle` truncado a 300 caracteres, `intentos + 1` en error) y responde `{ ok, id, estado, intentos }`. Una fila ya `cargada` devuelve 409. En `error` avisa por Telegram (`lib/telegram.ts`, texto plano) con nombre, DNI, mail, teléfono, carrera y motivo, para cargarla a mano; la respuesta suma `aviso` y un Telegram caído no la cambia. `detalle` es el motivo técnico: el robot no pone ahí datos de la persona.
- `tests/robot-autoinscripciones.test.mjs` cubre el despacho (sólo el id, omitido sin variables, 201 aunque falle la fila o GitHub) y el endpoint (503/401, legajo sólo de filas abiertas, barrido con tope, actualización y aviso en error).

Rate limit: RPC `check_form_rate_limit(p_key, p_max_requests, p_window_seconds)` con la IP hasheada en SHA-256. La clave incluye el `kind` (`consulta:<hash>`), así que el tope es **5 pedidos por cada tipo** por 10 min — una misma IP puede mandar 30 en total entre los seis (`consulta`, `faq`, `clase`, `precio`, `autoinscripcion` y `enlace`). `/api/track-click` usa 60 (navegar 20 tarjetas es uso normal).

Turnstile se verifica en `lib/turnstile.ts`, que además compara el `hostname` que devuelve Cloudflare contra `TURNSTILE_EXPECTED_HOSTNAME` (normaliza `www.`). Sin `TURNSTILE_SECRET_KEY`, el endpoint devuelve 503, salvo en desarrollo con `NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL=1`: sólo ahí acepta `rate-limit-only`. El widget emite ese token únicamente en ese modo y sin site key. **No saltea el rate limit ni la credencial de escritura**: sin `SUPABASE_SERVICE_ROLE_KEY`, un envío que llega a consultar la cuota devuelve 503. Las claves de prueba de Cloudflare son la alternativa para comprobar la integración completa del captcha.

El JSON mal formado y los sobres nulos, arrays o sin discriminadores válidos devuelven 400 antes de consultar captcha o base. `tests/formularios-api.test.mjs` ejecuta el handler con dependencias simuladas y cubre sobre inválido, captcha rechazado, cuota agotada, error de escritura, éxito y aislamiento del modo local.
