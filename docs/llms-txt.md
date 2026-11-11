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
| Páginas fijas | Una lista fija en el código, con las mismas descripciones que declara cada página |

Las 101 URLs de carrera que salen son **exactamente** las del `sitemap.xml`: el
slug se arma con `carreraToSlug`, la misma función que usa el sitemap y la
ficha.

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

Va en la cabecera de la respuesta, no en el HTML: la especificación lo permite
—la forma de cabecera «también funciona para recursos que no son HTML»— y no
obliga a tocar el marcado, que las referencias de paridad comparan byte a byte.
La pone `aplicarCabeceras` (`cloudflare/src/entrega/cabeceras.ts`), que ya
decide las cabeceras de cada ruta: sólo en las respuestas `200` de tipo
`text/html`. El propio `/llms.txt`, el sitemap, las APIs y los assets no la
llevan, porque no son páginas que describir.

La primera relación (`alternate`) queda para cuando haya versiones markdown de
cada página.

## Vigilancia

`/llms.txt` está en `RUTAS` de [`lib/vigilancia-esperado.ts`](../lib/vigilancia-esperado.ts),
así que los dos vigilantes (el cron del Worker y `herramientas/smoke.mjs`)
comprueban que devuelva 200. `herramientas/calidad-web.mjs` lo deja afuera: no
es una página de navegador.

La cabecera `Link` también se vigila: está en `CABECERAS_ESPERADAS`, que los
dos vigilantes miden sobre la home.

## Qué falta

- Una versión markdown de cada página (`/carreras/<slug>.md` y compañía), que
  es la otra mitad de la convención. Con eso se agregaría la relación
  `alternate` a la cabecera `Link`.
