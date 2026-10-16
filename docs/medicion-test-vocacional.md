# Medición del recorrido vocacional

Los tests general y Teclab comparten un embudo en Vercel Web Analytics. Los eventos distinguen `test: general|teclab`, sin respuestas ni perfiles vocacionales. No se enviaron eventos de prueba a producción.

## Leer el embudo

Filtrar por `test` y el mismo período. El test general inicia al pulsar «Empezar»; Teclab inicia con la primera respuesta, porque muestra la primera pregunta directamente. Una visita sin interacción no inicia un intento.

| Evento | Qué representa |
|---|---|
| `vocacional-iniciado` | Interacción que inicia el intento |
| `vocacional-pregunta` | Pregunta alcanzada, una vez por intento |
| `vocacional-retroceso` | Volver a la pregunta anterior |
| `vocacional-completado` | Última respuesta confirmada, una vez por intento |
| `vocacional-reiniciado` | Pulsar el botón para empezar nuevamente |
| `vocacional-salida` | Salida observable de un intento iniciado e incompleto |
| `vocacional-cta` | Clic categorizado como carrera, inscripción, WhatsApp, oferta o inicio |

`pregunta` es la posición visible, desde 1; `respondidas` es la cantidad confirmada en el recorrido actual y `total` el número de preguntas. Al completar, `pregunta` permanece en la última posición. Un retroceso reduce `respondidas`, pero no vuelve a contar una pregunta ya alcanzada. En Teclab la primera respuesta registra también la primera pregunta: es una pregunta alcanzada con interacción, no una impresión pasiva.

Las CTA incorporan sólo `destino` y `etapa: preguntas|resultado`, no la carrera ni el enlace. WhatsApp conserva su evento global `whatsapp`; `vocacional-cta` sólo describe el contexto del test y **no debe sumarse como otro lead**.

## Interpretación y límites

La caída entre preguntas sugiere dónde revisar el recorrido; no demuestra por qué alguien interrumpió ni permite seguir personas entre visitas. Los agregados cuentan intentos e interacciones, no usuarios únicos. Un reinicio abre otro intento cuando hay nueva interacción. No se guardan identificadores persistentes ni se correlacionan eventos individuales.

Una salida usa `pagehide` o el desmontaje por navegación SPA, deduplicados. No se registra al ocultar una pestaña. Una navegación con BFCache (`persisted`) conserva el intento y no cuenta como salida; al restaurarlo no duplica inicio ni finalización. StrictMode invalida la limpieza simulada inmediata. Una salida registrada no significa abandono irreversible: la persona puede volver. Un cierre abrupto, bloqueo del script o pérdida de conectividad puede impedir el envío; la resta inicio menos finalización **no es una tasa exacta de abandono**.

## Privacidad y comprobación local

El controlador sólo acepta contadores y categorías; no recibe respuestas, nombres, correos, teléfonos, puntajes, perfiles, querystrings ni textos de WhatsApp. El emisor reconstruye los campos permitidos. No hay almacenamiento persistente, endpoints, base de datos ni avisos de Telegram nuevos. Una excepción del emisor se descarta sin afectar el test.

Ejecutar `node --test tests/vocacional-analytics.test.mjs` y `npm run check`. Las pruebas usan emisores y ventanas locales falsos, sin llamadas de analytics reales. No probar `track()` en producción: los eventos no se pueden borrar individualmente.

Implementación: [controlador](../lib/vocacional-analytics.ts), [hook](../components/test-vocacional/use-analytics-vocacional.ts), [pruebas](../tests/vocacional-analytics.test.mjs).
