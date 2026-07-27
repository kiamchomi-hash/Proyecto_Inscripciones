# Pendientes

Última actualización: 2026-07-27

## Urgente

- [ ] **Contestar la consulta perdida** — fila `id 43` de la tabla `consultas` (27/07, 00:04, Diplomatura en Oratoria). Los datos de contacto están ahí; este repo es público, así que no van escritos acá. Es el lead que entró mientras los avisos estaban rotos y del que nunca llegó notificación.

- [ ] **Revocar el Personal Access Token de Supabase** — https://supabase.com/dashboard/account/tokens, se llama `claude-fix-webhook`. Se creó el 27/07 para arreglar el trigger de notificaciones y ya no hace falta. Da acceso a todos los proyectos de la cuenta.

## Verificar

- [ ] **Confirmar el arreglo del captcha vencido.** Está desplegado (commit `4e12ea9`) pero sin probar de punta a punta. El test: abrir la home, tildar el captcha apenas cargue, **dejar la pestaña quieta 8-10 minutos** (el token de Turnstile vence a los 300 s), después completar el formulario y enviar. Antes eso daba 403 seguro.

  No se puede automatizar: Cloudflare no emite token para un navegador manejado por Playwright, ni headless ni con ventana visible.

## Seguridad — variables de entorno en Vercel

- [ ] **Rotar `TURNSTILE_SECRET_KEY` y marcarla Sensitive.** Vercel avisa que cualquiera con acceso al proyecto puede leer su valor. No hubo filtración: la clave solo se usa server-side (`lib/turnstile.ts` tiene `import 'server-only'`) y nunca entra al bundle del navegador.

  Pasos: rotar en el dashboard de Cloudflare Turnstile → borrar la variable en Vercel → volver a crearla con el check **Sensitive** → redeploy. Ojo: una vez Sensitive no se puede volver a leer nunca, y `vercel env pull` la trae censurada, así que guardarla antes en el gestor de contraseñas y pegarla a mano en `.env.local`.

- [ ] **Mismo tratamiento para `SUPABASE_SERVICE_ROLE_KEY` y `RESEND_API_KEY`.** Son igual de sensibles y están como variables normales.

- [ ] **Revisar y borrar variables sin uso en Vercel.** No aparecen en ningún lado del código:
  - `GITHUB_PAT` (creada hace ~120 días) — un token de GitHub en el runtime de la web. Revocarlo en GitHub, no solo borrarlo de Vercel.
  - `RESEND_API` (~127 días) — parece un duplicado viejo de `RESEND_API_KEY`, que es la que sí se usa.

## Encontrado de paso

- [ ] **El digest diario de clicks nunca corre.** `sql/2026-07-22_clicks_carreras.sql` programa un `pg_cron` a las 23:00 UTC que llama a la Edge Function `digest-clicks`, pero la tabla `cron.job` está **vacía** — ese bloque nunca se ejecutó. La función está desplegada y sin nadie que la invoque.

  Si se programa, el header `Authorization` tiene que llevar el `WEBHOOK_SECRET` **nuevo** (se rotó el 27/07). El valor vigente está en el cuerpo del trigger:
  `SELECT prosrc FROM pg_proc WHERE proname = 'notify_edge_function';`

- [ ] **`components/index/teclab-modal.tsx` quedó modificado sin commitear.** Es anterior a los cambios del captcha y no tiene relación con ellos; se dejó afuera de esos commits a propósito.

## Para tener presente

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
