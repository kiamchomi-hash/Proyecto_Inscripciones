---
name: remotion
description: Trabajar video programatico con Remotion (React que se renderiza a mp4) - armar o ajustar una composicion, animar una escena, resolver tiempos y transiciones, sacar stills para revisar un cuadro, montar musica o locucion, sacar la version vertical para redes, renderizar, y diagnosticar parpadeos, cuadros en blanco o renders que fallan. Usar ante cualquier pedido que mencione Remotion, una composicion, una escena o "parte" de un video, un guion de video, un render, o cuando se pida ver como quedo una animacion. Incluye la regla de buscar la documentacion y referencias visuales reales en internet en vez de resolver de memoria.
---

# Remotion

Video como funcion del tiempo: cada cuadro es un render de React con
`useCurrentFrame()`. Todo lo que se anima es una interpolacion de ese numero.

## Donde esta el video

El institucional del CAU vive **fuera de este repo y fuera de git**, en
`~/Desktop/remotion-cau-villa-lugano` (en Linux, `~/Escritorio/...`). Antes de
tocar nada:

| | |
|---|---|
| Entrada del CLI | `src/index.jsx` |
| El montaje | `src/guion.jsx` — la lista `bloques` (id, componente, duracion) manda |
| El texto narrado | `guion-cau.txt`, que **no** tiene la numeracion de los bloques |
| Que escenas hay | `npm run partes`, o `npx remotion compositions src/index.jsx` |
| Studio | `npm run preview` |
| Una escena sola | `npm run ojeada:parte <n\|nombre>` / `npm run parte <n\|nombre>` |
| Las doce en miniatura | `npm run legibilidad` |
| Vertical para redes | composicion `CauInstitucionalSocial`, 1080x1920 |

Sin git no hay como volver atras: antes de una reescritura grande, copiar el
archivo a `respaldo/`.

## El bucle de trabajo

1. **Sacar un still y mirarlo.** Es mas rapido que un render y alcanza para
   juzgar composicion, encuadre y legibilidad:
   ```bash
   npx remotion still <entrada> <ComposicionId> out/cuadro.png --frame=180 --scale=0.5
   ```
   Despues **abrir el PNG con Read**. Un ajuste que no se vio renderizado no esta
   hecho: el navegador del Studio y el render no siempre coinciden.
2. **Para el movimiento, hoja de contactos.** Un mp4 no lo puedo mirar: el ritmo,
   el escalonado de las entradas y la transicion se juzgan en una grilla de doce
   cuadros repartidos en toda la escena, que es una imagen y se lee con Read.
   El comando esta en
   [references/render.md](references/render.md#hoja-de-contactos-la-unica-forma-de-juzgar-el-movimiento).
   **El mp4 de ojeada va al usuario con `SendUserFile`**, que es quien puede ver
   la fluidez y escuchar el audio.
3. **Render final** solo al cerrar, y en segundo plano si es largo.

Comandos, flags y errores tipicos en
[references/render.md](references/render.md).

## Reglas que no se negocian

- **Todo cuadro es una funcion pura del frame.** Remotion renderiza cuadros en
  paralelo en pestanas que no comparten estado: `Math.random()`, `Date.now()` o
  cualquier estado que avance solo producen parpadeo. Para azar va `random(seed)`
  de Remotion, que es determinista.
- **Adentro de una `<Sequence>` el frame vuelve a cero.** Es lo que permite
  reusar una escena en cualquier momento del video, y tambien la causa numero uno
  de "la animacion se reinicia en cada corte". Cuando algo tiene que seguir el
  reloj del video entero, se le pasa el segundo absoluto por prop.
- **Los tiempos se escriben en segundos y se multiplican por `fps`**, nunca en
  frames a mano. Un numero de frame copiado queda viejo al primer reajuste.
- **Nada de assets que Remotion no sepa esperar**: van `<Img>`, `<Video>`,
  `<OffthreadVideo>`, `<Audio>` y `staticFile()`, no `<img>` pelado ni
  `background-image`. Datos o fuentes externas, con `delayRender()` /
  `continueRender()`.
- **Si hay locucion, la duracion la manda el audio.** Se mide el archivo antes de
  escribir los bloques; encajar la voz adentro de tiempos ya escritos es rehacer
  el montaje.

La API completa, con lo que cambia entre versiones, el audio y lo que se rompe
con cada cosa, en [references/api.md](references/api.md).

## Como se estructura un proyecto que crece

Sirve para cualquier video de mas de dos escenas:

- **Un solo archivo de guion** con la lista de bloques (id, componente, duracion,
  transicion de salida). Los arranques se calculan a partir de esa lista, no se
  escriben. Mover una escena es cambiar su duracion y nada mas.
- **Una composicion registrada por bloque**, generada de la misma lista y no
  escrita a mano, para poder renderizar y revisar una escena sola.
- **Una escena suelta arrastra 1 o 2 s de la siguiente**: sin esa cola la
  transicion de salida queda a medio camino y no se puede juzgar.
- **Variantes** (la misma escena con otras props, la version vertical) se
  registran aparte, no entran al montaje y no corren los tiempos de nadie.
- El contenido en un modulo de datos, separado de las escenas: cambiar un texto
  no tiene que ser tocar una animacion.

## Cuando no se sabe que hacer: buscar, y despues probar

**Nada se resuelve de memoria.** Una escena resuelta de memoria sale con la
solucion mas obvia posible, y una API escrita de memoria suele ser de otra
version.

| Duda | Donde |
|---|---|
| Que elemento, animacion o bloque uso | La biblioteca local primero, despues los paquetes de Remotion y las librerias de bloques: [references/elementos.md](references/elementos.md) |
| Como se resuelve visualmente esto | WebSearch de referencias reales, mirar 3 o 4 antes de decidir |
| Que API es, que props tiene | WebFetch a `remotion.dev/docs/...` |
| Por que falla el render | El mensaje de error tal cual, entre comillas |

Lo que se busca es **material, no una plantilla**: de una referencia se toma el
mecanismo —por que funciona—, no la forma. Y encontrar algo hecho no cierra la
puerta a probar otra cosa: la referencia es el piso. Lo experimental se prueba en
una escena, se mira en un still y se borra en el momento si no suma.

Como se usa una referencia y como se experimenta sin romper nada:
[references/buscar.md](references/buscar.md).

## Cerrar el trabajo deja los enlaces

Un trabajo que consulto algo deja `referencias/AAAA-MM-DD-<tema>.md` en el
proyecto con **los links que se usaron**, uno por linea. No es un resumen de lo
que se hizo: es para que el usuario los abra, vea si le gusta alguno y se lo
guarde en su biblioteca. Se le agrega al archivo del dia si ya existe, y un
ajuste puntual sin consultas no crea archivo. Formato:
[references/buscar.md](references/buscar.md#el-archivo-de-fuentes).

El resto del cierre —hoja de contactos, mp4 al usuario, still de control,
respaldo si no hay git— esta en
[references/render.md](references/render.md#cerrar-el-trabajo).

## Oficio: lo que hace que se vea bien

Los criterios de composicion, tiempo minimo por escena, cuerpos legibles,
transiciones, **el formato vertical para redes** y **que hacer con una escena que
"se siente vacia"** estan en [references/oficio.md](references/oficio.md).

Si el video tiene texto que va a leer alguien mas, mandan ademas las reglas de la
skill `piezas-para-el-publico`: en pantalla solo lo que le sirve a quien mira; el
pendiente y el criterio de armado van en un comentario del codigo, nunca
renderizados.
