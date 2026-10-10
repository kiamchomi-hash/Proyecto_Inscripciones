# Preinscripción de carreras «Próximamente»

## Objetivo

Las carreras con `proximamente = true` (hoy las cinco nuevas de Teclab) aceptan la
preinscripción: el lead llena el formulario de preinscripción, la fila entra en
`consultas` y el trigger `on_consulta_insert` avisa por Telegram. Nada más.

## Problema

- `opcionesDelModo` (`components/index/types.ts`) saca las `proximamente` del
  formulario de preinscripción, y el modal de Teclab las manda al de contacto.
- Si entraran tal cual a la preinscripción de Teclab, el flujo seguiría con el
  precio, el pase, «Inscribirme», el alta en HubSpot y el robot del portal: esas
  carreras todavía no están cargadas en Teclab y fallaría.

## Alcance

- Preinscripción de una `proximamente`: guarda la consulta (aviso por Telegram) y
  termina en una confirmación simple. Sin precio, sin mail de precio, sin pase,
  sin autoinscripción, sin HubSpot, sin robot.
- El servidor rechaza la autoinscripción y el enlace para una `proximamente`
  aunque el pedido llegue armado a mano.
- Fuera: precio, fecha de inicio, HubSpot y folletos de esas carreras (siguen en
  `docs/alta-de-carrera.md` cuando Teclab las habilite).

## Criterios de aceptación

- Las `proximamente` aparecen en el select de preinscripción.
- El modal y la ficha de una `proximamente` llevan a la preinscripción.
- Enviar la preinscripción de una `proximamente` no emite pase, no lee precio,
  no manda mail y no pasa a los pasos de precio ni de «Inscribirme».
- `kind: 'autoinscripcion'` y `kind: 'enlace'` con una `proximamente` → 400.
- `npm run check` en verde.

## Tareas

- [x] T1 Servidor: sin precio, mail ni pase para una `proximamente`; autoinscripción
  y enlace rechazados. Tests.
- [x] T2 Cliente: la preinscripción las ofrece y termina en la confirmación simple;
  modal y ficha llevan al formulario de preinscripción. Tests.

## Ruta

Delegada a un solo escritor: toca 4 o más archivos no triviales (endpoint,
formulario, modal, tipos y tests).

## Progreso

- 10/10/2026: documento creado. El usuario confirmó que las cinco carreras de
  Teclab todavía no están habilitadas y que sólo hace falta recibir la
  preinscripción por Telegram.
- 10/10/2026: T1 hecha y T2 casi. `carreraConPrecio` y `carreraConAutoinscripcion`
  descartan las `proximamente`; las cuatro lecturas de `carreras` del endpoint que
  deciden precio, pase o autoinscripción traen `proximamente`. Se sacó
  `opcionesDelModo` (los dos formularios reciben las mismas carreras), el
  formulario no toma como `conAutoinscripcion` a una anunciada (termina en
  «Preinscripción enviada») y la ficha manda a `#preinscripcion`. Las páginas de
  inscripción dedicadas siguen sin ofrecerlas. RED observado en 7 tests de
  `tests/preinscripcion-proximamente.test.mjs` y el actualizado de
  `teclab-proximamente`; GREEN con lint (0 errores), typecheck y `npm test`
  (425/425). Pendiente de T2: el modal de Teclab (`destinoFormulario` y `avisar`
  siguen yendo a `#formulario`), porque `tests/inscripcion-enfocada.test.mjs`
  afirma ese literal y no estaba en la superficie autorizada.
- 10/10/2026: T2 cerrada en el padre (inline, dos archivos mecánicos). El modal
  manda «Preinscribite» y el slide de cierre a `#preinscripcion`;
  `tests/inscripcion-enfocada.test.mjs` afirma el destino nuevo. `npm run lint`
  0 errores (28 avisos previos), `npm run typecheck` limpio, `npm test` 425/425.
  Abierto, a decidir por el usuario: el aviso de Telegram de toda preinscripción
  de Teclab suma un enlace de inscripción (`supabase/functions/notificar/enlace.ts`),
  que para una anunciada no sirve hasta que se habilite.
