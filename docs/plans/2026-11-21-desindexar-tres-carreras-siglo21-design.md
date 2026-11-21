# Diseño: desindexar tres carreras de Siglo 21

## Objetivo

Probar si retirar de los resultados de búsqueda tres fichas de Siglo 21 que se
solapan con carreras de Teclab ayuda a separar su posicionamiento.

## Alcance acordado

- Aplicar `noindex, follow` a:
  - `/carreras/tecnicatura-en-relaciones-laborales`
  - `/carreras/tecnicatura-en-gestion-contable-e-impositiva`
  - `/carreras/tecnicatura-en-redes-informaticas-y-telecomunicaciones`
- Excluir esas tres URL del sitemap.
- Mantener las fichas publicadas y accesibles por URL directa y enlaces
  existentes.
- No modificar fichas de Teclab ni otras carreras.

## Implementación y verificación

Ampliar la lista central de rutas no indexables ya usada por la ficha de
Marketing y Publicidad Digital. Verificar que las tres fichas entreguen
`noindex, follow`, no aparezcan en el sitemap y sigan respondiendo; confirmar
que las fichas de Teclab y otras carreras de Siglo 21 mantienen su estado.
Search Console reflejará la exclusión cuando Google vuelva a rastrearlas.
