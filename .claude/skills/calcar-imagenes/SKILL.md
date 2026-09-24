---
name: calcar-imagenes
description: Reproducir en una pieza una imagen que ya existe — el logo de una marca, su logotipo, una mascota, un sprite, un ícono, un cuadro de una animación. Usar ANTES de dibujar nada cuando lo que hay que poner es algo reconocible, sobre todo si es pixel art. Fija que esas formas se calcan y no se dibujan, de dónde se saca el original, cómo medirlo en vez de suponerlo, y los seis errores que ya se cometieron: suponer el tamaño de celda, perder los trazos finos al promediar, perder los colores de poca superficie, confundir un hueco con una muesca, dejar el halo del fondo y redibujar lo que se podía calcar.
---

# Lo reconocible se calca, no se dibuja

Una forma que la gente ya conoce —la burbuja de WhatsApp, un auricular de
teléfono, el cangrejo de Claude Code, la chispa de Anthropic— se reconoce por
proporción exacta, no por parecido. Dibujada de memoria sale mal y el usuario lo
ve enseguida: pasó cuatro veces seguidas en el folleto de computación, con la
burbuja de WhatsApp, con el auricular, con la mascota inventada y con el pet de
Codex redibujado.

> Si la forma existe, se consigue el original y se calca. Sólo se dibuja lo que
> no existe: una carpeta, un sobre, una laptop, unas barras de nivel.

## De dónde sale el original

En este orden:

1. **El propio proyecto.** El sitio ya tenía el trazo oficial de WhatsApp en
   `components/icons.tsx`. Mirar ahí antes de salir a buscar.
2. **Bibliotecas de íconos abiertas**, por CDN y sin instalar nada:
   - `https://cdn.jsdelivr.net/npm/simple-icons/icons/<marca>.svg` — marcas.
   - `https://cdn.jsdelivr.net/npm/@lobehub/icons-static-svg/icons/<marca>.svg`
     y `…/<marca>-text.svg` y `…/<marca>-color.svg` — símbolo, **logotipo** y
     versión en color de las marcas de IA.
   - `https://cdn.jsdelivr.net/npm/bootstrap-icons/icons/<nombre>.svg`,
     `heroicons/24/solid/<nombre>.svg`, `@material-symbols/svg-400/rounded/<nombre>-fill.svg`
     — objetos genéricos (teléfono, calendario, sobre), todos con licencia libre.
3. **La animación o el video oficial**, cuando el personaje sólo vive ahí. Un
   GIF se baja con `curl` y se lee cuadro por cuadro con `sharp({ page: n })`.
   Si el video está en X, la **imagen de portada** suele ser pública: se saca
   del DOM (`document.querySelectorAll('video')[0].poster`) y se baja aparte.
4. **Pedirle la referencia al usuario.** Si tiene el GIF o la hoja de poses, es
   la vía más rápida y la mejor: las hojas en alta dan mucho mejor resultado que
   un cuadro de video comprimido.

**El logotipo también se calca.** Si la marca usa una tipografía de licencia
paga —Anthropic usa Styrene—, imitarla con otra fuente se nota. Se trae el
logotipo como trazo y las letras son las suyas.

## Cómo se calca

### Si el original es vector

Directo: se toman los `d="…"` y el `viewBox`, y se emite el SVG con el color que
pida la pieza. Dos cuidados:

- **Degradés**: no alcanza con pintar el trazo. Se trae el SVG entero y se le
  **renombran los identificadores**, que si no chocan con los de otra marca en
  la misma página.
- **Pixelar un vector**: se rasteriza en un canvas y cada celda se llena si el
  trazo la tapa más de la mitad. Dejar **una celda de margen** para que el
  contorno tenga dónde apoyarse.

### Si el original es un mapa de píxeles

El error que más cuesta es **suponer el tamaño de celda**. Un sprite que se ve
de 4 px puede estar en 5,75, y con la medida equivocada sale estirado, con el
doble de columnas y las patas cortas.

Se mide así: para una fila y una columna que crucen el dibujo, se listan los
**tramos llenos** y sus límites. Los bordes caen siempre en múltiplos de la
celda; de ahí sale la medida y también el origen de la grilla.

Después:

- **Cada celda toma el color que más se repite entre sus píxeles, no el
  promedio.** Promediando, un trazo de uno o dos píxeles —los ojos, un prompt en
  una pantalla— se disuelve en el fondo.
- **Los colores de poca superficie no entran por frecuencia.** El cian de los
  ojos ocupaba nada y quedaba fuera de la paleta: se busca aparte —el píxel
  donde el verde y el azul más superan al rojo— y se suma a mano.
- **Si el original tiene sombras suaves, no cuantizar.** Copiar píxel a píxel
  (celda 1) con una paleta holgada. En una pieza impresa el peso no importa:
  147 KB de SVG no son un problema y el escalonado sí.

### El fondo y los huecos

Un sprite sobre negro trae dos cosas que parecen iguales y no lo son:

- **El fondo**, que se toca con el borde de la imagen.
- **Los huecos del personaje** —los ojos—, que son del mismo color pero quedan
  encerrados.

Se separan con un relleno desde el borde: lo oscuro que se conecta con el
exterior es fondo; lo oscuro encerrado es un ojo y se pinta en tinta, porque
sobre el papel de la pieza el fondo ya no es negro.

**Ojo con las muescas.** Un ojo puede no estar encerrado sino abierto contra el
contorno: sobre negro se ve igual, sobre papel desaparece. Eso se mide (dónde
arranca el cuerpo en cada fila) y se agrega a mano, con su escalón de esquina si
lo tiene. Cambiar de cuadro para esquivarlo es matar una mosca a cañonazos: el
otro cuadro trae otra pose.

**El halo.** No alcanza con descartar el color más claro de la paleta: los
bordes traen grises casi blancos de la compresión y dejan un halo rectangular.
Se descarta todo lo que pase cierta luminosidad.

## Cómo se entrega

SVG, no imagen: `shape-rendering="crispEdges"`, un `<path>` por color y las
**corridas horizontales del mismo color unidas en un solo rectángulo**. Así
pesa poco, escala sin interpolar y sobrevive al PDF.

Para que el dibujo hable el idioma de una pieza de pixel art se le agrega
después el **contorno por fuera de la silueta** y la **sombra dura corrida un
píxel**. Eso es de la pieza, no del original.

## Cómo se verifica

Al lado del original, **al mismo tamaño**, y mirando el recorte — no la pieza
entera. Si algo no cierra, medir: contar columnas, listar tramos, comparar
posiciones. Cuatro de los cinco errores de este folleto se encontraron midiendo
y ninguno mirando.

## Lo que no decide el que calca

Usar la marca o la mascota de un tercero en una pieza que promociona algo es una
decisión del usuario. Se avisa una vez, en una línea, y se hace. Lo que sí
corresponde es no inventar: si un personaje no tiene versión oficial, decirlo en
vez de presentar un dibujo propio como si lo fuera.

## Implementaciones que ya funcionan

En `contenidos/cau/aprobados/2026-09-22-folleto-computacion-pixel/` del proyecto del CAU:

- `icono-trazado.mjs` — pixela cualquier trazo SVG en una grilla.
- `clawd-pixel.mjs` — `cuadroASvg()`: copia un cuadro de un GIF píxel por píxel,
  separa fondo de huecos y permite agregar muescas a mano.
- `pet-codex-pixel.mjs` — `trazarPet()`: mide la celda, arma la paleta por
  frecuencia, rescata los colores raros y emite el SVG.
- `marca-claude.mjs` — baja símbolo y logotipo de una marca y los compone.
