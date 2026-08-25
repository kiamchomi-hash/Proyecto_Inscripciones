# Renderizar, revisar y diagnosticar

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
| `--muted`, `--gl=angle`, `--log=verbose` | audio fuera, backend de GPU, diagnostico |

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

Ante un error que no se entiende, buscar el mensaje **tal cual, entre comillas**:
Remotion tiene paginas de troubleshooting por mensaje.

## Cerrar el trabajo

- **Dejar el archivo de fuentes**: `referencias/AAAA-MM-DD-<tema>.md` con los
  enlaces que se usaron. Ver [buscar.md](buscar.md#el-archivo-de-fuentes).
- Render de ojeada de la escena tocada, y mirarlo.
- Si se toco algo global (tipografia, paleta, tiempos), sacar un still de cada
  escena y comparar contra el antes.
- Si el proyecto **no esta bajo git** —muchos proyectos de video no lo estan— no
  hay como volver atras: copiar el archivo a un `respaldo/` antes de una
  reescritura grande.
