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
- `copy-button`: la guía advierte que el contenido de un botón es presentacional
  y una región viva adentro no se anuncia de forma fiable. Se encontró el mismo
  patrón en cinco lugares (`copy-link-button`, `career-modal`, `teclab-modal`,
  `ia-modal`, `carousel-modal`). Corrección local: `AvisoCompartir`, una región
  `role="status"` hermana del botón; el texto visible del botón no cambia.

- `accordion`: el FAQ arma cada ítem con `<button aria-expanded>` y panel con
  `hidden` al cerrar. Faltaba la relación explícita: se agregó `aria-controls`
  con `useId` en las tres variantes (preguntas, contacto, preguntas de
  usuarios). La guía desaconseja además envolver cada acordeón en un landmark.

## En revisión

- `dialog`: los cuatro modales de carrera y el de Teclab usan `<dialog>` nativo
  con `showModal()`. El modal «Hacé tu pregunta» de `faq-page.tsx` sigue siendo
  un `div` con `role="dialog"` y foco administrado a mano. Migrarlo toca los
  formularios de publicación y privacidad; queda anotado, no se cambió.
- El catálogo de guías fue clasificado preliminarmente por temas; confirmar
  cada aplicabilidad contra el código, sin tratar sugerencias como requisitos
  de funcionalidades que el sitio no tiene.
- Falta contrastar por familia y variantes las guías pertinentes de
  navegación, formularios, diálogos, imágenes, movimiento, rendimiento,
  seguridad, accesibilidad y componentes de clases de apoyo.
- La referencia visual de home quedó al día: la de escritorio precedía a la
  eliminación de `content-visibility` (`4c72a48`) — restituir esa regla en una
  corrida aislada reprodujo la referencia al 0,000 %, pero no se reintroduce
  porque se había retirado por la superposición de tarjetas. La de móvil estaba
  todavía más atrás: mostraba otro diseño del bloque de catálogo y del pie.
  Ambas se regeneraron desde la captura real y la corrida siguiente queda
  pendiente de confirmar.
