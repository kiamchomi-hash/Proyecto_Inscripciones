# Base Cloudflare local

**Estado vigente (26/10 22:51 UTC): ensayo CERRADO después del envío humano.**
D1 confirma una consulta nueva, captcha aceptado por el contrato del servidor,
un `aviso-lead` **pendiente, no enviado**, y cupo humano consumido en 1. Reservas
históricas de correo 1/1 intactas. Cierre HTTP **13/13** más `envios:false`;
contacto sin action/sitekey, formularios/correo/newsletter/recordatorio 503,
Basic/noindex/no-store, cron `[]`, sin colas ni SMTP. Versión `8c67db22…`,
deployment `f073edfc…`. No reenviar ni resetear cupos; el aviso real requiere
autorización propia. Detalle en [STAGING-PREPARACION.md](STAGING-PREPARACION.md).

**Antecedente (26/10, ensayo de formulario CERRADO):** el motivo de un rechazo
del ensayo ya no se oculta bajo el error genérico: el servidor devuelve
`campo-fuera-de-ensayo` + campo (o `token-faltante`, `cupo-ensayo-agotado`, etc.) y
la UI lo muestra con `role="alert"` **sólo** con el `<meta name="formularios-detalle">`
que inyecta el wrapper de staging con la bandera encendida; en producción el texto
no cambia. Los textos se comparan recortados, sin ampliar los valores admitidos.
Check **284/284, exit 0**; versión 20 / deployment `858286ca…` con el ensayo
cerrado y cierre remoto **13/13** (form 503, cron `[]`, sin colas, SMTP ausente,
D1 sin consultas y reservas de correo 1/1). Detalle en
[STAGING-PREPARACION.md](STAGING-PREPARACION.md).

**Estado vigente del ensayo de formulario (26/10):** la ruta `/contacto` se publicó
sólo en staging con captcha real, persistencia y outbox normales, se probaron los
negativos remotos y se volvió a cerrar. **No se obtuvo token de Turnstile**: el
widget muestra el desafío pero no lo resuelve en este entorno (headless, Chrome real,
con y sin la CSP del wrapper), así que **no hubo 201 remoto ni fila en D1**; el
recorrido 201 + `aviso-lead` pendiente está probado en workerd con el captcha
interceptado. Check completo **282/282, exit 0**. Cierre remoto **13/13**, cron
`[]`, sin colas, D1 sin consultas y las dos reservas históricas de correo intactas
(1/1). El paquete se actualizó además al criterio del commit `b90fb95` del sitio
(fichas de Identidad Argentina otra vez indexables). Detalle, evidencia y límites
en [STAGING-PREPARACION.md](STAGING-PREPARACION.md) e inventario sólo local en
[PRODUCCION-PREPARACION.md](PRODUCCION-PREPARACION.md).

**Nuevo subalcance en preparación:** `/contacto` de staging, captcha real y
persistencia/outbox normales, con allowlist de prueba y presupuesto durable uno.
Widget Turnstile exclusivo creado, sin tocar producción; escritura sigue cerrada
mientras se verifica el artefacto. Aviso real de consulta es Telegram y no está
autorizado: sólo puede quedar pendiente, nunca simularse enviado. Correo anterior
confirmado recibido por el usuario; sus dos reservas se conservan. Estado en
[STAGING-PREPARACION.md](STAGING-PREPARACION.md) e inventario operativo **sólo
local** en [PRODUCCION-PREPARACION.md](PRODUCCION-PREPARACION.md).

**Nuevo ensayo autorizado, final:** corrección publicada sólo en staging; **un
intento, un accepted SMTP2GO (HTTP 200), sin entrega al buzón confirmada**. ID fijo
servidor `autorizado-20261026-02`, cupo uno; reserva histórica ambigua intacta y
nueva reserva consumida. Total histórico dos intentos, no tres. Check completo
nuevo **274/274, exit 0**, guardas staging **18/18**, negativos remotos **12/12**,
cierre **8/8**: bandera `no`, SMTP retirado del Worker, `envios:false`, cron `[]`,
sin colas, Basic/noindex/no-store y otros formularios bloqueados. D1 reservas
histórica/nueva en 1/1 cada una, outbox/consultas cero. Evidencia privada
`ensayo-02-*.json`; sin commit/push ni cambios ajenos. Estado y resultado en
[STAGING-PREPARACION.md](STAGING-PREPARACION.md).

**Causa técnica reproducida:** workerd rechaza `redirect:'error'` antes del
transporte; el bundle publicado contiene esa opción. Corregido **sólo localmente**
a `manual` con rechazo de 3xx sin seguir Location. Regresión del entry real con
proveedor simulado: **16/17 antes, 17/17 después**. Check completo nuevo final:
**273/273, exit 0**, sin fallos/cancelaciones/skips.
Sin deploy ni otro envío. Staging sigue cerrado, SMTP ausente, cron `[]`, sin
colas y cupo remoto consumido en 1. El histórico ambiguo no se reinicia ni repite.
Detalle y límites en [STAGING-PREPARACION.md](STAGING-PREPARACION.md).

**Resultado vigente del único despacho:** dominio confirmado Verified por el
usuario; un POST real desde Worker staging devolvió **502 ambiguo (`TypeError`)**.
**1 intento, 0 aceptaciones/entregas confirmadas, 1 ambiguo. No reenviar.**
D1 conserva una reserva con `request_count=1`, outbox/consultas cero; no reiniciar
cupo. Cierre remoto **8/8**, bandera `no`, SMTP retirado del Worker, cron `[]`,
sin colas, Basic/noindex/no-store y otros formularios bloqueados. Evidencia privada
`envio-unico-*.json` y detalle en [STAGING-PREPARACION.md](STAGING-PREPARACION.md).
Sin cambios de código del paquete ni nuevo check completo. Las secciones
siguientes registran estados históricos, no habilitan un segundo intento.

**Última copia de API key, 26/10 12:18 UTC:** lectura oficial `domain/view`
respondió **400 `ENDPOINT_PERMISSION_DENIED`**, no error de formato. Falta acceso
autorizado al estado del remitente para verificarlo; no se cambiaron permisos ni
credenciales y no corresponde pedir otra copia por este error. Cero intentos,
accepted, entregas confirmadas y ambiguos de envío. Cierre remoto **8/8**,
bandera `no`, SMTP ausente, cron `[]`, sin colas, D1 límites/outbox/consultas cero.
Evidencia privada `permisos-smtp-*.json`; sin código ni nuevo check completo.

**Precisión del 403:** una única lectura oficial `domain/view` con `api_key` en
JSON también respondió `INVALID_IN_PAYLOAD`. El cuerpo refiere validación de
tipo/patrón de `api_key`, no permisos ni `domain`. Revisar que el dato copiado sea
la API key existente en Sending > API Keys; no rotar ni ampliar permisos.
No se acredita clave revocada/inexistente. Staging confirmado en `no`, SMTP
ausente y cero envíos. Evidencia privada: `diagnostico-payload.json`.

**Corrección del diagnóstico de prefijo:** no es requisito documentado de
SMTP2GO; el preflight local fue demasiado estricto. Helper privado corregido,
regresiones **2/2**. Consulta oficial de sólo lectura `domain/view`: **403
`E_ApiResponseCodes.INVALID_IN_PAYLOAD`**; clave/remitente aún no verificados.
No pedir nueva carga sólo por el prefijo. Bandera remota `no`, SMTP ausente,
cero envíos y ningún cambio al paquete. Detalle en el «Diagnóstico oficial del
prefijo» de [STAGING-PREPARACION.md](STAGING-PREPARACION.md).

**Última comprobación, 26/10 12:03 UTC:** nueva entrada ASCII imprimible pero sin
el prefijo de API key esperado por el preflight local. No se consultó SMTP2GO ni
se subió secreto o habilitó correo; no es un rechazo HTTP del proveedor.
Cero intentos/accepted/entregas confirmadas, sin ambiguo de envío. Cierre remoto
**8/8**, bandera `no`, correo 503 `ruta-deshabilitada`, `envios:false`, Basic,
noindex/no-store, cron `[]`, sin colas; límites/outbox/consultas D1 en cero.
Sin cambios de código ni nuevas corridas de check. Evidencia y paso mínimo en
la sección «Nueva clave» de [STAGING-PREPARACION.md](STAGING-PREPARACION.md).

**Estado vigente, retoma 26/10:** cero intentos/accepted/entregas confirmadas;
sin envío ambiguo registrado. Clave local no utilizable como credencial HTTP,
remitente no verificable: no se cargó secreto ni se envió. Cierre remoto confirmado:
bandera `no`, POST correo 503 `ruta-deshabilitada`, `envios:false`, Basic,
noindex/no-store, cron `[]`, sin colas. D1 límites/outbox/consultas en cero, sin
reiniciar cupo. Guardas locales **16/16, exit 0**; HSTS ausente en respuestas
tempranas 401/API/asset, presente en HTML autenticado. Detalle y evidencia en la
[retoma](STAGING-PREPARACION.md#retoma-del-2610-sin-envío-y-cierre-remoto-comprobado).
Las menciones siguientes a bandera habilitada o clave como único pendiente son
históricas, no el estado actual.

Continuación de correo controlado: autorización limitada registrada, **bloqueada
por falta de `SMTP2GO_API_KEY` accesible**. Cero correos intentados/aceptados,
guardas remotas intactas, doce privadas vacías y negativos remotos **9/9**.
Contacto/FAQ/clase y recordatorio avisan por Telegram, no por correo; los mails
de precio requieren importes vigentes que no se trasladaron. Custodia de la clave
y próximo paso mínimo en
[STAGING-PREPARACION.md](STAGING-PREPARACION.md#continuación-correo-controlado-autorizado-bloqueado-antes-de-habilitar).
Segunda corrida: el bloqueo no es sólo la clave. El único correo de un
destinatario (`mail-precio`) vive detrás del outbox, que sólo consumen colas o
cron, y staging los tiene apagados; no se inventó esa ruta. Rechazo remoto de
sólo lectura **8/8**, cero correos, cuota de 3 intacta.
Tercera corrida: se agregó una ruta **exclusiva de staging**,
`POST /api/staging-correo`, detrás de la misma barrera Basic, con allowlist del
destinatario exacto, cupo durable en `form_rate_limits` (máximo 1) y dedupe
registrado antes del despacho. Quedó **desplegada y bloqueada**: sin
`SMTP2GO_API_KEY` responde 503 `smtp-sin-configurar` sin tocar D1 ni la red.
Guardas **16/16** en `npm --prefix cloudflare run test:staging-protegido`;
check completo **272/272, exit 0**; verificación remota con `no-store`/`noindex`,
cron `[]`, sin colas y cero escrituras. Falta sólo la clave, que se carga con el helper privado (nunca por
chat). Detalle y comando exacto en
[STAGING-PREPARACION.md](STAGING-PREPARACION.md#tercera-corrida-ruta-de-correo-controlado-desplegada-y-bloqueada-por-falta-de-clave).

Nueva autorización: D1/importación pública/deploy de staging protegido, sin
producción ni envíos. **Full access MCP comprobado**: D1 exclusivo creado e
importado, 93/7/12/0, cuatro huellas idénticas, doce privadas vacías, FK/triggers 0.
Protección Basic fail-closed **5/5**, artefacto exacto **15 respuestas** workerd;
Worker protegido publicado en `workers.dev`, HTTP remoto **26 auth + 121 rutas +
236 imágenes + 22 operaciones bloqueadas**, cuatro capturas remotas aprobadas.
Check completo final **261/261, exit 0**, 116 archivos sin diagnósticos; excepción
reservada `/cdn-cgi/*` explicada en el documento. URL y acceso privado, evidencia,
antecedentes y límites en
[STAGING-PREPARACION.md](STAGING-PREPARACION.md#autorización-remota-nueva-y-bloqueo-comprobado).
Las restricciones locales de las secciones históricas siguientes no niegan esta
nueva autorización; la barrera técnica permanece cerrada por el bloqueo real.

Preparación posterior a la copia pública: [STAGING-PREPARACION.md](STAGING-PREPARACION.md).
Las diez imágenes externas se comprobaron de nuevo (**10/10**, 25/10 22:14 UTC);
staging tiene una configuración **separada y bloqueada**, sin recursos ni acceso
real activados. `preparar:staging` sólo valida; no despliega ni importa datos.
La continuación local separa el wiring D1 de staging, ensaya el snapshot público
en una base efímera propia y agrega importación fail-closed con dry-run sin DB.
El entrypoint por defecto sigue vacío deny-all; no se autorizaron acceso real,
creación de D1 ni importación remotos. Comandos/evidencia en la preparación enlazada.
Check de la continuación: **256/256, exit 0**, preparación **9/9**, ensayo staging
**4/4**, 113 archivos sin diagnósticos, build/runtime aprobados.

Paquete independiente del sitio Next vigente. Prueba Astro/React configurado,
SSR en workerd, persistencia/API y Queues/cron locales. `/` replica la home
vigente —cabecera, catálogo, formularios y pie— y `/teclab`,
`/teclab/inscripcion` y `/contacto` replican sus páginas, todas leyendo el
catálogo de D1 local; `/api/carreras-detalle` sirve el texto largo de las fichas.
El lote 4C añade `/sobre-nosotros`, `/calendario-academico`, `/imagenes`,
`/test-vocacional` y `/teclab/test-vocacional`, sin rediseño. Inventario, pruebas,
capturas y límites: [seguimiento 4C](SEGUIMIENTO-4C.md).
La continuación 4D incorpora FAQ, clases de apoyo (portada y materia) y la baja
del newsletter con POST D1 local. Su verificación se registra al final del mismo
seguimiento; no amplía carreras, novedades ni sitemap.
Check final 4D: **179/179, exit 0**; SSR **14/14**, E2E **15/15**, 71 archivos
con cero diagnósticos. Capturas y límites: [continuación 4D](SEGUIMIENTO-4C.md#continuación-4d-faq-clases-y-baja-del-newsletter).
El lote 4G agrega `sitemap.xml`, `robots.txt`, los redirects de
`next.config.ts` y las cabeceras de entrega, incluidos los assets; evidencia y
límites en la [continuación 4G](SEGUIMIENTO-4C.md#continuación-4g-entrega-sitemap-robots-redirects-y-cabeceras).
La continuación 4H cierra los siete endpoints que faltaban —newsletter,
recordatorio de Teclab, las dos telemetrías de aperturas, revalidación,
vigilancia y alertas de analítica— y reemplaza el shim vacío de analítica por un
registrador local sin Vercel ni Google. Los contratos son los de Next; la
evidencia, la matriz y los límites están en la
[continuación 4H](SEGUIMIENTO-4C.md#continuación-4h-apis-pendientes-y-analítica).
El aviso original de Silkscreen se recuperó en la continuación de carreras;
se conserva con sus binarios y en `/licencias/silkscreen.txt`.
El 404 sigue vacío. `GET /api/estado` devuelve `{ "ok": true }` si el binding no
sensible `APP_STAGE` vale `local`. Sin captcha/configuración, los endpoints de
escritura fallan cerrados con 503. Los transportes externos existen con `fetch`
inyectado pero **no se conectan al entrypoint**: ningún envío ni dato real sale.
Estado actual, evaluación Free/Paid y recuperación: [OPERATIVA-LOCAL.md](OPERATIVA-LOCAL.md).
Caídas con SIGKILL, DLQ local y límite de TTL: [RECUPERACION-LOCAL.md](RECUPERACION-LOCAL.md).
Las secciones por lote que siguen registran el alcance histórico de cada incremento.

## Ejecutar desde la raíz del repositorio

```sh
npm --prefix cloudflare ci --ignore-scripts --no-audit --no-fund
npm --prefix cloudflare run check
npm --prefix cloudflare run dev
```

Node 24. El servidor local usa `127.0.0.1:4329`; no sustituye a Next.
`npm --prefix cloudflare run migrar` aplica las migraciones al D1 local de
`.wrangler/state` (nunca `--remote`): sin eso, `dev` y `preview` responden 500 en
la home porque no existen las tablas. Las migraciones **no** cargan datos: la
home queda con el catálogo vacío hasta que se inserten filas sintéticas.
`check` corre guardas, genera tipos de bindings, comprueba Astro/TypeScript,
prueba repositorios contra D1 local, compila y prueba los artefactos en workerd
mediante `createTestHarness`, y al final compara la home y las páginas migradas
contra el Next local.
`preview` sirve el último build local; ejecutar `build` antes si se cambió código.
`test:seguridad` y `test:runtime` permiten repetir cada suite; la segunda requiere
un build previo. `npm --prefix cloudflare run test:datos` ejecuta migraciones,
SQL y concurrencia en bases D1 efímeras nuevas. No hay script de publicación.
`npm --prefix cloudflare run test:control` agrega la verificación de cuotas,
contadores y actualización 2A → 2B; también corre como parte de `check`.
`test:api` prueba handlers, outbox, newsletter y upgrades hasta 0005;
`test:identidad` prueba pase Web Crypto y Turnstile con transporte simulado.
Ambos integran `check`.
`test:crons` prueba el envío semanal del newsletter (reclamo durable, siete días,
rechazo/ambigüedad), el recordatorio de Teclab y la vigilancia con transporte
doble; `test:telemetria` prueba las dos aperturas, las alertas, la revalidación y
el registrador local de analítica. Ninguno envía, audita producción ni sale a la
red. Integran `check`.
`test:materias` prueba proyecciones públicas, FK y actualización 3B → 3C. Usa
`--experimental-transform-types` porque el validador compartido contiene parameter
properties de TypeScript; Node avisa que esa transformación es experimental.
`test:recuperacion` prueba ocho escenarios con workerd/Queues/D1 locales y red
externa bloqueada; integra `check`. No usa proveedores reales. La expiración es
simulación, no una certificación del TTL de Queues.
`test:paridad` levanta el Next del sitio en loopback con un stub de PostgREST y
compara la home y las páginas migradas contra el build de Astro; en la misma
corrida prueba el contrato de `/api/carreras-detalle` sobre un D1 efímero. Nada
sale de 127.0.0.1. Integra `check`.
`test:e2e` levanta el build en `wrangler dev` y el Next del sitio en loopback, y
conduce el Chromium del Playwright de la raíz: fuentes cargadas, imágenes
renderizadas, capturas escritorio/móvil comparadas (home, Teclab y contacto),
navegación, el formulario de contacto y los tres estados de Turnstile. Los
pedidos a hosts externos se abortan. Requiere build previo, Playwright instalado
en la raíz y Chromium descargado (`npx playwright install chromium`); si falta
algo falla con la instrucción, no se saltea. Integra `check` al final. Sus tres
`wrangler dev` usan `--inspector-port 0` para no chocar en el 9229 fijo.

## Aislamiento

- Dependencias y lockfile propios; el paquete no es un workspace npm de la raíz.
  Next/ESLint/TypeScript de la raíz lo excluyen deliberadamente. Ejecutar siempre
  ambos checks: el de Next no certifica este paquete, ni viceversa.
- Usar los scripts npm, no comandos Astro/Wrangler directos: el runner fija el
  directorio y un entorno por lista permitida, con HOME/configuración de
  herramientas en `.local/`. No hereda tokens, flags Node ni variables públicas.
- No copiar `.env.local` ni crear `.env*` o `.dev.vars*` en este paquete: el runner
  los rechaza por nombre sin abrirlos. Vite tiene `envDir: false`; Wrangler tiene
  carga dotenv y herencia de variables deshabilitadas en el entorno del runner.
- Configuración sin cuenta, dominios ni recursos remotos; sólo D1/Queues/cron locales.
  `remoteBindings: false`; sesiones apagadas y servicio de imagen passthrough
  evitan bindings automáticos de KV/Images. Los futuros secretos se consumirán
  sólo en servidor/runtime, nunca interpolando el entorno completo.
- Home/API/404 llevan `noindex` y `no-store`. Estas guardas no son autenticación,
  un bloqueo de deploy universal ni certificación de paridad de seguridad.
- Artefactos, dependencias, estado local y tipos generados quedan ignorados por
  Git. No publicar `dist/`, `.wrangler/` ni `worker-configuration.d.ts` por separado.
  Los artefactos generados pueden contener rutas locales de build.

## Decisiones de versión

Astro 7.4.2, adaptador Cloudflare 14.4.2, integración React 7.1.1 y Wrangler
4.152.0, fijados junto con su lockfile. El entrypoint de configuración es
`@astrojs/cloudflare/entrypoints/server`, como indica la documentación actual del
adaptador; **no** `dist/_worker.js/index.js`, que todavía aparece en la guía
general de Cloudflare. El build genera `dist/server/wrangler.json`, usado sólo
por las pruebas locales. `unstable_dev` está deprecado: se usa el harness actual.

## D1 local: alcance 2A

`migrations/0001.sql` crea sólo `carreras` (23 campos), `precios_privados` y
`reservas_mail_precio`, con tablas STRICT, JSON como TEXT validado, booleanos 0/1,
IDs seguros de JavaScript, claves únicas y FK con cascade. Los defaults son del
esquema destino local: todavía no se cotejaron contra el catálogo remoto real.
Fechas de vigencia siguen como `AAAA-MM-DD`; reservas como UTC ISO de milisegundos.
La futura importación deberá normalizar la precisión y comprobar IDs/tamaños.

`src/datos/repositorio.ts` comparte taxonomía/proyección de catálogo y tipos puros
del sitio actual, sin importar clientes Supabase. Filtra inactivas y niveles fuera
de oferta; Identidad se conserva aquí, pues su exclusión de la home es específica
de esa página. La lectura privada del precio no autoriza entregarlo al público:
vigencia, casa, consentimiento y lead siguen siendo trabajo de la API futura.

La reserva normaliza correo y limita una misma clave correo/carrera por 168 horas.
Lee el reloj de D1 y lo liga al UPSERT condicional, que decide atómicamente en una
sentencia; no hace SELECT previo de la reserva. Un rechazo no renueva el plazo.
No hay reloj ni plazo recibidos del navegador, ni envío/liberación automática de
correo. Los tests de frontera ligan instantes sintéticos al mismo SQL exportado;
la función real usa el reloj de base. Esto no es entrega exactamente una vez.

El harness usa un identificador ficticio y `remote: false` sólo en su configuración
en memoria. Aplica migraciones desde cero mediante `applyD1Migrations`, y prueba
reaplicación por historial, rollback de batch y solicitudes concurrentes reales
contra el binding SQLite de D1/workerd. Los repositorios puros se invocan desde
Node 24 con ese binding; no son mocks SQL. El Worker del harness está en fixtures,
escucha sólo loopback y no se incorpora al build Astro.

El sitio sigue sin binding DB en `wrangler.json`, no tiene endpoints de datos,
y no expone precios ni filas. No hay RLS/roles de PostgreSQL en D1: se probaron
proyecciones y restricciones SQL, **no** autorización HTTP todavía. El lote 2A no
incluyó detalle de fichas, otras tablas ni controles de infraestructura; rate limit
y contadores se cubren en 2B, y enlaces/robot en 2C abajo.

## D1 local: alcance 2B

`migrations/0002.sql` añade `form_rate_limits` y `career_clicks`, sin modificar
0001 ni el binding del sitio. La actualización se ensaya aplicando 0001 en una
base efímera con catálogo/precio/reserva sintéticos, incorporando 0002 y volviendo
a aplicar el historial: datos conservados y dos migraciones registradas.

`src/datos/control.ts` reconstruye las dos RPC versionadas y los parámetros de
sus consumidores. `reloj.ts` comparte el reloj D1 con la reserva del lote 2A.

| Consumidor | Clave (digest = SHA-256 hexadecimal de IP) | Máximo / ventana |
|---|---|---|
| Formularios | `kind:digest`, seis kinds actuales | 5 / 600 s |
| Alertas WhatsApp, clases y fallo | `analytics-alert:evento:digest` | 5 / 600 s |
| Alertas intento y abandono | `analytics-alert:evento:digest` | 12 / 600 s |
| Apertura modal | `click:digest` | 60 / 600 s |
| Apertura directa | `direct-open:digest` | 20 / 600 s |

Ventana fija: vence sólo cuando `window_started_at < ahora - ventana`, no a
igualdad. Un rechazo de cupo no incrementa ni desplaza la ventana. La expiración
es lógica: no hay TTL ni borrado automático nuevos. Las claves no se normalizan
ni se mezclan entre eventos/kinds. Los helpers reciben la IP ya determinada por
el adaptador; todavía no se decidió ni implementó cómo confiar en cabeceras de
Cloudflare. No trasladar ciegamente `x-forwarded-for` al futuro endpoint.

La RPC original no exige parámetros positivos: la primera fila concede incluso
con máximo cero/negativo; máximo null no corta, ventana null no vence y ventana
negativa reinicia. Se conservan esas peculiaridades, sin convertirlas en cuotas
públicas nuevas. Los consumidores usan exclusivamente los máximos positivos de
la tabla. Parámetros integer/int32 inválidos fallan antes de escribir; errores
reales D1 se propagan, no se interpretan como permiso.

Cada decisión/incremento usa un UPSERT atómico. Cupo y contador son escrituras
**separadas**, como las RPC originales: si falla el contador no se reembolsa el
intento. El puerto de formulario espera captcha y cupo, incluso ante rechazo o
excepción del captcha; no implementa Turnstile real. Validación del sobre/config/
demo antes de consumir y validación del payload después siguen pendientes en el
handler futuro. El test de fallo posterior comprueba que no hay devolución de
cupo; no acredita todavía el flujo HTTP completo.

Los contadores agregan por fecha argentina IANA, **texto** de carrera y origen
`modal`/`directa`, sin FK al catálogo ni identificación de la persona. El lector
devuelve `{carrera, clicks}` por fecha/origen ordenado por cantidad descendente,
como el digest vigente. La RPC no recorta texto: los 200 caracteres y trim se
aplican en el helper de apertura, antes del cupo, como en las rutas actuales.
Los agregados conservan rango int32: un overflow falla sin perder el valor previo.
La fecha se proporciona desde el reloj de base convertido con Intl; no se
promete el default PostgreSQL al insertar directamente en la tabla SQLite.

Pruebas reales D1: 24 solicitudes sobre cupo 5, 24 aperturas directas con máximo
20, 32 incrementos sin lost updates, frontera estricta y reinicio concurrente,
claves independientes, fallos posteriores e inválidos. Los instantes exactos se
ligan al mismo SQL; las funciones normales leen D1, nunca un reloj del cliente.
Se conserva precisión local UTC de milisegundos; no equivale a probar redondeo de
timestamps PostgreSQL importados ni concurrencia/replicación de una base remota.

## D1 local: alcance 2C

`migrations/0003.sql` incorpora `consultas` con los 34 campos declarados en los
tipos actuales, `enlaces_inscripcion` y `robot_autoinscripciones`. Consultas es
soporte de FK/lectura del legajo: no se migró su API de escritura, triggers,
newsletter ni notificaciones. Defaults/validación completa de esa tabla siguen
sujetos al inventario real antes de cualquier importación; los fixtures no lo
sustituyen. No se alteraron 0001/0002 ni se añadieron bindings al sitio.
**`0011_quitar_autoinscripcion.sql` borra las dos tablas de enlaces y robot: la
autoinscripción de Teclab se dio de baja el 27/10/2026.** Las descripciones de
enlaces y robot que siguen son historia del bloque 2C, no estado actual.

Enlaces: se reutilizan los validadores puros de `casas.ts` y `nuevoCodigo` de la
función existente (sin llamar a sus helpers de red). Código alfanumérico 22–64,
generación de 32 caracteres y 7 días de vigencia. A igualdad vence; usado prevalece
sobre vencido. Antes de reservar se verifica consulta Teclab/preinscripción,
carrera admitida y legajo con el helper vigente. No se agregó un filtro `activa`
que el handler original no tiene. El UPDATE revalida fecha y usado-null junto al
CAS: un solo ganador por código hasta una compensación explícita.

`liberarEnlace` reproduce la compensación del handler tras fallo local confirmado.
**No es un lease ni protege de una liberación tardía**. No usarla ante resultado
externo ambiguo. Se comprobó rollback de reserva + sentencia fallida en un batch,
pero aún no existe la transacción completa de consumo + nueva autoinscripción +
outbox. Esa integración queda para bloque 3. Varios códigos pueden apuntar a la
misma consulta, como hoy; no hay deduplicación por persona.

Robot: unicidad por `consulta_id`; reenqueuar devuelve el id existente sin cambiar
estado/contador ni despachar nada. Sólo `pendiente`, `error`, `cargada`; barrido
ascendente de 20 pendientes y lectura puntual de pendiente/error. Un error se
reintenta por id; no se incluyeron errores en el barrido ni se impuso un máximo
de reintentos. Los ids y detalle se normalizan con los helpers originales
(texto id de hasta 15 dígitos; detalle trim/slice de 300). Error incrementa
`intentos`; éxito no lo incrementa. Un reporte de error repetido vuelve a contar,
no se inventó un identificador de entrega que lo haga idempotente.

El UPDATE del resultado incrementa en SQL y condiciona a no-cargada: evita lost
updates y mantiene cargada terminal bajo concurrencia. Esto refuerza la intención
del handler actual, cuyo SELECT + UPDATE separado no prueba esa atomicidad.
Los resultados internos `aplicado`/`ya-cargada`/`inexistente` no son estados nuevos
de la cola; el mapeo HTTP queda pendiente. Un segundo reporte sobre cargada no
cambia nada y será el conflicto que ya contempla la API actual.

**Leer una tarea no la reclama**: dos lectores pueden obtener el mismo legajo.
No se añadió procesando, claim, lease ni garantía de ejecución externa única.
Una fila por consulta no evita que el portal/GitHub procese dos veces, ni une dos
consultas de la misma persona. No se trasladó ni activó el robot privado real.

Pruebas D1: migraciones desde cero y upgrades desde 2A/2B con datos preservados,
FK/cascade, códigos/fechas, 16 consumos con un ganador, 16 encolados con una fila,
24 errores sin perder incrementos, cargada terminal en reportes concurrentes,
overflow/error real y rollback. Sin SMTP, Telegram, HubSpot, GitHub ni datos reales.

## API local: alcance 3A y 3B

`0004.sql` agrega el outbox durable; `0005.sql`, FAQ, solicitudes de clases y
newsletter. Los handlers de formularios y robot conservan validación, cuotas y
autenticación. El consumo del enlace, la nueva consulta y sus efectos forman un
único batch: una solicitud perdedora no deja filas; un error revierte todo.
FAQ y clases también guardan fila y efectos atómicamente. Los arrays de días y
horarios se serializan como JSON antes de enviarse a D1.

El outbox conserva intención sin datos personales, intento previo al transporte
y estados pendiente/enviado/error/ambiguo/omitido. Enviado es terminal; ambiguo
no se reintenta automáticamente y error requiere reintento explícito. No hay
claim ni lease: no garantiza un único envío externo bajo barridos concurrentes.
Los transportes están inyectados y se prueban sin red; sin transporte, la intención
sigue pendiente. Newsletter tiene un consumidor interno D1, alta general o por
carrera, renovación y baja sin borrar.

Turnstile tiene adaptador con timeout de 8 segundos y validación de hostname;
las pruebas simulan siteverify. El pase HMAC usa Web Crypto y se comprueba contra
el emisor vigente de Node. Demo sólo se habilita con `APP_STAGE=local` y
`FORMULARIOS_DEMO=1`: valida los seis kinds sin base, cuotas ni efectos.
Estas variables no se deben agregar a archivos de entorno del paquete.

Verificación de cierre 3B repetida el 24/10/2026: check Cloudflare 86/86 sin skips,
tipos sin errores/advertencias/hints y build/runtime aprobados; check Next 542/542,
con las 20 advertencias de ESLint y el aviso React de `prefetch` preexistentes.
Las primeras corridas se cortaron por timeout de la herramienta a 120 segundos;
las repeticiones completas por separado aprobaron sin modificar código.

## Materias locales: alcance 3C

`0006.sql` crea `materias` con los 17 campos de los tipos versionados. Las
colecciones se guardan como JSON TEXT y los booleanos como 0/1; el repositorio
`src/datos/materias.ts` convierte ambos y reutiliza las proyecciones/validadores
de `lib/datos/materia.ts`. Lista sólo activas, conserva las próximas/en construcción
y ofrece card, navegación y ficha por slug parametrizado. Un JSON de forma
incorrecta se rechaza: no se oculta como lista vacía ni materia inexistente.
No se conectaron las lecturas a páginas ni se trasladó UI.

`0007.sql` reconstruye `solicitudes_clase` con FK real a materias y también el
outbox hijo: borrar la tabla vieja sin copiar el hijo perdería sus avisos por
cascade. Se conservan filas, ids, estados, índices y el máximo histórico de la
secuencia, incluso cuando ese id ya fue borrado. No se apaga integridad.
La FK usa NO ACTION provisionalmente: los tipos no informan la acción de borrado
remota, y el cascade del SQL histórico de `clases_apoyo` no prueba la acción de
`solicitudes_clase`. Debe cotejarse junto con los defaults antes de datos reales.

Si una base local 3B ya tiene solicitudes, se aplica primero 0006, se cargan sus
materias sintéticas y recién se aplica 0007. Con huérfanas, 0007 aborta sin perder
filas ni registrar la migración como aplicada. No se crean padres ficticios ni se
eliminan solicitudes para hacer pasar la actualización.

Check 3C: 92/92 Cloudflare sin fallos/skips, tipos sin errores/advertencias/hints y
build/runtime aprobados; Next 542/542 con los avisos preexistentes. La solicitud
mixta con una materia inexistente devuelve 500, no escribe filas/avisos parciales
y conserva el intento de cuota, sin ampliar la validación pública del handler.

## Transportes y cola local: alcance 3D

`src/operativa/transportes.ts` implementa los cuatro adaptadores HTTP sin leer
variables de entorno ni usar el `fetch` global: reciben la configuración y un
`buscar` inyectados, así que las pruebas no salen a la red y ningún test manda un
aviso, un mail o un despacho real. Los textos no se copiaron: el aviso de consulta,
pregunta y clase sale de `src/operativa/mensajes.ts`; el mail de
precio, de `armarMailPrecio`; el despacho y el aviso de error del robot, de
`casas.ts`. Los cuatro usan `AbortSignal.timeout` (8 s Telegram y SMTP2GO, 5 s
HubSpot y GitHub).

| Proveedor | Contrato | Éxito | Rechazo conocido | Ambiguo |
|---|---|---|---|---|
| Telegram | `sendMessage`, `parse_mode: Markdown` salvo el aviso de error de robot | 2xx | no-2xx (`http-<código>`) y `fila-inexistente` | excepción de red o timeout |
| SMTP2GO | `v3/email/send` con `X-Smtp2go-Api-Key` | `succeeded ≥ 1` y `failed = 0` | no-2xx con `error_code`, `failed > 0`, `succeeded = 0` | cuerpo ilegible o excepción |
| HubSpot | URL y cuerpo ya armados por `pedidoLeadSede` | 2xx | no-2xx | excepción |
| GitHub | `dispatches` con `client_payload.id` | 2xx | no-2xx | excepción |

La regla de ambigüedad es la del diseño: un no-2xx es un rechazo conocido y se
puede reintentar a mano; una excepción o un timeout **después de enviar** no
permiten saber si el proveedor aceptó, así que la fila queda `ambiguo` y no se
reintenta sola. Sin la sección de configuración el transporte devuelve
`sin-configurar`, la fila sigue `pendiente` (con el intento ya persistido, porque
se registra antes de llamar) y la recupera un barrido posterior.

`src/operativa/colas.ts` es el puente con Cloudflare Queues y cron, sin conocer
el binding: recibe el productor y el lote como puertos. El mensaje lleva sólo
`{ tipo: 'efecto', id }`, nunca datos del lead; la tabla sigue siendo la única
autoridad. `publicarEfectos` es best-effort y no lanza: si la cola falla, las
filas quedan pendientes y la respuesta pública no cambia. `manejarLote` confirma
un cuerpo inválido sin reintentarlo, ignora una fila ya terminada (entrega al
menos una vez sin duplicar el envío) y reintenta con el backoff de Queues sólo el
error de base. `barridoDeEfectos` recupera lo pendiente y lo sin transporte.

`src/api/formularios.ts` publica los efectos recién escritos: los INSERT del
outbox usan `RETURNING id` dentro del mismo batch que la fila, así la cola recibe
únicamente los ids de esa alta y nunca los de una ajena. Los ids no se devuelven
al navegador. Si la publicación falla, la respuesta sigue siendo 201.

**Límite de este lote, sin resolver acá:** el adaptador de Astro sólo exporta
`fetch`, así que no hay entrypoint con `queue`/`scheduled` ni bindings de Queues o
cron declarados. `wrangler.json` sigue sin colas, sin crons, sin R2 y sin recursos
remotos; conectar el productor y el consumidor reales es infraestructura del
bloque 6, con autorización separada. Por lo mismo, `/api/robot` no publica el
aviso de error: esa fila y `robot-encolar` quedan para el barrido. Tampoco se
reimplementaron `precio-visto` ni el enriquecimiento del enlace de
autoinscripción del aviso de consulta: las dos consultas del contrato vigente van
a Supabase por REST y quedan pendientes de decisión.

Los módulos compartidos con el sitio se importan con el alias `@/` en
`astro.config.mjs`; para las pruebas lo resuelve `tests/helpers/alias.mjs`
mediante `module.registerHooks` (sólo resolución de rutas, sin ejecutar red).
`test:envios` cubre los cuatro transportes, las dos clases de error, la publicación
y el lote; integra `check`.

Verificación de cierre 3D (24/10/2026): check Cloudflare 111/111 (92 anteriores +
19 nuevas), sin fallos, cancelaciones ni skips; tipos sin errores, advertencias ni
hints, y build/runtime en workerd aprobados. Check Next 543/543, con las mismas 20
advertencias de ESLint y el aviso React de `prefetch` preexistentes. En el D1 de
pruebas, reutilizar `?1` dos veces dentro de un mismo `VALUES` aborta por FK; los
fixtures usan parámetros distintos y el código nunca reutiliza placeholders.

## Paridad de páginas: alcance 4A (home)

`src/layouts/Sitio.astro` reproduce el `<head>` de `app/layout.tsx`: `lang="es"`,
viewport, título, descripción, keywords, author/creator, canonical, Open Graph,
Twitter, verificación de Google, iconos, `dns-prefetch` a `wa.me` y el JSON-LD
(`WebSite` + `EducationalOrganization`/`LocalBusiness`) serializado con el mismo
`jsonLdScript()`. La home usa el título absoluto y la descripción de
`app/page.tsx`, el año se calcula al renderizar y no se agregó texto nuevo.

`src/entrega/PaginaHome.tsx` es el cuerpo de `app/page.tsx` sin cambios de orden ni
de copy: `Hero`, `CareersCatalog`, los dos `FormularioLead` y `StatsCounter`. El
catálogo sale de D1 con `listarCatalogoPublico()` y la taxonomía compartida, y se
excluye `Identidad Argentina` como en la home vigente (`src/datos/home.ts`).

**Shims de Next, no bifurcaciones.** `astro.config.mjs` resuelve `next/link`,
`next/image`, `next/navigation`, `next/dynamic` y `@next/third-parties/google`
contra `src/entrega/`, y `@/lib/analytics-destino` contra el registrador local. Son deliberadamente mínimos: `<a>`,
`<img>` sin optimizador, `usePathname` por contexto (sin router de cliente),
`dynamic` con `import()` al montar y helpers de analítica sin efecto. Los
componentes del sitio siguen siendo los mismos archivos; cualquier diferencia de
comportamiento tiene que resolverse en el shim o documentarse acá.

**Hidratación.** La home es UNA isla (`<PaginaHome client:load>`) porque catálogo,
formularios y carrusel son interactivos y separarlos repetiría el catálogo en el
payload de cada isla. El navbar es otra isla (`NavbarIsla`, con la ruta por
contexto para que el enlace activo coincida entre servidor y cliente). El pie se
renderiza en el servidor: no tiene estado. Los enlaces navegan con recarga
completa: todavía no hay router de cliente ni View Transitions.
`SiteFooter` y `StatsCounter` no se hidratan.

**Assets.** `publicDir` apunta a `../public` en la raíz (35 MB ya versionados) en
lugar de copiarse al paquete: no existe `cloudflare/public` y `dist/client`
—ignorado por Git— es el único lugar donde se duplican al compilar. Las pruebas
comprueban `favicon.ico`, `icon.png`, `apple-touch-icon.png`, `.jpg`, `.webp`,
`.svg` y los `.woff2` con su Content-Type real desde el harness. Las fuentes
viven en `public/fuentes/` de la raíz (ver *CSS y fuentes*).

**Turnstile.** `src/entrega/turnstile.ts` es el montaje independiente de React y
`TurnstileWidget.tsx` la isla; `turnstile-contexto.ts` lleva al navegador la
configuración que resolvió el servidor. La site key se lee de la variable de
runtime `PUBLIC_TURNSTILE_SITE_KEY`, que `entorno-publico.ts` traduce a
`<meta name="turnstile-site-key">` y al contexto de la isla; no hay valor
literal, no se usa `NEXT_PUBLIC_*` congelado en el build y la secret key no
existe en este paquete. La variable no está en `wrangler.json` a propósito: se
provee en runtime y, sin ella, no se carga el script ni se entrega token.

Con site key, el HTML del servidor ya trae el marcador «Verificación de
seguridad» y reserva los 71 px del iframe (140 px y `size='compact'` debajo de
300 px de ancho, con redibujo al cruzar el umbral y descarte del token
anterior). El marcador se retira recién cuando el iframe dispara `load`, con tope
de 10 s, igual que el sitio. Desmontar llama a `remove` y descarta tokens
posteriores; desmontar antes de que cargue no dibuja. En modo demo —sólo con
`APP_STAGE=local` y `FORMULARIOS_DEMO=1`, el mismo gate que la API— no se pide
nada a Cloudflare y se entrega `demo` al formulario. `src/middleware.ts` mantiene
`challenges.cloudflare.com` en `script-src`, `frame-src` y `connect-src`, y
`'unsafe-inline'` por los scripts de hidratación de Astro.

Pruebas: `test:navegador` ejercita el módulo con dobles (sin DOM ni red);
`test:e2e` monta el widget real en Chromium con el `api.js` interceptado y
comprueba los tres estados, el hueco, el compacto y el token.

**Paridad reproducible.** `tests/paridad.test.mjs` levanta el build de Astro en
workerd y el Next del sitio en `next dev` sobre loopback, con un stub local de
PostgREST que aplica los mismos filtros (`activa`, `nivel neq`, orden por `orden`)
y un fixture compartido (`tests/fixtures/catalogo-home.mjs`, que también exporta
el SQL para sembrar D1 por CLI). Compara `lang`, `<title>`, canonical, 18 metas
(descripción, Open Graph, Twitter, verificación), JSON-LD (parseado y escapado
byte a byte), el texto visible completo de `<main>`, los enlaces de `main`,
navbar y footer, el código 200, y el 404 de una ruta inexistente. La home se
siembra igual en D1 y en el stub, así los conteos del catálogo coinciden.

`tests/e2e.test.mjs` agrega lo que el HTML no puede probar, con dos servidores
reales en loopback y Chromium:

- **Fuentes**: las caras declaradas (familia y peso) son las mismas que Next
  —Inter 100–900 y Unbounded 400/600/700/800/900—, `document.fonts.check` da
  cargadas las que usa la home, el ancho de una muestra de texto coincide con el
  de Next dentro de 0,5 % (si cayera al fallback, diferiría) y no se pide ningún
  `.woff2` fuera del sitio.
- **Imágenes**: compara el render, no el `srcset`: `naturalWidth/Height > 0`,
  `complete`, `alt` presente e igual en las dos puntas, proporción natural
  contra la caja (≤5 %) y caja de layout igual; falla si alguna respuesta de
  imagen es de error.
- **Capturas**: escritorio 1440×900 y móvil 390×844, DPR 1, movimiento reducido,
  PNG completo en `.local/capturas/<sello>/`. La comparación se hace con un
  canvas del propio Chromium; la tolerancia es 2 % de píxeles con algún canal a
  más de 32 y diferencia media ≤2. Última corrida: 0,004 % / media 0,005 en
  escritorio y 0,009 % / media 0,011 en móvil.
- **Navegación**: el enlace de salto se hace visible al recibir foco con Tab y
  cambia el hash; el enlace del pie a `/contacto` navega en las dos puntas. En
  Next es navegación de cliente y la ruta responde; en Astro es un pedido
  completo que hoy da 404 porque esa página no está en esta rebanada.
- **Turnstile**: sin site key no hay marcador ni script y el formulario avisa que
  falta tildar; con site key el HTML trae marcador y 71 px, monta con
  `size='flexible'`, entrega el token al formulario y al angostar a 320 px
  redibuja en compacto (140 px) descartando el widget anterior; en demo no hay
  script y el token llega igual.

Requisitos y límites del harness, para no romperlo sin querer:
- Necesita `npm --prefix cloudflare run build` previo, el Next instalado en la
  raíz, Playwright en la raíz y un Chromium descargado. Falla con mensaje
  explícito si falta cualquiera.
- No corre junto a un `next dev` del sitio: Next toma `.next/dev/lock` y los dos
  procesos pelearían por `.next`. La prueba detecta un PID vivo y aborta; un lock
  de un proceso muerto no bloquea. Cuando existe `/proc`, además confirma que ese
  PID es un `next`: un proceso recién terminado sigue como zombie unos instantes
  y, sin esa comprobación, el segundo test de paridad veía al que el primero
  acababa de matar.
- Escribe en el `.next` real del sitio (no hay `distDir` por variable de
  entorno). Es caché de desarrollo; no toca código ni build de producción.
- `next/font` necesita la caché de fuentes de `.next`; con la caché vacía y sin
  red, Next puede fallar antes de responder.
- El servidor de Astro del e2e se levanta con `wrangler dev` y no con el harness
  porque el navegador necesita un puerto real. Se siembra un D1 efímero por
  perfil en `.local/e2e-d1-*` y los servidores con site key o demo usan
  `--var`, sin escribir `.dev.vars`.
- Ni Next ni Astro piden hosts externos: la analítica es local.
- **No** se comparan: el HTML de los scripts, ni el cuerpo del 404, ni los bytes
  de CSS. Las capturas comparan el estado sin captcha (los dos servidores de la
  comparación van sin site key).

**CSS y fuentes.** El CSS compartido se procesa con Tailwind v4 usando el
`@tailwindcss/postcss` instalado en la raíz (`postcss.config.mjs`): es una
dependencia de build del sitio vigente, no del runtime, y si falta el build falla.
Los componentes migrados también arrastran dependencias de la raíz que hoy no
están en `package.json` (por ejemplo el maquetado de los modales).

`app/index.css` termina con dos `@import` después de reglas
(`components/index/modales.css` y `components/formularios/formulario-lead.css`).
Es CSS inválido: el pipeline de Astro los descarta con un aviso, así que en el
primer build faltaban el panel lateral del contacto y los estilos de los
modales. La home los importa explícitamente en `index.astro`, en el mismo orden.
Si se suman hojas por esa vía, importarlas también acá; los dos avisos de
PostCSS siguen apareciendo porque el archivo de la raíz no se toca.

Inter y Unbounded se autoalojan: `../estilos/fuentes.css` declara las mismas
familias, pesos, `unicode-range` `latin` y fallbacks que genera `next/font`, con
`font-display: swap`, y `Sitio.astro` precarga los dos `.woff2`. Los archivos
están en `public/fuentes/` de la raíz; origen, licencia OFL y cómo regenerarlos,
en `../estilos/fuentes.md`.

Verificación de cierre 4A (24/10/2026): `npm --prefix cloudflare run check` con
142/142 pruebas, sin fallos, cancelaciones ni skips; tipos sin errores,
advertencias ni hints; build y runtime en workerd aprobados; `test:paridad` 2/2 y
`test:navegador` 9/9. Los únicos avisos son los dos de PostCSS por los `@import`
al final de `app/index.css`, que ya existían en el sitio.

Cierre de las brechas de 4A (25/10/2026): `check` 156/156, sin fallos ni skips,
tipos sin errores/advertencias/hints; `test:paridad` 3/3, `test:navegador` 14/14
y `test:e2e` 8/8. Fuentes autoalojadas y verificadas por métricas, imágenes
verificadas por render, Turnstile con marcador/hueco/compacto/demo y capturas con
0,004 % (escritorio) y 0,009 % (móvil) de píxeles distintos. Las cuatro brechas
de la rebanada quedan cerradas; lo que sigue abierto es de otros lotes (ver
*Siguiente lote*).

## Paridad de páginas: alcance 4B (Teclab, contacto y detalle)

`/teclab`, `/teclab/inscripcion` y `/contacto` replican las páginas vigentes con
los mismos componentes, textos y hojas de estilo. `src/entrega/PaginaTeclab.tsx`
y `PaginaInscripcionTeclab.tsx` son el cuerpo de las dos páginas de Next —mismo
orden, mismo copy— y reciben el catálogo ya leído de D1; `PaginaContacto.tsx`
envuelve `components/contacto/contacto-page.tsx` en el contexto de Turnstile.
Las tres son una sola isla: el catálogo, los dos formularios y el formulario de
contacto son interactivos y, en el caso de contacto, el formulario vive dentro
del mismo componente que el resto de la página. `<Sitio>` acepta `og`, `twitter`,
`palabrasClave` y `titulo` ya resuelto: en Next el `openGraph` de una página
**reemplaza** el del layout (no se fusiona), así que una página que lo declara no
hereda `locale` ni `siteName`; `keywords` se une con coma y sin espacio.

`/teclab/inscripcion` no renderiza navbar ni pie en Next —`esRutaPreinscripcion`
los oculta— y acá tampoco: el navbar es una isla que recibe la ruta y el pie no
se monta. Poppins, la tipografía de marca, se autoaloja en
`../estilos/poppins.css` (importada sólo por esas dos páginas) con los tres
`.woff2` que `next/font` sirve en el sitio; `fuente-poppins` reemplaza a
`poppins.variable` y declara `--font-poppins`. Los logos, fotos y el mosaico del
hero salen de `../public` como en la home.

`/api/carreras-detalle` (`src/pages/api/carreras-detalle.ts` →
`src/api/carreras-detalle.ts` → `src/datos/detalles.ts`) devuelve el mismo mapa
`{ [id]: CarreraDetalle }`, con la misma proyección de seis columnas, el mismo
filtro de taxonomía y el mismo 502 —sin caché— ante un slide inválido. Sólo
`GET`: otro método responde 405 con `Allow: GET` en vez del 404 de Astro, y la
ruta ignora la query, como la vigente. Sin binding D1 responde 503, que es un
estado que el sitio no tiene. La proyección es explícita: ni `descuento_especial`
ni `precios_privados` salen de la consulta.

Límite conocido de esta rebanada: el middleware local pisa `Cache-Control` con
`no-store` en toda respuesta (guarda del paquete no publicado), así que el
`s-maxage=86400, stale-while-revalidate=604800` que declara el handler no llega
al cliente. La prueba lo verifica llamando al handler puro; en producción la
política de caché sigue siendo una decisión del bloque 6.

`/contacto` usa el mismo componente de formulario, las mismas validaciones de
cliente y el mismo `POST /api/formularios` del paquete (kinds `consulta`, cuota y
capa de demo incluidas). Sin site key el botón queda deshabilitado y no sale
ningún pedido; con site key el HTML trae el marcador y los 71 px; con
`APP_STAGE=local` + `FORMULARIOS_DEMO=1` el widget entrega `demo` sin tocar
Cloudflare. El iframe del mapa es de Google Maps: se sumó
`https://www.google.com` a `frame-src` de la CSP, igual que en `next.config.ts`.
En las pruebas ese iframe se aborta como cualquier host externo. `lib/analytics`
sigue avisando fallos a `/api/alertas-analytics`, que este paquete no tiene: el
pedido queda en 404 y no cambia la respuesta del formulario (pendiente del
bloque 3/6).

`tests/carreras-detalle.test.mjs` (nuevo, dentro de `test:paridad`) cubre el 200
con la proyección exacta, el mapa vacío, el 502 por slide inválido, el 405, la
ausencia de precios y el formato del registro de error. `tests/paridad.test.mjs`
compara las tres rutas nuevas contra el Next local: `lang`, `<title>`,
canonical, las 18 metas de siempre más `keywords`, JSON-LD parseado y escapado
byte a byte, el texto completo de `<main>` y los enlaces de main, navbar y pie
(los dos últimos, omitidos donde Next no los renderiza). `tests/e2e.test.mjs`
suma capturas escritorio/móvil de las tres rutas con la misma tolerancia y un
caso de `/contacto` con dobles: fallo cerrado sin site key, validación del mail,
envío de demo (un solo 201) y error 500 simulado.

También se corrigió una carrera del propio harness: los tres `wrangler dev` del
e2e arrancaban con el inspector en 9229 y uno moría con «Address already in
use». Ahora usan `--inspector-port 0`; nadie se conecta al inspector.

Límites, sin inflar: las imágenes siguen sin optimizador (`srcset` no existe y el
navegador baja el original), aunque las capturas de las tres rutas quedaron
dentro de la tolerancia (0,005 %–0,072 % de píxeles distintos, media ≤0,285). No
se ejercita Turnstile real: el script de Cloudflare se intercepta o se aborta. El
mapa de `/contacto` no se renderiza en las pruebas. No se migraron
`/teclab/test-vocacional` ni el resto de las familias de rutas, ni `sitemap.xml`,
`robots`, redirects o cabeceras de entrega. Los efectos externos siguen sin
entrypoint de Queues (`/api/formularios` y `/api/carreras-detalle` funcionan,
pero ningún aviso sale del paquete).

Verificación de cierre 4B (25/10/2026): `npm --prefix cloudflare run check` con
165/165 pruebas, sin fallos, cancelaciones ni skips; tipos sin errores,
advertencias ni hints (53 archivos), build y runtime en workerd aprobados.
`test:paridad` 10/10 (6 de `carreras-detalle` + 4 de paridad) y `test:e2e` 10/10.
Capturas contra Next (escritorio): home 0,004 %, `/teclab` 0,005 %,
`/teclab/inscripcion` 0,000 %, `/contacto` 0,011 %. En móvil: home 0,009 %,
`/teclab/inscripcion` 0,000 %, `/contacto` 0,017 % y `/teclab` entre 0,034 % y
0,072 % según la corrida (el mosaico del hero y los logos se rasterizan distinto
cada vez). Todas por debajo de la tolerancia de 2 % con media ≤0,285. Los avisos
son cuatro de PostCSS por los `@import` al final de `app/index.css` y de
`app/carreras/career-detail.css`: son del sitio y ya estaban; la segunda hoja
aparece ahora porque la importa `/teclab/inscripcion`.

## Paridad de páginas: alcance 4C (fijas y tests vocacionales)

Las cinco rutas del [seguimiento 4C](SEGUIMIENTO-4C.md) conservan UI, textos,
metadatos, enlaces y componentes del sitio. Sobre nosotros y calendario reutilizan
directamente sus cuerpos React; los tests y la biblioteca reutilizan las islas
existentes con lecturas explícitas de D1. El inventario de imágenes se obtiene de
`../public/imagenes` al compilar mediante un módulo virtual: no se recorre el disco
en workerd ni se copian assets al código. Toda nueva lectura filtra oferta visible.

SSR contra Next local: `test:paridad` **13/13**, incluyendo tres pruebas de
proyecciones/aislamiento y el estado 404 explícito de las rutas diferidas. E2E real:
**12/12**, con respuestas, volver, selección persistida, resultados y reinicio de
ambos tests; búsqueda/portapapeles, carrusel de folletos y montaje del iframe de
video. No se reproducen YouTube ni Maps, ni se hace clic en WhatsApp o enlaces de
inscripción todavía no migrados. Ninguna prueba invoca proveedores reales.
Check completo final 4C: **170/170, exit 0**, sin fallos, cancelaciones ni skips;
61 archivos con cero errores/advertencias/hints, build y runtime aprobados.

El harness de Next ahora impide abrir dotenv y conexiones externas con un preload
heredado por sus hijos. Las capturas de `/imagenes` se componen por bandas tras
cargar metadatos y congelar las cajas medidas: permite decodificar sólo las
imágenes visibles sin agotar la caché. El scroll es instantáneo y se rechazan
huecos entre bandas. Sólo durante esa captura se neutraliza sticky; no acredita
su comportamiento al desplazarse. El salto canónico de Workers Assets a HTTPS
en nombres con coma se resuelve por HTTP exclusivamente en loopback dentro del
harness, sin seguir redirects externos. No modifica la entrega del Worker.

Se mantienen los umbrales visuales de 2 % de píxeles y media ≤2. Sólo sobre
nosotros admite 1 px de diferencia de alto por el redondeo de imágenes originales
frente a `next/image`: se agrega una fila transparente al canvas y se cuenta como
diferencia, sin escalar ni recortar. La biblioteca y los otros cuatro estados
iniciales requieren dimensiones iguales. Resultados y archivos finales en el
seguimiento; no se declara optimizador de imágenes ni paridad de entrega completa.

## Siguiente lote

Las páginas migradas incluyen home, Teclab, inscripción Teclab, contacto, las cinco
páginas 4C y la continuación FAQ/clases/baja (resultados al final del seguimiento).
La continuación de carreras e inscripción por código está implementada localmente;
check final **186/186, exit 0**, SSR **19/19**, E2E **17/17**. La evidencia se
registra en la sección 4E del seguimiento.
La continuación 4F incorpora el listado paginado y los artículos de novedades;
su evidencia local se registra al final del seguimiento y en la sección 4F abajo.
La continuación 4G incorpora `sitemap.xml`, `robots.txt`, todos los redirects
de `next.config.ts` y las cabeceras de entrega. Su evidencia local está al final
del seguimiento y en la sección 4G de abajo.
La continuación 4H incorpora los siete endpoints pendientes y la analítica local:
el shim vacío pasó a un registrador acotado, sin Vercel ni Google ni tokens en el
cliente; los envíos externos siguen siendo puertos inyectados. Su matriz,
evidencia y límites están en la sección 4H del seguimiento. Quedan pendientes
R2, la habilitación externa de cron/transportes y un
proveedor de analítica elegido explícitamente; nada de eso está autorizado.

**27/10/2026 — imágenes:** el optimizador dejó de ser un pendiente en lo que
importa. `herramientas/derivar-imagenes.mjs` genera derivados webp (480/960/1440)
de las fotos de `public/imagenes/`, con el hash del contenido en el nombre, y
`components/imagenes/imagen-responsiva.tsx` los sirve con `<picture>`/`srcset`;
`/derivados/*` va `immutable`. La foto de 3,7 MB de Relaciones Laborales pasa a
13 KB en un celular.

Alcanza a las fotos que se ven en el sitio: los cinco slides del carrusel de
carreras, el hero de `/carreras/[slug]`, el fondo del cierre de Teclab, el
mosaico de `/teclab`, la portada de los artículos de novedades, el collage de
`/contacto`, la entrada de clases de apoyo y la navegación entre materias. El
shim `next/image` **sigue sin optimizar**: lo que se dejó ahí son logos y SVG,
que no ganan nada. La biblioteca de `/imagenes` tampoco los usa, a propósito:
muestra la ruta y el peso real del archivo que se copia.
Detalle en [`docs/herramientas.md`](../docs/herramientas.md).

Redirecciones migradas: `src/entrega/redirects.ts` concentra la lista global,
`src/entrega/redirects-carreras.ts` las fichas y `src/middleware.ts` las aplica
antes de resolver la ruta. Conservan el código de `next.config.ts` (308 para
`permanent: true` y para el apex/alias, 301/302 donde el config los fija), la
query y la normalización de barra final. El apex se
prueba como función pura: el harness no puede cambiar el host del pedido y el
DNS/zona de producción no se configuran en este paquete. El harness de pruebas
sigue redirecciones por defecto: los casos que miran el código usan
`{ redirect: 'manual' }`.
`exportar:publico` lee únicamente el contenido público de D1 y las páginas
públicas del sitio. `verificar:publico` importa esa copia en un D1 efímero sin
salidas externas, cron ni colas. Los snapshots e informes quedan en
`.local/datos-publicos/`, ignorados y con permisos restrictivos, nunca en Git.

## Continuación 4E: carreras e inscripción

**Baja del 27/10/2026:** `inscripcion/[codigo].astro`, `src/datos/inscripcion-enlace.ts`,
`propsInscripcionEnlace` y el demo `/inscripcion/demo` se retiraron con la
autoinscripción de Teclab. Lo que sigue es historia del bloque 4E, no estado actual.

`src/pages/carreras/[slug].astro`, `carreras/[slug]/inscripcion.astro` e
`inscripcion/[codigo].astro` usan `Sitio.astro` y las islas de `src/entrega/`, sin
rediseñar los componentes compartidos. La ficha conserva las tres casas y los
formularios diferidos; la inscripción dedicada sólo admite las casas/carreras que
permite `tieneInscripcionPropia` (hoy Siglo 21 y Teclab; no Identidad ni próximas).
Se reutiliza `POST /api/formularios`: no se añade otro escritor ni consumidor.

`src/datos/carreras.ts` lee la proyección pública explícita, convierte JSON y
booleanos y filtra `esCarreraVisible`. La isla recibe sólo su ficha, opciones
reducidas, relacionadas y equivalente, no todas las fichas completas. SEO respeta
el presupuesto de títulos por nombre largo primero, y las recomendaciones
conservan la rotación determinista por área/nivel/id. Sólo se portan los redirects
de fichas de `next.config.ts` (301, 302 y 308); el canónico de formato viejo da 308.

`src/datos/inscripcion-enlace.ts` resuelve el GET sin consumir el código; el POST
existente sigue siendo la única autoridad de consumo atómico. La proyección al
navegador es `propsInscripcionEnlace`, con DNI y mail ocultos. El código no entra en
metas ni canonical; la respuesta privada lleva `no-store` y `no-referrer` (el
middleware conserva esa política particular sin cambiar la política global).
El demo explícito `/inscripcion/demo` sólo existe con `APP_STAGE=local`, usa los
mismos datos falsos de Next dev y no envía ni consulta D1.

**Diferencia deliberada de fallo cerrado:** si falla la base o la lectura privada
del precio, la página por código responde 503 vacía y sin detalle del driver.
Next convierte ciertos errores de lectura en aviso inválido o «sin precio» 200.
No se presenta la caída del servicio como un estado confirmado de inscripción.

Silkscreen y DM Sans conservan sus avisos originales, consultados en google/fonts;
los binarios vienen sólo de la caché local existente de Next. Los avisos acompañan
el código y se sirven en `/licencias/{silkscreen,dm-sans}.txt` en el build. Origen y
huellas en `../estilos/{silkscreen,dm-sans}.md`; enlaces en [REFERENCIAS-4E.md](REFERENCIAS-4E.md).

Resultados definitivos, capturas y límites:
[seguimiento 4E](SEGUIMIENTO-4C.md#continuación-4e-carreras-e-inscripción).
Astro/TypeScript: **83 archivos, cero errores/advertencias/hints**. Build y
runtime workerd aprobados. Ninguna tolerancia visual se amplió en este lote.

## Continuación 4F: novedades y artículos

`src/pages/novedades/[page].astro` reutiliza `NovedadesPage` y las hojas Next,
con `Sitio.astro` y pie; el listado no necesita hidratación propia. La portada
muestra la fijada publicada más reciente y tres no fijadas; desde la segunda
página hay seis por página. Se conserva el orden por fecha descendente, el total
mínimo de una página, el paginado canónico y los 404 por parámetro/rango inválido.
El campo `href` no reemplaza al enlace de artículo por slug, igual que Next.

`src/pages/novedades/articulo/[slug].astro` sólo lee publicados por slug exacto,
conserva las dos redirecciones 301 específicas y comparte el escapador JSON-LD
de Next. `PaginaArticulo.tsx` copia el cuerpo original y el control de compartir.
La política de `lib/sanitize-content.ts` se aplica en servidor **antes** del HTML
inyectado y del payload de hidratación. No se permiten iframes/embeds nuevos;
enlaces, imágenes, clases y esquemas admitidos siguen la política vigente.
El layout sólo se amplía para las imágenes OG múltiples que declara el artículo.

`migrations/0009.sql` añade la tabla local conforme a las columnas de los tipos
versionados, sin inventar defaults/índices únicos del remoto. `0001`–`0008` quedan
intactas al cierre. El upgrade conserva también reclamos, cursor, outbox y secuencias.
El repositorio selecciona columnas explícitas, parametriza los valores y rechaza
slugs duplicados como `maybeSingle`, en vez de elegir arbitrariamente una fila.

Sólo fixtures D1/workerd y Next stub en loopback, sin dotenv, datos reales,
servicios, envíos, deploy, commit ni push. Sitemap/robots, cabeceras globales,
otras APIs y gates productivos no forman parte del lote.

Cierre local: `npm --prefix cloudflare run check` **exit 0, 193/193**, `astro
check` 87 archivos sin errores y capturas en
`.local/capturas/2026-10-25-15-08-paginas/` con 0 px de diferencia de alto y
deltas de hasta 0,181 % (artículo) y 0,030 % (listado). La rutina de captura de
la biblioteca carga y decodifica por bandas para no agotar la caché de Chromium;
la evidencia y los límites están en el seguimiento.
Fuentes: [REFERENCIAS-4F.md](REFERENCIAS-4F.md). Resultados definitivos y capturas:
[seguimiento 4F](SEGUIMIENTO-4C.md#continuación-4f-novedades-y-artículos).

## Continuación 4H: APIs pendientes y analítica

Los siete endpoints que faltaban ya tienen contrato local: `GET /api/newsletter`,
`GET /api/recordatorio-teclab`, `POST /api/track-click`,
`POST /api/track-direct-open`, `POST /api/revalidar`, `GET /api/vigilancia` y
`POST /api/alertas-analytics`. Conservan métodos, códigos, cuerpos,
autenticación y fallo cerrado de Next; sólo el método del contrato se atiende y
el resto responde 405 con `Allow`.

- **Newsletter**: reclamo durable en `newsletter_envios` (`0010.sql`) antes de
  SMTP2GO, confirmación de `ultimo_envio_at` en el mismo batch, siete días,
  rechazo conocido reintentable y ambiguo sin reintento automático. Sin
  `CRON_SECRET` o `SMTP2GO_API_KEY` responde 503 sin leer la base.
- **Recordatorio y vigilancia**: `Bearer CRON_SECRET`; la lista de lo esperado
  sigue saliendo de `lib/vigilancia-esperado.ts`. La vigilancia recibe `fetch`,
  Telegram y los lectores D1 por puerto; no audita producción desde las pruebas
  y no pide una `<loc>` fuera del dominio propio. `?prueba=1` sólo manda el aviso.
- **Telemetrías y alertas**: la IP sale de `cf-connecting-ip`; `x-forwarded-for`
  y `x-real-ip` no se usan. Se conservan las cuotas 60/20 y 5/12 por evento y la
  allowlist de campos. La telemetría nunca rompe la navegación (fallo = 200
  `{ ok: false }`), como el sitio.
- **Revalidar**: autenticación, JSON inválido, tabla sin mapear y lista de rutas
  se conservan. En Astro no hay ISR ni caché de HTML que invalidar y el aviso a
  IndexNow dependía de Vercel; no se simula una invalidación que no existe.
- **Analítica**: `src/entrega/analitica.ts` registra eventos planos en memoria
  acotada y emite `cau:analitica`; no hace red, no loguea y descarta claves con
  pinta de dato personal. El layout monta `AnalyticsInteractions` como el sitio.
  No se carga Vercel Analytics ni Google: el guard de GA de los componentes
  compartidos se resuelve a `undefined` en el build y el helper de terceros deja
  el evento local.

`CRON_SECRET`, `REVALIDATE_SECRET`, `SMTP2GO_API_KEY`, `TELEGRAM_BOT_TOKEN` y
`TELEGRAM_CHAT_ID` se leen sólo en runtime y no están en `wrangler.json` ni en
archivos de entorno del paquete. Sin ellas cada endpoint falla cerrado (503 o
502) o responde «sin configurar», nunca un éxito ficticio. Las pruebas las
inyectan como puertos.

Verificación local: `npm --prefix cloudflare run check` **233/233, exit 0**,
112 archivos sin diagnósticos, build/runtime workerd y E2E **19/19**. La matriz
completa, las incidencias de arnés y los límites están en la
[continuación 4H](SEGUIMIENTO-4C.md#continuación-4h-apis-pendientes-y-analítica).

## 26/10/2026 — aviso de Telegram controlado en staging

Ruta exclusiva `POST /api/staging-telegram` (`staging/telegram-controlado.ts`),
sin importadores en `src/`: consume **una** fila `aviso-lead` pendiente con el
transporte real, cupo durable de 1 con ID fijo y egreso único a `sendMessage`
por POST con `redirect: 'manual'` y rechazo de 3xx. Wrangler resultó tener
`workers_scripts:write` y `d1:write`, así que el deploy de staging se hizo con
Wrangler y no por MCP; el secreto se transfirió por tubería desde un filtro de
`TELEGRAM_*` en `.env.local`, sin imprimir valores.

Resultado: un despacho, `enviado` (2xx de Telegram), outbox `enviado`/1; segundo
pedido 409 sin duplicar. Cierre con bandera `no` y secretos retirados: ruta 503,
formularios y correo 503, `/` sin credenciales 401, cron `[]`, sin colas.
`test:staging-protegido` **33/33**; check completo exit 0.
Detalle en [STAGING-PREPARACION.md](STAGING-PREPARACION.md).

## 27/10/2026 — publicador versionado

Hasta acá el Worker de producción se publicó con un `wrangler` suelto y una
configuración que no estaba en el repo (`.local/produccion/`). Eso ya no es el
camino: la configuración es `produccion/wrangler.json` (dominios propios, D1
`cau-produccion`, colas `cau-efectos` + DLQ, los cinco crons y las variables
públicas) y el único publicador es `scripts/publicar.mjs`:

```bash
npm run publicar             # plan: no compila, no autentica, no toca nada
npm run publicar:ensayo      # build + `wrangler deploy --dry-run`
npm run publicar:produccion  # build + deploy + `herramientas/smoke.mjs`
```

Desde el 27/10/2026 también corre en CI: `.github/workflows/publicar.yml`
(`Publicar el Worker`), disparado a mano desde Actions, con `ensayo` por defecto,
rechazo si la rama no es `main` y el token como secreto de repositorio
`CLOUDFLARE_API_TOKEN`. Es el camino recomendado: no deja credencial de producción
en ninguna máquina. Los comandos de abajo quedan para trabajar desde local.

En CI la verificación va con `--smoke-rapido` (rutas fijas, cabeceras,
redirects y peso). El barrido de las 123 URLs del sitemap **no** se corre desde
el runner: es una ráfaga desde una IP de datacenter y el borde la rechaza con
403 por Browser Integrity Check —el 27/10/2026 la primera publicación terminó en
rojo con el sitio perfectamente sano, comprobado desde la máquina con el smoke
completo en verde—. Ese barrido queda para `herramientas/vigilancia.mjs` y para
la máquina de casa.

Sin banderas sólo informa. El publicador revisa la configuración contra el
código —nombre, entrada, assets, base, colas, dominios, `observability` y que
`vars` no lleve secretos— y se niega a seguir si algo no cierra. `--ensayo` no
necesita credencial porque no sale a la red; `--publicar` usa un token acotado
(`Workers Scripts:Edit`, `Workers Routes:Edit` de la zona, `Queues:Edit` y
`D1:Edit` sólo para migrar) que se lee del entorno o de `.env.local`, y le pasa a
wrangler **sólo** esa variable: la base, SMTP2GO y las credenciales de ventas que
también viven en `.env.local` no entran al proceso que publica. La alternativa
es `wrangler login`, que guarda el OAuth en texto plano en el perfil. Las pruebas
de contrato —crons del JSON iguales a `CRONES`, y que el token salga sin
arrastrar el resto— están en `tests/publicacion.test.mjs` y corren dentro de
`npm run check`.

Lo que no hace, a propósito: no aplica migraciones (`wrangler d1 migrations
apply --remote` es una decisión aparte), no administra secretos (un deploy no los
pisa) y no revierte solo; si el smoke falla después de publicar, la vuelta atrás
es un deploy de la versión anterior, decidido por una persona.

## Medición de clics a WhatsApp (27/10/2026)

El corte dejó sin medir la conversión más transitada del sitio. No era sólo que
Vercel Analytics se hubiera dado de baja: `WhatsappReparto` —el componente que
escucha el clic— vivía en `app/layout.tsx`, y al portar a Astro no se montó en
`Sitio.astro`. Desde el corte y hasta este arreglo no se registró un solo clic ni
salió un solo aviso de Telegram del móvil.

- `migrations/0012_whatsapp_clicks.sql` agrega `whatsapp_clicks (fecha, origen,
  movil, clicks)`: agregados por día, página y dispositivo, nunca filas por
  visita. `fecha` es el día argentino, igual que `career_clicks`.
- El navegador manda el evento en los dos dispositivos a
  `POST /api/alertas-analytics`; el Worker cuenta siempre y manda Telegram sólo
  si es móvil. Si el cupo de la IP corta el clic, tampoco avisa: no se alerta de
  algo que el informe no va a mostrar.
- `src/datos/whatsapp.ts` valida el origen (pathname, sin query ni hash), deriva
  la clave de cuota con SHA-256 y usa el cupo `whatsapp:<digest>` (60 / 600 s).
- `npm run leads` lee los clics y las consultas de D1; las visitas salen de
  Cloudflare Web Analytics con `CF_ANALYTICS_TOKEN` o con el archivo privado
  `cloudflare/.local/produccion/cf-analytics.key`. La conciliación de envíos
  ahora compara las consultas con los avisos del outbox.

**La base de producción no tiene historial de migraciones.** Se cargó con un
import y `d1_migrations` quedó con cero filas, así que `wrangler d1 migrations
apply --remote` intenta reaplicar 0001 y falla con «table carreras already
exists». Las migraciones nuevas se aplican con `d1 execute --file=<archivo>` y el
archivo es el registro. Para volver a `migrations apply` hay que cargar antes el
historial de lo ya aplicado; no alcanza con reintentar.
