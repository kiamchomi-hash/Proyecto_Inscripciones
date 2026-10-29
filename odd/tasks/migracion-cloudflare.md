# Migración completa a Cloudflare

## Alcance aprobado el 24/10/2026

Reemplazar Next/Vercel/Supabase por Astro + React + Workers + D1/R2.
Primera entrega: documentación y base local; continuaciones aprobadas: lote 2A
(catálogo/precios/reserva), 2B (rate limit/contadores) y 2C (enlaces/robot), sólo con fixtures
sintéticos. Sin delegación,
worktree, ramas, commit/push, deploy, DNS, facturación, recursos remotos ni
escrituras a Supabase. Cambios ajenos preservados; no se exploró `contenidos/`.
La aprobación de la migración completa y el gate previo al corte constan en
`docs/criterios.md`; producción no cambia durante estas pruebas locales.

- Diseño aprobado.
- Plan por bloques.
- [Fuentes](../../referencias/2026-10-24-migracion-cloudflare.md).

## Primer incremento

- [x] Diseño y plan guardados; skills writing-plans y executing-plans aplicadas.
- [x] Base independiente `cloudflare/`: Astro/React configurado, SSR workerd,
  endpoint técnico, home/404 vacíos y guardas locales noindex/no-store.
- [x] Runner sin herencia de secretos/dotenv, sin comandos de publicación ni
  recursos remotos. Dependencias y lockfile propios, excluidos del check Next.
- [x] Rojo inicial de guardas por módulo no implementado; luego verde.
- [x] Check Cloudflare con centinelas ficticias en el entorno padre: 5/5 guardas,
  tipos sin errores/advertencias/hints, build y 3/3 pruebas sobre workerd.
  Verificados home/API/404, rechazo de rutas de configuración, ausencia de
  centinelas en runtime/artefactos y override runtime que devuelve 503 sin rebuild.
- [x] Repetido desde `npm ci --ignore-scripts --no-audit --no-fund`: instalación
  reproducible, tipos/build y 8/8 pruebas aprobados nuevamente.
- [x] Línea base Next antes de cambios: `npm run check`, 542/542 pruebas, sin fallos
  ni skips. Advertencias previas de lint/React no fueron corregidas aquí.
- [x] Check Next posterior: 542/542, sin fallos ni skips; mismas 20 advertencias
  de ESLint y advertencia React de `prefetch` que en la línea base.
- [x] Diff propio de configuración sin errores de espacios; dependencias,
  artefactos y tipos generados ignorados. `package.json`/lockfile de Next intactos.
  El `git diff --check` global ya detectaba espacios ajenos en
  `PENDIENTES.md:5,7,10`; no se modificó ese archivo.
- [x] 18 archivos nuevos propios revisados sin espacios finales ni rutas de la
  máquina; cambios a archivos existentes limitados a tres líneas de exclusión.

Primer fallo de implementación corregido: el runner apuntaba a `astro/astro.js`;
el `bin` de Astro 7 está en `bin/astro.mjs`. Se corrigió la ruta y se agregó prueba
de existencia de los ejecutables. No era un problema de cuota ni de credenciales.

## Lote 2A: catálogo, precio privado y reserva de correo

- [x] Esquema parcial `cloudflare/migrations/0001.sql`: tres tablas STRICT, 23
  campos de carrera, JSON validado, IDs seguros, fecha civil, FK/cascade e índices.
- [x] `src/datos/repositorio.ts`: catálogo público con taxonomía compartida,
  proyección sin precio/detalle, lectura privada por ID y reserva de 168 horas.
  No se conectó a páginas/API ni se añadió DB al `wrangler.json` del sitio.
- [x] Rojo antes de implementación: ambos tests nuevos fallaron al importar el
  repositorio inexistente. Después, 11/11 pruebas D1 locales aprobadas sin skips.
- [x] Migración desde cero y reaplicación por historial verificadas; constraints,
  claves únicas, JSON, booleanos, ID seguro, fechas, nulos, FK/cascade y rollback
  completo de batch al fallar la segunda sentencia.
- [x] Check Cloudflare: 5 guardas + 11 pruebas D1 + 3 runtime; tipos sin errores,
  advertencias ni hints y build aprobado. Repetido tras ampliar concurrencia de
  renovación y corregir el caso de clave omitida: todo aprobado, sin skips.
- [x] Check Next de este lote: 542/542, sin fallos/skips, mismas 20 advertencias
  de lint y aviso previo de React `prefetch`. Sin Next build ni acceso a Supabase.
- [x] Revisión final: 24 archivos nuevos propios acumulados sin espacios finales
  ni rutas locales; configuración y lockfile de Next sin cambios en este lote.
  Artefactos ignorados, sin commit/push ni recursos remotos.

Fallo real encontrado durante la revisión: SQLite asignaba un ID a un precio
sin `carrera_id`, porque `INTEGER PRIMARY KEY` es alias de rowid. Una prueba nueva
falló con «Missing expected rejection». Se cambió a `INT NOT NULL PRIMARY KEY`
en la migración inicial todavía no publicada; el caso y el check completo pasan.
No se ocultó el fallo ni se atribuyó a cuota. El resto de las escrituras sigue
limitado a bases efímeras sintéticas; no se importaron datos reales.

La reserva lee reloj de base y ejecuta UPSERT condicional de clave compuesta.
Las pruebas concurrentes cubren 24 altas y 24 renovaciones vencidas de la misma
clave, con un ganador; rechazo sin extender fecha, claves independientes y
frontera exacta de 168 horas con el mismo SQL/instantes sintéticos. No hay SMTP,
outbox ni garantía de entrega exactamente una vez. SQL se ejecuta contra D1 local
del harness, no mocks. Los métodos puros se invocan desde Node con ese binding.

No se probó autorización HTTP ni se reconstruyó RLS: sólo proyección pública y
restricciones del esquema. Defaults y datos remotos siguen sin inventariarse.
Se adoptó timestamp UTC de milisegundos en reservas; normalizar precisión será un
gate de cualquier futura importación real.

## Lote 2B: rate limit y contadores locales

- [x] Contratos contrastados con las RPC SQL de julio/septiembre y los cuatro
  consumidores actuales (formularios, alertas, modal y apertura directa), más la
  lectura de agregados del digest. Sin inspección remota de Supabase.
- [x] `0002.sql`, `src/datos/control.ts` y reloj compartido `reloj.ts`;
  0001 intacta, sin binding DB en el sitio ni APIs públicas nuevas.
- [x] Pruebas rojas iniciales por módulo no implementado; después 14/14 nuevas
  sobre binding D1 real local, sin skips. No hubo fallo inesperado de este lote.
- [x] Migraciones desde cero y actualización desde 2A con datos preservados,
  reaplicación por historial y continuidad de la reserva de 168 horas.
- [x] Ventana fija con `<` estricto, no `<=`; 24 solicitudes no superan cupo 5;
  24 aperturas directas conceden 20; 32 incrementos no pierden actualizaciones.
  Claves SHA-256/prefijos y umbrales 5/12/20/60 actuales, todos de 600 segundos.
- [x] Captcha falso/excepción y fallo posterior no reembolsan intentos. Trigger
  sintético fuerza error D1 de contador y deja consumido el cupo, como las RPC
  independientes. Rechazo por cupo no incrementa ni extiende la ventana.
- [x] Día argentino en frontera 03 UTC y fixture histórico de horario de verano;
  agregados por texto/origen sin FK. Validación antes de cupo en aperturas, texto
  sin recorte adicional en RPC y overflow int32 rechazado sin perder el contador.
- [x] `npm --prefix cloudflare run check`: 33/33 totales (5 guardas, 11 D1 2A,
  14 D1 2B, 3 runtime), tipos sin errores/advertencias/hints y build aprobado.
- [x] `npm run check` vigente: 542/542 sin fallos/skips; mismas 20 advertencias
  de lint y aviso previo de React `prefetch`, sin Next build ni conexión remota.
- [x] Revisión final: 30 archivos nuevos propios acumulados sin espacios finales
  ni rutas locales; estado Git ajeno preservado. Sin cambios adicionales al sitio
  Next ni sus dependencias/configuración; artefactos ignorados y sin commit/push.

No se agregaron límites nuevos: se preservan hasta las peculiaridades de la RPC
con máximo cero/negativo/null y ventana cero/negativa/null. No se agregó limpieza
TTL: la expiración es lógica. Restricciones numéricas conservan el rango int32,
no una nueva cuota. D1 errores se propagan; el mapeo a respuestas HTTP y la
confianza de la IP de Cloudflare siguen pendientes. El puerto interno de captcha
espera ambas ramas antes de propagar error para no abandonar la escritura de cupo;
no modifica el handler Next existente ni acredita Turnstile real.

## Lote 2C: enlaces y persistencia del robot

- [x] Contratos de SQL de octubre, `casas.ts`, handler de enlaces, generador de
  códigos y API del robot contrastados con CodeGraph/lectura enfocada, sin remotos.
- [x] `0003.sql` incorpora las tablas de enlaces/robot y 34 campos de consulta
  necesarios para FK/legajo. No migra la API de consultas ni sus avisos; sin
  cambios a 0001/0002, sin endpoints ni bindings nuevos en el sitio.
- [x] Repositorios `enlaces.ts`/`robot.ts`, validadores/generador compartidos sin
  invocar código de red. Runner/check incluye `test:inscripcion` sólo sintético.
- [x] Rojo inicial esperado por módulos inexistentes; luego 13/13 pruebas nuevas
  D1 reales, sin skips ni fallos inesperados. Desde cero y upgrades desde 2A/2B
  preservan catálogo/precio/reserva/cuotas/agregados, sin crear jobs externos.
- [x] Código 22–64/generación 32, 7 días, expiración a igualdad y usado prioritario;
  16 consumos concurrentes dan uno. Validación de casa/tipo/carrera/legajo antes
  de CAS, compensación explícita, rollback batch y FK/cascade/error SQL.
- [x] 16 encolados por consulta dan una fila; reencolado no reinicia cargada.
  Barrido 20 pendientes, lectura de error por id sin claim; dos lecturas reciben
  la misma tarea. No hay deduplicación por persona, lease ni estado procesando.
- [x] 24 reportes error incrementan 24, detalle normalizado a 300 e id según helper
  vigente. Cargada terminal bajo concurrencia, repetición sobre cargada sin cambio;
  error repetido sí incrementa. Overflow falla sin dejar estado parcial.
- [x] Check Cloudflare completo: 46/46 (5 guardas + 11 2A + 14 2B + 13 2C +
  3 runtime), tipos sin errores/advertencias/hints, build aprobado.
- [x] Check Next vigente: 542/542 sin fallos/skips, mismas 20 advertencias de lint
  y aviso React `prefetch`; sin Next build ni operaciones remotas.
- [x] Revisión final: 37 archivos nuevos propios acumulados sin espacios finales
  ni rutas de la máquina. Cambios ajenos preservados; sitio Next, dependencias y
  configuración sin cambios adicionales; artefactos ignorados, sin commit/push.

El reporte D1 es un UPDATE condicional atómico: refuerza la guarda cargada del
handler actual, que usa SELECT + UPDATE y no garantiza eso bajo concurrencia.
No equivale a garantizar un solo procesamiento del portal. `liberarEnlace` es
compensación como hoy, no lease ni protección ante liberación tardía; queda
pendiente la transacción completa de enlace/nueva consulta/outbox. El batch de
rollback probado acredita el mecanismo D1, no esa integración aún inexistente.
No se trasladó/activó el robot real ni se emitieron mensajes o inscripciones.

## Lote 3A: API local, outbox y efectos simulados

- [x] Contratos contrastados con `app/api/formularios/route.ts`,
  `app/api/robot/autoinscripciones/route.ts`, `components/formularios/casas.ts` y
  `docs/formularios-por-casa.md`; sin conexiones ni lecturas remotas.
- [x] `0004.sql` sólo con la tabla `outbox`; 0001–0003 intactas, sin bindings en el
  sitio, sin Queues ni crons, sin tablas de faq/clases/newsletter inventadas.
- [x] Transacción completa del enlace en un único `batch()`: CAS de consumo, nueva
  consulta y efectos. Las sentencias posteriores al CAS se guardan con
  `changes()=1`, así la perdedora no escribe nada; 16 envíos simultáneos dan una
  sola alta y 15 rechazos sin consulta ni outbox.
- [x] Rollback probado con un trigger sintético que aborta el INSERT de la
  consulta: 500, enlace no consumido, ninguna consulta nueva y outbox vacío.
- [x] Outbox con clave única por intención, sin datos personales, intento
  persistido antes del transporte, `enviado` terminal, `error` sólo por reintento
  explícito y `ambiguo` que no vuelve a salir solo. `omitido` cubre la reserva de
  168 h vigente y la falta de datos para el efecto.
- [x] Consumidores con transportes inyectados: ningún módulo bajo prueba hace red.
  Fallo conocido → `error`; `ErrorAmbiguo` → `ambiguo` sin reintento; sin
  transporte la intención sigue pendiente.
- [x] Auth y errores equivalentes: 400 de sobre/payload, 403 de captcha y de pase
  ya usado, 429 por cupo, 500 de base, 503 sin servicio/secretos, 401/404/409 del
  robot con hashes en tiempo constante y `no-store`.
- [x] `npm --prefix cloudflare run check`: 66/66 (5 guardas, 11 de 2A, 14 de 2B,
  13 de 2C, 20 del lote 3A, 3 de runtime), tipos sin errores ni advertencias y
  build aprobado. `tests/datos.test.mjs` se ajustó de 3 a 4 migraciones.
- [x] `npm run check` vigente: 542/542 sin fallos ni skips, mismas 20 advertencias
  de ESLint y aviso React `prefetch`; sin Next build ni operación remota.

Fallo real encontrado y corregido: el primer diseño identificaba la consulta nueva
con `last_insert_rowid()`. Con dos efectos pasaba y con tres la FK fallaba, porque
el valor no está definido durante una sentencia que inserta varias filas y la
segunda fila apuntaba al id de la primera del outbox. Se cambió a `max(id)` dentro
de la misma transacción y se agregó el caso de tres efectos a las pruebas.

No se declara el bloque 3 completo. Pendiente: tablas de `faq_preguntas` y
`solicitudes_clase` (hoy validan y responden 503), `suscripciones_newsletter` (el
alta queda como efecto durable sin consumidor), adaptador de Turnstile y del pase
en Worker (los puertos existen; no se reimplementó la criptografía), modo demo de
desarrollo, Queues/cron y todo efecto real. El POST del robot omite el campo
opcional `aviso` del contrato anterior. Tampoco se probó nada contra producción ni
con datos reales.

## Lote 3B: tablas y adaptadores que faltaban

- [x] `0005.sql`: `faq_preguntas`, `solicitudes_clase`, `suscripciones_newsletter`
  y `faq_id`/`clase_id` en el outbox. 0001–0004 intactas; sin triggers, jobs,
  bindings ni recursos.
- [x] FAQ y clases con sobre y validación equivalentes y escritura + outbox en un
  batch. Un trigger sintético que aborta el INSERT revierte la fila y sus efectos
  (500); en clases, si una fila falla no entra ninguna y no se encola ningún aviso.
- [x] Newsletter como efecto interno: upsert por `email` + `ifnull(carrera_id, 0)`,
  renovación sin duplicar, una general por mail, baja con `activo = 0` y FK real a
  `carreras`.
- [x] Turnstile con `fetch` inyectado: pedido a `siteverify` con secreto, token e
  IP, timeout de 8 s, rechazo de `success` falso, respuesta no-ok, hostname ajeno,
  red caída y cuerpo ilegible. Ninguna prueba salió a la red; sin secreto lanza.
- [x] Pase con Web Crypto: mismo sujeto, vigencia, margen y firma sobre el texto
  base64url. Comprobado que un pase emitido por `lib/pase-autoinscripcion.ts` con
  `node:crypto` valida acá y que el emitido acá tiene la misma forma.
- [x] Modo demo local: 201 con la misma forma por los seis `kind`, precio ficticio
  rotulado, pase de demo y 400 de los payloads inválidos, sin tocar base, cuota ni
  outbox. Fuera de `APP_STAGE === 'local'` el mismo envío escribe en la base.
- [x] `npm --prefix cloudflare run check`: 86/86 (5 guardas, 11 de 2A, 14 de 2B,
  13 de 2C, 31 de API/outbox, 9 de pase y Turnstile, 3 de runtime), tipos sin
  errores ni advertencias y build aprobado.
- [x] `npm run check` vigente: 542/542 sin fallos ni skips, mismas 20 advertencias
  de ESLint y aviso React `prefetch`; sin Next build ni operación remota.

Fallo real encontrado y corregido: `sentenciaInsertClases` bindeaba los arrays de
`dias`/`horarios` tal cual y D1 los rechaza; el handler respondía 503 y no escribía
nada. Se serializan a JSON (con el CHECK de la tabla) y la prueba de clases cubre
los dos arrays y el booleano. El otro ajuste fue de tipos, no de comportamiento:
la unión interna del consumidor conservaba una variante que nadie devolvía.

Decisiones marcadas, sin inventar reglas: `estado` por defecto `pendiente` y
`destacada` 0 porque el default real de Supabase no se pudo verificar sin acceso
remoto, y así la fila no aparece en la vista pública; `materia_id` no tiene FK
porque `materias` no está migrada y el formato lo sigue validando la API; el POST
del robot omite el campo opcional `aviso` en vez de inventar un valor nuevo.

Sigue sin estar completo el bloque 3: faltan `materias`, R2/Queues, cron, los
adaptadores reales de Telegram/SMTP/HubSpot/GitHub, el widget de Turnstile en el
navegador y cualquier efecto real. Nada de esto se probó contra producción ni con
datos reales, y no hay commit ni push.

## Revalidación del cierre 3B (24/10/2026)

- [x] Código de runtime, Turnstile y pase contrastado con el alcance 3B; no se
  reimplementó el lote ni se extendió a operaciones remotas.
- [x] Check Cloudflare completo repetido: 86/86, sin fallos, cancelaciones ni skips;
  tipos sin errores/advertencias/hints, build y runtime workerd aprobados.
- [x] Check Next completo repetido: 542/542, sin fallos, cancelaciones ni skips;
  mismas 20 advertencias de ESLint y aviso React de `prefetch` preexistentes.
- [x] `cloudflare/LEER.md` actualizado al alcance 3B; antes terminaba en 2C.

Las primeras dos corridas paralelas fueron interrumpidas por el timeout de la
herramienta a 120 segundos, dejando pruebas canceladas. No se tomaron como
aprobadas: se repitieron completas por separado con margen de 600 segundos y
aprobaron sin cambios de código. No hubo commit/push, deploy ni datos reales.

## Lote 3C: materias y relación con solicitudes (24/10/2026)

- [x] Contratos contrastados con tipos generados, proyecciones de
  `lib/datos/materia.ts`, consumidores de clases y SQL histórico. El cascade de
  `clases_apoyo` no se extrapola a `solicitudes_clase`: se usa NO ACTION hasta
  cotejar el catálogo remoto autorizado, sin acceso remoto en este lote.
- [x] `0006.sql`: materias STRICT con 17 campos, UUID explícito, slug único,
  booleanos 0/1, JSON válido y orden smallint. Defaults locales sujetos a inventario;
  no hay triggers de updated_at, políticas, usuarios ni endpoints administrativos.
- [x] `src/datos/materias.ts`: lecturas de card, navegación y ficha, activas por
  orden/id; JSON/booleanos convertidos y validación/proyección compartida con Next.
  Sin precios, filas de solicitudes ni datos ajenos a cada proyección.
- [x] `0007.sql`: FK de solicitudes con reconstrucción del outbox hijo, sin apagar
  integridad. Conserva filas completas, estados, ids, índices, FK previas y máximo
  histórico de secuencia; no pierde avisos por cascade al retirar la tabla vieja.
- [x] Upgrade 3B → 3C: cargar padres entre 0006/0007; reaplicación no duplica.
  Huérfanas abortan 0007 sin borrar solicitudes/outbox ni registrar éxito; después
  de cargar el padre puede aplicarse. No se inventan padres ni se descartan filas.
- [x] Pruebas rojas iniciales por módulo/migraciones ausentes; después seis pruebas
  nuevas sobre D1 real local cubren esquema, proyecciones, JSON null/corrupto,
  errores de lectura, FK HTTP y upgrades. Fixtures anteriores de clases ajustados
  para crear materias; 0001–0005 y el handler vigente quedan intactos.
- [x] Check Cloudflare: 92/92 (86 anteriores + 6 nuevas), sin fallos/cancelaciones/
  skips; tipos sin errores/advertencias/hints, build y runtime workerd aprobados.
- [x] Check Next: 542/542, sin fallos/skips; mismas 20 advertencias ESLint y aviso
  React `prefetch`. Sin Next build, cambios de UI, red externa ni datos reales.

Dos ajustes durante pruebas: Node strip-only rechazó las parameter properties del
validador compartido; se comprobó que `--experimental-transform-types` permite
importarlo y se habilitó sólo en `test:materias`, sin tocar código Next. Node emite
su advertencia experimental. El conteo inicial de columnas esperaba 18 por error:
el contrato tiene 17 y ahora el test compara los nombres exactos, no sólo cantidad.

Rollback de este lote aún no publicado: retirar sólo 0006/0007, el repositorio y
los tests/fixtures nuevos, sus entradas de runner/package y ajustes de fixtures.
Descartar únicamente bases efímeras del harness; no aplicar una reversión SQL a
datos reales. El sitio Next no depende de este paquete. Sin commit ni push.

## Lote 3D: transportes reales y cola local (24/10/2026)

- [x] `src/operativa/transportes.ts`: Telegram, SMTP2GO, HubSpot y GitHub con
  `fetch` inyectado y configuración como puerto; no leen entorno ni el `fetch`
  global. Textos reutilizados de `mensajes.ts`, `armarMailPrecio` y `casas.ts`; no
  se copió copy. Timeouts por proveedor y `AbortSignal` en cada pedido.
- [x] Regla de fallos del diseño: no-2xx es rechazo conocido (`error`, reintento
  explícito); excepción o timeout después de enviar es `ambiguo` y no se reintenta
  solo. SMTP2GO confirma por `succeeded`/`failed`, no por el 200; una respuesta
  ilegible es ambigua. Sin configuración: `sin-configurar`, fila pendiente.
- [x] `src/operativa/colas.ts`: el mensaje lleva sólo `{ tipo: 'efecto', id }`; la
  tabla es la autoridad. `publicarEfectos` no lanza, `manejarLote` acusa lo
  inválido, ignora lo ya terminado y reintenta sólo el error de base;
  `barridoDeEfectos` recupera pendientes y sin transporte.
- [x] `src/operativa/consumidores.ts`: `consumirEfecto(id)` relee el estado antes
  de enviar, así una entrega repetida no vuelve a llamar al proveedor;
  `ErrorRechazo` separa el rechazo conocido de `ErrorAmbiguo`.
- [x] `src/api/formularios.ts`: los cuatro INSERT del outbox usan `RETURNING id`
  dentro del batch y el handler publica sólo esos ids después del alta; los ids no
  viajan al navegador y un fallo de cola no cambia el 201.
- [x] Pruebas nuevas en `tests/envios.test.mjs` (19) con `buscar` simulado y D1
  local: los cuatro transportes, aviso de robot sin Markdown, clasificación de
  fallos, entrega repetida, cuerpo inválido, error de base, barrido y publicación
  desde la API. `tests/helpers/alias.mjs` resuelve `@/` para Node con
  `module.registerHooks` (sólo rutas). `test:envios` integrado al runner y `check`.
- [x] Check Cloudflare: 111/111 (92 anteriores + 19 nuevas), sin fallos,
  cancelaciones ni skips; tipos sin errores/advertencias/hints, build y runtime
  workerd aprobados. Check Next: 543/543, sin fallos/skips; mismas 20 advertencias
  ESLint y aviso React `prefetch` preexistentes. Sin envíos reales, red externa,
  recursos remotos ni datos reales. En el D1 de pruebas, reutilizar `?1` dos veces
  en un mismo `VALUES` aborta por FK: los fixtures usan parámetros distintos. El
  código no reutiliza placeholders, así que no cambia el contrato.
- [ ] **Límite declarado, no resuelto:** el adaptador de Astro exporta sólo
  `fetch`, así que no hay entrypoint con `queue`/`scheduled` ni bindings de Queues
  o cron; `wrangler.json` sigue sin colas, crons ni R2. Conectar productor y
  consumidor reales es infraestructura del bloque 6, con autorización separada.
  `/api/robot` no publica el aviso de error (lo levanta el barrido) y no se
  reimplementaron `precio-visto` ni el enriquecimiento del enlace de inscripción.

## Wiring local Queues/cron (24/10/2026)

Alcance adicional aprobado: entrypoint fetch/queue/scheduled, D1/Queues locales y
cron cada cinco minutos; sin pagos, recursos remotos, envíos reales ni publicación.
El límite histórico de 3D sobre wiring/claim/barrido queda resuelto para uso local.

- [x] `src/worker.ts` usa `handle` del adaptador instalado y wrappers puros de
  `operativa/programados.ts`. DB ficticia `remote:false`, EFECTOS productor/consumidor,
  DLQ local, tres reintentos/10 s y `*/5 * * * *`; runtime conecta formularios y robot.
- [x] `0008.sql`: reclamo durable único por intención y cursor de barrido. Cron/cola
  no compiten por enviar la misma intención. Ambigüedad persistida antes del envío;
  no se roba un reclamo abandonado ni se reintenta un resultado incierto.
- [x] Guardas exactas de configuración local; el entrypoint no configura transportes
  externos ni lee sus secretos. Cron local se dispara manualmente, no por reloj.
- [x] Check Cloudflare final **123/123**, tipos/build/runtime aprobados, sin skips.
  Check Next **543/543**, 20 avisos ESLint y aviso React preexistentes. Espacios
  propios limpios; `git diff --check` global conserva fallos ajenos de PENDIENTES.
- [x] Evaluación oficial: Queues/D1/cron no obligan a Paid; el barrido actual de
  veinte filas sin transporte hace **103 consultas D1**, superior al límite Free de
  50 por invocación. Para el corte, Paid si se conserva este lote, o reducir/batchear
  y medir CPU SSR antes de decidir. No se contrató ni activó nada.

Detalles, límites y recuperación manual: [operativa local](../../cloudflare/OPERATIVA-LOCAL.md).
Plan ejecutado y
[fuentes oficiales](../../referencias/2026-10-24-cloudflare-colas-locales.md).
Pendientes al cierre de ese incremento (pruebas locales resueltas en la sección
siguiente): crash/recuperación del isolate y vencimiento/DLQ extremo a extremo.
Los límites remotos no se verificaron. No hay garantía exactly-once ni claim del trabajo del
portal del robot. No hubo commit/push ni cambios en Next o producción en este lote.

## Recuperación tras caídas y DLQ local (24/10/2026)

- [x] Continuación autorizada sólo local. Sin cambios en `src/`, migraciones,
  `wrangler.json`, Next ni exclusiones; claim y política de ambiguos intactos.
- [x] `test:recuperacion` agregado al runner y a `check`: ocho pruebas, **8/8** en
  corrida focalizada final. Worker fixture compilado usa los consumidores reales,
  D1 y broker de Queues locales; proveedor simulado y red externa bloqueada.
- [x] SIGKILL real de workerd verificado en cinco fronteras: antes del claim,
  antes/durante/después del efecto y después de persistir enviado. Cambio de
  instancia y conservación D1 comprobados; recuperación automática sólo sin claim,
  reconciliación manual CAS con evidencia para los otros casos, incertidumbre retenida.
- [x] Queues produce intentos 1–4 con mismo message id, transferencia a DLQ con
  observador local de fixture y recuperación por cron sin duplicación al redrive.
- [x] Ocho competidores HTTP y cron contra el mismo consumidor compilado no roban
  el claim de la entrega pausada. El broker local no soporta consumer concurrency.
- [x] Expiración identificada como **simulación**, no TTL real: Miniflare instalado
  no implementa retención y descarta mensajes sin consumidor. El outbox conserva
  intención y scheduled la recupera. El observador de DLQ sólo existe en tests.
- [x] Check Cloudflare completo final **131/131**, sin fallos/cancelaciones/skips;
  tipos sin errores/advertencias/hints, build y cinco pruebas Astro compilado
  aprobados. Nueve archivos propios sin errores de espacios; diff global conserva
  únicamente los espacios ajenos de `PENDIENTES.md:5,7,10`.

La recarga termina workerd, pero conserva el proceso Node/D1 temporal del harness;
se republica expresamente la referencia tras la caída. No acredita redelivery
automático durable, TTL remoto ni recuperación de disco/máquina. No se ejecutan
tests Next porque sólo cambian pruebas/runner/docs del paquete excluido.
Detalle: [recuperación local](../../cloudflare/RECUPERACION-LOCAL.md).

## Pendiente

Siguiente: R2 y eventual habilitación externa (bloque 6, autorización
separada); recién después la paridad de páginas del bloque 4. Persistencia 2A–3D no
migra todas las tablas ni certifica el sistema entero. UI, formularios, otras
tablas, R2, publicación y paridad completa todavía no
están migrados.
La integración React está configurada, pero no se
demostró aún hidratación de componentes del sitio.

Antes de datos reales: inventario remoto autorizado, credencial de respaldo
completo, custodia cifrada y restauración aislada comprobada; acordar RPO/RTO.
Corte futuro con un escritor/emisor y rollback con reconciliación de datos nuevos.
Ni esta base ni el check local acreditan recuperación o funcionamiento remoto.

Rollback de este incremento: retirar sólo `cloudflare/` y las exclusiones propias
de `tsconfig.json`/`eslint.config.mjs`; producción no depende del paquete.
