# Ventana de corte a Cloudflare

Plan reversible para pasar `www.siglo21sur.com` de Vercel al Worker de Cloudflare.
No se ejecutó nada de esto: el dominio sigue apuntando a Vercel.

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

- **DNS:** volver `www` a `cname.vercel-dns.com` y la raíz a `76.76.21.21`. Con
  TTL automático el retorno es rápido, pero conviene bajar el TTL a 60 s el día
  anterior.
- **Worker:** cada deploy deja versión y deployment anteriores.
- **Datos:** el rollback de DNS **no** revierte lo escrito en D1. Exportar antes y
  reconciliar lo nuevo; nunca pisar filas.
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
