---
name: remotion
description: Trabajar video programatico con Remotion (React que se renderiza a mp4) - armar o ajustar una composicion, animar una escena, resolver tiempos y transiciones, sacar stills para revisar un cuadro, renderizar, y diagnosticar parpadeos, cuadros en blanco o renders que fallan. Usar ante cualquier pedido que mencione Remotion, una composicion, una escena o "parte" de un video, un guion de video, un render, o cuando se pida ver como quedo una animacion. Incluye la regla de buscar la documentacion y referencias visuales reales en internet en vez de resolver de memoria.
---

# Remotion

Video como funcion del tiempo: cada cuadro es un render de React con
`useCurrentFrame()`. Todo lo que se anima es una interpolacion de ese numero.

## El bucle de trabajo

1. **Sacar un still y mirarlo.** Es mas rapido que un render y alcanza para
   juzgar composicion, encuadre y legibilidad:
   ```bash
   npx remotion still src/index.tsx <ComposicionId> out/cuadro.png --frame=180 --scale=0.5
   ```
   Despues **abrir el PNG con Read**. Un ajuste que no se vio renderizado no esta
   hecho: el navegador del Studio y el render no siempre coinciden.
2. **Render de ojeada** para juzgar ritmo y transiciones: media escala, JPEG,
   CRF alto. Segundos en vez de minutos.
3. **Render final** solo al cerrar.

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

La API completa, con lo que cambia entre versiones, en
[references/api.md](references/api.md).

## Como se estructura un proyecto que crece

Sirve para cualquier video de mas de dos escenas:

- **Un solo archivo de guion** con la lista de bloques (id, componente, duracion,
  transicion de salida). Los arranques se calculan a partir de esa lista, no se
  escriben. Mover una escena es cambiar su duracion y nada mas.
- **Una composicion registrada por bloque**, generada de la misma lista y no
  escrita a mano, para poder renderizar y revisar una escena sola.
- **Una escena suelta arrastra 1 o 2 s de la siguiente**: sin esa cola la
  transicion de salida queda a medio camino y no se puede juzgar.
- **Variantes** (la misma escena con otras props) se registran aparte, no entran
  al montaje y no corren los tiempos de nadie.
- El contenido en un modulo de datos, separado de las escenas: cambiar un texto
  no tiene que ser tocar una animacion.

## Cuando no se sabe que hacer: buscar, y despues probar

Dos reglas que van juntas.

**Buscar.** Nada se resuelve de memoria: una escena resuelta de memoria sale con
la solucion mas obvia posible, y una API escrita de memoria suele ser de otra
version.

| Duda | Donde |
|---|---|
| Que elemento, animacion o bloque uso | La biblioteca local primero, despues los paquetes de Remotion y las librerias de bloques: [references/elementos.md](references/elementos.md) |
| Como se resuelve visualmente esto | WebSearch de referencias reales, mirar 3 o 4 antes de decidir |
| Que API es, que props tiene | WebFetch a `remotion.dev/docs/...` |
| Por que falla el render | El mensaje de error tal cual, entre comillas |

**Y despues probar.** Lo que se busca es material, no una plantilla: de una
referencia se toma el mecanismo —por que funciona—, no la forma. Haber
encontrado algo hecho no cierra la puerta a probar otra cosa; al reves, la
referencia es el piso. Lo experimental se prueba en una escena, se mira en un
still y se borra en el momento si no suma.

Como se usa una referencia y como se experimenta sin romper nada:
[references/buscar.md](references/buscar.md).

## Cerrar el trabajo deja un archivo de fuentes

Cada trabajo terminado deja un `referencias/AAAA-MM-DD-<tema>.md` en el proyecto
con **los enlaces que se usaron**. No es un resumen de lo que se hizo: es la
lista de links, para que el usuario los abra, vea si le gusta alguno y se lo
guarde en su biblioteca. Es obligatorio, y si no se consulto nada el archivo lo
dice. Formato: [references/buscar.md](references/buscar.md#el-archivo-de-fuentes).

El resto del cierre —ojeada, still de control, respaldo si no hay git— esta en
[references/render.md](references/render.md#cerrar-el-trabajo).

## Oficio: lo que hace que se vea bien

Los criterios de composicion, tiempo minimo por escena, cuerpos legibles,
transiciones y **que hacer con una escena que "se siente vacia"** estan en
[references/oficio.md](references/oficio.md).

Si el video tiene texto que va a leer alguien mas, mandan las reglas de la pieza
(en pantalla solo lo que le sirve a quien mira; el pendiente y el criterio de
armado van en un comentario del codigo, nunca renderizados).
