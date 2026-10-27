# Plan de implementación: migración completa a Cloudflare

> **Para el ejecutor:** usar la skill `executing-plans` para ejecutar por bloques
> con verificaciones y detenerse ante gates o fallos no comprendidos.

**Objetivo:** reemplazar Next/Vercel/Supabase sin perder UI, URLs, SEO ni operativa.

**Arquitectura:** Astro + islas React en Workers; D1 sólo detrás de backend;
R2 para objetos; outbox y Queues para efectos externos. El sitio actual permanece
intacto hasta que se autorice y verifique el corte.

**Stack:** Astro, React, adaptador oficial Cloudflare, Wrangler/workerd, TypeScript,
node:test, D1/SQLite, R2 y Queues.

**Reglas de ejecución:** trabajar en `main`, sin worktree, delegación, commit/push
ni operaciones remotas en esta entrega. Estas restricciones reemplazan los pasos
genéricos de ramas y commits de las skills. Nunca incluir archivos privados.

---

## Bloque 1: base local aislada (completado en la primera entrega)

**Crear:** `cloudflare/package.json`, `cloudflare/package-lock.json`,
`cloudflare/astro.config.mjs`, `cloudflare/wrangler.json`,
`cloudflare/tsconfig.json`, `cloudflare/src/pages/index.astro`,
`cloudflare/src/pages/404.astro`, `cloudflare/src/pages/api/estado.ts`,
`cloudflare/src/middleware.ts`, `cloudflare/scripts/local.mjs`,
`cloudflare/tests/seguridad.test.mjs`, `cloudflare/tests/runtime.test.mjs`,
`cloudflare/LEER.md`, `cloudflare/.gitignore`.

**Modificar sólo para aislamiento:** `tsconfig.json` y `eslint.config.mjs` de la
raíz, excluyendo el paquete independiente de Next; no cambiar sus scripts,
dependencias, lockfile ni código del sitio vigente.

1. Registrar `git status` y `npm run check` antes de editar para separar problemas
   ajenos. Leer criterios y consultar CodeGraph antes de cambios estructurales.
2. Fijar versiones compatibles consultando docs y metadatos npm. Instalar sólo
   dentro de `cloudflare/`, sin scaffolder que pueda desplegar o tocar Git.
3. Escribir primero pruebas de guardas: entorno por lista permitida; rechazo de
   comandos de publicación y `.env*`/`.dev.vars*` locales; configuración sin IDs,
   rutas, crons ni bindings remotos. Ejecutarlas en rojo antes de implementar.
4. Implementar runner con `cwd` del paquete, sin shell ni argumentos arbitrarios,
   entorno de herramientas aislado y carga dotenv deshabilitada en Vite/Wrangler.
   Sólo comandos locales fijos. No leer/copiar `.env.local` de la raíz.
5. Configurar SSR oficial y React; sesiones apagadas e imágenes sin binding
   automático. Endpoint `GET /api/estado` devuelve únicamente estado técnico desde
   variable no sensible de runtime. Home y 404 con HTML vacío, sin copy inventado.
   Middleware local con noindex/no-store y cabeceras básicas; no declarar paridad
   completa de producción todavía.
6. `npm --prefix cloudflare run test:seguridad`: guardas aprobadas.
   `npm --prefix cloudflare run check`: tipos, guardas, build y runtime workerd.
   Probar home, API y 404; sin acceso a servicios externos. Inyectar una cadena
   centinela ficticia en el entorno padre y comprobar que no pasa al hijo ni a
   artefactos. Probar variable de runtime sin reconstruir.
7. `npm run check` en raíz: debe conservar la línea base; no correr Next build.
   Revisar diff propio y estado final. Registrar resultados y límites en
   `odd/tasks/migracion-cloudflare.md`; no declarar migración finalizada.

**Rollback local:** retirar sólo `cloudflare/` y las exclusiones añadidas por este
bloque; ningún dato ni servicio depende de él. No borrar cambios ajenos.

## Bloque 2: contratos y repositorios D1 locales

**Lote 2A autorizado al continuar el 24/10:** esquema local de `carreras`,
`precios_privados` y `reservas_mail_precio`; lectura de catálogo y precio privado,
y reserva atómica de 168 horas. El catálogo reutiliza la taxonomía vigente y no
expone precio, correo ni JSON de detalle. No se conectan estos repositorios a
las páginas/API. Migraciones y concurrencia se prueban en el binding D1 local de
un harness efímero, nunca mediante la configuración remota del sitio.

Los 23 campos de carreras se conservan en el esquema, pero en este lote sólo
se ofrece la proyección de catálogo. No se declara migrado el detalle de ficha.
La reserva usa reloj de base (sin fecha/duración recibidas del cliente); pruebas
de frontera ejercitan el mismo SQL con instantes sintéticos determinísticos.
No incluye SMTP ni garantía de entrega exactamente una vez.

**Lote 2B autorizado:** sólo rate limit y contadores de aperturas. Crear
`cloudflare/migrations/0002.sql`, `src/datos/control.ts`,
`tests/rate-limit.test.mjs`, `tests/contadores.test.mjs` y
`tests/migraciones.test.mjs`; incorporarlos al check local. Reutilizar reloj de
base en `src/datos/reloj.ts`. Probar desde cero y desde 0001 con datos sintéticos
preservados, sin editar 0001 ni añadir bindings al sitio.

Contratos fuente: `sql/2026-07-20_seguridad_formularios.sql`,
`sql/2026-09-01_contador_aperturas_directas.sql`, las cuatro rutas consumidoras
`app/api/{formularios,alertas-analytics,track-click,track-direct-open}/route.ts`
y lectura de agregados en `supabase/functions/digest-clicks/index.ts`.
Ventana fija con vencimiento estricto `<`, no `<=`; no extenderla ni incrementar
al rechazar por cupo. El intento concedido sí persiste aunque falle captcha,
payload, contador o aviso posterior. Mantener claves/prefijos SHA-256, cuotas
5/12/20/60 y 600 segundos según consumidor, sin agregar límites nuevos.
Contar por fecha argentina, texto de carrera y origen modal/directa, no por ID.
No introducir borrado TTL ni retención nueva: la expiración del cupo es lógica.

Los límites y contadores se arbitran con UPSERT de una sentencia; no envolver
cupo y contador en un único batch que revierta el intento ante un fallo posterior.
Sin APIs nuevas: helpers internos y fixtures locales; integración HTTP y confianza
de la IP de Cloudflare quedan para el bloque 3. Mantener peculiaridades SQL de
parámetros integer/null sin convertirlas en nuevas políticas públicas.

**Lote 2C autorizado:** crear `cloudflare/migrations/0003.sql`,
`src/datos/enlaces.ts`, `src/datos/robot.ts`, `tests/enlaces.test.mjs`,
`tests/robot.test.mjs`, `tests/upgrade-enlaces-robot.test.mjs` y fixtures de consulta.
Se necesitan los 34 campos de `consultas` como soporte de FK/lectura del legajo;
no significa migrar su API de escritura ni notificaciones. No cambiar 0001/0002.
Añadir `test:inscripcion` al runner/check; nada de bindings remotos ni endpoints.

Reutilizar validadores puros de `components/formularios/casas.ts` y generador
seguro de códigos de `supabase/functions/notificar/enlace.ts`, sin invocar sus
funciones de envío. Código alfanumérico 22–64, generación de 32, vigencia 7 días,
vencido a igualdad; usado tiene prioridad visual sobre vencido. Reservar con
UPDATE condicional usado-null/vence-futuro después de validar consulta/carrera/
legajo según handler vigente. Compensación local explícita sólo tras fallo conocido;
no prometer propiedad de lease ni recuperación de resultados externos ambiguos.
Verificar rollback de un batch fallido sin afirmar que ya existe la transacción
completa enlace + nueva consulta + outbox del futuro bloque 3.

Robot: sólo pendiente/error/cargada; una fila por consulta, barrido ascendente de
20 pendientes y lectura puntual de pendiente/error. No hay claim/lease en GET
actual: probar y documentar que dos lectores pueden recibir la misma tarea.
El reporte de error incrementa intentos; cargada no los incrementa y es terminal.
Normalizar id/detalle con los helpers existentes. Usar UPDATE condicional atómico
para no perder incrementos ni pisar cargada bajo concurrencia (el handler Next
actual usa SELECT + UPDATE y no acredita esa atomicidad). No inventar estado
procesando, límite de reintentos ni deduplicación por DNI/persona.

Probar desde cero y upgrade desde 2A/2B con datos previos preservados, FK/cascade,
consumo único por código, expiración exacta, compensación, estados, idempotencia
de encolado por consulta y ausencia de claim. Despacho, auth HTTP, validación del
sobre, mails/Telegram/HubSpot/GitHub y efectos externos quedan fuera del lote.
Tras 2C quedan otras tablas y toda integración de los bloques siguientes; no
declarar migración completa ni entrega exactamente una vez.

**Crear:** `cloudflare/src/datos/repositorio.ts`, `cloudflare/migrations/0001.sql`,
`cloudflare/tests/datos.test.mjs`, `cloudflare/tests/concurrencia.test.mjs`.
**Soporte de pruebas:** `cloudflare/tests/helpers/d1.mjs`,
`cloudflare/tests/fixtures/worker-d1.mjs`; añadir `test:datos` al runner local y
al check. Mantener `wrangler.json` del sitio sin bindings D1.
**Consultar, sin reemplazar aún:** `lib/database.types.ts`, `sql/`,
`components/formularios/casas.ts`, `components/index/types.ts`.

1. Tests rojos con fixtures sintéticos de IDs, JSON, fechas argentinas, nulabilidad,
   claves únicas y relaciones; inventario de tablas reales pendiente de gate remoto.
2. Convertir el esquema y acceso mínimo con SQL parametrizado; D1 sólo local.
3. Reimplementar RPC de cuotas, contadores y reserva 168 horas con exclusión
   atómica, consumo único de enlaces y estados del robot. No usar memoria/KV como
   autoridad. Tests concurrentes y de fronteras con reloj controlado.
4. Verificar con `npm --prefix cloudflare run check`; no llamadas Supabase.

**Aceptación:** lecturas públicas no incluyen campos privados; pruebas negativas
de permisos y concurrencia aprobadas. Rollback: paquete local sigue sin tráfico.

## Bloque 3: API y efectos externos simulados

**Lote 3A autorizado al continuar el 24/10:** API local de formularios y del robot,
outbox durable y consumidores con transportes inyectados. Crear
`cloudflare/migrations/0004.sql` (sólo la tabla `outbox`),
`src/operativa/outbox.ts`, `src/operativa/consumidores.ts`, `src/api/filas.ts`,
`src/api/formularios.ts`, `src/api/robot.ts`, `src/api/runtime.ts`, los adaptadores
`src/pages/api/formularios.ts` y `src/pages/api/robot/autoinscripciones.ts`, y
`tests/formularios.test.mjs`, `tests/operativa.test.mjs`,
`tests/upgrade-outbox.test.mjs`. Añadir `test:api` al runner y al check.

Alcance real de este lote:

- **Transacción completa del enlace**: consumo (`SQL_RESERVAR_ENLACE`), nueva
  consulta y efectos en un único `batch()`. Las sentencias posteriores al CAS sólo
  escriben si ese mismo `UPDATE` consumió el enlace (`changes()`), así la
  perdedora no deja consulta ni outbox. No se usa `last_insert_rowid()` para
  identificar la consulta nueva: su valor no está definido durante una sentencia
  que inserta varias filas y la FK lo detectó; se usa `max(id)` dentro de la misma
  transacción de escritor único.
- **Outbox** con estados `pendiente|enviado|error|ambiguo|omitido`, clave única por
  `(tipo, clave)` sin datos personales, intento persistido antes del transporte y
  `enviado` terminal. `ambiguo` nunca se reintenta solo; `error` sólo por
  `reintentar()` explícito. Sin claim ni lease: dos barridos pueden tomar la misma
  fila abierta, igual que el GET del robot.
- **Efectos encolados**: `aviso-lead`, `newsletter-alta`, `mail-precio`,
  `lead-sede`, `robot-encolar`, `robot-despacho` y `aviso-robot-error`. El encolado
  del robot es idempotente por `UNIQUE(consulta_id)` y el despacho se engancha
  después de crear la fila. La reserva de 168 h de «Ver precio» sigue arbitrando el
  envío repetido y no se libera por un fallo del proveedor.
- **Auth y errores**: misma secuencia del handler vigente (sobre → captcha/cuota en
  paralelo → alta), con 400/403/409/429/500/503 equivalentes. La cuota se consume
  aunque el captcha falle. El robot conserva `Bearer` comparando hashes en tiempo
  constante y `Cache-Control: no-store`. La IP de cliente sale de
  `cf-connecting-ip`, que pone el borde, y no de `x-forwarded-for`, que es
  falsificable.

Queda pendiente y no se declara migrado: `faq_preguntas` y `solicitudes_clase` sin
tabla (se validan y responden 503), `suscripciones_newsletter` sin tabla (el alta
queda como efecto durable), Turnstile y el pase de autoinscripción sin adaptador de
Worker (puertos inyectados, sin criptografía reimplementada), modo demo de
desarrollo, Queues, cron y cualquier efecto real. La respuesta del POST del robot
omite el campo opcional `aviso`, que antes era el resultado del envío síncrono.

**Lote 3B autorizado al continuar el 24/10:** cerrar los huecos de persistencia y
adaptadores del lote anterior. Crear `cloudflare/migrations/0005.sql`
(`faq_preguntas`, `solicitudes_clase`, `suscripciones_newsletter` y las columnas
`faq_id`/`clase_id` del outbox), `src/datos/newsletter.ts`, `src/api/pase.ts`,
`src/api/turnstile.ts`, `src/api/seguro.ts`, `src/api/demo.ts`, y
`tests/pase.test.mjs`, `tests/turnstile.test.mjs`, `tests/upgrade-tablas.test.mjs`.
Añadir `test:identidad` al runner y al check.

Alcance real de este lote:

- **FAQ y clases**: el mismo sobre y la misma validación del handler vigente, con
  fila y efectos en un batch. `faq_preguntas` nace fuera de la vista pública
  (`estado` por defecto `pendiente`, `destacada` 0) porque la página filtra
  `estado='aprobada' AND destacada`; el valor real del default en Supabase no se
  pudo verificar sin acceso remoto y queda para el inventario del bloque 5.
  `solicitudes_clase` guarda `dias`/`horarios` como JSON con CHECK (en Postgres son
  `text[]`), el id uuid lo genera la API y la FK a `materias` queda pendiente
  porque esa tabla no está migrada: el formato lo valida la API, no la base.
- **Newsletter**: el alta pasa a ser un efecto interno consumido contra
  `suscripciones_newsletter` (upsert por `email` + `ifnull(carrera_id, 0)`, que es
  el equivalente SQLite de `UNIQUE NULLS NOT DISTINCT`): repetir renueva, sin
  carrera queda una general por mail, y la baja marca `activo = 0` sin borrar.
- **Turnstile**: puerto con `fetch` inyectado, `siteverify`, timeout de 8 s,
  `success === true` y comparación de `hostname` normalizado. Ninguna prueba sale
  a la red. Sin secreto lanza, como el módulo vigente, y el handler responde 503.
- **Pase**: HMAC con Web Crypto en lugar de `node:crypto`, con el mismo contrato
  (sujeto, vigencia de 10 minutos, margen de 30 s, firma sobre el texto base64url
  y comparación en tiempo constante). Se verificó contra el pase que emite
  `lib/pase-autoinscripcion.ts` con `node:crypto`.
- **Modo demo**: port fiel del vigente, habilitado sólo con `APP_STAGE === 'local'`
  y `FORMULARIOS_DEMO === '1'`; valida igual, no toca base, cuota, outbox ni
  transportes, y en producción la bandera no existe.

Queda pendiente y no se declara migrado: `materias` (y con ella la FK de
`solicitudes_clase`), R2/Queues, cron, adaptadores reales de Telegram/SMTP/HubSpot/
GitHub, la respuesta `aviso` del POST del robot (se omite el campo opcional en vez
de inventar un valor), el modo demo del widget de Turnstile en el navegador y todo
efecto real.

**Lote 3C autorizado al continuar:** sólo `materias` y la FK pendiente de
`solicitudes_clase`, con repositorios de lectura pública y fixtures sintéticos.
No migra UI ni incorpora transportes, bindings o servicios remotos.

1. Pruebas rojas de esquema/proyecciones y de solicitud con materia inexistente:
   el batch debe fallar sin solicitudes ni avisos parciales y conservar la cuota.
2. `0006.sql` crea `materias` con los 17 campos del contrato generado;
   `src/datos/materias.ts` reutiliza proyecciones/validadores de `lib/datos/materia.ts`,
   convierte JSON y booleanos, filtra activas y ordena por orden/id.
3. `0007.sql` incorpora la FK real reconstruyendo solicitudes y su outbox hijo sin
   apagar integridad. Conservar filas, ids, estados, índices y secuencia del outbox.
   No inventar padres ni borrar huérfanas: si hay solicitudes previas, cargar los
   padres entre 0006 y 0007. Probar rechazo y rollback de 0007 con huérfanas.
4. Mantener 0001–0005 intactas; ajustar fixtures de clases para crear sus padres,
   incorporar `test:materias` al runner/check y probar upgrade desde 3B.
5. Check Cloudflare y Next completos; registrar resultados y límites. La FK usa
   NO ACTION: los tipos generados no informan la acción remota de borrado; cotejar
   en el inventario autorizado, sin extrapolar el SQL histórico de `clases_apoyo`.

**Crear:** `cloudflare/src/pages/api/formularios.ts`,
`cloudflare/src/pages/api/robot/autoinscripciones.ts`,
`cloudflare/src/operativa/outbox.ts`, `cloudflare/src/operativa/consumidores.ts`,
`cloudflare/tests/formularios.test.mjs`, `cloudflare/tests/operativa.test.mjs`.
**Contrato fuente:** `app/api/formularios/route.ts`, `app/api/robot/`,
`supabase/functions/notificar/`, `docs/limite-mails-precio.md`.

1. Tests de paridad de sobres, campos por casa, captcha, cuotas y respuestas.
2. Guardado + outbox atómico; transporte simulado, deduplicación y estados de error.
3. Probar fallos entre commit y envío, entrega repetida y SMTP ambiguo sin
   reintento automático; no usar sólo `waitUntil()` para trabajos críticos.
4. Adaptar newsletter/baja, HubSpot, Telegram, digest y robot mediante puertos
   simulados. Verificar consentimiento y ausencia de datos personales en logs.

**Aceptación:** misma respuesta pública y trabajo recuperable aun con proveedor
caído; tests no pueden enviar correo/avisos reales. Rollback: nada publicado.

## Bloque 4: paridad de páginas y entrega

**Crear:** `cloudflare/src/layouts/Sitio.astro`,
`cloudflare/src/pages/carreras/[slug].astro`,
`cloudflare/src/pages/carreras/[slug]/inscripcion.astro`,
`cloudflare/src/pages/inscripcion/[codigo].astro`,
`cloudflare/src/pages/sitemap.xml.ts`, `cloudflare/src/entrega/redirects.ts`,
`cloudflare/src/entrega/cabeceras.ts`, `cloudflare/tests/paridad.test.mjs`.
**Fuentes:** `app/`, `components/`, `next.config.ts`,
`lib/vigilancia-esperado.ts`, `lib/json-ld.ts`, `lib/sanitize-content.ts`.

1. Copiar comportamiento, no rediseñar: CSS, textos y componentes autorizados;
   reemplazar APIs Next por Astro/React con cambios mínimos.
2. Enumerar todas las rutas actuales y migrarlas por familia (home/Teclab,
   carreras, clases, novedades, fijas, inscripción, APIs y assets).
3. Comparar HTML sin JavaScript, titles, canonical, JSON-LD escapado, sitemap,
   robots, códigos exactos 301/308/404 y cabeceras en respuestas dinámicas/estáticas.
4. Capturas visibles escritorio/móvil, navegación, modales, filtros, formularios,
   PDFs, accesibilidad y performance; conservar taxonomía y bajas deliberadas.

**Aceptación:** inventario completo sin rutas perdidas ni texto nuevo; ninguna
fuga de precio/legajo en caché, assets, HTML público o source maps.

## Bloque 5: gate de respaldo, inventario y ensayo de datos reales

**Cambio de alcance explícito, 25/10/2026:** el usuario renuncia al traslado de
históricos privados y autoriza sólo contenido público, con Supabase/Vercel intactos
como retorno. Para ese alcance, los pasos 1–2 y el gate de recuperación completa
de abajo quedan sustituidos por export público paginado, importación D1 local
aislada verificable y paridad SEO. No se exige Auth/Vault/cron/RPO/RTO ni se afirma
que haya copia completa. Configuración privada futura, recursos remotos y corte
siguen separados. Evidencia y procedimiento vigente:
[seguimiento de datos](../../odd/tasks/migracion-cloudflare-datos.md).

**Documentar cuando se autorice:** `odd/tasks/migracion-cloudflare-datos.md`.
**Crear después del inventario:** `cloudflare/scripts/importar-datos.mjs`,
`cloudflare/scripts/verificar-datos.mjs`, `cloudflare/tests/importacion.test.mjs`.
**Procedimiento vinculante:** `docs/recuperacion-supabase.md`.

1. Obtener autorización, credencial de respaldo completo y custodia cifrada fuera
   de Git. Inventariar esquema real, Auth, Storage, triggers, cron, permisos,
   consumidores privados y volúmenes. No confundir SQL histórico con estado real.
2. Acordar RPO/RTO, tomar copia completa y restaurar en destino aislado con salidas
   externas bloqueadas desde antes de importar; comprobar conteos, claves y huellas.
3. Convertir a D1/R2 en lotes, con IDs preservados; validar referencias embebidas,
   límites de tamaño y archivos por huella. Time Travel no reemplaza copia externa.
4. Adaptar publicadores privados de precios/extractor y `herramientas/db.mjs`,
   `leads.mjs`, auditorías y vigilancia a la API nueva; sin publicar fuentes privadas.

**Gate:** sin restauración real verificada no hay importación definitiva ni corte.
No dar de baja Auth por ausencia de login web sin revisar consumidores externos.

## Bloque 6: infraestructura y observabilidad, con autorización separada

**Crear/revisar:** configuración de staging/producción separada de la local,
`cloudflare/src/operativa/programados.ts`, `cloudflare/src/telemetria/eventos.ts`,
`cloudflare/tests/programados.test.mjs`, pipeline CI específico.

1. Sólo tras autorización: recursos D1/R2/Queues y secretos de runtime; entornos
   aislados, sin efectos reales duplicados y previews privados/noindex.
2. Reemplazar los tres crons Vercel y jobs PostgreSQL confirmados; conservar un
   vigilante remoto y uno local, no crear otros redundantes.
3. Migrar eventos/lectores del embudo, digest, WAF/alertas y controles predeploy.
   Exportar historial recuperable antes de retirar Analytics Vercel.
4. Medir uso/costo, límites y recuperación con carga representativa. Validar
   regiones/retención y privacidad de leads. No garantizar ahorro por franquicias.

## Bloque 7: corte reversible (no autorizado en esta entrega)

**Crear:** `docs/migracion-cloudflare-corte.md`, con responsables y comandos
específicos de los destinos verificados, no comandos destructivos genéricos.

1. Guardar configuración anterior y copia final; pausar ediciones/ingresos durante
   una ventana acordada. Vaciar o registrar pendientes y sincronizar el delta.
2. Comprobar conteos/huellas y paridad. Desactivar ejecutores anteriores antes de
   activar los nuevos: un escritor y un emisor de efectos, nunca dual-write ingenuo.
3. Cambiar tráfico sólo con autorización DNS/deploy; smoke completo, prueba
   autorizada de lead/aviso/robot y vigilancia. Reanudar escrituras sólo en destino.
4. Ante rollback: pausar destino, exportar/reconciliar nuevas escrituras y estados
   de efectos con claves idempotentes, validar origen, devolver tráfico y activar
   sólo sus jobs. Nunca restaurar una copia vieja encima de leads nuevos.
5. Mantener Vercel/Supabase hasta ventana de estabilidad y recuperación aprobadas.
   Bajas y facturación requieren otra autorización; no son limpieza automática.

**Cierre:** `check` de ambos paquetes, paridad visual/SEO/seguridad, integraciones,
respaldo restaurable, reconciliación ensayada y costo medido. Evidencia sin secretos
en seguimiento y [referencias](../../referencias/2026-10-24-migracion-cloudflare.md).
