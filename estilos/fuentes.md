# Fuentes autoalojadas

`fuentes.css` sirve Inter y Unbounded desde `public/fuentes/` de la raíz, con los
mismos archivos que descarga `next/font/google` en el sitio vigente. No hay
pedidos a Google: el build y el runtime funcionan sin red.

`poppins.css` hace lo mismo con la tercera familia del sitio, Poppins, pero se
importa **sólo** desde `/teclab` y `/teclab/inscripcion`: en Next la cargan esas
dos páginas y no el layout.

## De dónde salen

| Archivo | Familia | Pesos | Subconjunto | sha256 |
|---|---|---|---|---|
| `public/fuentes/inter-latin.woff2` | Inter (variable) | 100–900 | `latin` | `c940764593d0fe5d596be327ca7558855e018039fb78509aa21921fd3644c3e4` |
| `public/fuentes/unbounded-latin.woff2` | Unbounded (variable) | 400–900 | `latin` | `d7f07f8a308ce0a7287d79a65a85cfbc0f4741ef426bf1a3902d24392cc71723` |
| `public/fuentes/poppins-latin-400.woff2` | Poppins | 400 | `latin` | `3dc5d0c52428fe1696264907a1054ebbaac07f8cbe45832c105f819c2ae397c0` |
| `public/fuentes/poppins-latin-600.woff2` | Poppins | 600 | `latin` | `872e862918591a9e824dc03ed92f05729435ffbb8ebbb10eff7eda26592b1798` |
| `public/fuentes/poppins-latin-700.woff2` | Poppins | 700 | `latin` | `197a3cbd7290c242c5c765268cdd69a9a39867fdc80cd13071f243a81c56fb76` |

Son los `.woff2` que `next/font` deja en `.next/static/media/` al compilar el
sitio (`app/layout.tsx`: `Inter({ subsets: ['latin'] })` y
`Unbounded({ subsets: ['latin'], weight: ['400','600','700','800','900'] })`;
`app/teclab/page.tsx` y `app/teclab/inscripcion/page.tsx`:
`Poppins({ subsets: ['latin'], weight: ['400','600','700'] })`). Se copiaron
byte a byte. Inter y Unbounded son variables y `next/font` genera un archivo por
familia; Poppins no lo es, así que hay un archivo por peso (7 900, 7 992 y 7 848
bytes).

Sólo se vendorizó el subconjunto `latin`, que es el único que declara el sitio:
cubre `U+0000–00FF` (acentos, `ñ`, `¿`, `¡`), las comillas y guiones de
`U+2000–206F`. Los demás subconjuntos (cirílico, griego, vietnamita, latin-ext)
tampoco los sirve Next, así que agregarlos cambiaría el render, no lo igualaría.

## Licencia

Las tres familias se distribuyen bajo SIL Open Font License 1.1. El texto
completo viaja con los archivos:

- `public/fuentes/OFL-Inter.txt` — Copyright 2020 The Inter Project Authors
  (<https://github.com/rsms/inter>).
- `public/fuentes/OFL-Unbounded.txt` — Copyright 2022 The Unbounded Project
  Authors (<https://github.com/googlefonts/unbounded>).
- `public/fuentes/OFL-Poppins.txt` — Copyright 2020 The Poppins Project Authors
  (<https://github.com/itfoundry/Poppins>). Es el mismo texto de la OFL 1.1 que
  se descargó para Inter, con la línea de copyright de Poppins: la licencia no
  cambia entre familias, sólo el titular.

Los de Inter y Unbounded se descargaron de `google/fonts` (`ofl/inter/OFL.txt`,
`ofl/unbounded/OFL.txt`). La OFL permite redistribuir los archivos dentro de un
sitio; no se modificaron ni se renombró la familia interna.

## Cómo regenerarlos

Si el sitio vigente cambia de pesos o de subconjunto, hay que rehacer la copia:

1. `npm run build` en la raíz (o `next dev` una vez) para que `next/font`
   descargue y escriba los archivos en `.next/static/media/`.
2. Leer la hoja generada: `.next/dev/static/chunks/` (o `.next/static/css/` en
   un build de producción) empieza con `@font-face` y trae el `unicode-range` y
   el nombre hasheado de cada subconjunto. El que incluye `U+??` es `latin`.
3. Copiar ese archivo a `public/fuentes/` con el nombre de la tabla de arriba y
   actualizar el `unicode-range` y los pesos de `fuentes.css` (`poppins.css` para
   Poppins) si cambiaron.
4. Actualizar los sha256 de este documento.

No hace falta descargar nada de Google a mano: los archivos son los que ya usa
el sitio.

## Precarga

`src/layouts/Sitio.astro` precarga Inter y Unbounded (`as="font"`,
`crossorigin`) porque el cuerpo y la cabecera los usan en el primer pantallazo.
Poppins **no** se precarga: en `/teclab` aparece en el hero, pero el sitio
tampoco la precarga (next/font no emite `preload` ahí) y sumarla cambiaría el
orden de carga respecto de Next.
