# Ventana de corte a Cloudflare

Plan reversible para pasar `www.siglo21sur.com` de Vercel al Worker de Cloudflare.
**Ya se ejecutó**: el dominio apunta al Worker desde el 27/10/2026. Lo verificado
está al final, en «Estado real del corte». El plan se conserva como rollback.

Datos del terreno (verificados el 26/10/2026):

- La zona `siglo21sur.com` **ya está en Cloudflare** y activa, con DNS propio. El
  corte es un cambio de registros dentro de la misma zona, no una migración de
  nameservers.
- Hoy: `www` → CNAME `cname.vercel-dns.com` y raíz → A `76.76.21.21`, las dos
  **sin proxy** y con TTL automático.
- El Worker de producción ya está publicado en
  `cau-produccion-20261026.kiamchomi.workers.dev` con la base productiva.

## Lo que falta antes de abrir la ventana

1. **Secretos de canal en el Worker de producción.** Sin `SMTP2GO_API_KEY` y
   `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`, una consulta se guarda pero el aviso
   queda pendiente y la newsletter no sale. `CRON_SECRET` es obligatorio antes de
   activar cualquier cron.
2. **Activar `triggers.crons` con los emisores viejos apagados al mismo tiempo**
   (Vercel y `pg_cron` de Supabase). Hoy están vacíos: sin apagar los otros, se
   duplican newsletter, recordatorio y resumen de clics.
3. **Origen de «usuarios activos»** del resumen diario: salía de Vercel Analytics.
   Sin decisión, esa línea no se envía.
4. **Comprobar el captcha real** en el dominio, con token de un solo uso,
   `hostname` y `action` correctos. En `workers.dev` no se puede por diseño.
5. **Decidir qué pasa con las consultas que hoy entran a Supabase** durante la
   transición: el destino nuevo arranca vacío y no se migra historial privado.

## Orden del corte

| # | Paso | Verificación | Reversión |
|---|---|---|---|
| 1 | Registrar los registros DNS actuales (ya están arriba) | diff con la zona | — |
| 2 | Publicar el Worker con secretos de canal y `CRON_SECRET` | `/api/estado` y un POST inválido 403 | redeploy anterior |
| 3 | Adjuntar `www.siglo21sur.com` como dominio del Worker | HTTPS válido, `Age`/cabeceras del sitio | quitar el dominio |
| 4 | Probar en el dominio real: home, carrera, novedad, formulario con captcha, aviso recibido | rutas 200, formulario 201 + aviso, sin duplicados | volver DNS a Vercel |
| 5 | Cambiar la raíz para que redirija a `www` (o servirla con el Worker) | `301` apex → www | restaurar A |
| 6 | Apagar crons de Vercel y `pg_cron` en el mismo momento en que se activan los de Cloudflare | una sola corrida por tarea | reactivar los viejos |
| 7 | Vigilar 24–48 h: Search Console, errores 5xx, avisos, colas y DLQ | sin caída de indexación ni avisos perdidos | rollback completo |

## Rollback

- **DNS:** ya no vuelve a Vercel. El proyecto se dio de baja el 27/10/2026 y
  `vercel.json` se retiró del repo, así que los registros `cname.vercel-dns.com`
  y `76.76.21.21` de más arriba quedan sólo como historia del corte.
- **Worker:** cada deploy deja versión y deployment anteriores.
- **Datos:** volver a una versión anterior del Worker **no** revierte lo escrito
  en D1. Exportar antes y reconciliar lo nuevo; nunca pisar filas.
- **Efectos:** un aviso enviado no se deshace y un ambiguo no se reintenta solo.

## Qué no se puede afirmar todavía

- No está probado el captcha real en el dominio.
- La newsletter y el recordatorio nunca corrieron desde Cloudflare con datos
  reales: sólo tienen pruebas locales.
- El envío real de correo se probó con un transporte acotado de staging, no con el
  flujo completo de una consulta en producción.
- Vercel y Supabase **no** se cancelan en el corte: eso es una etapa posterior, con
  verificación de independencia y su propia autorización.

## Ejecución preparada (26/10/2026)

Script privado `.local/produccion/corte.mjs`:

- **Sin banderas** imprime el plan y no toca nada.
- **Con `--ejecutar`** respalda los registros actuales en `dns-antes-del-corte.json`
  (0600), baja el TTL a 60 s, agrega `www` como dominio propio del Worker,
  despliega y verifica `/`, `/faq` y `/sitemap.xml` por HTTPS.

La ejecución requiere autorización explícita del cambio de DNS. Después del corte
y de la prueba real de captcha, apagar los crons de Vercel y el `pg_cron` de
Supabase **en el mismo momento** en que se activan los de Cloudflare.

Reversión: restaurar los dos registros guardados en `dns-antes-del-corte.json`.

## Estado real del corte (verificado el 27/10/2026)

Lo que sigue se comprobó desde afuera, con el MCP de Cloudflare y `npm run smoke`.
No es el plan: es lo que está pasando.

- `www.siglo21sur.com` **y** `siglo21sur.com` son Workers Custom Domains de
  `cau-produccion-20261026` (`environment: production`, `enabled`). Las rutas de
  zona (`/workers/routes`) siguen vacías: el dominio entra por Custom Domain, no
  por ruta. La raíz responde `308` a `www`.
- La publicación dejó de depender de una configuración fuera del repo: está
  `cloudflare/produccion/wrangler.json` y se publica con `npm run
  publicar:produccion` (ver [LEER.md](LEER.md#27102026--publicador-versionado)).
- Secretos cargados en el Worker: `CF_ANALYTICS_TOKEN`, `CRON_SECRET`,
  `SMTP2GO_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`,
  `TURNSTILE_SECRET_KEY`. Con eso queda cubierto el punto 1 de «Lo que falta».
- Los cinco programados de `CRONES` están declarados y activos: `*/5` (barrido
  del outbox), `0 */6` (vigilancia), `0 13` (newsletter), `0 12 * * 1`
  (recordatorio) y `0 12` (resumen diario). Es el punto 2.
- `npm run smoke` completo, sin fallos: las 11 rutas fijas en 200, cabeceras de
  seguridad y HSTS, `noindex` en `/api/formularios` y en la inscripción, los seis
  redirects con el código exacto, las 123 URLs del sitemap en 200 y la home en
  22,0 KB comprimidos (184,1 KB sin comprimir).
- `POST /api/formularios` respeta el orden documentado: `400` sin `token`, `403`
  con token inválido —ese `403` prueba que siteverify respondió y que el secreto
  está puesto; sin secreto el handler daría `503`— y `400` con `kind`
  desconocido. Es el punto 4 en su parte de configuración, no con un token real.
- Observabilidad activa con logs persistidos (`head_sampling_rate: 1`).
- Los números del panel cuadran con esta estructura: las invocaciones superan a
  los requests porque los cinco crons y el consumidor de colas no son HTTP.

Sin verificar desde acá: el captcha con un token real en el dominio, si los
emisores viejos (Vercel y `pg_cron` de Supabase) quedaron apagados, y lo que sigue
diciendo «no se puede afirmar todavía» arriba. Este registro no acredita paridad
total ni recuperación.
