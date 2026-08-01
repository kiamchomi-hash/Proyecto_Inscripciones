# Pendientes

Última actualización: 2026-08-01

## Abierto

- [ ] **Pedirle a la universidad el plan de la Tecnicatura en Estadística Aplicada y Análisis Avanzado** (id 132). Es la única carrera visible sin temario del que agarrarse: al 29/07 no existe ni el PDF de `contenidos.21.edu.ar` ni la página en `21.edu.ar` ni una entrada en su sitemap; lo único público es un posteo del CAU Corrientes (2 años, inicio en octubre). Quedó marcada `proximamente` mientras tanto.

  **Cuando llegue el temario**, el cambio son dos cosas: cargar el slide de plan como el de Sociología y sacarle el `proximamente` —`update public.carreras set proximamente = false where id = 132;`—, que le devuelve el botón "Quiero inscribirme" y la píldora "Nueva". Ojo: si el CAU empieza a inscribir **antes** de que aparezca el plan, hay que sacar el `proximamente` igual, aunque la ficha se quede sin temario.

  (Agroinformática está en la misma situación: tiene slides pero no plan de estudios. Las dos salen como aviso, no como problema, en `npm run auditar`.)

- [ ] **Falta una foto decente de la entrada del CAU.** La única imagen del local es `public/imagenes/imagenes_cau/entrada_estetica.png`, de 475×598: estirada a 1200×630 queda blanda, y el recorte automático agarra el logo de la marquesina en vez del cartel. Hoy la usa el og de "Dónde queda el CAU Villa Lugano".

  Con una foto sacada de frente con cualquier celular actual se resuelve: hay que dejarla en `public/imagenes/imagenes_cau/` y volver a correr `node herramientas/generar-og.mjs` apuntando esa ruta en la entrada `#69` del script. La alternativa —usar el campus— se ve nítida pero no es la sede de Lugano, que es justo lo que el artículo explica.

- [ ] **Al curso de IA de Teclab le faltan precio, fechas y fotos propias.** Del contenido, la landing oficial (`teclab.edu.ar/landing/curso-profesional-ia/`) publica los cuatro ejes, la duración, la modalidad y el certificado —todo eso ya está cargado, con el SQL del 01/08— pero **no publica ni el precio ni la fecha de inicio ni el detalle de los cuatro encuentros**. Hay que pedírselos al instituto: el bot no puede cotizarlo y el modal no puede mostrar un temario que no existe.

  Las dos fotos del modal (`public/imagenes/teclab/carreras/curso-ia.webp` y `-cierre.webp`) son copias de las de Inbound Marketing: la landing no tiene fotos usables (su hero es un recorte sobre fondo liso). Se reemplazan pisando esos dos archivos, sin tocar código.

  Si algún día llega el temario por encuentro, va en `plan_estudios` **con el formato de viñetas que usa hoy** ("Cómo se cursa"), no con el de "Primer Año | 1er cuatrimestre" de las tecnicaturas: el código parsea distinto cuando `nivel = 'Teclab - Curso'`.

- [ ] **Cargar en el KB los reconocimientos oficiales que se bajaron del sitio.** `datos/fichas-sitio-oficial.json` tiene el contenido público de 61 carreras, y de ahí salen **16 reconocimientos y 12 perfiles profesionales que el KB deja vacíos**. Hoy los usa el bot, pero el KB sigue incompleto.

  No confundir con los cursos "certificado en…": acá se habla del instrumento que le da validez oficial al título, y **no siempre es el mismo**. De las 61: 51 por Resolución Ministerial, 2 por **Disposición** (Contador Público va con `DI-2025-1024-APN-SSPU#MCH` y `DI-2025-1028`, una por modalidad) y 1 por Resolución. Llamar "resolución ministerial" a una Disposición es incorrecto.

  Quedan 7 sin identificador y las 5 carreras sin página, que hay que pedirle a la universidad.

- [ ] **Cinco carreras sin página pública en 21.edu.ar.** `datos/enlaces-sitio-oficial.json` tiene 61 de 66, cada uno verificado con un pedido real. Faltan Administración Pública, Agroinformática, Responsabilidad y Gestión Social, Estadística Aplicada y Negocios Agroecológicos — tres de ellas ya documentadas más abajo como sin oferta oficial verificable.

  **El slug del sitio no se deriva del nombre del KB.** Las diferencias no siguen ninguna regla: "Desarrollos" contra "Desarrollo", "inteligencia en" contra "inteligencia de", "Venta" contra "Ventas", "Relaciones Públicas" contra "RRPP", con y sin "Universitaria", y algunos conservan las tildes en la URL (`licenciatura-en-administración`, `promoción-comunitaria-en-niñez`). Por eso hay un mapa `EXCEPCIONES` en `extraer-enlaces-sitio.mjs` que se completa a mano cuando aparece una nueva.

  Aparte: **Licenciatura en Administración** figura enlazada en el índice del sitio pero `licenciatura-en-administracion` (sin tilde) devuelve 404. El link está roto del lado de ellos; conviene avisarles.

- [ ] **El corpus del bot tiene 73 respuestas sin revisar.** De 130, hay 50 aprobadas y 7 descartadas (al 01/08). Aprobar o descartar **lo decide una persona**, no se puede automatizar: se revisan en `entrenar-bot.html` (solapa "Revisar respuestas", que esconde las ya aprobadas) y se vuelven a instalar con `aplicar-corpus.mjs --instalar`.

  El hueco grande es **Identidad Argentina: 30 de 44 intenciones sin una sola respuesta propia**, contra 5 de Teclab —que son estructurales, no faltantes— y 0 de Siglo 21. Sus carreras ya entran al entrenador desde `extraer-externos.mjs`, pero casi todas las intenciones les contestan con el texto genérico.

- [ ] **Cuatro datos institucionales sin confirmar**, que hoy el bot responde con un "lo confirmo y te aviso" en vez de inventar:

  1. La **fecha exacta de inicio del 2B** — sólo se sabe que es en octubre. El 2A arranca el 3 de agosto y ese sí está cargado. Ojo: `periodoPorDefecto()` pasa a 2B el 4 de agosto, así que a partir de ahí el bot ofrece un período cuya fecha de inicio no sabe.
  2. Si hay **becas reales** más allá del descuento por beneficio. Se mencionan programas para situaciones vulnerables y por rendimiento, sin confirmar.
  3. Las condiciones para **cursar dos carreras a la vez** (hay requisitos de avance académico).
  4. El **módulo general de requisitos y legajo** del KB (`requisitos.md`) sigue sin escribirse. Los requisitos por carrera sí están.

## Para tener presente

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

**DMARC está en `p=reject`** y hoy no lo rompe nada: desde que los avisos salen sólo por Telegram, **ningún sistema manda mails** como `@siglo21sur.com` (Email Routing sólo recibe). **Lo único que lo rompería** es configurar el Gmail para "enviar como" `contacto@siglo21sur.com`: si algún día se hace, primero hay que aflojar la política o sumar el remitente al SPF. Mejora menor pendiente: el SPF está en `~all` y podría ir a `-all`, aunque con DMARC en `reject` el margen es chico.

**Los PAT de Supabase no vencen y dan acceso a todos los proyectos de la cuenta.** Al 27/07 quedan vivos `codex-release` (`sbp_ae97…`, en uso) y `mercadolibrebot` (`sbp_bc7d…`). Conviene revisarlos cada tanto en https://supabase.com/dashboard/account/tokens y borrar el que deje de usarse.

**Resend ya no se usa acá.** Al sacar el mail quedaron sin uso la clave `Onboarding` y la variable `RESEND_API_KEY` de Vercel; el secret `RESEND_FROM` de Supabase nunca llegó a setearse. Conviene borrarlos: `topykly-dev` es del otro proyecto que comparte la cuenta y no hay que tocarla.

**Google Imágenes no es un canal que pague** — medido en GSC el 29/07: ~90 impresiones y 0 clicks en 3 meses, casi todo gente buscando el logo de la universidad. Lo barato ya se hizo (el sitemap declara las imágenes reales de cada página desde el 29/07); crear contenido visual nuevo para ese canal no se justifica. La única imagen que podría rankear con intención es una buena foto del frente del CAU, que ya está pedida arriba.


**El sitemap de 21.edu.ar no sirve para encontrar carreras de grado.** Tiene 167 páginas bajo `/carreras-y-programas/`, pero son todas cursos, certificados y diplomaturas: ninguna carrera de grado figura ahí, aunque sus páginas existan y respondan 200 (`abogacia` es el caso testigo). Cruzar contra esa lista da falsos positivos que parecen buenos —"Licenciatura en Nutrición" empareja con `certificado-en-nutricion-deportiva`—, así que **hay que verificar cada enlace con un pedido real**, que es lo que hace `extraer-enlaces-sitio.mjs`.

El índice tampoco alcanza: muestra 12 links aunque se le haga scroll, y uno de ellos (`licenciatura-en-administracion`) devuelve 404 — está roto del lado de ellos. Y los slugs llevan sufijos que no se adivinan: Comercialización es `licenciatura-en-comercializacion-marketing`.

**Las fichas del KB tienen huecos que obligan a escribir la respuesta a mano.** Además de las 20 sin resolución: **23 carreras tienen el campo `requisitos` vacío** y 4 no tienen `diferenciales`. Por eso la respuesta de requisitos del bot ya no depende del campo —el requisito general es el mismo para todas y está escrito en la plantilla— y las que sí lo necesitan son los ciclos de complementación, que piden título previo y no secundario. Esos se detectan por el "(CCC)" del nombre, porque varias fichas traen el campo vacío igual.

Cuidado también con volcar el campo crudo: el texto del KB trae pegados los rótulos de los enlaces ("…trámite previo. **Trámite secundario incompleto** Las personas que…"), que al aspirante le llegan como ruido.