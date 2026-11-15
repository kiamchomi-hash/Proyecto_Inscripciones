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

- `dialog` y `prevent-page-scroll-under-modal-dialog`: el modal «Hacé tu
  pregunta» del FAQ era un `div` con `role="dialog"`, trampa de foco y Escape
  escritos a mano. Ahora es un `<dialog>` nativo con `showModal()`: la página
  queda inerte, el foco encerrado y Escape llega como `cancel`. El velo pasó a
  `::backdrop`, con `overflow: hidden` y `overscroll-behavior: contain` como
  pide la guía para que la rueda no mueva la página de atrás; `.modal-raiz`
  ya cumplía lo mismo. Ojo con el orden de montaje: `AskModal` se monta cerrado
  y devuelve `null`, así que el efecto que llama a `showModal()` depende de
  `open`; con dependencias vacías se quedaba sin nodo y el diálogo nunca abría.
  Prueba e2e nueva: el diálogo abierto es un `<dialog>` y se cierra con Escape.
- `forms`, `accessible-error-announcement`, `required-field-feedback`: el
  formulario de lead marcaba el borde en rojo pero no lo decía en el marcado.
  Se agregó `aria-invalid` a los campos de texto y a los desplegables (el botón
  de fecha no lo admite, así que ahí va un texto asociado con
  `aria-describedby`), el mensaje de error de cada campo tiene `id` propio, y
  los avisos de envío, captcha vencido y captcha sin tildar van en una región
  `role="status"`.
- `accordion`: el FAQ arma cada ítem con `<button aria-expanded>` y panel con
  `hidden` al cerrar. Faltaba la relación explícita: se agregó `aria-controls`
  con `useId` en las tres variantes (preguntas, contacto, preguntas de
  usuarios). La guía desaconseja además envolver cada acordeón en un landmark.

## Cobertura por área

| Área | Guías contrastadas | Estado |
| --- | --- | --- |
| Menú superior | `navbar` | Corregido: `aria-current` (`89745a3`) y prueba unitaria |
| Migas de pan | `breadcrumbs` | Cumple: `nav` con `aria-label`, separadores `aria-hidden` y `aria-current="page"` |
| Carrusel de portada | `carousel`, `carousel-snap-highlights` | Corregido el gesto táctil (`34147e9`), probado en producción |
| Formularios | `forms`, `required-field-feedback`, `accessible-error-announcement` | Corregido: `aria-invalid`, `aria-describedby` y región de estado para los avisos de envío |
| Desplegables y fecha | `select-menu-interaction`, `ime-safe-enter-submit` | Ya tenían recorrido con teclado y nombres accesibles (`5c92d21`) |
| Tabla de reserva | `responsive-table`, `dialog` | Ya se desplaza con el teclado y el calendario se anuncia |
| Acordeón del FAQ | `accordion`, `animate-to-intrinsic-sizes` | `aria-controls` agregado; se conservó la animación por JS con motivo |
| Modales | `dialog`, `prevent-page-scroll-under-modal-dialog`, `light-dismiss-a-dialog` | Todos usan `<dialog>` nativo; velo con `overflow: hidden` y `overscroll-behavior: contain` |
| Copiar enlace | `copy-button` | Corregido: la región viva quedó fuera del botón |
| Imágenes | `optimize-image-priority`, `deliver-optimized-decorative-images` | Cumple: `srcset`, `sizes`, `fetchPriority` y `alt` verificados por el e2e |

## Sin contrastar

El resto del catálogo no se revisó guía por guía. Lo que falta se puede agrupar
así: tarjetas y catálogo (`card`, `content-based-styling`, `size-aware-styling`),
movimiento y transiciones (`motion`, `scroll-entry-exit-effects`,
`cross-document-transitions`), rendimiento (`performance`, `optimize-preload-priority`,
`break-up-long-tasks`), seguridad del frontend (`sanitize-untrusted-html`,
`trusted-types`, `validate-origins`) y el grupo grande de guías de CSS general.
`legacy-scan` cubre 33 guías con reglas deterministas y dejó un solo hallazgo,
el del acordeón, que se evaluó y se conservó. Eso no equivale a haber revisado
las 208.

## En revisión

- El catálogo de guías está clasificado por temas, pero falta confirmar la
  aplicabilidad de cada una contra el código (ver «Sin contrastar»): una
  sugerencia no es un requisito para funcionalidades que el sitio no tiene.
- Referencias visuales de la home: quedaron al día. La de escritorio precedía
  a la eliminación de `content-visibility` (`4c72a48`); restituir esa regla en
  una corrida aislada reprodujo la referencia al 0,000 %, pero no se
  reintroduce porque se había retirado por la superposición de tarjetas. La de
  móvil estaba más atrás todavía: mostraba otro diseño del catálogo y del pie.
  Ambas se regeneraron desde la captura real (`712bab5`) y la corrida siguiente
  dio 0,000 % en los dos perfiles con 23 pruebas en verde.
