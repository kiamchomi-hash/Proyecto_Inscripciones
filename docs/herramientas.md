# Las verificaciones de `herramientas/` y la vigilancia de producción

Sale de `CLAUDE.md`, que sólo deja el puntero. Acá está el detalle de cada script y de los dos vigilantes.

`check` sólo mira el código. En `herramientas/` están las que miran los datos y el sitio publicado, cada una con un `.bat` (Windows) y un `.sh` (Linux) de doble clic al lado (`LEER.md` explica cada una). Los envoltorios son dos, el `.mjs` que hace el trabajo es uno solo: la lógica se toca ahí. Nada de esa carpeta entra al bundle de Next. Las tres primeras salen con código 1 si encuentran algo:

```bash
npm run auditar      # contenido faltante en Supabase (lee con la anon key, corre local)
npm run smoke        # producción: rutas, cabeceras, redirects, sitemap y peso real del HTML
npm run capturas     # PNG desktop + mobile a screenshots/<AAAAMMDD-HHMM>/
npm run seo          # informe semanal de Search Console (mide; no propone)
npm run leads        # de dónde vienen los leads: WhatsApp, formulario y Google
```

- **`auditar`** (`herramientas/auditar-contenido.mjs`) busca el desfasaje entre la base y las fuentes reales: carreras visibles sin plan de estudios (ni en la columna ni en un slide `plan_estudios`, mismo criterio que el `hasPlan` de `career-detail.tsx`), carreras sin slides —que abren una ficha vacía—, slugs duplicados, niveles desconocidos y novedades publicadas sin `imagen_url` (og:image vacío al compartir). Las carreras `proximamente` bajan a aviso: todavía no tienen temario publicado. Importa `esCarreraVisible()` del módulo real (Node 24 strippea los tipos), así que sigue sola los cambios de taxonomía.
- **`smoke`** (`herramientas/smoke.mjs`) acepta `--base=http://localhost:3000` y `--rapido` (saltea el barrido de las ~119 URLs del sitemap). Los redirects sólo se prueban contra el dominio propio. Mide el peso pidiendo a prod, no comprimiendo local: Vercel comprime el HTML al vuelo con otra calidad.
- **`capturas`** (`herramientas/capturas.mjs`) acepta `--base=`, `--rutas=/faq,/contacto`, `--solo=mobile|desktop` y `--viewport` (sólo la primera pantalla). Usa `devices['iPhone 13']` de Playwright: `chrome --headless --window-size` **no** da un viewport CSS del ancho pedido e inventa recortes falsos en móvil. Navega con `waitUntil: 'load'` porque `networkidle` nunca llega en las páginas con formulario (Turnstile deja tráfico abierto). Desde Git Bash las rutas con `/` inicial se mangean: usar PowerShell o `--rutas=faq,contacto`.

- **`seo`** (`herramientas/seo-semanal.mjs`) baja Search Console firmando un JWT con la service account de `~/.gsc/service_account.json` (la misma del MCP `gsc`), así que no agrega ninguna dependencia. Deja `herramientas/vigilancia-logs/seo-ultimo.md` con páginas cuyo CTR está por debajo de lo esperable **para su posición y para su mezcla de intención**, consultas cerca de los primeros lugares con la página que las recibe, racimos de consultas genéricas fuera del top 10, caídas de posición y URLs del sitemap sin indexar.

**Separa consultas de marca de consultas genéricas, y eso cambia todo el informe.** Quien escribe "martillero publico siglo 21" quiere 21.edu.ar: nos ve quinto y nos saltea. Medido en agosto de 2026, la marca se lleva el 78% de las impresiones nombradas y clickea a un tercio de lo que predice la curva de CTR. Sin separarlas, el informe encabezaba cada semana con nueve páginas de marca (77% a 96% de sus consultas con "siglo 21" adentro) prometiendo ~190 clics inalcanzables, y tapaba las pocas genéricas con margen. Ahora los dos factores se **miden en cada corrida** contra la curva —no hay ningún número fijo en el código— y el CTR esperado de cada página se corrige por su propia mezcla. Ojo con la muestra: Search Console anonimiza la cola larga, así que las filas nombradas cubren ~27% de las impresiones y el share de marca que sale de ahí es un techo.

Acepta `--rapido` (saltea la inspección URL por URL), `--dias=` y `--sitio=`. La ventana termina tres días antes de hoy porque GSC consolida con atraso. **Las carreras fuera de la oferta quedan afuera del informe**: redirigen a la home y está bien, pero si no se filtran copan la lista — para saber cuáles son lee la oferta vigente de Supabase. Sale con código 1 sólo ante algo roto (página caída del índice, canónica cambiada por Google, caída fuerte de tráfico), no ante una sugerencia. El criterio de qué hacer con los números lo pone el agente `estratega-seo`, que lo lee cuando se lo invoca a mano.

- **`leads`** (`herramientas/leads.mjs`) junta las tres fuentes que contestan "¿por qué no me llegan mensajes?": los clics a WhatsApp día por día (Vercel Analytics), las consultas que entraron de verdad (Supabase con el rol `cau_editor`) y el tráfico desde Google (Search Console). Cierra con el embudo: personas que entraron, que tocaron WhatsApp, cuántas desde el móvil y cuántas dejaron el formulario. Acepta `--dias=` (tope 62, que es lo máximo que la API de Vercel da con granularidad diaria) y `--sitio=`.

**El total de clics a WhatsApp no es la cantidad de mensajes esperables: el que sirve es el del móvil.** En escritorio `wa.me` abre WhatsApp Web y quien no tenga la sesión iniciada se queda en la pantalla de descarga; medido a fines de agosto de 2026, más de la mitad de los clics eran de escritorio. Por eso el desglose por dispositivo va arriba y no como un detalle.

Dos cosas más que hace solo. **Avisa que los clics se miden desde el 17/08/2026** (commit `3063530`) si la ventana empieza antes: los días anteriores figuran en cero y eso es ausencia de medición, no de gente. Y **compara los eventos `consulta` contra las filas de la tabla** — el evento se dispara sólo cuando el POST respondió ok, así que si sobran eventos hubo envíos que el visitante dio por buenos y no se guardaron, que es la firma del incidente del 23/08/2026. Antes de alarmarse: una fila de prueba borrada a mano y un envío en el borde de la ventana dan la misma diferencia (Vercel agrupa por día UTC, la tabla por timestamp), y el aviso lo dice.

Las tres fuentes usan credenciales que ya están en la máquina —el token de la CLI de Vercel (`~/.local/share/com.vercel.cli/auth.json` en Linux, `%APPDATA%\com.vercel.cli\Datauth.json` en Windows, o `VERCEL_TOKEN`), `EDITOR_DATABASE_URL` y la service account de Search Console—. **Si falta una, esa sección sale como no disponible y el resto se muestra igual**; sólo sale con código 1 si no se pudo leer ninguna. El acceso a Search Console vive en `herramientas/gsc.mjs`, compartido con `seo-semanal.mjs`: es una sola implementación del JWT.

## Vigilancia de producción: ya existe, son dos y no se duplican

**Antes de proponer cualquier monitoreo, alerta o "que avise si el sitio se cae", leer esto: está hecho.** Hay dos vigilantes, a propósito, y ninguno reemplaza al otro:

| | `app/api/vigilancia` (cron de Vercel) | `herramientas/vigilancia.mjs` (local) |
|---|---|---|
| Cuándo | cada 6 horas, declarado en `vercel.json` | cuando lo dispara el Programador de tareas |
| Dónde | en la nube, con la máquina apagada | en la máquina de casa |
| Qué mira | rutas, cabeceras, noindex, redirects y el sitemap entero | eso mismo vía `smoke`, más `deps`, `contenido` y `seo` |
| Cómo avisa | Telegram | archivo `REVISAR-SITIO.txt` en el escritorio + Telegram |

El de Vercel es el que cubre las caídas de verdad, porque no depende de que la PC esté prendida. Se autentica con `CRON_SECRET` y **con `?prueba=1` manda un aviso de prueba sin correr los chequeos**, que es la forma de confirmar que el canal de Telegram sigue vivo sin esperar a que algo se rompa. No mide el peso comprimido del HTML a propósito: eso necesita leer los bytes del socket sin descomprimir y `fetch` descomprime solo, así que ese chequeo vive únicamente en `smoke.mjs`.

El local avisa por Telegram **sólo en los cambios de estado** (`ok → problema` y `problema → ok`), no en cada corrida: un chequeo diario que falla una semana tiene que ser un mensaje, no siete. Su chequeo `smoke` lleva `avisaVercel: true` y queda fuera del aviso, porque el cron ya manda ese mensaje — sin eso, una caída llegaría dos veces. Necesita `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en `.env.local`; si faltan, el aviso queda sólo en el escritorio y el chequeo no se rompe.

Lo que se espera de producción lo declara **un solo archivo, `lib/vigilancia-esperado.ts`**, que leen los dos (`smoke.mjs` lo carga con Node pelado, que strippea los tipos). Rutas, cabeceras, HSTS, noindex y redirects se tocan ahí y nada más: duplicar esa lista deja a uno de los dos viejo sin que nadie se entere.

Los redirects llevan un tercer campo opcional con el **código exacto**, en vez de aceptar cualquier 3xx. Se usa donde el código lo decide algo que no vive en el repo. Hoy es el apex: `next.config.ts` lo declara con `permanent: true`, pero esa regla **no se ejecuta en producción** porque Vercel tiene su propio redirect a nivel de dominio que corre en el borde antes que la app. Venía con 307 de fábrica, así que el código decía 308 y producción servía 307 desde marzo sin que ningún diff lo mostrara; se corrigió el 25/08/2026 en el panel de Vercel y quedó fijado acá para que no vuelva a pasar en silencio. **Tocarlo en `next.config.ts` no cambia nada mientras el del dominio exista.**

Para los avisos de formulario (Telegram) está `herramientas/verificar-avisos.sql`: prueba los tres triggers de una sola pasada, con los pasos separados porque `pg_net` recién despacha el pedido cuando la transacción commitea.

También en `herramientas/`, sin script npm: `generar-og.mjs` produce por cada novedad dos derivados de 1200×630 desde las fotos de `public/` — la foto limpia (`public/imagenes/novedades/<slug>.jpg`, para `imagen_url`) y la versión con el título compuesto encima (`public/imagenes/og/<slug>.jpg`, para el og:image). Depende de `sharp` (declarado como devDependency).

`generar-secretos.mjs`, sin script npm, genera los valores nuevos para rotar `REVALIDATE_SECRET` y `WEBHOOK_SECRET` y deja el SQL de `sql/2026-08-28_rotar_secretos.sql` en el portapapeles con los valores ya puestos. No los escribe en ningún archivo: el repo es público. **El orden de aplicación está en ese SQL y no es simétrico** — Vercel primero, porque un cambio de env var necesita redeploy, y el `UPDATE` del Vault inmediatamente después; al revés, o con `WEBHOOK_SECRET` fuera de orden, quedan formularios guardándose sin aviso de Telegram.

`generar-favicon.mjs`, también sin script npm, rehace `public/favicon.ico` (16/32/48) y `public/icon.png` recortando el isologo del vector `public/imagenes/imagenes_cau/siglo21-marca.svg` — el panel del "21" es un cuadrado exacto de 268 unidades ahí adentro, y el favicon es ese cuadrado con los colores invertidos. **No copiar a mano el favicon de 21.edu.ar**: el que publican es un JPEG de 48×48 con el "1" cortado y no hay versión más grande (`?width=` de HubSpot no agranda, y no tienen `apple-touch-icon` ni manifest).
