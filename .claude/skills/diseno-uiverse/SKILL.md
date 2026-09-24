---
name: diseno-uiverse
description: Diseñar o rediseñar interfaces web usando componentes ya probados en vez de inventarlos. Parte siempre de la biblioteca local de UIverse del usuario (~/Desktop/uiverse) — sus piezas propias, sus favoritas y el catálogo abierto— y recién si ahí no hay nada busca en fuentes públicas equivalentes. Usar cuando se pida mejorar el diseño, el frontend, el CSS, la UI o el "look" de una página; armar botones, tarjetas, formularios, loaders, toggles, tooltips o fondos; elegir una dirección estética; o cuando el pedido sea "está feo", "mejorá el diseño", "hacelo más lindo", "rediseñá esto". También para revisar una UI contra los referentes reales del rubro antes de darla por terminada.
---

# Diseño con piezas probadas

Regla única de la que salen todas las demás: **no inventes componentes**. Un
botón, una tarjeta o un toggle que sale de la nada arrastra bugs de foco, de
hover, de teclado y de contraste que otra gente ya resolvió. Partí de una pieza
que ya funciona, entendé su mecánica, y cambiale lo que haga falta.

Inventar sí está permitido —y es necesario— en la **composición**: qué secciones
tiene la página, en qué orden, qué se dice en cada una. Eso no se copia de
ningún lado; se decide con el usuario y contra los referentes del rubro.

## Dónde está la biblioteca

En la máquina del usuario vive en `~/Desktop/uiverse`. En una sesión en la nube
esa ruta no existe: clonar el repo privado `kiamchomi-hash/uiverse-local` y
bajar el catálogo abierto, que es un submódulo:

```bash
git clone https://github.com/kiamchomi-hash/uiverse-local.git ~/Desktop/uiverse
git -C ~/Desktop/uiverse submodule update --init --depth 1
```

Todas las rutas de abajo se leen igual después del clon.

## Orden de búsqueda

Siempre en este orden. No saltes al siguiente escalón sin haber mirado el
anterior.

1. **`~/Desktop/uiverse/biblioteca/mias/`** — piezas propias del usuario. Si hay
   algo acá que sirva, gana sobre todo lo demás: ya está adaptado a su gusto.
2. **`~/Desktop/uiverse/descargas/`** — favoritos importados de su cuenta de
   uiverse.io. Cada carpeta trae `meta.json` (título, autor, etiquetas, URL),
   `pieza.html` y `pieza.css`. Son ~150 piezas que el usuario eligió a mano:
   son la mejor señal de su gusto disponible.
3. **`~/Desktop/uiverse/biblioteca/estado.json`** — clave `favoritas`: rutas
   dentro de `galaxy/` que marcó como favoritas. La clave `ocultas` son las que
   **eliminó**: nunca las propongas.
4. **`~/Desktop/uiverse/biblioteca/galaxy/`** — el catálogo abierto completo
   (~3.800 piezas, MIT), ordenado en `Buttons/`, `Cards/`, `Checkboxes/`,
   `Forms/`, `Inputs/`, `loaders/`, `Notifications/`, `Patterns/`,
   `Radio-buttons/`, `Toggle-switches/`, `Tooltips/`. Cada pieza es un `.html`
   con su `<style>` adentro. `biblioteca/indice-galaxy.json` tiene el índice
   con etiquetas, si hace falta buscar por texto.
5. **Fuentes públicas** — sólo si nada de lo anterior sirve. Lista abajo.

### Si la pieza es de Siglo 21 o de Teclab: sólo lo marcado

El usuario separó ★ Mías por casa con los botones **S21 · Teclab · Ninguna** de
la galería. La marca vive en `biblioteca/estado.json`, clave `usos`
(`{ "mias/x": ["siglo21", "teclab"] }`). Al 10/09/2026, de 453 piezas en Mías
hay 120 marcadas: 99 para Siglo 21, 98 para Teclab —casi las mismas: todas las
de Teclab sirven también para Siglo 21— y 21 «Ninguna».

Para una pieza de cualquiera de las dos casas —folleto, afiche, video, sección
del sitio— **se recorren sólo las marcadas con esa casa**, en vez de los cinco
escalones de arriba:

- **«Ninguna» no se propone nunca**, igual que `ocultas`: el usuario ya dijo que
  no la usaría.
- **Las sin decidir no se recorren.** Si entre las marcadas no está lo que la
  pieza necesita, se dice («entre las 99 de Siglo 21 no hay ningún contador») y
  recién ahí se baja al orden de arriba, nombrando de dónde salió lo que se usó.
- **Identidad Argentina no tiene marca**: para sus piezas y para todo lo que no
  sea del CAU vale el orden de arriba entero.

La lista sale así, una línea por pieza con ruta, título y etiquetas (cambiar
`siglo21` por `teclab`). Ya traduce los ids: `favoritos/x` es `descargas/x`, y
`galaxy/...` es un `.html` suelto cuyas etiquetas están en `indice-galaxy.json`.

```bash
cd ~/Desktop/uiverse && node -e "
const casa=process.argv[1],e=require('./biblioteca/estado.json'),fs=require('fs'),oc=new Set(e.ocultas);
const gx=new Map(require('./biblioteca/indice-galaxy.json').piezas.map(p=>[p.id,p]));
for(const [id,u] of Object.entries(e.usos)){if(!u.includes(casa)||oc.has(id))continue;
 let r,m;if(id.startsWith('galaxy/')){r='biblioteca/'+id+'.html';m=gx.get(id)||{}}
 else{r=id.startsWith('mias/')?'biblioteca/'+id:'descargas/'+id.slice(10);try{m=JSON.parse(fs.readFileSync(r+'/meta.json','utf8'))}catch{m={}}}
 console.log(r+'\t'+(m.titulo||'')+' | '+[m.etiquetas].flat().join(', '))}
" siglo21 | grep -i "editorial\|papel\|tracking"
```

Sin el `grep` final devuelve la lista entera. Se filtra **por etiquetas, no por
el nombre de la carpeta**, que no dice casi nada.

Para buscar rápido por tema en los favoritos:

```bash
cd ~/Desktop/uiverse/descargas
grep -il "checkout\|price\|cart" */meta.json     # por etiqueta o título
```

`references/catalogo.md` de esta skill tiene las piezas ya mapeadas a
necesidades concretas de UI, con alternativas. Empezá por ahí antes de grepear.

## Cómo adaptar una pieza

Una pieza de UIverse no se pega tal cual. Lo que se conserva es la **mecánica**;
lo que se cambia son los colores, los nombres y las medidas.

1. **Conservá la mecánica exacta.** Si el botón original sube `-0.2em` en
   reposo, `-0.33em` en hover y `0` al presionar, respetá esos tres valores.
   Están calibrados; redondearlos a "algo parecido" es lo que hace que la copia
   se sienta peor que el original.
2. **Renombrá las clases genéricas.** `.button`, `.card`, `.container` chocan
   con todo. Usá un prefijo del proyecto (`.crate`, `.btn3d`, `.field-hard`).
3. **Cambiá los colores por los del proyecto.** Nunca metas un color nuevo
   porque venía en la pieza. Si la pieza usa `greenyellow` para "ahorro" y el
   proyecto ya tiene un verde, usá el del proyecto.
4. **Sobre fondo oscuro, revisá las sombras.** Una sombra negra sobre un fondo
   oscuro no existe. En neobrutalismo oscuro la sombra tiene que ser un **bloque
   de color** (el acento, o un tono más claro que el fondo), no una sombra.
5. **Dejá la atribución.** Las piezas son MIT y la autoría viaja en el CSS. Un
   comentario arriba de la primitiva con el autor y la URL alcanza, y de paso
   deja rastro de dónde salió la mecánica.
6. **Revisá lo que la pieza no trae.** Casi ninguna trae estado deshabilitado,
   `:focus-visible`, ni `prefers-reduced-motion`. Agregalos vos.

## Antes de empezar: acordá la dirección

No elijas la estética por tu cuenta. Preguntá, o mostrá 2-4 direcciones
realmente distintas y que el usuario elija una que pueda ver. Los favoritos del
usuario suelen agruparse en dos o tres polos: nombralos y usalos como opciones
(por ejemplo "neobrutalista" contra "oscuro con glow"), citando las piezas
concretas de las que sale cada uno.

Una vez elegida, no se vuelve a preguntar. Y **no conviertas todo el sitio a un
solo vocabulario si los contextos son distintos**: la home vende y aguanta ser
ruidosa; el checkout y el estado del pedido son donde la gente pone plata y
datos, y ahí conviene bajar el volumen sin cambiar de idioma.

## Sistema mínimo antes de escribir componentes

Definí esto primero, en un solo lugar (`globals.css`, `theme.css`, lo que use
el proyecto), y que todo lo demás lo consuma:

- **Paleta**: fondo, texto, 1-2 acentos, un color de línea. Si el proyecto ya
  tiene paleta, se usa esa; no se inventan colores nuevos.
- **Radio**: uno solo, y coherente con la estética. Neobrutalismo: 0-4px. No
  mezcles `rounded-full` con esquinas duras en la misma pantalla.
- **Grosor de borde**: dos valores como mucho (por ejemplo 3px para bloques,
  2px para controles).
- **Desplazamiento de sombra**: un valor base y su versión de hover, que crezca
  exactamente lo que el bloque se movió, para que no se deforme.
- **Tipografía**: 1-2 familias, elegidas **con evidencia y no de memoria**. De
  memoria siempre salen Inter, Roboto, Poppins y Space Grotesk, que están en
  todas partes y aplanan cualquier dirección. Se busca un sitio real con el tono
  que querés y se toman las familias que usa: dónde mirar está en
  `~/Desktop/uiverse/FUENTES.md`. Decí de dónde salió la elección.

## Reglas que no se negocian

- **Nada de emojis como íconos.** Cada sistema operativo dibuja los suyos
  distinto. SVG inline, trazo consistente, grilla de 16/20/24, heredando
  `currentColor`.
- **Blancos de verdad no**: sobre fondo oscuro usá cremas y negros levemente
  teñidos hacia la paleta, nunca `#fff` / `#000` puros.
- **Área táctil mínima 44px** en cualquier control que se toque con el dedo.
- **`:focus-visible` explícito**, en el mismo idioma visual que el resto. Si el
  sistema es duro, el foco es un bloque, no un halo difuso.
- **`prefers-reduced-motion`**: apagá transiciones y `scroll-behavior`.
- **Números que se comparan en columna** van con `font-variant-numeric:
  tabular-nums`, si no bailan.
- **Espaciado entre hermanos con `gap`**, no con márgenes por elemento ni con
  espacios en blanco del HTML.
- **Sin contenido de relleno.** Si una sección se ve vacía, es un problema de
  composición, no una excusa para inventar texto o estadísticas.

## Verificá contra el rubro, no contra tu gusto

Antes de dar una UI por terminada, mirá cómo lo resuelven los referentes reales
del rubro: dos o tres locales y dos o tres internacionales. No para copiar el
diseño, sino para chequear que no falte nada que el comprador espera encontrar.

Cuando el rubro es **venta de fruta o comida fresca**, la investigación ya está
hecha en `references/tiendas-de-fruta.md`.

Para otros rubros: buscá los sitios reales, entrá con WebFetch y anotá el orden
de las secciones, qué señales de confianza muestran y dónde ponen el precio.
Después contrastá con lo que armaste y decí explícitamente qué te falta.

## Si la biblioteca local no alcanza

Fuentes públicas equivalentes, en orden de utilidad para copiar mecánicas:

| Fuente | Para qué sirve |
|---|---|
| [uiverse.io](https://uiverse.io) | El original. HTML+CSS puro, MIT. |
| [hyperui.dev](https://hyperui.dev) | Componentes Tailwind sueltos, sin dependencias. |
| [originui.com](https://originui.com) | Inputs, selects y formularios muy completos. |
| [neobrutalism.dev](https://neobrutalism.dev) | Sistema neobrutalista entero sobre shadcn/ui. |
| [ui.shadcn.com](https://ui.shadcn.com) | Base accesible cuando hace falta comportamiento, no estilo. |
| [magicui.design](https://magicui.design) · [ui.aceternity.com](https://ui.aceternity.com) | Animaciones y efectos ya resueltos. |
| [flowbite.com](https://flowbite.com) · [daisyui.com](https://daisyui.com) | Catálogos amplios para piezas comunes. |
| [css-pattern.com](https://css-pattern.com) · [heropatterns.com](https://heropatterns.com) | Fondos de patrón en CSS puro, sin imagen. |
| [lucide.dev](https://lucide.dev) · [tabler.io/icons](https://tabler.io/icons) | Íconos SVG de trazo consistente. |
| [codepen.io](https://codepen.io) | Cuando la mecánica es rara y hay que ver cómo la hizo alguien. |

## Cuando el problema no es la pieza sino la página

UIverse tiene el botón; no tiene el orden de las secciones, la mezcla
tipográfica ni el tono. Para eso hay una segunda biblioteca:
**`~/Desktop/uiverse/FUENTES.md`** — qué da cada fuente, cuál anota la
tipografía que cada sitio usa de verdad, cuáles publican `DESIGN.md` y cuáles
tienen servidor MCP (y cuál no hay que instalar). Se lee antes de decidir cómo
se ve la página.

Es el único lugar donde vive esa lista: se genera desde `fuentes.json` con
`npm run fuentes`, y se ve en la pestaña **Fuentes** de la galería local. No
copiarla a ninguna skill; las demás apuntan acá.

### Medir un sitio concreto

Si la referencia es **un sitio puntual** y hacen falta sus valores exactos, no se
estiman mirando una captura: se miden.

```bash
cd ~/Desktop/uiverse && npm run generar-sistema -- https://el-sitio.com
```

Abre el sitio a 1440x900 con el navegador que ya está instalado y escribe
`biblioteca/sistemas/propios/design-md/<dominio>/DESIGN.md` con lo que el
navegador **realmente aplicó**: colores ordenados por frecuencia de uso,
familias y cuerpos reales, radios y sombras. Tarda segundos y no instala nada.

Dos límites que importan al leerlo:

- **Mide, no interpreta.** Lo que sale son valores, no una lectura del sitio.
  Convertir eso en una dirección es trabajo de quien lo usa.
- **Sólo la primera pantalla.** Lo que está más abajo en el scroll no entra.

Para que aparezca en la pestaña **Sistemas** de la galería:
`npm run sistemas -- --solo-indice`, y `npm run capturas` para su foto. En esa
pestaña ya están bajadas las colecciones de terceros (`bites`, `marcas`,
`volt`), que son `DESIGN.md` de sitios conocidos hechos por otros.

## Buscar referencias: cómo se usa una

Vale para elegir tipografía, paleta, composición o el efecto que falta. Son tres
reglas y ninguna sirve sola:

1. **No de memoria.** Se busca antes de escribir el código, no después de que no
   gustó. De memoria salen Inter, Poppins y un degradado violeta: el promedio de
   todo, que es exactamente lo que no queremos.
2. **Mirar tres o cuatro, y recién ahí decidir.** Con una sola, lo que se hace
   es copiarla.
3. **De cada una se saca el mecanismo, no la forma.** «El título entra después
   del fondo y por eso se lee», «el número grande está apoyado en una línea fina
   y por eso no flota». El mecanismo se puede traer; la forma pertenece a la
   pieza de la que salió, y viene con la paleta y el ritmo de otro proyecto.

Encontrar algo hecho no cierra la puerta a probar otra cosa: la referencia es el
piso, no el techo.

Y al entregar, **decí de dónde salió cada decisión**. «Archivo + Söhne, sacado
de <sitio>» es una elección; «una grotesca con carácter» es una corazonada. Si
la pieza tiene autor, el crédito va en un comentario del código.

## Cerrar bien

- Corré `typecheck`, `lint` y `build` del proyecto.
- Mirá la página de verdad: levantá el server y sacá capturas a 1440 y a 390 de
  ancho. Los problemas que importan —títulos que cortan mal, grillas
  apretadas, texto ilegible, contraste que no da— sólo se ven mirando.
- Contá en una línea de dónde salió cada mecánica que usaste. Es lo que hace
  que la próxima persona no la reinvente.
