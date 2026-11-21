# Diseño: desindexar Marketing y Publicidad Digital de Siglo 21

## Objetivo

Probar si retirar de los resultados de búsqueda la ficha de Siglo 21 que compite
por consultas de marketing permite que la ficha de Teclab capture mejor esas
búsquedas.

## Alcance acordado

- Aplicar `noindex` únicamente a `/carreras/tecnicatura-en-marketing-y-publicidad-digital`.
- Mantener la URL publicada y accesible por enlace directo, incluido el acceso
  desde WhatsApp.
- No modificar otras fichas de Siglo 21 ni la ficha de Teclab.

## Verificación

Confirmar en el HTML servido que la ruta objetivo expone `noindex`, las demás
fichas conservan su directiva actual y la compilación del Worker termina bien.
Search Console puede tardar en reflejar la exclusión.
