# Notas y procedimientos operativos

Reorganizado el 30/09/2026 desde `PENDIENTES.md`, sin nuevas verificaciones técnicas ni comerciales. Las fechas, cifras, versiones y estados que siguen son los registros originales, no una confirmación de su vigencia. Ante contradicciones, comprobar el estado actual y consultar [los criterios de trabajo](criterios.md).

[Volver a los pendientes](../PENDIENTES.md).

## Antes de usar un procedimiento

Este documento conserva las notas originales completas, incluidos incidentes resueltos, límites y recomendaciones pendientes. No confirma que las credenciales, configuraciones o cifras antiguas sigan vigentes. Leer `CLAUDE.md` y el procedimiento específico de `sql/` antes de modificar servicios o datos. El SQL de prueba produce escrituras y avisos reales; esta reorganización no lo ejecutó.

## Registro trasladado

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

**Registro antiguo de pedidos a terceros (no enviar sin depurar)** en `herramientas/pedidos-a-enviar.md`: uno a la universidad (plan de Estadística Aplicada, las 5 carreras sin página, el link roto, la fecha del 2B, becas y doble carrera) y otro a Teclab (precio, fecha, temario y fotos del curso de IA). Cada uno trae abajo la tabla de dónde va cada dato cuando llegue la respuesta. Actualización del 30/09/2026: Estadística y varios enlaces ya se resolvieron; usar sólo las consultas abiertas en [PENDIENTES.md](../PENDIENTES.md) y [su detalle](pendientes-detalle.md), no reenviar el pedido antiguo completo.

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

**Los planes de Identidad Argentina se van a volver a desfasar.** Las fichas de convenio se regeneran solas desde las landings, pero nada vuelca eso a Supabase: la carga es manual. Al 28/07 están al día contra las fichas de `carreras/identidad/fuentes/fichas-diplomaturas/`. Dos decisiones quedaron abiertas ahí: los módulos 2 a 6 de Bienestar Integral no tienen título en la ficha (dice literal "MÓDULO 2") y se conservaron los de la base, y Mindfulness bajó de 8 módulos a los 4 de la ficha.

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
