# Historial de pendientes cerrados

Reorganizado y depurado el 30/09/2026. Los cierres y reformulaciones indican su evidencia; las demás fechas, cifras y versiones conservan el registro original y no confirman su vigencia. Ante contradicciones, comprobar el estado actual y consultar [los criterios de trabajo](criterios.md).

[Volver a los pendientes](../PENDIENTES.md).

## Tareas del 02/10/2026 cerradas — 03 y 04/10/2026

- [x] **25. Ocultar preferentemente la ubicación en los slides de carreras**. Resuelto el 04/10/2026: se sacó el botón «Guaminí 4876» de los modales de Siglo 21 (`carousel-modal.tsx`) e Identidad (`ia-modal.tsx`); Teclab ya no lo tenía.
- [x] **31. Arreglar la alineación de las carreras en la sección del test vocacional**. Resuelto el 04/10/2026 (`24ef0cd`): el nombre de la carrera elegida va a la izquierda en un renglón y, si no entra, corre como cinta dentro de su caja.
- [x] **35. Teclab: cambiar la vista previa (OG) del enlace personalizado** (`/inscripcion/<codigo>`) que se ve al compartirlo por WhatsApp. Resuelto el 03/10/2026: título, descripción e imagen propios de Teclab (`public/imagenes/og/default-teclab-inscripcion.jpg`), iguales para todos los códigos.
- [x] **36. Activar el mail con el resumen del precio**. Resuelto el 03/10/2026: clave cargada en Vercel, redeploy hecho y mail recibido en la prueba; sale como «CAU Online». [Detalle](odd/tasks/mail-precio-teclab.md).
- [x] **37. Newsletter: mandar a cada suscripto un mail cada X días desde que se suscribe**. Resuelto el 03/10/2026 para Teclab: cron diario a las 10:00, un mail cada 7 días por suscripción, baja de un clic. Siglo 21, Identidad y las suscripciones generales quedan para más adelante. [Detalle](odd/tasks/newsletter-teclab.md).

<a id="mensajes-siglo21-2026-10-03"></a>

## Mensajes Siglo 21 — 03/10/2026

- **14, alcance Siglo 21:** agregado `retomar-panel-2` al corpus institucional. Complementa el primero con requisitos y pasos de inscripción, sin inventar fechas, cupos ni precios. Las otras casas no se modificaron; el pendiente global sigue abierto.
- **16:** corregida la bienvenida de `textos-whatsapp.md`, limitada a inscripción confirmada. Es un texto manual; no se verificó ni implementó su envío automático.
- **22:** agregado `garantia-adaptacion` a Siglo 21. General lo incorpora desde ese corpus, con la institución explícita; `comun.json`, Teclab e Identidad permanecen intactos. Se conserva la fuente de la variante anterior en `ahora-no-puedo`.

La Nube 21 y Reglamento 14.3.C coinciden: reconocimiento de matrícula y aranceles iniciales para recomenzar grado/pregrado, sin aprobación de materias ni avance del primer semestre; una vez, hasta dos años desde la matrícula inicial. Se pierden las regularidades salvo Universitario 21. No promete devolución de dinero ni aprobación automática. [Fuentes públicas comprobadas](../referencias/2026-10-03-mensajes-siglo21.md).

**Verificación local:** la prueba nueva pasó de RED (exit 1 antes de agregar los mensajes) a GREEN, 9/9. La suite comercial aprobó 321/321; ambas páginas fueron regeneradas con `--descuento-beneficio 10` y contienen los mensajes nuevos. `npm run check` aprobó lint, typecheck y 242 tests del sitio, sin skips. No se actualizó ninguna fuente de precios ni se publicó el buscador.

**Límites:** la auditoría institucional sale con código 1 por dos avisos clasificados como problemas en el corpus inalterado de Teclab (`cuando-empieza` e `inscripcion-abierta`); no hay problemas nuevos de Siglo 21. El buscador conserva sólo 2B porque la planilla local 2A no trae tabla de promociones; informa una carrera sin precio y ocho sin ficha. No se corrigieron datos fuera del alcance. Corpus, tests comerciales y HTML permanecen gitignorados: no se incluyen en el repositorio público ni en `npm run check`.

## Docker y Supabase local — 01/10/2026

- [x] **Validar las pruebas reales de Supabase local desde Linux.** Docker Engine 29.8.2 instalado y operativo en Linux Mint 22.3. Se inició exclusivamente `cau-guardrails-local`, se corrigió la lectura del BOM UTF-8 en los SQL de Windows y `npm run test:integracion` aprobó las 6 pruebas, sin skips: RLS/grants, registro, persistencia HTTP de los tres formularios y rate limit. `npm run check` con Node 24.14.1 aprobó 155 pruebas; lint conservó 27 advertencias y ningún error. El stack se detuvo al terminar. No se conectó a producción. La instalación Windows/WSL sigue sin verificar, pero ya no bloquea la integración local. [Procedimiento](pruebas-supabase-local.md).

Contiene tareas verificadas como terminadas y registros anteriores de tareas reformuladas. Las reproducciones y propuestas anteriores dentro de esos bloques son contexto histórico, no nuevas tareas ni instrucciones para ejecutarlas hoy.

## pendiente-03

- [x] **Actualizar los datos locales desde el nuevo Dashboard Comercial de Teclab.** Verificado y regenerado el 03/09/2026 desde `https://informacion.teclab.edu.ar/hubfs/ADMISION/CALIDAD%20Y%20%20TRAINING/Dashboard_Comercial_Teclab%20(Agentes).html`, sin tocar el corpus. Se actualizaron `carreras/teclab/dashboard-comercial.json`, `carreras/teclab/calendario-teclab.json` y `ventas/teclab-convenios.md`; las pruebas específicas de Teclab pasaron (13/13).

  El extractor de precios intentó actualizarse el 03/09/2026 pero falló antes de escribir y conservó el último lote válido del 02/09/2026. No se reintentó para evitar mezclar precios parciales ni se editó el corpus; queda para una corrida exitosa del script de precios.

## pendiente-12

- [x] **Verificar en producción el sitemap dinámico.** El sitemap dejó de depender de ISR: `app/sitemap.ts` usa `dynamic = 'force-dynamic'` porque Vercel conservaba la metadata route aunque `revalidatePath('/sitemap.xml')` marcara su tag. Verificado el 03/09/2026: el trigger respondió `200` en `net._http_response`, con las rutas de contenido correctas y sin `/sitemap.xml`; el sitemap público respondió `200` con `Age: 0`.

  La prueba anterior del 29/08 queda como historial del defecto; no repetirla esperando una ruta `/sitemap.xml` en la respuesta de `/api/revalidar`, porque ya no forma parte de ese listado.

  Reproducido dos veces el 29/08/2026, la segunda sin ningún deploy de por medio:

  1. `UPDATE carreras SET descripcion = ... WHERE id = 109` (Videojuegos). La ficha mostró el texto nuevo en producción en segundos. El `lastmod` del sitemap siguió en `2026-07-19` hasta que hubo un deploy, que sí lo movió; esto motivó el cambio a generación dinámica.
  2. `UPDATE carreras SET descripcion = ..., enfoque = ... WHERE id = 225` (Customer Experience), sin deploy. Idéntico: la ficha al instante, el `lastmod` clavado en `2026-07-22`.

  O sea que **la revalidación funcionaba para las páginas y no para el sitemap, en la misma llamada del mismo trigger**. El sitemap ya no se delega a esa revalidación.

  Lo que se descartó: en `.next/prerender-manifest.json` la entrada `/sitemap.xml` tiene `routeType: "route"`, `initialRevalidateSeconds: 86400` y entre sus `x-next-cache-tags` está `_N_T_/sitemap.xml`, que es justo la etiqueta que emite `revalidatePath` sin tipo. La etiqueta está bien.

  La pista que queda: las cabeceras del sitemap en producción traen `X-Vercel-Cache: HIT` con el `Age` subiendo y el mismo `Etag`, **pero no traen `X-Nextjs-Prerender: 1`, que una ficha de carrera sí trae**. Da HIT incluso pidiéndolo con query string única.

  **Por qué importa más de lo que parece**: `docs/indexacion.md` da por confirmado que el sitemap se rehace sin deploy, y la estrategia de indexación se apoya en eso (mover `updated_at` para que el `lastmod` le diga a Google que vuelva a mirar una URL). La "confirmación" del 22/08 fue que una URL nueva se indexó el mismo día, pero eso también se explica por el enlace desde `/novedades/1`: el sitemap nunca se midió directo. Corregir esa afirmación y el comentario de `app/sitemap.ts` según lo que resulte.

  `npm run smoke` seguirá comprobando las URLs del sitemap, pero no puede comprobar por sí solo el `lastmod` contra la base.

  **No hace falta esperar a un alta real.** Alcanza con tocar una carrera sin cambiarle nada y pedir el sitemap después del deploy:

  ```sql
  UPDATE public.carreras SET orden = orden WHERE id = 2;   -- Abogacía, no cambia nada
  SELECT id, status_code, content, created FROM net._http_response ORDER BY created DESC LIMIT 3;
  ```

  Esperado: `net._http_response` confirma la revalidación de las páginas, sin `/sitemap.xml` en la lista; y una petición nueva a `https://www.siglo21sur.com/sitemap.xml` muestra el `lastmod` actualizado.

  El secreto no se puede probar desde acá: `REVALIDATE_SECRET` está marcada Sensitive en Vercel, así que un POST directo a `/api/revalidar` no es opción y el disparo tiene que salir de la base.


## pendiente-06

- [x] **Plan y disponibilidad de Estadística Aplicada y Análisis Avanzado.** Resuelto el 07/09/2026, commit 53d55dd. Plan de 18 materias en cinco cuatrimestres y disponibilidad confirmada por el usuario. Evidencia: [SQL](../sql/2026-09-07_estadistica_disponible.sql) y [referencias](../referencias/2026-09-07-estadistica-aplicada.md). La revisión del 30/09/2026 confirmó la fila activa, sin proximamente, y la ficha publicada con inscripción.

## pendiente-15

- [x] **Campos de preinscripción de Teclab e Identidad.** Verificados el 30/09/2026 en ventas/corpus/teclab.json y ventas/corpus/identidad.json, respuestas inscripcion-teclab e inscripcion-identidad, y en ambos HTML generados. Teclab documenta el flujo confirmado el 24/08/2026; Identidad cita su fuente de preinscripción. No hace falta volver a pedir los campos ni regenerar páginas en esta limpieza.

## registro-anterior-pendiente-06

Registro histórico sustituido el 30/09/2026; las afirmaciones y acciones siguientes no son instrucciones vigentes.

- Registro original: **Pedirle a la universidad el plan de la Tecnicatura en Estadística Aplicada y Análisis Avanzado** (id 132). Es la única carrera visible sin temario del que agarrarse: al 29/07 no existe ni el PDF de `contenidos.21.edu.ar` ni la página en `21.edu.ar` ni una entrada en su sitemap; lo único público es un posteo del CAU Corrientes (2 años, inicio en octubre). Quedó marcada `proximamente` mientras tanto.

  **Cuando llegue el temario**, el cambio son dos cosas: cargar el slide de plan como el de Sociología y sacarle el `proximamente` —`update public.carreras set proximamente = false where id = 132;`—, que le devuelve el botón "Quiero inscribirme" y la píldora "Nueva". Ojo: si el CAU empieza a inscribir **antes** de que aparezca el plan, hay que sacar el `proximamente` igual, aunque la ficha se quede sin temario.

  Sale como aviso, no como problema, en `npm run auditar`, y desde el 03/08/2026 es **la única**: Agroinformática estaba en la misma situación —slides pero sin plan— y al apagarse dejó de contar como activa, así que la auditoría ya no la lista.

## registro-anterior-pendiente-09

Registro histórico sustituido el 30/09/2026; las afirmaciones y acciones siguientes no son instrucciones vigentes.

- Registro original: **Cinco carreras sin página pública en 21.edu.ar.** `datos/enlaces-sitio-oficial.json` tiene 61 de 66, cada uno verificado con un pedido real. Faltan Administración Pública, Agroinformática, Responsabilidad y Gestión Social, Estadística Aplicada y Negocios Agroecológicos — tres de ellas ya documentadas más abajo como sin oferta oficial verificable. **Son las mismas que dejan huecos en el KB**: 3 fichas sin resolución y 2 sin perfil profesional, que no se pueden completar porque no hay fuente pública.

  Pedido redactado en `herramientas/pedidos-a-enviar.md`.

  **El slug del sitio no se deriva del nombre del KB.** Las diferencias no siguen ninguna regla: "Desarrollos" contra "Desarrollo", "inteligencia en" contra "inteligencia de", "Venta" contra "Ventas", "Relaciones Públicas" contra "RRPP", con y sin "Universitaria", y algunos conservan las tildes en la URL (`licenciatura-en-administración`, `promoción-comunitaria-en-niñez`). Por eso hay un mapa `EXCEPCIONES` en `extraer-enlaces-sitio.mjs` que se completa a mano cuando aparece una nueva.

  Aparte: **Licenciatura en Administración** figura enlazada en el índice del sitio pero `licenciatura-en-administracion` (sin tilde) devuelve 404. El link está roto del lado de ellos; ya va incluido en el pedido.

## registro-anterior-pendiente-10

Registro histórico sustituido el 30/09/2026; las afirmaciones y acciones siguientes no son instrucciones vigentes.

- Registro original: **El corpus del bot tiene 113 respuestas sin revisar.** De 184 vivas, 71 están aprobadas (Siglo 21 18/53, Teclab 35/20, Identidad 18/40, al 09/08). Aprobar o descartar **lo decide una persona**; desde el 04/08 se hace en la conversación —se lee el mensaje que salió mal, se corrige el JSON de esa casa en `ventas/corpus/` y se regeneran las dos páginas—, no en `entrenar-bot.html`.

  ~~Las 5 de Identidad que corregían una respuesta falsa~~ Aprobadas el 08/08/2026: `validez`, `requisitos`, `equivalencias`, `inscripcion` y `doble-titulacion` ya contestan con el texto propio, y en el mismo pase se le sacaron a Identidad las 7 copias universales que le hablaban al lead como si la diplomatura fuera una carrera de grado.

  **Lo que apareció al revisar el resto (09/08/2026) fue la modalidad escrita a mano**: 13 respuestas afirmaban «100% online», que es cierto en 10 de las 11 diplomaturas y falso en **Gestión de Equipos de Alto Desempeño, que es híbrida**. Corregidas: donde la frase habla de la carrera va `{modalidad}`, y donde habla de la oferta entera, «casi todas 100% online». Se aprovechó para sacar de `extranjero` un «no te piden documentación argentina» sin fuente —la preinscripción pide DNI— y para que `clases-y-examenes` diga la evaluación en vez de ofrecer confirmarla, que ya estaba documentada y la contestaba `validez`.

  Las tres que el cambio de texto había devuelto a `sin revisar` —`duracion-identidad`, `modalidad-identidad` y `doble-titulacion-identidad`— se aprobaron el 09/08 con el texto nuevo a la vista. Queda una decisión abierta: `extranjero-identidad` sigue abriendo con «Sí, podés» y para la híbrida eso es discutible, aunque la misma oración ya dice «es híbrida» y el operador la lee antes de mandarla.

## registro-anterior-pendiente-15

Registro histórico sustituido el 30/09/2026; las afirmaciones y acciones siguientes no son instrucciones vigentes.

- Registro original: **Faltan los campos de preinscripción de Teclab y de Identidad.** El 14/08/2026 se unificaron en el corpus de Siglo 21 las dos intenciones que competían —"cómo me inscribo" contestaba una lista de cuatro datos y "quiero preinscribirme" no existía como pregunta de ejemplo, así que caía en *no entiendo* o contestaba el precio—. Quedó una sola respuesta con los **once campos** que pide el sistema de Siglo 21: nombre y apellido completos, DNI, fecha de nacimiento, localidad de nacimiento, nacionalidad, país de residencia, sexo, estado civil, mail, dirección, y barrio con código postal. Sin teléfono a propósito: el lead está escribiendo por WhatsApp.

  **Las otras dos casas tienen su propio corpus y su propia preinscripción**, y ahí la palabra sigue cayendo en cualquier lado. Hay que pedirle a cada instituto qué campos pide su formulario. Ojo con suponer que son los mismos: las dos listas que circulaban de Siglo 21 coincidían en cinco campos de trece.

  Cuando lleguen, el cambio es una intención `inscripcion` en `ventas/corpus/teclab.json` y otra en `ventas/corpus/identidad.json`, con las mismas preguntas de ejemplo que la de Siglo 21 y el listado de esa casa; después se regeneran las dos páginas (`generar-entrenador.mjs` y `generar-buscador.mjs`, siempre las dos).

## registro-anterior-pendiente-16

Registro histórico sustituido el 30/09/2026; las afirmaciones y acciones siguientes no son instrucciones vigentes.

- Registro original: **El video institucional no se puede publicar mientras muestre Academia Identidad Argentina.** La oferta de la academia todavía no está en `main`: el sitio publicado no la tiene, así que el video mandaría a buscar en siglo21sur.com algo que ahí no existe.

  El video vive **fuera de este repo**, en `~/Escritorio/remotion-cau-villa-lugano` (Remotion, 158,5 s, 1920×1080; el render terminado es `out/cau-institucional.mp4`). La academia aparece en dos de las doce partes, que `npm run partes` lista: **`P02-oferta`**, donde es uno de los tres sellos, y **`P07-identidad`** entera, que son 23,5 s del video propio de la casa más la grilla de las 8 diplomaturas.

  **Cuando las diplomaturas entren al sitio no hay nada que hacer**: el video ya las tiene y se publica como está. Si hubiera que sacarlo antes, son dos cortes: el tercer objeto de `casas` en `src/data.js` (P02 queda con Siglo 21 y Teclab) y el bloque `P07-identidad` del array `bloques` de `src/guion.jsx` (el bloque de al lado se queda con su transición, no hay que reajustar tiempos). El institucional baja a 135 s.
## pendiente-01

- [x] **Incorporar transiciones y transformaciones a UIverse.** Verificado el 30/09/2026: ya estaban guardadas seis transiciones, cinco desde el 26/09; no se agregaron duplicados. En `biblioteca/mias/` de UIverse se comprobaron `transicion-empuje-en-profundidad`, `transicion-latigazo-con-estela` y `transicion-nombre-y-cifra-que-viajan`: visibles en Mías / Más recientes, modo oscuro, escritorio 1280×800 y móvil 390×844 sin desborde horizontal. Con movimiento reducido las tres quedan estáticas. `npm test` de UIverse: 50 pruebas aprobadas, 0 fallidas. Las otras disponibles son ondas retro, relevo detrás del divisor y zoom con iris.

  Son piezas propias provenientes de escenas aprobadas, no nuevas capturas de sitios externos; conservan su contenido y procedencia. Inter usa Google Fonts, con fallback local. Capturas: `<UIverse>/transicion-*-desktop.png` y `<UIverse>/transicion-*-movil.png`. Referencias consultadas en [el registro del día](../referencias/2026-09-30-transiciones-uiverse.md).

## Remedición de CSS de la home, 30/09/2026

- [x] **Realizar la medición del pendiente 02.** HTML público: 634.975 bytes sin compresión, tres apariciones del marcador raíz y las capas (una SSR y dos RSC). La anomalía sigue abierta; no se apagó `inlineCss` ni se actualizó Next. La repetición al actualizarlo pasa a [rutinas](rutinas.md#css-de-la-home-al-actualizar-next). [Evidencia y límites](medicion-css-home-2026-09-30.md).

## Cierre pendiente-04: CTR de las ocho fichas

**30/09/2026: remedición completada, no se demuestra mejora atribuible a las descripciones.** CTR ponderado 0,70% → 0,88%, posición 7,57 → 6,76; resultado mixto y sólo 17 clics de base. Se mantienen los textos actuales sin extender el cambio a las seis restantes. [Medición y límites](medicion-ctr-fichas-2026-09-30.md), [datos](medicion-ctr-fichas-2026-09-30.json). El pendiente 05 sigue abierto.

### Registro original



- Registro: **Remedir el CTR de las 8 fichas reescritas el 10/08/2026.** Se cambió la columna `enfoque` de 8 carreras, que es de donde `descripcionSEO()` saca la primera frase de la meta descripción. Venían escritas como listado de temas ("Prevención de Riesgos, Normativas OHSAS y Ergonomía") en vez de decir qué consigue quien estudia; el informe de `npm run seo` las marcaba con CTR por debajo de lo esperable para su posición. Son los ids **86, 21, 6** (primer pase) y **76, 87, 8, 19, 65** (segundo). Verificadas en producción el mismo día: las 8 meta descriptions salieron bien.

  **Corrió por el SQL Editor, así que no hay rastro en git de este cambio** — de ahí esta entrada.

  Remedir a partir del **24/08/2026**, no antes: Google tiene que rastrear de nuevo y después hay que juntar impresiones. Comparar contra el informe del 10/08 (`herramientas/vigilancia-logs/seo-20260810.md`). Ojo con leer de más: en juego había ~55 clics/mes repartidos entre las 8, así que una diferencia chica es ruido.

  Quedan **6 carreras más con el mismo patrón** sin tocar (las que no llegaban al umbral de impresiones del informe). Si las 8 muestran mejora, van todas.

  **Marketing Digital (#223) no se toca**: su `enfoque` no es prosa sino pares clave-valor (`Modalidad:`, `Título:`, `Cocreación:`) que `parseEnfoqueTeclab()` desarma para el modal de Teclab *y* para la descripción. Reescribirlo como frase rompe las dos cosas. Vale para toda la oferta Teclab.


## Decisiones de alcance, 30/09/2026

- **Descartada por el usuario, no completada: foto frontal (pendiente 07).** Se conserva la imagen vigente; no se reemplazó el OG ni se tomó una foto nueva.
- **Descartada por el usuario, no completada: revisar Linux antiguo (pendiente 14).** Prefiere clonar el repositorio de nuevo y olvidar la instalación anterior. No se borró ni se instaló nada en Linux. Clonar el repo no elimina configuraciones personales del sistema; no se afirma haber limpiado la entrada de TestSprite.

## Cierre pendiente-13: manifest e íconos

30/09/2026: manifest App Router y PNG 192/512/180 preparados y verificados localmente. Enlaces automáticos de Next y metadata Apple sin duplicados; no se añadió service worker ni se prometió funcionamiento offline. [Evidencia y límites](manifest-iconos-2026-09-30.md), [referencias](../referencias/2026-09-30-manifest-iconos.md). Pendiente de publicación; no hubo commit ni deploy.

## pendiente-05

- [x] **Evaluar títulos y enlaces internos del 16/08/2026.** Completado el 30/09/2026: cohorte reconstruida de 25 títulos, CTR 1,20% → 1,37%, clics 32 → 87, posición 8,98 → 8,14. No demuestra causalidad. A posición comparable, CTR 1,00% → 1,07%. Experiencia del Cliente indexada; Videojuegos aún no reconocida. Se conserva implementación y seguimiento habitual; sin cambios de código ni producción. [Informe y evidencia](medicion-titulos-enlaces-2026-09-30.md).

### Registro anterior pendiente-05



- **Evaluar los dos cambios de SEO del 16/08/2026.** Son dos apuestas distintas, con plazos distintos. Las dos se miden contra el informe de ese día, `herramientas/vigilancia-logs/seo-20260816.md` (264 clics, 14.248 impresiones, CTR 1,9%, posición 8,4 en la ventana 17/07 → 13/08), y contra el 108/111 de `docs/indexacion.md`. Se remide con `npm run seo` y lo interpreta el agente `estratega-seo`.

  **Los títulos (`b90ab59`).** Cuando el nombre no entra con el sufijo largo, ahora se suelta "Villa Lugano" antes que "a Distancia". Cambian 25 de las 63 fichas de Siglo 21. La hipótesis salió de Search Console a 28 días: las consultas con "siglo 21" clickean al 0-1% aunque estemos quintos, y las que dicen la carrera sola o con "a distancia" al 10-33%. **Remedir a partir del 07/09/2026**, no antes: Google tiene que rastrear las 25 fichas y después hay que juntar impresiones. Se mira el CTR de esas fichas a posición comparable, no los clics sueltos. Si el CTR no se mueve, se deja; si baja con la posición igual, se revierte, que es un solo bloque de `app/carreras/[slug]/page.tsx`.

  **Los enlaces internos (`aa4a68b`).** Las seis carreras del mismo nivel ahora rotan con el `id` en vez de ser siempre las seis primeras; el reparto de enlaces entrantes pasa de 0-34 a 3-11. **Esto se mira antes, el 30/08/2026, y no por CTR sino por rastreo**: las dos fichas que Google nunca rastreó (Videojuegos y Customer Experience) tenían dos enlaces entrantes cada una y ahora tienen más, así que la prueba es si entran al índice. **No se revierte aunque no se vea nada**: el reparto viejo dejaba 47 de las 88 fichas con tres enlaces o menos, y eso es un defecto por sí mismo.

  **Medido el 29/08, un día antes: dio negativo y ya no hace falta esperar al 30.** Las dos fichas pasaron a **10 enlaces entrantes cada una** (contados sobre las 111 URLs de producción, sólo anclas reales), por encima de Quality Assurance que tiene 9 y está indexada, y **siguen sin rastrear**. El enlazado interno queda descartado como causa. Se deja igual, por la razón de arriba.

  Se superpone con la [remedición de las ocho descripciones, completada el 30/09](medicion-ctr-fichas-2026-09-30.md). Son cambios sobre las mismas páginas: si el 07/09 el CTR de carreras mejoró en bloque, no se puede repartir el mérito entre título y descripción, y tampoco hace falta.


## extranjero-identidad-2026-09-30

- [x] Revisar la respuesta para estudiantes en el extranjero. Confirmación del usuario: no se exige documentación argentina para Academia Identidad Argentina. Se conserva la modalidad por programa y las grabaciones, sin garantizar asistencia libre ni reconocimiento oficial extranjero. Western Union y PayPal se ofrecen sólo si el programa los enumera en DEPC y el resumen está vigente; Ciberseguridad usa la consulta de opciones. Ambas páginas locales regeneradas. [Evidencia](respuesta-identidad-extranjero-2026-09-30.md). Sin publicación.

## responsabilidad-social-2026-09-30

Cerrado: encontrada la página oficial de la Tecnicatura en Responsabilidad y Gestión Social. GET HTTP 200 y canónica coincidente; se agregó el enlace al mapa local y se retiró únicamente esta carrera de `sinEnlace`. El registro anterior permanece como histórico. [Evidencia](enlace-responsabilidad-social-2026-09-30.md). No se modificaron la base, el corpus ni las fichas generadas.

## inicio-ed-edh-2b-2026

- [x] **Verificar inicio de cursado ED/EDH 2B.** Revisado el 01/10/2026: el calendario oficial 2026, página 6, publica comienzo de clases el 05/10 y cierre de inscripción académica a materias el 18/10. La fecha ya está en `INICIO_CLASES` de `herramientas/ventas/contexto-carreras.mjs` y las páginas generadas del bot. No se modificó la lógica ni el mensaje al aspirante.

  Fuente: [calendario oficial ED/EDH](https://contenidos.21.edu.ar/descargas/calendarios-2026/5-calendario-academico-2026-ed-edh-arccnbcod-0030.pdf). Esto cierra sólo la duda de inicio del pendiente 11, no becas, doble carrera, requisitos, cupos ni admisión comercial.

## modalidad-presentaciones-2026-10-02

- [x] **Tarea 27 del pedido del 02/10: modalidad en las presentaciones de carreras.** Todas las variantes de `info-general` de Siglo 21 y Teclab usan `{modalidad}` y exigen ese marcador. El contexto de Siglo 21 explicita «virtual (Educación Distribuida Home)», según la oferta del CAU ya documentada. Teclab conserva el dato por carrera; Identidad ya lo usaba y no se modificó.
- Verificación: 303 tests del material comercial aprobados. Se comprobaron las presentaciones seleccionadas por el motor con los 90 contextos reales del buscador: 65 de Siglo 21, 17 de Teclab y 8 de Identidad. Todas incluyen la modalidad correspondiente y no dejan marcadores sin resolver.
- Regenerados `ventas/buscador-carreras.html` y `ventas/entrenar-bot.html`. Cambio local, sin publicación; el material comercial está ignorado por git.
- Incidencias ajenas al cambio: el auditor institucional marca dos respuestas existentes del curso de IA de Teclab por la palabra «cohorte», clasificada como vocabulario de Identidad. El generador omite 2A porque su planilla no trae una promoción concluyente; generó 2B correctamente. No se alteraron precios ni promociones.
- [Referencias locales](../referencias/2026-10-02-modalidad-presentaciones.md).

## teclab-slides-tandas-2026-10-02

- [x] **Tarea 19 del pedido del 02/10: tandas de la slide 2 de Teclab.** Cuando las competencias no entraban juntas (sobre todo en PC con ventana baja), `repartir()` elegía el reparto más parejo en píxeles y, si la primera competencia era larga, mostraba 1 tarjeta y después 2. Ahora prefiere repartos donde ninguna tanda tenga más tarjetas que la anterior (2+1) y usa lo parejo sólo para desempatar; 1+2 queda únicamente si las dos primeras no caben juntas.
- Verificación: lint y typecheck aprobados; simulación de `repartir()` con altos reales de casos límite (primera larga → 2+1; 2+1 sin lugar → 1+2; todas entran → una tanda). Revisión de confiabilidad aprobada sin bloqueos.
- Pendiente aparte: no hay test unitario de `repartir()`; requiere sacarla del componente.

## teclab-precio-2026-10-03

- [x] **Tarea 32: achicar el último slide del modal de Teclab.** El scroll aparecía con el precio a la vista en teléfonos bajos (375x667: 67 px de más) por el bloque de financiación. Va plegado («Ver financiación»). Commit `a094245`.
- [x] **Tarea 33: dejar claro qué cubre el pago.** «Ver precio» y el enlace personalizado arman la aclaración desde los conceptos: qué meses cubre, cuántos cuatrimestres tiene la carrera y que cada cuatrimestre se paga matrícula y bimestres (Reglamento Institucional de Teclab, 4.1). El robot de precios rotula los bimestres según el período. Commits `1db22d3` y `0676aeb`. [Detalle](../odd/tasks/cobertura-pago-teclab.md).
- [x] **Tarea 34: precio en la autoinscripción.** La preinscripción de Teclab devuelve el precio y el formulario lo muestra como paso propio del carrusel antes de «Inscribirme». Commit `2f3cc9c`. [Detalle](../odd/tasks/precio-en-autoinscripcion-teclab.md).
