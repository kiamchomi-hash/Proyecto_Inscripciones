# De donde salen los elementos, las animaciones y los bloques

Orden de consulta cuando hace falta un elemento y no hay uno obvio: primero lo
que ya esta en la maquina, despues lo que da Remotion, despues la web. Y en los
tres casos lo que se trae es **material**, no una pieza para pegar: ver
[buscar.md](buscar.md#como-se-usa-una-referencia).

## 1. UIverse local (offline, es la primera parada)

Una copia completa del archivo abierto de UIverse en la maquina, con galeria
propia: **3802 piezas** de HTML + CSS, mas las favoritas y las piezas propias
del usuario. Vive en `~/Desktop/uiverse` (si no esta ahi:
`find ~ -maxdepth 3 -name indice-galaxy.json`).

```text
biblioteca/
  indice-galaxy.json   el indice: id, categoria, titulo, autor, etiquetas, url
  galaxy/<Categoria>/<autor>_<slug>.html   la pieza: HTML con su <style> adentro
  estado.json          "favoritas" y "ocultas" — las elegidas por el usuario
  mias/                piezas propias
```

Se busca sin abrir la galeria, que es lo que la hace util en medio de una tarea:

```bash
cd ~/Desktop/uiverse
# por etiqueta o titulo
node -e "JSON.parse(require('fs').readFileSync('biblioteca/indice-galaxy.json','utf8')).piezas
  .filter(p=>JSON.stringify(p).toLowerCase().includes('glow'))
  .slice(0,20).forEach(p=>console.log(p.categoria, '|', p.titulo, '|', p.archivo))"
# las que ya eligio el usuario
node -e "console.log(JSON.parse(require('fs').readFileSync('biblioteca/estado.json','utf8')).favoritas)"
# y despues se lee la pieza entera
cat "biblioteca/galaxy/Cards/<autor>_<slug>.html"
```

Categorias y cuantas hay: `Buttons` 1231, `Cards` 726, `loaders` 718,
`Toggle-switches` 260, `Inputs` 226, `Forms` 180, `Checkboxes` 171,
`Patterns` 103, `Radio-buttons` 102, `Tooltips` 62, `Notifications` 23.

Para video las que sirven casi siempre son otras tres, no las obvias:

- **`loaders`**: son 718 animaciones puras —pulsos, ondas, orbitas, barridos,
  contadores—. Casi ninguna se usa como loader: se usan como el movimiento de
  fondo de una escena, un halo que respira, una barra que avanza.
- **`Patterns`**: texturas y tramas de fondo, que es lo que le saca a una escena
  el aspecto de degradado plano.
- **`Cards`**: bordes de gradiente, vidrio, halos. De ahi salio la tarjeta de la
  cifra de este proyecto.

**Y `favoritas` primero**: son las que ya eligio el usuario, o sea su gusto ya
filtrado. Antes de traer algo nuevo, mirar si entre esas hay una que sirva.

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
