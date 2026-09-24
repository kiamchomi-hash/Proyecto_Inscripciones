---
name: lienzo-de-diseno
description: Acompaña al comando /design y a cualquier pedido de lienzo, artboard, mockup, wireframe, maqueta de pantalla, póster, afiche, flyer, folleto, placa, banner o landing armada como pieza visual en vez de como código de sitio. La pieza se arma en seis pasos, y cada uno se muestra y espera la aprobación del usuario antes de seguir - fondo, disposición del espacio, imágenes y elementos, tipografía, cohesión y detalles finales. Fija además de dónde sale cada decisión (referencias reales y la biblioteca UIverse del usuario, no la memoria) y cómo dejar los artboards editables a mano. Usar ANTES de escribir el primer artboard, no al final.
---

# Lienzo de diseño

El comando `/design` publica un lienzo con varios artboards y después **el
usuario los edita a mano**: clickea un elemento, lo cambia en el panel de
propiedades, edita el texto en línea y guarda una versión nueva. Todo lo de acá
sale de esa mecánica y de una sola idea: **el borrador tiene que quedar
editable, y la dirección estética tiene que salir de algo real.**

**Si lo que se pide es una página que va a vivir en un navegador** —responsive,
con hover, servida por el sitio— no es esta skill: es `frontend-design`. Acá el
lienzo es de tamaño fijo y se edita a mano después.

Y una advertencia sobre esta skill misma: **fija el piso, no el techo.** Que
algo no esté escrito acá no autoriza a entregarlo sin eso. Una pieza que cumple
todos los puntos y aun así llega sin material visual, o con textos de relleno
inteligente, está mal entregada.

## Seis pasos, uno por vez

La pieza no se entrega entera: se construye por capas, y **cada capa se muestra
y espera el visto bueno del usuario antes de la siguiente**. Así un fondo que no
va se descarta en el primer minuto, y no después de haberle montado encima la
tipografía.

| Paso | Qué se agrega | Qué todavía no entra |
|---|---|---|
| 1. Fondo | color o papel, y encima líneas, auroras, trama o grilla para que no quede plano | cajas, imágenes, texto, logo |
| 2. Disposición | contenedores: cajas, bandas, bordes, guías, cada uno con el rótulo de lo que va ahí («Título», «Foto») | imágenes, íconos, texto real |
| 3. Imágenes y elementos | fotos, ilustraciones, SVG con volumen, piezas de UIverse, recursos de internet, logo | texto |
| 4. Tipografía | el texto real, con su escala y su jerarquía | elementos nuevos |
| 5. Cohesión | nada nuevo: se ajusta lo que hay para que sea una sola pieza | — |
| 6. Detalles finales | los arreglos que pida, la revisión de impresión y la entrega | — |

Cómo se avanza:

- **Un paso por mensaje, y ahí se frena.** Se arma el paso, se mira la captura
  (ver «Cómo se muestra cada paso»), se manda y se espera. No se adelanta el
  siguiente «para ganar tiempo» ni se muestran dos pasos juntos.
- **Sólo un sí explícito aprueba** («dale», «va», «aprobado», «seguí»). Un
  comentario o una pregunta no es aprobación: se responde, se corrige si hace
  falta, se vuelve a mostrar y se sigue en el mismo paso.
- **Si lo desaprueba, se rehace el mismo paso** con lo que dijo. Si no queda
  claro qué no le gusta, una pregunta concreta, no un cuestionario. Al segundo
  rechazo, en vez de otra propuesta sola van dos o tres variantes realmente
  distintas en una misma captura, para que elija viendo.
- **Lo aprobado queda congelado.** Si un paso posterior necesita tocar una capa
  ya aprobada —el texto no entra en la caja, la foto pide otro fondo—, se dice y
  se pregunta antes de cambiarla.
- **El mensaje de cada paso es corto**: la captura, qué se hizo en dos o tres
  líneas y de dónde salió (qué pieza de UIverse, qué foto, qué referencia). Sin
  resumen de lo anterior ni adelanto de lo que viene.
- **Si la pieza tiene varios artboards** (frente y dorso, versiones de tamaño),
  cada paso se hace en todos a la vez y se muestran juntos.
- **Todo vive en `contenidos/<casa>/en-curso/AAAA-MM-DD-<pieza>/`**, que se
  crea antes del paso 1: la fuente, los recursos, los scripts y las capturas.
  No se trabaja en otro lado.
- **Es el mismo archivo el que crece**, no uno nuevo por paso. Lo que se guarda
  por paso es la captura, numerada (`paso-1-fondo.png`,
  `paso-2-disposicion.png`…), para poder volver a mirar lo aprobado.

## Antes del paso 1: el encargo

Esto no se muestra ni se aprueba. Se reúne, y si falta algo se pregunta ahora,
que es el único momento en que se pregunta antes de mostrar:

- **Casa** (Siglo 21, Teclab, Identidad Argentina u otra), **formato y tamaño**
  (A4, A5, 1080×1350…) y si va a **papel o pantalla**.
- **Qué tiene que decir y a quién**, con los datos reales. Las cajas del paso 2
  se miden para ese contenido, así que se conoce desde el principio aunque
  recién se escriba en el paso 4. **Los datos salen de las fuentes** —el sitio,
  la base (`npm run db`), `cau_brand`— o del usuario, **nunca de una pieza
  anterior**: un folleto viejo puede tener un teléfono o un horario que ya
  cambió. Si una fuente y el usuario no coinciden, se pregunta.
- **Piezas anteriores, sólo las aprobadas** (ver «Piezas anteriores»). Que
  exista un folleto del mismo tema no lo vuelve punto de partida.
- Si es del CAU, leer `cau_brand`, `cau_design_patterns` (ver «La marca») y
  `piezas-para-el-publico`.
- **Sacar la lista de UIverse una sola vez** (ver «De dónde sale cada
  decisión»). Cada paso la filtra después por sus propias etiquetas.
- **Listar qué material visual pide el caso** (paso 3) y buscarlo ya: si falta
  una foto, conviene saberlo antes de dibujar las cajas.

## Paso 1: el fondo

Todo lo que está detrás del contenido, en dos capas: la **base** (el color o el
papel) y la **atmósfera** encima —líneas, auroras, grillas, trama, ruido, halos,
gráfica anclada a los bordes—, para que el fondo no quede plano. Lo único que no
entra es contenido: cajas, imágenes, texto, logo.

- Sale de la paleta de la casa (ver «La marca»); no se inventa un color.
- **La atmósfera se arma sabiendo dónde va a caer el contenido** (el encargo ya
  lo dice): más presente en los bordes y en las zonas que van a quedar libres,
  más suave donde después van el titular o la foto, para que no compita con
  ellos.
- **En papel manda la tinta.** Un fondo oscuro a sangre en un A4 chupa tinta y
  sale manchado en una impresora común: en papel el fondo suele ser claro y la
  atmósfera va en trazos finos y tintas claras; una aurora a sangre en un A4 es
  tinta. En pantalla hay más libertad.
- Blancos y negros puros no: cremas y negros teñidos hacia la paleta.
- Etiquetas para filtrar la lista de UIverse: `fondo`, `aurora`, `líneas`,
  `halo`, `patrón`, `textura`, `trama`, `grilla`, `papel`, `ruido`,
  `degradado`. Para papel se descarta lo animado y el resplandor.

## Paso 2: la disposición y el uso del espacio

Sobre el fondo aprobado, **sólo contenedores**: cajas, bandas, bordes, guías.
Sin imágenes, sin íconos y sin texto real: lo único escrito es el rótulo de cada
caja. Es un plano de obra y se juzga como tal: dónde está el peso, por dónde
entra el ojo, cuánto aire queda.

- **Cada caja lleva el rótulo de lo que va a ir** («Título», «Bajada», «Foto de
  la sede», «Materias», «Dirección y horarios»): chico, centrado y en un gris
  neutro, para que no se confunda con texto de la pieza. Son provisorios y van
  con la clase `.rotulo-guia`: en el paso 3 se van los de las cajas que reciben
  imagen, y en el paso 4 los que quedan, cuando entra el texto real.
- **Las cajas se miden para el contenido real del encargo**: un titular de tres
  palabras no necesita media hoja, y cinco materias no entran en una caja
  pensada para tres.
- **El orden de lectura se decide acá**: la caja más grande es lo primero que se
  ve, y tiene que ser lo que más le importa a quien mira.
- **La marca es una decisión de cada pieza, no un casillero fijo.** El logo de
  Siglo 21 y «CAU Villa Lugano» a veces tienen que estar y a veces no; lo que no
  puede pasar es que aparezcan arriba de todo porque sí. Salieron así en todos
  los folletos hasta el 10/09/2026, heredados de piezas anteriores y no
  pedidos por ninguna, robándole al título la primera línea de lectura.
  Entonces:
  - Se decide en este paso, mirando el caso: una pieza que circula suelta y no
    dice en ningún otro lado quién la hace pide marca; una que ya lleva la
    dirección de la sede y la web puede no necesitarla.
  - Si va, se decide también **dónde y con cuánto peso** —arriba, en el pie,
    junto al contacto—, no se pone arriba por reflejo.
  - **Se dice en el mensaje del paso 2, con el motivo, en una línea**: «va el
    logo chico junto al contacto, porque el volante se reparte solo» o «sin
    logo: la dirección y la web ya dicen de quién es». Así el usuario lo decide
    viéndolo, en vez de encontrárselo.
- Márgenes, columnas y calles parejos, declarados como tokens. En papel, zona
  segura adentro del corte y sangrado si el fondo llega al borde.
- **Cada caja se marca como lo que es**: las que quedan como contenedor de
  verdad (una tarjeta, una banda de color) y las que son sólo guía, con la clase
  `.guia`, que se borra en el paso 5.
- Etiquetas: `editorial`, `grilla`, `bento`, `tarjeta`, `banda`, `marco`,
  `columnas`, `corte`.

## Paso 3: imágenes y elementos

Adentro de las cajas aprobadas entra todo lo que se mira y no se lee: fotos,
ilustraciones, elementos 3D, piezas de UIverse, íconos, el logo. Todavía sin
texto real: las cajas que reciben imagen pierden su rótulo, las de texto lo
conservan.

**El error más caro no es elegir mal una tipografía: es entregar una pieza que
no tiene nada para mirar.** Bloques de color y viñetas con ícono no son material
visual. La pregunta es «¿qué le muestro a quien agarra este papel?», y se
responde leyendo el caso aunque el pedido no lo diga.

- **Primero el repo.** `public/imagenes/` tiene las fotos de la sede
  (`imagenes_cau/Foto-entrada.webp` es la entrada real de Guaminí 4876, la que
  hace que alguien reconozca la puerta), las de carreras, las de novedades y las
  de cada materia. `public/folletos/` tiene ilustraciones sueltas que se pueden
  usar como material; los folletos terminados que hay ahí no se miran como
  referencia (ver «Piezas anteriores»).
- **Después UIverse**: la lista del encargo, filtrada por lo que el caso pida.
  Cómo adaptar una pieza sin romperle la mecánica está en `diseno-uiverse`; en
  papel se queda el cuadro final, sin hover ni animación.
- **Si no está, se dibuja.** SVG vectorial con volumen —gradiente, canto
  lateral, sombra— imprime nítido a cualquier tamaño, pesa nada y queda editable
  en el lienzo, que es más de lo que da un PNG. Los documentos de Word, Excel y
  PowerPoint del folleto de computación salieron así.
- **De internet, con permiso.** Si hace falta algo de afuera, se propone con su
  link y su licencia antes de bajarlo, y el crédito va en un comentario del
  HTML.
- **Se elige por lo que la pieza necesita, no por lo que hay.** Una foto oscura
  de campaña, con su propio lockup encima, no sirve para un folleto de clases de
  apoyo aunque esté a mano. En papel, una foto de fondo negro va contenida en su
  caja, o no va.
- **Las zonas que quedaron vacías se llenan con gráfica**, no esperando al
  texto: rieles, marca de la casa, numerales, reglas, anclados a los bordes y en
  el mismo lenguaje que el resto.
- Un solo lenguaje óptico: la misma luz en todos los elementos 3D, el mismo
  trazo en todos los íconos. Íconos en SVG inline, nunca emojis.
- **En pixel art el contorno va sólo por fuera.** Una línea de contorno que
  separa dos zonas del mismo relleno es un borde interior y se ve mal hecho.
  Y un objeto que todos conocen —el puntero del mouse, la ventana, un ícono de
  sistema— se copia de la grilla del original, no se dibuja de memoria: el
  puntero del folleto de computación salió mal dos veces así (10/09/2026).

## Paso 4: la tipografía

Recién acá entra el texto, **escrito de verdad y con los datos reales**, con las
reglas de `piezas-para-el-publico` desde la primera línea. Reemplaza a los
rótulos del paso 2 que quedaban.

- Si es del CAU, la familia ya está decidida (ver «La marca»). Lo que se
  resuelve en este paso es la **escala** —cuántos niveles y qué tamaño cada
  uno—, el tracking, el interlineado y el ancho de línea, con la escala
  declarada como tokens.
- **Se juzga a tamaño real**, en la captura al 100%: un cuerpo que se lee bien
  en pantalla puede quedar chico impreso.
- **Cada texto es su propio elemento** (`<h1>`, `<p>`), nunca pintado en una
  imagen ni convertido en curvas: si no se puede seleccionar, no se puede
  editar.
- **Rótulos de sección, casi siempre ninguno.** «Lo que vas a ver», «Tres pasos
  y listo», «Estamos cerca», «Descubrí todo lo que…»: esa familia entera está
  prohibida. Si hace falta uno, un sustantivo pelado («Para reservar») o una
  pregunta real («¿Por dónde empezás?»). Las bajadas, una línea concreta y no un
  arco de «desde X hasta Y».
- **Si falta un dato**, el elemento va sólo con lo que sí es cierto y el
  pendiente va en el mensaje. Nada de «Lorem ipsum» ni de un número inventado.
- **Si el texto no entra en su caja, se ajusta el texto**, no se achica hasta
  que no se lea. Si la caja tiene que cambiar, eso es tocar el paso 2: se
  pregunta.
- Números que se comparan en columna, con `font-variant-numeric: tabular-nums`.
- Etiquetas: `tracking`, `versalita`, `titular`, `monoespaciada`, `resaltado`,
  `subrayado`, `editorial`.

## Paso 5: la cohesión

No entra nada nuevo. Se mira la pieza entera y se ajusta lo que ya está para
que se lea como una sola cosa y no como capas apiladas:

- Un solo radio, dos grosores de borde como mucho, una escala tipográfica,
  espaciados en múltiplos del mismo valor.
- Todo alineado a la grilla del paso 2: lo que quedó corrido un par de píxeles
  se nota impreso.
- Colores sólo de los tokens; si apareció uno suelto en el camino, se va.
- Las guías del paso 2 se borran (la clase `.guia`), y no queda ningún
  `.rotulo-guia`.
- Con varios artboards, que se lean como un sistema y no como piezas sueltas:
  misma escala, mismo radio, misma familia, el logo en el mismo lugar.

El mensaje dice qué se ajustó, en una lista corta.

## Paso 6: detalles finales y arreglos

Los arreglos que pida el usuario, y la revisión que se hace siempre antes de
entregar:

- **Contraste real, no aproximado.** Texto chico sobre color de acento es donde
  falla siempre; números y rótulos en acento sobre papel claro se ven bien en
  pantalla y desaparecen impresos.
- **Nada cortado**: el artboard es de alto fijo y lo que se pasa se pierde sin
  aviso.
- Palabras sueltas en la última línea y cortes de palabra feos.
- Ninguna nota de trabajo ni rótulo del paso 2 renderizado, y los datos de la
  sede contrastados con `cau_brand`.
- Fuentes incrustadas (ver «La marca») y todo el texto editable.
- **Entrega**: con `/design`, recién ahora se publica el lienzo; si no, el
  archivo y el PDF que haya pedido.
- **Si el usuario la da por aprobada**, se pregunta si va a
  `contenidos/<casa>/aprobados/` y, con su sí, se copia en
  `AAAA-MM-DD-<pieza>/` con la captura final, la fuente con sus recursos y una
  `ficha.md` (qué es, casa, formato, de qué salió cada decisión, qué se probó y
  no quedó). Nunca se agrega una pieza ahí sin ese sí. **Después se borra su
  carpeta de `en-curso/`.** El ciclo completo está en `contenidos/LEER.md`.

## Cómo se muestra cada paso

**Mirado de verdad, no imaginado.** Un artboard es de alto fijo: si el contenido
se pasa, se corta y no te enterás. Cómo verlo en esta máquina, que es lo único
que funciona: armá un HTML plano juntando el `<style>` del `<helmet>` y lo que
hay entre `</helmet>` y `</x-dc>` de cada artboard, reemplazando los `{{holes}}`
por su valor —un `.dc.html` suelto no renderiza sin el runtime del lienzo—;
servilo con `python -m http.server` desde esa carpeta y sacale la captura con
Playwright. **`file://` está bloqueado en los dos navegadores**, y el panel del
navegador integrado no deja capturar archivos locales. Fijá el ancho del
contenedor y `flex: 0 0 <ancho>` en cada página, o la captura te miente
encogiendo los artboards.

La captura se manda con `SendUserFile` (`display: "render"`), a tamaño real; con
varios artboards, todos en la misma captura, lado a lado.

## Cómo se trabaja adentro de un paso

Un paso no es una entrega: son varias vueltas cortas con el usuario. Lo que
sostiene esas vueltas:

- **Medir en la página, no mirar la captura.** Con el navegador ya abierto para
  capturar, se mide: dónde corta cada línea y con qué palabra termina, si el
  texto quedó centrado contra su caja —con el dibujo real de la letra, no con
  la caja del renglón—, si una cifra se pasa de su caja, dónde cae el centro de
  un dibujo. La captura muestra que algo está corrido; la medición dice cuánto
  y hacia dónde. Sin eso se corrige por tanteo y se corrige al revés.
- **Mostrar el recorte de la zona, no la hoja entera.** Cada vuelta va con un
  recorte ampliado de lo que se tocó; la hoja completa se manda cuando el
  cambio afecta al conjunto. Un detalle de 40 px no se discute mirando un A5.
- **Las variantes se inyectan, no se guardan.** Para comparar dos o tres
  caminos, un script aparte abre la pieza, le inyecta el CSS de cada variante,
  recorta la misma zona y arma una hoja con las tres al lado. La pieza no se
  toca hasta que el usuario elige. Así no queda el archivo lleno de versiones
  muertas ni hay que deshacer.
- **Los colores y los efectos salen de las piezas, no del ojo.** Si el usuario
  rechaza dos colores elegidos a criterio propio, el tercero no se elige igual:
  se buscan los valores exactos en sus piezas de UIverse y se dice de cuál sale
  cada uno.
- **Un generador por capa, con marcadores.** El fondo, los dibujos, los textos
  y las fuentes los escriben scripts distintos, cada uno entre sus marcadores
  del HTML. Se puede rehacer el fondo sin tocar los dibujos, y al revés.
- **Cada arreglo se cuenta con su motivo, en una línea.** «Lo subí 5 px porque
  Silkscreen asienta las mayúsculas bajas en su caja» vale; «quedó mejor» no.

Y si el usuario pide un detalle de un paso posterior —una letra mal dibujada,
un centrado—, se hace y se sigue en el paso en curso. No abre el paso 6 ni lo
reemplaza: la revisión final se hace igual, completa.

## Lo que vale en todos los pasos

### De dónde sale cada decisión

De memoria siempre sale lo mismo: Inter, un degradado violeta, tarjetas
redondeadas sobre blanco. Eso es el promedio de todo, que es exactamente lo que
no queremos. Cada paso se apoya en algo real, y el mensaje dice en qué.

**Se empieza por lo propio y no se saltea.** Son las piezas que el usuario ya
eligió o rehízo, o sea el registro de su gusto: revisarlas es obligatorio en
toda pieza, siempre, incluso cuando la marca ya esté decidida.

**Si la pieza es de Siglo 21 o de Teclab, lo propio son las piezas que el
usuario marcó para esa casa** en la galería (clave `usos` de
`biblioteca/estado.json`): unas cien, no las 453 de ★ Mías. Las marcadas
«Ninguna» y las sin decidir no se miran. Cómo sacar la lista y qué hacer si ahí
no está lo que hace falta: skill `diseno-uiverse`, sección «Si la pieza es de
Siglo 21 o de Teclab». Para cualquier otra pieza el orden es
`biblioteca/mias/`, después `descargas/`, después `galaxy/`.

**Y se busca por etiquetas, no por el nombre de la carpeta.** Cada pieza tiene
un `meta.json` con `titulo`, `etiquetas` y de qué sitio salió; el nombre de la
carpeta no dice casi nada. Cada paso trae sus etiquetas; se suman las que pida
el caso («insignia», «punteado», «recorte»…). Para papel se filtra después lo
que no existe impreso: vidrio, resplandor, degradado animado, hover, revelado al
scroll.

### Piezas anteriores

**Las únicas piezas anteriores que se miran están en
`contenidos/<casa>/aprobados/`** (en el proyecto del sitio): los de su casa si
la pieza es de una sola, **los de las cuatro** (`cau`, `siglo21`, `teclab`,
`identidad`) si es general o del CAU como sede. Una pieza general es del CAU y
se guarda en `cau/`. Todo lo demás
—las carpetas de `en-curso/`, los folletos de `public/folletos/`, `output/`, los
scripts `generar-folleto-*` y sus `referencias/`— son borradores que nadie
aprobó, y no se abren: ni para la composición, ni para el estilo, ni para los
datos. Copiar un borrador arrastra decisiones que nadie tomó; así llegó la
cabecera con el logo a todos los folletos.

De un folleto aprobado se toma el mecanismo, como de cualquier referencia, no la
forma: que uno aprobado lleve logo arriba no dice nada sobre el próximo. Si la
carpeta está vacía o no tiene nada del caso, se trabaja con UIverse y las
fuentes, y no se busca en otro lado.

**Dónde mirar afuera tampoco está acá.** El catálogo vive en un solo lugar,
`~/Desktop/uiverse/FUENTES.md`: qué da cada fuente, cuál anota la tipografía que
cada sitio usa de verdad, cuáles publican `DESIGN.md` y cuáles tienen servidor
MCP (y cuál no hay que instalar). Se genera desde `fuentes.json`, así que es la
única copia que no envejece; la misma lista está en la pestaña **Fuentes** de la
galería local.

Decí de dónde salió cada decisión. «Archivo + Söhne, sacado de <sitio>» es una
elección; «una grotesca con carácter» es una corazonada.

### La marca

Cuando el lienzo es para Universidad Siglo 21 — CAU Villa Lugano, no hay
dirección que elegir: está la skill `cau_brand` (paleta, tipografías, datos de
la sede) y `cau_design_patterns` (lo que ya existe en producción). Se leen antes
del paso 1 y no se inventa una paleta nueva al lado.

**Esto no cancela la búsqueda en UIverse, sólo le saca dos decisiones.** La
marca cierra paleta y tipografía; composición, ritmo, recursos y detalle siguen
saliendo de las piezas marcadas para esa casa. Leer «la marca ya está decidida»
como «no hay nada que mirar» es el error que ya se cometió una vez.

Las tres casas tienen colores propios y no se mezclan: Siglo 21 en el verde del
sitio, Teclab cian `#2ee7d7` en Tecnología y violeta `#8e2cf2` en Gestión,
Identidad Argentina azul `#0090C1` con amarillo `#F1CF1C`.

**La tipografía de las piezas ya está resuelta y no se vuelve a elegir:
titulares en Inter 900 con tracking cerrado (-0.03 a -0.045em), texto de lectura
en Inter 400/600.** Es lo que titula la home («Inscripciones 2026», 900 con
tracking negativo). **Unbounded está vetada en piezas**, aunque el sitio la
cargue en `app/layout.tsx` y titule con ella en carreras y novedades: se probó
en un folleto y el usuario la rechazó. Que una familia esté en el `layout` no la
habilita para papel. Si creés que hace falta una display distinta, se propone en
el paso 4 antes de aplicarla.

En papel las fuentes van **incrustadas en el artboard** como `@font-face` con
`data:font/woff2;base64`: el PDF que exporta el lienzo no resuelve Google Fonts
y sale con la sustituta. Los woff2 ya bajados están en `.next/static/media/` del
proyecto —el subconjunto latino es el que tiene `-s.p.` en el nombre—; se mapean
con el CSS de `.next/dev/static/chunks/` para saber cuál es cuál.

### El artboard tiene que quedar editable

- **Cada cosa que el usuario va a querer cambiar es su propio elemento**: una
  foto, un ícono, una caja, un texto. Nada fundido en una sola imagen.
- **Medidas fijas, no responsive.** Un artboard es un lienzo de tamaño conocido:
  el tamaño va en píxeles y se compone para ése. Los `clamp()` y los breakpoints
  no tienen sentido acá y ensucian el panel de propiedades.
- **Un solo lugar declara los tokens.** Paleta, radio, escala tipográfica y
  espaciado como variables CSS arriba de todo, y que los artboards las consuman.
  Cambiar el acento tiene que ser una línea.
- **Las notas de trabajo no se renderizan.** Un pendiente, una duda o el
  criterio con el que armaste la pieza van en el mensaje o en un comentario del
  HTML, nunca dentro del artboard. Lo mismo que fija `piezas-para-el-publico`.
  La única excepción son los rótulos de las cajas del paso 2, que son
  provisorios y no llegan vivos al paso 5.

### Si el artboard es un mockup de interfaz

Los botones, campos, toggles y tarjetas salen de la biblioteca local de UIverse,
no de la cabeza; entran en el paso 3. El procedimiento, con el orden de búsqueda
y cómo adaptar una pieza sin arruinarle la mecánica, está en `diseno-uiverse`.
Lo que sí se inventa es la composición: qué hay en la pantalla, en qué orden y
qué dice cada parte.
