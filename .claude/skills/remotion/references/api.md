# La API, y lo que se rompe con ella

Confirmar la version antes de escribir codigo: `npm ls remotion`. La API cambia
entre mayores y la doc de cada pagina es corta:
`https://www.remotion.dev/docs/<tema>`.

## Indice

- [El reloj](#el-reloj)
- [Sequence](#sequence)
- [Animar](#animar)
- [Composition y metadata](#composition-y-metadata)
- [Assets](#assets)
- [Determinismo: por que parpadea](#determinismo-por-que-parpadea)
- [Datos y fuentes externas](#datos-y-fuentes-externas)

## El reloj

```jsx
const frame = useCurrentFrame();                 // 0 .. durationInFrames - 1
const { fps, durationInFrames, width, height } = useVideoConfig();
const t = frame / fps;                            // segundos, que es como se piensa
```

El primer cuadro es `0` y el ultimo `durationInFrames - 1`.

**Escribir los tiempos en segundos y multiplicar por `fps`.** Un `[54, 96]` en
frames es ilegible y queda viejo cuando cambia el fps o la duracion.

## Sequence

`<Sequence>` es la unica forma de correr algo en el tiempo. Props:

| Prop | Default | Que hace |
|---|---|---|
| `from` | `0` | frame en que arranca. **Adentro, `useCurrentFrame()` devuelve `frame - from`** |
| `durationInFrames` | `Infinity` | cuando desmonta a los hijos |
| `layout` | `"absolute-fill"` | `"none"` para que no imponga posicionamiento |
| `name` | | etiqueta en la linea de tiempo del Studio |
| `premountFor` | `0` | premonta N frames antes de aparecer, para que el seek no trabe |

Las anidadas se acumulan: una `from={60}` dentro de una `from={30}` empieza en 90.

Las dos consecuencias que mas cuestan:

1. **La animacion se reinicia en cada corte.** Es el comportamiento correcto de
   `Sequence`, no un bug. Lo que tiene que seguir el reloj del video entero
   (fondos, ciclos largos, un sello que gira) recibe su segundo absoluto por prop
   y lo suma: `const t = frame / fps + desfase`.
2. **Una escena montada adentro de una `Sequence` se puede reusar tal cual** en
   otro momento del video, o sola en su propia composicion, sin tocarle nada.

## Animar

```jsx
interpolate(frame, [0, 30], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic)
});
```

Sin `clamp`, el valor sigue creciendo fuera del rango y las cosas se van de
pantalla o quedan en opacidad 3. Conviene un objeto `clamp` compartido en un
modulo de helpers en vez de repetir las dos lineas.

`spring({ frame, fps, config })` para lo que tiene que sentirse fisico. Su
duracion no es un rango: se mide con `measureSpring()` si hace falta encadenar.

Un patron que ahorra mucho: componentes chicos de entrada (`Sube`, `Linea`,
`RevelaLateral`) que reciben `demora` y `dur` en segundos y encapsulan la
interpolacion. Las escenas quedan declarativas y el lenguaje de movimiento es el
mismo en todo el video.

## Composition y metadata

```jsx
<Composition id="Escena" component={Escena} durationInFrames={900}
             fps={30} width={1920} height={1080} defaultProps={{ ... }} />
```

- El `id` es lo que se pasa al CLI para renderizar: es un nombre publico, no un
  detalle interno.
- **La duracion se calcula del guion**, nunca se escribe dos veces. Si la lista de
  bloques cambia, la composicion tiene que acompanar sola.
- Las composiciones se pueden generar con `.map()` sobre la lista de bloques.
- `calculateMetadata` resuelve duracion o tamano en funcion de las props (por
  ejemplo, la duracion real de un video que se incrusta).

## Assets

- `staticFile("images/foo.jpg")` para todo lo que este en `public/`.
- `<Img>`, `<Video>`, `<OffthreadVideo>`, `<Audio>`, `<Gif>`: **esperan a que el
  asset cargue** antes de dar el cuadro por bueno. `<img>` pelado no.
- `<OffthreadVideo>` es el que va para video incrustado en un render.
- **Evitar `background-image` y `mask-image` en CSS** para contenido: el render
  puede tomar el cuadro antes de que la imagen este. Como efecto sobre color
  plano (un degradado de mascara) es otra cosa y no trae ese riesgo.
- Fuentes: `@remotion/google-fonts` con su `loadFont()`, o `delayRender` hasta
  que la fuente este. Sin eso el navegador cae a una fallback y el texto se
  compone distinto en algunos cuadros.

## Determinismo: por que parpadea

Remotion renderiza cuadros **en paralelo, en pestanas que no comparten estado**.
De ahi salen casi todos los parpadeos:

- `Math.random()` y `Date.now()` dan otro valor en cada pestana. Va `random(seed)`
  de Remotion, determinista y con la misma firma.
- Nada de estado que avance solo (`useState` + `setInterval`, contadores que
  incrementan). Todo sale del frame.
- Nada de animaciones CSS ni transiciones: corren en tiempo de pared, no en
  tiempo de video.
- Assets a medio cargar. Ver arriba.

`--concurrency=1` hace desaparecer el sintoma pero no arregla la causa, y cuesta
tiempo de render. Sirve para confirmar el diagnostico, no como solucion.

## Datos y fuentes externas

```jsx
const [handle] = useState(() => delayRender("cargando datos"));
useEffect(() => { traer().then(() => continueRender(handle)); }, []);
```

Cada `delayRender()` bloquea el cuadro hasta su `continueRender()`. Si algo queda
sin cerrar, el render muere por timeout con el mensaje que se le paso como
etiqueta: **poner siempre una etiqueta descriptiva** o el diagnostico es a ciegas.

Cuando los datos se pueden bajar antes del render, mejor bajarlos a un JSON y
leerlos con `staticFile`: menos partes moviles y renders reproducibles.
