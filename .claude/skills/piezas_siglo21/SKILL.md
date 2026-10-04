---
name: piezas_siglo21
description: "Disparador: folleto, afiche, placa, flyer, banner, historia, posteo o mail de Universidad Siglo 21. Copia el Visual System 2025 de Siglo 21: paleta petróleo, cian, violeta y ámbar, DM Sans, mosaico de bloques, píldoras con foto y recursos geométricos."
license: Apache-2.0
metadata:
  author: "kiamchomi-hash"
  version: "1.0"
---

## Cuándo se usa

Toda pieza gráfica de Universidad Siglo 21: folleto, afiche, placa de WhatsApp, posteo, historia, banner o mail. Va junto con `lienzo-de-diseno`, que fija el proceso de seis pasos, y con `piezas-para-el-publico`, que fija el texto. Esta skill decide la **marca**; las otras dos, el **proceso** y el **texto**. Si la pieza es del CAU como sede, manda `cau_brand`; esta skill es para las piezas que hablan de Siglo 21.

## Reglas fijas

- **Se copia el sistema oficial, no se inventa otro.** La fuente es el *Visual System 2025 – Universidad Siglo 21*, sistema oficial de la universidad hecho por Lucía Formini para el área de Branding y Comunicación Institucional (publicado en Behance el 15/09/2025), copiado en `contenidos/siglo21/oficial/visual-system-2025/`. Las piezas de `contenidos/siglo21/aprobados/` **no se abren salvo que el usuario lo pida**: ni para la composición, ni para el estilo, ni para las herramientas.
- **Paleta, medida con cuentagotas sobre la lámina original:**
  | Rol | Hex |
  |---|---|
  | Petróleo: fondo dominante, texto sobre claro | `#003838` |
  | Petróleo tarjeta (un punto más claro, para apilar planos) | `#0A3839` |
  | Cian: bloques, píldoras, flechas, CTA | `#00C3B3` |
  | Violeta: bloques, franjas de fecha, botón de mail | `#5D4594` |
  | Ámbar: bloques, franja del mensaje clave | `#E49A05` |
  | Lila casi blanco: texto sobre oscuro, papel | `#F2F0F7` |
  Es la misma familia que el sitio (`--color-deep-dark-bg #013729`, `--color-highlight #00c7b1`, `--color-gold #e69b05`): en una pieza de Siglo 21 van los valores de esta tabla. El verde de marca del CAU (`#058c70`) y el azul `#005587` no entran.
- **Variantes de tono: cada pieza elige las suyas.** Si todas salen con los mismos cuatro valores base, las piezas se ven iguales entre sí (el usuario lo marcó el 26/09/2026). Cada color tiene tres tonos, relevados en la lámina, donde el sistema ya los usa en sombras y planos apilados:
  | Color | Hondo | Base | Claro |
  |---|---|---|---|
  | Petróleo | `#002B2B` | `#003838` | `#0E4A48` |
  | Cian | `#009888` | `#00C3B3` | `#3FD6C8` |
  | Violeta | `#483070` | `#5D4594` | `#7560AE` |
  | Ámbar | `#C88800` | `#E49A05` | `#F0B030` |

  Cómo se usan:
  - **Al armar el fondo (paso 1) se decide la combinación y se dice en el mensaje**, por ejemplo «violeta hondo, cian claro, ámbar base». Que no sean los cuatro base es lo esperable, no la excepción.
  - **Dentro de una pieza, cada color va en un solo tono.** Dos violetas distintos en la misma pieza se leen como un error, no como variación.
  - **También rota qué color lleva a la persona.** No siempre va sobre violeta: el bloque de la foto puede ser cian, violeta o ámbar, según lo que contraste con la ropa.
  - **El texto manda sobre el tono.** El petróleo va sobre cian base o claro y sobre ámbar base o claro (de 5,5 a 7,2:1). El lila va sobre los tres petróleos y los tres violetas (el claro, 4,6:1, es el más justo), y sobre cian hondo sólo en titulares de 48 px o más (3,2:1). Cian hondo y ámbar hondo no llevan texto chico de ningún color. Estos pares están medidos; uno nuevo se mide antes de usarlo.
  - **Nunca se degrada de un tono a otro.** El degradado tonal de la terminación sigue saliendo del tono elegido.
- **Además de la pieza con el sistema, dos propuestas con otros colores** (pedido del usuario, 26/09/2026). Se arranca siempre con el sistema de esta skill, y junto con la entrega se muestran dos imágenes más: la misma pieza, con la misma composición, tipografía, recursos y terminación, pero con otra paleta. Cada paleta respeta la estructura del sistema:
  - un **fondo oscuro** que ocupa el lugar del petróleo (no más del 40%);
  - **tres acentos** planos que ocupan el lugar del cian, el violeta y el ámbar;
  - un **claro** para el texto sobre oscuro.

  Cómo se arman:
  - Las dos paletas son distintas entre sí y de la del sistema. No son variantes de tono de las cuatro familias, que eso ya lo cubre la tabla de arriba.
  - Se dice de dónde sale cada paleta, en una línea: una referencia real o una pieza de UIverse, no la memoria.
  - Rigen los mismos pisos: el texto sobre cada acento se mide antes de mostrarlo, y los que no llegan a 4,5:1 no llevan texto chico.
  - El logo de Siglo 21 y el sello del CAU no cambian de color. La persona va sobre el acento que contraste con su ropa.
  - Se hacen reemplazando los tokens, no copiando la pieza: cambiar de paleta es cambiar el bloque `:root`.
  - Son propuestas: la pieza que se entrega es la del sistema, salvo que el usuario elija otra.
  - Primera prueba (Martillero, 26/09/2026). Gustaron el negro `#262722` con el azul `#146EF5`, y el verde `#1A9D64` con el naranja `#E39412`. No gustaron el amarillo `#FFF25D`, el rosa `#FF98C7`, el ciruela `#4F2D3D` ni el violeta `#6F5CFF`.
- **Proporción**: el petróleo es la base, pero **no pasa del 40% de la pieza**: fuera de la zona del titular y la banda del logo, las celdas van en cian, violeta y ámbar, en bloques planos y **nunca en degradé** entre ellos. Con más petróleo la pieza se ve apagada: el usuario lo marcó el 26/09/2026 («abusás el verde bosque»).
- **Píldora «Inscribite»** (tramo-3, posteos 4, 5 y 6): **rellena** en `#2FC1B0`, con un círculo `#279383` a la izquierda. No va de contorno. **El texto va en petróleo, no en blanco como en la lámina**: blanco sobre `#2FC1B0` da 2:1 y es la acción principal; petróleo da 5,6:1 (elegido por el usuario el 26/09/2026). Ninguno de los tres acentos lleva texto chico blanco encima salvo el violeta.
- **Tipografía: DM Sans.** Titulares en Regular o Medium, grandes y con interlineado ~1.1 —el sistema titula liviano, no en negra—; el énfasis va con una palabra en versalitas Bold («Vibrá con tu **PROPÓSITO**») o en Bold dentro de la bajada. Datos (fecha, hora) en DM Sans con la cifra grande y el mes chico al lado («18 *de marzo*»). Esto reemplaza en Siglo 21 a la Inter 900 que `lienzo-de-diseno` fija para las demás piezas. Unbounded sigue vetada.
- **Logo:** siempre el original «UNIVERSIDAD SIGLO 21» con el isotipo del 21 en caja, en blanco sobre petróleo. En el repo: `public/imagenes/imagenes_cau/siglo21-marca.svg` y `logoSiglo21.png`. Va al pie, centrado, o como isotipo solo en una celda del mosaico. No se redibuja (skill `calcar-imagenes`).
- **Foto de estudiantes**, sonrientes, con notebook, tablet o celular, **recortada sin fondo** y montada sobre **un bloque de color completo**: la celda entera del mosaico en cian, violeta o ámbar, o la píldora vertical que la llena de borde a borde. **Nunca sobre un óvalo o una mancha chica** que la persona tapa casi entera: se probó el 26/09/2026 y el usuario lo rechazó. La otra forma de foto es el rectángulo a sangre de una escena real (alguien estudiando).
- **Banco de personas:** `contenidos/siglo21/imagenes_personas/`, que es la carpeta de las imágenes de personas de Siglo 21 y de las casas sin carpeta propia. Las de Teclab van, desde el 04/10/2026, a `contenidos/teclab/imagenes_personas/`. PNG con transparencia, generadas con IA (personas que no existen, así no hay consentimiento que pedir). Si hace falta otra, se le pasa al usuario el prompt para ChatGPT o Firefly; Claude no genera imágenes.
- **Sin agregados fuera del sistema**: ni signos matemáticos, ni texturas temáticas, ni íconos de la carrera. El tema de la carrera lo lleva el texto.
- **Terminación (26/09/2026, pedida por el usuario):** cada bloque lleva un degradado **tonal** de su propio color, con luz arriba a la izquierda y sombra abajo a la derecha, y toda la pieza, un grano fino en overlay (`tarjetas-degradado-granulado-elevenlabs` de UIverse, al ~32%). Plano del todo se ve digital y chato.
- **El bloque de la foto va limpio**: ni estrella ni flor ni ningún recurso encima o pegado a la persona. Los recursos van en celdas propias, lejos de la foto.
- **Sin franjas diagonales a sangre**, ni en banda ni en columna: el usuario las descartó el 26/09/2026. Los recursos van en celdas chicas del mosaico.
- **Recursos gráficos del sistema** (se dibujan en SVG, planos, con trazo de 2 a 3 px en petróleo o cian): franjas diagonales cian/petróleo, espiral de anillos (resorte), estrella de ocho puntas, flor de cuatro círculos, remolino de trazos curvos, flechas gruesas (↘ ↓ ↑ →). Van **de a uno por celda** de un mosaico, nunca sueltos flotando.

## Tamaños

- **Posteo de Instagram: 1080×1080** (aprobado el 26/09/2026; el 1080×1350 quedó «muy largo»). Se exporta también a 2160×2160, que Instagram comprime menos.
- Se pueden sugerir otros tamaños cuando el caso lo pida (historia 1080×1920, 1080×1350, banner, A4), diciéndolo en el encargo; si no se pide otro, va el aprobado.

## Qué composición usar

| Pieza | Composición (detalle en `references/composiciones.md`) |
|---|---|
| Anuncio con fecha (inicio de clases, acto, charla) | A: Tarjeta con franjas de dato |
| Posteo de marca o campaña | B: Mosaico de bloques con persona |
| Varias personas o carreras | C: Columna de píldoras |
| Lista, pasos o beneficios | D: Numerado con franja lateral |
| Portada de campaña o banner ancho | E: Mosaico de portada |
| Mail o folleto de lectura | F: Mail en bloques |

**Alternativas de la línea de campaña «Estudiar es un acto de rebeldía»** (27/09/2026). A–F siguen siendo la base; estas están para que las piezas no salgan todas iguales. Cuando una pieza de A–F ya se hizo para el mismo encargo, o el usuario pide variedad, se propone una de estas. Tienen sus propias reglas (titular cian, violeta de campaña `#6A237E`, banda verde del logo, retrato con fondo propio, sólo el triángulo como recurso), que valen **sólo dentro de G, H e I**: no se mezclan con A–F.

| Pieza | Composición |
|---|---|
| Ficha de una carrera, con o sin fecha de inicio o sede | G: Ficha de carrera en tres bandas |
| Banner ancho, hero o portada | H: Banner de campaña horizontal |
| Ficha de carrera, cuando G ya se repitió | I: «Estudiá» con persona que cruza bandas |

## Pasos

1. Leé `references/composiciones.md` y abrí `contenidos/siglo21/oficial/visual-system-2025/` (los `tramo-N.png` se leen enteros); si la composición es G, H o I, abrí además `contenidos/siglo21/oficial/campana-rebeldia/`. No abras `contenidos/siglo21/aprobados/` salvo que el usuario lo pida (26/09/2026: se leyó la pieza de Matemática sin pedido y lo marcó).
2. En cada paso de ese proceso, decí de qué parte del sistema sale la decisión (composición y tramo).
3. Antes de mostrar, compará lado a lado con el tramo más parecido: paleta, peso del titular, lugar del logo y cantidad de recursos.

## Qué entregás

La pieza, más una línea por decisión que diga de qué parte del sistema salió.

## Referencias

- `references/composiciones.md`: las seis composiciones del sistema y las tres de la línea de campaña, con medidas y la pieza de origen.
- `contenidos/siglo21/oficial/campana-rebeldia/`: las piezas de campaña de las que salen G, H e I.
