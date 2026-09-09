# Referencias — Folleto Contador Público A4

## UIverse local — ★ Mías

La curaduría se hizo sobre la biblioteca local completa y se inspeccionaron visualmente candidatos en `★ Mías` antes de elegir el lenguaje visual. Se tomaron recursos funcionales, no plantillas ni composiciones completas:

- [Tarjetas de métrica con sello verificado — Basedash](https://www.basedash.com/): jerarquía de dato y etiqueta.
- [Gráfico de brecha con curvas trazadas — Antimetal](https://antimetal.com/): curva, ejes y lectura de tendencia.
- [Tarjeta de receta con marcos cromáticos — Busy Bee Honey](https://www.busybeehoney.com/kitchen): uso de marco claro y capas de contención.

El resultado no copia sus layouts. Se tradujeron esas funciones a una pieza editorial A4 para una carrera universitaria. Se descartó continuar con el fondo oscuro, halo y trama usados en Abogacía.

## Datos de la carrera

- Fuente académica local: `carreras/siglo21/datos/fichamail-contador-p%C3%BAblico.json`.
- [Página oficial de Contador Público — Universidad Siglo 21](https://21.edu.ar/carreras-y-programas/contador-publico).

## Recursos de marca y sede

- `public/imagenes/imagenes_cau/logo_cau.png`.
- `public/imagenes/imagenes_cau/siglo21-marca.svg`.
- Dirección y teléfono verificados en `lib/sede.ts` y `lib/whatsapp.ts`.

## Nota de Affinity

El MCP de Affinity quedó conectado y reportó sus herramientas upstream, pero la sesión actual sólo expuso el chequeo de estado; no expuso comandos de edición/render para actuar sobre el documento abierto. Por eso la entrega conserva SVG editables compatibles con Affinity y la verificación visual se hizo sobre sus renders PNG.
