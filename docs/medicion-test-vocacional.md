# Medición del recorrido vocacional

Los tests general y Teclab comparten un embudo. Hasta el corte a Cloudflare
(27/10/2026) se leía en Vercel Web Analytics; desde entonces esa fuente no
existe y el recorrido se cuenta en D1, en la tabla `vocacional_embudo`
(migración `0014`). Sin eso, cada paso quedaba en memoria del navegador y no
había forma de saber en qué pregunta se caía la gente.

## Qué se guarda y qué no

Se cuentan cuatro pasos, agregados por día, test, evento y posición de la
pregunta:

- `vocacional-iniciado`: la interacción que inicia el intento.
- `vocacional-pregunta`: una pregunta alcanzada, una vez por intento.
- `vocacional-completado`: la última respuesta confirmada.
- `vocacional-salida`: salida observable de un intento incompleto.

`vocacional-retroceso`, `vocacional-reiniciado` y `vocacional-cta` **no** se
cuentan en la base: los dos primeros no ayudan a ubicar la caída y la CTA ya se
mide como clic en otras tablas. Quedan en la cola del navegador, igual que
antes.

Nunca viaja la respuesta elegida, el perfil vocacional, la carrera recomendada
ni ningún dato de la persona. La IP no se guarda: se usa como hash para el cupo
(240 eventos cada 10 minutos) y se descarta.

## Leer el embudo

`npm run leads` trae una sección «Test vocacional» con iniciados, completados,
salidas y cuántos alcanzaron cada pregunta, por test. La consulta directa sobre
la base es la misma que usa ese informe:

```sql
SELECT test, evento, pregunta, sum(veces) AS veces
FROM vocacional_embudo
WHERE fecha BETWEEN '2026-11-06' AND '2026-11-20'
GROUP BY test, evento, pregunta
ORDER BY test, evento, pregunta;
```

| Evento | Qué representa |
|---|---|
| `vocacional-iniciado` | Interacción que inicia el intento |
| `vocacional-pregunta` | Pregunta alcanzada, una vez por intento |
| `vocacional-completado` | Última respuesta confirmada, una vez por intento |
| `vocacional-salida` | Salida observable de un intento iniciado e incompleto |
| `vocacional-retroceso` | Volver a la pregunta anterior · sólo navegador |
| `vocacional-reiniciado` | Empezar nuevamente · sólo navegador |
| `vocacional-cta` | Clic categorizado · sólo navegador, ya se mide como clic |

`pregunta` es la posición visible, desde 1; en la base no se guardan
`respondidas` ni `total`. Un retroceso reduce las respondidas, pero no vuelve a
contar una pregunta ya alcanzada. En Teclab la primera respuesta registra
también la primera pregunta: es una pregunta alcanzada con interacción, no una
impresión pasiva. El test general inicia al pulsar «Empezar»; una visita sin
interacción no inicia un intento.

## Interpretación y límites

La caída entre preguntas sugiere dónde revisar el recorrido; no demuestra por
qué alguien interrumpió. Los agregados cuentan intentos e interacciones, no
usuarios únicos, y no permiten seguir personas entre visitas: no hay
identificadores persistentes ni eventos correlacionados.

Una salida usa `pagehide` o el desmontaje por navegación SPA, deduplicados. No
se registra al ocultar una pestaña. Una navegación con BFCache (`persisted`)
conserva el intento y no cuenta como salida; al restaurarlo no duplica inicio ni
finalización. StrictMode invalida la limpieza simulada inmediata. Una salida
registrada no significa abandono irreversible: la persona puede volver. Un
cierre abrupto, bloqueo del script o pérdida de conectividad puede impedir el
envío; la resta inicio menos finalización **no es una tasa exacta de abandono**.

## Privacidad y comprobación local

El controlador sólo acepta contadores y categorías; no recibe respuestas,
nombres, correos, teléfonos, puntajes, perfiles, querystrings ni textos de
WhatsApp. El emisor reconstruye los campos permitidos. El servidor valida la
lista cerrada de pasos, el test y la posición antes de escribir.

Ejecutar `node --test tests/vocacional-analytics.test.mjs` y, en `cloudflare/`,
`node --test tests/vocacional-embudo.test.mjs` (o `npm run probar telemetria`);
después, `npm run check` en la raíz. Las pruebas usan emisores y ventanas
locales falsos, sin llamadas de analytics reales. No probar `track()` en
producción: un evento de prueba ensucia lo que después se mide.

Implementación: [controlador](../lib/vocacional-analytics.ts),
[hook](../components/test-vocacional/use-analytics-vocacional.ts),
[contador](../cloudflare/src/datos/vocacional-embudo.ts),
[pruebas](../tests/vocacional-analytics.test.mjs).
