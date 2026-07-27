# Pendientes

Última actualización: 2026-07-27

## Urgente

- [ ] **Revocar el Personal Access Token de Supabase** — https://supabase.com/dashboard/account/tokens, se llama `claude-fix-webhook`. Se creó el 27/07 para arreglar el trigger de notificaciones y ya no hace falta. Da acceso a todos los proyectos de la cuenta.

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
