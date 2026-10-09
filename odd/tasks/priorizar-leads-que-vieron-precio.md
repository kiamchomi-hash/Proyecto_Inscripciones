# Priorizar los leads que ya vieron el precio

## Objetivo

Que el usuario reconozca al instante al lead que escribe sabiendo cuánto sale, y lo atienda primero.

## Problema

Todos los leads de Teclab responden «demasiado caro» al recibir el precio (09/10/2026). El sitio ya muestra el precio antes del contacto (formulario «Ver precio», `tipo_formulario = 'precio'`), así que quien escribe después de verlo ya pasó ese filtro. Hoy nada lo distingue: el aviso de Telegram de su consulta o preinscripción sale igual que el de cualquier otro, y el WhatsApp que manda desde el panel de precio dice lo mismo que el de la ficha.

## Alcance

1. Aviso de Telegram (`supabase/functions/notificar/`): cuando entra una consulta, preinscripción o autoinscripción y el mismo mail ya pidió el precio antes, la cabecera lo marca y el aviso dice de qué carrera y cuándo lo vio.
2. Botón de WhatsApp del resultado de «Ver precio» (`components/index/ver-precio-teclab.tsx`): el mensaje precargado dice que la persona ya vio el precio, para reconocerla en el chat.

Fuera de alcance: cambiar el aviso de «Vio el precio» en sí, el bot de respuestas y los seguimientos.

## Criterios de aceptación

- El aviso marca al lead que vio el precio antes y no marca al que no.
- Si la consulta a la base falla, el aviso sale igual, sin la marca.
- El WhatsApp del panel de precio se distingue del de la ficha.
- `npm run check` en verde.

## Tareas

- [x] T1. Marca en el aviso de Telegram y mensaje de WhatsApp del panel, con tests (ruta: delegada; disparador: 2+ archivos no triviales).
- [ ] T2. Desplegar la Edge Function `notificar` y verificar un aviso real (ruta: inline; requiere confirmación del usuario).

## Verificación

- `node --test tests/avisos.test.mjs`
- `npm run check`

## Progreso

Documento creado el 09/10/2026.

T1 (09/10/2026, delegada):

- RED: `node --test tests/avisos.test.mjs tests/precio-visto.test.mjs` falló (la marca no estaba en el aviso; `precio-visto.ts` no existía).
- GREEN: los mismos 15 tests pasan; `npm run check` en verde (418 tests, 0 errores de lint).
- La búsqueda vive en `supabase/functions/notificar/precio-visto.ts` (pura, con `fetch` por parámetro y tope de 3 s): el último `consultas` con `tipo_formulario = 'precio'` del mismo mail (ILIKE con `_` y `%` escapados), anterior a la fila y distinto de ella. Si falla, devuelve null y el aviso sale sin marca.
- El WhatsApp de «Quiero inscribirme» con el precio vigente a la vista usa `mensajeWhatsAppPrecioVisto`; el del formulario, el de precio vencido y el de «actualizando» no cambian.
- Pendiente: T2 (desplegar `notificar`). Sin commit: lo hace el padre.

