# Pendientes

Última actualización: 2026-07-27

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

- [ ] **3. Verificar `siglo21sur.com` en Resend** y cargar en Cloudflare los registros que dé (DKIM y, según el caso, un MX de rebotes).

  **Dos trampas acá:**
  - Los CNAME de DKIM van con la **nube gris** (sin proxear). Proxeados, Cloudflare los reescribe y la verificación no pasa nunca.
  - **Un dominio admite un solo registro SPF.** Si Resend pide SPF en la raíz y ya está el de Email Routing del paso 2, hay que **fusionarlos en un único TXT**, no agregar otro: dos SPF invalidan los dos. Si Resend te lo pide sobre un subdominio (`send.siglo21sur.com`), no hay conflicto y no tocás el de la raíz.

- [ ] **4. Desplegar la Edge Function `notificar`.** Ya está el cambio en el repo: el remitente se lee de `RESEND_FROM` y, si no está seteada, cae al sandbox de siempre. O sea que **desplegarla no cambia nada todavía** — se puede hacer en cualquier momento sin riesgo.

  No hay CLI de Supabase ni Deno en esta máquina: va por el dashboard, Edge Functions → `notificar` → pegar el código y Deploy.

- [ ] **5. Recién ahí, setear el secret `RESEND_FROM`** con `CAU Villa Lugano <avisos@siglo21sur.com>`. Edge Functions → Secrets.

  **No adelantar este paso**: si se setea antes de que Resend diga "verified", Resend rechaza cada envío con 403 y los avisos se cortan — otra vez en silencio, porque `net.http_post` no bloquea el INSERT.

- [ ] **6. Verificar con `herramientas/4 - Verificar avisos (SQL).bat`.** Tiene que llegar el mail desde la dirección nueva y no caer en spam. Si el paso 5 salió mal, acá se ve.

- [ ] **7. DMARC al final**, cuando el resto ande. TXT en `_dmarc` arrancando en `v=DMARC1; p=none; rua=mailto:kiamchomi@gmail.com`. Dejarlo en `p=none` unas semanas y mirar los reportes antes de endurecerlo a `quarantine`. Ir derecho a `reject` puede tirar mail legítimo sin aviso.

## Seguridad — variables de entorno en Vercel

- [ ] **Rotar `TURNSTILE_SECRET_KEY` y marcarla Sensitive.** Vercel avisa que cualquiera con acceso al proyecto puede leer su valor. No hubo filtración: la clave solo se usa server-side (`lib/turnstile.ts` tiene `import 'server-only'`) y nunca entra al bundle del navegador.

  Pasos: rotar en el dashboard de Cloudflare Turnstile → borrar la variable en Vercel → volver a crearla con el check **Sensitive** → redeploy. Ojo: una vez Sensitive no se puede volver a leer nunca, y `vercel env pull` la trae censurada, así que guardarla antes en el gestor de contraseñas y pegarla a mano en `.env.local`.

- [x] ~~**Mismo tratamiento para `RESEND_API_KEY`.**~~ Ya está marcada Sensitive — verificado el 28/07, `vercel env pull` la devuelve como `[SENSITIVE]`.

  `SUPABASE_SERVICE_ROLE_KEY` ya está marcada Sensitive — verificado el 27/07: `vercel env pull` la devuelve como `[SENSITIVE]`.

  Estado del resto al 28/07, con `vercel env pull --environment=production`: `TURNSTILE_SECRET_KEY` **sigue legible** (35 caracteres en claro), y `GITHUB_PAT` (40 caracteres) y `RESEND_API` (36) **siguen ahí y también se leen enteros**. Efecto lateral a tener presente: desde la máquina local ya no hay ninguna credencial con permiso de escritura sobre la base, así que todo `UPDATE`/`INSERT` va por el SQL Editor del dashboard.

- [x] ~~**Revisar y borrar variables sin uso en Vercel.**~~ Hecho el 28/07. `GITHUB_PAT` y `RESEND_API` borradas de los tres entornos; `vercel env ls` ya no las lista. Ninguna la usaba el código. En la misma pasada se revocaron en GitHub los **cuatro** PAT clásicos que había en la cuenta (`vercelsincexcel`, `sync-precios-admin`, `iniciotoken`, `Token_CLaude`): los cuatro con scope `repo`, sin vencimiento y marcados "Never used". El `git push` no dependía de ninguno — usa un token OAuth (`gho_`) del Credential Manager de Windows.

- [ ] **Revocar en Resend la clave que estaba en `RESEND_API`.** Borrarla de Vercel sacó la exposición, pero la clave **sigue viva en Resend**: se comprobó el 28/07 que responde 200 y que tiene **acceso total** — pudo listar todas las claves de la cuenta. Ningún código la usa (la única función que manda mail es `notificar`; `digest-clicks` no toca Resend).

  **No se pudo determinar cuál de las tres es**: Resend no expone el id dentro del token. Por fecha calza `aviso_clicks` (creada 21/03) con la variable de Vercel (creada hace 129 días = 21/03), pero es correlación, no prueba. Las otras dos son `topykly-dev` (10/07) y `Onboarding` (15/03).

  **Cómo hacerlo sin romper los avisos:** borrar la candidata en https://resend.com/api-keys y correr enseguida `herramientas/4 - Verificar avisos (SQL).bat`. Si llega el mail, era la correcta. Si no llega, generar una nueva y actualizar el secret `RESEND_API_KEY` en Supabase (Edge Functions → Secrets) y la variable homónima en Vercel. Sin esa verificación el error no se nota: `net.http_post` no bloquea el INSERT.

  Conviene rotarla igual aunque se acierte a la primera: para identificarla hubo que leer su valor.

## Encontrado de paso

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
