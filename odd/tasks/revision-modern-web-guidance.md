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
- `card`, `content-based-styling`, `size-aware-styling`: las tarjetas de carrera
  son enlaces nativos que conservan su URL y abren el modal sólo en la
  navegación normal; el sitio no depende de container queries para ellas. El
  realce visual por `:hover` existe, pero no sustituye la navegación del enlace.
- `motion`, `scroll-entry-exit-effects`, `cross-document-transitions`: se
  verificó que hay transiciones y carruseles, con respeto a movimiento reducido
  en algunos componentes, pero no una implementación general de animaciones
  ligadas al scroll ni de View Transitions. La guía de efectos de carrusel es
  progresiva y no obliga a convertir los carruseles actuales a scroll-snap.
- `performance`, `optimize-preload-priority`, `break-up-long-tasks`: las guías
  no imponen cambios sin una medición asociada. El código tiene prioridades de
  imagen declaradas en casos puntuales y no se concluye de ello que todas las
  rutas o recursos hayan sido auditados por rendimiento.
- `sanitize-untrusted-html`, `trusted-types`, `validate-origins`: el HTML de
  contenido se sanitiza en servidor con lista de etiquetas, atributos y
  esquemas permitidos antes de insertarse. No se encontraron flujos de
  `postMessage` de la aplicación que requieran validar orígenes ni una política
  Trusted Types; no se recomienda introducirlas sin identificar un sink o
  intercambio que lo justifique.
- `css`: la consulta verificó selectores universales, `@layer`, `@scope` y
  unidades de contenedor, flex/grid, propiedades lógicas, tokens, desborde y
  responsive. Hay una query `@container modal` en el modal de Teclab, con
  disposición base si no se aplica; también `@supports not (subgrid)` con
  layout alternativo. No hay `@layer` ni `@scope`. En cambio, `.ca-materia`
  declara `container-type: inline-size` sin una query ni unidades `cq*` que la
  consuman: queda como posible declaración innecesaria, pendiente de probar el
  efecto sobre el tamaño intrínseco antes de quitarla. Los tokens del sitio
  están centralizados en `:root` y `@theme`; Tailwind Preflight es el reset
  global existente, y el selector universal de movimiento reducido se limita
  a esa preferencia. El `@import "tailwindcss"` de `globals.css` es una
  directiva del compilador, no una cadena de descarga CSS en producción. Las
  reglas `transition: all` aparecen en varias hojas, pero sin impacto medido
  no se toman por defecto como defectos. El objetivo sigue siendo Baseline
  2022; las funciones posteriores se evalúan por degradación y uso concreto.
- `performance`: se tomaron trazas de carga en producción en Chromium de
  escritorio, sin throttling, en home, `/teclab`, `/clases-apoyo` y
  `/carreras/abogacia`. El analizador registró respectivamente 5/5/2/2 tareas
  largas (>50 ms), con `longTaskBlocking` de 468,7/220,3/123,6/148,4 ms y
  máximos por tarea de 252,9/235,0/151,5/177,9 ms. Es una muestra diagnóstica
  del hilo principal, no TBT ni Core Web Vitals; no se obtuvo LCP, INP ni una
  puntuación Lighthouse. Sin trazas con stack atribuible o throttling, no se
  asigna el bloqueo a un componente ni se recomienda un cambio de código.
  El reproductor sólo crea el iframe de YouTube después de que la persona pide
  reproducir; no se encontró registro de Service Worker, por lo que las recetas
  de caché para PWA no aplican. Sí se detectó una discrepancia con el criterio
   vigente: `Sitio.astro` precargaba Unbounded globalmente y la ficha de Abogacía
   pedía esa fuente; el navegador la descargó. `docs/criterios.md` indica que no
   se use. Se quitó su precarga y declaración, y se reemplazaron por Inter los
   usos activos en hojas, marca y páginas. Se actualizó la prueba de fuentes y
   la referencia móvil del calendario afectada por el cambio tipográfico; el
   archivo de fuente se conserva por ahora.
- `legacy-scan`: se contrastaron sus 10 resultados actuales con las rúbricas.
  El del acordeón es real y se conserva por compatibilidad con el objetivo
  Baseline 2022 (ver arriba). Los seis usos de `toSorted()` chocan con ese
  objetivo (ES2023), y el uso sugerido de `Object.groupBy()` con Baseline 2022
  (ES2024): se descartan como modernizaciones obligatorias. Los dos avisos de
  `Error.cause` corresponden a errores de scripts de canary; conservar la causa
  puede ser útil, pero el escáner por sí solo no acredita una pérdida funcional
  ni un defecto de seguridad. Queda registrada la observación, no un hallazgo
  confirmado.

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
| Catálogo y tarjetas | `card`, `content-based-styling`, `size-aware-styling` | Contrastadas: enlaces nativos; sin dependencia de container queries para las tarjetas |
| Movimiento | `motion`, `scroll-entry-exit-effects`, `cross-document-transitions`, `carousel-slide-effects`, `animate-element-entry-exit` | Contrastadas: movimiento reducido presente en componentes puntuales; no se exige scroll-driven ni View Transitions |
| Rendimiento | `performance`, `optimize-preload-priority`, `break-up-long-tasks` | Contraste y trazas de diagnóstico en cuatro rutas; no hay medición de CWV ni de campo |
| Seguridad frontend | `sanitize-untrusted-html`, `trusted-types`, `validate-origins` | Contrastadas: sanitización server-side; no se identificó flujo app de `postMessage` que valide origen ni necesidad concreta de Trusted Types |
| CSS general | `css`, `css-layout` | Contraste dirigido de arquitectura y patrones; queda pendiente validar el `container-type` sin consumidor y no se revisó regla por regla cada hoja |

## Sin contrastar

El resto del catálogo no se revisó guía por guía. CSS y rendimiento se
contrastaron con patrones y rutas seleccionados, no con una revisión de cada
declaración ni con una medición de campo. La cobertura no es una auditoría
integral de todas las guías ni de todas las URLs. `legacy-scan` examina un
subconjunto determinista del catálogo; sus resultados se verificaron con las
rúbricas y con el objetivo Baseline 2022, no se interpretan como diez defectos.

## En revisión

- Falta probar si quitar `container-type: inline-size` de `.ca-materia` conserva
  el layout y repetir la medición con throttling / herramienta que reporte Web
  Vitals. No se recorrieron las 208 guías ni se hizo una auditoría integral de
  las 129 URLs.
- Referencias visuales de la home: quedaron al día. La de escritorio precedía
  a la eliminación de `content-visibility` (`4c72a48`); restituir esa regla en
  una corrida aislada reprodujo la referencia al 0,000 %, pero no se
  reintroduce porque se había retirado por la superposición de tarjetas. La de
  móvil estaba más atrás todavía: mostraba otro diseño del catálogo y del pie.
  Ambas se regeneraron desde la captura real (`712bab5`) y la corrida siguiente
  dio 0,000 % en los dos perfiles con 23 pruebas en verde.
