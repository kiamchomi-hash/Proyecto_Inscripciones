# Criterios de trabajo

Lo que se decidió una vez y no hay que volver a discutir, y lo que ya costó
descubrir. Vivía en la memoria de Claude Code, que es por herramienta y por
máquina: no la ve Codex y no cruza a Linux. Acá lo ven los dos y viaja por git.

`CLAUDE.md` y [`AGENTS.md`](../AGENTS.md) explican **cómo funciona el proyecto**;
esto es **cómo se trabaja en él**. `PENDIENTES.md` es otra cosa: el backlog vivo.

## Cómo escribir

### Las respuestas van cortas

Nada de tablas de estado, resúmenes de lo que quedó hecho ni párrafos
descriptivos. Una o dos líneas: si funcionó o, si no, qué falta. Los detalles van
al archivo —`LEER.md`, un comentario en el código— y no al chat.

Trabaja mientras atiende leads: un mensaje largo lo obliga a buscar adentro el
único dato que importa. Lo que **sí** hay que reportar siempre es lo que falló y
lo que se rompió; eso no es verbosidad.

### Revisar antes de preguntar

Si el dato está en Vercel, en el sitio publicado, en git o en la base, se mira.
Las credenciales están puestas justo para eso. El menú de opciones le pide
exactamente lo que no tiene: trabaja solo y muchas veces no se acuerda del
detalle.

Y si no queda rastro, decirlo así: «no está configurado; si fue una acción de una
sola vez, no deja huella» es una respuesta útil. «¿Qué era?» a secas, no.

### Nada de puntuación decorativa en lo que se copia y pega

En mails a leads y mensajes de WhatsApp: nada de viñeta al medio (`·`), guión
largo, comillas tipográficas ni flechas. Van coma, punto, guión común y saltos de
línea. Su consola reemplaza esos caracteres por `?` al copiar, y el mensaje llega
roto al destinatario.

Las tildes y la `ñ` sí van. Y esto **no** aplica a los archivos del repo, donde el
guión largo es el estilo de la casa.

### Las notas de trabajo no van en la pieza

En lo que ve alguien más —video, folleto, placa, landing— no entra nada que sea
una nota de trabajo. Las dos formas en que ya se coló:

- **La instrucción del pedido convertida en copy.** El pedido fue «destacá las
  fuertes de cada área» y en pantalla quedó rotulado *«Una fuerte de cada área»*.
  El que mira no tiene por qué leer el criterio de armado.
- **Marcadores de dato faltante.** Una escena mostrando *«PENDIENTE: profesiones,
  horarios y precio»*.

Si falta un dato, el elemento se muestra **sólo con lo que sí es cierto** y la
bajada se omite: ni frase de relleno ni placeholder. El pendiente se lleva en el
mensaje al usuario. Un marcador interno ahí no se lee como «falta un dato», se lee
como que la pieza está sin terminar.

### El hero va con imágenes, no con un bloque de texto

Kicker + titular + bajada + dos botones es «mucho texto» aunque cada línea sea
corta, y el hero tampoco tiene que ocupar la pantalla entera. Va la marca, **un
solo** titular corto y el CTA; la bajada se reemplaza por prueba visual —fotos
reales, tira de logos, un patrón en CSS—. Alto: alrededor de la mitad del
viewport. El material casi siempre ya existe en `public/imagenes/`: mirar antes de
inventar.

### Las zonas vacías se llenan con gráfica, no con más texto

Cuando una escena queda bien de contenido pero «se siente vacía», el pedido no es
agrandar la tipografía ni sumar copy: van elementos anclados a los bordes —rieles,
marca, numeral índice, reglas— del mismo lenguaje óptico que ya usa la pieza, y
montados **una vez para todo el bloque**, no dentro de cada ficha (si entran en
cada corte, parpadean). Que aporten algo que la escena no dice, no adorno suelto.

### Cada trabajo deja sus enlaces

Al terminar, un archivo con **los links que se usaron** (`referencias/AAAA-MM-DD-<tema>.md`).
No es un resumen de lo hecho: es la lista de links, una línea por cada uno con qué
se tomó de ahí. Lo descartado también va, con el motivo. Los abre para guardarse
lo que le sirve en su UIverse local (`~/Desktop/uiverse`), así que las piezas de
UIverse van con su URL de `uiverse.io`, no con la ruta local.

## Decisiones tomadas: no volver a proponerlas

### El OWASP Core Ruleset de Vercel no se paga

Decidido el 08/08/2026. Vercel lo cobra por request inspeccionado y el valor
marginal acá es bajo: no se arma SQL a mano en ningún lado (todo va por PostgREST
parametrizado), el HTML de novedades pasa por `lib/sanitize-content.ts`, hay CSP
completa en `next.config.ts` y no hay stack PHP/Java contra el que apunten las
firmas de LFI/RFI. El escaneo genérico ya lo corta el firewall de plataforma, que
es gratis. No reproponerlo salvo que cambie el modelo de datos.

Ojo con el diagnóstico: la API devuelve los grupos `crs` con `active: true`, pero
**eso no significa que estén evaluando** — el ruleset está apagado a nivel
proyecto, y modificarlo responde `401 OWASP Core Ruleset must be enabled`.

### Identidad Argentina se migra a otro sitio

Decidido el 23/08/2026: su oferta no lleva página propia en `siglo21sur.com`. **No
hacer un `/identidad`** — ya se descartó. Mientras la migración no ocurra, sus
diplomaturas siguen en el catálogo de la home y se preinscriben desde ahí.

Cuando se haga, en este repo hay que desarmar la categoría `identidad_argentina`
del catálogo, `components/index/ia-modal.tsx`, la casa `identidad` de
`components/formularios/casas.ts`, las diplomaturas del buscador del formulario y
sus URLs del sitemap.

**Tampoco hace falta un `/siglo21`:** la home ya *es* esa página —su `<title>` y su
canónica lo son— y duplicarla partiría el tráfico de la página más fuerte del
sitio en plena campaña de indexación. La única landing por casa que se justifica
es `/teclab`, porque es otra marca con otra oferta.

### La rama `programas-posgrado` está frenada a propósito

El soporte para publicar las 171 fichas de posgrado está entero y verificado en la
rama local `programas-posgrado` (commit `c4ea1b0`), sin mergear y sin pushear. El
freno es de negocio, no técnico: son 171 páginas nuevas de golpe sobre un sitio de
119 URLs, con una campaña de indexación en curso. **No proponer retomarlo por
iniciativa propia.**

Si el usuario lo levanta: `git merge programas-posgrado` **y además** correr
`sql/2026-08-10_alta_programas.sql` en el SQL Editor, que es lo que crea las filas
—sin eso `/programas` sale vacía—. La rama es local: no viaja a Linux por git ni
por `entorno.mjs`.

### Dos carreras están apagadas a propósito

No proponer reactivarlas ni completarles el plan de estudios:

| Carrera | Desde | Por qué |
|---|---|---|
| Lic. en Agroinformática | 03/08/2026 | el CAU no la dicta |
| Tec. Sup. en Venta Directa | 07/08/2026 | Teclab dejó de dictarla |

Las dos con `activa = false` en Supabase y un 301 a la home en `next.config.ts`.
Traían algo de tráfico, pero es tráfico que no se puede vender: que redirijan a la
home está bien y **no es un problema a reportar** en el informe de Search Console.

Venta Directa además **el corpus del bot la reponía sola**, porque el simulador de
precios de Teclab la sigue cotizando: para eso está la lista `TECLAB_FUERA_DE_OFERTA`
en `herramientas/ventas/extraer-externos.mjs`. Si mañana se da de baja otra, el
lugar es esa lista — sacarla del JSON generado no alcanza.

## El entorno: lo que ya costó descubrir

### El plan de Vercel es del team, no de la cuenta

El team **IUY's projects** (`iuys-projects-18eed4e5`) está en **Pro** desde el
06/08/2026, y ahí vive `proyecto-inscripciones` → `www.siglo21sur.com`. La cuenta
personal sigue en hobby y no tiene proyectos. De Pro salen el cron cada 6 h (hobby
permite uno por día), los runtime logs de un día en vez de una hora, el WAF con
reglas propias y el uso comercial, que hobby no permite.

Cambiar una env var **no** afecta a los deployments existentes: hay que redeployar
con `npx vercel redeploy <url> --target production`. Nunca `vercel --prod`, que
subiría el working tree con los cambios sin commitear.

### El `deny` del WAF bloquea el sitio entero

Probado en producción: una regla de rate limit con condición sobre
`/api/formularios` y mitigación `deny` deja a esa IP afuera de **todo** el sitio,
no sólo de la ruta que la disparó. Y el público del CAU entra mucho desde móvil,
donde el CGNAT de las operadoras hace que muchos compartan una IP pública: con
`deny`, un solo bot dejaba afuera a todos.

Para reglas sobre formularios va `challenge` con duración corta (1 m). Dos
trampas más: `--rate-limit-action` se ignora en `vercel firewall rules edit` (hay
que pasar el rule completo con `--json`), y a una IP ya bloqueada no la liberan ni
`rules disable` ni `publish` — hay que esperar la duración o
`vercel firewall system-bypass add <ip>`.

### Nunca disparar un evento de analytics contra producción

**No se puede borrar.** Vercel no tiene endpoint ni botón para purgar eventos, y
lo único que los saca es apagar y prender Web Analytics, que borra el historial
entero del proyecto. Ya quedó un evento `whatsapp` de prueba adentro.

El `track()` se prueba en local (el paquete loguea en consola en vez de mandar) o
contra un preview. Detalle que confunde: el script arranca descartando a
`navigator.webdriver` y a los user agents con `Headless`, así que **desde
Playwright no manda nada y la medición parece rota aunque esté bien**.

### El mail del dominio sale por SMTP2GO

`inscripciones@siglo21sur.com` se contesta desde el Gmail de siempre con el «enviar
como» apuntando al relay SMTP2GO. Cloudflare Email Routing maneja **sólo la
entrada**: los MX no cambiaron.

Con DMARC en `p=reject` y sin DKIM propio, el «enviar como» de Gmail a secas
rebota, y agregar `include:_spf.google.com` al SPF no arregla nada — el SPF se
evalúa sobre el dominio del sobre, no sobre el del `From:`. La alineación la da el
return-path de SMTP2GO. Los tres CNAME en Cloudflare **van con la nube gris**:
proxeados, el return-path devuelve IPs de Cloudflare y el DMARC deja de alinear.
El detalle completo está en `PENDIENTES.md`. Ningún código del sitio manda mails.

### Abrir una URL en Windows va por `explorer`

Va `spawn('explorer', [url], { detached: true, stdio: 'ignore' }).unref()`, y no
`start` a través de `cmd /c`: Node escapa los argumentos al armar la línea de
comandos de Windows y el par de comillas que `start` pide como título de ventana
le llega escapado, con lo que `start` parsea mal y **pierde la URL**. El navegador
abre en Google y parece que lo hizo porque sí. Pasó en
`herramientas/ventas/servidor-buscador.mjs`.

De paso, `explorer` reusa el navegador ya abierto en vez de levantar una ventana
nueva. Sale con código distinto de cero aunque haya andado bien, así que no hay
que chequearle el exit code.

### El video institucional está fuera del repo

Es un proyecto Remotion aparte en `~/Desktop/remotion-cau-villa-lugano`, **sin
git**: los cambios no se pueden revertir y para eso hay una carpeta `respaldo/`.
`src/guion.jsx` es la fuente de verdad — el array `bloques` define las doce partes
con su duración, y de ahí salen solas la composición completa y una por parte. **No
agregar composiciones a mano en `index.jsx`**: las que había tenían los segundos de
arranque copiados y quedaban viejas al primer reajuste del guion.

Y cuando dice «tengo un video hecho en render», quiere el video como **referencia
estética** para construir píldoras, tarjetas y modales — no embeber el mp4. Así
salieron el amarillo/azul de `ia-modal.tsx` y el cian/violeta de Teclab: se abren
los `out/*.png` y el `src/styles.css` del proyecto de Remotion y se traduce a CSS.
No hace falta correr Remotion.
