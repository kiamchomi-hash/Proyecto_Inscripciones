# Buscar primero, despues probar

Dos reglas que van juntas y ninguna sirve sola:

1. **No resolver de memoria.** Buscar antes de escribir el codigo, no despues de
   que no gusto.
2. **Lo que se busca es material, no una plantilla.** Copiar la referencia tal
   cual da el mismo resultado que no buscar: una pieza que se parece a todas.

De donde salen los elementos concretos —biblioteca local, paquetes de Remotion,
librerias de bloques— esta en [elementos.md](elementos.md).

## Como se usa una referencia

Mirar **tres o cuatro** y recien ahi decidir. Con una sola, lo que se hace es
copiarla.

De cada una se saca **el mecanismo, no la forma**: por que funciona. "El titulo
entra despues del fondo y por eso se lee", "la transicion cruza el corte y por
eso no se siente el corte", "el numero grande esta apoyado en una linea fina y
por eso no flota". El mecanismo se puede traer; la forma pertenece a la pieza de
la que salio, y ademas viene con la paleta, la tipografia y el ritmo de otro
proyecto.

Conviene contarle al usuario en dos lineas que se vio y que se toma de ahi. Si
la pieza tiene autor —una de UIverse, por ejemplo— el credito va en un
comentario del codigo.

## Experimentar

Encontrar algo en linea no cierra la puerta a probar otra cosa. Al reves: la
referencia es el piso, no el techo.

Como se prueba sin romper nada:

- **Un experimento por escena, no cinco a la vez.** Si algo mejora, tiene que
  quedar claro que fue.
- **Se mira en un still, no se argumenta.** Renderizar el cuadro, abrirlo y
  decidir mirando. Dos variantes del mismo cuadro se comparan en segundos.
- **Se prueba sobre una copia de la escena o en una composicion aparte**, sobre
  todo si el proyecto no esta bajo git.
- **Si no suma, se borra en el momento.** Lo que queda a medio camino se
  convierte en deuda.
- **La paleta, los cuerpos y los tiempos del proyecto no son el terreno del
  experimento**: eso ya esta medido. Lo experimental va en la forma, el
  movimiento y la composicion.

Vale proponerle al usuario una version rara al lado de la prolija: es mas barato
mostrarle dos cuadros que discutir un adjetivo.

## El archivo de fuentes

Todo trabajo terminado deja un archivo con **los enlaces que se usaron**, en
`referencias/AAAA-MM-DD-<tema>.md` dentro del proyecto de video. Existe para que
el usuario pueda abrir cada uno, ver si le gusta y **guardarse la pieza en su
UIverse local** — no para documentar lo que se hizo.

Por eso son links y una linea, no parrafos:

```markdown
# Referencias — 23/08/2026 — fichas de carrera

## Piezas y referencias visuales
- https://uiverse.io/Daniel1227k/moody-newt-4 — tarjeta con borde de gradiente.
  Se tomo el mecanismo: una copia desenfocada del mismo gradiente detras, que es
  lo que hace el halo. Va en `.oferta-cifra-marco`.
- https://tympanus.net/Development/... — el barrido de luz que cruza al entrar.
  Mirada, no copiada: quedo mas corta y sin el rebote.

## Documentacion
- https://www.remotion.dev/docs/sequence — props de `<Sequence>`, el frame que
  vuelve a cero adentro.
- https://www.remotion.dev/docs/flickering — por que no va `Math.random()`.

## Miradas y descartadas
- https://... — por que no: el movimiento se pierde a tres metros.
```

Tres reglas:

- **La pieza de UIverse va con su URL de uiverse.io**, no con la ruta del
  archivo local: esa es la que su galeria puede importar. Si salio de la
  biblioteca local, el link esta igual en el indice (campo `url` de cada pieza).
- **Lo mirado y descartado tambien va**, con el motivo en media linea. Es lo que
  evita volver a proponer lo mismo en la sesion siguiente.
- **Si no se consulto nada, el archivo lo dice.** Un trabajo resuelto entero de
  memoria es un dato, no un descuido que se tapa.

## Duda visual: con que palabras se busca

| Problema | Terminos que traen material util |
|---|---|
| escena vacia, margenes muertos | `broadcast graphics frame overlay`, `motion design safe area layout`, `sports broadcast full frame graphics` |
| pasar de una escena a otra | `optical transition motion design`, `light leak transition`, `whip pan transition` |
| una lista o una grilla que aburre | `editorial grid animation`, `kinetic typography list` |
| titulares | `poster typography hierarchy`, `swiss typographic poster` |
| datos en pantalla | `data callout motion graphics`, `infographic lower third` |
| numeros que cuentan, medidores | `number counter animation motion design` |
| ritmo general de la pieza | piezas reales del mismo rubro, que es contra lo que compite |

Fuentes que devuelven piezas y no palabreria: Behance, Dribbble en su seccion de
motion, Pinterest, y los staff picks de motion design de Vimeo.

Lo que **no** se copia de una referencia: los cuerpos tipograficos y los tiempos.
Dependen de donde se va a ver la pieza (ver [oficio.md](oficio.md#legibilidad)) y
casi todas las referencias estan hechas para mirarse de cerca.

## Duda tecnica

**Nunca escribir una API de Remotion de memoria**: cambia entre versiones.
Confirmar con `npm ls remotion` y WebFetch a la doc, que es corta y directa:

- `https://www.remotion.dev/docs/` el indice
- `https://www.remotion.dev/docs/<tema>`: `sequence`, `interpolate`,
  `use-current-frame`, `spring`, `still`, `absolute-fill`, `staticfile`,
  `offthreadvideo`, `audio`, `delay-render`, `flickering`, `cli/render`
- `https://www.remotion.dev/docs/api` la lista de paquetes oficiales
- `https://www.remotion.dev/docs/resources` plantillas, ejemplos y librerias

Si el render falla, buscar el mensaje de error **tal cual, entre comillas**:
Remotion tiene paginas de troubleshooting por mensaje.

Para animacion pura (easings, timing, curvas) tambien sirve buscar por fuera de
Remotion: son las mismas matematicas que en cualquier motor.

## Duda de contenido o de assets

- **Datos**: la fuente que los manda, no la memoria. Si despues de buscar sigue
  sin haber dato, preguntar.
- **Fotos**: bancos libres (Pexels, Unsplash). Guardar el id de origen en el
  nombre del archivo, para poder volver a la fuente. Buscar por el concepto, no
  por el nombre literal de la cosa, y descartar las que tengan al sujeto contra
  el borde superior si va a haber travelling.
- **Logos y marcas**: el oficial que ya exista en el proyecto. No redibujar uno
  ni aproximarlo.
- **Fuentes tipograficas**: `@remotion/google-fonts` resuelve las de Google sin
  agregar archivos. Para una de pago, verificar la licencia antes de sumarla.
