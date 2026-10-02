# Detalle de pendientes abiertos

Reorganizado y depurado el 30/09/2026. Los cierres y reformulaciones indican su evidencia; las demás fechas, cifras y versiones conservan el registro original y no confirman su vigencia. Ante contradicciones, comprobar el estado actual y consultar [los criterios de trabajo](criterios.md).

[Volver a los pendientes](../PENDIENTES.md).

Actualizado el 30/09/2026 con evidencia de cierre y correcciones de referencias obsoletas. Para revisar la lista rápida, usar `PENDIENTES.md`; al cerrar una tarea, trasladar su bloque y evidencia al historial.

## pendiente-02

**Remedido el 30/09/2026: siguen tres apariciones.** Medición realizada, anomalía no corregida. Next local sigue en 16.3.3; repetir al actualizarlo. [Evidencia y límites](medicion-css-home-2026-09-30.md), [rutinas](rutinas.md#css-de-la-home-al-actualizar-next). Se conserva debajo el contexto anterior.

- [ ] **La hoja de estilos viaja tres veces en el HTML de la home, y la documentación de Next promete dos.** Medido el 28/08/2026 sobre producción, con Next **16.3.0**.

  **Esta entrada absorbe la que preguntaba "qué infló la home".** Esa decía que el 09/08/2026 `npm run smoke` había medido **961 KB sin comprimir (126 KB en el cable)** contra los 449 KB de la medición del A/B de `inlineCss`, que había "más que duplicado" y que había que averiguar la causa antes de tocar nada. La trayectoria completa es **449 KB (A/B de inlineCss) → 961 KB (09/08) → 620 KB (28/08)**: bajó un 35% desde el pico sin que nadie fuera a buscarlo, y en el cable pasó de 126 a 62 KB, la mitad. Así que la alarma de agosto ya no aplica y la causa está identificada — es la que sigue.

  Los 621,4 KB sin comprimir se reparten así:

  | Parte | Peso |
  |---|---|
  | `<style>` inline | 144,6 KB |
  | dos `<script>` del payload RSC que llevan CSS adentro | 264,4 KB |
  | resto del payload RSC (datos, manifiestos) | 86,3 KB |
  | markup | 126,0 KB |

  O sea que **el 66% de la home es CSS**. Los datos de las 88 carreras, que es lo primero que uno sospecha, son apenas ~29 KB.

  Dos copias son esperadas y están documentadas: `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/inlineCss.md` dice *"Styles are duplicated during initial page load — once within `<style>` tags for SSR and once in the RSC payload"*. La tercera no está documentada. Se verificó contando el arranque propio de la hoja, `:root{--cau-brand-teal`, que aparece **tres** veces en el HTML, igual que `@layer base`, `@layer theme` y `@layer utilities` — o sea tres copias completas, no una partida entre dos `push`.

  **No es para apagar `inlineCss`.** Eso ya se midió A/B y gana encendido (ver `docs/criterios.md`); el problema es la copia de más, no el inlining. Lo que corresponde es **volver a medir cuando se actualice Next** y ver si la tercera copia desapareció.

  **Cómo medirlo de nuevo**, para que el número sea comparable:

  ```bash
  curl -s -H "Accept-Encoding: identity" https://www.siglo21sur.com/ -o home.html
  grep -o ':root{--cau-brand-teal' home.html | wc -l    # cuántas copias hay
  ```

  Y para el peso por parte, contar el tamaño de cada `<style>` y de cada `<script>` según contenga o no `@layer base`. Ojo con dos trampas en las que ya caí: medir sobre el HTML escapado da números que no cierran (hay que desescapar el payload con `JSON.parse` de cada `self.__next_f.push`), y un regex con cuantificador grande se come miles de caracteres y reparte mal el peso.

  **Lo que cuesta hoy es chico y por eso no urge**: tres copias idénticas comprimen casi como una. Sacando las dos del payload y comprimiendo con la misma calidad, 52,5 KB → 43,8 KB, unos **8,6 KB sobre los 62 KB** que mide `npm run smoke` contra prod. Lo que sí importa es el efecto multiplicador: **cada KB que se agregue a la hoja de estilos cuesta 3 KB de HTML**, y eso es lo que hace que el peso de la página se mueva tanto — en los dos sentidos. Explica el salto a los 961 KB del 09/08 y también la baja a 620 sin que nadie tocara nada a propósito: con la hoja pesando el 66% de la página y triplicada, cualquier cambio en el CSS mueve el total tres veces más de lo que uno espera.

  Ojo: `npm run smoke` imprime el peso pero **no lo puede reprobar** — no hay umbral en `herramientas/smoke.mjs`, así que un "todo verde" no dice nada sobre esto.

  **Remedido el 05/09/2026 con Next 16.3.3:** siguen las tres copias. El build local de producción dio 626,4 KiB de HTML y 105,0 KiB gzip. Tres corridas móviles (390×844, CPU 4x, latencia 150 ms, descarga 1,6 Mbps, caché deshabilitada) dieron LCP de 1.584/2.120/2.052 ms y CLS acumulado observado de 0,000039/0/0. Son medidas locales, no de usuarios reales ni comparables directamente con Brotli en Vercel. Se mantuvo `inlineCss`; no se parcheó el framework. Evidencia y límites en `docs/correcciones-auditoria-2026-09-05.md`.

## pendiente-07

Retirado de acciones abiertas el 30/09/2026. Ver [historial y decisión de alcance](historial-pendientes.md).

## pendiente-08

- [ ] **Confirmar medios de pago del curso de IA de Teclab.** Las fechas, el PDF con módulos y un arancel individual fechado ya tienen evidencia; no corresponde volver a pedir un temario inexistente. [Revisión y fuentes del 30/09/2026](curso-ia-teclab-2026-09-30.md).

  Próxima edición: 13/10/2026, venta hasta 12/10. La duración anunciada es cuatro semanas; el calendario registra el período hasta 16/11 y no las fechas de cada encuentro. Si hace falta publicar horarios, confirmar ese cronograma aparte.

  El simulador registró el 30/09 a las 17:55 UTC un total individual de $55.000, matrícula de $220.000 con 75% de descuento, promoción válida hasta el 30/09 y beneficio sujeto a aprobación de Teclab. Ya está en la base comercial local y conserva esa fecha de vencimiento; no fijarlo como permanente ni extender la vigencia. La financiación específica sigue sin confirmación.

  Las imágenes curso-ia.webp y curso-ia-cierre.webp fueron reemplazadas localmente el 30/09 con la ilustración generada que aportó el usuario. No son material oficial ni fotografías documentales de Teclab. Assets publicados y verificados el 30/09/2026; los medios de pago siguen pendientes.

  El plan, si después se actualiza la ficha, conserva el formato de viñetas de Teclab - Curso; no usar el formato por cuatrimestres de las tecnicaturas. Esta revisión no actualizó la base ni el corpus.

## pendiente-09

Cerrado el 30/09/2026: página oficial verificada y mapa local completado. Ver [evidencia y límites](enlace-responsabilidad-social-2026-09-30.md) y [historial](historial-pendientes.md#responsabilidad-social-2026-09-30).

## pendiente-10

Cerrado el 30/09/2026: respuesta corregida y ambas páginas regeneradas. Ver [evidencia](respuesta-identidad-extranjero-2026-09-30.md) y [historial](historial-pendientes.md#extranjero-identidad-2026-09-30).

## pendiente-11

- [ ] **Dudas institucionales que aún requieren revisión de fuentes**, que hoy el bot responde con un "lo confirmo y te aviso" en vez de inventar:

  1. **Inicio de cursado ED/EDH 2B resuelto el 01/10/2026:** 05/10/2026, ya implementado en el bot. Inscripción a materias hasta 18/10/2026; no es un cierre comercial de admisión. El calendario no confirma cupos ni apertura de cada carrera. [Evidencia en el historial](historial-pendientes.md#inicio-ed-edh-2b-2026).
  2. Si hay **becas reales** más allá del descuento por beneficio. Se mencionan programas para situaciones vulnerables y por rendimiento, sin confirmar.
  3. Las condiciones para **cursar dos carreras a la vez** (hay requisitos de avance académico).
  4. ~~El **módulo general de requisitos y legajo** del KB (`requisitos.md`) sigue sin escribirse.~~ Escrito el 08/08/2026 contra el reglamento en vivo. Lo que quedó sin fuente está listado adentro: qué es la IVU en la práctica, qué materias son Universitario 21, dónde se certifica la firma y cómo se legaliza el analítico.

## pendiente-13

Retirado de acciones abiertas el 30/09/2026. Ver [historial y decisión de alcance](historial-pendientes.md).

## pendiente-14

Retirado de acciones abiertas el 30/09/2026. Ver [historial y decisión de alcance](historial-pendientes.md).

## pendiente-16

- [ ] **Revisar el video institucional contra la oferta y el destino vigentes antes de publicarlo.** Identidad Argentina salió del catálogo y de los selectores de la home el 07/09/2026; sus páginas y enlaces siguen publicados. La decisión vigente es migrar su oferta a otro sitio, no esperar que entre en main.

  Según el registro del video, Identidad aparece en P02-oferta y P07-identidad. Revisar esas partes y el destino al que envían antes de publicar. No se da por terminado ni se edita el video en esta limpieza.

  El proyecto actual vive en contenidos/cau/remotion/cau-villa-lugano/, fuera del versionado de este repo, según [los criterios vigentes](criterios.md#el-video-institucional-está-fuera-del-repo). Las instrucciones y duración del render antiguo se conservan en [el historial](historial-pendientes.md#registro-anterior-pendiente-16); no ejecutar esos cortes sin revisar primero el guion actual.

