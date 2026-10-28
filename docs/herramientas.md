# Las verificaciones de `herramientas/` y la vigilancia de producción

Sale de `CLAUDE.md`, que sólo deja el puntero. Acá está el detalle de cada script y de los dos vigilantes.

La auditoría ampliada (`npm run calidad`), sus comandos por área, referencias visuales,
pruebas de navegador, CI y límites están en [controles automáticos](controles-automaticos.md).

`check` sólo mira el código. En `herramientas/` están las que miran los datos y el sitio publicado, cada una con un `.bat` (Windows) y un `.sh` (Linux) de doble clic al lado (`LEER.md` explica cada una). Los envoltorios son dos, el `.mjs` que hace el trabajo es uno solo: la lógica se toca ahí. Nada de esa carpeta entra al bundle de Next. Las tres primeras salen con código 1 si encuentran algo:

```bash
npm run auditar      # contenido faltante en la base publicada (lee la D1 de producción)
npm run smoke        # producción: rutas, cabeceras, redirects, sitemap y peso real del HTML
npm run capturas     # PNG desktop + mobile a screenshots/<AAAAMMDD-HHMM>/
npm run seo          # informe semanal de Search Console (mide; no propone)
npm run leads        # de dónde vienen los leads: WhatsApp, formulario y Google
```

- **`auditar`** (`herramientas/auditar-contenido.mjs`) busca el desfasaje entre la base y las fuentes reales: carreras visibles sin plan de estudios (ni en la columna ni en un slide `plan_estudios`, mismo criterio que el `hasPlan` de `career-detail.tsx`), carreras sin slides —que abren una ficha vacía—, slugs duplicados, niveles desconocidos y novedades publicadas sin `imagen_url` (og:image vacío al compartir). Las carreras `proximamente` bajan a aviso: todavía no tienen temario publicado. Importa `esCarreraVisible()` del módulo real (Node 24 strippea los tipos), así que sigue sola los cambios de taxonomía.
- **`smoke`** (`herramientas/smoke.mjs`) acepta `--base=http://localhost:3000` y `--rapido` (saltea el barrido de las ~119 URLs del sitemap). Los redirects sólo se prueban contra el dominio propio. Mide el peso pidiendo a prod, no comprimiendo local: el borde comprime el HTML al vuelo con otra calidad.
- **`capturas`** (`herramientas/capturas.mjs`) acepta `--base=`, `--rutas=/faq,/contacto`, `--solo=mobile|desktop` y `--viewport` (sólo la primera pantalla). Usa `devices['iPhone 13']` de Playwright: `chrome --headless --window-size` **no** da un viewport CSS del ancho pedido e inventa recortes falsos en móvil. Navega con `waitUntil: 'load'` porque `networkidle` nunca llega en las páginas con formulario (Turnstile deja tráfico abierto). Desde Git Bash las rutas con `/` inicial se mangean: usar PowerShell o `--rutas=faq,contacto`.

- **`seo`** (`herramientas/seo-semanal.mjs`) baja Search Console firmando un JWT con la service account de `~/.gsc/service_account.json` (la misma del MCP `gsc`), así que no agrega ninguna dependencia. Deja `herramientas/vigilancia-logs/seo-ultimo.md` con páginas cuyo CTR está por debajo de lo esperable **para su posición y para su mezcla de intención**, consultas cerca de los primeros lugares con la página que las recibe, racimos de consultas genéricas fuera del top 10, caídas de posición y URLs del sitemap sin indexar.

**Separa consultas de marca de consultas genéricas, y eso cambia todo el informe.** Quien escribe "martillero publico siglo 21" quiere 21.edu.ar: nos ve quinto y nos saltea. Medido en agosto de 2026, la marca se lleva el 78% de las impresiones nombradas y clickea a un tercio de lo que predice la curva de CTR. Sin separarlas, el informe encabezaba cada semana con nueve páginas de marca (77% a 96% de sus consultas con "siglo 21" adentro) prometiendo ~190 clics inalcanzables, y tapaba las pocas genéricas con margen. Ahora los dos factores se **miden en cada corrida** contra la curva —no hay ningún número fijo en el código— y el CTR esperado de cada página se corrige por su propia mezcla. Ojo con la muestra: Search Console anonimiza la cola larga, así que las filas nombradas cubren ~27% de las impresiones y el share de marca que sale de ahí es un techo.

Acepta `--rapido` (saltea la inspección URL por URL), `--dias=` y `--sitio=`. La ventana termina tres días antes de hoy porque GSC consolida con atraso. **Las carreras fuera de la oferta quedan afuera del informe**: redirigen a la home y está bien, pero si no se filtran copan la lista — para saber cuáles son lee la oferta vigente de la D1 de producción. Sale con código 1 sólo ante algo roto (página caída del índice, canónica cambiada por Google, caída fuerte de tráfico), no ante una sugerencia. El criterio de qué hacer con los números lo pone el agente `estratega-seo`, que lo lee cuando se lo invoca a mano.

Los renombres se resuelven desde los redirects locales exactos de `next.config.ts`, sin duplicar la lista. `seo-rutas.mjs` consolida las dos ventanas y las consultas por destino: suma clics e impresiones, recalcula CTR y pondera posición por impresiones. Las cadenas que terminan en `/` conservan la ruta original para excluir las bajas sin atribuir su tráfico a la home. Las reglas condicionadas por host y las rutas parametrizadas no se usan como alias de contenido.

- **`leads`** (`herramientas/leads.mjs`) junta las tres fuentes que contestan "¿por qué no me llegan mensajes?": los clics a WhatsApp día por día (D1 de producción, tabla `whatsapp_clicks`), las consultas que entraron de verdad (D1, tabla `consultas`) y el tráfico desde Google (Search Console). Cierra con el embudo: personas que entraron, que tocaron WhatsApp, cuántas desde el móvil y cuántas dejaron el formulario. Acepta `--dias=` (tope 62) y `--sitio=`.

**El total de clics a WhatsApp no es la cantidad de mensajes esperables: el que sirve es el del móvil.** En escritorio `wa.me` abre WhatsApp Web y quien no tenga la sesión iniciada se queda en la pantalla de descarga; medido a fines de agosto de 2026, más de la mitad de los clics eran de escritorio. Por eso el desglose por dispositivo va arriba y no como un detalle.

Dos cosas más que hace solo. **Avisa que los clics se miden desde el 17/08/2026** (commit `3063530`) si la ventana empieza antes: los días anteriores figuran en cero y eso es ausencia de medición, no de gente. Y **compara cada consulta guardada con su aviso en el outbox** — si sobran filas, hubo envíos que el visitante dio por buenos y no se avisaron, que es la firma del incidente del 23/08/2026. Antes de alarmarse: una fila de prueba borrada a mano da la misma diferencia, y el aviso lo dice.

Las tres fuentes usan credenciales que ya están en la máquina —el acceso a la D1 por wrangler, `CF_ANALYTICS_TOKEN` en `.env.local` para las visitas y la service account de Search Console—. **Si falta una, esa sección sale como no disponible y el resto se muestra igual**; sólo sale con código 1 si no se pudo leer ninguna. El acceso a Search Console vive en `herramientas/gsc.mjs`, compartido con `seo-semanal.mjs`: es una sola implementación del JWT.

## Bing e IndexNow

ChatGPT busca sobre el índice de Bing, así que una ficha que Bing no tiene no aparece en sus respuestas aunque esté bien en Google. Desde el 20/10/2026 el sitio le avisa a IndexNow (Bing, Yandex y los demás buscadores del protocolo) cada URL que cambia:

- **Solo, en cada cambio de contenido**: ya no pasa. El `/api/revalidar` del Worker no manda IndexNow —no hay ISR ni caché que invalidar— y el aviso automático vivía en la app Next, con `VERCEL_ENV=production`, así que se fue con ella. Hoy IndexNow se avisa a mano.
- **A mano, el sitemap entero**: `npm run indexnow` (`herramientas/indexnow.mjs`), para la primera carga o después de un deploy que toca muchas páginas a la vez. `--probar` lista sin mandar. Antes de mandar confirma que la clave esté publicada, y sale con código 1 si IndexNow no aceptó.

La clave vive en `lib/indexnow.ts` y en `public/<clave>.txt`, con el mismo contenido. **No es un secreto**: el protocolo la pide pública para comprobar que el aviso viene del dueño del dominio. Cambiarla obliga a renombrar el archivo en el mismo commit; `tests/indexnow.test.mjs` falla si no coinciden.

El alta en Bing Webmaster Tools se hace importando la propiedad desde Search Console, sin verificar nada aparte.

## Publicar los precios de «Ver precio»

`herramientas/ventas/publicar-precios-d1.mjs` escribe los precios privados de **Teclab y Siglo 21** en la tabla `precios_privados` de la D1 de producción (`cloudflare/migrations/0001.sql`), que es de donde los lee «Ver precio». No cotiza: toma lo que el pipeline de precios ya resolvió —`carreras/teclab/carreras-externas.json` para Teclab y los finales verificados de `ventas/precios/2027/precios-lista-1-2027.json` para Siglo 21— y lo publica con su vigencia, el último día de la promoción. Vive en `herramientas/ventas/`, que está gitignorada como el resto del material comercial.

```bash
node herramientas/ventas/publicar-precios-d1.mjs                          # dry-run de las dos casas
node herramientas/ventas/publicar-precios-d1.mjs --casa teclab            # dry-run de una
node herramientas/ventas/publicar-precios-d1.mjs --casa todo --escribir   # escribe
```

- **Ya está enganchado en la corrida diaria** (`actualizar-todo.mjs`): Teclab publica después de su extracción y de `extraer-externos.mjs`; Siglo 21, al final de su cadena 2027 y sólo si la cobertura de finales verificados está completa. `--sin-publicar` omite las dos.
- **Correrlo a mano después de cada actualización de precios.** Si no, la API muestra los anteriores hasta que vencen y después ofrece WhatsApp. Avisa cuántas carreras ya llegan vencidas: no se escriben y la API no las muestra.
- Teclab: emparejamiento conservador con `carreras` por `nombres-carreras.mjs` contra los tres niveles de Teclab, más dos sinónimos fijos (`QA`, `Gestión de la Empresa Agraria`). Una carrera sin candidato, con dos candidatos o con el precio incompleto (sin total, sin conceptos o sin `promoHasta` válido) **no se publica** y se lista al final; en ese caso sale con código 1.
- Siglo 21: sólo finales verificados vigentes. La identidad pública manda por la ficha local cuando coincide con el catálogo; si esa ficha ya no está en el catálogo, la carrera se informa como `sin cotizar` y no frena a las demás. Dos candidatos por nombre sí son error.
- Escribe con Wrangler contra la base remota, con el `D1_PRODUCCION` (por defecto `cau-produccion`), y **verifica la lectura de vuelta**: si lo escrito no vuelve igual, sale con código 1.
- `--dry-run` (el modo por defecto) no escribe y consulta D1 para emparejar.
- Desde el 27/10/2026 los publicadores de Supabase quedaron fuera de servicio: `publicar-precios.mjs` y `publicar-precios-siglo21.mjs` conservan el parseo y la preparación que usa este script, pero su CLI ya no escribe (el proyecto viejo se dio de baja).

## Publicar sólo archivos revisados

El botón `5 - Subir cambios (deploy)` usa `herramientas/deploy.mjs`, compartido
por Windows y Linux. Selecciona archivos propios por número, muestra su diff
staged, pide confirmación y corre `npm run check` sobre una copia temporal exacta
del árbol Git, con dependencias instaladas desde su lock, antes del commit y push a
`main`. No incluye staged anterior: si lo encuentra, frena sin modificarlo.
El procedimiento y las salidas ante cancelación, fallos y commits pendientes
están en [Herramientas, sección 5](../herramientas/LEER.md#5--subir-cambios).

## Vigilancia de producción: ya existe, son dos y no se duplican

**Antes de proponer cualquier monitoreo, alerta o "que avise si el sitio se cae", leer esto: está hecho.** Hay dos vigilantes, a propósito, y ninguno reemplaza al otro:

| | `cloudflare/src/api/vigilancia` (cron del Worker) | `herramientas/vigilancia.mjs` (local) |
|---|---|---|
| Cuándo | cada 6 horas, declarado en `cloudflare/produccion/wrangler.json` | cuando lo dispara el Programador de tareas |
| Dónde | en la nube, con la máquina apagada | en la máquina de casa |
| Qué mira | rutas, cabeceras, noindex, redirects, el sitemap entero y los precios vencidos hace más de un día | eso mismo vía `smoke`, más `deps`, `contenido` y `seo` |
| Cómo avisa | Telegram | archivo `REVISAR-SITIO.txt` en el escritorio + Telegram |

El del Worker es el que cubre las caídas de verdad, porque no depende de que la PC esté prendida. Se autentica con `CRON_SECRET` y **con `?prueba=1` manda un aviso de prueba sin correr los chequeos**, que es la forma de confirmar que el canal de Telegram sigue vivo sin esperar a que algo se rompa. No mide el peso comprimido del HTML a propósito: eso necesita leer los bytes del socket sin descomprimir y `fetch` descomprime solo, así que ese chequeo vive únicamente en `smoke.mjs`.

Los precios de `precios_privados` vencen a la medianoche y la corrida diaria de la mañana los renueva, así que un vencimiento de unas horas no es un problema. El cron avisa sólo cuando el precio más nuevo de una institución lleva **más de 24 h** vencido, porque eso significa que la corrida falló más de un día seguido (`lib/vigilancia-precios.ts`). Igual que el resto de sus chequeos, repite el aviso en cada corrida mientras siga vencido.

El local avisa por Telegram **sólo en los cambios de estado** (`ok → problema` y `problema → ok`), no en cada corrida: un chequeo diario que falla una semana tiene que ser un mensaje, no siete. Su chequeo `smoke` lleva `avisaCron: true` y queda fuera del aviso, porque el cron ya manda ese mensaje — sin eso, una caída llegaría dos veces. Necesita `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en `.env.local`; si faltan, el aviso queda sólo en el escritorio y el chequeo no se rompe.

Lo que se espera de producción lo declara **un solo archivo, `lib/vigilancia-esperado.ts`**, que leen los dos (`smoke.mjs` lo carga con Node pelado, que strippea los tipos). Rutas, cabeceras, HSTS, noindex y redirects se tocan ahí y nada más: duplicar esa lista deja a uno de los dos viejo sin que nadie se entere.

Los redirects llevan un tercer campo opcional con el **código exacto**, en vez de aceptar cualquier 3xx. Se usa donde el código lo decide algo que no vive en el repo. Hoy es el apex: el borde lo resuelve antes que la app, así que el código queda fijado acá para que no cambie en silencio. En Cloudflare el apex lo redirige el Worker desde `cloudflare/src/entrega/redirects.ts`.

Para los avisos de formulario (Telegram) está el outbox del Worker
(`cloudflare/src/operativa/outbox.ts`): `npm run leads` compara las consultas con
los avisos que quedaron registrados ahí.

También en `herramientas/`, sin script npm: `generar-og.mjs` produce por cada novedad dos derivados de 1200×630 desde las fotos de `public/` — la foto limpia (`public/imagenes/novedades/<slug>.jpg`, para `imagen_url`) y la versión con el título compuesto encima (`public/imagenes/og/<slug>.jpg`, para el og:image). Depende de `sharp` (declarado como devDependency).

`npm run og:teclab` (`herramientas/generar-og-teclab.mjs`) arma la imagen para compartir de cada carrera y curso de Teclab, con su foto y su nombre: `public/imagenes/og/teclab/<slug>.jpg` y la lista `components/carreras/og-teclab.json`, que lee la ficha. Lee la base con la anon key. Una carrera fuera de la lista sigue con la portada de su familia; hay que volver a correrlo al dar de alta o renombrar una carrera de Teclab.

`generar-favicon.mjs`, también sin script npm, rehace `public/favicon.ico` (16/32/48), `public/icon.png` (48), `public/icon-192.png`, `public/icon-512.png` y `public/apple-touch-icon.png` (180) recortando el isologo del vector `public/imagenes/imagenes_cau/siglo21-marca.svg` — el panel del "21" es un cuadrado exacto de 268 unidades ahí adentro, y el favicon es ese cuadrado con los colores invertidos. **No copiar a mano el favicon de 21.edu.ar**: el que publican es un JPEG de 48×48 con el "1" cortado y no hay versión más grande (`?width=` de HubSpot no agranda, y no tienen `apple-touch-icon` ni manifest).

### Derivados de las fotos

`npm run imagenes:derivar` (`herramientas/derivar-imagenes.mjs`) genera las versiones chicas de las fotos de `public/imagenes/` para que el navegador no baje una foto de 3000 px en un celular. Sale de la mano de `imageService: 'passthrough'` del adaptador de Cloudflare: ahí `next/image` es un `<img>` sin optimizador, así que hasta el 27/10/2026 las fotos de los modales se servían enteras —la peor pesaba 3,7 MB—.

- **Salida:** `public/derivados/<hash>-<ancho>.webp`, con el hash del original en el nombre. Está fuera de Git: se genera al compilar y al levantar el servidor (integración `derivadas-imagenes` de `cloudflare/astro.config.mjs`, más `predev`/`prebuild` de la raíz).
- **Manifiesto:** `lib/imagenes/derivadas.ts`, generado y **sí versionado**. Dice qué anchos existen para cada ruta; sin entrada, el componente sirve el original como siempre. `tests/imagenes-derivadas.test.mjs` falla si el manifiesto quedó viejo o si falta un archivo, así que cambiar una foto sin correr el generador no llega a producción.
- **Uso:** `components/imagenes/imagen-responsiva.tsx` arma `<picture>` con `srcset`; `lib/imagenes/responsivas.ts` resuelve la URL de un derivado para el prefetch del catálogo. Se aplica a las fotos que se ven: slides del carrusel, hero de la ficha, cierre del modal de Teclab, mosaico de `/teclab`, portada de artículos, collage de `/contacto`, entrada de clases de apoyo y navegación entre materias. Los `<Image>` que quedan son logos y SVG, donde no hay nada que ahorrar.
- **Caché:** `/derivados/*` sale `immutable` porque el nombre cambia con el contenido (`cloudflare/src/entrega/cabeceras.ts`). `/imagenes/*` sigue con un día, que es lo correcto para una ruta estable que se puede reemplazar en el lugar.
- **Detalle de las fotos:** se ofrecen 480, 960 y 1440 px, nunca se agranda, y se saltean las que pesan menos de 40 KB. Una foto chica en píxeles pero pesada (PNG de más de 120 KB) igual se convierte a webp a su ancho original.

El generador usa el `sharp` de la raíz, así que compilar `cloudflare/` requiere las dependencias de la raíz instaladas: es la misma dependencia cruzada que ya tienen Tailwind y PostCSS en ese paquete.

## Respaldo de la base

`npm run db:respaldo` (`herramientas/respaldo-d1.mjs`) exporta la D1 de producción a `cloudflare/.local/respaldos/` (fuera de Git, permisos 0700), verifica que el archivo tenga filas y borra los de más de 30 días. Usa la sesión de wrangler del perfil, así que no necesita variables de entorno.

Lo corre un timer de systemd de usuario todos los días a las 08:30 de Argentina, con `Persistent=true` para que se recupere si la PC estaba apagada. Las unidades están en `herramientas/sistema/` y no se instalan solas: el comando está en el encabezado del `.timer`. Comprobar con `systemctl --user list-timers cau-respaldo-d1.timer` y `systemctl --user status cau-respaldo-d1.service`; probar una corrida con `systemctl --user start cau-respaldo-d1.service`.

Time Travel de D1 (7 días en el plan Free) no reemplaza esta copia: vive en la misma cuenta y no se puede sacar de ahí.


## Control preventivo de secretos y archivos privados

Antes del diff, commit y push, el publicador revisa la selección Git y los
commits pendientes con Gitleaks fijado y verificado. Preparar una vez con
`npm run secretos:instalar`; revisión manual: `npm run secretos`. GitHub Actions
usa el mismo control. Alcance, bloqueos, excepciones y límites en
[Publicar sin secretos](publicacion-sin-secretos.md).

### Actualización diaria desde Linux

El flujo comercial `herramientas/ventas/actualizar-todo.mjs --auto` actualiza
Siglo 21, Teclab e Identidad. Publica los precios privados de Teclab y de Siglo 21
sólo tras una extracción y regeneración exitosas de cada casa, aunque falle otra
institución. `--sin-publicar` omite esas publicaciones.

`herramientas/ventas/programar-precios-linux.mjs --instalar` genera unidades
systemd de usuario sin activar la tarea ni guardar secretos. Se activa con
`systemctl --user enable --now cau-precios@teclab.timer cau-precios@siglo21.timer`:
Teclab e Identidad a las 09:00 de Argentina, Siglo 21 a las 10:00 (a las 09 su
planilla puede traer todavía la promoción vencida), reintento a las 14 si falla y
recuperación de una corrida pendiente al iniciar sesión (`Persistent=true`). Cada
corrida termina con un aviso de escritorio (`notify-send`).
No ejecuta con la máquina apagada ni sin sesión; no habilita linger. La prueba
real explícita es `systemctl --user start cau-precios@siglo21.service`; diagnóstico con
`journalctl --user -u cau-precios@siglo21.service --since today`. El instalador rechaza
unidades distintas en vez de sobrescribirlas. Detalles en el LEER local de ventas.

### Relevamiento mensual de la financiación de Teclab

`herramientas/ventas/relevar-financiacion-teclab.mjs` entra al Simulador de
Precios del Portal Administrativo de Teclab, elige una carrera de referencia y
lee lo que ofrece hoy: formas de pago, tarjetas, bancos, cuotas con su CFT y las
opciones de la suscripción. No recorre una lista fija y nunca toca los botones
que crean o envían algo. Toma las credenciales del portal de `.env.local` y no
las escribe en ningún lado.

Compara lo leído con la fuente privada de financiación y decide:

| Resultado | Qué hace | Salida |
|---|---|---|
| Sin diferencias | no toca nada; avisa por Telegram en una línea que sigue igual | 0 |
| Cambio conocido (tasas, CFT, bancos que cambian de grupo, aparecen o desaparecen, totales) | reescribe la fuente, regenera bot y buscador, y avisa con el resumen | 0 |
| Estructura nueva (forma de pago, tarjeta, cuotas fuera de 1, 3 y 6, opciones de suscripción) o lectura incompleta | no escribe ni publica; deja lo leído en un archivo de revisión privado y avisa con los motivos | 2 |
| Error | igual que el anterior, con el error | 1 |

Si cambiaron tasas o bancos, el aviso recuerda que el modal «Ver precio»
(`components/formularios/financiacion-teclab.ts`) repite esos datos y necesita
su propio commit y deploy: el script no toca el sitio.

```bash
node herramientas/ventas/relevar-financiacion-teclab.mjs --sin-publicar   # releva y compara, sin escribir, publicar ni avisar
node herramientas/ventas/relevar-financiacion-teclab.mjs --visible        # con ventana, para depurar
node herramientas/ventas/relevar-financiacion-teclab.mjs --carrera <nombre>
```

Lo corre una vez por mes un timer de systemd de usuario (día 1, 10:00 de
Argentina, `Persistent=true`). Las unidades viven junto al script en
`herramientas/ventas/systemd/` y no se instalan solas: el comando de
instalación está en el encabezado del `.timer`. Las funciones de lectura,
armado y comparación están cubiertas por
`herramientas/ventas/tests/relevar-financiacion-teclab.test.mjs`.
