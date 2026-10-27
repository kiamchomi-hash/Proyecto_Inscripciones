# Queues y cron locales (24/10/2026)

## ¿Hace falta Workers Paid?

**No para desarrollar ni por usar Queues/D1/cron.** No contratar nada en esta etapa.
Para el corte, recomendar Paid si se conserva el tamaño actual del barrido:
la regresión de presupuesto cuenta **103 consultas D1 en una invocación de 20
pendientes sin transporte**. Free admite 50; Paid, 1000. No depende del volumen
mensual: un único lote lleno basta para superar Free. Alternativa antes del corte:
reducir lotes o agrupar consultas en `batch()`, volver a contar y medir CPU.
El harness local no impone ni certifica los límites del plan remoto.

- Workers Free: 100.000 requests/día, 10 ms de CPU por invocación HTTP/cron,
  5 cron triggers por cuenta. El cron de cinco minutos ocupa uno, 288 invocaciones
  por día; no implica por sí mismo suscripción. Esperas de red/D1 no son CPU.
- Astro SSR/React/HMAC/preparación de mails pueden necesitar más CPU: **no hay
  mediciones representativas ni paridad de páginas aún**. No afirmar que Free
  alcanza por haber compilado, ni que SSR siempre obliga a pagar.
- Assets estáticos: solicitudes gratuitas sin límite, hasta 20.000 archivos en Free
  y 25 MiB por archivo. No se inventarió aquí el futuro contenido migrado; los
  recursos grandes/R2 se evalúan aparte. No se activó Images ni sesiones/KV.
- Queues Free: 10.000 operaciones/día, retención fija 24 h; un mensaje pequeño
  exitoso normalmente usa tres operaciones y cada reintento agrega lecturas.
  Paid incluye un millón/mes y retención configurable hasta 14 días (4 por defecto).
  El outbox conserva la intención aunque el mensaje expire; no rescata automáticamente
  resultados ambiguos. Contar intenciones, no confundirlas con formularios.
- D1 Free: 5 millones de filas leídas/día, 100.000 escritas/día, 5 GB por cuenta,
  **500 MB por base**, Time Travel 7 días. Paid: hasta 10 GB por base y 30 días;
  lectura/escritura e índices también cuentan. Falta medir tamaño/consumo reales.
- Paid tiene base de **USD 5/mes por cuenta**, no precio final garantizado:
  incluye 10 millones de requests y 30 millones de ms CPU/mes; los excesos y otros
  productos se suman. No se verificó facturación de ninguna cuenta ni ahorro real.

Fuentes oficiales: [Workers precios](https://developers.cloudflare.com/workers/platform/pricing/),
[límites](https://developers.cloudflare.com/workers/platform/limits/),
[Queues](https://developers.cloudflare.com/queues/platform/pricing/),
[D1 precios](https://developers.cloudflare.com/d1/platform/pricing/) y
[D1 límites](https://developers.cloudflare.com/d1/platform/limits/).

## Wiring y seguridad

`src/worker.ts` delega HTTP a `handle` de `@astrojs/cloudflare/handler` (API instalada
14.4.2); conecta `queue` y `scheduled` a `operativa/programados.ts`. El runtime pasa
`EFECTOS` a formularios y al POST del robot; sólo publica ids confirmados después
del batch. Un fallo de publicación no convierte el alta confirmada en un error.

Wrangler declara DB ficticia `remote:false`, productor/consumidor `cau-efectos-local`,
DLQ `cau-efectos-dlq-local`, lote de 10, tres reintentos con demora de 10 s y cron
`*/5 * * * *` UTC. Ninguno fue creado remotamente. La DLQ no tiene consumidor
automático: D1 sigue siendo la autoridad. El cron local se invoca explícitamente
desde el harness; el servidor local **no lo ejecuta automáticamente cada cinco minutos**.

Sin `APP_STAGE=local`, DB o EFECTOS, los handlers operativos fallan cerrados; cola
ajena/cron distinto se rechazan. HTTP sin binding/configuración también conserva
503. El entrypoint **no construye transportes externos ni lee sus secretos**:
newsletter/robot-encolar pueden operar sólo en D1; Telegram/SMTP/HubSpot/GitHub quedan
pendientes. Los tests de envíos inyectan dobles, no transportes de red.

## Concurrencia, interrupciones y recuperación

`0008.sql` agrega un reclamo único por efecto y un cursor durable. El reclamo se
adquiere atómicamente antes de preparar, reservar mail o enviar. Cron y cola usan
el mismo camino. El cursor rota lotes de hasta 20 entre invocaciones: los pendientes
sin transporte no impiden alcanzar intenciones posteriores.

Antes de llamar a un proveedor se persiste `ambiguo/envio-en-curso`; éxito confirmado
pasa a enviado, rechazo conocido a error y falta explícita de configuración vuelve
a pendiente. Cualquier excepción inesperada del transporte es ambigua. Si falla
guardar el resultado después del envío, queda ambiguo y conserva el reclamo. No
hay lease con robo/expiración ni promesa de exactly-once.

Un isolate muerto antes del envío puede dejar pendiente con reclamo. Se sacrifica
reintento automático por seguridad: no se puede distinguir de una interrupción
posterior sin evidencia. Recuperación **manual y local**, con consumidores detenidos:
inspeccionar estado/reclamo y evidencia del proveedor; no borrar reclamos ni resetear
ambiguos a ciegas. Sólo si se prueba que no hubo envío, retirar ese reclamo concreto
y corregir el estado; ante incertidumbre conservarlo para reconciliación. No hay
endpoint público para hacerlo. `reintentar()` sigue aceptando sólo error conocido.

Caídas reales de workerd y transferencia a DLQ se prueban en el harness local:
[evidencia y límites](RECUPERACION-LOCAL.md). La expiración se simula porque el
broker instalado no implementa TTL. Siguen pendientes retención/redelivery remotos
y límites/CPU autorizados. Esto no migra R2 ni acredita
entrega externa, recuperación completa, robot del portal, producción o paridad UI.
El GET del robot sigue siendo una lectura sin claim del trabajo del portal: el
reclamo nuevo protege la intención del outbox, no la ejecución remota del robot.

## Verificación

Continuación de recuperación: `npm --prefix cloudflare run check` **131/131**,
tipos/build/runtime aprobados; `test:recuperacion` **8/8**. E2E local, simulaciones
y pendientes del emulador se distinguen en [RECUPERACION-LOCAL.md](RECUPERACION-LOCAL.md).
Los resultados que siguen corresponden al incremento de wiring anterior.

- Cierre 4A (25/10/2026): `npm --prefix cloudflare run check` **156/156**, sin
  fallos/skips; `test:paridad` **3/3**, `test:navegador` **14/14** y `test:e2e`
  **8/8** sobre el Playwright de la raíz. Detalle, tolerancias y límites en
  [LEER.md](LEER.md).

- `npm --prefix cloudflare run check`: **123/123**, sin fallos/cancelaciones/skips;
  tipos sin errores/advertencias/hints, build y cinco pruebas de runtime aprobados.
- `npm --prefix cloudflare run test:envios`: suites anteriores y nueve regresiones
  nuevas; la corrida completa final incluye **28/28**. Dobles de transporte y D1
  local, sin credenciales ni llamadas externas.
- `npm --prefix cloudflare run build && npm --prefix cloudflare run test:runtime`:
  **5/5**; productor EFECTOS real emulado, queue/scheduled compilados, publicación
  desde HTTP con token de prueba local y sin cron como vía alternativa.
- `npm run check`: **543/543**, sin fallos/skips; 20 advertencias ESLint y aviso
  React de `prefetch` preexistentes. No se hizo build Next ni acceso a Supabase.
- `git diff --check` global sigue señalando espacios ajenos en `PENDIENTES.md:5,7,10`.
  Los archivos propios se revisan con `git diff --no-index --check` al ser no
  trackeados; sin errores de espacios.

Rojo inicial: concurrencia 13 llamadas en vez de una, excepción inesperada
clasificada como error y barrido que nunca llegaba a la fila 26. Durante la
integración se corrigieron tres tipos y el conteo de ocho migraciones. Un test
previo detectó que omitir la preparación sin transporte cambiaba `omitido` por
`sin-transporte`: se restauró el contrato y se difirió sólo la reserva del correo
hasta disponer de datos y puerto. La corrida completa final está verde.
