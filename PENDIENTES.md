# Pendientes

Última actualización: 2026-07-29

## Urgente

Nada abierto.

- [x] ~~**Revocar el PAT de Supabase `claude-fix-webhook`**~~ — al revisar la lista el 27/07 **ese token no existía**: o se revocó antes de anotarlo acá, o quedó mal el nombre. En la misma pasada se limpiaron los tokens de https://supabase.com/dashboard/account/tokens: se revocó un `codex-release` duplicado que nunca se había usado y el `claudeco` ya vencido.

  Quedan vivos `codex-release` (`sbp_ae97…`, en uso) y `mercadolibrebot` (`sbp_bc7d…`). **Ninguno de los dos vence**, y un PAT da acceso a todos los proyectos de la cuenta — conviene revisarlos cada tanto y borrar el que deje de usarse.

## Verificar

- [ ] **Pedirle a la universidad el plan de la Tecnicatura en Estadística Aplicada y Análisis Avanzado** (id 132). Es la única carrera visible sin temario del que agarrarse: al 29/07 no existe ni el PDF de `contenidos.21.edu.ar` ni la página en `21.edu.ar` ni una entrada en su sitemap; lo único público es un posteo del CAU Corrientes (2 años, inicio en octubre). Quedó marcada `proximamente` mientras tanto.

  **Cuando llegue el temario**, el cambio son dos cosas: cargar el slide de plan como el de Sociología y sacarle el `proximamente` —`update public.carreras set proximamente = false where id = 132;`—, que le devuelve el botón "Quiero inscribirme" y la píldora "Nueva". Ojo: si el CAU empieza a inscribir **antes** de que aparezca el plan, hay que sacar el `proximamente` igual, aunque la ficha se quede sin temario.

- [x] ~~**Confirmar el arreglo del captcha vencido.**~~ Probado a mano y **funciona** (29/07). Se dejó la home quieta pasados los 300 s y el envío entró: llegó la consulta.

  **La señal que confirma el arreglo no es el envío, es el desmarque.** Pasados los 5 minutos el checkbox se desmarca solo y el botón de enviar se apaga. Eso es el `expired-callback` llegando al componente, que es justo lo que el widget desmontado hacía imposible: antes el token vencido se quedaba guardado en el estado de React, el botón seguía habilitado y el 403 aparecía recién al enviar. Sirve como test rápido — no hace falta llegar a mandar el formulario para saber si el fix está desplegado.

  **El widget no se re-marca solo.** La renovación automática de Turnstile vuelve a correr el desafío, pero como pide interacción queda el checkbox vacío esperando el clic. Es un clic y sigue; no se pierde nada de lo escrito.

  Queda derivado de esto el hueco de UX anotado abajo (botón apagado sin explicación).

  No se puede automatizar: Cloudflare no emite token para un navegador manejado por Playwright, ni headless ni con ventana visible.

## Correo del dominio

El dominio **no tiene un solo registro de correo**: sin MX no recibe nada, y sin SPF ni DMARC cualquiera puede mandar mails haciéndose pasar por `@siglo21sur.com`. Para un sitio que le pide a la gente DNI y documentación del legajo, eso es un vector de phishing real.

Y los avisos de formulario salen desde `onboarding@resend.dev`, el dominio compartido de pruebas de Resend. Entrega peor que un dominio propio y cae en spam más seguido — justo lo que no querés en el canal que ya estuvo mudo una semana entera sin que nadie se enterara.

Todo esto es **gratis**: el plan es el free, lo que se paga por año es sólo el registro del dominio (Cloudflare Registrar, vence el 03/03/2027).

**El orden importa.** Cada paso queda funcionando por sí solo y ninguno rompe el anterior:

- [x] ~~**1. Prender DNSSEC.**~~ Hecho el 28/07 y verificado: RDAP devuelve `delegationSigned: True` y el DS está publicado en el registro de `.com` (keytag 2371). Ojo al hacerlo: entre que Cloudflare firma la zona y que el DS aparece en el registro pasa un rato, y hasta que aparece **DNSSEC no protege nada** — una zona firmada sin DS no la valida nadie.

- [x] ~~**2. Email Routing.**~~ Hecho el 28/07: `contacto@siglo21sur.com` reenvía a `kiamchomi@gmail.com`. Verificado desde afuera que resuelven los 3 MX de Cloudflare, el SPF y el DKIM (`cf2024-1._domainkey`).

  Notas de la UI nueva, que confunde: los registros no se agregan desde la pantalla de DNS sino desde **Email Routing → Settings**, con el botón **Add missing record**. La dirección de destino tiene que estar en **Verified** antes de nada; si no, se puede configurar todo igual y el reenvío no funciona sin dar ningún error.

  **El SPF quedó como `v=spf1 include:_spf.mx.cloudflare.net ~all` y Cloudflare lo deja "Unlocked" a propósito**, justo para poder fusionarlo. Es el registro a editar en el paso 3 si Resend pide SPF en la raíz.

**Decisión del 28/07: los pasos 3 a 6 quedan descartados.** El plan free de Resend permite un solo dominio verificado y ese lugar lo ocupa topykly. Telegram pasa a ser el canal de avisos y el mail queda como está, saliendo de `onboarding@resend.dev`. Si algún día topykly deja de usarlo, o se pasa a Pro, los pasos siguen escritos acá abajo y siguen siendo válidos.

Consecuencia de quedarse con un solo canal: la Edge Function `notificar` pasó de `Promise.all` a `Promise.allSettled`, porque con `all` un timeout de Resend rechazaba todo y podía cortar el envío de Telegram que iba en paralelo. **Desplegada y verificada el 28/07**: la función devuelve 401 sin credencial y 405 con GET, y la prueba de los tres formularios entregó los tres avisos por Telegram.

- [ ] ~~**3. Verificar `siglo21sur.com` en Resend**~~ (descartado) y cargar en Cloudflare los registros que dé (DKIM y, según el caso, un MX de rebotes).

  **Dos trampas acá:**
  - Los CNAME de DKIM van con la **nube gris** (sin proxear). Proxeados, Cloudflare los reescribe y la verificación no pasa nunca.
  - **Un dominio admite un solo registro SPF.** Si Resend pide SPF en la raíz y ya está el de Email Routing del paso 2, hay que **fusionarlos en un único TXT**, no agregar otro: dos SPF invalidan los dos. Si Resend te lo pide sobre un subdominio (`send.siglo21sur.com`), no hay conflicto y no tocás el de la raíz.

- [ ] **4. Desplegar la Edge Function `notificar`.** Ya está el cambio en el repo: el remitente se lee de `RESEND_FROM` y, si no está seteada, cae al sandbox de siempre. O sea que **desplegarla no cambia nada todavía** — se puede hacer en cualquier momento sin riesgo.

  Va por CLI, que no necesita Docker ni Deno instalados: `npx supabase functions deploy notificar --project-ref yuwfkdehaowkselkhtck --no-verify-jwt`. (Antes acá decía que había que hacerlo por el dashboard; es al revés — el deploy por dashboard fue justo el que dejó la función con un slug distinto del nombre y rompió la URL.)

- [ ] **5. Recién ahí, setear el secret `RESEND_FROM`** con `CAU Villa Lugano <avisos@siglo21sur.com>`. Edge Functions → Secrets.

  **No adelantar este paso**: si se setea antes de que Resend diga "verified", Resend rechaza cada envío con 403 y los avisos se cortan — otra vez en silencio, porque `net.http_post` no bloquea el INSERT.

- [ ] **6. Verificar con `herramientas/4 - Verificar avisos (SQL).bat`.** Tiene que llegar el mail desde la dirección nueva y no caer en spam. Si el paso 5 salió mal, acá se ve.

- [x] ~~**7. DMARC.**~~ Hecho el 28/07 y verificado en dos resolvers: `v=DMARC1; p=reject; rua=mailto:…@dmarc-reports.cloudflare.net`.

  Se fue **directo a `p=reject`** en vez de pasar por `p=none` unas semanas, y acá el motivo importa: **ningún sistema manda mails como `@siglo21sur.com`**. Los avisos salen desde `onboarding@resend.dev` y Email Routing sólo recibe, así que no hay remitente legítimo que se pueda romper. Y `p=none` no protege de nada — es sólo observación —, con lo cual dejarlo ahí «hasta revisar los reportes» hubiera significado quedarse sin protección por tiempo indefinido.

  **Lo único que lo rompería:** configurar el Gmail para "enviar como" `contacto@siglo21sur.com`. Si algún día se hace, hay que aflojar la política o sumar el remitente al SPF antes.

  Detalle de la UI: el panel de DMARC Management muestra `DMARC policy: N/A` y avisa que falta el RUA durante un rato después de crear el registro. Es la pantalla que no releyó la zona; el registro ya estaba publicado y correcto. No tocar "Fix record" por eso.

  Queda como mejora menor: el SPF está en `~all` (soft fail) y podría ir a `-all`. Con DMARC en `reject` el margen que agrega es chico.

## Seguridad — variables de entorno en Vercel

- [ ] **Rotar `TURNSTILE_SECRET_KEY` y marcarla Sensitive.** Vercel avisa que cualquiera con acceso al proyecto puede leer su valor. No hubo filtración: la clave solo se usa server-side (`lib/turnstile.ts` tiene `import 'server-only'`) y nunca entra al bundle del navegador.

  Pasos: rotar en el dashboard de Cloudflare Turnstile → borrar la variable en Vercel → volver a crearla con el check **Sensitive** → redeploy. Ojo: una vez Sensitive no se puede volver a leer nunca, y `vercel env pull` la trae censurada, así que guardarla antes en el gestor de contraseñas y pegarla a mano en `.env.local`.

- [x] ~~**Mismo tratamiento para `RESEND_API_KEY`.**~~ Ya está marcada Sensitive — verificado el 28/07, `vercel env pull` la devuelve como `[SENSITIVE]`.

  `SUPABASE_SERVICE_ROLE_KEY` ya está marcada Sensitive — verificado el 27/07: `vercel env pull` la devuelve como `[SENSITIVE]`.

  Estado del resto al 28/07, con `vercel env pull --environment=production`: `TURNSTILE_SECRET_KEY` **sigue legible** (35 caracteres en claro), y `GITHUB_PAT` (40 caracteres) y `RESEND_API` (36) **siguen ahí y también se leen enteros**. Efecto lateral a tener presente: desde la máquina local ya no hay ninguna credencial con permiso de escritura sobre la base, así que todo `UPDATE`/`INSERT` va por el SQL Editor del dashboard.

- [x] ~~**Revisar y borrar variables sin uso en Vercel.**~~ Hecho el 28/07. `GITHUB_PAT` y `RESEND_API` borradas de los tres entornos; `vercel env ls` ya no las lista. Ninguna la usaba el código. En la misma pasada se revocaron en GitHub los **cuatro** PAT clásicos que había en la cuenta (`vercelsincexcel`, `sync-precios-admin`, `iniciotoken`, `Token_CLaude`): los cuatro con scope `repo`, sin vencimiento y marcados "Never used". El `git push` no dependía de ninguno — usa un token OAuth (`gho_`) del Credential Manager de Windows.

- [x] ~~**Revocar en Resend la clave que estaba en `RESEND_API`.**~~ Hecha el 28/07: era **`aviso_clicks`**, la única con **acceso total** de la cuenta, y quedó borrada.

  **Cómo se identificó, que es lo reutilizable.** Primero por el prefijo: los tokens de Resend son `re_<id>_<secreto>` y el panel muestra el `re_<id>` en la lista, así que alcanza con haberlo anotado antes de borrar la variable — de `re_5dnuWKfK…` salió el match exacto. Y se confirmó por la columna **Last used**: `aviso_clicks` figuraba usada "hace 1 hora", que fue la verificación desde acá, mientras que `Onboarding` figuraba "hace 15 minutos", justo la prueba de avisos que había entregado los tres mensajes. O sea que la que manda los avisos es `Onboarding`, no la que se borró.

  Dato de contexto que confundió un rato: **siglo21sur y topykly comparten la misma cuenta de Resend**. Se dedujo de que la clave de siglo21sur pudo listar `topykly-dev` — una clave sólo lista las de su propia cuenta. Por eso choca con el límite de un dominio del plan free.

  Estado resultante: quedan `Onboarding` (Sending access, la de los avisos) y `topykly-dev` (Sending access, el otro proyecto). **Ninguna clave con acceso total en la cuenta.**

## Encontrado de paso

- [ ] **El teléfono no se valida en el cliente, en ningún formulario.** Salió probando el captcha el 29/07: se escribió `11` en el teléfono y el formulario dejó enviar igual, el servidor lo rechazó y lo que se vio fue el mensaje genérico *"Hubo un error al enviar. Intentá de nuevo o contactanos por WhatsApp"* — que no menciona el teléfono y hace pensar que el sitio está caído.

  El servidor pide 8 caracteres (`PHONE = /^[\d\s()+-]{8,30}$/` en `app/api/formularios/route.ts`), pero `contactValid` (`enrollment-form.tsx:68` y `contacto-page.tsx:59`) sólo mira que el campo no esté vacío. **La asimetría está al lado**: el email sí valida en cliente y muestra *"El formato del email no es válido"*.

  Por qué importa: es el formulario de captación. Quien escribe el teléfono incompleto recibe un error que parece falla del sitio y encima quema 1 de sus 5 envíos del rate limit. Es pérdida de leads silenciosa.

  **Ojo con el criterio al arreglarlo:** el regex del servidor cuenta *caracteres*, no dígitos, así que `((((((((` pasa y `1 1 1 1` no. `clases-apoyo-page.tsx` ya tiene el criterio bueno y conviene reusarlo: `soloDigitos.length >= 8`.

- [ ] **El captcha vencido apaga el botón sin explicar por qué.** Derivado de la verificación del 29/07. Pasados los 300 s el widget se desmarca y `onExpire` limpia el token, así que el botón de enviar se apaga. Es muchísimo mejor que el 403 de antes —no se pierde lo escrito y se recupera con un clic— pero no hay ningún cartel que diga qué hacer. Un mensaje enganchado al `onExpire` (*"El captcha venció, volvé a tildarlo"*) lo resuelve.

- [x] ~~**Las dos carreras sin contenido que marcaba la auditoría.**~~ Corridos y verificados el 29/07: `npm run auditar` da **0 problemas** por primera vez. Quedan dos avisos, los dos esperando temario de la universidad (Agroinformática y Estadística).

  **Sociología (131) no tenía plan porque no tiene plan propio.** La ficha oficial —`https://contenidos.21.edu.ar/pdf/carreras/grado/lic-sociologia.pdf`, página 2— dice que la carrera *sólo* se dicta como doble titulación de la Licenciatura en Relaciones Internacionales: son 11 materias adicionales al plan de RRII. El sitio la publicaba como una licenciatura suelta de 4 años. Ahora el grid replica los 4 años de RRII (46 materias, copiadas de la fila 69 sin reescribir ninguna) y cierra con las 11 propias en un bloque `extras` que explica la condición; la aclaración va además en `descripcion`, porque el bloque `extras` se renderiza último y quien escanea la página leería el plan de RRII como si fuera el de Sociología.

  **Lo reutilizable:** las fichas de las carreras propias están en `contenidos.21.edu.ar/pdf/carreras/<grado|pregrado>/<lic|tec>-<slug>.pdf`, sueltan texto real y se extraen con PyMuPDF (no hay poppler en esta máquina, así que no hay otra vía). El sitemap de `21.edu.ar` **no sirve** para buscarlas: sólo lista cursos, certificados y diplomaturas de APLV. Un 404 en todas las variantes del slug significa que la carrera no tiene ficha publicada, no que erraste la URL — fue exactamente el caso de Estadística.

- [x] ~~**Imágenes para compartir en todo el sitio.**~~ Hecho y verificado en producción el 29/07. **Ninguna página tenía `og:image`**: ni la home, ni las 96 fichas de carrera, ni los 10 artículos. Todo link compartido por WhatsApp salía sin miniatura.

  Se generaron 23 imágenes de 1200×630 con `herramientas/generar-og.mjs` (sharp, a partir de las fotos que ya estaban en `public/`), y se corrió `sql/2026-07-29_novedades_imagenes.sql`. La auditoría bajó de 14 problemas a 4.

  **Dos derivados por artículo, y el motivo importa:** `imagen_url` no alimenta solo el og — también la tarjeta del listado y la cabecera del artículo. La compuesta lleva el título encima, que al lado del `<h1>` quedaría duplicado; por eso a la base va la foto limpia y la compuesta se sirve por convención de ruta desde `/imagenes/og/<slug>.jpg`. Como esa no está en la base, `npm run auditar` ahora chequea el disco: un artículo nuevo sin generar dejaría el og:image en 404 sin que nada lo delate.

  **La trampa que costó dos deploys:** declarar `openGraph` dentro de un `generateMetadata` **reemplaza** el del layout, no lo completa. Por eso el fallback global no alcanzó para las fichas de carrera, que declaran el suyo. Lo mismo con `twitter:image`, que además gana sobre `og:image` cuando está presente.

  **Identidad Argentina va con marca propia** (`default-identidad-argentina.jpg` y la del artículo): sin sello CAU, sin verde institucional y sin el dominio escrito encima. Son diplomaturas de convenio, no de Siglo 21.

- [ ] **Falta una foto decente de la entrada del CAU.** La única imagen del local es `public/imagenes/imagenes_cau/entrada_estetica.png`, de 475×598: estirada a 1200×630 queda blanda, y el recorte automático agarra el logo de la marquesina en vez del cartel. Hoy la usa el og de "Dónde queda el CAU Villa Lugano".

  Con una foto sacada de frente con cualquier celular actual se resuelve: hay que dejarla en `public/imagenes/imagenes_cau/` y volver a correr `node herramientas/generar-og.mjs` apuntando esa ruta en la entrada `#69` del script. La alternativa —usar el campus— se ve nítida pero no es la sede de Lugano, que es justo lo que el artículo explica.


- [x] ~~**Correr `sql/2026-07-28_planes_identidad_argentina.sql`.**~~ Hecho y verificado el 28/07: los 11 planes de la base coinciden carácter por carácter con el archivo (sólo difiere el fin de línea, por el pegado desde Windows) y producción ya sirve el temario nuevo — `/carreras/diplomatura-en-fraude-financiero-y-digital` abre en "Panorama del fraude financiero y digital" y no queda rastro del programa viejo.

  Repuso el `plan_estudios` de las **11 carreras de convenio** desde las fichas oficiales (`Desktop\Academia Identidad Argentina\fichas-diplomaturas\*.txt`). Lo que había cargado eran resúmenes, no el temario real: de los 331 puntos de las fichas faltaban 162 en la base. El caso extremo era Fraude Financiero y Digital (`id 177`), que directamente tenía **otro programa** — abría en "Introducción al sistema financiero".

  El archivo documenta arriba las limpiezas aplicadas sobre las fichas, que vienen de un PDF a dos columnas y arrastran artefactos (puntos pegados con `" - "`, rótulos "Unidad N", líneas cortadas al medio). **Dos decisiones quedaron para revisar**: los módulos 2 a 6 de Bienestar Integral no tienen título en la ficha (dice literal "MÓDULO 2") y se conservaron los de la base; y Mindfulness pasa de 8 módulos a los 4 de la ficha, sin perder contenido pero con un cambio visible.

  **Origen del desfasaje sin resolver:** las fichas se regeneran solas desde las landings, pero nada vuelca eso a Supabase — la carga fue manual y quedó vieja. Mientras siga así, va a volver a pasar.

- [x] ~~**El digest diario de clicks nunca corría.**~~ Resuelto y verificado de punta a punta el 29/07: llegó el mensaje por Telegram y `net._http_response` devolvió `200` con `{"ok":true,"telegram":true}`.

  **Estaban rotas las tres piezas, no una.** Acá figuraba que sólo faltaba programar el cron; era incorrecto:

  1. **La tabla `career_clicks` no existía.** El bloque `BEGIN…COMMIT` de `sql/2026-07-22_clicks_carreras.sql` nunca se había ejecutado, así que tampoco existía la RPC `registrar_click_carrera`. **Consecuencia que nadie había notado: `/api/track-click` venía fallando desde el 22/07** — devolvía `{"ok":false}` con status **200**, o sea que fallaba en silencio, y ningún click se registró en esa semana. Los datos de ese período están perdidos; no se pueden reconstruir.
  2. **La Edge Function `digest-clicks` no estaba desplegada.**
  3. **El `pg_cron` no estaba programado** — `cron.job` vacía.

  **La trampa del deploy, que es lo reutilizable.** Al crearla desde el dashboard, la función quedó con `name` = `digest-clicks` pero `slug` = `rapid-responder`. **La URL se arma con el slug, no con el nombre**, así que la lista mostraba el nombre correcto mientras `/functions/v1/digest-clicks` devolvía 404. Encima quedó con `verify_jwt: true`, que habría rechazado el `Bearer <WEBHOOK_SECRET>` del cron por no ser un JWT. Ambas cosas sólo se ven con `npx supabase functions list`, no en la UI.

  Se resolvió desplegando por CLI, que fija el slug y permite la bandera: `npx supabase functions deploy digest-clicks --project-ref yuwfkdehaowkselkhtck --no-verify-jwt` (requiere `npx supabase login` una vez; no hace falta Docker ni instalar nada). La función huérfana `rapid-responder` se borró.

  **Correr esos scripts por partes, no todo junto:** `pg_net` recién despacha el pedido cuando la transacción commitea, así que el `select` sobre `net._http_response` ejecutado en la misma tanda no muestra nada y parece que falló.

  ~~Queda como mejora menor: el digest se manda a las 20:00 pero informa **el día en curso**.~~ Resuelto el 29/07: la función ahora informa **el día anterior completo** y el cron pasa a las 09:00 (12:00 UTC). La función además acepta `{"fecha":"AAAA-MM-DD"}` en el body para reenviar un día puntual sin tocar el cron.

## Para tener presente

El corte de avisos del 20 al 27/07 **no costó ningún lead real**: la única consulta de
ese período (`id 43`) era una prueba propia. Verificado el 27/07.

Los avisos de formularios **fallan en silencio**. `net.http_post` encola el pedido sin bloquear el `INSERT`, así que la web responde `201` aunque la notificación se caiga. Fue exactamente lo que pasó del 20/07 al 27/07: el endurecimiento de seguridad le agregó validación de secreto a la Edge Function y el trigger de la base nunca se actualizó para mandarlo.

Cada vez que se toque el `WEBHOOK_SECRET`, la función `notificar` o el trigger, verificar así:

```sql
INSERT INTO public.consultas (nombre, apellido, email, carrera)
VALUES ('PRUEBA', 'WEBHOOK', 'prueba@siglo21sur.com', 'Test');

SELECT id, status_code, content, created
FROM net._http_response ORDER BY created DESC LIMIT 3;

DELETE FROM public.consultas WHERE nombre='PRUEBA' AND apellido='WEBHOOK';
```

Esperado: `200` y `{"ok":true,"email":true,"telegram":true}`. Un `401` significa que el secreto del trigger no coincide con el de la Edge Function. Detalle completo en `sql/2026-07-27_webhook_notificar.sql`.
