# Staging: preparación y copia protegida

## Aviso de Telegram controlado: enviado una sola vez

El usuario autorizó **un único aviso de prueba al chat que ya usa el sitio**. Se
implementó una ruta exclusiva de staging, `POST /api/staging-telegram`
(`staging/telegram-controlado.ts`), que ningún módulo de `src/` importa: no existe
en el build de producción ni en la aplicación Astro.

- Cuerpo `{}` y nada más: `chat_id`, `cc`, `lote` o un array se rechazan con su
  código (`campo-no-admitido:<campo>`), no se ignoran.
- Chat autorizado por digest (`STAGING_TELEGRAM_CHAT_SHA256`); el valor del chat
  no se guarda en la configuración. Sin token, sin chat o sin base responde 503.
- Cupo durable de **1** en `form_rate_limits`, registrado antes del despacho, con
  ID fijo del servidor (`staging-telegram-control:autorizado-20261026-01`).
- Exige **exactamente una** fila `aviso-lead` pendiente: con cero o con varias no
  elige a ciegas.
- Egreso único: `sendMessage` del bot autorizado, POST, `redirect: 'manual'` y
  rechazo de cualquier 3xx. Nada más sale a la red.

**Resultado real:** un despacho, HTTP **200** con `enviado` informado por el
transporte (2xx de Telegram). La fila del outbox pasó de `pendiente`/0 a
`enviado`/1; `ultimo_error` conserva `envio-en-curso`, que es la marca
conservadora previa a cruzar la frontera y no un fallo. Un segundo pedido
respondió **409 `sin-aviso-pendiente`** sin volver a enviar.

**Cierre comprobado:** `STAGING_TELEGRAM_HABILITADO=no`, secretos de Telegram
retirados del Worker, `POST /api/staging-telegram` **503**, formularios y correo
**503**, `/api/estado` 200, `/` sin credenciales **401**, cron `[]` y sin colas.

Pruebas: `tests/staging-telegram.test.mjs` (5 casos de guardas y egreso) sumado a
`test:staging-protegido`, **33/33**; check completo **exit 0**. La prueba de
`tests/staging-protegido.test.mjs` pasó a importar `acceso.ts` después de
registrar el alias, porque ahora ese entry arrastra el transporte real.


## Estado vigente: envío humano persistido y ensayo CERRADO, 26/10 22:51 UTC

Tras «listo, envié», la lectura de D1 **antes de cerrar** confirmó `consultas=1`,
`outbox=1` de tipo `aviso-lead` en estado **pendiente**, y el cupo fijo del ensayo
con `request_count=1`. Antes de la apertura eran 0/0 y no había fila del cupo:
hay una consulta nueva persistida. El captcha real fue aceptado por el contrato
del servidor: sólo después de Siteverify válido, con hostname/action exactos,
se reclama ese cupo y se persiste. No se dispone de la respuesta HTTP del
navegador del usuario y no se inventa un status observado allí.

**Aviso Telegram NO enviado**, pendiente sin consumidor ni autorización de canal.
No se reenvió el formulario, resolvió captcha, consumió outbox ni reseteó cupo.
Las dos reservas históricas de correo permanecen 1/1. Lectura posterior al cierre
confirma consultas/outbox 1/1 y los mismos contadores, sin mutaciones por las sondas.

**Cierre obligatorio completado:** PATCH multipart sólo de settings, bandera
`STAGING_FORMULARIO_HABILITADO=no` y site key vacía, demás bindings conservados y
secretos por `inherit` estricto; sin subir código/assets nuevos. Versión
`8c67db22-468d-4b94-9c0a-d0024f73f562`, deployment
`f073edfc-c911-4a62-a298-0f6236c611f4`. Config privada cerrada y validada.

**HTTP 13/13**, además de comprobación explícita `envios:false`: público home/icono
401; autenticados home/contacto/icono/estado 200; contacto sin action/sitekey;
formularios/correo/newsletter/recordatorio 503; carreras-detalle 200, robots
bloqueado y sitemap 404. Todas con noindex/no-store. Settings remotos: ambas
banderas `no`, OUTBOUND_MODE disabled, cron `[]`, sin colas ni secreto SMTP;
se conservan sólo secretos Basic y Turnstile. No hubo cambio de aplicación,
check completo ritual, producción/DNS/proveedores, commit ni push.

Evidencia privada 0600: `humano-final-resultado.json`,
`humano-final-cierre-http.json`, `humano-final-cierre.json`. Próximo paso separado:
si se desea probar el aviso real, requiere autorización propia; no consumir el
pendiente ni abrir otro ensayo por iniciativa del asistente.

## Antecedente: reapertura humana, 26/10 22:42 UTC

**En ese momento ABIERTO, ahora cerrado según el resultado anterior.** Antes de operar
se comprobó el estado real tras la interrupción: consultas/outbox 0/0, sin fila
del cupo humano, reservas históricas de correo 1/1 intactas y bandera `no`.

Se cambiaron sólo settings del Worker exclusivo mediante PATCH multipart:
`STAGING_FORMULARIO_HABILITADO=si` y site key del widget existente. Sin nueva
subida de código/assets; secretos conservados con `inherit` estricto. Versión
`391e5484-303a-41e9-87ce-21b8c9ac87b3`, deployment
`b449ff47-e007-4f47-94b7-592bd2b964a0`. Config privada sincronizada y validada.

**HTTP nuevo 20/20**, todo noindex/no-store: contacto 401 público/200 autenticado,
acción `staging_contacto`, site key exacta y meta `formularios-detalle`; cuatro
chunks de islas/renderer 200 autenticados y 401 públicos. Negativos previos a
Siteverify/cuota: 400 `token-faltante` y 400 `campo-fuera-de-ensayo`, campo
`newsletter`. Correo/newsletter/recordatorio/robot 503; estado `envios:false`,
robots bloqueado, sitemap 404. Settings posteriores: cron `[]`, cero colas, sólo
secretos Basic/captcha, SMTP ausente. D1 posterior idéntico: consultas/outbox 0/0,
cupo humano sin reclamar y reservas 1/1 intactas. Sin POST válido ni captcha
resuelto por el asistente. Sin cambios de código ni nuevo check completo.

Datos: nombre **Prueba**, apellido **Staging**, correo autorizado, teléfono y
localidad vacíos, novedades por mail **destildado**. Revisar autofill, resolver
captcha y enviar una sola vez. Éxito existente: «Consulta enviada» / «Nos
comunicaremos a la brevedad»; no acredita Telegram enviado, sólo aviso pendiente.

Ante error recoger sólo texto seguro visible y status/código/campo de respuesta,
nunca payload/token/Authorization ni capturas con datos personales. El padre debe
leer D1/cupo/outbox antes de actuar. **Después del envío o cancelación, cerrar**
con bandera `no` y site key vacía conservando demás bindings/secretos, sincronizar
config privada y comprobar cierre remoto. No hay autocierre temporal; no resetear
cupos ni generar otro ensayo. Sin producción/DNS/proveedores/commit/push.

Evidencia privada 0600: `reapertura-segura-http.json`,
`reapertura-segura-estado.json`; sonda `verificar-reapertura-segura.mjs` con
negativos que no validan captcha ni consumen cupo.

## Motivo visible del rechazo del ensayo (26/10)

El envío humano anterior terminó en error genérico sin persistencia. El D1 confirmó
que el pedido se rechazó **antes de Siteverify y de la cuota**, pero sin logs no se
puede saber qué campo lo disparó. Se corrigieron las dos causas de esa ceguera sin
ampliar los datos admitidos:

- **Servidor** (`staging/formulario-controlado.ts`): el rechazo del contrato ya no
  es un `datos-fuera-del-ensayo` opaco. Devuelve
  `{ error: 'campo-fuera-de-ensayo', campo }` con `nombre`, `apellido`, `telefono`,
  `localidad`, `newsletter` o `datos`, más `token-faltante` y `campo-no-admitido`.
  Nunca repite valores, correo esperado, token, stack ni mensajes del proveedor.
  Además los textos se comparan **recortados**: un espacio al final de «Prueba» o
  del apellido no cambia el dato y ya no rompe el envío. Los valores admitidos son
  exactamente los mismos.
- **UI** (`components/formularios/errores-ensayo.ts` y `contacto-page.tsx`): el
  formulario muestra ese motivo en el mismo lugar del aviso, con `role="alert"`.
  Sólo se activa con `<meta name="formularios-detalle">`, que inyecta el wrapper de
  staging **únicamente con la bandera del ensayo encendida**; en el sitio vigente
  ese meta no existe y el texto sigue siendo el genérico. No hay oráculo de token:
  el mensaje de captcha no distingue vencido, duplicado ni inválido.

**Prueba roja→verde:** con la validación anterior fallan el código por campo y el
envío con espacios de más; con el cambio, `test:staging-protegido` **28/28** y el
check completo **284/284, exit 0** (incluye E2E que verifica el aviso visible,
`role="alert"` y que sin el meta se mantiene el texto genérico, además de comparar
el cuerpo real del formulario con el contrato). Check **completo de la raíz** (lint +
typecheck + tests, porque se tocaron componentes compartidos): **exit 0**, 0 errores
de lint con los 20 avisos que ya existían y **543/543** pruebas.

**Capturas locales del aviso** (E2E en loopback, red externa bloqueada, sin modo
demo remoto, sin credenciales): `capturas-aviso/contacto-aviso-escritorio.png` y
`capturas-aviso/contacto-aviso-movil.png`, copiadas desde
`.local/capturas/2026-10-26-19-56-aviso/`. Muestran «Destildá «Quiero recibir
novedades por mail» para este ensayo.» debajo del checkbox, sin cambio de layout.

**Publicado sólo en staging, con el ensayo cerrado:** versión 20 / deployment
`858286ca…`; un asset nuevo por jwt de finalización (sin `keep_assets` viejo).
Cierre remoto **13/13**: 401 público, 200 autenticado, `/contacto` sin acción ni
site key, formularios/correo/newsletter/recordatorio **503**, `envios:false`,
robots `Disallow: /`, sitemap 404 y noindex/no-store. Cron `[]`, sin colas, SMTP
ausente. D1 sigue en `consultas` 0, `outbox` 0, cupo del ensayo sin reclamar y las
dos reservas de correo 1/1.

**Para la próxima prueba humana** (cuando se autorice): reabrir con el mismo
procedimiento (bandera `si`, site key del widget de staging, hostname exacto) y
avisar la URL; la UI ya explica el motivo si algo no coincide. No hay autocierre
por tiempo: al terminar hay que volver a publicar la bandera en `no`.

## Resultado del ensayo manual: no guardó, rechazado antes del captcha (26/10)

El usuario autenticó, completó y envió una vez; la UI mostró «Hubo un error al
enviar. Intentá de nuevo o contactanos por WhatsApp.» **No reintentó** y el ensayo
quedó **cerrado** (versión 19, deployment `e98e01dd…`).

**Qué dice el D1 real, leído antes de cualquier acción:** `consultas` 0, `outbox` 0,
`reservas_mail_precio` 0, newsletter/clases/FAQ 0, `form_rate_limits` 3 (las dos
reservas históricas de correo en 1/1 y el único cupo normal `consulta:*`, que es el
del negativo de token de la sesión anterior). **No existe fila del cupo del ensayo**
(`staging-formulario-contacto:…`) y **no apareció un cupo normal nuevo para la IP del
usuario**.

**Conclusión, con la evidencia que hay:** el POST fue rechazado **antes de Siteverify
y antes de consumir cuota**, o sea por la validación del ensayo (payload, allowlist
u origen) o por la barrera. No fue un fallo de captcha, ni de la base, ni de egreso:
esos caminos siempre incrementan el cupo normal en paralelo. **No hay logs** del
Worker (observabilidad apagada) y no se registra el cuerpo del pedido, así que el
campo exacto no está confirmado.

**Causa probable:** el contrato del ensayo es más estricto que el formulario real.
El formulario manda `newsletter: true` por defecto y el navegador autocompleta
nombre, apellido, teléfono y localidad (`autocomplete`); cualquiera de esos valores
dispara `400 datos-fuera-del-ensayo`. Reproducido localmente con el handler real y
D1 efímero, sin red: newsletter tildado, teléfono, localidad, nombre o apellido
distintos → **400**, sin filas, **sin tocar cupo** y **sin llegar a Siteverify**;
el payload exacto con captcha simulado → **201** con fila, `aviso-lead` pendiente,
cupo del ensayo 1 y segundo intento **429**. Es la misma firma que dejó el D1 real.

**No se aplicó ningún fix:** relajar el contrato del ensayo (aceptar el default de
newsletter o ignorar autofill) cambia una regla de datos acotados y exige decisión
propia; no se toca sin autorización ni se abre otro ensayo. El detalle del pedido
del usuario no se puede reconstruir sin instrumentación nueva.

**Cierre comprobado (13/13):** 401 público, 200 autenticado, `/contacto` sin
`turnstile-action` ni site key, `POST /api/formularios` **503**, `/api/staging-correo`
**503 `ruta-deshabilitada`**, newsletter y recordatorio **503**, estado
`envios:false`, robots `Disallow: /`, sitemap **404**, todo con noindex/no-store.
Cron `[]`, sin colas, SMTP ausente, reservas de correo intactas. Evidencia privada
0600: `manual-resultado.json`, `manual-apertura.json`, `manual-cierre.json`,
`formulario-cierre-http.json`.

## Apertura manual controlada para el envío del usuario (26/10)

La ruta `/contacto` quedó **abierta a propósito** después del cierre del ensayo
automático, para que el usuario haga **un** envío real desde su navegador. Es la
misma ruta de ensayo ya implementada, sin código nuevo: allowlist del correo
autorizado, datos exactos, captcha real del widget de staging y **cupo durable de
uno** en `form_rate_limits` (`staging-formulario-contacto:autorizado-20261026-01`),
que se reclama recién con un captcha válido. Ningún otro formulario ni canal está
abierto: correo 503 `ruta-deshabilitada`, newsletter y recordatorio 503, cron `[]`,
sin colas y sin secreto SMTP.

Estado previo comprobado antes de abrir: `consultas` 0, `outbox` 0, cupo del ensayo
sin fila, las dos reservas históricas de correo en 1/1, público 93/7/12/0.
Versión **18** / deployment `6dee572d…`; assets del mismo build, sin re-subir.
`/contacto` responde 200 con `turnstile-action="staging_contacto"`, site key del
widget, `noindex` y `no-store`; un payload fuera del ensayo responde 400
`datos-fuera-del-ensayo`, o sea que la ruta está viva sin consumir cupo.

**No hay autocierre por tiempo**: el cupo durable impide un segundo envío (429)
pero la bandera no se apaga sola. Después del envío o de la cancelación hay que
volver a publicar con `STAGING_FORMULARIO_HABILITADO='no'` y
`PUBLIC_TURNSTILE_SITE_KEY=''` (versión 17 o equivalentes). Si el envío no llega a
201, el cupo puede quedar reclamado y no se repite solo.

## Ensayo de formulario: implementado, desplegado y bloqueado por el captcha real

Se retomó el subalcance de `/contacto` (kind `consulta`) después del corte de la
sesión anterior. **El paquete quedó completo y publicado sólo en staging**, con la
ruta habilitada durante la prueba y vuelta a cerrar al terminar. Lo que no se pudo
completar es el paso que exige un token real de Turnstile.

**Check completo:** `npm --prefix cloudflare run check` → **282/282, exit 0**, sin
fallos, cancelaciones ni skips; 20 corridas de suites, build, runtime workerd,
paridad y E2E incluidos (E2E: 19/19; capturas de `/carreras/diplomatura-en-oratoria`
0,004 % escritorio y 0,008 % móvil). La corrida anterior se había cortado por
timeout con dos fallos de paridad; ver «Paridad de Identidad Argentina» abajo.

**Artefacto exacto:** el módulo minificado (2.426.257 bytes) se probó en workerd
antes de publicar (`.local/staging-remoto/probar-paquete-formulario.mjs`):
401 sin credencial sin tocar captcha, `turnstile-action` en el HTML, captcha
inválido 403 sin persistencia, datos fuera del ensayo 400/403, recorrido válido
**201 con una `consultas` y un `outbox` `aviso-lead` pendiente**, segundo envío
**429**, bandera apagada **503** y cero egreso externo.

**Publicación:** versión 16 / deployment `2ca1137e…` (ruta abierta, widget del
hostname, `run_worker_first`) y versión 17 / deployment `0bbab08d…` (cierre).
No se tocó producción, DNS ni otros recursos.

### Dos hallazgos técnicos que no hay que repetir

1. `keep_assets: true` conserva los assets del build anterior: al cambiar el
   bundle, los `/_astro/*.js` con hash nuevo dan **404** y la isla no hidrata.
   Hay que subir los assets del build (manifest → `assets-upload-session` →
   `POST /workers/assets/upload?base64=true` → jwt de finalización) y crear la
   versión con `assets: { config: { run_worker_first: true }, jwt }`. Los assets
   chicos se envían en base64 (`?base64=true`), no como bytes.
2. Los secretos se conservan con bindings `{ "type": "inherit", "name": … }` y
   `bindings_inherit=strict`; si no se declaran, la versión nueva los pierde.

### Bloqueo real: no se obtuvo token de Turnstile

El widget del hostname de staging **carga y muestra el desafío** («Verifique que es
un ser humano», iframe de 320×51). Al tildarlo, el desafío no se resuelve y no
entrega token. Evidencia recogida, sin bypass ni claves dummy:

- `before-interactive-callback` se dispara: el widget *managed* pide interacción.
- Dentro de su marco, el script pide `hagen.challenges.cloudflare.com`
  (`net::ERR_ABORTED`) y su propio CSP bloquea `fetch('data:,')`; el marco queda
  sin resolver y el botón sigue deshabilitado.
- Se repitió en Chromium de Playwright (headless y con Chrome real en `DISPLAY=:0`),
  en Chromium 1228 y en Chrome 156, y también **quitando por intercepción** la CSP
  y el `Referrer-Policy` del wrapper: el resultado es idéntico. No es la CSP de
  staging ni el hostname del widget (creado con el hostname exacto y `no_clearance`).
- Consecuencia honesta: **no hubo 201 remoto**, no se creó fila en `consultas` ni en
  `outbox`, y el único aviso sigue sin probarse de punta a punta. El 201 con fila y
  `aviso-lead` pendiente está probado en workerd con el captcha interceptado, no en
  remoto.

**Cupo:** el único consumo fue una unidad del cupo normal de formularios
(`consulta:<digest>`, `request_count=1`) por el negativo de token inválido. El cupo
del ensayo (`staging-formulario-contacto:autorizado-20261026-01`) **no se reclamó**
porque nunca hubo captcha válido. Las dos reservas históricas de correo siguen en
1/1 y no se tocaron.

### Cierre comprobado (13/13)

`GET /` y `/icon.png` sin credencial **401**; con credencial **200** (HTML y PNG),
`noindex`/`no-store` en todo; `/contacto` **200 sin** `turnstile-action` ni sitekey;
`/api/estado` **200** `envios:false`; `POST /api/formularios` **503**; `/api/staging-correo`
**503 `ruta-deshabilitada`**; newsletter y recordatorio **503**; `GET /api/carreras-detalle`
**200**; `robots.txt` **200** con `Disallow: /`; `sitemap.xml` **404**. Schedules
`[]`, sin colas. D1 final: `consultas` 0, `outbox` 0, `form_rate_limits` 3 (las dos
históricas de correo 1/1 + el cupo normal del negativo), público 93/7/12/0, resto de
las privadas en cero. Evidencia privada 0600: `formulario-negativos.json`,
`formulario-navegador.json`, `formulario-cierre-http.json`, `formulario-deploy.json`,
`formulario-assets-deploy.json`, `formulario-cierre.json`,
`diagnostico-captcha*.json`, `paquete-formulario-probado.json`,
`formulario-check-3.{log,exit}` y capturas en `capturas-formulario/`.

### Paridad de Identidad Argentina

El commit `b90fb95` del sitio (26/10 12:25) volvió a indexar las fichas de Identidad
Argentina: les sacó el `noindex` y las sumó al sitemap. El paquete de Cloudflare
seguía con el criterio anterior y el check fallaba en dos pruebas. Se actualizó el
espejo, con el mismo criterio del sitio: sin `robots` en
`src/pages/carreras/[slug].astro`, sin la exclusión en `src/entrega/sitemap.ts` y
la expectativa de `tests/entrega.test.mjs`. No se tocó el sitio ni producción.

## Nuevo subalcance: consulta de contacto, captcha real y aviso honesto

Se autorizó preparar/implementar y probar **staging**, más inventario operativo
local de producción; no corte, DNS ni producción. El usuario confirmó **«llegó»**
para el segundo ensayo de correo: entrega confirmada por el usuario, además de la
aceptación API ya registrada. No es una verificación automática de delivery ni
autoriza un tercer correo. Las dos reservas y el ambiguo anterior se conservan.

Formulario elegido: **`/contacto`, kind consulta**, datos sintéticos `Prueba
Staging`, sólo el email previamente autorizado, sin teléfono/localidad, carrera,
DNI, precio, newsletter ni legajo. Reusa `manejarFormulario`, validación de fila,
cuota normal y batch consulta/outbox; no reemplaza el aviso por un mail de prueba.
El contrato crea **`aviso-lead` pendiente para Telegram**. No hay productor,
consumidor, secreto ni autorización de Telegram/HubSpot/GitHub: no se envían.

Inventario real de widgets: dos ajenos al hostname exacto; no se modificaron.
Se creó un widget managed/no_clearance exclusivo del hostname workers.dev de
este staging. Se cargó su secreto únicamente en el Worker de staging, sin
dotenv ni valor en logs/chat; no se compartió widget de producción. La ruta
permanece cerrada mientras se verifican las pruebas y el artefacto.

Preparación: acción `staging_contacto` en el widget de `/contacto`, Siteverify
POST exacto y sin redirects, validación exacta de hostname/action y presupuesto
durable fijo **uno**, reclamado sólo tras captcha válido y antes de persistir.
Rechaza origen ajeno, otros kinds, datos/identificadores extra, newsletter y
contactos no autorizados. El presupuesto no se libera ante fallo posterior ni
se renueva al publicar. Todas las demás APIs operativas siguen cerradas.

Pruebas enfocadas iniciales **24/24**, con captcha doble sólo local y estados
honestos del outbox. Regresiones adicionales de entry workerd y fallo de escritura
incorporadas al check completo en curso. Esto todavía no acredita captcha ni
persistencia remotos. Configuración de producción faltante, sólo local:
[PRODUCCION-PREPARACION.md](PRODUCCION-PREPARACION.md).

## Nueva autorización: publicar la corrección y un ensayo independiente

El usuario respondió explícitamente **«autorizo»** a publicar sólo en staging la
corrección de redirect y realizar **un nuevo intento único** al mismo correo
autorizado. Es una autorización posterior, no un reintento automático ni permiso
para borrar/reiniciar la reserva histórica. Se conserva el intento anterior como
ambiguo; el máximo histórico sigue en tres y este ensayo autoriza sólo uno más.

Se fijó en código de servidor la clave de cupo
`staging-correo-control:autorizado-20261026-02:<digest>`: no llega por payload,
variable del usuario ni fecha calculada al arrancar. Es estable entre deploys;
redeploy no renueva el presupuesto. La fila anterior
`staging-correo-control:<digest>` permanece intacta. La allowlist y el máximo de
uno no cambian. Se rechazan también campos de identificación de ensayo en el
pedido, igual que cc/bcc/lote. La regresión exige un único despacho nuevo,
histórico idéntico y 429 al recrear el entorno con la misma base.

Preflight real anterior a cambios: Worker cerrado, SMTP ausente, sin colas;
histórico una fila/contador uno, ensayo nuevo sin fila, outbox/consultas cero.
Regresión nueva antes del cambio: **429 en lugar de 200**, sin manipular D1 remoto.

**Resultado final de esta nueva autorización: un intento, un accepted, cero
rechazados y cero ambiguos nuevos; entrega al buzón no confirmada.** Respuesta
real del Worker HTTP **200**, SMTP2GO `aceptados:1`, con email_id conservado sólo
en la evidencia privada. El intento anterior permanece ambiguo sin editar su run
ni su reserva. Total histórico: **dos intentos**, un accepted confirmado y un
ambiguo anterior; no se usó el tercer mensaje del techo histórico ni se autoriza
un reintento automático.

**Pruebas y publicación:** nuevo `npm --prefix cloudflare run check` completo
**274/274, exit 0**, sin fallos/cancelaciones/skips. La suite staging incluida
pasó **18/18**, con preservación de todos los campos de la reserva histórica,
ID fijo, dedupe tras recrear entorno y rechazo de campos de ensayo en payload.
El artefacto exacto minificado se probó en workerd: **15 respuestas**, cero egreso
y cero cambios en privadas. Módulo **2.396.358 bytes**, SHA-256 `f50023c5…`;
versión subida `78b7d990…`, deployment **`317b7644…`** al Worker exclusivo. Se
retuvieron los **431 assets existentes** mediante `keep_assets:true`, con
`run_worker_first:true`; Basic se comprobó de nuevo en HTML y assets. GET del
bundle publicado confirmó `manual`, rechazo explícito de 3xx y el ID fijo nuevo.
La advertencia duplicate-case de html2canvas al empaquetar no impidió el build;
no se modificó esa dependencia.

Se cargó temporalmente el secreto SMTP sólo al Worker de staging, por transferencia
loopback/MCP sin logs de valor. Run independiente 0600 creado con `O_EXCL`, con
intención registrada antes del despacho. Negativos remotos **12/12**, incluyendo
destinatario ajeno, cc/bcc/lote/array/run_id, métodos y Basic en HTML/assets; la
lectura D1 posterior confirmó que no consumieron el nuevo cupo. Después se hizo
un solo POST válido desde el cliente al Worker: ningún envío directo desde la
máquina al proveedor ni pruebas equivalentes adicionales.

**Cierre confirmado 8/8:** bandera `no`, POST correo **503
`ruta-deshabilitada`**, estado `envios:false`, Basic/noindex/no-store/CSP y otros
formularios bloqueados. Se retiró el secreto temporal del Worker sin revocar la
clave del proveedor. Cron `[]`, sin colas. Los puentes loopback se cerraron y la
ruta temporal de transferencia fue retirada. No se cambió producción, DNS,
servicios/datos reales ni otros canales; sin commit/push.

D1 final: reserva histórica **1/1** y nueva **1/1**, outbox/consultas **0/0**.
No se borró, reinició ni actualizó la reserva anterior; ambos cupos siguen
consumidos. El run histórico `correo-controlado-run.json` permanece ambiguo; el
nuevo vive en `correo-controlado-02-run.json`. Evidencia privada ignorada 0600:
`ensayo-02-{deploy,negativos,respuesta,cierre,resumen}.json`,
`ensayo-02-check.{log,exit}` y `ensayo-02-antes.log`. Cambios ajenos preservados;
revisión propia sin whitespace ni rutas locales. Esto no acredita entrega al
buzón, integraciones completas ni preparación para el corte.

## Causa del TypeError: modo redirect no soportado, corrección sólo local

La investigación reprodujo el error **sin egreso real ni credenciales reales**:
workerd con la misma fecha de compatibilidad lanza
`TypeError: Invalid redirect value, must be one of "follow" or "manual"`
al pasar `redirect: 'error'`. La documentación oficial de Request confirma que
se lanza al construir el Request, **antes de enviarlo**. La sonda llamó al mismo
fetch nativo capturado en el módulo: `manual` sí llegó al doble interceptado,
sin cambiar binding de `this` ni contexto de request. Por ello la hipótesis de
Illegal invocation no explicó la reproducción y no se aplicó un bind especulativo.

GET del contenido **actualmente publicado**, sin descargar secretos ni publicar
el bundle completo, confirmó el fragmento exacto de `crearBusquedaCorreo`:
`e(t,{...r,redirect:"error"})`. El código publicado explica el fallo; no era un
rechazo de SMTP2GO ni evidencia de una clave inválida. No hay stack histórico
remoto: el catch anterior sólo conservó `error.name`, y observabilidad estaba
apagada. La reproducción demuestra fallo previo al transporte; el registro
histórico se mantiene **ambiguo y no reintentable**, sin usar la ausencia del
mensaje en el buzón como prueba de no despacho.

Regresión sobre el **entry real** `publicar-worker.ts`, D1 efímero y proveedor
interceptado por el harness: antes **502 ambiguo/TypeError en lugar de 200**,
suite **16/17, exit 1**. La sonda independiente obtuvo el mensaje/stack local y
verificó cero llamadas al doble antes del error. Ningún pedido al proveedor real.
El interceptor rechaza todo destino externo que no sea el endpoint simulado;
ese endpoint devuelve una respuesta local sintética, nunca hace fetch real.

Corrección mínima, **sólo local**, en `staging/correo-controlado.ts`:
`redirect: 'manual'` y rechazo explícito de todos los 3xx. No sigue Location,
no reenvía credenciales, no cambia allowlist ni cupo y conserva clasificación
conservadora de errores. Tests agregados en `tests/staging-correo.test.mjs` y
sonda local `tests/fixtures/worker-fetch-receptor.ts`. Después: **17/17, exit 0**,
entry accepted simulado, segundo POST local 429 y contador local 1; todos los
3xx ensayados rechazan sin consultar Location. **Check completo nuevo final:
`npm --prefix cloudflare run check`, exit 0, 273/273**, veinte corridas de suites,
cero fallos/cancelaciones/skips. Astro/TypeScript: 117 archivos; build, runtime,
paridad y E2E completos aprobados. Persisten los avisos PostCSS preexistentes de
imports tardíos; no se modificaron las hojas compartidas.

No hubo deploy, habilitación, otro envío, lectura de clave ni modificación de D1
remoto. Verificación posterior: bandera `no`, SMTP ausente, cron `[]`, sin colas;
una reserva con `request_count=1`, intacta. HTTP remoto **4/4**: Basic público
401, estado `envios:false`, correo 503 `ruta-deshabilitada`, formularios 503;
noindex/no-store/CSP presentes. Huellas de cambios ajenos intactas y revisión de
los seis archivos propios, incluidos los no trackeados, sin whitespace ni rutas
locales absolutas. Evidencia privada ignorada `debug-redirect-*.log`,
`debug-redirect-cierre.json`, `debug-check-completo.{log,exit}`.
Un ensayo posterior requiere autorización independiente y aclarar la ambigüedad;
este arreglo no autoriza reiniciar o eludir el cupo.

## Único despacho autorizado, resultado ambiguo y cierre confirmado

El usuario confirmó manualmente en SMTP2GO **siglo21sur.com Verified Enabled**,
cubriendo el remitente institucional ya configurado. La denegación de lectura
`domain/view` no se usó como prueba de invalidez del permiso de envío; no se pidió
ampliar scopes ni otra clave. Antes de actuar se comprobaron run y D1: cero
intentos, límites/outbox/consultas vacíos, bandera `no`, sin secreto SMTP ni colas.

Se cargó la clave actual legítima **sólo en el Worker exclusivo de staging**,
mediante transferencia efímera de loopback y MCP, sin leer respaldos/dotenv ni
imprimir valores. La primera apertura del puente falló localmente por sintaxis
TypeScript no soportada en strip-only; se ejecutó con transform-types, sin cambiar
el paquete. Se verificaron allowlist exacta y secreto de servidor, se registró la
intención privada antes de habilitar, y se hizo **un solo POST autenticado** a
`/api/staging-correo`. La ruta reservó primero su cupo durable existente.

**Resultado: HTTP 502, `estado: ambiguo`, `error: TypeError`.** Un intento real
desde el Worker; **0 aceptaciones confirmadas, 0 entregas confirmadas, 1 ambiguo**.
No se dispone de email_id ni de aceptación/rechazo del proveedor. No se afirma
que el correo no haya salido. No se volvió a despachar ni se consultó al proveedor
con otro envío. El presupuesto implementado de uno quedó consumido y no se borra,
reinicia ni elude, aunque el máximo histórico autorizado fuera mayor.

**Cierre obligatorio completado:** bandera remota `no`; secreto SMTP agregado
retirado del Worker sin revocar la clave del proveedor. GET de settings confirmó
SMTP ausente y sin bindings de cola; schedules `[]`. Verificación HTTP **8/8**:
Basic público 401, home autenticada 200, estado `envios:false`, correo 503
`ruta-deshabilitada`, formularios/newsletter/recordatorio 503, todo con
noindex/no-store/CSP. La limitación HSTS temprana ya documentada no se cambió.
Puente cerrado y ruta temporal de transferencia retirada; config privada sigue
en `no`.

D1 posterior: **una fila en `form_rate_limits`, `request_count=1`**, con la clave
del ensayo; `outbox=0`, `consultas=0`. No existe una fila outbox de este contrato.
Una primera consulta agregada de comprobación usó por error la columna `count` y
falló sin escribir; se corrigió a `request_count` según el código. No fue cuota.
Evidencia privada 0600: `envio-unico-respuesta.json`, `envio-unico-cierre.json`,
`envio-unico-resumen.json` y run actualizado. No hay cambios de código del paquete
ni nueva corrida de check completo; se verificó el flujo remoto, no se reutilizó
272/272 como resultado nuevo. Sin cambios ajenos, producción, DNS ni otros
canales, sin commit/push. **No reintentar: resultado externo ambiguo**.

## Nueva copia de API key, 26/10 12:18 UTC: permiso de lectura insuficiente

El archivo actual pasó la guarda HTTP sin regla de prefijo. Una única consulta
oficial de lectura `POST /v3/domain/view`, con filtro del dominio del remitente,
respondió **400 `E_ApiResponseCodes.ENDPOINT_PERMISSION_DENIED`**. Es el error de
permisos documentado por ese endpoint, distinto de `INVALID_IN_PAYLOAD` de la
copia previa. No se reintentó con otra forma equivalente ni se leyó un respaldo.
No se afirma permiso de envío, clave globalmente validada ni remitente verificado:
la verificación requerida de éste sigue bloqueada por acceso al endpoint.

**0 correos intentados, 0 accepted, 0 entregas confirmadas, 0 ambiguos de envío**.
No se cargó secreto en el Worker ni se habilitó su bandera; no se modificó clave,
cuenta ni permisos. No pedir otra copia de la clave por un error de scope.
Paso mínimo: resolver la verificación del remitente con acceso autorizado a su
estado; cualquier ampliación de permiso queda a decisión del titular, no se hizo.

Estado real comprobado: `form_rate_limits=0`, `outbox=0`, `consultas=0`, cupo
intacto; bandera remota `no`, SMTP ausente, cron `[]`, cero bindings de cola.
Cierre HTTP **8/8**: Basic 401 público, home autenticada 200, estado `envios:false`,
correo 503 `ruta-deshabilitada`, formularios/newsletter/recordatorio 503;
noindex/no-store/CSP presentes. Sin cambios de código ni nueva corrida de check.
Evidencia ignorada 0600: `permisos-smtp-proveedor.json`,
`permisos-smtp-cierre.json`, `permisos-smtp-resumen.json`.

## Precisión de INVALID_IN_PAYLOAD, 26/10 12:10 UTC

Se contrastó la construcción con las dos fuentes oficiales: `/domain/view`
admite POST JSON con filtro `domain`; autenticación admite cabecera
`X-Smtp2go-Api-Key` o campo JSON `api_key`. La solicitud anterior ya usaba método
y Content-Type documentados. Se comprobó **una sola vez** la variante JSON con
`api_key` y `domain`, sin cabecera de clave, sin redirects, sólo lectura.

Respondió nuevamente **403 `E_ApiResponseCodes.INVALID_IN_PAYLOAD`**. Categoría
del cuerpo, reducida sin publicar valores ni expresión del proveedor:
**validación de `api_key`, con requisito de tipo/patrón**. El mensaje menciona
ese campo y requisitos de string/formato, no `domain`, permisos ni deshabilitado.
La clave estuvo presente como string en el JSON; por eso no se interpreta la
palabra «required» del mensaje como prueba de campo ausente. No se conservaron
ni imprimieron el texto crudo, patrones, valores, longitudes o identificadores.

La variante documentada no resolvió el error: no hay evidencia de que el problema
fuera elegir cabecera en lugar de JSON. Es un rechazo de validación del campo de
credencial por el proveedor, **no un diagnóstico de scope insuficiente ni una
comprobación de inexistencia/revocación de la clave**. Paso mínimo: revisar en
Sending > API Keys que se haya copiado la API key existente, no otro dato; sin
crear, rotar ni ampliar permisos. No hace falta otro intento equivalente de red.

Evidencia privada 0600 `diagnostico-payload.json`: forma de solicitud y categorías
booleanas del mensaje, nunca el valor. GET posterior del Worker confirmó bandera
`no` y SMTP ausente. Cero envíos y cero cambios de credenciales/configuración.

## Diagnóstico oficial del prefijo, 26/10 12:06 UTC

**Corrección del diagnóstico anterior:** exigir un prefijo de API key fue una
restricción local sin fundamento normativo en la documentación oficial de
autenticación. Ésta admite `api_key` o `X-Smtp2go-Api-Key`, sin imponer un prefijo.
El ejemplo Bearer de otra página no permite convertir su forma en una regla de
validación. El descarte por prefijo fue un **falso negativo del preflight de
formato**, no prueba de que la clave sea inválida, ni tampoco de que sea válida.

La condición estaba sólo en los comandos privados de esta conversación, no en
el paquete ni en el helper de entrada. Se sustituyó por un helper privado
`preflight-smtp-lectura.mjs`, sin prefijo, que conserva ASCII imprimible, rechazo
de espacios/controles y tope de tamaño; regresiones locales **2/2, exit 0**.
No hubo cambio de código del paquete, build ni runtime: no corresponde presentar
un check completo como corrido de nuevo.

Con esa guarda corregida se ejecutó **sólo** la consulta documentada
`POST https://api.smtp2go.com/v3/domain/view`, filtrada al dominio del remitente
ya existente, sin redirects y con timeout. SMTP2GO respondió **403**, código
`E_ApiResponseCodes.INVALID_IN_PAYLOAD`. No se imprimió el cuerpo ni la clave.
Esto acredita rechazo de esa consulta, **no** autenticación válida ni remitente
verificado; tampoco se clasifica como 401 de clave inválida ni como falta de
permiso sin evidencia. No pedir una tercera carga basándose sólo en el prefijo.

El Worker sigue con bandera `no`, secreto SMTP ausente y sin colas (GET real
posterior). Cero envíos: no se llamó `/email/send`, no se subió secreto ni se
modificó cupo o configuración remota. Evidencia 0600:
`diagnostico-prefijo.json` en el directorio privado ignorado. Próximo paso mínimo:
aclarar el rechazo de validación del proveedor antes de habilitar cualquier
envío; no cambiar la clave ni sus permisos por conjetura.


## Nueva clave, 26/10 12:03 UTC: preflight bloqueado, sin habilitación

Tras el reemplazo por terminal se leyó únicamente el archivo actual, nunca el
respaldo anterior. La nueva entrada **sí es ASCII imprimible**, pero **no cumple
el prefijo esperado de API key** del preflight local. Esta vez no es un carácter
inválido para HTTP: es un rechazo local de formato, **no una autenticación fallida
ni un rechazo acreditado de SMTP2GO**. No se hizo ninguna llamada al proveedor con
esta entrada; no se verificó el remitente, cargó secreto ni habilitó correo.
Paso mínimo: aportar la API key del proveedor por el mismo helper privado,
apartando antes manualmente el archivo actual porque el helper usa `O_EXCL`.
No se deduce qué tipo de credencial ingresó el usuario ni se publica su contenido.

Se verificó el estado real antes de actuar: run con cero intentos/accepted,
Worker con bandera `no`, secreto SMTP ausente, DB exclusiva y cero bindings de
cola; D1 `form_rate_limits=0`, `outbox=0`, `consultas=0`. Ningún cupo modificado.
Como no hubo despacho ni habilitación, permanecen esos ceros: **0 intentados,
0 accepted, 0 entregas confirmadas, sin ambiguo de envío**.

Cierre remoto **8/8**: Basic público 401, home autenticada 200, estado 200 con
`envios:false`, correo 503 `ruta-deshabilitada` y otros tres endpoints de envío
503. Noindex/no-store/CSP presentes; HSTS sólo en HTML autenticado, como ya se
había observado. Schedules remotos `[]`, sin colas. No hubo cambios de código ni
configuración remota/local de despliegue; no se repitieron tests locales ni check
completo. El 16/16 anterior no se presenta como una nueva corrida.
Evidencia privada ignorada 0600: `clave-nueva-proveedor.json` (sin llamada al
proveedor), `clave-nueva-cierre-http.json` y `clave-nueva-resumen.json`.


## Retoma del 26/10: sin envío y cierre remoto comprobado

Estado vigente, posterior a las corridas históricas de abajo: **0 intentos de
correo, 0 accepted, 0 entregas confirmadas, ningún envío ambiguo registrado**.
Antes de actuar se cotejaron el run privado, el intento anterior, bindings reales
y D1 remoto: sin secreto SMTP y `form_rate_limits`, `outbox`, `consultas` en cero.
No hay evidencia de despacho previo en la operación interrumpida.

El archivo privado `smtp2go.key` existe, pero su contenido no es ASCII imprimible
ni tiene el prefijo de una API key; no se imprimió ni se subió. La comprobación
de lectura `/v3/domain/view`, limitada al dominio del remitente existente, terminó
sin respuesta HTTP verificable; no acredita rechazo del proveedor ni remitente
verificado. **Bloqueo: aportar una API key SMTP2GO utilizable por el canal local**.
No se llamó a `/email/send`, ni directamente ni mediante el Worker.

Se cerró `STAGING_CORREO_HABILITADO=no` mediante PATCH de settings del Worker
exclusivo, conservando los demás bindings por herencia. El intento previo de
usar secret put para esa bandera fue rechazado con 400/10053 (nombre ya ocupado),
sin cambio; no fue cuota. GET posterior confirmó bandera `no`, Basic conservado,
SMTP ausente, DB/ASSETS conservados, cero bindings de cola y schedules `[]`.
La configuración privada publicable también quedó en `no`.

HTTP remoto: 8 códigos esperados, acceso público home/icono 401, home autenticada
200, estado 200 con `envios:false`, correo 503 **`ruta-deshabilitada`** y
formularios/newsletter/recordatorio 503. `no-store`, `noindex, nofollow` y CSP
presentes. **HSTS está presente en el HTML autenticado, pero ausente en las
respuestas tempranas del wrapper (401/API/asset)**: la primera comprobación
ampliada falló por exigirlo en todas; no se oculta ni se declara esa matriz
aprobada. No se cambió código para ampliar el alcance de esta operación.

Lectura D1 posterior: `form_rate_limits=0`, `outbox=0`, `consultas=0`; ningún cupo
borrado ni reiniciado. El contrato del ensayo usa `form_rate_limits`, no outbox.
`npm --prefix cloudflare run test:staging-protegido`: **16/16, exit 0**. Sin
cambio de código, no se repitió el check completo anterior 272/272.
Evidencia privada 0600: `retoma-proveedor.json`, `retoma-cierre-http.json`,
`retoma-resumen.json`; log local `retoma-guardas.log`. Sin commit/push ni cambios
en producción, DNS, Supabase, Vercel u otros canales. No acredita integraciones
completas ni preparación para el corte. **No borrar ni reiniciar el cupo durable**;
esta regla sustituye cualquier indicación histórica de borrarlo.

## Continuación: correo controlado autorizado, bloqueado antes de habilitar

Se autorizó una prueba real **sólo desde staging**, a un único correo indicado
por el usuario y con **máximo tres mensajes totales**. No incluye otros
destinatarios, Telegram, HubSpot, GitHub, campañas, cron ni cambios a producción.
El destinatario y el run quedan únicamente en
`.local/staging-remoto/correo-controlado-run.json` (0600, ignorado), no en el
repositorio público. Presupuesto registrado: 3; intentos y aceptados: **0**.

### Inventario del contrato vigente, sin inventar avisos por correo

- Consulta de contacto, FAQ y clase: el aviso es **Telegram**, no un mail de
  confirmación. Consulta/FAQ también pueden registrar consentimiento al newsletter;
  eso no significa que hayan enviado un correo. `registrarClase` sólo pide teléfono.
- «Ver precio» y consulta en modo preinscripción: pueden generar `mail-precio`
  **únicamente con precio vigente** y email válido, según casa/carrera admitidas.
  `transportarMail` rechaza `sin-precio-vigente`; no se reemplaza por cotización
  ficticia. El D1 remoto conserva `precios_privados` **vacía**.
- Newsletter: correo de precio vigente a suscripciones elegibles, mediante un
  barrido de hasta 50. No se ejecutó ni habilitó ese barrido para esta prueba;
  tener un destinatario autorizado no autoriza una campaña.
- Recordatorio de Teclab: **Telegram**, no correo. Sigue bloqueado.
- Transporte SMTP existente: `https://api.smtp2go.com/v3/email/send`, remitente
  `CAU Online <inscripciones@siglo21sur.com>`. La autenticación del remitente está
  documentada como antecedente; **no se verificó en vivo sin credencial**. La
  aceptación SMTP/API tampoco acreditaría por sí sola entrega al buzón.

Fuentes verificadas con CodeGraph: `src/api/formularios.ts`,
`src/api/newsletter.ts`, `src/api/recordatorio-teclab.ts`,
`src/operativa/{transportes,consumidores}.ts` y
`../components/formularios/mail-precio.ts`; procedimiento en
[`docs/formularios-por-casa.md`](../docs/formularios-por-casa.md) y
[`docs/variables-de-entorno.md`](../docs/variables-de-entorno.md).

### Bloqueo real y siguiente paso mínimo

**Falta `SMTP2GO_API_KEY` accesible para staging.** No está en el entorno del
proceso, no hay una asignación utilizable de ese nombre en `.env.local`, ni está
como binding/secreto del Worker. La comprobación local fue por línea exacta y
`parseEnv` de esa única asignación; no se cargó ni copió el dotenv completo ni
otros secretos. Tampoco había una sesión de SMTP2GO abierta en las pestañas del
navegador disponible. La documentación la ubica en Vercel como Sensitive; no se
intentó extraerla, rotarla ni cambiar la configuración de producción.

Para aportar **la clave existente legítima** sin pegarla en chat, ejecutar desde
la raíz en una terminal local:

```sh
python3 cloudflare/.local/staging-remoto/cargar-clave-smtp.py
```

El helper privado pide entrada oculta, exige terminal interactiva, no hace red
y crea `smtp2go.key` con 0600 bajo el directorio 0700 ya ignorado. Se niega a
sobrescribir un archivo previo. No crea claves en el proveedor, no carga secretos
remotos ni habilita/envía nada. Se comprobó su sintaxis, **no se ejecutó el ingreso**.
La clave debe salir del gestor/proveedor existente por el usuario, no del chat.

**Estado de salida:** ninguna capacidad de envío fue abierta, por lo que no hay
una ruta enviable que cerrar ni un envío exitoso que reintentar. Las guardas
remotas siguen como antes: Basic, noindex/no-store, egress deshabilitado y sin
secreto SMTP/Turnstile, productores de cola ni cron (`[]`). Pruebas negativas
remotas **9/9**: sin auth/incorrecta 401; auth correcta 503 explícito en formularios,
newsletter y recordatorio. Después se verificaron **las doce tablas privadas
vacías**, sin nuevas consultas, outbox, reservas o suscripciones. No se modificó
código/configuración del Worker, D1, UI ni servicios productivos; sin redeploy.

No se afirma formulario persistido, aviso enviado, aceptación del proveedor ni
entrega al buzón. **Cero correos reales intentados/aceptados.** No se creó un
sistema de envío nuevo para sortear el bloqueo. Tras aportar la clave, antes de
cualquier envío faltan: verificación de remitente/permisos del proveedor,
allowlist server-side exacta, cupo y reclamo durable del run, pruebas locales de
rechazos/ambigüedad, egress delimitado y check completo si se modifica código.
Un mail neutro de prueba del transporte no probará los avisos de Telegram ni
los flujos de precio sin datos reales. Captcha real/hostname de staging sigue
pendiente para formularios; no se usarán claves demo ni bypass local en remoto.

Evidencia privada: `correo-controlado-{preflight,negativos,run}.json` en
`.local/staging-remoto/`. Una consulta de conteos con doce UNION ALL fue rechazada
por D1 (`too many terms in compound SELECT`); tres lecturas de cuatro tablas
confirmaron los doce ceros. No fue un error de cuota ni hubo escrituras.
No se repitió `check`: sólo documentación y el helper local ignorado; **261/261**
sigue siendo evidencia de la etapa anterior, no una prueba de correo real.

### Segunda corrida: el bloqueo no es sólo la clave

Se repitió el inventario sobre el código real y la conclusión quedó más fuerte:
**aunque se aporte `SMTP2GO_API_KEY`, staging no tiene hoy ninguna ruta que pueda
mandar un correo a un destinatario.** Fabricar esa ruta para poder probar el
envío sería un cambio funcional inventado, así que no se hizo.

- El único correo de un solo destinatario es `mail-precio`
  (`src/operativa/consumidores.ts`): se alcanza sólo consumiendo el outbox
  (`consumirPendientes`/`consumirEfecto`), o sea por Queues o cron, y en staging
  `queue()` y `scheduled()` lanzan. Además exige una `consultas` con email y un
  precio **vigente** en `precios_privados`, vacía por diseño.
- `/api/newsletter` es el otro consumidor del transporte de mail, pero barre hasta
  50 suscripciones: es una campaña, fuera del alcance autorizado.
- La barrera de `staging/acceso.ts` sólo deja pasar `GET`/`HEAD` y, entre las APIs,
  únicamente `/api/estado` y `/api/carreras-detalle`. Cualquier otra ruta o método
  responde 503 **antes** de tocar D1.
- `SMTP2GO_API_KEY` sigue sin existir para staging: no está en el entorno del
  proceso, no hay `smtp2go.key` y el Worker no lo tiene como secreto.

Verificación remota de sólo lectura, con la credencial Basic privada y sin
imprimirla ni copiarla: `GET /` sin auth **401**; `GET /api/estado` con auth
**200** `{"ok":true,"etapa":"staging","envios":false}`; `POST /api/formularios`,
`POST` y `GET` de `/api/newsletter`, `POST /api/recordatorio-teclab` y
`POST /api/robot` con auth **503** con el mensaje de operación deshabilitada;
`GET /api/carreras-detalle` **200** (lectura permitida). Ninguna escritura ni
egreso; cron y colas siguen sin declararse.

No se tocó código ni configuración, así que **no se repitió `check`**: 261/261
sigue siendo evidencia de la etapa anterior. Cero correos intentados y aceptados
en esta corrida; la cuota de 3 mensajes queda intacta.

**Qué falta, cada cosa por separado:** (1) que el usuario aporte la clave con el
helper privado, sin pasar por el chat; (2) decidir si se habilita en staging un
consumidor de una sola fila sobre el outbox, con allowlist del destinatario
exacto, cupo durable y deduplicación previa al despacho —sin eso no hay ruta
enviable—; (3) un precio vigente para una carrera, que hoy no existe en el D1 de
staging. Con las tres, la prueba queda en un flujo y un mensaje.

### Tercera corrida: ruta de correo controlado, desplegada y bloqueada por falta de clave

Se autorizó agregar en staging un consumidor acotado de **una sola fila** para que
exista una ruta enviable y se pueda probar el camino real dentro del Worker
desplegado (binding y secreto reales), no un script que llame al proveedor desde la
máquina. Se implementó como ruta HTTP exclusiva de staging y quedó **desplegada,
probada y bloqueada**: sin `SMTP2GO_API_KEY` responde 503 `smtp-sin-configurar` sin
tocar la base ni la red.

**Qué se agregó** (todo dentro de `cloudflare/staging/` y sus pruebas; ningún módulo
de `src/` los importa, así que no existen en el build de producción ni en la
aplicación Astro):

| Archivo | Qué hace |
|---|---|
| `staging/correo-controlado.ts` | normalización y allowlist del destinatario, validación del cuerpo, cupo durable, despacho y clasificación |
| `staging/acceso.ts` | `POST /api/staging-correo` detrás de la misma barrera Basic; `GET`/`HEAD` 405, `PUT`/`DELETE`/`OPTIONS` 503 de la barrera, cuerpo ilegible o de más de 2048 bytes 400 |
| `staging/publicar-worker.ts` | captura el `fetch` real antes de cerrar el global y expone **un único egreso** |
| `tests/staging-correo.test.mjs` | 11 pruebas de las guardas, dentro de `npm --prefix cloudflare run test:staging-protegido` |
| `scripts/staging-remoto.mjs` | la configuración publicable admite sólo dos variables opcionales y rechaza habilitar sin destinatario, direcciones sin normalizar y variables extra |

El cuerpo acepta un solo campo, `para`. El mensaje es un texto neutro de
comprobación: no es cotización, inscripción ni aviso de clases, y por eso no
necesita precios ni datos de una persona.

**Orden real de las guardas** en `enviarCorreoControl`: habilitado → clave de
SMTP2GO → transporte → allowlist → base → validación del cuerpo → cupo → despacho.
Ningún rechazo de configuración o de destinatario consume cupo.

| Guarda | Comportamiento probado |
|---|---|
| Allowlist exacta, normalizada | sólo el destinatario de `STAGING_CORREO_PARA`; otro correo → 403 `destinatario-no-autorizado` |
| `cc`, `bcc`, `cco`, `lote`, `lista`, arrays | 400 `campo-no-admitido:<campo>` o `destinatario-invalido`; nunca se ignoran |
| Cupo durable y dedupe previo | `comprobarCupo` sobre `form_rate_limits`, clave `staging-correo-control:<sha256(destinatario)>`, máximo **1** y ventana de un año; se registra **antes** del despacho |
| Reintento | 429 `cupo-agotado`, sin volver a despachar, incluso después de un ambiguo |
| Ambiguo | timeout, error de red o respuesta ilegible → 502 `ambiguo`; no se reintenta solo |
| Rechazo del proveedor | 502 con el código del proveedor o `sin-destinatario` |
| Sin configuración | 503 explícito (`ruta-deshabilitada`, `smtp-sin-configurar`, `transporte-no-cableado`, `allowlist-sin-configurar`); nunca simula éxito |
| Egreso | sólo `https://api.smtp2go.com/v3/email/send` por POST con `redirect: 'error'`; cualquier otra URL o método falla antes de la red |
| Acceso | Basic auth primero; 401 sin credencial; `no-store` y `noindex, nofollow` en todas las respuestas |

**Nada de esto se registró como «enviado».** La respuesta del proveedor se clasifica
como `accepted`, `rechazado` o `ambiguo`; un 200 de la API no acredita entrega en el
buzón. No se escribe ninguna fila en `outbox` (su `CHECK` no admite tipos nuevos y
no hacía falta una tabla más): el cupo usa la tabla de límites que ya existía.

**Pruebas locales.** `npm --prefix cloudflare run test:staging-protegido` → **16/16**,
0 fallos (las 5 anteriores más las 11 nuevas). `node scripts/local.mjs diagnostico`
→ 117 archivos, 0 errores, 0 advertencias. El check completo, después del deploy,
terminó en **272/272, exit 0**, 0 fallos y 117 archivos sin diagnósticos (eran 261
antes de estas 11 pruebas). El artefacto exacto se ensayó en workerd
(`.local/staging-remoto/probar-paquete-correo.mjs`): 15 respuestas, `POST
/api/staging-correo` **503** `smtp-sin-configurar`, `GET` **405**, cero egreso,
`form_rate_limits` y `outbox` vacías.

**Publicación.** El artefacto se empaquetó con el esbuild que trae la dependencia
fijada (2.396.209 bytes, sha256 del módulo `9cd5c309…`) y se subió por la API del
MCP, sin Wrangler directo: se creó la **versión 3** (`f9e6f9bd…`) y recién después se
desplegó el **deployment `38a39d12…`** (26/10 01:38 UTC), conservando
`STAGING_AUTH_SHA256` como `secret_text`, el binding de ASSETS, el de D1 y el juego
de 431 assets. El deployment anterior (`181dbe7b…`, versión `11b7756e…`) sigue
disponible para volver atrás.

Verificación remota posterior, de sólo lectura: `GET /` y `GET /icon.png` sin auth
**401**; con auth **200** y CSP/HSTS presentes; `GET /api/estado` **200** `staging`;
`POST /api/staging-correo` **503** `smtp-sin-configurar` tanto con el destinatario
autorizado como con otro, `cc` o un array (la allowlist no llega a evaluarse sin
clave); `GET`/`HEAD` **405**, `PUT`/`DELETE`/`OPTIONS` **503**; `/api/formularios`, `/api/newsletter` y
`/api/recordatorio-teclab` **503**; `/api/carreras-detalle` **200**; `/contactos`
**308**. Todas las respuestas con `no-store` y `noindex, nofollow`. En D1:
`form_rate_limits` **0**, `outbox` **0**, `consultas`/`solicitudes_clase`/`faq_preguntas`
**0**. Cron `[]` y sin colas declaradas. **Cero correos intentados, cero aceptados:
la cuota de 3 sigue intacta.**

**Estado final: bloqueada por falta de clave**, no por falta de ruta. La ruta queda
armada en staging (`STAGING_CORREO_HABILITADO='si'` y el destinatario autorizado como
variables privadas del despliegue, fuera del repositorio) para que cargar la clave
sea el único paso pendiente. Para desarmarla sin tocar código, poner
`STAGING_CORREO_HABILITADO='no'` en la configuración publicable y volver a subir.

**Lo único que falta** es que el usuario cargue la clave existente de SMTP2GO en el
archivo privado, sin pasar por el chat:

```bash
python3 cloudflare/.local/staging-remoto/cargar-clave-smtp.py
```

Después de eso el secreto se sube al Worker de staging y el ensayo es **un** `POST
/api/staging-correo` con `{"para":"<destinatario autorizado>"}`. Un solo envío: el
cupo lo impide repetir, incluso si el resultado queda ambiguo. Para autorizar otro
intento habría que borrar a mano la fila `staging-correo-control:…` de
`form_rate_limits` en el D1 de staging.

## Copia remota protegida: resultado final

URL exclusiva, sin rutas en el dominio actual:
`https://cau-staging-20261026-3fb18784.kiamchomi.workers.dev`.
Acceso por el diálogo Basic del navegador; usuario/clave están sólo en el archivo
local privado `.local/staging-remoto/acceso.json`. Abrirlo localmente, **no pegarlo
en chat ni agregar credenciales a la URL**. La clave no está en este documento.
Es acceso compartido de staging, sin IdP ni nueva identidad de una persona.

Se creó un Worker dedicado con barrera 503, se deshabilitó su subdominio durante
la carga y se subió después el artefacto protegido. El primer GET público tras
habilitar exclusivamente `workers.dev` respondió **401**, vacío, sin Location,
`noindex, nofollow` y `no-store`. Las preview URLs permanecen deshabilitadas.
Lectura de configuración remota: sólo DB/ASSETS, cinco variables de wiring y
`STAGING_AUTH_SHA256` como **secret_text**; sin claves de proveedores, servicios,
colas ni otros bindings. Schedules remotos: **[]**. Usage model: `standard`.

**Empaquetado efectivo:** Wrangler instalado, entorno aislado por allowlist y
config privada validada contra identidad D1 observada. `deploy --dry-run --minify`
terminó exit 0; un único módulo de **2.492.726 bytes**, sin source maps.
El artefacto exacto minificado se probó de nuevo en workerd: **15 respuestas**
auth/HTML/assets/API/redirects/errores, sin egreso ni cambios en las doce privadas.
MCP recibió ese multipart y confirmó el upload protegido. Se adjuntaron **431
assets** (421 hashes únicos) mediante la API oficial: buckets 141/140/140,
HTTP **202/202/201**, finalización confirmada. Se excluyeron `_headers`,
`_redirects`, `.assetsignore` y mapas de fuente: las cabeceras las impone el wrapper.

El límite de request del MCP es **4 MiB**: rechazó el bundle original con HTTP
413 antes de actualizar el Worker. Se minificó con la opción instalada y se
repitió la prueba del artefacto, no se cambiaron permisos/proveedor ni la guarda.
Un reset transitorio al abrir la sesión de assets se reintentó sin duplicar D1
ni Worker. Los buckets se transfirieron con la capacidad temporal de upload
emitida por Cloudflare, nunca con OAuth/tokens de cuenta recuperados para shell.
Los problemas de `FormData`/tamaño de string del entorno Code Mode no se
confundieron con cuota; Node realizó esa transferencia acotada a la API oficial.

### Límite propio de la plataforma: `/cdn-cgi/*`

El control del Worker cubre **todas las rutas de la aplicación**, incluidos sus
assets, APIs, redirects y errores. **No cubre endpoints reservados que Cloudflare
sirve antes del Worker**: `/cdn-cgi/trace` devuelve 200 de diagnóstico sin auth ni
cabeceras nuestras; `/cdn-cgi/handler/scheduled` y la sonda de Images dieron 404
de plataforma, sin ejecutar el handler de la aplicación ni entregar sus assets.
No se guardó el cuerpo de trace (incluye datos de la conexión del solicitante).
No afirmar 401/noindex/no-store del Worker sobre ese espacio de nombres.
La documentación oficial confirma que no es modificable y recomienda excluirlo
de escáneres. Robots de la copia deniega `/` por completo. No se activó Access,
WAF, Images ni otro producto para intentar cambiar esta limitación.

Capturas **remotas autenticadas** aprobadas, 1440×900 y 390×844, sólo viewport:
`.local/staging-remoto/capturas/{home,carrera}-{escritorio,movil}.png`.
Chromium cargó fuentes e imágenes visibles, cero errores de página; sólo GET/HEAD
al staging y ninguna salida a terceros durante las cuatro capturas. Sin trace,
cookies exportadas ni auth en archivos de log/URL.

Matriz HTTP remota completa **aprobada**:

- **26** respuestas 401 para auth ausente/incorrecta en rutas de aplicación,
  assets, APIs codificadas, robots/sitemap y errores, sin redirect ni cuerpo.
- **121** rutas del snapshot: status exactos; title, description, canonical y
  JSON-LD idénticos en páginas 200. Meta/header robots de staging noindex; no-store
  en todo lo entregado por el Worker. Redirects comprobados sin seguirlos fuera
  del staging; canónicas siguen apuntando al dominio real.
- **236/236** referencias locales de imagen: HTTP 200, Content-Type `image/*` y
  SHA-256 idéntica; normalizaciones de nombres con coma sólo dentro del staging.
  También HEAD real de icono/fuente, 200 y cuerpo vacío, y lectura de estado/detalle.
- **22** GET/POST operativos rechazados con 503 explícito, sin éxito ficticio.
  Dobles codificaciones y rutas malformadas: 400. Robots autorizado: Disallow `/`;
  sitemap autorizado: 404, sin enlaces indexables.
- Nueva lectura D1 **después** de HTTP y capturas: cuatro huellas idénticas,
  93/7/12/0, doce privadas vacías, cero FK rotas/triggers. Schedules `[]`.
  Inventario final: **un D1 y un Worker**, ambos de este staging.

Evidencia privada: `verificacion-http.json` (ok true), `navegador-remoto.json`,
`integridad-remota-final.json` y `datos-remotos-final.json` en
`.local/staging-remoto/`. Una corrida HTTP previa se cortó por el timeout de 120 s
del shell; no se contó como aprobada. La repetición completa sin ese límite sí
terminó exit 0. La excepción `/cdn-cgi/*` se midió y se informa arriba, no se
escondió como un 401 ni se modificó la guarda para pasar el test.

`npm --prefix cloudflare run check`: **exit 0, 261/261**, veinte corridas de
suites, cero fallos/cancelaciones/skips. Astro/TypeScript: **116 archivos, cero
errores/advertencias/hints**; build/runtime aprobados, paridad **26/26** y E2E
**19/19**. El check completo incluye `test:staging-protegido` **5/5**. Persisten
los avisos PostCSS conocidos por imports tardíos en hojas compartidas; no se
cambiaron esas hojas. No se repitió check Next independiente: no se modificó
código/configuración de la raíz; paridad/E2E sí lo ejercitan en loopback.

La primera corrida completó sus pruebas, pero su envoltorio shell falló después
por usar `status` (variable reservada de zsh) al capturar el exit. La repetición
**completa**, con `resultado` y archivo de exit, terminó aprobada sin cambiar
tolerancias ni omitir pruebas. Log definitivo:
`.local/staging-remoto/check-protegido-final.log`; exit acreditado en
`check-protegido-final.exit`. La corrida anterior se conserva separada.

Los **431 paths / 421 hashes** del build final coinciden con los subidos; el
SHA-256/tamaño del módulo publicado están en `artefacto-publicado.json`. No se
publicaron mapas de fuente ni respuestas del plano de control. Las capacidades
temporales de upload se retiraron del estado/evidencia local después de usarlas;
se conserva sólo la credencial Basic de acceso, privada, y los IDs de staging.
El puente loopback se cierra al terminar; no es un servicio necesario para usar
la copia ni un proxy remoto persistente.

Revisión final de archivos propios sin whitespace, rutas absolutas locales ni
patrones de secretos; veinte huellas de cambios ajenos versionados permanecieron
iguales al control, incluido `PENDIENTES.md`. Sin commit/push, cambios a DNS,
dominio actual, Supabase/Vercel, nuevas suscripciones, envíos ni precios privados.

**Límites y próximo permiso:** copia de lectura autenticada, no operativa de
producción. Formularios/métodos/API de envío rechazan y no guardan nada; sin
Turnstile real, cron, colas, mail, Telegram, HubSpot, GitHub ni analítica externa.
R2, precios/configuración comercial privada, optimización de imágenes y servicios
reales no quedan certificados. La excepción de plataforma `/cdn-cgi/*` permanece
expresa. Cualquier prueba controlada de integración/canal/destinatario requiere
autorización posterior; corte/DNS/retirada de servicios y compras siguen fuera
del alcance. **No se afirma que producción esté lista.**

## Continuación remota autorizada: D1 importado, deploy pendiente

Registro intermedio, anterior al deploy; el resultado vigente está arriba.

El signin MCP con **Full access** resolvió el bloqueo anterior de herramientas.
Se confirmó la misma cuenta por `get_accounts`; los inventarios D1 y scripts
Workers respondieron `success:true`, vacíos, antes de crear. Ajustes Workers:
`default_usage_model: standard`. La consulta de suscripciones sigue 403 porque
el endpoint requiere Billing y no admite scopes OAuth: **no se creó un token ni
una suscripción para sortearlo**. Workers Paid es el plan existente informado por
el usuario, no una factura verificada aquí. Access continúa no habilitado; no se
activó, ni se creó un IdP o una política de dominio.

- D1 nuevo exclusivo: `cau-staging-20261026-3fb18784`. Identidad/ID/cuenta reales
  en `.local/staging-remoto/estado.json`, ignorado y 0600. Se comprobó el ID/nombre
  remoto y ausencia de tablas propias antes de migrar. Ningún recurso previo se
  reutilizó ni borró. No hay binding a Supabase ni a producción.
- Dry-run del **mismo plan parametrizado** en D1 efímero local: aprobado antes de
  las escrituras remotas. Se aplicaron **10 migraciones**, registradas en
  `d1_migrations`; después **112 INSERT** exclusivamente públicos, con evidencia
  incremental, sin borrados ni sobrescritura. No se reexportó la fuente.
- Lote: el de `2026-10-25T21-06-38.465Z-7b467d4b-9c5c-4183-a525-a211e8285664`,
  validado por su manifiesto. Lectura remota posterior: **93 carreras, 7 materias,
  12 novedades, 0 FAQ**. Las cuatro SHA-256 coinciden con el snapshot usando
  `verificarPublico`; **12 tablas privadas vacías, FK 0 y triggers 0**.
- La importación remota usa sentencias parametrizadas secuenciales, **no promete
  atomicidad entre 112 llamadas HTTP**. Se detiene ante error y conserva progreso;
  un reinicio debe inspeccionar estado/huellas, nunca reimportar o limpiar por
  rutina. La carga íntegra actual sí está comprobada antes de cualquier deploy.

### Protección preparada y custodia

`staging/acceso.ts` autentica antes de delegar HTML/assets/APIs. Usa Basic sobre
HTTPS con credencial aleatoria exclusiva; `staging` es una etiqueta técnica de
acceso compartido, **no una identidad de usuario inventada**. La clave se generó
con 32 bytes criptográficos y sólo vive en `.local/staging-remoto/acceso.json`
(0600, directorio 0700). No se imprimió, pasó por chat, URL, argumentos ni bundle.
El Worker recibe sólo su SHA-256 como secreto de servidor; comparación de
digests de tamaño fijo con `crypto.subtle.timingSafeEqual` de workerd. Sin secreto
o configuración completa responde 503; sin auth o con auth incorrecta, 401 vacío.

El entry publicable separado exige staging/D1 correcto, egress `disabled`, sin
cola; el validador puro exige identidad observada y autorización explícita y
rechaza rutas/dominios, cron, recursos extra, secretos operativos, bindings sin ID
y bypass de assets. `assets.run_worker_first:true` es obligatorio para toda ruta.
La preparación histórica y su build `denegar-publicacion` **no se quitaron**; no
se habilitó un comando npm de deploy arbitrario ni se alteró `wrangler.json` local.

Todas las respuestas llevan noindex/no-store, CSP acotada y no-referrer; no se
conservan cookies ni cache CDN. Robots deniega todo, sitemap no se publica;
metas robots HTML se cambian sólo en staging, conservando canonical productivo.
Redirects autorizados permanecen relativos al staging; destinos ajenos se niegan.
POST/otros métodos, upgrades y APIs operativas (también codificadas) rechazan con
error explícito, sin éxito simulado. Sólo se permite leer carreras-detalle/estado.
El fetch global del entry **rechaza antes de hacer red**; las lecturas usan D1 y
ASSETS explícitos. La CSP impide Google, captchas/iframes y connect externos.

Pruebas actuales: `test:staging-protegido` **5/5, exit 0**, incluyendo el entry
real en workerd, assets/auth/errores/redirects, métodos/APIs codificadas, plan D1,
ausencia de escrituras y sonda de fetch operativo rechazada **antes** de salir.
`diagnostico`: **116 archivos, cero errores/advertencias/hints**. Check completo
y empaquetado/deploy/verificación remota **todavía pendientes en esta sección**;
no hay URL navegable ni capturas remotas acreditadas aquí.

Regresiones de pruebas corregidas: `//api` se interpretaba como host en la URL
relativa del harness, no como ruta; ahora se envía URL absoluta con doble barra
real y el Worker responde 400. Se amplió el typecheck a `staging/**/*.ts`: se
retiró un `@ts-expect-error` innecesario y un `await` sin efecto. No se atribuyeron
estos fallos de código/harness a cuota ni se relajaron guardas para aprobarlos.

Transferencia a herramientas MCP: puente efímero de loopback, sólo rutas fijas
para plan/build/estado/evidencia, sin CORS ni Origin, cabecera propia obligatoria;
no acepta comandos ni hace proxy de red. No lee OAuth, dotenv o credenciales de
producción. No se adjuntan respuestas completas ni claves a la documentación.

## Autorización remota nueva y bloqueo comprobado

El usuario respondió **«Autorizo»** a crear D1 de pruebas, importar el contenido
público y publicar una copia protegida en Cloudflare usando Workers Paid existente.
Esto sustituye las restricciones históricas de creación/importación/deploy de
staging de las secciones siguientes, **no** autoriza producción, DNS, envíos,
cron, colas, nuevas suscripciones ni compras. No se reexporta la fuente.

La continuación se detuvo **antes de crear recursos o publicar** por permisos:

- `wrangler whoami --json`: exit 0, OAuth autenticado, una cuenta. Sólo declara
  `user:read`, `offline_access`, `account:read`, `zone:read`.
- GET de scripts Workers: HTTP 200, lista vacía. No se observó un Worker previo
  de staging; esto no acredita permiso de publicación.
- GET de bases D1: **HTTP 401, código 10000 Authentication error**. El inventario
  D1 no se pudo comprobar: no se supone vacío ni se crean duplicados.
- GET de aplicaciones Access: **HTTP 403, código 9999, Access not enabled**.
  No hay un mecanismo Access utilizable acreditado; no se habilitó el producto,
  creó un IdP ni modificó política alguna.
- GET de suscripciones: **HTTP 403, código 10000**. Workers Paid es información
  aportada por el usuario, no verificación remota conseguida en esta corrida.

Evidencia privada en `.local/staging-remoto/{whoami,workers,d1,access,subscriptions}.json`,
archivos 0600 en directorio 0700 ignorado. No contiene tokens nuevos; no se
publican identidades de cuenta ni respuestas completas. OAuth se utilizó sólo
en memoria para estos GET de Cloudflare; no se leyó `.env.local`.

### Reintento con el MCP oficial autenticado

Después de que el usuario completara el signin oficial y dijera «listo», se
descubrieron las herramientas exactas del MCP, sin repetir OAuth de Wrangler:

- `get_accounts`: **success true**, una cuenta; descubrimiento explícito aprobado.
- `get_accounts_d1_database`, `get_accounts_workers_scripts` y
  `get_accounts_workers_accountsettings`: las tres llamadas con esa cuenta
  descubierta fallaron con **`requires user authorization`** del servidor MCP.
  No devolvieron inventarios ni estado de plan. No son los 401/403 anteriores de
  Wrangler ni fallos de código/cuota. La disponibilidad del catálogo no demuestra
  autorización de cada herramienta.

**Siguiente paso:** completar la autorización adicional del MCP oficial para
las herramientas D1/Workers que la solicitan. No renovar Wrangler ni ejecutar
auth desde shell en este flujo; no crear/rotar tokens ni pegar secretos en chat.
No hubo escrituras, recursos nuevos, importación ni publicación durante el reintento.
La evidencia de este reintento son los resultados de herramientas en la sesión;
los JSON privados de arriba pertenecen sólo a la inspección anterior.

Tras autorizar las herramientas, volver a comprobar cuenta/plan/inventario antes de crear nada y
resolver acceso efectivo desde el primer request (incluidos assets/APIs/errores).
Access no se presupone disponible; un secreto exclusivo de staging por canal
local seguro sigue siendo una alternativa por implementar y probar, no acceso
existente. **No hay URL remota, D1 creado/importado ni capturas remotas.**
No se cambió código ni se repitió check: 256/256 sigue siendo evidencia de la
corrida local anterior, no de esta continuación ni de staging remoto.

## Alcance autorizado el 25/10/2026

Verificar las diez imágenes externas que faltaban y preparar configuración de
staging independiente. **No crear recursos, desplegar, cambiar DNS, activar cron,
enviar mensajes, cargar secretos ni generar cargos.** Supabase y Vercel continúan
intactos; el alcance de datos sigue siendo contenido público sin históricos privados.
No se repitió la exportación remota. La continuación posterior sólo reimporta el
snapshot existente en un D1 efímero local separado, como se detalla al final.

## Imágenes: comprobación real

`npm --prefix cloudflare run verificar:imagenes-externas` se repitió el 25/10/2026
a las 22:14 UTC y terminó **exit 0, 10/10** (la corrida anterior, 22:03 UTC, dio
el mismo resultado):

- `images.unsplash.com`: **8/8**, HTTP 200, `image/jpeg`, ancho 1000 px y alturas
  563, 667, 750 o 751 px. Referencias en `materias` y las páginas de clases de apoyo.
- `i.ytimg.com`: **2/2**, HTTP 200, `image/jpeg`, 1280×720; ambas en `/sobre-nosotros`.
- Cero redirecciones. Las diez se decodificaron a píxeles con `sharp.raw()`, no
  sólo leyendo cabeceras. URLs exactas y fuentes en
  [referencias](../referencias/2026-10-25-cloudflare-staging.md).

No hay otras referencias externas en el lote: las 246 de `fuente-seo.json` son
estas diez más 236 locales/servidas por el sitio. Las ocho de Unsplash se reparten
en cinco de las siete materias (dos usan dos y dos no usan ninguna) y las dos
miniaturas de video están en `/sobre-nosotros`.

El comprobador lee únicamente el lote público existente, valida sus huellas y
limita el conjunto a esas diez referencias. Sólo HTTPS, dos hosts exactos,
rutas de imágenes, sin usuario/contraseña, cookies ni auth. DNS IPv4 con timeout;
rechazo de rangos privados/reservados y dirección fijada en la conexión TLS para
evitar rebinding. Redirects manuales, máximo tres seguidos, mismo origen y misma
ruta; no se consulta un desvío no autorizado. Cada GET tiene límite de 20 s y
10 MiB; la decodificación se limita a 40 millones de píxeles. No se comprueba IPv6.

No se guardaron imágenes ni se sustituyeron URLs/copy. Se conserva sólo evidencia
de status, tipo, dimensiones, SHA-256, saltos y cobertura de referencias:

```text
cloudflare/.local/preparacion-staging/imagenes-2026-10-25T22-03-31.902Z.json
cloudflare/.local/preparacion-staging/imagenes-2026-10-25T22-14-53.514Z.json
```

La segunda es la corrida de revalidación; no reemplaza ni borra la primera.
Directorio 0700 y archivos 0600, ignorados. Es disponibilidad observada, **no** una
licencia de redistribución, garantía futura ni reproducción del navegador completo.
Antes de copiar medios a otro almacenamiento se debe revisar su licencia.
Los tests siguen bloqueando red externa y usando imágenes ficticias cuando corresponde.

Se corrigió únicamente la CSP del port para permitir `https://images.unsplash.com`
en **img-src**, además de `i.ytimg.com` ya permitido. No se abrieron script-src ni
connect-src, no se agregó wildcard y no cambió ningún recurso ni estilo. La barrera
de staging mantiene `default-src 'none'`: todavía no sirve el sitio.

## Qué se preparó y qué NO funciona todavía

- `staging/preparacion.wrangler.json`: configuración separada que no participa
  de `astro.config.mjs` ni de `wrangler.json` local. Sin cuenta, dominio, rutas,
  D1, colas, DLQ, R2, servicios o secretos. `workers_dev` y `preview_urls` apagados,
  cron explícitamente vacío, observabilidad/telemetría apagadas.
- `staging/worker.ts`: barrera cerrada. Responde **503 vacío** para todas las rutas,
  incluidos assets/API/robots/sitemap, con **noindex, nofollow**, **no-store** y CSP
  cerrada. No importa Astro, no expone ASSETS, no usa DB ni acepta cabeceras/cookies
  como prueba de identidad. `queue` y `scheduled` rechazan; el puerto de transporte
  rechaza antes de hacer red. Cambiar una variable no habilita acceso ni egress.
- `staging/recursos-pendientes.json`: inventario **no utilizable como config de
  Wrangler**, identidades/nombres pendientes en null, sin IDs ficticios. Se valida
  que no incorpore recursos ni secretos accidentalmente. No hay recurso compartido
  con producción por defecto.
- `scripts/preparar-staging.mjs`: valida estructura con el **schema instalado de
  Wrangler 4.152.0**, usando Ajv ya instalado y sin invocar CLI/API de Cloudflare.
  Las anotaciones editoriales del schema no son reglas de validación; se admiten
  sin desactivar las reglas ni la allowlist estricta propia. El preflight puro
  `validarBindingFuturo` exige autorización e identidad D1 esperada, binding remoto
  explícito y exclusión de IDs de producción. **No comprueba existencia remota**:
  esa identidad se debe confirmar en la fase futura autorizada, no inventarla.

**Esto no es un staging navegable/autenticado ya conectado al contenido.** Hasta
aprobar e implementar un mecanismo de acceso real, se deniega todo. No se eligió
un proveedor de identidad ni se configuró una aplicación Access por inercia.

### Guardas contra publicación accidental

La preparación no usa el nombre de descubrimiento automático `wrangler.json`.
El runner sólo acepta comandos fijos y no hereda credenciales/configuración de
Cloudflare; no ofrece deploy, upload, publish, login, secret ni dev remoto.
La configuración separada tiene un build que ejecuta `denegar-publicacion.mjs`
y sale con código 2. Se probó el script de denegación directamente, **no** deploy
ni deploy --dry-run. Las pruebas workerd omiten ese build sólo en memoria para
ejercitar la barrera local, sin bindings ni CLI.

Estas guardas previenen el flujo accidental soportado, no un operador que quite
el build o cambie flags/configuración deliberadamente. No son autorización para
usar Wrangler directamente. El runner rechaza archivos dotenv también dentro
de `staging/`, sin abrirlos. No se creó ninguno en el paquete.

**No dejar bindings sin IDs como plantilla de deploy.** La documentación actual
advierte que Wrangler puede autoprovisionar D1/Queues/R2 al publicar, incluso
crear automáticamente una DLQ inexistente. Por eso esos bloques están ausentes
de la configuración y sólo se describen como pendientes en un archivo aparte.

### Acceso e indexación antes de abrir un staging futuro

Noindex no autentica ni protege datos. Una futura solución de Access debe
validar criptográficamente firma, issuer, audience y vigencia, no confiar sólo
en `Cf-Access-Jwt-Assertion`/cookies. Team domain y AUD se configuran desde una
fuente confirmada, nunca desde un token arbitrario. La obtención/rotación de
JWKS requiere un permiso de lectura de red delimitado si se elige ese mecanismo.
No se implementó ni activó aquí.

Si se conectan assets, el control debe ejecutarse antes de **todos** ellos
(`assets.run_worker_first: true`), evitando el bypass asset-first y manteniendo
noindex/no-store también en assets, errores y redirects. Hay que probar acceso
no autorizado/permitido contra el build, sin confundir `ctx.access` con validación:
la documentación señala limitaciones de ese contexto con Static Assets.
La configuración local de paridad sigue con su política de producción por ruta;
no se alteraron sus canónicas ni se desindexó el sitio actual para probar staging.

## Bindings, variables y secretos: nombres, no valores

La barrera de preparación sólo declara `APP_STAGE=staging`, `STAGING_ACCESS=deny-all`
y `OUTBOUND_MODE=disabled`, sin secretos. El inventario siguiente describe lo que
requiere **la aplicación futura**, no lo que se cargó ni un servicio funcionando.

| Nombre / dato | Alcance y necesidad real |
|---|---|
| `DB` (D1) | Necesario para servir el contenido importado cuando se abra staging. Base exclusiva, identidad remota confirmada y sin compartir producción. No creada. |
| `EFECTOS` (Queues) + DLQ dedicada | Necesarios al habilitar el flujo durable de formularios/efectos. No hacen falta para la barrera ni para leer páginas. No creadas ni conectadas. |
| `PUBLIC_TURNSTILE_SITE_KEY` | Variable pública de runtime para el widget, no secreta. Necesaria al probar captcha real; ausente de la preparación. |
| `TURNSTILE_SECRET_KEY` | Secreto de servidor para captcha y pase HMAC. Obligatorio para aceptar formularios reales; no para lectura pública. No cargado. |
| `TURNSTILE_EXPECTED_HOSTNAME` | Variable de servidor; aunque el módulo la permite omitir, debe delimitar el host de staging antes de una prueba real. No se usa el hostname de producción por defecto. |
| `ROBOT_SECRET` | Secreto de auth de la API del robot, sólo si se habilita esa integración. No cargado. |
| `CRON_SECRET` | Secreto para endpoints protegidos de newsletter/recordatorio/vigilancia. Configurarlo no programa ni autoriza cron. No cargado. |
| `REVALIDATE_SECRET` | Secreto del contrato HTTP de revalidación si se conserva ese consumidor. No conectado a los triggers de Supabase. |
| `SMTP2GO_API_KEY` | Secreto condicional para mail de precio/newsletter y para el ensayo de staging. Sin él no se certifica envío. No cargado: se aporta con `python3 cloudflare/.local/staging-remoto/cargar-clave-smtp.py`. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Configuración privada para avisos/alertas/vigilancia; necesaria sólo al probar ese canal con autorización de envío. Ausente. |
| `ROBOT_GITHUB_TOKEN`, `ROBOT_GITHUB_REPO` | Nombres del contrato vigente de GitHub. El adaptador recibe token/repo por parámetro; **el runtime Cloudflare todavía no los conecta**. No basta con añadir variables. |
| HubSpot | El transporte existente usa el pedido público construido por `casas.ts` y un flag de habilitación inyectado. No inventar un `HUBSPOT_TOKEN`: no lo consume este transporte ni está conectado en el entrypoint. |
| Analítica (`NEXT_PUBLIC_GA_ID` sólo de build) | Sólo registrador local actual. Proveedor externo y su configuración pendientes de elección explícita; no activar Google/Vercel ni inventar tokens. |
| Precios privados vigentes | Configuración comercial necesaria para «Ver precio»/newsletter comercial; no es historial descartable. No se exportaron ni se inventaron. Publicadores/wiring pendientes. |
| `FORMULARIOS_DEMO`, `FORMULARIOS_PRUEBA_LOCAL` | Exclusivos del entorno local. No habilitarlos en staging ni etiquetar staging como local para saltar guardas. |

**Obligatorios por etapa, no por inercia:** para leer páginas, `DB`; para aceptar
un formulario real, `DB` y `TURNSTILE_SECRET_KEY` (sin el secreto responde 503);
para publicar efectos durables, además `EFECTOS` y su DLQ. `CRON_SECRET`,
`REVALIDATE_SECRET`, `ROBOT_SECRET`, mail, Telegram y GitHub son condicionales y
sólo se cargan al autorizar la prueba de ese canal. `PUBLIC_TURNSTILE_SITE_KEY`
es pública y sólo hace falta para probar el widget real; R2 no es obligatorio.
`FORMULARIOS_DEMO` y `FORMULARIOS_PRUEBA_LOCAL` no se habilitan en staging.

Fuentes de runtime: `src/api/runtime.ts`, `src/api/turnstile.ts`,
`src/operativa/{programados,transportes}.ts` y `src/entrega/entorno-publico.ts`.
`bindingDb` delega ahora en `src/datos/binding.ts`: conserva el contrato local
existente y admite staging **sin cola**, únicamente con `APP_STAGE=staging`,
`DB_STAGE=staging`, `DB_NAME=cau-staging-<identificador>` y binding `DB` presente.
Rechaza etiquetas incompletas/contradictorias, producción, nombres compartidos
o marcados prod/production/produccion/local/dev y `EFECTOS` en staging. La etiqueta
es una comprobación de wiring, **no certifica la identidad de un recurso remoto**:
esa identidad sigue exigiendo autorización y preflight contra el inventario real.
`bindingCola` y los modos demo/prueba siguen exclusivos de local. No copiar la
configuración local al remoto ni etiquetar staging como local.

Si se elige Cloudflare Access, los nombres del contrato oficial son `TEAM_DOMAIN`
y `POLICY_AUD` para validar firma, `iss`, `aud` y vigencia; no están en el código
de este paquete ni se cargaron. `noindex` no reemplaza esa validación.

R2 **no es requisito acreditado para este contenido**: assets seguidos por Git
y diez URLs externas conservadas. Esto no prueba que Storage esté vacío ni
autoriza borrar objetos. No se agregó binding R2 ni se movieron archivos.

## Próxima autorización, por pasos separados

**Permiso concreto que falta:** autorizar (a) el mecanismo y los usuarios de
acceso, (b) la creación de un D1 exclusivo de staging y su costo, y (c) la
importación del snapshot público más un dry-run delimitado. No incluye DNS,
tráfico real ni corte.

1. Aprobar el mecanismo y los usuarios de acceso de staging, la identidad del
   entorno separado y la creación de recursos/costos permitidos. No se pide
   pegar secretos en chat: se cargan después por un medio privado autorizado.
2. Sólo con ese permiso, crear el D1 de staging y confirmar sus IDs contra el
   inventario de producción. Preparar el build/config efectivos con guardas y
   acceso real antes de exponerlos. Dry-run delimitado, sin activar rutas/DNS.
3. Autorizar la carga del snapshot **público** ya verificado a ese D1 separado;
   cotejar conteos, hashes y SEO. Sin histórico privado ni cambios a Supabase/Vercel.
4. Crear/conectar Queues/DLQ sólo al autorizar escrituras/pruebas de efectos.
   Mantener transporte simulado/egress cerrado; después habilitar cada prueba
   externa por canal y destinatario ficticio explícitamente autorizados. Cron
   permanece apagado hasta comprobar que no duplica ejecutores productivos.
5. Corte reversible/DNS/servicios reales y pagos requieren autorización posterior
   independiente. No se retira ni altera Vercel/Supabase como parte de staging.

## Comandos permitidos y pruebas

```sh
npm --prefix cloudflare run verificar:imagenes-externas
npm --prefix cloudflare run preparar:staging
npm --prefix cloudflare run test:preparacion
npm --prefix cloudflare run importar:dry-run
npm --prefix cloudflare run test:staging-local
npm --prefix cloudflare run check
```

Sólo el primero consulta las diez URLs de imagen. El validador y las pruebas no
usan red externa ni ejecutan la importación real. La suite cubre schema, rechazo
de autoprovisionamiento/producción, headers falsificados, ausencia de egress,
cron/cola cerrados, flags de publicación, DNS/IP/redirects, decodificación real
con imágenes sintéticas, la barrera en workerd local, la config local intacta y
que staging no reutilice sus recursos.

Resultados anteriores a la continuación local (25/10/2026): `preparar:staging` **exit 0**;
`test:preparacion` **9/9**; `check` **252/252, exit 0**, 18 suites, cero
fallos/cancelaciones/skips; Astro/TypeScript **112 archivos con 0 errores,
0 advertencias y 0 hints**; build y runtime workerd aprobados. Una corrida
anterior del check falló en paridad porque el Next de pruebas devolvió 500 en
`/sitemap.xml`; `test:paridad` aislado dio **26/26** y la repetición completa
terminó en 252/252. No se contó la corrida fallida como aprobada.
No hay verificación remota de Access/D1/Queues o de servicios; todavía no existen.

Evidencia local (ignorada, 0600): `.local/check-staging-final2.log` es la corrida
aprobada; `.local/check-staging-final.log` conserva la fallida y
`.local/paridad-reintento.log` la paridad aislada 26/26.

## Continuación local: wiring e importación protegida

Las tres autorizaciones de la sección anterior **siguen pendientes**. El ensayo
no las sustituye: no creó recursos remotos ni desplegó nada. Tampoco leyó dotenv,
repitió exportaciones, consultó imágenes externas ni tocó el D1 de desarrollo.

- El entrypoint por defecto de `staging/worker.ts` **continúa 503 vacío deny-all**,
  incluso con un binding correcto y cabeceras/cookies de acceso. No importa Astro
  ni expone assets. La configuración separada y su build de denegación no cambiaron.
- `crearEnsayoStaging` permite inyectar un renderizador **sólo desde el fixture**
  `tests/fixtures/worker-staging.ts`. No existe flag de entorno/HTTP que lo active
  en el entrypoint por defecto. El fixture importa Astro compilado en workerd y
  sólo permite GET HTML: APIs (también rutas codificadas), POST, assets, sitemap, robots, redirects y errores
  quedan vacíos. Incluso el HTML renderizado se devuelve como **503, noindex,
  nofollow, no-store**, CSP `default-src 'none'`; no conserva Location ni cookies.
  No es un staging autenticado ni un entrypoint para publicar.
- `test:staging-local` crea un D1 **en memoria, efímero**, con nombre
  `cau-staging-ensayo-<UUID>` e ID aleatorio, `remote:false`, sin persistencia,
  ASSETS, colas o servicios y cron `[]`. Aplica migraciones e importa exclusivamente
  el snapshot público existente (93/7/12/0), con permiso local explícito. Compara
  las cuatro huellas, FK y las doce tablas privadas vacías antes/después de servir
  home, Teclab, Administración, clases, novedades y una sonda del `bindingDb` real.
  Se cierra al terminar, también si falla; nunca usa `.wrangler/state` de dev.
- La guarda de red se instala **antes** de crear el harness. Se comprueba desde
  Node y desde workerd con una URL `.invalid`, rechazada antes de salir. Renderizar
  las seis rutas no intenta egreso; la sonda intencional acredita el bloqueo del
  runtime, no disponibilidad externa. Cron y cola rechazan; no se habilitan
  captcha, proveedores ni escrituras de formularios.
- `scripts/importar-datos.mjs` exige opciones explícitas: `dryRun:true` **o**
  `escribir:true`, nunca ambas, y destino con etapa/nombre y `remoto:false`.
  Sin ellas falla antes de consultar DB. Rechaza producción y destinos remotos,
  incluso en dry-run. El dry-run valida el snapshot y calcula conteos/huellas sin
  leer ni escribir el binding; no certifica disponibilidad/permisos del destino.
  La CLI sólo acepta `--dry-run` (runner `importar:dry-run`); no hay CLI de carga
  remota, flags de credenciales ni passthrough a Wrangler. El ensayo público
  existente también declara ahora su permiso local explícito. Dobles que fallan
  ante cualquier acceso al binding verifican estas guardas sin red.

El mínimo permiso que falta no cambió: **mecanismo/usuarios de acceso**, **creación
y costo de un D1 exclusivo de staging** y **carga remota del snapshot público**,
cada uno explícito. Después habrá que confirmar IDs, conectar acceso real y
añadir un ejecutor remoto delimitado y autorizado (hoy deliberadamente ausente).
Queues, cron, secretos, servicios, DNS, pagos y corte no quedan incluidos.

No se corrió check Next independiente: ningún archivo
de código/configuración de la raíz fue modificado por este trabajo; paridad y E2E
del paquete sí ejercitan Next local con sus dobles y bloqueo de red habituales.

Regresión encontrada y corregida antes del cierre: el primer filtro de APIs
comparaba únicamente `/api/` literal y dejaba invocar el renderizador para
`/%61pi/formularios` o `/api%2fformularios`. El test reprodujo **dos invocaciones
indebidas** (3/4 aprobadas). Se rechazan rutas codificadas y prefijos API incluso
con barras repetidas/mayúsculas **antes** de renderizar. La repetición dio **4/4**,
sin consultas ni escrituras por esas rutas. La suite de preparación permanece
**9/9**; el preflight y `importar:dry-run` terminaron con **exit 0**.

Una primera corrida completa se interrumpió por el timeout de 120 s del shell,
durante `control`: dos suites canceladas, no un aprobado ni un error de cuota.
Se conserva en `.local/check-staging-continuacion.log`; la repetición se lanzó
sin límite de tiempo en `.local/check-staging-continuacion-final.log`.

### Resultado definitivo de la continuación

- `npm --prefix cloudflare run check`: **exit 0, 256/256**, 19 corridas de suites,
  cero fallos/cancelaciones/skips. Tipos generados; Astro/TypeScript **113 archivos,
  0 errores, 0 advertencias, 0 hints**; build, runtime workerd y entrega aprobados.
  Paridad **26/26**, E2E **19/19**, sin cambiar tolerancias ni hojas de la raíz.
  Persisten los avisos PostCSS conocidos por imports tardíos de CSS compartido.
- `npm --prefix cloudflare run test:staging-local`: **4/4, exit 0**; también pasó
  dentro del check completo con el build recién generado y el snapshot existente.
  Destino de esa corrida: `cau-staging-ensayo-567cb848-9be3-4d14-9c18-3b295f29b87b`,
  exclusivamente en memoria y cerrado al finalizar. Seis rutas HTML 503, cuatro
  tablas con huellas idénticas, doce tablas privadas vacías, cron `[]`, sin colas
  ni egreso externo; sonda de red intencional bloqueada antes de salir.
- `npm --prefix cloudflare run test:preparacion`: **9/9, exit 0**.
- `npm --prefix cloudflare run importar:dry-run` y
  `npm --prefix cloudflare run preparar:staging`: **exit 0**; plan 93/7/12/0,
  cero recursos remotos y acceso deny-all.
- Diff-check de **13 archivos propios**, incluidos los no trackeados: sin errores
  de whitespace, rutas absolutas locales ni los patrones de secretos revisados;
  enlaces locales verificados. Las **20 huellas de control de cambios ajenos
  versionados** permanecen iguales al control durante la ejecución, incluido
  `PENDIENTES.md`. Sin commit/push ni cambios a la configuración remota.

Log completo aprobado: `.local/check-staging-continuacion-final.log` (0600).
La corrida interrumpida y la regresión reproducida se conservan por separado,
también 0600. **Esto certifica el ensayo local, no producción ni acceso remoto.**
