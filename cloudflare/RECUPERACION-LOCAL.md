# Recuperación y DLQ locales (24/10/2026)

Continuación autorizada del wiring local. No se cambió código productivo, esquema
ni configuración de recursos: sólo fixture, pruebas, runner y documentación.

## Qué se prueba de extremo a extremo local

`npm --prefix cloudflare run test:recuperacion` ejecuta ocho pruebas en workerd,
Queues y D1 locales. Wrangler compila `tests/fixtures/worker-recuperacion.ts`, que
importa los mismos `manejarColaLocal`, `manejarProgramadoLocal` y `consumirEfecto`
del entrypoint. No sustituye el SQL ni el broker por mocks. El proveedor externo
**sí es un doble**: intentos y recibos ficticios se guardan en tablas de fixture
D1, en transacciones separadas del estado del outbox.

Se pausa la ejecución en cinco fronteras. `server.update()` cambia la instancia y
termina realmente el proceso workerd con **SIGKILL**: el test captura los procesos
creados por el harness y comprueba la señal, no se limita a lanzar una excepción.
D1 conserva los datos entre recargas; el proceso Node del harness sigue vivo.

- Antes del claim: intención pendiente sin reclamo; scheduled recupera y entrega
  una vez al proveedor ficticio.
- Después del claim, antes del efecto: pendiente con reclamo. Ni cola ni cron lo
  roban. Con evidencia controlada de que no comenzó el proveedor, la prueba hace
  reconciliación manual con token CAS, retira sólo ese reclamo y recupera por cron.
- Durante el efecto: ambiguo con reclamo, sin recibo. Se conserva para revisión;
  ausencia de recibo **no** autoriza reintento ciego ni borrado del reclamo.
- Después del efecto, antes de persistir el resultado: ambiguo y un recibo durable
  ficticio. La reconciliación manual lo confirma enviado y retira el reclamo con
  token, sin volver a llamar al proveedor.
- Después de persistir enviado, antes del ack/finally: enviado y reclamo residual.
  Las reentregas no envían; con el recibo se retira sólo el reclamo residual.

Antes de reconciliar se comprueba que terminó la reentrega de prueba y que el
proceso anterior fue terminado. Se republica explícitamente la referencia después
del SIGKILL: **no se acredita redelivery automático ni durabilidad del broker local
tras una caída**. D1 sigue siendo la autoridad y no pierde silenciosamente la
intención. Esto no prueba pérdida de energía/disco ni caída del proceso Node.

En las pausas antes/durante el efecto, ocho requests HTTP de fixture compiten con
el consumidor de Queues suspendido y el cron usando el mismo consumidor/claim
compilado. No producen otro intento. Es integración concurrente contra D1 real,
**no concurrencia nativa de consumidores Queues**, que el emulador no soporta.

## Reintentos agotados y DLQ

Se inyecta un fallo de D1 antes del claim. Queues local genera los intentos reales
**1, 2, 3, 4**, con el mismo message id, y transfiere el mensaje al nombre de DLQ
configurado. Un consumidor **observador exclusivo del fixture** registra su cuerpo
y message id en D1. El outbox sigue pendiente, sin envío. Tras retirar el fallo,
scheduled lo recupera; un redrive explícito de la referencia de DLQ no duplica la
entrega y no borra la evidencia del fallo.

Se conservan los tres retries de `wrangler.json`; sólo el fixture reduce demora y
batch timeout a cero para no esperar 30 segundos en cada corrida. La configuración
normal no recibe consumidor de DLQ ni cambios de demoras.

## Expiración: límite concreto del emulador

Miniflare instalado **5.20261019.2-beta** mantiene `#messages` en memoria; su broker
no expone ni aplica una política de TTL/retención. Sin consumidor local, descarta
el mensaje aunque el productor responda OK; por eso el test de DLQ necesita un
observador. No se certifica almacenamiento ni retención de DLQ sin ese observador,
y mucho menos los plazos de 24 h/4 días de los planes remotos.

La octava prueba está rotulada **SIMULACIÓN**: el fixture confirma y descarta la
referencia sin ejecutar el efecto. Comprueba intención intacta y recuperación por
scheduled real local, sin confundir expiración con agotamiento de retries. No es
un E2E de vencimiento real ni una prueba acelerada del reloj del broker.

## Aislamiento y pendientes

El runner elimina secretos heredados. El `fetch` saliente del harness se bloquea
para todo destino que no sea loopback, también desde workerd. Una sonda a un
dominio `.invalid` comprueba que el bloqueo se ejecutó antes de permitir las demás
pruebas; ningún escenario de recuperación intenta red externa. Los transportes
Telegram/SMTP/HubSpot/GitHub no se importan ni se instancian.

Pendientes: TTL y retención durable de Queues/DLQ reales (no soportados aquí),
redelivery automático tras caída en plataforma y fallos del proveedor real. No se
autoriza su prueba remota por haber contratado Paid; no se accedió a facturación,
recursos, datos ni producción. No hay garantía exactly-once.

## Resultado de pruebas focalizadas

`npm --prefix cloudflare run test:recuperacion`: **8/8**, sin fallos,
cancelaciones ni skips; repetido después de agregar barreras de finalización antes
de reconciliar. Siete pruebas de integración/E2E local (incluida la sonda de red)
y una simulación explícita de referencia expirada con recuperación local real.

`npm --prefix cloudflare run check`: **131/131**, sin fallos/cancelaciones/skips;
tipos sin errores, advertencias ni hints, build y cinco pruebas Astro compilado
aprobados. Se conserva el aviso experimental de Node al transformar tipos en
`test:materias`. Espacios propios limpios; `git diff --check` global sólo señala
los espacios ajenos ya existentes en `PENDIENTES.md:5,7,10`, que no se modificó.

Durante la construcción del fixture se corrigieron dos supuestos del test, sin
cambiar el código operativo: workerd no permite generar UUID en el scope global
(ahora se inicializa dentro del handler); un rechazo de red del proxy puede llegar
al Worker como respuesta HTTP 500 en vez de excepción. La sonda exige además que
el destino se haya registrado en el bloqueo de Node.

No se repite `npm run check` de Next: esta continuación no cambia el sitio,
módulos compartidos, exclusiones ni sus dependencias. El paquete Cloudflare y sus
pruebas conservan su check independiente.
