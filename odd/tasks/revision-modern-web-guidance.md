# Revisión Modern Web Guidance

## Alcance

El catálogo consultado contiene 208 guías; no todas corresponden al sitio.
`legacy-scan` revisó el repositorio con 35 reglas de 33 guías y detectó una
posible modernización del acordeón. El barrido del sitemap visitó 129 URLs en
Chromium móvil y comprobó únicamente `h1`, `main`, `alt` y desborde inicial.
Ninguna de esas dos comprobaciones equivale a una auditoría integral.

## Revisado

- `animate-to-intrinsic-sizes`: el acordeón de FAQ mide la altura con JS.
  La alternativa `interpolate-size` no está soportada por Firefox y Safari
  según la guía consultada. Se conserva lo existente para no perder animación;
  esto no cierra la revisión de accesibilidad del acordeón.
- `accessibility`, controles puntuales: se corrigió la región principal de FAQ
  y fichas de materias y se nombraron los selectores de mes y año.
- `responsive-table`, calendario: se verificó en Chromium que ArrowRight mueve
  realmente la tabla en móvil.
- `carousel`, gesto: se recuperó el deslizamiento sobre el banner y se probó
  con eventos táctiles CDP. Publicado en `34147e9`; una prueba CDP en
  producción, después de hidratar la isla, cambió de `0%` a `-100%`.
- `navbar`, estado de ubicación: se confirmó en `/faq` que el enlace activo
  sólo tenía clase visual, sin `aria-current`. Corrección local: `page` en la
  ruta exacta y `location` en una sección descendiente; pruebas 293/293.

## En revisión

- `copy-button`: `components/novedades/copy-link-button.tsx` coloca `aria-live`
  en el propio botón; la guía advierte que una región viva dentro de un botón
  no se anuncia de forma fiable. Confirmar el comportamiento y las variantes
  antes de modificarlo.
- El catálogo de guías fue clasificado preliminarmente por temas; confirmar
  cada aplicabilidad contra el código, sin tratar sugerencias como requisitos
  de funcionalidades que el sitio no tiene.
- Falta contrastar por familia y variantes las guías pertinentes de
  navegación, formularios, diálogos, imágenes, movimiento, rendimiento,
  seguridad, accesibilidad y componentes de clases de apoyo.
- La referencia visual de home precede a la eliminación de
  `content-visibility` en `4c72a48`. En el fixture, restituir temporalmente
  esa regla produjo una coincidencia de escritorio del 0,000 %; en móvil
  quedó una diferencia de 1 px. No se restaura en producción: se había
  retirado por la superposición de tarjetas. Falta revisar y actualizar las
  capturas correspondientes sin ocultar otros cambios.
