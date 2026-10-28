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

Las referencias visuales están en `../visuales-next/`: 50 capturas sintéticas,
divididas en 54 bandas WebP sin pérdida y sus manifiestos (unos 39 MiB). Las
generó `tests/helpers/generar-referencias-visuales.mjs` desde la corrida local
de E2E del 28/10/2026; cada banda se contrastó píxel por píxel con el PNG de
origen. Se comparan en paralelo con Next, usando los umbrales existentes y el
margen de un píxel de `/sobre-nosotros`. La integración aún no está validada:
una corrida agotó el plazo y otra falló por capturas de distinto alto y un 404
de asset local. No eliminar la comparación con Next hasta resolverlo.
