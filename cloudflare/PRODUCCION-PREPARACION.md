# Configuración operativa pendiente, sólo preparación local

Este inventario no es una configuración publicable. No contiene IDs ficticios,
credenciales, dominios nuevos ni un comando de deploy. Producción actual sigue
intacta. [Plan existente](../docs/plans/2026-10-24-cloudflare.md).

Lo que hoy está comprobado en staging es **un formulario de contacto con captcha
real, persistencia en D1 y su aviso pendiente**. No acredita integraciones
completas, ni que el sitio esté listo para el corte: el aviso real (Telegram) no
se envió, y colas, cron, precios, R2, SEO productivo y cachés siguen sin probar.

## Prioridades

**P0 — sin esto el corte rompe algo que hoy funciona en producción.**

| # | Qué falta | Cómo se verifica | Quién/ qué decide |
|---|---|---|---|
| 1 | D1 productivo separado del de staging, con el contenido público importado y verificado (hoy: 93 carreras, 7 materias, 12 novedades, 0 FAQ) | conteos y huellas idénticas al snapshot, `PRAGMA foreign_key_check` vacío; nunca reutilizar la base de staging | autorización de recursos |
| 2 | Captcha del dominio real: widget propio + `TURNSTILE_SECRET_KEY` de **ese** widget + site key pública de runtime + hostname exacto. La clave y el widget de staging no se reutilizan. Además, el desafío real tiene que resolverse en un navegador de verdad: en esta máquina el widget de staging mostró el checkbox pero no entregó token (su marco pidió `hagen.challenges.cloudflare.com` y abortó), con y sin CSP del wrapper | un token real de una sola uso pasa Siteverify y uno inválido da 403; `hostname` y `action` exactos | decisión de dominio/DNS; hoy no autorizado |
| 3 | Quitar la capa de ensayo: Basic auth, `noindex`/`no-store` globales, robots `Disallow: /`, sitemap 404 y la allowlist de un solo correo **no** son un entrypoint productivo | cada ruta pública responde sin `Authorization` y con `Cache-Control` de producción | código nuevo, no sólo variables |
| 4 | Aviso real de consulta: el contrato es `aviso-lead` por Telegram (no mail). Hoy la fila queda `pendiente` porque no hay productor ni consumidor autorizado | un lead de prueba autorizado dispara el aviso y deja la fila en `enviado`; un fallo conocido en `error` | canal, chat y secreto del bot |
| 5 | Secretos de servidor por canal privado, uno por proveedor, con rotación documentada; nada en assets, bundle ni variables públicas | `GET` de settings sin secretos en texto plano; el paquete no los contiene | custodia del titular |
| 6 | Precios privados: `precios_privados` está vacía en staging y no se trasladó nada. Sin precio vigente, «Ver precio» y `mail-precio` no tienen efecto y `transportarMail` rechaza `sin-precio-vigente` | una carrera con precio vigente devuelve cotización y encola el mail; con precio vencido no lo encola | fuente de precios y publicador |
| 7 | SEO y entrega: canónicas al dominio real (en staging ya apuntan al real), sitemap/robots productivos, redirects de `next.config.ts`, JSON-LD, HSTS/CSP y `noindex` sólo donde el sitio lo declara | paridad reproducible contra el sitio vigente por ruta y byte a byte del sitemap | ventana de corte |

**P1 — antes de retirar Vercel/Supabase.**

| # | Qué falta | Cómo se verifica |
|---|---|---|
| 8 | Outbox con ejecutores reales: productor, consumidor, DLQ, reclamo e idempotencia. Hoy `queue()` y `scheduled()` de staging lanzan y ningún efecto sale | pruebas de concurrencia, ambigüedad y recuperación; un efecto enviado una sola vez |
| 9 | Cron: reemplazar los tres crons de Vercel y los jobs de `pg_cron` (limpieza de clases, digest, vigilancia) sin duplicar emisores | un solo emisor por tarea; schedule remoto distinto de `[]` sólo en producción |
| 10 | Newsletter y mail de precio: alta, renovación y baja sin borrar, con precio vigente y encabezados RFC 8058 | alta y baja de una suscripción de prueba; sin campaña masiva |
| 11 | ~~Robot de autoinscripción, enlaces personalizados y avisos a HubSpot/GitHub~~: **dados de baja el 27/10/2026**; ya no hay robot, enlace ni despacho | no aplica |
| 12 | Vigilancia y analítica: `/api/vigilancia`, `/api/alertas-analytics`, telemetría y el embudo. Conservar un vigilante remoto y uno local, sin crear otro | corrida de vigilancia con un fallo simulado y aviso recibido |
| 13 | Caché e invalidación: la revalidación on-demand de Next no existe tal cual; falta política explícita por ruta y su invalidación al publicar | publicar una carrera y verla sin deploy; medir `Cache-Control` real |
| 14 | R2: inventario y autorización propios; los assets estáticos de staging no prueban que R2 haga falta | sólo si hay objetos dinámicos o privados |

**P2 — después del corte, con su propia autorización.** Bajas de Vercel/Supabase,
facturación, limpieza y cualquier borrado de recursos. **Vercel se dio de baja el
27/10/2026**: el proyecto se cerró y `vercel.json` se retiró del repo. Queda
Supabase.

## Corte reversible, no ejecutado

La autorización de formularios staging no autoriza DNS ni publicación productiva.
Antes del corte: acordar ventana, responsables, conservación de Vercel/Supabase,
lecturas/escrituras durante transición y rollback de datos. Documentar versión
anterior y verificación posterior de rutas, formularios y aviso real.

Volver a una versión del Worker o a DNS anterior **no revierte D1 ni un efecto
externo enviado**; no restaurar un cupo ni reintentar un ambiguo por rollback.
Los cupos y las filas de ensayo de staging no son datos para producción y no se
copian.

## Rollback por pieza (local, sin ejecutar)

- **Worker:** cada deploy de staging deja versión y deployment previos; volver a
  una versión anterior es un cambio de tráfico, no de datos.
- **D1:** Time Travel no sustituye una copia externa. Un rollback de datos exige
  exportar y reconciliar lo escrito después, nunca pisar filas nuevas.
- **Variables:** apagar banderas (`STAGING_*`, `OUTBOUND_MODE`) deshabilita rutas
  sin tocar código; en producción las banderas de ensayo no deben existir.
- **Efectos:** un ambiguo no se reintenta solo; un enviado no se deshace.
- **Dominio:** los registros anteriores quedaron anotados en
  `.local/produccion/dns-antes-del-corte.json`. Vercel ya no es el retorno: el
  proyecto se dio de baja el 27/10/2026 y `vercel.json` se retiró del repo.

## Base productiva creada y verificada (26/10/2026)

**P0 #1 hecho, sin tocar el sitio publicado**: se creó una D1 nueva y exclusiva
(`cau-produccion`), aparte de la de staging, se aplicaron las migraciones
`0001`–`0010` y se importó el snapshot público verificado.

- Importación del mismo lote que usó staging: **93 carreras, 7 materias,
  12 novedades, 0 FAQ**.
- Verificación contra el snapshot: **huellas idénticas** en las cuatro tablas
  (`carreras 95927c47…`, `materias c02ad251…`, `novedades e2b93afe…`,
  `faq 4f53cda1…`), `PRAGMA foreign_key_check` vacío y **0 triggers**.
- Las doce tablas privadas quedaron en **0**; no se trasladó historial, precios,
  leads ni contactos de FAQ.
- El SQL de importación se generó desde el snapshot con un script privado
  (`.local/produccion/`, permisos 0600) y se aplicó en un único lote. No contiene
  datos privados.

Lo que sigue sin existir en esta base, y por eso no habilita el corte: precios
privados vigentes, captcha del dominio real, secretos productivos, colas/cron y
la capa de ensayo retirada. Tampoco se creó ningún Worker de producción ni se
tocó DNS.

## Precios vigentes publicados (26/10/2026)

Se publicaron en la base productiva las **16 carreras de Teclab** que el pipeline
comercial ya tenía resueltas, reutilizando sus funciones puras
(`planificar`, `emparejarCarreras` de `herramientas/ventas/publicar-precios.mjs`):
16 con precio, 16 vigentes esa fecha, 0 vencidas y **0 sin emparejar**. El script
privado (`.local/produccion/publicar-precios.mjs`) sólo imprime nombres, conteos
y fechas, nunca importes.

**Aviso:** la vigencia de esas 16 filas es **2026-10-26**, el mismo día de la
carga. Eso es lo esperado: los precios de Teclab se actualizan con frecuencia
(habitualmente a diario, no siempre) desde el pipeline comercial
(`carreras/teclab/carreras-externas.json`), y «Ver precio» deja de cotizar cuando
la fila vence. No se inventó ni extendió ninguna vigencia.

**Consecuencia para la migración:** hoy esa actualización escribe en Supabase con
el rol `cau_editor` (`herramientas/ventas/publicar-precios.mjs`). Después del
corte tiene que apuntar a la D1 de producción. Queda como pendiente propio, no
como parte del corte de DNS.

**Consecuencia para la migración:** hoy esa actualización diaria escribe en
Supabase con el rol `cau_editor` (`herramientas/ventas/publicar-precios.mjs`).
Después del corte tiene que apuntar a la D1 de producción. Queda como pendiente
propio, no como parte del corte de DNS.

Sigue sin trasladarse nada más: ni precios de otras casas, ni descuentos, ni
`precios_meta`.

## Captcha del dominio real: widget nuevo (26/10/2026)

Se creó un widget de Turnstile **nuevo** y exclusivo para producción, sin tocar
el que ya usa el sitio (que quedó intacto y sigue resolviendo el captcha actual).

- Nombre: `cau-produccion-20261026`, modo *managed*.
- Dominios: `siglo21sur.com` y **`www.siglo21sur.com`**.
- Site key (pública): `0x4AAAAAAFncCnVXxSdGTsIO`.

**Por qué un widget nuevo y con `www`:** el widget productivo existente sólo
declara el dominio ápice. La verificación del sitio compara el `hostname`
devuelto y el sitio se sirve en `www`, así que con esa lista la comprobación
fallaría en el Worker nuevo. Reutilizar el widget viejo habría exigido editarlo.

El **secreto** de este widget no se guardó en ningún archivo ni se registró en la
documentación: se obtiene al momento de cargarlo como secreto del Worker de
producción (nunca por el chat). Falta ese paso, que pertenece al armado del
Worker de producción, todavía no desplegado.

## Worker de producción desplegado, sin DNS (26/10/2026)

Entry `produccion/worker.ts`: el de Astro tal cual, **sin capa de ensayo** (ni
Basic auth, ni `noindex` global, ni robots cerrado, ni lista blanca de correo).
Deliberadamente sin `queue` ni `scheduled`: los ejecutores reales del outbox y
los programados son otra etapa; mientras no existan las intenciones quedan
pendientes y `triggers.crons` va vacío.

- Worker `cau-produccion-20261026`, dirección temporal
  `https://cau-produccion-20261026.kiamchomi.workers.dev`.
- Bindings: `DB` → `cau-produccion`, `APP_STAGE`/`DB_STAGE` = `produccion`,
  `DB_NAME` = `cau-produccion`, `TURNSTILE_EXPECTED_HOSTNAME` =
  `www.siglo21sur.com`, `PUBLIC_TURNSTILE_SITE_KEY` = la del widget nuevo.
- `resolverDb` se amplió con una rama de producción **exacta**: exige etiqueta
  `produccion` y nombre `cau-produccion`, y sigue rechazando cualquier binding de
  staging, de desarrollo o con otro nombre. Hay regresión en
  `tests/staging-local.test.mjs`.

**Protección de la dirección temporal:** sólo en `*.workers.dev` se agrega
`X-Robots-Tag: noindex, nofollow` y un `robots.txt` cerrado, para que esa copia no
compita con el sitio publicado mientras el dominio siga apuntando a Vercel.

**Verificado por HTTP:** `/`, `/contacto`, `/clases-apoyo`, `/faq` y
`/sitemap.xml` responden 200; `/carreras` redirige 308 a `/`. La canónica del HTML
es `https://www.siglo21sur.com`, el título se renderiza y el sitemap lista 123
URLs apuntando al dominio real.

**Pendiente y no resuelto acá:** el secreto de Turnstile todavía no está cargado
como binding (sin él los formularios fallan cerrado con 503), las respuestas HTML
salen con `Cache-Control: no-store` (falta definir la política de caché del
corte), el sitemap tiene 123 URLs frente a las 115 del sitio actual (hay que
explicar la diferencia antes de publicar) y no hay colas ni crons productivos.
El dominio, el DNS y Vercel siguen intactos.

### Corrección y avance (mismo día)

- **El sitemap coincide:** hoy el sitio publicado también lista **123 URLs**, y el
  conjunto es **idéntico** (0 sólo en uno, 0 sólo en el otro). La cifra de 115 era
  vieja; no hay diferencia que explicar.
- **Secreto de Turnstile cargado** como binding del Worker (transferido por puente
  loopback y tubería; nunca impreso ni dejado en archivo: la copia temporal se
  borró). Con el secreto puesto, un POST con token inválido responde **403
  `CAPTCHA inválido`** en vez del 503 de «sin configurar», y `/contacto` sirve el
  `<meta name="turnstile-site-key">`.
- **Caché de HTML alineada:** el paquete deja `no-store` por defecto, que es lo
  correcto para el ensayo. En producción, el HTML público de lectura (200,
  `text/html`, fuera de `/api` y `/inscripcion`) pasa a
  `public, max-age=0, must-revalidate`, exactamente lo que hoy responde Next. Las
  APIs siguen `no-store`.

**Límite honesto:** el desafío real de captcha **no se puede probar en
`*.workers.dev`**, porque la verificación compara el `hostname` y el widget sólo
admite `siglo21sur.com` y `www.siglo21sur.com`. Esa prueba —token real de un solo
uso, `hostname` y `action` correctos— pertenece a la ventana de corte.

## Colas productivas y ejecutores (26/10/2026)

- Colas creadas: `cau-efectos` y `cau-efectos-dlq`. El Worker de producción declara
  el productor (`EFECTOS`) y un consumidor con lote 10, reintento 3 y derivación a
  la cola de fallos.
- `src/operativa/produccion.ts` arma **sólo** los transportes cuyas credenciales
  existen; un canal sin credencial no se inventa y la intención queda **pendiente**
  en el outbox. La operativa exige `APP_STAGE=produccion`, base y nombre de cola
  autorizado.
- `bindingCola()` ahora también encola en producción; staging sigue sin cola.
- El `scheduled` está implementado con guarda de cron, pero `triggers.crons` sigue
  **vacío**: los programados (limpieza de clases, digest, vigilancia) son la etapa
  que falta y no se activan solos.
- Pruebas nuevas `tests/produccion-operativa.test.mjs` (4) dentro de
  `test:staging-protegido`; tipos sin errores.

**Sin secretos de canal cargados**, el consumidor recibe y deja cada intención
pendiente; no hay envíos. Verificado tras el deploy: home y `/contacto` 200 con la
caché alineada, un POST inválido sigue dando 403, y las dos colas existen con 0
mensajes en vuelo.

## Programados: implementados y sin activar (26/10/2026)

Los crons reales de hoy son cuatro: vigilancia cada 6 h, newsletter diaria,
recordatorio de Teclab los lunes y el resumen de clics a las 09:00 ART. El quinto
(`limpiar-clases-pasadas`) apunta a una tabla que no existe y no se traslada.

- `src/operativa/produccion.ts` despacha **por la expresión** declarada en
  `triggers.crons` y falla ante una desconocida. Reutiliza los handlers vigentes
  (`manejarVigilancia`, `manejarNewsletter`, `manejarRecordatorio`) con el mismo
  `CRON_SECRET`: sin secreto responden **503** y no corren.
- `triggers.crons` sigue en **`[]`**: nada de esto se ejecuta todavía.
- **Aviso para el corte:** mientras los crons de Vercel y el `pg_cron` de Supabase
  sigan activos, habilitarlos acá duplicaría envíos (dos newsletter, dos avisos).
  El cambio tiene que ser simultáneo y con los emisores viejos apagados.
- **Falta el resumen diario de clics** (`digest-clicks`): produce números que se
  avisan a Telegram, así que hay que leer su contrato antes de reescribirlo. No se
  inventó ni se declaró ese cron.

Pruebas: `tests/produccion-operativa.test.mjs` **5/5** (configuración por canal,
etapa obligatoria, cola autorizada, despacho por expresión y fallo cerrado sin
secreto). Deploy verificado: home 200 con la caché alineada y `crons` vacío.

### Resumen diario de clics (mismo día)

Se reimplementó el contrato de `digest-clicks` en `src/operativa/digest.ts`, sin
cambiar el texto que se avisa: encabezado `📊 *Resumen del dd/mm/aaaa*`, total,
top 10 con medallas, escape de Markdown, `_y N carreras más_`, y un segundo
mensaje `📊 *Aperturas directas…*` sólo si hubo aperturas directas.

- La fecha por defecto es **ayer en Buenos Aires** (`fechaArgentina(-1)`), no el
  día UTC: el cron corre a las 09:00 y con el día en curso se perdía la noche.
- Lee `career_clicks` de D1 por `fecha` y `origen` (`modal` / `directa`), que ya
  tiene índice para eso.
- **«Usuarios activos» no se reimplementó:** venía de Vercel Analytics y esa
  fuente desaparece al dejar Vercel. Queda como dato opcional que sólo se envía si
  hay un lector configurado; no se inventó una cifra.
- El cron `0 12 * * *` está declarado en `CRONES` pero `triggers.crons` sigue
  **vacío**, igual que el resto de los programados.

Pruebas: `tests/produccion-operativa.test.mjs` **9/9** (texto con cero, una y doce
carreras, escape de Markdown, directas, fecha argentina y fallo cerrado sin base o
sin canal). Deploy verificado con home 200 y `crons` vacío.

## Secretos de canal cargados (26/10/2026)

Cargados en el Worker de producción, por tubería desde fuentes locales y sin
imprimir valores: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (filtrados de
`.env.local`), `SMTP2GO_API_KEY` (archivo privado existente) y `CRON_SECRET`
(generado nuevo para Cloudflare; el de Vercel no se toca).

`secret list` confirma los cinco, incluido `TURNSTILE_SECRET_KEY`. Tras la carga:
home 200 y un POST inválido de formularios sigue respondiendo **403**, así que no
se habilitó ningún envío por tener credenciales.

**Importante:** tener los secretos no enciende nada. Las colas consumen, pero los
crons siguen en `[]` y ningún programado corre hasta que se active el disparador.
La primera activación tiene que ser simultánea con el apagado de Vercel y
`pg_cron`, o se duplican los avisos.

## Visitantes: lector de Cloudflare Web Analytics (26/10/2026)

Cloudflare Web Analytics ya estaba activo para la zona con **instalación
automática**, así que el beacon aparece solo cuando el dominio pase por Cloudflare;
no se agregó script al sitio ni se tocó la CSP.

- `src/operativa/analytics.ts` consulta la API GraphQL (`rumPageloadEventsAdaptiveGroups`)
  con ventana `date_geq`/`date_leq` explícita: sin ella la API rechaza la consulta
  por rango demasiado amplio. Devuelve `null` si no hay datos o falla, nunca un
  cero inventado.
- Se cargó `CF_ANALYTICS_TOKEN` como secreto del Worker y `CF_ACCOUNT_TAG` /
  `CF_RUM_SITE_TAG` como variables. El token local se borró después de subirlo.
- El resumen diario usa ese lector **sólo si está configurado**; con cero días de
  datos la línea no se envía.

**Estado real de la cifra:** la consulta funciona pero devuelve **cero días**,
porque el sitio sigue servido desde Vercel y no pasa por Cloudflare. Los números
van a empezar a existir después del corte, sin cambios adicionales.

Pruebas: `tests/produccion-operativa.test.mjs` **10/10** (sin token, fecha
inválida, sin datos, con datos, caída de red y forma de la consulta).
