# Catálogo: qué pieza usar para cada necesidad

Mapa de la biblioteca local (`~/Desktop/uiverse`) por **necesidad de UI**, no por
categoría de UIverse. Cada entrada da la opción principal y **alternativas
reales** —no variantes de lo mismo— para que se pueda elegir según la dirección
estética elegida.

Rutas:

- `descargas/<slug>/` → favoritos importados de la cuenta. Traen `meta.json`,
  `pieza.html`, `pieza.css`.
- `biblioteca/galaxy/<Categoría>/<autor>_<slug>.html` → catálogo abierto. Un
  solo archivo con el `<style>` adentro.

`★` = marcada como favorita en `biblioteca/estado.json`.
`⬤` = ya adaptada en el proyecto **frutillas**; ver `src/app/globals.css`.

> **Antes de proponer nada, leé la clave `ocultas` de
> `biblioteca/estado.json`.** Son piezas que el usuario **borró**. Hoy incluyen
> `favoritos/aatreyushau-lazy-quail-10` (el loader del kiwi), que sigue estando
> en `descargas/` pero no debe ofrecerse.

---

## Botón de acción principal

| Pieza | Mecánica | Cuándo |
|---|---|---|
| ⬤ `descargas/voxybuns-lucky-fireant-71` | Dos capas: el borde queda abajo y la cara se levanta `-0.2em`; hover `-0.33em`; active `0`. | Neobrutalismo, o cualquier estética que quiera peso táctil. Es la más versátil. |
| `descargas/gharsh11032000-loud-chicken-53` | Píldora: un círculo crece hasta llenarla y dos flechas se cruzan de lado a lado. | Estética oscura con glow. Muy vistosa; usar una sola por pantalla. |
| `descargas/cssbuttons-io-brown-otter-21` | Rectángulo con "llaves" en las esquinas que se retraen y relleno que invade en hover. | Editorial, tipográfica, de evento. |
| `descargas/satyamchaudharydev-purple-rat-85` | 3D rojo con sombra dura que se hunde. | Alternativa más suave a voxybuns. |
| `galaxy/Buttons/adamgiebl_curly-wombat-58` ★ | Barra diagonal que rota y se expande hasta llenar el botón. | Cuando el hover tiene que sorprender sin mover el layout. |
| `descargas/supporthotline-odd-wasp-42` | Pulsación mecánica, dorado sobre negro. | Producto premium. |

## Botón secundario / terciario

- `descargas/felipesntr-yellow-robin-29` — contorno grueso, minimalista, negro.
- `descargas/voxybuns-lucky-fireant-71` con la cara hueca (así se hizo el
  `.btn3d-ghost` de frutillas: misma mecánica, otro relleno).
- `descargas/tisepse-ugly-badger-82` — material, bordeado, sobrio.
- `descargas/augustin-4687-dangerous-monkey-48` — píldora contorneada.

## Botón con ícono / acción puntual

- `descargas/marcelodolza-fat-zebra-11` — "enviar" con animación de despegue.
- `descargas/andrew-demchenk0-tasty-yak-79` — descarga, verde, mínima.
- `descargas/itskrish01-shaggy-eel-44` — círculo de ícono, para barras de acción.
- `descargas/greyd097-spicy-ape-9` — engranaje que rota (ajustes).
- `descargas/priyanshu02020-popular-puma-87` — corazón con contador.
- `descargas/elijahgummer-unlucky-rattlesnake-65` — estrella con contador estilo GitHub.
- `descargas/praashoo7-smooth-crab-52` — fila de botones sociales.

## Tarjeta de producto

| Pieza | Qué aporta | Cuándo |
|---|---|---|
| ⬤ `descargas/vinodjangid07-tender-fireant-6` | Precio, precio tachado, **etiqueta de descuento** pegada a la esquina, botón que sube en hover. | La referencia para e-commerce. De acá salió `.tag-hard`. |
| `descargas/muhammadhasann-calm-sloth-44` | Card negra con foto, chips de categoría y acción; cuadraditos que aparecen en las esquinas al hover. | Catálogo denso, estética dura. |
| `descargas/imtausef-hungry-rattlesnake-3` | Hover 3D, negro y verde, tipografía pesada. | Cuando la tarjeta tiene que sentirse física. |
| `descargas/janisar-hyder-dull-lionfish-98` | Vista previa de imagen con hover. | Cuando manda la foto. |
| `descargas/imtausef-ugly-wolverine-3` | Plantilla pensada para móvil. | Grillas de una columna. |

## Tarjeta de precio / plan

- ⬤ `descargas/alexruix-loud-baboon-79` — **neobrutalista**: borde `0.5vmin` y
  `box-shadow 0.4rem 0.4rem`. De acá salió el `.crate` de frutillas.
- `descargas/yaya12085-rotten-dolphin-86` — plan con lista de incluidos.
- `descargas/alexmaracinaru-tender-fly-40` — monocromática verde, muy limpia.
- `descargas/vaibhavchandranv-swift-ladybug-51` — neobrutalista con ventana retro.

## Estado, alerta y confirmación

- `descargas/cybercom682-empty-wolverine-58` — **cuatro tonos** (éxito, error,
  info, aviso) con el mismo esqueleto. Lo más práctico para cubrir todo de una.
- `descargas/akshat-patel28-quick-baboon-29` — sólo éxito, verde, redondeada.
- `descargas/0xnihilism-thin-crab-36` — notificación brutalista, negra, con ícono.
- `descargas/preet-7613-new-cougar-63` — 404 monocromática centrada.
- `descargas/ilkhoeri-thin-bobcat-83` — banner de cookies / aviso legal.

## Progreso y seguimiento

- ⬤ `descargas/ilkhoeri-red-sloth-16` ("Time lines") — viñeta por paso, línea
  que las une, paso activo pintado. **Ojo:** el marcado original viene compilado
  de Tailwind con selectores arbitrarios ilegibles; se copia la mecánica y se
  reescribe el HTML. Así se hizo el seguimiento del pedido en frutillas.
- `descargas/chase2k25-witty-squid-83` — barra de progreso en degradé.
- `descargas/turbo-8123-giant-goose-90` — estado tipo terminal, monoespaciada.
- `descargas/xbeat-5120-wise-snail-65` — briefing retro naranja, monoespaciada.

## Campos de formulario

- ⬤ `descargas/cohencoo-proud-husky-84` — input con borde marcado que se
  desplaza al enfocar. Base del `.field-hard` de frutillas.
- `descargas/bodyhc-itchy-dodo-49` — input redondeado con prefijo/enlace.
- `descargas/javierrocadev-quick-horse-31` — formulario de newsletter completo
  (input + botón), con degradé y blur.
- `descargas/0xnihilism-average-mole-62` — el mismo caso, pero brutalista.

## Selección: casilla, radio, interruptor

**Casillas** — `descargas/elijahgummer-friendly-wombat-2` (verde, animada) ·
`descargas/byllzz-grumpy-gecko-9` (naranja, trazo dibujado) ·
`descargas/sssynk-tall-octopus-55` (cuadrada, violeta) ·
`descargas/dexter-st-rotten-jellyfish-30` (pixelada, retro).

**Radios** ★ — `galaxy/Radio-buttons/3bdel3ziz-T_lucky-bullfrog-15` ·
`galaxy/Radio-buttons/Admin12121_cold-bobcat-20` ·
`galaxy/Radio-buttons/aguerquin_unlucky-yak-48` ·
`galaxy/Radio-buttons/andrew-demchenk0_clever-elephant-35` (estrellas de
puntuación).

**Interruptores** — hay 25 en `descargas/`. Los que valen la pena de entrada:
`chicogale-brown-panda-75` (negro, simple, el más neutro) ·
`nikk7007-smooth-fox-6` (verde, rectangular) ·
`voxybuns-horrible-shrimp-47` (negro minimalista) ·
`galahhad-heavy-dog-14` (claro/oscuro, material) ·
`xbeat-5120-popular-baboon-57` (bloque de encendido, naranja) ·
`zl306-shy-falcon-59` (Minecraft, cuadrado y duro — el que mejor pega con una
estética neobrutalista).

> Para **elegir entre dos opciones que cambian el precio** (retiro/envío,
> efectivo/tarjeta) no uses un interruptor: usá tarjetas seleccionables. En
> frutillas eso es `.choice-hard`, que invierte el gesto del botón —la elegida
> se **hunde** en vez de iluminarse— para que "elegido" no se confunda con
> "clickeable".

## Tooltips

`descargas/themrsami-cold-horse-3` (negro, minimalista) ·
`descargas/themrsami-quick-zebra-71` (amarillo, con ícono) ·
`descargas/tanimmahbub-white-fly-43` (con `data-attribute`, sin JS) ·
`descargas/vinodjangid07-gentle-penguin-44` (neumórfico, social).

## Cargando

`descargas/20essentials-modern-termite-44` (isométrico, colorido) ·
`descargas/dexter-st-bright-lizard-8` (esfera con glow, oscuro) ·
`descargas/kennyotsu-fresh-lizard-20` (texto que cambia, muy sobrio) ·
`descargas/gogo-3618-slimy-gecko-94` (neumórfico) ·
`descargas/novaxlo-rotten-lionfish-4` (planeta, conexión).

## Fondos y texturas

Todos son CSS puro con `background-image`: se recolorean cambiando dos o tres
variables y no pesan nada.

| Pieza | Textura |
|---|---|
| ⬤ `descargas/theleaderofenemy-plastic-octopus-67` | Mosaico de `radial-gradient` (ondas/puntos). Base del `.pat-dots` de frutillas. |
| ⬤ `descargas/csemszepp-old-hound-37` | `repeating-linear-gradient` a 45°. Base del `.pat-stripe`. |
| `descargas/artvelog-splendid-quail-83` | Papel con líneas horizontales, claro y sutil. |
| `descargas/denverdelamasa-good-pig-85` | Diamantes oscuros, geométrico. |
| `descargas/kandalgaonkarshubham-perfect-panther-30` | Panal de hexágonos, negro. |
| `descargas/mipiboy-old-badger-37` | Chevrons violetas, muy contrastado. |
| `descargas/selfmadesystem-tasty-seahorse-37` | Grilla azul estilizada. |
| `descargas/selfmadesystem-short-newt-53` | Lluvia animada con `backdrop-filter`. Costosa: sólo en una sección chica. |
| `descargas/chase2k25-cold-quail-77` · `giant-pug-85` · `bad-cheetah-56` | Degradés y texturas abstractas. |

**Regla de dosis:** una textura por banda de sección, nunca dos capas
superpuestas, y bajá el contraste hasta que se sienta pero no compita con la
foto o el texto. En frutillas quedó en 4% de opacidad sobre el fondo.

## Piezas de identidad (usar con cuidado)

Sirven cuando la marca lo pide, no como decoración:

- `descargas/dexter-st-slippery-bird-76` — ticket holográfico con QR.
- `descargas/zeeshan-2112-shy-rattlesnake-3` — ticket de evento con código de barras.
- `descargas/praashoo7-black-lizard-62` · `jkhuger-spotty-swan-68` ·
  `mihocsaszilard-rare-fox-73` — tarjetas de crédito/débito realistas.
- `descargas/pharmacist-sabot-plastic-fly-44` — bloque de código Windows 95.
- `descargas/barisdogansutcu-heavy-dragon-15` — botón Windows XP.
- `descargas/ksaplay-strong-donkey-70` — tarjeta de clima.

---

## Cómo mantener este catálogo

La biblioteca crece: `node importar.mjs --perfil=Pagina` baja los favoritos
nuevos de la cuenta y `npm run galaxy` actualiza el catálogo abierto. Después de
importar, para ver lo que entró:

```bash
cd ~/Desktop/uiverse/descargas
for d in */; do
  python -c "import json;m=json.load(open('$d/meta.json'));print('${d%/}','::',m['titulo'],'::',m['etiquetas'][:80])"
done
```

Si aparece una pieza que cubre una necesidad mejor que la que está acá,
reemplazala y dejá la vieja como alternativa.
