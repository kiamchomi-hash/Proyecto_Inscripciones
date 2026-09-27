# Precisión, medidas y salida

Leer esta referencia cuando una pieza tenga tamaño físico, sangrado, PDF,
resolución de impresión o un pedido de precisión a píxel.

## Dos precisiones distintas

- **Impresión:** la fuente de verdad es el tamaño físico en milímetros y los
  boxes del PDF. Un PDF vectorial no se define por “cantidad de píxeles”.
- **Raster:** la fuente de verdad es la matriz final de píxeles. El tamaño se
  calcula para unos ppp concretos y se verifica en el archivo exportado.

No usar “pixel perfect” para ocultar esta diferencia. Entregar ambos valores:
por ejemplo, `A5 a corte 148 × 210 mm` y `PNG a 300 ppp: 1748 × 2480 px`.

La conversión es:

```text
píxeles = redondear(milímetros / 25,4 × ppp)
```

El redondeo es inevitable porque el raster sólo admite píxeles enteros. No
recalcular cada eje desde una aproximación anterior.

## Medidas de referencia a 300 ppp

| Formato | Corte | PNG a corte | Con 3 mm de sangrado | PNG con sangrado |
|---|---:|---:|---:|---:|
| A5 vertical | 148 × 210 mm | 1748 × 2480 px | 154 × 216 mm | 1819 × 2551 px |
| A5 horizontal | 210 × 148 mm | 2480 × 1748 px | 216 × 154 mm | 2551 × 1819 px |
| A4 vertical | 210 × 297 mm | 2480 × 3508 px | 216 × 303 mm | 2551 × 3579 px |
| A4 horizontal | 297 × 210 mm | 3508 × 2480 px | 303 × 216 mm | 3579 × 2551 px |

ISO 216 define el tamaño de corte. El sangrado no forma parte de A5 o A4: se
agrega alrededor según la imprenta. Tres milímetros son habituales, no
universales. Una zona segura de 6 mm dentro del corte equivale a unos 71 px a
300 ppp; medida desde el borde exterior de un lienzo con 3 mm de sangrado, el
primer contenido crítico queda a 9 mm, unos 106 px.

## Especificación geométrica antes de diseñar

Registrar, antes del estilo:

```text
pieza:
orientación y caras:
tamaño de corte:
sangrado:
zona segura:
salida física:
salida raster y ppp:
columnas y calles:
retícula de línea base:
anclas principales:
```

La zona segura protege texto, logos, QR, caras y manos; los fondos e imágenes a
sangre llegan hasta el borde exterior. Las marcas de corte sólo se agregan si
la imprenta las pide y nunca invaden el arte.

## Retícula y espaciado

- Definir columnas, calles y márgenes en milímetros o en unidades derivadas de
  la retícula; no ubicar cada elemento con un número aislado.
- Definir una línea base a partir del interlineado del cuerpo y alinear a ella
  textos relacionados. Para una pieza corta pueden coexistir una retícula de
  composición y una de línea base.
- Registrar una escala pequeña de espacios —por ejemplo, base, doble, triple y
  múltiplos mayores— adaptada al formato. No imponer siempre 8 px: en impresión
  la unidad debe traducirse a una medida física coherente.
- Alinear bordes, ejes y líneas base matemáticamente; después permitir ajustes
  ópticos deliberados para letras, círculos, logos o masas de imagen.
- Verificar cada gran área vacía como parte del balance: debe separar grupos,
  conducir la mirada o intensificar el foco. Si no cumple una función, revisar
  proporciones y anclas.

## Master reproducible

Para piezas de una página con precisión alta, preferir un master vectorial o un
SVG con `viewBox` estable. Una convención útil es usar 10 unidades por milímetro:
un lienzo A5 con sangrado usa `viewBox="0 0 1540 2160"`. Así una unidad equivale
a 0,1 mm y la misma geometría puede rasterizarse a cualquier resolución.

Si el master es HTML/CSS:

- declarar el tamaño físico con `@page` y unidades `mm` para el PDF;
- generar el raster desde la misma especificación geométrica, pero con ancho y
  alto enteros calculados; no suponer que el viewport prueba el tamaño físico;
- usar `box-sizing: border-box`, resetear márgenes y evitar transformaciones de
  escala sobre la hoja terminada;
- usar archivos de fuente locales y versiones/pesos fijos; no depender de una
  fuente del sistema o de una descarga remota;
- fijar la versión del renderer. Un cambio de navegador o fuente puede alterar
  saltos de línea y métricas aunque el CSS sea idéntico.

Para PDF con Playwright, `preferCSSPageSize: true`, `printBackground: true` y
`scale: 1` evitan el ajuste automático a otro papel. Para raster, congelar
animaciones, esperar `document.fonts.ready` y elegir explícitamente si cada píxel
CSS corresponde a un píxel de salida. No aceptar el valor por defecto sin
medir el archivo.

## Imágenes raster dentro de la pieza

La resolución efectiva depende del tamaño colocado:

```text
ppp efectivos = píxeles de la imagen / pulgadas impresas
```

Una imagen de 1500 px de ancho colocada a 127 mm —5 pulgadas— rinde 300 ppp.
La misma imagen ampliada a 254 mm rinde 150 ppp. Registrar el recorte real: los
píxeles descartados por `cover` no cuentan para el ancho útil.

Para impresión comercial, 300 ppp es una referencia habitual para fotografías
y gráficos de detalle; Adobe contempla 150–300 ppp según prensa y trama. La
imprenta manda. Mantener logos y geometría simple como vector siempre que sea
posible.

## Lista de verificación automatizable

Antes de revisar estética, comprobar:

1. ancho y alto reales del PNG;
2. tamaño físico y orientación del PDF;
3. MediaBox, TrimBox y BleedBox si la imprenta los exige;
4. fuentes cargadas o incorporadas;
5. ausencia de overflow y scroll;
6. límites de texto, logo, QR, caras y manos dentro de la zona segura;
7. resolución efectiva de cada imagen;
8. cuadro estático determinista para shaders, canvas o animaciones;
9. ausencia de recursos remotos que puedan variar o fallar.
10. la imagen no muestra fondos accidentales del contenedor ni filtros de mezcla
    no justificados;
11. el contacto (teléfono, dirección y URL) se lee al tamaño físico y queda
    dentro de la zona segura;
12. el flujo vertical no deja huecos accidentales entre contenido y CTA.

Usar `scripts/medidas-impresion.mjs` para calcular medidas y validar PNG. La
comprobación numérica no reemplaza una revisión visual al 100 %, al 25 %, en
escala de grises y, cuando corresponda, una prueba impresa.

## Fuentes consultadas

- https://www.iso.org/standard/36631.html — ISO 216 y tamaños de corte de las
  series A y B.
- https://helpx.adobe.com/indesign/desktop/print/page-set-up-and-printer-marks/print-bleed-and-slug-areas.html — función del sangrado y referencia habitual de 3 mm.
- https://helpx.adobe.com/nz/indesign/using/graphics-formats.html — resolución
  de raster para impresión comercial y diferencia entre raster y vector.
- https://helpx.adobe.com/indesign/desktop/layout-and-grid-tools/grids/use-a-baseline-grid.html — retícula de línea base y relación con el interlineado.
- https://playwright.dev/docs/api/class-page#page-screenshot — escala de captura,
  recorte y congelado de animaciones.
- https://playwright.dev/docs/api/class-page#page-pdf — tamaño CSS de página,
  fondos y escala de PDF.
