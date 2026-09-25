---
name: remotion
description: Trabajar video programático con Remotion (React que se renderiza a mp4) - armar o ajustar una composición, animar una escena, resolver tiempos y transiciones, sacar stills para revisar un cuadro, montar música o locución, sacar la versión vertical para redes, renderizar, y diagnosticar parpadeos, cuadros en blanco o renders que fallan. Un video nuevo se arma en siete pasos, y cada uno se muestra y espera la aprobación del usuario antes de seguir - guion y montaje, fondo, imágenes y elementos, tipografía, movimiento, audio, cohesión y entrega. Usar ante cualquier pedido que mencione Remotion, una composición, una escena o "parte" de un video, un guion de video, un render, o cuando se pida ver cómo quedó una animación. Incluye la regla de buscar la documentación y referencias visuales reales en internet en vez de resolver de memoria.
---

# Remotion

Video como función del tiempo: cada cuadro es un render de React con
`useCurrentFrame()`. Todo lo que se anima es una interpolación de ese número.

Todo lo de acá sale de una sola idea, la misma que en los folletos
(`lienzo-de-diseno`): **el video se construye por capas que el usuario aprueba
de a una, y cada decisión estética sale de algo real, no de la memoria.**

Y una advertencia sobre esta skill misma: **fija el piso, no el techo.** Que
algo no esté escrito acá no autoriza a entregarlo sin eso. Un video que cumple
todos los puntos y aun así no tiene nada para mirar, o llena el cuadro con texto,
está mal entregado.

## Qué tipo de pedido es

| Pedido | Cómo se trabaja |
|---|---|
| Un video o una pieza nueva, o rehacer una escena desde cero | Los siete pasos, uno por vez (abajo) |
| Un ajuste puntual en una escena que ya existe («subí el titular», «que dure menos») | Directo: still o hoja de contactos de lo tocado, se manda y se espera el sí antes del render final. Sin pasos |
| Un render o una versión de algo ya aprobado | Directo, pero con la hoja primero (ver «Cómo se muestra cada paso»): [references/render.md](references/render.md) |
| Algo se rompe (parpadeo, cuadro en blanco, timeout) | Directo: el diagnóstico de [references/render.md](references/render.md#diagnostico) |
| «Tengo un video hecho en render» | Es una referencia estética para otra pieza, no un mp4 para embeber: se miran sus stills y su CSS |

Qué proyectos existen, dónde están y sus comandos:
[references/proyectos.md](references/proyectos.md). **Sin git no hay cómo volver
atrás**: antes de una reescritura grande, copiar el archivo a `respaldo/`.

## Siete pasos, uno por vez

| Paso | Qué se agrega | Qué todavía no entra |
|---|---|---|
| 1. Guion y montaje | la lista de bloques con su duración, y en cada uno las cajas de lo que va a ir, con su rótulo («Titular», «Foto de la sede») | fondo final, imágenes, texto real, movimiento |
| 2. Fondo | la base de color y la atmósfera encima (líneas, halos, trama, grilla), **una sola vez para todo el bloque** | imágenes, texto, logo |
| 3. Imágenes y elementos | fotos, video, ilustraciones, SVG con volumen, piezas de UIverse, gráfica de los márgenes, logo | texto real |
| 4. Tipografía | el texto real, con su escala, su jerarquía y el cuerpo calculado | elementos nuevos |
| 5. Movimiento | entradas, escalonado, recorridos de cámara y transiciones | audio |
| 6. Audio | música, locución, mezcla y cortes contra el audio | elementos nuevos |
| 7. Cohesión y entrega | nada nuevo: se ajusta lo que hay, se revisa y se renderiza | — |

**Del 1 al 4 todo se juzga quieto**, en el cuadro de póster de cada bloque (el
instante en que ya entró todo lo de la escena). El movimiento recién entra en el
5: animar una escena cuyo fondo todavía no está aprobado es animar dos veces.

Cómo se avanza:

- **Un paso por mensaje, y ahí se frena.** Se arma el paso, se mira (ver «Cómo
  se muestra cada paso»), se manda y se espera. No se adelanta el siguiente
  «para ganar tiempo» ni se muestran dos pasos juntos.
- **Cada paso se muestra con tres opciones, siempre.** Tres variantes realmente
  distintas —otro recurso, otra composición o otro color, no la misma con un
  ajuste—, en una sola hoja, rotuladas A, B y C, y cada una con la pieza o la
  referencia de la que sale. **La hoja pone las opciones en columnas y los
  bloques en filas, y rotula cada panel (`1A`, `1B`, `1C`, `2A`…)**, porque el
  usuario elige por bloque, no una opción para todo el video: el montaje tiene
  que poder tomar un estilo distinto en cada bloque. Recién con su elección se
  aprueba. Lo pidió el usuario el 24/09/2026 tras rechazar un fondo mostrado
  solo: con una sola propuesta no puede comparar, sólo aceptar o rechazar.
- **Sólo un sí explícito aprueba** («dale», «va», «aprobado», «seguí»). Un
  comentario o una pregunta no es aprobación: se responde, se corrige si hace
  falta, se vuelve a mostrar y se sigue en el mismo paso.
- **«Vamos con el bloque N» es afinar, no rehacer.** Lo elegido de ese bloque se
  queda como base y las tres opciones son ajustes finos sobre eso (tamaños,
  alineaciones, un detalle), no composiciones nuevas.
- **Si lo desaprueba, se rehace el mismo paso** con lo que dijo, y otra vez con
  tres opciones nuevas: ninguna repite una rechazada. Si no queda claro qué no
  le gusta, una pregunta concreta, no un cuestionario.
- **Todo lo rechazado va al `HISTORIAL-DESCARTES.md` del proyecto** en el
  momento (ver «Lo descartado no se vuelve a proponer»).
- **Lo aprobado queda congelado.** Si un paso posterior necesita tocar una capa
  ya aprobada —el titular no entra en su caja, la locución pide más tiempo—, se
  dice y se pregunta antes de cambiarla.
- **El mensaje de cada paso es corto**: la imagen, qué se hizo en dos o tres
  líneas y de dónde salió (qué pieza de UIverse, qué foto, qué referencia). Sin
  resumen de lo anterior ni adelanto de lo que viene.
- **Si hay versión horizontal y vertical**, cada paso se hace en las dos a la
  vez y se muestran juntas: la vertical no es la horizontal reescalada
  ([references/oficio.md](references/oficio.md#vertical-y-redes)).
- **El código vive en el proyecto** (`contenidos/<casa>/remotion/<proyecto>/`);
  **las capturas, hojas y variantes de cada paso, en
  `contenidos/<casa>/en-curso/AAAA-MM-DD-<pieza>/`**, que se crea antes del
  paso 1, numeradas (`paso-1-montaje.png`, `paso-2-fondo.png`…) para poder volver
  a mirar lo aprobado. Es la misma composición la que crece, no una nueva por
  paso.

## Antes del paso 1: el encargo

Esto no se muestra ni se aprueba. Se reúne, y si falta algo se pregunta ahora,
que es el único momento en que se pregunta antes de mostrar:

- **Casa** (Siglo 21, Teclab, Identidad Argentina, o el CAU si es general),
  **formato** (1920x1080, 1080x1920, los dos) y **dónde se va a ver**: una
  pantalla de sala a tres metros y un celular a 30 cm sin sonido no comparten
  ni un cuerpo tipográfico ([references/oficio.md](references/oficio.md#legibilidad)).
- **Qué tiene que decir y a quién**, con los datos reales, y **cuánto dura**.
  **Los datos salen de las fuentes** —el sitio, la base (`npm run db`),
  `cau_brand`— o del usuario, **nunca de un video anterior**: uno de agosto
  puede tener un horario que ya cambió. Si una fuente y el usuario no coinciden,
  se pregunta.
- **Si hay locución, el archivo existe antes del paso 1**: la duración la manda
  el audio, y se mide antes de escribir los bloques.
- **Videos anteriores, sólo los aprobados**, y **el `HISTORIAL-DESCARTES.md`**
  del proyecto si lo hay (ver «Piezas anteriores»).
- Si es del CAU, leer `cau_brand`, `cau_design_patterns` y
  `piezas-para-el-publico`.
- **Sacar la lista de UIverse una sola vez** (ver «De dónde sale cada
  decisión»). Cada paso la filtra después por sus propias etiquetas.
- **Listar qué material visual pide el caso** (paso 3) y buscarlo ya: si falta
  una foto o un video, conviene saberlo antes de armar el montaje.

## Paso 1: guion y montaje

La columna vertebral del video: cuántos bloques, cuánto dura cada uno, en qué
orden, y dentro de cada uno dónde cae cada cosa. Es el plano de obra y se juzga
como tal.

- **La lista de bloques se escribe en un solo archivo de guion** (id,
  componente, duración, transición de salida), con los tiempos en segundos por
  `fps`. Cómo se estructura: [references/proyectos.md](references/proyectos.md#cómo-se-estructura-un-proyecto-que-crece).
- **Cuánto dura un bloque**: si hay locución, lo que dura su frase; si no, el
  tiempo de leer la placa en voz alta, más aire
  ([references/oficio.md](references/oficio.md#tiempos)).
- **Cada bloque, sobre un fondo neutro, con sus cajas rotuladas** («Titular»,
  «Dato», «Foto de la sede», «Logo»): el rótulo chico y en gris, con la clase
  `.rotulo-guia`, para que no se confunda con texto del video. En el paso 3 se
  van los de las cajas que reciben imagen, y en el 4 los que quedan.
- **Las cajas se miden para el contenido real**: un titular de tres palabras no
  necesita medio cuadro, y cinco carreras no entran en una caja pensada para
  tres.
- **Las alturas se anclan, no se centran**, para que entre bloque y bloque los
  elementos no salten ([references/oficio.md](references/oficio.md#composicion)).
- **Los primeros dos segundos**, en redes, arrancan por lo que se ve, no por el
  sello.
- **La marca es una decisión del video, no un casillero fijo.** Se decide acá,
  mirando el caso, y se dice en el mensaje con el motivo, en una línea: si va el
  logo, en qué bloques y con cuánto peso. En piezas de otra casa, la sede se
  marca con el logo del CAU en blanco y no con el texto «CAU Villa Lugano».
- **Se muestra**: la lista de bloques con su duración y una hoja con el cuadro de
  póster de cada uno.

## Paso 2: el fondo

Todo lo que está detrás del contenido, en dos capas: la **base** (color o
degradado de la paleta) y la **atmósfera** encima —líneas, halos, grilla, trama,
ruido, gráfica anclada a los bordes—, para que ningún bloque quede plano.

- Sale de la paleta de la casa (ver «La marca»); no se inventa un color.
- **Se monta una vez para todo el tramo**, no adentro de cada placa: si entra con
  cada una, parpadea en cada corte.
- **La atmósfera se arma sabiendo dónde cae el contenido** (el paso 1 ya lo
  dice): más presente en los bordes y en lo que queda libre, más suave donde van
  el titular o la foto.
- **Texto sobre foto no se sostiene apagando la foto entera**: eso vuelve a todas
  las escenas la misma textura. Se sostiene con un velo con forma, y se prepara
  acá.
- Blancos y negros puros no: cremas y negros teñidos hacia la paleta.
- Etiquetas para filtrar la lista de UIverse: `fondo`, `aurora`, `líneas`,
  `halo`, `patrón`, `textura`, `trama`, `grilla`, `ruido`, `degradado`.
  Para video se suman las `loaders` del catálogo abierto, que casi nunca son
  loaders: son el movimiento de fondo de una escena
  ([references/elementos.md](references/elementos.md)).

## Paso 3: imágenes y elementos

Adentro de las cajas aprobadas entra todo lo que se mira y no se lee: fotos,
video, ilustraciones, piezas de UIverse, íconos, el logo, y la gráfica de
sistema de los márgenes. Todavía sin texto real.

**El error más caro no es elegir mal una fuente: es un video que no tiene nada
para mirar.** Placas de color con texto encima no son material visual. La
pregunta es «¿qué le muestro a quien mira esto?», y se responde leyendo el caso
aunque el pedido no lo diga.

- **Primero el repo y el proyecto**: `public/imagenes/` del sitio (la sede, las
  carreras, las materias) y el `public/` del proyecto de video.
- **Después UIverse**, la lista del encargo filtrada por lo que pida el caso, y
  los paquetes y bloques de Remotion: [references/elementos.md](references/elementos.md).
  Ninguna pieza de UIverse entra tal cual: sus `@keyframes`, `:hover` y
  `transition` se rehacen en frames.
- **Si no está, se dibuja**: SVG con volumen —gradiente, canto, sombra— queda
  nítido a cualquier escala.
- **Una forma conocida primero se busca, no se dibuja.** Nube, escudo, candado,
  engranaje: están en bibliotecas de íconos abiertas que se instalan por npm
  —Tabler (MIT), Phosphor (MIT), Material Symbols (Apache-2.0), Lucide (ISC)—,
  con variantes rellenas. Se trae el `path`, se anota de dónde salió y su
  licencia en un comentario, y se ofrecen las de dos o tres bibliotecas.
- **Si hay que dibujarla, se arma con primitivas, no con un contorno a mano.**
  Una nube son círculos apoyados en una base de extremos redondos; un escudo, un
  corazón o una gota, lo mismo con sus piezas. Dibujadas con arcos sueltos en un
  solo `path`, un lado sale siempre deformado (pasó varias veces con la nube,
  siempre del lado izquierdo). Se arman una vez como componente y se reusan, y
  se miran a tamaño real antes de mostrarlas.
- **De internet, con permiso**: se propone con su link y su licencia antes de
  bajarlo, y el crédito va en un comentario del código.
- **Logos y marcas se calcan, no se dibujan** (skill `calcar-imagenes`), y se
  usa el oficial que ya exista en el proyecto.
- **Las zonas que quedaron vacías se llenan con gráfica**, no esperando al
  texto, anclada a los bordes y nunca sobre la cara del sujeto
  ([references/oficio.md](references/oficio.md#zonas-vacias)).
- **Las decoraciones salen del kit de la casa** (`src/kit/` del proyecto):
  cuatro o cinco elementos aprobados una vez y reusados. No se inventa una por
  escena; una nueva entra al kit con el sí del usuario, y tiene que poder decir
  para qué está. Si la casa todavía no tiene kit, armarlo es la primera tarea
  de este paso.
- **Se elige por lo que el video necesita, no por lo que hay**, y las fotos que
  van a tener travelling no pueden tener al sujeto contra el borde de arriba.
- Un solo lenguaje óptico: la misma luz en todos los elementos, el mismo trazo
  en todos los íconos. Íconos en SVG, nunca emojis.

## Paso 4: la tipografía

Recién acá entra el texto, **escrito de verdad y con los datos reales**, con las
reglas de `piezas-para-el-publico` desde la primera línea.

- La familia ya está decidida (ver «La marca»). Lo que se resuelve es la
  **escala**, el tracking y el interlineado, declarados en un solo lugar.
- **El cuerpo del titular se calcula por ancho, no se fija**, y se juzga en el
  still reducido a un cuarto: lo que no se lee en la miniatura no se lee de lejos
  ([references/oficio.md](references/oficio.md#legibilidad)).
- **Dos datos por placa.** Lo que es igual en todas se dice una vez, al final.
- **Rótulos de sección, casi siempre ninguno**, y nunca la instrucción del
  pedido convertida en copy («Una fuerte de cada área»).
- **Si falta un dato**, el elemento va sólo con lo que sí es cierto y el
  pendiente va en el mensaje. Nada de «PENDIENTE» en pantalla ni de un número
  inventado.
- **Si el texto no entra en su caja, se ajusta el texto**, no se achica hasta que
  no se lea. Si la caja tiene que cambiar, eso es tocar el paso 1: se pregunta.
- Códigos internos, números de resolución y nomenclaturas no van.

## Paso 5: el movimiento

Todo lo que estaba quieto empieza a moverse: entradas, escalonado, recorridos
sobre las fotos y las transiciones entre bloques. Criterios completos en
[references/oficio.md](references/oficio.md#movimiento-y-transiciones).

- **Escalonar**: primero el titular, el dato secundario un segundo después.
- **Las transiciones se trabajan de a una**, cada corte por separado, y **antes
  de proponer se le pregunta al usuario qué se imagina** para ese corte: las
  tres opciones salen de su idea, no de una transición única repetida en todo
  el video (pedido del usuario, 25/09/2026).
- **Transiciones ópticas** (luz, desenfoque, empuje, latigazo, iris), **encima
  del final de la escena que sale**, no entre las dos.
- **Variar el recorrido entre placas hermanas**, elegido por índice y no al
  azar.
- **Transformar no es destruir y crear**: el elemento que se transforma sigue
  vivo de una escena a la otra, fuera de sus `<Sequence>`, con las propiedades
  desfasadas y no todas con el mismo easing
  ([references/oficio.md](references/oficio.md#transformar-un-elemento)).
- **Cada transición y cada transformación lleva su hoja del corte**: doce
  cuadros en el segundo que la rodea, al lado de la misma hoja sacada de la
  referencia
  ([references/render.md](references/render.md#hoja-del-corte-la-transicion-se-mira-aparte)).
  En la hoja de la escena entera una transición no se ve.
- **Se muestra con la hoja de contactos**, que es lo que yo puedo leer, y el
  mp4 de ojeada va al usuario, que es quien ve la fluidez
  ([references/render.md](references/render.md#hoja-de-contactos-la-unica-forma-de-juzgar-el-movimiento)).

## Paso 6: el audio

Música, locución y efectos, montados con `<Audio>` y medidos con su duración
real ([references/api.md](references/api.md)).

- **Si hay locución, ya mandó en el paso 1.** Acá se ajusta la mezcla: la música
  baja debajo de la voz y los cortes caen donde el audio respira.
- **Lo que se dice también tiene que estar escrito** si el video va a redes, que
  se mira sin sonido.
- La composición no puede durar menos que el audio, o se corta antes del final.
- **Se muestra con el mp4 de ojeada con sonido**, que es lo único que sirve acá.

## Paso 7: cohesión y entrega

No entra nada nuevo. Se mira el video entero para que se lea como una sola
cosa, y se hace la revisión que va siempre antes de entregar:

- Un solo radio, una escala tipográfica, espaciados en múltiplos del mismo
  valor, colores sólo de los tokens.
- **Ningún `.rotulo-guia` ni nota de trabajo renderizada**, y los datos de la
  sede contrastados con `cau_brand`.
- **Contraste real** del texto chico sobre foto y sobre color de acento.
- **En vertical, nada en la zona que la app se come**: ~250 px de abajo, ~130 de
  la derecha y ~120 de arriba.
- Un still de cada bloque, comparado contra lo aprobado.
- **La hoja del video entero al usuario, y con su sí, recién el render**, en
  baja calidad salvo que pida la completa, y en segundo plano. El mp4 va con
  `SendUserFile`.
- **Si el usuario lo da por aprobado**, se pregunta si va a
  `contenidos/<casa>/aprobados/` y, con su sí, se copia en
  `AAAA-MM-DD-<pieza>/` con el mp4, un póster, `ficha.md` (qué es, casa,
  formato, de qué salió cada decisión, qué se probó y no quedó), `codigo/` y
  `proceso.md` (qué proyecto, qué composición, qué comando lo renderiza). Nunca
  se agrega un video ahí sin ese sí. **Después se borra su carpeta de
  `en-curso/`.** El ciclo completo está en `contenidos/LEER.md`.

## Cómo se muestra cada paso

**Mirado de verdad, no imaginado.** Un ajuste que no se vio renderizado no está
hecho: el Studio y el render no siempre coinciden.

**Todo render sale en baja calidad**, con los flags de ojeada (`--scale=0.5
--crf=30 --image-format=jpeg --jpeg-quality=72`), incluido el del paso 7. La
calidad completa se renderiza **sólo si el usuario la pide** explícitamente.

**Antes de un render, la hoja.** Ningún mp4 que se entrega se renderiza sin
haberle mandado antes al usuario la hoja de lo que va a salir (los cuadros de
póster, o la hoja de contactos si hay movimiento) y tener su sí. Vale también
para un ajuste puntual y para una versión de algo ya aprobado: un render tarda
minutos, y descubrir un error ahí es tirarlos. La ojeada que se saca para armar
la hoja de contactos no necesita permiso: es parte de mostrar el paso.

| Paso | Qué miro yo | Qué se le manda |
|---|---|---|
| 1 a 4 | una hoja con el cuadro de póster de cada bloque (`renderStill` por bloque, o una composición de hoja con `<Freeze>`), abierta con Read | esa hoja con las tres opciones (A, B y C), con `SendUserFile` (`display: "render"`) |
| 5 | la hoja de contactos de cada escena tocada, y una hoja del corte por cada transición o transformación | las hojas y el mp4 de ojeada |
| 6 | la duración del audio contra la composición | el mp4 de ojeada con sonido |
| 7 | un still por bloque contra lo aprobado | el mp4 final |

Los comandos de still, ojeada y hoja de contactos, y el truco de empaquetar una
sola vez para sacar diez stills: [references/render.md](references/render.md).

## Cómo se trabaja adentro de un paso

Un paso no es una entrega: son varias vueltas cortas con el usuario.

- **Medir, no mirar.** Dónde corta cada línea, si una cifra se pasa de su caja,
  cuánto dura de verdad el audio. La imagen muestra que algo está corrido; la
  medición dice cuánto. `@remotion/layout-utils` mide texto de verdad.
- **Mostrar el recorte de lo que se tocó**, no el cuadro entero, cuando el
  cambio es un detalle.
- **Las variantes se registran como composiciones aparte**, con otras props, y
  se comparan en una hoja con las tres al lado. La escena no se toca hasta
  que el usuario elige, y la variante que pierde se borra en el momento.
- **Los colores y los efectos salen de las piezas, no del ojo.** Si el usuario
  rechaza dos elegidos a criterio propio, el tercero se busca en sus piezas de
  UIverse y se dice de cuál sale.
- **Cada arreglo se cuenta con su motivo, en una línea.** «Lo bajé a 1,15 s
  porque a 0,6 el destello se leía como un error de render» vale; «quedó mejor»
  no.

Si el usuario pide un detalle de un paso posterior, se hace y se sigue en el paso
en curso. No reemplaza la revisión del paso 7, que se hace igual, completa.

## Lo que vale en todos los pasos

### Reglas técnicas que no se negocian

- **Todo cuadro es una función pura del frame.** Remotion renderiza cuadros en
  paralelo en pestañas que no comparten estado: `Math.random()`, `Date.now()` o
  cualquier estado que avance solo producen parpadeo. Para azar va `random(seed)`
  de Remotion, que es determinista.
- **Adentro de una `<Sequence>` el frame vuelve a cero.** Es la causa número uno
  de «la animación se reinicia en cada corte». Cuando algo tiene que seguir el
  reloj del video entero, se le pasa el segundo absoluto por prop.
- **Los tiempos se escriben en segundos y se multiplican por `fps`**, nunca en
  frames a mano. Un número de frame copiado queda viejo al primer reajuste.
- **Nada de assets que Remotion no sepa esperar**: van `<Img>`, `<Video>`,
  `<OffthreadVideo>`, `<Audio>` y `staticFile()`, no `<img>` pelado ni
  `background-image`. Datos o fuentes externas, con `delayRender()` /
  `continueRender()`.
- **Nunca una API de Remotion de memoria**: cambia entre versiones. `npm ls
  remotion` y la doc ([references/api.md](references/api.md),
  [references/buscar.md](references/buscar.md#duda-tecnica)).

### Lo descartado no se vuelve a proponer

Cada proyecto lleva un `HISTORIAL-DESCARTES.md` en su raíz: qué se probó, qué se
rechazó, por qué, y cuál es la decisión vigente. **Se lee antes de proponer
nada**, y lo que está ahí no se vuelve a ofrecer salvo que el usuario lo pida.

Se escribe **en el momento del rechazo**, no al final: una línea por prueba con
el motivo que dio el usuario («se percibieron infantiles»), y si algo gustó pero
no era para ese lugar, se anota como recurso reutilizable con dónde quedó la
prueba. Si el proyecto no tiene el archivo, se crea con el primer descarte.

### De dónde sale cada decisión

De memoria siempre sale lo mismo: un degradado violeta, un texto que entra con
fade y escala, una cortina de persianas. Eso es el promedio de todo, que es
exactamente lo que no queremos. Cada paso se apoya en algo real, y el mensaje
dice en qué.

**Se empieza por lo propio y no se saltea.** Si el video es de Siglo 21 o de
Teclab, lo propio son las piezas que el usuario marcó para esa casa en la
galería (clave `usos` de `biblioteca/estado.json`), no toda la biblioteca. Cómo
se saca la lista: `diseno-uiverse`, sección «Si la pieza es de Siglo 21 o de
Teclab». **Se busca por etiquetas, no por el nombre de la carpeta.**

Después, las fuentes de afuera y los paquetes de Remotion:
[references/elementos.md](references/elementos.md) y
[references/buscar.md](references/buscar.md). Lo que se trae es **material, no
una plantilla**: de una referencia se toma el mecanismo —y en video el mecanismo
es temporal: «el título entra después del fondo y por eso se lee»—, no la forma.
Los cuerpos y los tiempos de una referencia no se copian nunca.

Decí de dónde salió cada decisión. «El barrido de luz de <link>, más corto y sin
rebote» es una elección; «una transición dinámica» es una corazonada.

### Piezas anteriores

**Los únicos videos anteriores que se miran están en
`contenidos/<casa>/aprobados/`**: los de su casa si es de una sola, los de las
cuatro (`cau`, `siglo21`, `teclab`, `identidad`) si es general o del CAU como
sede. Un video general es del CAU y se guarda en `cau/`. Las composiciones que
hay en un proyecto y nadie aprobó —los shorts sueltos, las variantes, lo de
`out/`— son borradores y no se toman como referencia de nada.

De un video aprobado se toma el mecanismo, no la forma.

### La marca

- **Paleta**: la de la casa, sin mezclar. Siglo 21 en el verde del sitio,
  Teclab cian `#2ee7d7` en Tecnología y violeta `#8e2cf2` en Gestión, Identidad
  Argentina azul `#0090C1` con amarillo `#F1CF1C`. El CAU, `cau_brand`.
- **Tipografía**: la de las piezas, que ya está resuelta — titulares en Inter
  900 con tracking cerrado (-0.03 a -0.045em) y texto en Inter 400/600, vía
  `@remotion/google-fonts`. **Unbounded está vetada**, aunque el sitio la
  cargue. Si un titular va en caja alta, el tracking va apenas positivo: en
  caja alta el negativo pega las letras. Una display distinta se propone en el
  paso 4 antes de aplicarla.
- La marca cierra paleta y tipografía, **no la búsqueda**: composición,
  movimiento y recursos siguen saliendo de las piezas marcadas para esa casa.

### Lo que se ve en pantalla

Sólo lo que le sirve a quien mira (skill `piezas-para-el-publico`). El
pendiente, el criterio de armado, la fuente del dato y cualquier nota de trabajo
van en un comentario del código o en el mensaje al usuario, **nunca en los datos
que se renderizan**.

### Cerrar el trabajo deja los enlaces

Un trabajo que consultó algo deja `referencias/AAAA-MM-DD-<tema>.md` en el
proyecto de video con **los links que se usaron**, uno por línea, incluidos los
mirados y descartados. Es para que el usuario los abra y se guarde en su UIverse
lo que le guste. Se agrega al archivo del día si ya existe, y un ajuste puntual
sin consultas no crea archivo. Formato:
[references/buscar.md](references/buscar.md#el-archivo-de-fuentes).

## Referencias

- [references/proyectos.md](references/proyectos.md): qué proyectos hay, el mapa del institucional y cómo se estructura uno que crece.
- [references/oficio.md](references/oficio.md): legibilidad, tiempos, composición, vertical, movimiento y zonas vacías.
- [references/elementos.md](references/elementos.md): UIverse, paquetes de Remotion, librerías de bloques y fuentes de afuera.
- [references/buscar.md](references/buscar.md): cómo se usa una referencia, cómo se experimenta y el archivo de fuentes.
- [references/render.md](references/render.md): stills, hoja de contactos, render, flags y diagnóstico.
- [references/api.md](references/api.md): la API, lo que cambia entre versiones y el audio.
