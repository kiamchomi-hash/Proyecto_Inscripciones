---
name: reels
description: Armar reels verticales para Instagram (1080x1920) de Teclab, Siglo 21, Identidad o el CAU con Remotion - gancho, bloques, lista de carreras, cierre con CTA - con la estética de la casa sacada de sus videos oficiales, personas recortadas, 3D y animación de calidad. Usar ante cualquier pedido de reel, video corto, historia en video, A/B de video para Instagram o «hacé un video de carreras». Va junto con la skill remotion (proceso de pasos y reglas técnicas) y con las de marca de cada casa.
---

# Reels

Esta skill junta lo que la skill `remotion` fija en general con lo que se aprendió
haciendo los reels de carreras de Teclab (24 y 25/11/2026). `remotion` manda en el
proceso y las reglas técnicas; acá está lo propio del reel vertical.

## La regla que manda sobre todas

**Siempre el mejor resultado posible.** Si una herramienta gratuita da un
resultado mejor, se instala y se usa: no se arma un sustituto casero «para no
sumar dependencias». Pasó con el 3D: la notebook en CSS 3D quedaba de cartón y en
Three.js tuvo luz, materiales y bordes reales. El usuario lo dijo con todas las
letras: «mientras sea gratis, siempre priorizá el mejor resultado posible».

- Instalar sin preguntar lo que es gratis y se instala en el usuario o en el
  proyecto de video (`npm`, `uv`, un modelo libre). Se dice qué se instaló, con
  versión, y se deja respaldo de `package.json` antes.
- Preguntar sólo lo que pide `sudo`, cuesta plata, toca el sitio publicado o
  cambia una regla de marca (por ejemplo, redibujar un logo).
- Herramientas que ya están y conviene usar (25/11/2026):

| Necesidad | Herramienta |
|---|---|
| 3D con luz y materiales | `@remotion/three` (misma versión que `remotion`), `three`, `@react-three/fiber` 8 y `@react-three/drei` 9 en `contenidos/teclab/remotion/teclab-carreras`. Render con `--gl=angle` |
| Íconos isométricos animados | skill `fun-isometric` (`~/.agents/skills`), con Bun. `fi export ... --brand '#a,#b'` da webm con alfa, que entra con `<OffthreadVideo transparent>` |
| Escenas 3D chicas | skills `diorama`, `diorama-worlds`, `diorama-pixel` |
| Recortar personas | rembg con `isnet-general-use` en `~/.local/share/recortes/.venv`; croma verde con llave de color y despill |
| Fotos libres | Openverse (`api.openverse.org`, filtro `license_type=commercial,modification`); StockSnap es CC0. Unsplash bloquea consultas automáticas |
| Analizar video | ffmpeg y ffprobe (ver «Mirar los oficiales») |

## Antes de diseñar: datos y referencias

- **La oferta sale de D1**, nunca de un video viejo ni del `data.js` del proyecto:
  `npm run db:d1 "select nivel, nombre, nombre_corto from carreras where activa=1 and nivel like 'Teclab%'"`.
- **Lo que destaca sale de datos**: las carreras más consultadas, de `npm run leads`.
- **El gancho sale de estudios, no del gusto**: el de reconocimiento («Terminaste
  el secundario») rinde más que el instructivo, y abrir con logo o saludo rinde
  menos (fuentes en `referencias/2026-11-24-ganchos-reels-instagram.md`).
- **La duración apunta a menos de 15 s.** Si el contenido pedido la estira, se
  avisa con el número y qué bloque se podría recortar; no se recorta solo.

## Mirar los oficiales cuadro por cuadro

La estética de una casa se copia de sus videos oficiales
(`contenidos/<casa>/oficial/`), y se **mide**: de memoria salieron colores de otra
pieza y circuitos que no se parecían.

```bash
# dónde corta
ffmpeg -i v.mp4 -vf "select='gt(scene,0.12)',showinfo" -f null - 2>&1 | rg -o "pts_time:[0-9.]+"
# una transición a 10 cuadros por segundo, en una hoja
ffmpeg -ss 16.8 -t 1.2 -i v.mp4 -vf "fps=10,scale=240:-1,tile=4x3" -frames:v 1 corte.png
# un detalle a tamaño real
ffmpeg -ss 2 -i v.mp4 -frames:v 1 -vf "crop=700:450:1220:80" detalle.png
```

- **Los colores se cuentan en píxeles** de un cuadro, no se eligen a ojo.
- **Para saber si algo se mueve, se compara el mismo recorte durante 3 s.** Un
  cuadro suelto engaña: los circuitos de Teclab parecían «dinámicos» y en realidad
  crecen al arrancar y quedan quietos. El vaivén que se inventó se leía «como algo
  musical».
- De cada referencia se toma el mecanismo (cómo entra, cómo corta, qué forma
  tiene la tarjeta), no el texto ni los tiempos.

Lo medido de Teclab (25/11/2026) está en el comentario de
`src/reels-carreras/estetica.jsx` y `escena.jsx` del proyecto: paleta `#3BFFDE`,
`#8513EB`, `#3BFF90`, `#031E26`; carpeta con pestaña; chip blanco que gira; dúo de
carpeta y tarjeta encimada; corte con salida desenfocada y fondo que cambia de golpe.

## Composición vertical

- **Zona segura**: 88 px a la izquierda, 130 a la derecha (íconos de Instagram),
  ~120 arriba y ~250 abajo. El contenido mide 862 px de ancho.
- **Cada bloque tiene su propio fondo**, no la misma receta con otro color: plano
  partido, trama, banda de luz, halo, carpetas fantasma.
- **Las capas que cruzan los cortes** (pistas de circuito, luces globales) van en
  una sola capa fuera de las `<Sequence>`. Si van adentro, se redibujan en cada
  corte y «van y vienen».
- **Nada pasa detrás del texto principal**: en el cierre se enmascara la franja del
  titular y el botón.
- **Texto en contorno no se lee**: sirve como textura. Lo que hay que leer va lleno.
- **Una lista larga** (27 carreras) va como fichero de carpetas por grupo, con
  numeración y letra grande; no como muro de contornos ni como copia del folleto.
- **Ritmo**: ~1,4 s por elemento que se quiere leer. Tres carreras en 2,8 s «pasan
  a la velocidad de la luz».

## Cierre

Lo que quedó aprobado para Teclab: fondo oscuro, logo oficial grande y centrado
arriba, titular, botón de WhatsApp suelto (control sólido, verde de plataforma,
nunca dentro de un marco) y los escudos del Ministerio centrados abajo. **Sin
sede en una campaña nacional.**

## Personas

- Primero las fotos propias de `contenidos/<casa>/imagenes_personas/`; después,
  bancos libres con su licencia anotada en `public/images/personas/FUENTES.txt`.
- **No usar las imágenes que el usuario marcó como generadas con ChatGPT** ni las
  de esa misma tanda.
- El criterio de casting lo define el usuario en cada pedido; se respeta tal cual.
- Recortar de nuevo en vez de usar un recorte viejo, y **revisarlo sobre los
  colores reales del video y con el pelo a tamaño real** antes de usarlo.

## 3D

- **Three.js** (`@remotion/three`) para objetos con volumen: `RoundedBox` y
  `ContactShadows` de drei, luz direccional, una luz de recorte en el turquesa de
  la casa y otra en el violeta. Todo función del frame (giro, apertura, lo que se
  escribe en la pantalla). Render y stills con `--gl=angle`.
- **Íconos animados** con `fun-isometric`: tienen borde negro de sticker, que no
  está en el material oficial; mostrarlos y preguntar antes de llenar el video.
- **Un logo en 3D es redibujar el logo**: pide permiso explícito.

## Errores técnicos que ya pasaron

- Dos `translate` anidados con signos opuestos se anulan: la transición no se ve.
- Un renglón que se desplaza con la caja del ancho de la pantalla pierde letras al
  renderizar: darle `width` explícito mayor que su texto.
- `duracionFrames` suma los `Math.round` de cada bloque, no redondea el total.
- Un componente con hooks no se declara adentro de un `.map()`.
- Texto inventado como decoración («CÓDIGO», «VENTAS») no va: se usa un dato real.

## Cómo se muestra

- Cada cambio se mira renderizado antes de contarlo: still, hoja de un cuadro por
  bloque y, si hay movimiento, la hoja del tramo a 2 o 3 cuadros por segundo.
- Ojeadas en `contenidos/<casa>/en-curso/AAAA-MM-DD-<pieza>/ojeada-A.mp4`; todo lo
  rechazado va al `HISTORIAL-DESCARTES.md` del proyecto con el motivo del usuario.
- Se muestran los dos videos de un A/B juntos, con su duración real (`ffprobe`).
