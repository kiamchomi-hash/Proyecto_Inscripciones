# Notas y procedimientos operativos

Reorganizado el 30/09/2026 desde `PENDIENTES.md`, sin nuevas verificaciones técnicas ni comerciales. Las fechas, cifras, versiones y estados que siguen son los registros originales, no una confirmación de su vigencia. Ante contradicciones, comprobar el estado actual y consultar [los criterios de trabajo](criterios.md).

[Volver a los pendientes](../PENDIENTES.md).

## Notas vigentes

**El reparto de WhatsApp mandó la mitad de las consultas a un número que ya no atiende, del 14 al 17/08/2026.** El commit `85ad379` repartía los clics entre dos asesores y quedó vivo en producción después de que Viviana dejara de atender: el HTML mostraba siempre el número del CAU, pero el JS sorteaba en el clic y a la mitad de los visitantes los mandaba al otro. Peor, el sorteo se guarda en `localStorage` bajo `cau-asesor`, así que el que caía ahí le seguía escribiendo cada vez que volvía. Arreglado y deployado el 17/08 (`3063530`): queda un solo asesor y los índices viejos guardados en el navegador caen fuera de rango y se descartan solos. Verificado el 17/10/2026: unos 3 clics por día sostenidos del 18/08 al 18/10, todos al número del CAU ([evidencia](historial-pendientes.md#whatsapp--volumen-tras-el-reparto-17102026)).

Al reactivar el reparto —descomentar una línea en `lib/whatsapp.ts`— acordarse de las dos cosas que lo hicieron invisible: el número escrito en el HTML nunca cambia, y el `localStorage` fija al visitante en el asesor que le tocó la primera vez.

**El aviso de prueba de Telegram sale del Worker y no dice nada de WhatsApp.** `GET /api/vigilancia?prueba=1` manda un mensaje sin correr los chequeos, con las variables `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` que viven en Cloudflare. Sirve para confirmar que el canal sigue vivo y para ver cómo se ve el mensaje. **No cubre las consultas de WhatsApp**: esas van del teléfono del visitante al tuyo y no pasan por el sitio en ningún momento, así que ninguna prueba de ahí puede confirmar que estén llegando. Lo más cerca que hay de eso es el clic a WhatsApp que se mide en D1 (`whatsapp_clicks`) desde el 17/08, con el pathname de origen.

**Las dos actualizaciones que dejó la auditoría del 08/08/2026 están hechas**: Next 16.3.0 (con `eslint-config-next` y `@next/third-parties`) y Tailwind 4.3.3 (con `@tailwindcss/postcss`, `@tailwindcss/cli` y el `lightningcss` nativo que trae). Las dos fueron en su propio deploy y `npm run smoke` quedó en verde el 09/08 — rutas, cabeceras, redirects y las 115 URLs del sitemap. **El override de `postcss` se dejó**: Next pinea 8.5.23 y sacarlo bajaría desde 8.5.26; las dos están parcheadas y conviene la más nueva.

Para la próxima: **nada de `npm audit fix`**, que mete los saltos juntos de prepo y no arregla nada que no esté arreglado (`npm audit` está en 0 desde que se corrigieron los `overrides`). `sharp` está en la última y sin advisories: se deja quieto.

**La fuente buena de Identidad Argentina es `respuestas-whatsapp/*.md`, no los PDF.** Los PDF de las diplomaturas dicen "certificación nacional e internacional avalado por normas ISO 9001-2015", y eso induce a error: el ISO es el aval de calidad de la academia, no de la certificación. Lo que respalda a la certificación son dos entidades, idénticas en las 11 diplomaturas: **aval nacional de la Cámara Argentina para la Formación y Capacitación Laboral** y **aval internacional de la Organización Internacional para la Educación Permanente (OIEP)**.

Esa misma carpeta trae dos cosas más que los PDF no dicen: que **sí hay evaluación o trabajo final** (la mayoría de las actividades son multiple choice, se aprueba con 6 o más) y las reglas de trato por WhatsApp. Las clases **quedan grabadas** en Innova Virtual — no está escrito en ningún archivo, lo confirmó el CAU el 01/08/2026.

**Registro antiguo de pedidos a terceros (no enviar sin depurar)** en `herramientas/pedidos-a-enviar.md`: uno a la universidad (plan de Estadística Aplicada, las 5 carreras sin página, el link roto, la fecha del 2B, becas y doble carrera) y otro a Teclab (precio, fecha, temario y fotos del curso de IA). Cada uno trae abajo la tabla de dónde va cada dato cuando llegue la respuesta. Actualización del 30/09/2026: Estadística y varios enlaces ya se resolvieron; usar sólo las consultas abiertas en [PENDIENTES.md](../PENDIENTES.md) y [su detalle](pendientes-detalle.md), no reenviar el pedido antiguo completo.

**El KB quedó completo hasta donde hay fuente pública** (01/08/2026): de las 68 fichas, 65 tienen resolución y 66 perfil profesional, y las que faltan son justamente las carreras sin página en 21.edu.ar. En el mismo pase se recortó el eslogan con el que cierran los perfiles bajados del sitio —no es perfil profesional sino el CTA de la landing pegado al final— y ahí apareció que en **dos** carreras estaba mal pegado: Políticas Públicas y Gestión Contable cerraban las dos con "Ejercé el derecho con visión global", que es de Abogacía. El bot venía diciéndoselo a los aspirantes.

**El login del portal de Teclab falla cada tanto, y como la actualización es transaccional se lleva puesto el lote entero.** Pasó el 31/07/2026 en la segunda carrera (`EXTRACTOR_FAILED: El inicio de sesión no avanzó`) y al día siguiente las 18 salieron a la primera. No es un pipeline roto: es un login intermitente. El 01/08 se le agregaron **3 intentos con 20 s de espera** por carrera (`EXTRACTOR_ATTEMPTS` en `update_teclab_prices.py`).

No hay que "seguir de largo" con 17 carreras: el script es transaccional a propósito —si una falla no toca las guías vigentes— y una extracción parcial dejaría los mensajes de WhatsApp y los HTML mezclando dos corridas. Log en `price-automation/logs/precios_<fecha>.log`.

**El captcha no se puede probar automatizado.** Cloudflare no emite token para un navegador manejado por Playwright, ni headless ni con ventana visible. El chequeo rápido del vencimiento es mirar el **desmarque**: pasados los 300 s el checkbox se vacía solo y el botón se apaga; no hace falta llegar a enviar. El iframe del widget mide 71 px y monta después del `load`, pero desde el 29/07 el contenedor de `components/turnstile-widget.tsx` reserva esa altura, así que ya no mueve el layout (en local no se renderiza: falta `NEXT_PUBLIC_TURNSTILE_SITE_KEY`).

**`openGraph` dentro de un `generateMetadata` reemplaza al del layout, no lo completa** — por eso el fallback global no alcanza para las páginas que declaran el suyo. Lo mismo con `twitter:image`, que además gana sobre `og:image` cuando está presente. Las compuestas se sirven por convención de ruta desde `/imagenes/og/<slug>.jpg` y no están en la base, así que `npm run auditar` las chequea contra el disco: un artículo nuevo sin generar dejaría el og en 404 sin que nada lo delate.

**Sociología (131) conserva el plan cargado, pero ya no forma parte de la oferta visible.** El 30/07/2026 se comprobó que su ficha pública devuelve 404, no aparece en el catálogo ni en el sitemap oficial y la ficha vigente de Relaciones Internacionales ya no la ofrece como doble titulación. Por eso quedó con `activa = false`. Los datos y las 11 materias adicionales se conservan por si la Universidad vuelve a abrirla; no hay que borrar el bloque `extras`.

**Cuatro carreras quedaron restringidas por falta de una oferta oficial verificable al 30/07/2026.** Administración Hotelera (63) y Sociología (131) están inactivas; Administración Pública (68) y Negocios Agroecológicos (110) siguen visibles como `proximamente`, sin inscripción directa. Administración Pública no debe enlazarse a Licenciatura en Administración: son títulos y planes distintos. Negocios Agroecológicos también conserva `nueva = true`, de modo que al confirmarse la apertura basta con quitarle `proximamente`.

**Hay un hueco en los datos de clicks entre el 22 y el 29/07.** `/api/track-click` fallaba en silencio —devolvía `{"ok":false}` con status 200— porque la tabla `career_clicks` y su RPC no existían. No se puede reconstruir.

**DMARC está en `p=reject` y desde el 09/08/2026 sí sale mail del dominio**: `inscripciones@siglo21sur.com` se contesta desde el Gmail de siempre, pero el envío pasa por el relay de **SMTP2GO**, que firma DKIM con `d=siglo21sur.com`. Verificado con mail-tester el mismo día: 10/10, SPF + DKIM + DMARC alineados. La entrada la sigue manejando Cloudflare Email Routing (los MX no cambiaron); el relay es sólo salida.

  El **SPF raíz no se tocó** —sigue `v=spf1 include:_spf.mx.cloudflare.net ~all`— y no hay que agregarle `_spf.google.com`: eso no serviría de nada, porque DMARC exige que el dominio autenticado coincida con el del `From:`, y en un Gmail común el sobre sale como `@gmail.com`. La alineación la da el return-path de SMTP2GO, que vive en un CNAME del propio dominio. Los tres CNAME están en Cloudflare y **van con la nube gris**: proxeado, el return-path devuelve IPs de Cloudflare y el DMARC deja de alinear.

  | Nombre | Destino | Para qué |
  |---|---|---|
  | `em776964` | `return.smtp2go.net` | return-path — es el que alinea el DMARC |
  | `s776964._domainkey` | `dkim.smtp2go.net` | DKIM |
  | `link` | `track.smtp2go.net` | tracking de links |

  La credencial del SMTP User de SMTP2GO la guarda Gmail en el "enviar como"; **no va en `.env`**. El SPF se queda en `~all` a propósito: [decidido el 18/10/2026](criterios.md#el-spf-se-queda-en-all).

**Google Imágenes no es un canal que pague** — medido en GSC el 29/07: ~90 impresiones y 0 clicks en 3 meses, casi todo gente buscando el logo de la universidad. Lo barato ya se hizo (el sitemap declara las imágenes reales de cada página desde el 29/07); crear contenido visual nuevo para ese canal no se justifica. La única imagen que podría rankear con intención es una buena foto del frente del CAU, que ya está pedida arriba.


**El sitemap de 21.edu.ar no sirve para encontrar carreras de grado.** Tiene 167 páginas bajo `/carreras-y-programas/`, pero son todas cursos, certificados y diplomaturas: ninguna carrera de grado figura ahí, aunque sus páginas existan y respondan 200 (`abogacia` es el caso testigo). Cruzar contra esa lista da falsos positivos que parecen buenos —"Licenciatura en Nutrición" empareja con `certificado-en-nutricion-deportiva`—, así que **hay que verificar cada enlace con un pedido real**, que es lo que hace `extraer-enlaces-sitio.mjs`.

El índice tampoco alcanza: muestra 12 links aunque se le haga scroll, y uno de ellos (`licenciatura-en-administracion`) devuelve 404 — está roto del lado de ellos. Y los slugs llevan sufijos que no se adivinan: Comercialización es `licenciatura-en-comercializacion-marketing`.

**Las fichas del KB tienen huecos que obligan a escribir la respuesta a mano.** Además de las 20 sin resolución: **23 carreras tienen el campo `requisitos` vacío** y 4 no tienen `diferenciales`. Por eso la respuesta de requisitos del bot ya no depende del campo —el requisito general es el mismo para todas y está escrito en la plantilla— y las que sí lo necesitan son los ciclos de complementación, que piden título previo y no secundario. Esos se detectan por el "(CCC)" del nombre, porque varias fichas traen el campo vacío igual.

Cuidado también con volcar el campo crudo: el texto del KB trae pegados los rótulos de los enlaces ("…trámite previo. **Trámite secundario incompleto** Las personas que…"), que al aspirante le llegan como ruido.
