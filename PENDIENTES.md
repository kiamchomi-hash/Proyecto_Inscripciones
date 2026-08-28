# Pendientes

Última actualización: 2026-08-28

## Abierto

- [ ] **La hoja de estilos viaja tres veces en el HTML de la home, y la documentación de Next promete dos.** Medido el 28/08/2026 sobre producción, con Next **16.3.0**. Los 621,4 KB sin comprimir se reparten así:

  | Parte | Peso |
  |---|---|
  | `<style>` inline | 144,6 KB |
  | dos `<script>` del payload RSC que llevan CSS adentro | 264,4 KB |
  | resto del payload RSC (datos, manifiestos) | 86,3 KB |
  | markup | 126,0 KB |

  O sea que **el 66% de la home es CSS**. Los datos de las 88 carreras, que es lo primero que uno sospecha, son apenas ~29 KB.

  Dos copias son esperadas y están documentadas: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/inlineCss.md` dice *"Styles are duplicated during initial page load — once within `<style>` tags for SSR and once in the RSC payload"*. La tercera no está documentada. Se verificó contando el arranque propio de la hoja, `:root{--cau-brand-teal`, que aparece **tres** veces en el HTML, igual que `@layer base`, `@layer theme` y `@layer utilities` — o sea tres copias completas, no una partida entre dos `push`.

  **No es para apagar `inlineCss`.** Eso ya se midió A/B y gana encendido (ver `docs/criterios.md`); el problema es la copia de más, no el inlining. Lo que corresponde es **volver a medir cuando se actualice Next** y ver si la tercera copia desapareció.

  **Cómo medirlo de nuevo**, para que el número sea comparable:

  ```bash
  curl -s -H "Accept-Encoding: identity" https://www.siglo21sur.com/ -o home.html
  grep -o ':root{--cau-brand-teal' home.html | wc -l    # cuántas copias hay
  ```

  Y para el peso por parte, contar el tamaño de cada `<style>` y de cada `<script>` según contenga o no `@layer base`. Ojo con dos trampas en las que ya caí: medir sobre el HTML escapado da números que no cierran (hay que desescapar el payload con `JSON.parse` de cada `self.__next_f.push`), y un regex con cuantificador grande se come miles de caracteres y reparte mal el peso.

  **Lo que cuesta hoy es chico y por eso no urge**: tres copias idénticas comprimen casi como una. Sacando las dos del payload y comprimiendo con la misma calidad, 52,5 KB → 43,8 KB, unos **8,6 KB sobre los 62 KB** que mide `npm run smoke` contra prod. Lo que sí importa es el efecto multiplicador: **cada KB que se agregue a la hoja de estilos cuesta 3 KB de HTML**, y eso explica el crecimiento de los 449 KB que se anotaron al medir `inlineCss` a los 621 KB de hoy.

  Ojo: `npm run smoke` imprime el peso pero **no lo puede reprobar** — no hay umbral en `herramientas/smoke.mjs`, así que un "todo verde" no dice nada sobre esto.

- [ ] **Actualizar los datos locales desde el nuevo Dashboard Comercial de Teclab.** Desde el 26/08/2026 la fuente oficial es `https://informacion.teclab.edu.ar/hubfs/ADMISION/CALIDAD%20Y%20%20TRAINING/Dashboard_Comercial_Teclab%20(Agentes).html` y reemplaza al archivo `(01).html`. El acceso visual usa las credenciales entregadas por Teclab; no versionarlas. El HTML sigue trayendo los datos embebidos y se puede bajar sin iniciar sesión.

  Cuando se haga la actualización, regenerar `carreras/teclab/dashboard-comercial.json`, `carreras/teclab/calendario-teclab.json`, `ventas/teclab-convenios.md` y cualquier respuesta del corpus afectada. Después correr los tests de ventas, la auditoría de instituciones y los dos generadores. Hasta entonces esos archivos conservan correctamente la referencia a la fuente anterior porque describen el snapshot del 15/08/2026.

- [ ] **Remedir el CTR de las 8 fichas reescritas el 10/08/2026.** Se cambió la columna `enfoque` de 8 carreras, que es de donde `descripcionSEO()` saca la primera frase de la meta descripción. Venían escritas como listado de temas ("Prevención de Riesgos, Normativas OHSAS y Ergonomía") en vez de decir qué consigue quien estudia; el informe de `npm run seo` las marcaba con CTR por debajo de lo esperable para su posición. Son los ids **86, 21, 6** (primer pase) y **76, 87, 8, 19, 65** (segundo). Verificadas en producción el mismo día: las 8 meta descriptions salieron bien.

  **Corrió por el SQL Editor, así que no hay rastro en git de este cambio** — de ahí esta entrada.

  Remedir a partir del **24/08/2026**, no antes: Google tiene que rastrear de nuevo y después hay que juntar impresiones. Comparar contra el informe del 10/08 (`herramientas/vigilancia-logs/seo-20260810.md`). Ojo con leer de más: en juego había ~55 clics/mes repartidos entre las 8, así que una diferencia chica es ruido.

  Quedan **6 carreras más con el mismo patrón** sin tocar (las que no llegaban al umbral de impresiones del informe). Si las 8 muestran mejora, van todas.

  **Marketing Digital (#223) no se toca**: su `enfoque` no es prosa sino pares clave-valor (`Modalidad:`, `Título:`, `Cocreación:`) que `parseEnfoqueTeclab()` desarma para el modal de Teclab *y* para la descripción. Reescribirlo como frase rompe las dos cosas. Vale para toda la oferta Teclab.

- [ ] **Evaluar los dos cambios de SEO del 16/08/2026.** Son dos apuestas distintas, con plazos distintos. Las dos se miden contra el informe de ese día, `herramientas/vigilancia-logs/seo-20260816.md` (264 clics, 14.248 impresiones, CTR 1,9%, posición 8,4 en la ventana 17/07 → 13/08), y contra el 108/111 de `docs/indexacion.md`. Se remide con `npm run seo` y lo interpreta el agente `estratega-seo`.

  **Los títulos (`b90ab59`).** Cuando el nombre no entra con el sufijo largo, ahora se suelta "Villa Lugano" antes que "a Distancia". Cambian 25 de las 63 fichas de Siglo 21. La hipótesis salió de Search Console a 28 días: las consultas con "siglo 21" clickean al 0-1% aunque estemos quintos, y las que dicen la carrera sola o con "a distancia" al 10-33%. **Remedir a partir del 07/09/2026**, no antes: Google tiene que rastrear las 25 fichas y después hay que juntar impresiones. Se mira el CTR de esas fichas a posición comparable, no los clics sueltos. Si el CTR no se mueve, se deja; si baja con la posición igual, se revierte, que es un solo bloque de `app/carreras/[slug]/page.tsx`.

  **Los enlaces internos (`aa4a68b`).** Las seis carreras del mismo nivel ahora rotan con el `id` en vez de ser siempre las seis primeras; el reparto de enlaces entrantes pasa de 0-34 a 3-11. **Esto se mira antes, el 30/08/2026, y no por CTR sino por rastreo**: las dos fichas que Google nunca rastreó (Videojuegos y Customer Experience) tenían dos enlaces entrantes cada una y ahora tienen más, así que la prueba es si entran al índice. **No se revierte aunque no se vea nada**: el reparto viejo dejaba 47 de las 88 fichas con tres enlaces o menos, y eso es un defecto por sí mismo.

  Va encimado con la remedición del 24/08 de las 8 `enfoque` reescritas, acá arriba. Son cambios sobre las mismas páginas: si el 07/09 el CTR de carreras mejoró en bloque, no se puede repartir el mérito entre título y descripción, y tampoco hace falta.

- [ ] **Pedirle a la universidad el plan de la Tecnicatura en Estadística Aplicada y Análisis Avanzado** (id 132). Es la única carrera visible sin temario del que agarrarse: al 29/07 no existe ni el PDF de `contenidos.21.edu.ar` ni la página en `21.edu.ar` ni una entrada en su sitemap; lo único público es un posteo del CAU Corrientes (2 años, inicio en octubre). Quedó marcada `proximamente` mientras tanto.

  **Cuando llegue el temario**, el cambio son dos cosas: cargar el slide de plan como el de Sociología y sacarle el `proximamente` —`update public.carreras set proximamente = false where id = 132;`—, que le devuelve el botón "Quiero inscribirme" y la píldora "Nueva". Ojo: si el CAU empieza a inscribir **antes** de que aparezca el plan, hay que sacar el `proximamente` igual, aunque la ficha se quede sin temario.

  Sale como aviso, no como problema, en `npm run auditar`, y desde el 03/08/2026 es **la única**: Agroinformática estaba en la misma situación —slides pero sin plan— y al apagarse dejó de contar como activa, así que la auditoría ya no la lista.

- [ ] **Falta una foto decente de la entrada del CAU.** La única imagen del local es `public/imagenes/imagenes_cau/entrada_estetica.png`, de 475×598: estirada a 1200×630 queda blanda, y el recorte automático agarra el logo de la marquesina en vez del cartel. Hoy la usa el og de "Dónde queda el CAU Villa Lugano".

  Con una foto sacada de frente con cualquier celular actual se resuelve: hay que dejarla en `public/imagenes/imagenes_cau/` y volver a correr `node herramientas/generar-og.mjs` apuntando esa ruta en la entrada `#69` del script. La alternativa —usar el campus— se ve nítida pero no es la sede de Lugano, que es justo lo que el artículo explica.

- [ ] **Al curso de IA de Teclab le faltan precio, fechas y fotos propias.** Del contenido, la landing oficial (`teclab.edu.ar/landing/curso-profesional-ia/`) publica los cuatro ejes, la duración, la modalidad y el certificado —todo eso ya está cargado, con el SQL del 01/08— pero **no publica ni el precio ni la fecha de inicio ni el detalle de los cuatro encuentros**. Hay que pedírselos al instituto: el bot no puede cotizarlo y el modal no puede mostrar un temario que no existe.

  Las dos fotos del modal (`public/imagenes/teclab/carreras/curso-ia.webp` y `-cierre.webp`) son copias de las de Inbound Marketing: la landing no tiene fotos usables (su hero es un recorte sobre fondo liso). Se reemplazan pisando esos dos archivos, sin tocar código.

  Si algún día llega el temario por encuentro, va en `plan_estudios` **con el formato de viñetas que usa hoy** ("Cómo se cursa"), no con el de "Primer Año | 1er cuatrimestre" de las tecnicaturas: el código parsea distinto cuando `nivel = 'Teclab - Curso'`.

- [ ] **Cinco carreras sin página pública en 21.edu.ar.** `datos/enlaces-sitio-oficial.json` tiene 61 de 66, cada uno verificado con un pedido real. Faltan Administración Pública, Agroinformática, Responsabilidad y Gestión Social, Estadística Aplicada y Negocios Agroecológicos — tres de ellas ya documentadas más abajo como sin oferta oficial verificable. **Son las mismas que dejan huecos en el KB**: 3 fichas sin resolución y 2 sin perfil profesional, que no se pueden completar porque no hay fuente pública.

  Pedido redactado en `herramientas/pedidos-a-enviar.md`.

  **El slug del sitio no se deriva del nombre del KB.** Las diferencias no siguen ninguna regla: "Desarrollos" contra "Desarrollo", "inteligencia en" contra "inteligencia de", "Venta" contra "Ventas", "Relaciones Públicas" contra "RRPP", con y sin "Universitaria", y algunos conservan las tildes en la URL (`licenciatura-en-administración`, `promoción-comunitaria-en-niñez`). Por eso hay un mapa `EXCEPCIONES` en `extraer-enlaces-sitio.mjs` que se completa a mano cuando aparece una nueva.

  Aparte: **Licenciatura en Administración** figura enlazada en el índice del sitio pero `licenciatura-en-administracion` (sin tilde) devuelve 404. El link está roto del lado de ellos; ya va incluido en el pedido.

- [ ] **El corpus del bot tiene 113 respuestas sin revisar.** De 184 vivas, 71 están aprobadas (Siglo 21 18/53, Teclab 35/20, Identidad 18/40, al 09/08). Aprobar o descartar **lo decide una persona**; desde el 04/08 se hace en la conversación —se lee el mensaje que salió mal, se corrige el JSON de esa casa en `ventas/corpus/` y se regeneran las dos páginas—, no en `entrenar-bot.html`.

  ~~Las 5 de Identidad que corregían una respuesta falsa~~ Aprobadas el 08/08/2026: `validez`, `requisitos`, `equivalencias`, `inscripcion` y `doble-titulacion` ya contestan con el texto propio, y en el mismo pase se le sacaron a Identidad las 7 copias universales que le hablaban al lead como si la diplomatura fuera una carrera de grado.

  **Lo que apareció al revisar el resto (09/08/2026) fue la modalidad escrita a mano**: 13 respuestas afirmaban «100% online», que es cierto en 10 de las 11 diplomaturas y falso en **Gestión de Equipos de Alto Desempeño, que es híbrida**. Corregidas: donde la frase habla de la carrera va `{modalidad}`, y donde habla de la oferta entera, «casi todas 100% online». Se aprovechó para sacar de `extranjero` un «no te piden documentación argentina» sin fuente —la preinscripción pide DNI— y para que `clases-y-examenes` diga la evaluación en vez de ofrecer confirmarla, que ya estaba documentada y la contestaba `validez`.

  Las tres que el cambio de texto había devuelto a `sin revisar` —`duracion-identidad`, `modalidad-identidad` y `doble-titulacion-identidad`— se aprobaron el 09/08 con el texto nuevo a la vista. Queda una decisión abierta: `extranjero-identidad` sigue abriendo con «Sí, podés» y para la híbrida eso es discutible, aunque la misma oración ya dice «es híbrida» y el operador la lee antes de mandarla.

- [ ] **Cuatro datos institucionales sin confirmar**, que hoy el bot responde con un "lo confirmo y te aviso" en vez de inventar:

  1. La **fecha exacta de inicio del próximo período** — el 2A ya no se comercializa y del siguiente sólo se sabe que es en octubre. Ojo: `periodoPorDefecto()` pasa al siguiente período el 4 de agosto, así que a partir de ahí el bot ofrece una apertura cuya fecha comercial exacta no está confirmada.
  2. Si hay **becas reales** más allá del descuento por beneficio. Se mencionan programas para situaciones vulnerables y por rendimiento, sin confirmar.
  3. Las condiciones para **cursar dos carreras a la vez** (hay requisitos de avance académico).
  4. ~~El **módulo general de requisitos y legajo** del KB (`requisitos.md`) sigue sin escribirse.~~ Escrito el 08/08/2026 contra el reglamento en vivo. Lo que quedó sin fuente está listado adentro: qué es la IVU en la práctica, qué materias son Universitario 21, dónde se certifica la firma y cómo se legaliza el analítico.

- [ ] **Confirmar que el sitemap ya se rehace on-demand.** El 08/08/2026 se arregló `revalidatePath('/sitemap.xml')` —iba con el tipo `'page'` y no hacía nada, así que el sitemap sólo se actualizaba en el deploy—. El fix está deployado pero sin verificar de punta a punta.

  **No hace falta esperar a un alta real.** Alcanza con tocar una carrera sin cambiarle nada y mirar si la respuesta del sitemap se rehizo, que es lo único que el fix promete:

  ```sql
  UPDATE public.carreras SET orden = orden WHERE id = 2;   -- Abogacía, no cambia nada
  SELECT id, status_code, content, created FROM net._http_response ORDER BY created DESC LIMIT 3;
  ```

  Esperado en la base: `200` con `{"ok":true,"rutas":["/","/sitemap.xml","/carreras/abogacia"]}`. Y del lado del sitio, `curl -sI https://www.siglo21sur.com/sitemap.xml`: el `Age` tiene que volver a cero y el `Last-Modified` tiene que ser el del momento. La medición del 09/08 antes de tocar nada, para comparar: `Age: 6434`, `Last-Modified: Sun, 09 Aug 2026 16:42:32 GMT`, `X-Vercel-Cache: HIT`, `Etag: "97924cf3a319dcb7287a025a06dbdc8e"` (el Etag no tiene por qué cambiar: el contenido es el mismo, lo que se verifica es que se volvió a generar).

  El secreto no se puede probar desde acá: `REVALIDATE_SECRET` está marcada Sensitive en Vercel, así que un POST directo a `/api/revalidar` no es opción y el disparo tiene que salir de la base.

- [ ] **El sitio no tiene manifest ni íconos de PWA.** Falta `public/manifest.json` con los íconos de 192×192 y 512×512, y el `<link rel="manifest">` en `app/layout.tsx`. Está frenado por lo de siempre: no hay un ícono del CAU en PNG cuadrado en esos tamaños. Prioridad baja — sin manifest el sitio se ve y se indexa igual, lo único que se pierde es el "agregar a la pantalla de inicio" con nombre e ícono propios. El service worker para cache offline es aparte y opcional.

  Venía anotado en `migracion_pendiente/pendientes-presencia-digital.md`, que se disolvió el 08/08/2026. Es lo único que quedaba de esa lista: Schema.org, las Twitter cards, los og:image y el sitemap de imágenes ya están hechos.

- [ ] **Limpiar la API key muerta de TestSprite del `~/.claude.json` de la máquina de Linux.** La cuenta se configuró allá (`/home/coco/Escritorio/Pagina_Siglo21`), así que la entrada del MCP con la key vieja quedó en ese archivo; en Windows no hay rastro. **Es higiene, no seguridad**: la key se borró en testsprite.com el 08/08/2026 y ya no sirve para nada. Se busca `testsprite` en `~/.claude.json` y se saca la entrada entera, que el servidor tampoco se usa más.

  Al pasar a esa máquina, ojo con lo otro: **hay que clonar el repo de nuevo, no hacer `pull`**. La historia se reescribió el 08/08/2026 y un pull mezcla las dos.

- [ ] **La home pesa 961 KB sin comprimir.** Lo midió `npm run smoke` el 09/08/2026 (126 KB en el cable con brotli). La última medición documentada era de 449 KB, así que más que duplicó y nadie anotó cuándo. No es una regresión conocida de nada: hay que ver qué la infló antes de tocar `inlineCss`, que ya se midió A/B y conviene dejar prendido.

- [ ] **Faltan los campos de preinscripción de Teclab y de Identidad.** El 14/08/2026 se unificaron en el corpus de Siglo 21 las dos intenciones que competían —"cómo me inscribo" contestaba una lista de cuatro datos y "quiero preinscribirme" no existía como pregunta de ejemplo, así que caía en *no entiendo* o contestaba el precio—. Quedó una sola respuesta con los **once campos** que pide el sistema de Siglo 21: nombre y apellido completos, DNI, fecha de nacimiento, localidad de nacimiento, nacionalidad, país de residencia, sexo, estado civil, mail, dirección, y barrio con código postal. Sin teléfono a propósito: el lead está escribiendo por WhatsApp.

  **Las otras dos casas tienen su propio corpus y su propia preinscripción**, y ahí la palabra sigue cayendo en cualquier lado. Hay que pedirle a cada instituto qué campos pide su formulario. Ojo con suponer que son los mismos: las dos listas que circulaban de Siglo 21 coincidían en cinco campos de trece.

  Cuando lleguen, el cambio es una intención `inscripcion` en `ventas/corpus/teclab.json` y otra en `ventas/corpus/identidad.json`, con las mismas preguntas de ejemplo que la de Siglo 21 y el listado de esa casa; después se regeneran las dos páginas (`generar-entrenador.mjs` y `generar-buscador.mjs`, siempre las dos).

- [ ] **El video institucional no se puede publicar mientras muestre Academia Identidad Argentina.** La oferta de la academia todavía no está en `main`: el sitio publicado no la tiene, así que el video mandaría a buscar en siglo21sur.com algo que ahí no existe.

  El video vive **fuera de este repo**, en `~/Escritorio/remotion-cau-villa-lugano` (Remotion, 158,5 s, 1920×1080; el render terminado es `out/cau-institucional.mp4`). La academia aparece en dos de las doce partes, que `npm run partes` lista: **`P02-oferta`**, donde es uno de los tres sellos, y **`P07-identidad`** entera, que son 23,5 s del video propio de la casa más la grilla de las 8 diplomaturas.

  **Cuando las diplomaturas entren al sitio no hay nada que hacer**: el video ya las tiene y se publica como está. Si hubiera que sacarlo antes, son dos cortes: el tercer objeto de `casas` en `src/data.js` (P02 queda con Siglo 21 y Teclab) y el bloque `P07-identidad` del array `bloques` de `src/guion.jsx` (el bloque de al lado se queda con su transición, no hay que reajustar tiempos). El institucional baja a 135 s.

## Para tener presente

**Los secretos de webhook viven en el Vault desde el 28/08/2026, y los dos se rotaron ese día.** Antes estaban escritos como literales en el cuerpo de `notify_revalidar` y `notify_edge_function`, que `pg_proc` deja leer a cualquier rol que pueda conectarse a la base — `cau_editor` incluido, que se creó justamente para no tener alcance de más. De `WEBHOOK_SECRET` había **tres** copias: los dos triggers y el `command` del job `digest-clicks-diario`, que se lo comió pegado del `format()` que lo programó. Ahora los tres lo leen de `vault.decrypted_secrets`, lo que obligó a que `notify_edge_function` pase a `SECURITY DEFINER` (el rol que hace el `INSERT` no llega al Vault), con su `REVOKE EXECUTE` al lado. El procedimiento quedó en `sql/2026-08-28_secretos_al_vault.sql` y `sql/2026-08-28_rotar_secretos.sql`, y los valores nuevos los genera `herramientas/generar-secretos.mjs`.

**Los cuatro archivos de `sql/` que definían estos triggers antes ya no reponen el literal** (28/08/2026). Era la trampa que dejaba el cambio: la convención es correr `sql/` a mano en orden de fecha, así que reaplicar cualquiera de ellos deshacía el arreglo — y `2026-07-27_webhook_notificar.sql` además le sacaba a `notify_edge_function` el `SECURITY DEFINER` que le da acceso al Vault, o sea que rompía dos cosas de un saque. Ahora los cuatro leen de `vault.decrypted_secrets`, y cada uno abre con un `DO` que **aborta con un `RAISE EXCEPTION`** si el secreto no está cargado, en vez de seguir y dejar un `Bearer ` vacío que da 401 sin que nadie se entere. El bloque de cron de `2026-07-22_clicks_carreras.sql` quedó comentado entero: nunca se ejecutó, y además programaba a las 23:00 UTC cuando el horario bueno es 12:00.

**En una base nueva el Vault se carga primero, antes que cualquier archivo de `sql/`.** Es el efecto de lo de arriba: no hay literal del que sacar el valor, así que los cuatro abortan pidiéndolo. Los dos `vault.create_secret()` que hay que correr están al principio de `sql/2026-08-28_secretos_al_vault.sql`.

**Rotar un secreto de estos tiene una ventana en la que los avisos se caen sin hacer ruido, y se vio en vivo.** El header lo manda la base y lo valida el consumidor: mientras uno tenga el valor nuevo y el otro el viejo, ese camino devuelve 401. En la rotación de `WEBHOOK_SECRET` el SQL se corrió veinte segundos antes de subir el secret, y en esos veinte segundos el `INSERT` de prueba **respondió 201 igual**, con los dos consumidores en `401 Unauthorized`. Es exactamente el modo de fallar que dejó los avisos rotos del 20 al 27/07/2026. De ahí el orden de los dos archivos: el que necesita redeploy va primero y el `UPDATE` del Vault inmediatamente después, y se verifica siempre en `net._http_response`, nunca por el código de respuesta del formulario. Conviene además hacerlo con poco tráfico: el lead se guarda igual, pero nadie se entera hasta mirar la tabla.

**El reparto de WhatsApp mandó la mitad de las consultas a un número que ya no atiende, del 14 al 17/08/2026.** El commit `85ad379` repartía los clics entre dos asesores y quedó vivo en producción después de que Viviana dejara de atender: el HTML mostraba siempre el número del CAU, pero el JS sorteaba en el clic y a la mitad de los visitantes los mandaba al otro. Peor, el sorteo se guarda en `localStorage` bajo `cau-asesor`, así que el que caía ahí le seguía escribiendo cada vez que volvía. Arreglado y deployado el 17/08 (`3063530`): queda un solo asesor y los índices viejos guardados en el navegador caen fuera de rango y se descartan solos. **Verificar a mano que el volumen de consultas por WhatsApp vuelva a lo de antes del 14/08.**

Al reactivar el reparto —descomentar una línea en `lib/whatsapp.ts`— acordarse de las dos cosas que lo hicieron invisible: el número escrito en el HTML nunca cambia, y el `localStorage` fija al visitante en el asesor que le tocó la primera vez.

**El test que quedó puesto en Vercel es de Telegram, y no dice nada de WhatsApp.** Es el aviso de prueba del cron de vigilancia (`/api/vigilancia?prueba=1`, que manda un mensaje sin correr los chequeos) apoyado en las variables `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` que están en Vercel desde el 07/08/2026. Sirve para confirmar que el canal de Telegram sigue vivo y para ver cómo se ve el mensaje. **No cubre las consultas de WhatsApp**: esas van del teléfono del visitante al tuyo y no pasan por Vercel en ningún momento, así que ninguna prueba de ahí puede confirmar que estén llegando. Lo más cerca que hay de eso es el evento `whatsapp` de Web Analytics, que desde el 17/08 cuenta los clics con el pathname de origen. Revisado el 17/08 contra la API de Vercel, no hay ninguna otra cosa puesta a modo de prueba: ni reglas de firewall de más, ni webhooks (hay uno solo, `firewall.attack` → `alerta-firewall`), ni log drains, ni integraciones, ni crons más allá del de vigilancia.

**Las dos actualizaciones que dejó la auditoría del 08/08/2026 están hechas**: Next 16.3.0 (con `eslint-config-next` y `@next/third-parties`) y Tailwind 4.3.3 (con `@tailwindcss/postcss`, `@tailwindcss/cli` y el `lightningcss` nativo que trae). Las dos fueron en su propio deploy y `npm run smoke` quedó en verde el 09/08 — rutas, cabeceras, redirects y las 115 URLs del sitemap. **El override de `postcss` se dejó**: Next pinea 8.5.23 y sacarlo bajaría desde 8.5.26; las dos están parcheadas y conviene la más nueva.

Para la próxima: **nada de `npm audit fix`**, que mete los saltos juntos de prepo y no arregla nada que no esté arreglado (`npm audit` está en 0 desde que se corrigieron los `overrides`). Tampoco tocar `@supabase/ssr` (0.9.0, rango `^0.9.0` que no sube solo: es 0.x, donde el minor *es* el breaking, y maneja las cookies de sesión de todo el panel) ni `sharp`, ya en la última y sin advisories.

**La fuente buena de Identidad Argentina es `respuestas-whatsapp/*.md`, no los PDF.** Los PDF de las diplomaturas dicen "certificación nacional e internacional avalado por normas ISO 9001-2015", y eso induce a error: el ISO es el aval de calidad de la academia, no de la certificación. Lo que respalda a la certificación son dos entidades, idénticas en las 11 diplomaturas: **aval nacional de la Cámara Argentina para la Formación y Capacitación Laboral** y **aval internacional de la Organización Internacional para la Educación Permanente (OIEP)**.

Esa misma carpeta trae dos cosas más que los PDF no dicen: que **sí hay evaluación o trabajo final** (la mayoría de las actividades son multiple choice, se aprueba con 6 o más) y las reglas de trato por WhatsApp. Las clases **quedan grabadas** en Innova Virtual — no está escrito en ningún archivo, lo confirmó el CAU el 01/08/2026.

**Los cuatro pendientes que dependen de un tercero ya están redactados** en `herramientas/pedidos-a-enviar.md`: uno a la universidad (plan de Estadística Aplicada, las 5 carreras sin página, el link roto, la fecha del 2B, becas y doble carrera) y otro a Teclab (precio, fecha, temario y fotos del curso de IA). Cada uno trae abajo la tabla de dónde va cada dato cuando llegue la respuesta.

**El KB quedó completo hasta donde hay fuente pública** (01/08/2026): de las 68 fichas, 65 tienen resolución y 66 perfil profesional, y las que faltan son justamente las carreras sin página en 21.edu.ar. En el mismo pase se recortó el eslogan con el que cierran los perfiles bajados del sitio —no es perfil profesional sino el CTA de la landing pegado al final— y ahí apareció que en **dos** carreras estaba mal pegado: Políticas Públicas y Gestión Contable cerraban las dos con "Ejercé el derecho con visión global", que es de Abogacía. El bot venía diciéndoselo a los aspirantes.

**El login del portal de Teclab falla cada tanto, y como la actualización es transaccional se lleva puesto el lote entero.** Pasó el 31/07/2026 en la segunda carrera (`EXTRACTOR_FAILED: El inicio de sesión no avanzó`) y al día siguiente las 18 salieron a la primera. No es un pipeline roto: es un login intermitente. El 01/08 se le agregaron **3 intentos con 20 s de espera** por carrera (`EXTRACTOR_ATTEMPTS` en `update_teclab_prices.py`).

No hay que "seguir de largo" con 17 carreras: el script es transaccional a propósito —si una falla no toca las guías vigentes— y una extracción parcial dejaría los mensajes de WhatsApp y los HTML mezclando dos corridas. Log en `price-automation/logs/precios_<fecha>.log`.

**Los avisos van sólo por Telegram desde el 01/08/2026,** y sólo los de los tres formularios. Se sacó el envío por mail de la Edge Function —salía del dominio compartido de pruebas de Resend, entregaba mal y nadie lo leía— y se eliminó entero `/api/notificar-carrera`, el aviso que saltaba al abrirse una ficha sin contenido: `npm run auditar` lista esas mismas carreras leyendo la base, sin esperar a que entre un visitante. Con eso se cerró también el pendiente del remitente propio, trabado por el plan free de Resend.

Consecuencia práctica: **un canal caído ahora es el canal**. La función devuelve `502` cuando Telegram rechaza el envío, justamente para que se vea en `net._http_response`. Si alguna vez hay que volver al mail o al aviso por clic, los dos están en el historial de git, hasta el commit del 01/08/2026.

**Los avisos de formularios fallan en silencio.** `net.http_post` encola el pedido sin bloquear el `INSERT`, así que la web responde `201` aunque la notificación se caiga. Fue exactamente lo que pasó del 20/07 al 27/07: el endurecimiento de seguridad le agregó validación de secreto a la Edge Function y el trigger de la base nunca se actualizó para mandarlo. (Ese corte no costó ningún lead real: la única consulta del período, `id 43`, era una prueba propia.)

Cada vez que se toque el `WEBHOOK_SECRET`, la función `notificar` o el trigger, verificar así:

```sql
INSERT INTO public.consultas (nombre, apellido, email, carrera)
VALUES ('PRUEBA', 'WEBHOOK', 'prueba@siglo21sur.com', 'Test');

SELECT id, status_code, content, created
FROM net._http_response ORDER BY created DESC LIMIT 3;

DELETE FROM public.consultas WHERE nombre='PRUEBA' AND apellido='WEBHOOK';
```

Esperado: `200` y `{"ok":true,"telegram":true}`. Un `401` significa que el secreto del trigger no coincide con el de la Edge Function; un `502`, que la función corrió bien pero Telegram rechazó el mensaje. Detalle completo en `sql/2026-07-27_webhook_notificar.sql`.

**Las Edge Functions se despliegan por CLI, nunca por el dashboard.** El deploy por dashboard deja el `slug` distinto del `name` y la URL se arma con el slug, así que la lista muestra el nombre correcto mientras la ruta devuelve 404; además queda con `verify_jwt: true`, que rechaza el `Bearer <WEBHOOK_SECRET>` del cron por no ser un JWT. Las dos cosas sólo se ven con `npx supabase functions list`. La forma buena: `npx supabase functions deploy <fn> --project-ref yuwfkdehaowkselkhtck --no-verify-jwt`.

**El captcha no se puede probar automatizado.** Cloudflare no emite token para un navegador manejado por Playwright, ni headless ni con ventana visible. El chequeo rápido del vencimiento es mirar el **desmarque**: pasados los 300 s el checkbox se vacía solo y el botón se apaga; no hace falta llegar a enviar. El iframe del widget mide 71 px y monta después del `load`, pero desde el 29/07 el contenedor de `components/turnstile-widget.tsx` reserva esa altura, así que ya no mueve el layout (en local no se renderiza: falta `NEXT_PUBLIC_TURNSTILE_SITE_KEY`).

**`openGraph` dentro de un `generateMetadata` reemplaza al del layout, no lo completa** — por eso el fallback global no alcanza para las páginas que declaran el suyo. Lo mismo con `twitter:image`, que además gana sobre `og:image` cuando está presente. Las compuestas se sirven por convención de ruta desde `/imagenes/og/<slug>.jpg` y no están en la base, así que `npm run auditar` las chequea contra el disco: un artículo nuevo sin generar dejaría el og en 404 sin que nada lo delate.

**Sociología (131) conserva el plan cargado, pero ya no forma parte de la oferta visible.** El 30/07/2026 se comprobó que su ficha pública devuelve 404, no aparece en el catálogo ni en el sitemap oficial y la ficha vigente de Relaciones Internacionales ya no la ofrece como doble titulación. Por eso quedó con `activa = false`. Los datos y las 11 materias adicionales se conservan por si la Universidad vuelve a abrirla; no hay que borrar el bloque `extras`.

**Cuatro carreras quedaron restringidas por falta de una oferta oficial verificable al 30/07/2026.** Administración Hotelera (63) y Sociología (131) están inactivas; Administración Pública (68) y Negocios Agroecológicos (110) siguen visibles como `proximamente`, sin inscripción directa. Administración Pública no debe enlazarse a Licenciatura en Administración: son títulos y planes distintos. Negocios Agroecológicos también conserva `nueva = true`, de modo que al confirmarse la apertura basta con quitarle `proximamente`.

**Los planes de Identidad Argentina se van a volver a desfasar.** Las fichas de convenio se regeneran solas desde las landings, pero nada vuelca eso a Supabase: la carga es manual. Al 28/07 están al día contra las fichas de `Desktop\Academia Identidad Argentina\fichas-diplomaturas\`. Dos decisiones quedaron abiertas ahí: los módulos 2 a 6 de Bienestar Integral no tienen título en la ficha (dice literal "MÓDULO 2") y se conservaron los de la base, y Mindfulness bajó de 8 módulos a los 4 de la ficha.

**Hay un hueco en los datos de clicks entre el 22 y el 29/07.** `/api/track-click` fallaba en silencio —devolvía `{"ok":false}` con status 200— porque la tabla `career_clicks` y su RPC no existían. No se puede reconstruir.

**DMARC está en `p=reject` y desde el 09/08/2026 sí sale mail del dominio**: `inscripciones@siglo21sur.com` se contesta desde el Gmail de siempre, pero el envío pasa por el relay de **SMTP2GO**, que firma DKIM con `d=siglo21sur.com`. Verificado con mail-tester el mismo día: 10/10, SPF + DKIM + DMARC alineados. La entrada la sigue manejando Cloudflare Email Routing (los MX no cambiaron); el relay es sólo salida.

  El **SPF raíz no se tocó** —sigue `v=spf1 include:_spf.mx.cloudflare.net ~all`— y no hay que agregarle `_spf.google.com`: eso no serviría de nada, porque DMARC exige que el dominio autenticado coincida con el del `From:`, y en un Gmail común el sobre sale como `@gmail.com`. La alineación la da el return-path de SMTP2GO, que vive en un CNAME del propio dominio. Los tres CNAME están en Cloudflare y **van con la nube gris**: proxeado, el return-path devuelve IPs de Cloudflare y el DMARC deja de alinear.

  | Nombre | Destino | Para qué |
  |---|---|---|
  | `em776964` | `return.smtp2go.net` | return-path — es el que alinea el DMARC |
  | `s776964._domainkey` | `dkim.smtp2go.net` | DKIM |
  | `link` | `track.smtp2go.net` | tracking de links |

  La credencial del SMTP User de SMTP2GO la guarda Gmail en el "enviar como"; **no va en `.env`** — ningún código del sitio manda mails. Mejora menor pendiente: el SPF podría ir de `~all` a `-all`, aunque con DMARC en `reject` el margen es chico.

**Los PAT de Supabase no vencen y dan acceso a todos los proyectos de la cuenta.** Al 27/07 quedan vivos `codex-release` (`sbp_ae97…`, en uso) y `mercadolibrebot` (`sbp_bc7d…`). Conviene revisarlos cada tanto en https://supabase.com/dashboard/account/tokens y borrar el que deje de usarse.

**Resend ya no se usa acá.** Al sacar el mail quedaron sin uso la clave `Onboarding` y la variable `RESEND_API_KEY` de Vercel; el secret `RESEND_FROM` de Supabase nunca llegó a setearse. Conviene borrarlos: `topykly-dev` es del otro proyecto que comparte la cuenta y no hay que tocarla.

**Google Imágenes no es un canal que pague** — medido en GSC el 29/07: ~90 impresiones y 0 clicks en 3 meses, casi todo gente buscando el logo de la universidad. Lo barato ya se hizo (el sitemap declara las imágenes reales de cada página desde el 29/07); crear contenido visual nuevo para ese canal no se justifica. La única imagen que podría rankear con intención es una buena foto del frente del CAU, que ya está pedida arriba.


**El sitemap de 21.edu.ar no sirve para encontrar carreras de grado.** Tiene 167 páginas bajo `/carreras-y-programas/`, pero son todas cursos, certificados y diplomaturas: ninguna carrera de grado figura ahí, aunque sus páginas existan y respondan 200 (`abogacia` es el caso testigo). Cruzar contra esa lista da falsos positivos que parecen buenos —"Licenciatura en Nutrición" empareja con `certificado-en-nutricion-deportiva`—, así que **hay que verificar cada enlace con un pedido real**, que es lo que hace `extraer-enlaces-sitio.mjs`.

El índice tampoco alcanza: muestra 12 links aunque se le haga scroll, y uno de ellos (`licenciatura-en-administracion`) devuelve 404 — está roto del lado de ellos. Y los slugs llevan sufijos que no se adivinan: Comercialización es `licenciatura-en-comercializacion-marketing`.

**Las fichas del KB tienen huecos que obligan a escribir la respuesta a mano.** Además de las 20 sin resolución: **23 carreras tienen el campo `requisitos` vacío** y 4 no tienen `diferenciales`. Por eso la respuesta de requisitos del bot ya no depende del campo —el requisito general es el mismo para todas y está escrito en la plantilla— y las que sí lo necesitan son los ciclos de complementación, que piden título previo y no secundario. Esos se detectan por el "(CCC)" del nombre, porque varias fichas traen el campo vacío igual.

Cuidado también con volcar el campo crudo: el texto del KB trae pegados los rótulos de los enlaces ("…trámite previo. **Trámite secundario incompleto** Las personas que…"), que al aspirante le llegan como ruido.
