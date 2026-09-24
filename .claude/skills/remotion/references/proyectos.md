# Los proyectos de video que ya existen

Todos viven en `contenidos/<casa>/remotion/`, dentro de la carpeta del sitio
pero **fuera de git** (ignorada). Sin git no hay cómo volver atrás: antes de una
reescritura grande, copiar el archivo a `respaldo/`.

| Proyecto | Casa | Qué tiene |
|---|---|---|
| `cau/remotion/cau-villa-lugano/` | CAU | el institucional de las doce partes, y también piezas de Teclab que comparten su código |
| `teclab/remotion/teclab-carreras/` | Teclab | el video de carreras de la web (aprobado), su versión social, la lista de carreras y seis shorts por carrera |
| `identidad/remotion/` | Identidad | vacía: `remotion-diplomaturas` no está en esta máquina |

Antes de proponer nada en un proyecto, leer su `HISTORIAL-DESCARTES.md` si lo
tiene (ver [SKILL.md](../SKILL.md#lo-descartado-no-se-vuelve-a-proponer)).

## El institucional del CAU

| | |
|---|---|
| Entrada del CLI | `src/index.jsx` |
| El montaje | `src/guion.jsx`: la lista `bloques` (id, componente, duración, transición de salida) manda |
| El texto narrado | `guion-cau.txt`, que **no** tiene la numeración de los bloques |
| Qué escenas hay | `npm run partes`, o `npx remotion compositions src/index.jsx` |
| Studio | `npm run preview` |
| Una escena sola | `npm run ojeada:parte <n\|nombre>` / `npm run parte <n\|nombre>` |
| Las doce en miniatura | `npm run legibilidad` |
| Vertical para redes | composición `CauInstitucionalSocial`, 1080x1920 |
| Lo que ya se rechazó | `HISTORIAL-DESCARTES.md` |

Cada parte se monta con el mismo `inicio` que tiene dentro del montaje largo, así
que sale igual aislada que en el video. **No se agregan composiciones a mano en
`index.jsx`**: las que había tenían los segundos de arranque copiados y quedaban
viejas al primer reajuste del guion.

## Cómo se estructura un proyecto que crece

Sirve para cualquier video de más de dos escenas:

- **Un solo archivo de guion** con la lista de bloques (id, componente, duración,
  transición de salida). Los arranques se calculan a partir de esa lista, no se
  escriben. Mover una escena es cambiar su duración y nada más.
- **Una composición registrada por bloque**, generada de la misma lista y no
  escrita a mano, para poder renderizar y revisar una escena sola.
- **Una escena suelta arrastra 1 o 2 s de la siguiente**: sin esa cola la
  transición de salida queda a medio camino y no se puede juzgar.
- **Variantes** (la misma escena con otras props, la versión vertical) se
  registran aparte, no entran al montaje y no corren los tiempos de nadie.
- El contenido en un módulo de datos, separado de las escenas: cambiar un texto
  no tiene que ser tocar una animación.
- Cada bloque declara su **cuadro de póster**: el instante donde todo lo de la
  escena ya entró. Es el que se captura en los pasos quietos (1 a 4).
