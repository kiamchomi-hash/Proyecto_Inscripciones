---
name: pdfs-cau
description: Armar folletos y piezas multipágina del CAU Villa Lugano en A4 y exportarlos a PDF e imágenes. Usar cuando haya que diseñar o cerrar una pieza del CAU, Siglo 21 o Teclab en varias hojas, cuando haya que regenerar el PDF de entrega, o cuando el PDF salga con bordes, cortado o con páginas de más.
---

# PDFs del CAU

Todo lo de acá está medido sobre la pieza de oferta académica de noviembre de 2026
(`contenidos/cau/en-curso/2026-11-03-oferta-academica/`), que es la referencia vigente.
No se reinterpreta: se copia.

## Geometría

- **Hoja**: 630 × 891 px. Es A4 exacto a 96 dpi. Todo se posiciona en píxeles
  absolutos sobre esa caja, sin `clamp()` ni media queries.
- **Zona segura**: 34 px de margen lateral (≈ 9 mm). La franja y las fotos van a sangre.
- Para imprimir hace falta sangrado de 3 mm, que todavía no está implementado.

## Sistema visual (valores fijos)

| Elemento | Valor |
|---|---|
| Fondo | `linear-gradient(180deg, #0a2822 0%, #14493d 68%, #08201c 100%)` |
| Grano | `recursos/grano.png`, `opacity .26`, `mix-blend-mode: overlay`, `background-size: 256px` |
| Marca de agua | `width 285px`, `left -42px`, `top -24px`, `opacity .075`, `rotate(15deg)`, dentro de una caja de 630×300 con `overflow:hidden` |
| Franja de casa | 12 px a sangre: verde `#24957e` (Siglo 21), azul `#135cdf` (Teclab), mostaza `#c68b0c` (CAU/ubicación) |
| Pie | 51 px, `#1b5446`, logos 25/13/12 px, dirección 10.5 px `#e6efec` |
| Cian de énfasis | `#00c3b3` |
| Ámbar de bloque | `#e49a05` (degradado `#f0b030 → #e49a05 → #c88800`) |
| Tipografía | Inter en Siglo 21, Poppins en Teclab, ambas incrustadas por `@font-face` desde `recursos/` |

La marca de agua, el pie y el grano **son iguales en todas las hojas**. Si una página
no los muestra como las demás, comparar su CSS con la de al lado antes de tocar
nada: en la página 6 había dos reglas `.p6 .marca` superpuestas y ganaba la última.

## Datos: de dónde salen

- **Carreras publicadas**: `npm run db:d1 -- "SELECT nombre, nivel FROM carreras WHERE activa = 1 AND nivel <> 'Identidad Argentina' ORDER BY nivel, nombre"`
- **Datos de la sede**: `lib/sede.ts` (dirección, Maps, coordenadas) y `cau_brand`.
- **Textos de las casas**: `conocimiento/siglo21.md` y `conocimiento/teclab.md`.
- **Nunca** de una pieza anterior: un folleto viejo arrastra direcciones y cifras vencidas.
- Cifras que ya se usaron y están confirmadas: 69 carreras de Siglo 21 (37 grado, 25 pregrado,
  7 CCC), 24 tecnicaturas de Teclab (16 gestión, 8 tecnología), +1000 egresados de la sede,
  32 años en el barrio, 87 % de empleabilidad, +90.000 estudiantes y CONEAU.

## Cómo se exporta

**Usar `pdf-rapido.mjs`.** Rasteriza cada hoja a 300 dpi y arma el A4 exacto con PIL.
Es la única ruta que da páginas llenas, sin bordes, en un paso.

```bash
node pdf-rapido.mjs          # deja _alta-1.png … _alta-6.png
python3 - <<'PY'             # une a A4 a 300 dpi
from PIL import Image
ims=[Image.open(f'_alta-{i}.png').convert('RGB') for i in range(1,7)]
ims[0].save('Oferta academica CAU Villa Lugano.pdf', save_all=True,
            append_images=ims[1:], resolution=300.0)
PY
```

**No usar `page.pdf()`** para esta pieza. Da texto vectorial, pero la caja de página
que calcula Chromium queda 0,66 pt más ancha que la hoja y deja 0,17 mm de blanco al
borde derecho. Se probó escalar, poner `width` al body y forzar el MediaBox con
Ghostscript: aparece un marco verde, márgenes o páginas de más. El detalle está en la
skill `pdfs-html`.

## Verificación obligatoria antes de entregar

1. `pdfinfo archivo.pdf` → `Pages: 6` y `Page size` A4.
2. Rasterizar y mirar **las cuatro esquinas** de cada hoja: ninguna puede ser blanca.

```bash
pdftoppm -r 60 -png archivo.pdf /tmp/chk
python3 -c "
from PIL import Image; import glob
for f in sorted(glob.glob('/tmp/chk-*.png')):
    im=Image.open(f).convert('RGB'); w,h=im.size
    print(f, im.getpixel((0,0)), im.getpixel((w-1,0)), im.getpixel((0,h-1)), im.getpixel((w-1,h-1)))
"
```

3. Armar la hoja de control con las seis y mirarla entera: es lo que ve quien recibe.

## Entregables

- `Oferta academica CAU Villa Lugano.pdf` en la carpeta de la pieza y una copia en `~/Escritorio`.
- `~/Escritorio/Oferta academica - paginas/pagina-N.png` a 150 dpi, más `vista-de-las-6.png`.
- La fuente es el HTML de cada hoja (`pagina-N.html`), nunca el PDF ni el PNG.

## Reglas de trabajo

- **Una hoja, un archivo.** El generador que arma las seis (`armar-paginas.py`) sobrescribe
  todo: si alguien está editando otra página en paralelo, no se corre.
- El usuario edita las otras hojas mientras uno trabaja en una: no tocarlas.
- Aprobar es explícito. «Perfecto» o «cerrada» cierran la hoja; un comentario no.
- La pieza queda en `en-curso/<fecha>-<pieza>/` hasta que estén todas; recién ahí se copia
  a `aprobados/` con su `ficha.md`.
