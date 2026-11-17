# Inventario determinista para E2E

## Problema

La ruta interna `/imagenes` genera su catálogo desde el directorio local
`public/imagenes` durante el build. La captura E2E compara la página completa con
una referencia fija, pero el inventario local puede incluir archivos que no están
en Git. Eso hace que cambie el alto de la página sin un cambio reproducible del
proyecto.

## Diseño aprobado

- Mantener el inventario recursivo real para desarrollo y producción.
- En el build dedicado inmediatamente anterior al E2E de `npm run check`,
  permitir una lista fija y versionada de imágenes, elegidas entre assets
  rastreados y existentes.
- Activar ese modo sólo desde el runner local de controles; no aceptar una ruta
  arbitraria ni cambiar los builds normales, el entorno de publicación ni las
  pruebas de contrato que validan el inventario completo.
- Validar que cada asset de la lista exista para que el fixture no se degrade en
  silencio.
- Regenerar las referencias visuales de `/imagenes` con el inventario fijo y
  correr el E2E y el control integral de `cloudflare/`.

## Alternativas consideradas

- Actualizar la referencia contra el inventario local actual: rápido, pero puede
  incorporar archivos no versionados y fallar en otro checkout.
- Capturar sólo el encabezado de `/imagenes`: estable, pero deja de cubrir las
  tarjetas y su grilla.

Se elige el inventario E2E fijo para conservar cobertura visual y reproducibilidad.

## Límites

No se cambian assets reales, datos D1, servicios remotos ni comportamiento de
producción. No se hace commit ni push.
