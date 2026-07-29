# Pendientes

Última actualización: 2026-07-29

## Urgente

Nada abierto.

- [x] ~~**Revocar el PAT de Supabase `claude-fix-webhook`**~~ — al revisar la lista el 27/07 **ese token no existía**: o se revocó antes de anotarlo acá, o quedó mal el nombre. En la misma pasada se limpiaron los tokens de https://supabase.com/dashboard/account/tokens: se revocó un `codex-release` duplicado que nunca se había usado y el `claudeco` ya vencido.

  Quedan vivos `codex-release` (`sbp_ae97…`, en uso) y `mercadolibrebot` (`sbp_bc7d…`). **Ninguno de los dos vence**, y un PAT da acceso a todos los proyectos de la cuenta — conviene revisarlos cada tanto y borrar el que deje de usarse.

## Verificar

- [ ] **Confirmar el arreglo del captcha vencido.** Está desplegado (commit `4e12ea9`) pero sin probar de punta a punta. El test: abrir la home, tildar el captcha apenas cargue, **dejar la pestaña quieta 8-10 minutos** (el token de Turnstile vence a los 300 s), después completar el formulario y enviar. Antes eso daba 403 seguro.

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

  No hay CLI de Supabase ni Deno en esta máquina: va por el dashboard, Edge Functions → `notificar` → pegar el código y Deploy.

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

- [ ] **El digest diario de clicks nunca corre.** `sql/2026-07-22_clicks_carreras.sql` programa un `pg_cron` a las 23:00 UTC que llama a la Edge Function `digest-clicks`, pero la tabla `cron.job` está **vacía** — ese bloque nunca se ejecutó, porque pedía reemplazar `<WEBHOOK_SECRET>` a mano. La función está desplegada y sin nadie que la invoque.

  **Listo para correr:** `sql/2026-07-27_cron_digest_clicks.sql` programa el job sacando el secreto vigente del trigger `notify_edge_function`, así que no hay nada que pegar. Incluye una invocación de prueba para no esperar a las 20hs y el `select` sobre `net._http_response` para ver si respondió 200.

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
