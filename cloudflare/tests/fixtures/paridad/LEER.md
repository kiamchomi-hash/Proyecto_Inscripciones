# Referencias de paridad

`home.json`, `rutas.json`, `sitemap.xml` y `robots.txt` se generaron con Next y el stub de
PostgREST de `tests/helpers/servidores.mjs`, no con datos de producción. Cada
generador compara dos procesos Next independientes antes de escribir. Las dos
ejecuciones iniciales de cada generador dieron archivos idénticos.

Desde `cloudflare/`, con Next instalado en la raíz y sin otro `next dev` activo:

```bash
node tests/helpers/referencia-home.mjs /tmp/opencode/home-nueva.json
node tests/helpers/referencia-sitemap.mjs /tmp/opencode/sitemap-nuevo
node tests/helpers/generar-referencias-rutas.mjs /tmp/opencode/rutas-nuevas.json
```

Los destinos tienen que ser nuevos: no se pisan referencias existentes. Antes
de sustituirlas, revisar las diferencias; no regenerarlas sólo para hacer pasar
una prueba. `tests/referencia-home.test.mjs` compara el Worker compilado contra
ellas y corre dentro de `npm run test:paridad`.

La comparación viva con Next sigue activa: estas referencias cubren las 32 rutas
de esa comparación y sus regiones de navegación y pie, pero no sustituyen aún las
pruebas de redirects, errores y capturas de navegador.

El 02/11/2026 se editaron a mano sólo las regiones `navegacion` de `home.json` y
`rutas.json`: el navbar cambió a propósito (sale «Sobre Nosotros», entra Teclab,
que ahora tiene enlace propio) y el generador de Next ya no puede producir la
referencia nueva. El resto de los campos sigue siendo lo que registró Next; si
alguna vez se regenera, revisar igual la diferencia antes de sustituirlas.

El 10/11/2026 se actualizaron con lo que devuelve el build local la `home` y las
cinco rutas que habían quedado fuera de referencia: el «Título: …» de las
tarjetas del catálogo (`292a266`), el mensaje de WhatsApp de las clases de apoyo
(`7e442db`) y los campos del formulario de preinscripción (`3cdc040`) no estaban
en lo que registró Next. Se comparó ruta por ruta antes de sustituir y cada
diferencia era una de esas tres. Desde que la app de Next salió del repo estas
referencias son una foto del estado acordado, no una comparación con Next: las
regeneran `scripts/actualizar-referencia-ruta.mjs` y
`scripts/actualizar-referencia-home.mjs`.

Las referencias visuales están en `../visuales-next/`: 50 capturas sintéticas,
divididas en 54 bandas WebP sin pérdida y sus manifiestos (unos 39 MiB). Las
generó `tests/helpers/generar-referencias-visuales.mjs` desde la corrida local
de E2E del 28/10/2026; cada banda se contrastó píxel por píxel con el PNG de
origen. Se comparan en paralelo con Next, usando los umbrales existentes y el
margen de un píxel de `/sobre-nosotros`. La integración aún no está validada:
una corrida agotó el plazo y otra falló por capturas de distinto alto y un 404
de asset local. No eliminar la comparación con Next hasta resolverlo.
