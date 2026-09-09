# Renderizar, revisar y diagnosticar

## Que hay para renderizar

```bash
npx remotion compositions <entrada>
```

Los ids registrados, que son los que acepta el CLI. Es el primer comando de una
sesion que arranca en frio: dice que escenas hay, cuales son variantes y con que
nombre se las llama.

## Ver un cuadro

```bash
npx remotion still <entrada> <ComposicionId> out/cuadro.png --frame=180 --scale=0.5 --log=error
```

- El frame es **relativo a la composicion que se pide**, no al video entero. A 30
  fps: segundo x 30.
- `--scale=0.5` alcanza para juzgar, y de paso es una prueba de legibilidad
  barata: lo que no se lee reducido no se lee de lejos.
- Despues **abrir el PNG con Read**. Renderizar y no mirarlo no sirve de nada.
- **La primera invocacion puede fallar** con `Timed out after 25000 ms while
  trying to connect to the browser`. Es el arranque en frio de Chrome: correr el
  mismo comando otra vez.

Para revisar varias escenas de una, conviene un script propio con
`@remotion/renderer`: `bundle()` una sola vez y despues `selectComposition()` +
`renderStill()` por escena. Empaquetar es lo que tarda; hacerlo una vez para diez
stills cambia el tiempo de minutos a segundos.

## Hoja de contactos: la unica forma de juzgar el movimiento

Un still no dice nada del ritmo, y **un mp4 no lo puedo mirar**: lo unico que se
lee con Read es una imagen. Un "render de ojeada para ver como quedo" que termina
en un mp4 es un paso ciego, y lo que sigue es una opinion escrita de memoria
sobre una animacion que nadie vio.

La salida es aplastar el tiempo en una sola imagen: doce cuadros repartidos en
toda la escena, en grilla.

```bash
# 1. la ojeada, que ademas sirve para mandarsela al usuario
npx remotion render <entrada> <Id> out/ojeada.mp4 --codec=h264 \
  --scale=0.5 --crf=30 --image-format=jpeg --jpeg-quality=72 --muted

# 2. la duracion real del clip
ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 out/ojeada.mp4

# 3. la hoja: 12 cuadros repartidos parejo (fps = tiles / duracion)
ffmpeg -y -v error -i out/ojeada.mp4 \
  -vf "fps=12/55.06,scale=420:-1,tile=4x3:margin=8:padding=6:color=0x101010" \
  -frames:v 1 out/hoja.png
```

Y despues **abrir `out/hoja.png` con Read**.

- `fps=<tiles>/<duracion>` es lo que reparte los cuadros en toda la escena. Con
  `fps=1` pelado se tilean los primeros doce segundos y el resto no se ve.
- `4x3` para una escena; `3x2` con tiles mas grandes si lo que se mira es un
  detalle. En vertical (1080x1920) va al reves: `6x2`.
- **El ffmpeg que trae Remotion no sirve para esto.** `npx remotion ffmpeg` esta
  compilado con `--disable-filters` y una lista blanca corta: no tiene `tile` ni
  `fps`. Va el ffmpeg del sistema.
- **Sin ffmpeg en la maquina**, la misma grilla se arma adentro de Remotion con
  `<Freeze frame={f}>`: una composicion de hoja de contactos que monta la escena
  doce veces, cada una congelada en su cuadro y escalada, y se saca con un solo
  `renderStill`. Sin dependencias y con los cuadros exactos que uno elija.

Lo que aparece ahi y en un still no: si el texto entra escalonado o todo junto,
si dos placas hermanas se mueven igual, si la transicion cruza el corte o queda
entre las dos escenas, y el cuadro apagado a mitad de camino que nadie busca
porque nadie sabe que esta.

**El mp4 se le manda al usuario con `SendUserFile`.** La hoja es para que yo
juzgue; la fluidez real, el audio y el ritmo contra el reloj los mira el.

## Renderizar

```bash
npx remotion render <entrada> <ComposicionId> out/video.mp4 --codec=h264 --concurrency=4
```

Flags que se usan de verdad:

| Flag | Para que |
|---|---|
| `--scale=0.5 --crf=30 --image-format=jpeg --jpeg-quality=72` | render de ojeada: ritmo y transiciones en segundos |
| `--frames=120-360` | solo el tramo que se esta ajustando. Tambien acepta `0,30,60` |
| `--concurrency=N` | cuadros en paralelo. Bajarlo si falta memoria; `1` para descartar parpadeo |
| `--crf` | calidad (mas bajo, mejor). Incompatible con `--video-bitrate` |
| `--props='{...}'` | pisar props sin tocar el codigo |
| `--muted` | sin audio. Va en toda ojeada que despues se convierte en hoja de contactos |
| `--gl=angle`, `--log=verbose` | backend de GPU, diagnostico |

Un render final largo va **en segundo plano** (`run_in_background`), no bloqueando
la sesion: mientras corre se puede seguir trabajando en otra escena.

Conviene envolver esto en scripts de npm: `preview`, `ojeada`, `render`, y uno
que reciba el numero o el nombre de la escena y arme el comando solo. Se escribe
una vez y despues nadie copia un id a mano.

## Diagnostico

| Sintoma | Causa tipica |
|---|---|
| Parpadeo, un cuadro distinto cada tanto | estado no determinista o asset a medio cargar. Ver `api.md` |
| Se reinicia la animacion en cada corte | `useCurrentFrame()` adentro de una `Sequence`; falta el segundo absoluto |
| Cuadro en blanco o a medias | asset sin `<Img>`/`<Video>`, o `background-image` |
| El render muere por timeout | un `delayRender()` sin su `continueRender()` |
| Chrome no arranca | arranque en frio: repetir el comando |
| Se queda sin memoria | bajar `--concurrency`, o `--image-format=jpeg` |
| Texto que se compone distinto en algunos cuadros | la fuente no estaba cargada al medir |
| El audio se corta antes del final | la composicion dura menos que el `<Audio>`; la duracion la manda el audio |

Ante un error que no se entiende, buscar el mensaje **tal cual, entre comillas**:
Remotion tiene paginas de troubleshooting por mensaje.

## Cerrar el trabajo

- Hoja de contactos de la escena tocada, y mirarla. El mp4 al usuario.
- **Dejar los enlaces que se usaron** en `referencias/AAAA-MM-DD-<tema>.md`. Ver
  [buscar.md](buscar.md#el-archivo-de-fuentes) — se agrega al del dia si ya
  existe, y un ajuste puntual sin consultas no crea archivo.
- Si se toco algo global (tipografia, paleta, tiempos), sacar un still de cada
  escena y comparar contra el antes.
- Si el proyecto **no esta bajo git** —muchos proyectos de video no lo estan— no
  hay como volver atras: copiar el archivo a un `respaldo/` antes de una
  reescritura grande.
