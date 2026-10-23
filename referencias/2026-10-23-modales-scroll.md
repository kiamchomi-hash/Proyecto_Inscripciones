# Desbordes y flechas de lectura de los modales

## Evidencia local

- Fuente actual servida con `next dev --hostname 127.0.0.1 --port 3013`.
- Primera portada, Abogacía: a 375 × 550 desbordaba 13 px; a 375 × 560, 7 px; a 375 × 570, 1 px. La foto móvil tenía `flex-shrink-0`, aun siendo decorativa. Ahora conserva su alto preferido cuando entra y puede ceder hasta un mínimo de 6 rem; el caso de 7 px queda en cero sin reducir tipografía.
- El cierre oculto de Abogacía tenía 8 px de desborde a 375 × 667 aunque el último bloque ya estaba dentro. El detector anterior lo marcaba igualmente y no retiraba el atributo que ocultaba su barra.
- Los planes de Siglo 21 ya tenían una exclusión; los de Teclab no. El código no reemplazaba sus botones: agregaba un indicador genérico y ocultaba barras de cualquier descendiente con scroll. No se comprobó una sustitución literal de botones.

## Contrato

Las regiones de lectura se declaran con `data-scroll-lectura`. Planes, índices y navegación propia no participan. El indicador comprueba líneas de texto, imágenes significativas y controles realmente fuera de vista, respetando el recorte de sus antecesores. Un píxel sólo tolera redondeos: no se aplica un umbral para esconder contenido cortado.

Se conservan las barras nativas como respaldo, sin atributos mutables que puedan quedar pegados. ResizeObserver sigue las regiones y sus bloques; mutaciones de texto, imágenes cargadas y fuentes tardías disparan una nueva medición. El cierre usa márgenes automáticos para centrar sólo si sobra espacio y no perder el comienzo al ampliar el texto.

## Fuentes

- Guía instalada de Next.js: `node_modules/next/dist/docs/01-app/03-api-reference/01-directives/use-client.md`.
- `components/index/flechas-de-scroll.tsx`, `components/index/carousel-modal.tsx`, `components/index/teclab-modal.tsx`, `components/index/modales.css`.
- Verificación local con Chromium/Playwright sobre componentes React reales; sin modificaciones de datos remotos.

## Verificación

- RED observado en las cuatro regresiones iniciales antes de implementar; GREEN posterior. Se agregaron dos casos de controles/imágenes significativas y controles ocultos.
- Primera corrida completa: `npm run check`, 532/532 pruebas, lint y tipos aprobados. Corrida final: lint + tipos + 534/534 pruebas aprobadas.
- Portada sin desborde a 1280 × 720, 1366 × 768, 375 × 667, 375 × 812, 812 × 375 y 375 × 560.
- Plan de Siglo 21: botón de año conservado, clic a segundo año mueve el scroll; sin flecha genérica.
- Plan de Teclab desktop: índice propio y barra conservados; sin flecha genérica.
- Fixture local sobre el observador React real: padding sin aviso, contenido tardío con aviso, ocultamiento al final, reaparición al volver arriba y resize de la región sin resize de ventana.
- Texto ampliado al 125 %: contenido largo conserva scroll y el indicador desaparece al llegar al final. Con teclado End llega a scrollTop 305 de 305. Teclab móvil conserva Ver Segundo Año e Inicio; el clic desplaza 261 px. No se observaron errores JavaScript.

## Limitaciones

La CSP de producción bloquea `eval` de depuración de React en `next dev`; Chromium se ejecutó con `bypassCSP: true` sólo para las pruebas locales, sin cambiar la política del sitio. Esto no demuestra comportamiento de la CSP en producción. La base académica se leyó mediante las rutas públicas normales del sitio; no se enviaron formularios ni se modificaron datos.

## Corrección de navegación y superposición (segunda revisión)

- El historial `6d9bffa` ya limitaba el salto de cuatrimestre de Siglo 21 a móvil. `ef3e2fb` no lo eliminó: la prueba anterior comprobó cambio de año, no cambio de período. Teclab no tenía salto de período explícito en el historial consultado.
- Reproducción: en el cierre de Abogacía a 375 × 560, el indicador absoluto intersecaba «Consultar por WhatsApp» en posiciones intermedias de scroll. Las capturas del usuario mostraron la misma falla en el cierre y el precio mostrado de Teclab.
- Solución estructural: el indicador es un botón accesible dentro de un carril hermano de la lectura. En ambos carruseles el carril ocupa sólo la fila del viewport; encabezado, navegación y acciones conservan su ancho completo. No hay padding final para esconder la superposición ni detección especial de WhatsApp.
- El carril se reserva sólo ante lectura desbordada y se conserva al llegar al final, aunque desaparezca el botón. Padding vacío no lo activa. El wrapper usa `overflow: clip`, para que enfocar una acción no desplace horizontalmente todo el layout.
- Los planes tienen selector con año y etiqueta real del período y botón «Siguiente período», en flujo fuera del scroll. El destino se busca en el árbol visible, no en el duplicado móvil oculto. Se conserva el índice anual y se adapta la lista al cambiar entre desktop y móvil.
- Las pruebas de precio mostrado interceptan Turnstile y `POST /api/formularios` sólo en Chromium local. Importes y nota son una fixture explícita, no aranceles publicados ni leads reales. No se cambió el comportamiento de «Ver precio».
- La fuente base del sitio es `clamp(13px, 10px + 0.234vw, 16px)`: en móvil no se deben forzar 16 px como supuesto de tamaño normal. Se separaron base real, ampliación del 125 % y estrés de 20 px.
- RED: tres regresiones estructurales fallaron antes de implementar; GREEN posterior. Se agregó una cuarta regresión para el marco no desplazable por foco. La corrida dentro del sandbox falló en fixtures por `spawnSync git EPERM`; fuera del sandbox la suite anterior pasó completa. El resultado final congelado se registra en el documento de tareas.

### Fuentes de esta revisión

- [Contrato de armazón](../components/index/modal-shell.tsx), carril estructural compartido.
- [Indicador de lectura](../components/index/flechas-de-scroll.tsx), detección y botón accesible.
- [Plan de Siglo 21](../components/index/carousel-modal.tsx) y [plan de Teclab](../components/index/teclab-modal.tsx), destinos visibles e índice anual.
- [Estilos de modales](../components/index/modales.css), reserva de espacio fuera del contenido.
- El grid de los carruseles usa `display: contents` en el wrapper del contenido; ese wrapper debe tener `overflow: visible`, porque carece de caja y no puede recortar la medición a su rectángulo 0 × 0. La caja real del viewport mantiene el recorte. Se reprodujo el indicador ausente y volvió con esta corrección puntual.
- Verificación congelada: `npm run check` aprobó lint, tipos y 538/538 pruebas (64 s de suite). Cambio de año, resize y regreso al plan aprobados en ambos carruseles. Enter desplaza lectura y Tab/Shift+Tab permanecen en el modal. La matriz reforzada queda parcial por un assert de presencia del indicador en Teclab a 375 × 667, para verificación independiente; no se presenta como aprobado completo.
