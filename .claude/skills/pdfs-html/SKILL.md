---
name: pdfs-html
description: Convertir HTML en PDF sin sorpresas — bordes blancos, páginas de más, arte cortado o archivos que el visor no abre. Usar cuando haya que exportar una pieza, un folleto, un informe o un canvas armado en HTML a PDF, o cuando un PDF ya generado salga con márgenes, con una página en blanco o con una franja de otro color en el borde.
---

# HTML a PDF sin sorpresas

Un PDF mal exportado no se nota mirando el HTML: se nota al abrirlo o, peor, en la
imprenta. Estas son las trampas que ya aparecieron, con la salida probada.

## Primero: ¿vector o mapa de bits?

| Caso | Ruta | Por qué |
|---|---|---|
| Pieza de diseño con arte a sangre, bloques de color y fotos | **Rasterizar a 300 dpi** y armar el PDF con PIL | Garantiza que el arte llene la página. El texto a 300 dpi se imprime igual de bien |
| Documento con texto que se va a buscar, copiar o editar | `page.pdf()` de Playwright | Texto real y fuentes incrustadas |

Regla: si el PDF es una **pieza**, rasterizar. Si es un **documento**, vectorizar.

## Ruta A · rasterizar (recomendada para piezas)

La hoja se diseña a 630 × 891 px (A4 a 96 dpi) y se fotografía a 300 dpi:

```js
const factor = 2480 / 630;                       // = 3,936 → 2480 × 3508 px
const page = await browser.newPage({
  viewport: { width: 630, height: 891 },
  deviceScaleFactor: factor,
});
await page.goto(url);
await page.evaluate(() => document.fonts.ready);
await page.locator('.hoja').first().screenshot({ path: 'alta-1.png' });
```

```python
from PIL import Image
ims = [Image.open(f'alta-{i}.png').convert('RGB') for i in range(1, 7)]
ims[0].save('pieza.pdf', save_all=True, append_images=ims[1:], resolution=300.0)
```

`resolution=300` deja la página en 595,2 × 841,68 pt = A4. Sin márgenes, sin bordes,
sin páginas de más. Un A4 a 300 dpi pesa ~4 MB por seis páginas: si molesta, bajar a
200 dpi (1654 × 2339) y sigue siendo imprimible.

## Ruta B · vectorizar con Playwright

```js
await page.addStyleTag({ content: `
  @page { size: 210mm 297mm; margin: 0 }
  html, body { margin: 0 !important; padding: 0 !important }
  .contenedor { display: block !important; padding: 0 !important; gap: 0 !important }
`});
await page.emulateMedia({ media: 'print' });
await page.pdf({ path: 'doc.pdf', width: '210mm', height: '297mm',
                 printBackground: true, scale: 1.2598 });
```

- La hoja de 630 px mide 166,7 mm: hay que escalarla **1,2598** para llenar 210 mm.
- Escalar más de 1,26 la desborda en vertical y Chromium **parte la hoja en dos páginas**.
- Neutralizar el padding del contenedor es obligatorio: 18 px de padding alcanzan para
  que cada hoja ocupe dos páginas.

### Lo que no funciona (probado)

- **`width: 210mm` en el body** para tapar el blanco: el fondo del body se ve como un
  **marco de color** alrededor del arte.
- **`-dFIXEDMEDIA -dPDFFitPage` en Ghostscript**: agrega márgenes arriba y abajo en vez
  de quitarlos.
- **`transform: scaleX(1.0016)` sobre la hoja**: no cambia nada, el navegador recompone
  la caja igual.
- **MediaBox más chico**: deja de ser A4, y para imprimir no sirve.

Con `page.pdf()` queda siempre **0,17 mm de blanco** en el borde derecho: la caja que
calcula Chromium mide 595,92 pt y la hoja 595,26 pt. Es invisible en pantalla y se va
con el recorte de imprenta, pero si el pedido es «sin bordes», hay que ir a la ruta A.

## Unir varios PDF

No hay `qpdf` ni `pdftk` en esta máquina; sí `gs`:

```bash
gs -q -dNOPAUSE -dBATCH -sDEVICE=pdfwrite -dAutoRotatePages=/None \
   -sOutputFile=pieza.pdf p1.pdf p2.pdf p3.pdf
```

Si cada hoja ya es una página exacta del tamaño final, no hace falta escalar nada. Con
`-dPDFFitPage` se agregan márgenes: no usarlo.

## Verificación: nunca decir «listo» sin esto

```bash
pdfinfo pieza.pdf | grep -E '^Pages|^Page size'      # 6 páginas, A4
pdftoppm -r 60 -png pieza.pdf /tmp/chk               # ¿cuántos PNG salieron?
```

- **Páginas**: si salieron 12 donde iban 6, cada hoja se partió en dos (padding o escala).
- **Tamaño**: `595,28 × 841,89 pt` es A4 exacto.
- **Bordes**: las cuatro esquinas de cada hoja tienen que ser arte, no blanco:

```python
from PIL import Image; import glob
for f in sorted(glob.glob('/tmp/chk-*.png')):
    im = Image.open(f).convert('RGB'); w, h = im.size
    print(f, im.getpixel((0,0)), im.getpixel((w-1,0)), im.getpixel((0,h-1)), im.getpixel((w-1,h-1)))
```

- **Peso**: si el PDF pesa 300 KB y tiene fotos, no se cargaron los recursos.

## Archivos mal servidos

- `file://` está bloqueado en los navegadores de esta máquina: hay que servir por HTTP
  (`node:http` con un mini servidor alcanza) o Playwright devuelve páginas en blanco.
- Las rutas con espacios en el nombre se rompen al pasarlas por shell: citarlas siempre.
- `deviceScaleFactor` alto + `fullPage` produce capturas enormes: capturar el elemento
  (`.locator('.hoja').screenshot()`) en vez de la página entera.

## Entrega

- Nombre sin acentos ni barras: `Oferta academica CAU Villa Lugano.pdf`.
- Dejar el PDF donde el usuario lo va a buscar (escritorio) y avisar la ruta completa.
- Si además quiere imágenes, `pdftoppm -r 150 -png` y una hoja de control con todas.
