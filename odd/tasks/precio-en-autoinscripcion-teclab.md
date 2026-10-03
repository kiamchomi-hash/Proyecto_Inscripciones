# Precio en la autoinscripción de Teclab (pendiente 34)

## Objetivo

Quien llega a la autoinscripción por la entrada normal (preinscripción en la ficha de una carrera de Teclab, y después «Inscribirme») ve el precio vigente antes de inscribirse, igual que en «Ver precio»: tabla de conceptos, total, qué cubre el pago, vigencia y financiación plegada.

## Decisión (usuario, 03/10/2026)

La preinscripción de Teclab (`kind: 'consulta'`, casa teclab, `tipoFormulario: 'preinscripcion'`, carrera de Teclab en la base) pasa a devolver el resultado del precio, como «Ver precio». Respeta la regla de `odd/tasks/ver-precio-teclab.md`: el precio se entrega recién después de registrar el lead. No se registra un segundo lead. Contacto, Siglo 21, Identidad y una carrera de otra casa siguen respondiendo sólo `{ ok: true }` sin leer `precios_privados`.

## Fuera de alcance

La entrada directa (`?inscripcion=auto`, desde «Inscribite ya» de «Ver precio»): la persona ya vio el precio.

## Tareas

- [x] T1. Endpoint: la preinscripción de Teclab devuelve `estado` y, si está vigente, `precio` (misma forma que `kind: 'precio'`). Test de `tests/ver-precio.test.mjs` ajustado. Ruta: delegada (writer).
- [x] T2. UI: el paso «Inscribirme» de `formulario-lead.tsx` muestra el precio con el mismo bloque que «Ver precio» (componente compartido), con la aclaración de cobertura y la duración. Vencido o sin precio: no se muestra nada nuevo. Ruta: delegada (mismo writer).

## Checks

`npm run check`; prueba en el navegador del paso «Inscribirme» con la respuesta simulada.

## Progreso

- 03/10/2026: documento creado; T1 y T2 delegadas a un writer.
- 03/10/2026: T1 y T2 hechas por el writer delegado. T1: RED observado (`node --test tests/ver-precio.test.mjs`: 14 pass, 2 fail, vigente y vencido), GREEN 16/16. El endpoint verifica la carrera con `buscarCarreraConPrecio()` (compartida con «Ver precio») y lee el precio en `precioDePreinscripcion()` sólo con casa teclab y modo preinscripción; si la verificación falla, responde `{ ok: true }`. T2: `DetallePrecio` exportado de `ver-precio-teclab.tsx`; `PasoInscribirme` recibe `detalle` y lo pinta arriba de «Inscribirme», dentro de `.vp-en-formulario` (acento del formulario). `npm run lint` 0 errores (27 warnings previos), `npm run typecheck` ok, `npm test` 288/288. Pendiente: la prueba en el navegador (padre), y la duración no llega desde la ficha ni desde `/carreras/[slug]/inscripcion` (pasan sólo id, nombre y nivel), así que ahí la aclaración no cuenta cuatrimestres.
- 03/10/2026 (parent): `node --test tests/ver-precio.test.mjs` 16/16. `duracion` sumada a las opciones del formulario en `/carreras/[slug]` y `/carreras/[slug]/inscripcion` (`CarreraOpcion` la acepta opcional). Prueba en Playwright (390x844) en la ficha de Programación, con fetch y captcha simulados: un solo pedido `consulta` y el paso «Inscribirme» muestra tabla, total, aclaración con 4 cuatrimestres, vigencia y financiación plegada.
- 03/10/2026 (parent, pedido del usuario): el precio pasa a ser un paso propio del carrusel (datos → precio → «Inscribirme» → confirmación) con `PasoPrecio` («Continuar» / «Ahora no»); sin precio vigente el paso no está en la pista. `panelesRef` por nombre de paso. El pie de «Inscribirme» aparece sólo con un aviso (vacío era una franja oscura). Verificado en Playwright 390x844: un pedido `consulta`, paso «El precio de tu carrera» y después «Inscribirme» sin franja.
- 03/10/2026 (parent, pedido del usuario): «Ahora no» ya no vuelve al panel de datos (el formulario largo dejaba el cartel de «Preinscripción enviada» en un espacio gigante): la tarjeta se queda en el paso y la ventana del carrusel baja a 11rem con el cartel; los paneles quedan `inert` debajo. Playwright 390x844: tarjeta de ~1300 px a 201 px; «Enviar otra» reinicia el formulario.
