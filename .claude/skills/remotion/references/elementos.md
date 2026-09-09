# De donde salen los elementos, las animaciones y los bloques

Orden de consulta cuando hace falta un elemento y no hay uno obvio: primero lo
que ya esta en la maquina, despues lo que da Remotion, despues la web. Y en los
tres casos lo que se trae es **material**, no una pieza para pegar: ver
[buscar.md](buscar.md#como-se-usa-una-referencia).

## 1. UIverse local (offline, es la primera parada)

La biblioteca de piezas del usuario, en `~/Desktop/uiverse`: HTML + CSS, con sus
favoritas y las suyas propias. **Como se busca ahi lo fija la skill
`diseno-uiverse`**, que es la que manda: orden de consulta, indice, favoritas
primero. No repetir esos comandos aca. Lo que sigue es solo lo que cambia cuando
el destino es video.

Para video sirven casi siempre tres categorias, y no son las obvias:

- **`loaders`**: son cientos de animaciones puras —pulsos, ondas, orbitas,
  barridos, contadores—. Casi ninguna se usa como loader: se usan como el
  movimiento de fondo de una escena, un halo que respira, una barra que avanza.
- **`Patterns`**: texturas y tramas de fondo, que es lo que le saca a una escena
  el aspecto de degradado plano.
- **`Cards`**: bordes de gradiente, vidrio, halos. De ahi salio la tarjeta de la
  cifra de este proyecto.

### Como se adapta una pieza de UIverse a Remotion

Ninguna entra tal cual. Lo que hay que rehacer siempre:

| En la pieza | En Remotion |
|---|---|
| `@keyframes` + `animation` | el progreso sale del frame: `interpolate(frame, ...)`. Una animacion CSS corre en tiempo de pared y en el render sale congelada o parpadea |
| `:hover`, `:focus`, `:active` | no existen. Ese estado se dispara con el tiempo |
| `transition` | tampoco: no hay eventos, hay cuadros |
| tamanos en `px` pensados para una web | el cuadro es 1920x1080 y se mira de lejos: casi todo hay que multiplicarlo por 3 o 4 |
| colores del original | van a la paleta del proyecto |

Y queda **el credito en un comentario del CSS**, con autor y link, como hace
`.oferta-cifra-marco` en este proyecto: UIverse es MIT, pero la pieza la escribio
alguien.

## 2. Lo que ya trae Remotion

Antes de escribir una utilidad, ver si es un paquete oficial. La lista completa
esta en `remotion.dev/docs/api`; los que mas se usan:

- **`@remotion/transitions`** — `<TransitionSeries>` y presets de timing para
  pasar de una escena a otra.
- **`@remotion/shapes`** — `<Triangle>`, `<Star>`, `<Pie>`, `<Circle>`, tambien
  como funciones que devuelven el path (`makeStar()`).
- **`@remotion/paths`** — utilidades sobre paths SVG: largo, punto en el
  recorrido, recortar. Es lo que hace que un trazo se dibuje solo.
- **`@remotion/motion-blur`** — `<Trail>` y `<CameraMotionBlur>`.
- **`@remotion/google-fonts`** — fuentes sin archivos ni `@font-face`.
- **`@remotion/layout-utils`** — medir texto de verdad (`measureText`, `fitText`)
  en vez de estimar el ancho con una constante.

Tambien hay paquetes para lottie, gif, noise, three y skia: confirmar el nombre
y la API en la doc antes de instalarlos.

## 3. Bloques y ejemplos hechos en Remotion

Cuando lo que falta es un bloque entero (un contador, un mapa, un texto que se
transforma), ya existe hecho:

- **Librerias de componentes**: Remocn (`remocn.dev`), RemotionUI
  (`remotionui.com`), Onda (`onda.video`), snapcn (`snapcn.dev`), Remotion Bits
  (`remotion-bits.dev`), ClippKit (`clippkit.com`).
- **Ejemplos oficiales**, uno por tecnica, en `github.com/remotion-dev`:
  `typewriter`, `morph-text` (texto que se transforma), `3d-text`, `d3-example`,
  `anime-example`, `remotion-gl-transitions`, `mapbox-example`,
  `video-with-jump-cuts`.
- **Plantillas**: audiogram, music-visualization, three, skia.
- **Showcase** (`remotion.dev/showcase`) para ver que se puede hacer, y el
  **Discord** cuando algo no cierra.

## 4. Fuera de Remotion

- **Codrops** (`tympanus.net/codrops`): demos de efectos con su articulo. Es la
  mejor fuente para entender *como* se hace un efecto, no solo para verlo.
- **CodePen**: buscar por efecto (`text reveal`, `grid distortion`).
- **Animista** (`animista.net`): generador de animaciones CSS. Sirve como
  catalogo de gestos aunque despues se reescriba en frames.
- **easings.net**: las curvas con su formula, para elegir con criterio en vez de
  poner `easeInOut` en todo.
- **LottieFiles**: animaciones vectoriales listas, si el proyecto tiene lottie.

## 5. Y si no aparece nada

Entonces se inventa, que es la parte que vale: un elemento propio armado con lo
que ya tiene el proyecto (una regla, un halo, una luz que recorre, un numeral
como marca de agua). Ver [buscar.md](buscar.md#experimentar) — la busqueda es
para no arrancar de cero, no para terminar copiando.
