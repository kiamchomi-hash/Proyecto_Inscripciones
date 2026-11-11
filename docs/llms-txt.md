# `/llms.txt`

**Estado: vivo desde el 10/11/2026.** `https://www.siglo21sur.com/llms.txt`.

Es el mapa del sitio para los agentes de IA, con la convención de
[llmstxt.org](https://llmstxt.org/): un H1 con el nombre del sitio, un bloque
`>` con el resumen y secciones `##` que contienen listas de enlaces markdown.
Un agente que llega al sitio recibe acá qué hay y dónde, sin tener que
rastrearlo página por página.

Chrome lo audita desde Lighthouse (apartado *agentic browsing*): si el archivo
no existe, la auditoría queda en «No aplica»; si existe, tiene que cumplir la
especificación.

## De dónde salen los datos

| Qué | De dónde |
|---|---|
| Carreras | `carreras` de D1, con `activa = 1`, filtradas por `esCarreraVisible` (la taxonomía compartida) |
| Clases de apoyo | `materias` de D1, con `activa = 1` y `en_construccion = 0` |
| Artículos | `novedades` de D1, con `publicada = 1` y slug: título, extracto y fecha |
| Páginas fijas | Una lista fija en el código, con las mismas descripciones que declara cada página |

Las 101 URLs de carrera que salen son **exactamente** las del `sitemap.xml`: el
slug se arma con `carreraToSlug`, la misma función que usa el sitemap y la
ficha. Las de los artículos son las mismas URLs, con el mismo filtro de
publicación.

## Dónde vive el código

- `cloudflare/src/datos/llms-txt.ts` — lee D1.
- `cloudflare/src/entrega/llms-txt.ts` — arma el markdown. Es puro: recibe los
  datos y devuelve el texto, sin base ni red, para que las pruebas lo abran con
  Node pelado.
- `cloudflare/src/pages/llms.txt.ts` — la ruta. Se genera en cada pedido, como
  `sitemap.xml`, con `Cache-Control: no-store`.

El reintento de las lecturas de D1 vive en `cloudflare/src/datos/reintento.ts`,
compartido con el sitemap.

## Qué no se publica

- **Precios.** Los aranceles están en la tabla privada `precios_privados` y
  sólo se ven con «Ver precio» o por WhatsApp. El archivo dice cómo
  consultarlos, no cuánto salen.
- **Niveles fuera de la oferta.** Posgrados, APLV, los cursos históricos de
  Siglo 21 y las carreras con `activa = 0` no salen, por el mismo filtro que
  usa el sitemap.
- **La cola de la ficha de Identidad Argentina.** La descripción de las
  diplomaturas termina con «Docente: … Escuela … Convenio Academia …»: eso se
  corta antes de la nota.
- **Los borradores.** Un artículo con `publicada = 0` no sale, y al que le
  falta el extracto se lo publica con la fecha sola.

## Cómo se prueba

```bash
node --test cloudflare/tests/llms-txt.test.mjs   # el módulo puro
npm --prefix cloudflare run test:entrega          # el archivo real, con el build
```

La prueba de integración (en `cloudflare/tests/entrega.test.mjs`) levanta el
build compilado con D1 efímero y sembrado y pide `/llms.txt`: comprueba el
estado, el `Content-Type`, las secciones, que estén las carreras de la oferta
y que no estén las apagadas.

## La cabecera `Link`

La convención llmstxt.org recomienda dos relaciones: `rel="alternate" type="text/markdown"`
apunta a la versión markdown de la página y `rel="describedby"` al archivo
`llms.txt` que la cubre. Como el archivo está en la raíz, cubre todo el sitio.

Las páginas HTML del sitio mandan la segunda:

```
Link: </llms.txt>; rel="describedby"
```

Y las que tienen versión markdown, las dos:

```
Link: </carreras/abc.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"
```

Va en la cabecera de la respuesta, no en el HTML: la especificación lo permite
—la forma de cabecera «también funciona para recursos que no son HTML»— y no
obliga a tocar el marcado, que las referencias de paridad comparan byte a byte.
La pone `aplicarCabeceras` (`cloudflare/src/entrega/cabeceras.ts`), que ya
decide las cabeceras de cada ruta: sólo en las respuestas `200` de tipo
`text/html`, y también en los archivos markdown, que se describen a sí mismos.

## Las versiones markdown de las páginas

La otra mitad de la convención: la versión limpia de cada página, en la misma
URL con `.md` al final.

| Ruta | Qué es |
|---|---|
| `/carreras/<slug>.md` | La ficha: datos, plan de estudios, preguntas frecuentes y cómo inscribirse |
| `/clases-apoyo/<slug>.md` | La clase de apoyo: descripción, texto largo y cómo reservar turno |
| `/novedades/articulo/<slug>.md` | El artículo: extracto, fecha y el cuerpo convertido a markdown |
| `/faq.md` | Las preguntas del acordeón con sus respuestas y las que mandan los que escriben |
| `/contacto.md` | Los datos de la sede: WhatsApp, teléfono, correo, horario, dirección y mapa |
| `/calendario-academico.md` | La estructura del ciclo: aperturas, semanas, parciales, entregas y preguntas |
| `/sobre-nosotros.md` | Qué es el centro, la sede en números, qué se puede hacer ahí y las preguntas |
| `/teclab.md`, `/clases-apoyo.md`, `/test-vocacional.md` | Las páginas que son un catálogo: su resumen y la misma oferta que muestran |
| `/index.md` | La home: la oferta agrupada por área, cómo inscribirse y los datos de la sede |
| `/novedades/<n>.md` | El listado: la destacada, los artículos de la página y la paginación |

Las arman `cloudflare/src/entrega/markdown-*.ts` y las rutas son
`cloudflare/src/pages/**/*.md.ts` (la home es `index.md.ts`, que Astro sirve
como `/index.md` sin pisar `index.astro`). Todo el texto sale de la base, de los
módulos de datos de cada página o del mismo JSX que la página pinta: no se
escribe una línea que no esté en el sitio, y ningún precio se publica.

- Las respuestas del FAQ son JSX: se renderizan y se pasan por el conversor, en
  vez de copiarlas a un archivo de texto que se desincronizaría.
- El contenido de los artículos es HTML: `lib/html-markdown.ts` lo traduce a
  markdown (encabezados, listas, enlaces, negritas, tablas e imágenes).
- Los datos de la sede (teléfono, correo, horario, dirección) viven en
  `lib/sede.ts` y los usan el JSON-LD, la página de contacto y su versión
  markdown.
- El título y la descripción de las páginas fijas viven en `lib/paginas.ts`, y
  los de las páginas con módulo de datos propio, en ese módulo.

## Vigilancia

`/llms.txt` está en `RUTAS` de [`lib/vigilancia-esperado.ts`](../lib/vigilancia-esperado.ts),
así que los dos vigilantes (el cron del Worker y `herramientas/smoke.mjs`)
comprueban que devuelva 200. `herramientas/calidad-web.mjs` lo deja afuera: no
es una página de navegador.

La cabecera `Link` también se vigila: está en `CABECERAS_ESPERADAS`, que los
dos vigilantes miden sobre la home.

Las rutas `.md` no están en `RUTAS`: dependen de la entidad que piden y
devolverían 404 en cuanto esa entidad cambia de nombre. Lo que las cubre es la
página de la que salen.

## Qué falta

Nada: todas las páginas del sitio que se pueden escribir en texto tienen su
versión markdown. La home la tiene recortada a la estructura —título, oferta
por área, inscripción y sede—, porque su carrusel de avisos no tiene versión en
texto y el mapa completo sigue siendo el `/llms.txt`.
