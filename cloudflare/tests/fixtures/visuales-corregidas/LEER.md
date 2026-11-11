# Referencias visuales corregidas

Estas capturas sustituyen **para el control de regresión** las de
`visuales-next` en las 25 rutas que `tests/e2e.test.mjs` compara, en escritorio
y celular. Las referencias Next originales no se modifican y siguen
disponibles como registro de la paridad histórica.

## Por qué se regeneraron (10/11/2026)

La comparación contra Next llevaba tiempo sin validar: el sitio creció desde
la migración y las capturas se quedaron atrás. Antes de regenerarlas se
revisó ruta por ruta qué había cambiado y por qué:

- el «Título: …» de las tarjetas del catálogo (`292a266`);
- el mensaje de WhatsApp de las clases de apoyo (`7e442db`);
- los campos del formulario de preinscripción (`3cdc040`);
- el carrusel de la portada con sus controles (`2991591`);
- la tabla del calendario con su columna fija (`2879f23`).

## Cómo se toman

Con el mismo fixture sintético y el mismo procedimiento de `e2e.test.mjs`, que
espera a que las fuentes estén **aplicadas** (con `swap` el texto se pinta con
la de respaldo y cambia después: sin esa espera la captura dependía del
momento) y a que el carrusel de la portada esté pausado. Se codifican en
bandas WebP sin pérdida, sin aumentar las tolerancias.

Para regenerarlas:

```bash
cd cloudflare
npm run build
node --experimental-transform-types --test tests/e2e.test.mjs   # deja las capturas
node scripts/actualizar-referencias-visuales.mjs \
  .local/capturas/<sello-de-la-home> .local/capturas/<sello>-paginas
```

Antes de sustituirlas, revisar la diferencia: no se regeneran sólo para hacer
pasar una prueba.

Son referencias de la versión vigente del Worker, no capturas del Next
histórico ni del sitio de producción.
