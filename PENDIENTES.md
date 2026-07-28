# Pendientes

Última actualización: 2026-07-27

## Urgente

Nada abierto.

- [x] ~~**Revocar el PAT de Supabase `claude-fix-webhook`**~~ — al revisar la lista el 27/07 **ese token no existía**: o se revocó antes de anotarlo acá, o quedó mal el nombre. En la misma pasada se limpiaron los tokens de https://supabase.com/dashboard/account/tokens: se revocó un `codex-release` duplicado que nunca se había usado y el `claudeco` ya vencido.

  Quedan vivos `codex-release` (`sbp_ae97…`, en uso) y `mercadolibrebot` (`sbp_bc7d…`). **Ninguno de los dos vence**, y un PAT da acceso a todos los proyectos de la cuenta — conviene revisarlos cada tanto y borrar el que deje de usarse.

## Verificar

- [ ] **Confirmar el arreglo del captcha vencido.** Está desplegado (commit `4e12ea9`) pero sin probar de punta a punta. El test: abrir la home, tildar el captcha apenas cargue, **dejar la pestaña quieta 8-10 minutos** (el token de Turnstile vence a los 300 s), después completar el formulario y enviar. Antes eso daba 403 seguro.

  No se puede automatizar: Cloudflare no emite token para un navegador manejado por Playwright, ni headless ni con ventana visible.

## Seguridad — variables de entorno en Vercel

- [ ] **Rotar `TURNSTILE_SECRET_KEY` y marcarla Sensitive.** Vercel avisa que cualquiera con acceso al proyecto puede leer su valor. No hubo filtración: la clave solo se usa server-side (`lib/turnstile.ts` tiene `import 'server-only'`) y nunca entra al bundle del navegador.

  Pasos: rotar en el dashboard de Cloudflare Turnstile → borrar la variable en Vercel → volver a crearla con el check **Sensitive** → redeploy. Ojo: una vez Sensitive no se puede volver a leer nunca, y `vercel env pull` la trae censurada, así que guardarla antes en el gestor de contraseñas y pegarla a mano en `.env.local`.

- [ ] **Mismo tratamiento para `RESEND_API_KEY`.** Es igual de sensible y está como variable normal.

  `SUPABASE_SERVICE_ROLE_KEY` ya está marcada Sensitive — verificado el 27/07: `vercel env pull` la devuelve como `[SENSITIVE]`. Efecto lateral a tener presente: desde la máquina local ya no hay ninguna credencial con permiso de escritura sobre la base, así que todo `UPDATE`/`INSERT` va por el SQL Editor del dashboard.

- [ ] **Revisar y borrar variables sin uso en Vercel.** No aparecen en ningún lado del código:
  - `GITHUB_PAT` (creada hace ~120 días) — un token de GitHub en el runtime de la web. Revocarlo en GitHub, no solo borrarlo de Vercel.
  - `RESEND_API` (~127 días) — parece un duplicado viejo de `RESEND_API_KEY`, que es la que sí se usa.

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
