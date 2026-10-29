# Migración Cloudflare: inventario real y gate de recuperación

## Correo real controlado: autorización limitada, sin ejecución por credencial faltante

Se autorizó máximo tres correos desde staging a un único destinatario registrado
sólo en el run privado ignorado. **Cero intentos/aceptados**, sin evidencia de
entrega. Falta `SMTP2GO_API_KEY` local/proceso/Worker; no se extrajeron secretos de
producción ni se creó una clave/cuenta alternativa. No se abrió egress, rutas de
envío, cron, colas, Telegram, HubSpot o GitHub.

El contrato confirmado no manda correo de aviso de contacto/FAQ/clase ni del
recordatorio: esos canales son Telegram. Los mails existentes de precio y
newsletter requieren precio vigente, y `precios_privados` sigue vacía; no se
inventó ni importó configuración comercial. Remitente SMTP documentado, verificación
actual del proveedor pendiente de credencial legítima.

Pruebas remotas negativas **9/9** (401 o 503 cerrado/noindex/no-store); doce tablas
privadas nuevamente verificadas en cero. Sin cambios al Worker/D1/UI ni deploy.
No se repitió check por documentación/helper privado; 261/261 es histórico de la
etapa publicada. Entrada segura de la clave existente y pasos antes de enviar:
[preparación](../../cloudflare/STAGING-PREPARACION.md#continuación-correo-controlado-autorizado-bloqueado-antes-de-habilitar).
El helper privado de terminal sólo prepara un archivo 0600 y no hace red/envíos.

## Full access MCP: D1 staging público importado

Se resolvió la autorización de herramientas por el signin oficial con Full access.
Inventarios previos D1/Workers vacíos, ajustes Workers `standard`; Access no
habilitado y Billing no consultable por OAuth, sin activarlos ni crear tokens.
Creado D1 exclusivo `cau-staging-20261026-3fb18784`, identidad remota comprobada,
10 migraciones y 112 INSERT públicos parametrizados desde el snapshot existente.
Dry-run del mismo plan en D1 local nuevo aprobado antes de escribir remoto.
Verificación real posterior: **93/7/12/0**, cuatro huellas idénticas al snapshot,
**12 privadas vacías, FK 0, triggers 0**. IDs/evidencia ignorados en
`cloudflare/.local/staging-remoto/`, 0700/0600; no reexportación ni datos privados.

Acceso Basic exclusivo (clave aleatoria sólo por archivo local privado), guardas
anti-producción y wrapper assets/API/errores probados **5/5** en workerd; paquete
minificado exacto, **15 respuestas**. Worker exclusivo ya publicado en
`https://cau-staging-20261026-3fb18784.kiamchomi.workers.dev`, previews apagados.
**26 auth, 121 rutas/SEO, 236 imágenes/huellas y 22 operaciones bloqueadas**
aprobadas remotamente; cuatro capturas escritorio/móvil autenticadas, sin externos.
Lectura D1 posterior conserva las cuatro huellas y doce privadas vacías; cron `[]`.
Fetch operativo rechazado antes de salir; sin colas/envíos/captcha real.
Check completo final **261/261, exit 0**, veinte corridas de suites sin fallos,
cancelaciones ni skips; **116 archivos sin diagnósticos**, build/runtime/paridad
26/26 y E2E 19/19 aprobados. Log/exit en `cloudflare/.local/staging-remoto/`.
No confundir rutas de la aplicación con `/cdn-cgi/*`, reservado e inmodificable
de Cloudflare (trace público, errores de plataforma sin nuestras cabeceras).
Procedimiento, custodia del acceso y límites en
[preparación](../../cloudflare/STAGING-PREPARACION.md#continuación-remota-autorizada-d1-importado-deploy-pendiente).
No se tocó Supabase/Vercel, DNS, pagos, raíz ajena/PENDIENTES ni commit/push.
Las secciones siguientes son el historial de etapas y bloqueos anteriores.

## Nueva autorización de staging remoto: bloqueada por permisos

El usuario autorizó D1 exclusivo, importación del snapshot público existente y
deploy protegido usando Workers Paid existente, sin producción/DNS/envíos ni
compras. La inspección previa no creó recursos: OAuth autenticado sólo con scopes
de lectura; scripts Workers 200 vacío, inventario D1 **401**, Access **403 no
habilitado** y suscripciones **403**. No se presume inventario D1 vacío ni plan
verificado; no hubo importación/deploy/login ni secretos nuevos.

El reintento posterior usa **MCP oficial**, tras el signin del usuario: descubrimiento
de cuentas aprobado (una cuenta), pero inventario D1, scripts y ajustes Workers
fallan con **`requires user authorization`**. No se obtuvieron inventarios ni
plan por MCP. Falta completar esa autorización adicional, no repetir OAuth
Wrangler desde shell. No hay URL ni capturas remotas. Detalle,
evidencia y siguiente paso en
[preparación](../../cloudflare/STAGING-PREPARACION.md#autorización-remota-nueva-y-bloqueo-comprobado).
No se cambió código ni se volvió a correr check; los 256 tests siguientes son
el resultado histórico local, no una certificación remota.

## Continuación local sin autorización remota

Se separó `bindingDb` del requisito de cola para staging: exige etiquetas
`APP_STAGE=staging` / `DB_STAGE=staging`, nombre exclusivo `cau-staging-*` y DB,
rechazando producción, configuración incompleta/contradictoria y EFECTOS.
El entrypoint de preparación sigue **deny-all vacío**, sin habilitación por flags.
Sólo el fixture de ensayo inyecta Astro compilado para servir HTML bajo **503,
noindex/no-store**, CSP cerrada, sin APIs, assets, redirects ni efectos.

La nueva suite usa D1 en memoria `cau-staging-ensayo-<UUID>`, ID propio,
`remote:false`, cron `[]`, sin colas ni persistencia. Carga el snapshot público
93/7/12/0, comprueba huellas/FK/tablas privadas antes y después y seis rutas con
la etapa staging real; prueba además el bloqueo de egreso desde workerd. Cierra
su base propia; no reutiliza ni ensucia el D1 de desarrollo.

Importador protegido: sin opción explícita no escribe; `dryRun:true` sólo valida
y resume sin tocar DB. Destinos remotos/producción rechazados, sin credenciales.
CLI fija `--dry-run` mediante `npm --prefix cloudflare run importar:dry-run`, sin
ejecutor remoto. Guardas con dobles sin red. El ensayo público anterior ahora
también declara explícitamente su permiso de escritura exclusivamente local.

**Pendiente:** siguen sin otorgarse las tres autorizaciones: acceso real y sus
usuarios, D1 remoto exclusivo/costos e importación remota del snapshot público.
No se realizó deploy/dry-run Wrangler, DNS, provisión, pagos, commit/push ni acceso
a `.env.local`. No se modificó `PENDIENTES.md` ni otros cambios ajenos de la raíz.
Detalle y verificaciones: [preparación](../../cloudflare/STAGING-PREPARACION.md#continuación-local-wiring-e-importación-protegida).

Cierre: `npm --prefix cloudflare run check` **exit 0, 256/256**, 19 corridas de
suites sin fallos/cancelaciones/skips; Astro/TypeScript **113 archivos, cero
diagnósticos**, build/runtime aprobados, paridad **26/26**, E2E **19/19**.
`test:staging-local` **4/4**, `test:preparacion` **9/9**, `importar:dry-run` y
`preparar:staging` **exit 0**. Se reprodujo y corrigió el bypass del filtro literal
de APIs por rutas codificadas antes de invocar Astro; no se abrió acceso remoto.
Una corrida previa se cortó a los 120 s del shell, no se contó como aprobada;
la completa corrió sin límite. Evidencia 0600 en
`cloudflare/.local/check-staging-continuacion-final.log`. Diff-check de los 13
archivos propios, incluidos no trackeados, aprobado; veinte huellas de cambios
ajenos versionados intactas. Next no se chequeó por separado: sólo se tocó código
del paquete y esta documentación, no código/configuración de la raíz.

## Continuación: imágenes externas y preparación de staging

El 25/10/2026 se autorizaron lecturas públicas de las diez referencias pendientes
y documentación oficial, más preparación **local** de staging, sin activar nada.
Las diez imágenes respondieron 200, JPEG y decodificaron correctamente, sin
redirecciones: ocho Unsplash y dos ytimg. Se conservaron sus URLs; se agregó sólo
el origen Unsplash a `img-src` del port. Esto resuelve el pendiente de disponibilidad
y CSP señalado en la entrega pública anterior, no concede licencia de redistribución.

Staging separado queda en **deny-all**, 503, noindex/no-store, sin recursos/secretos,
cron o egress. Es barrera y contrato validados, **no un sitio navegable con acceso
real ya configurado**. No se eligió autenticación ni se ejecutó deploy/dry-run.
No se leyó dotenv ni se repitió exportación/importación real.

Evidencia, variables por alcance, guardas y próximas autorizaciones:
[preparación de staging](../../cloudflare/STAGING-PREPARACION.md).
Archivos nuevos: `cloudflare/staging/{preparacion.wrangler.json,worker.ts,denegar-publicacion.mjs,recursos-pendientes.json}`,
`cloudflare/scripts/{preparar-staging,verificar-imagenes-externas}.mjs`,
`cloudflare/tests/preparacion.test.mjs` y `cloudflare/STAGING-PREPARACION.md`.
Medición nueva y separada del snapshot anterior:
`cloudflare/.local/preparacion-staging/imagenes-2026-10-25T22-03-31.902Z.json` (0600),
revalidada a las 22:14 UTC con **10/10** en
`.../imagenes-2026-10-25T22-14-53.514Z.json`. La suite de preparación da **9/9**
y el check completo **252/252, exit 0**. Una corrida previa falló por un 500
transitorio del Next de pruebas en `/sitemap.xml`; la paridad aislada dio **26/26**
y la repetición completa terminó aprobada. No se contó la corrida fallida.

## Cambio de alcance autorizado el 25/10/2026

El usuario decidió **trasladar sólo contenido público y empezar sin historial
privado**. Supabase y Vercel quedan intactos como retorno. Este alcance reemplaza
el gate anterior de respaldo completo **sólo para esta copia pública y su ensayo
local**: no se requieren Auth/Vault/cron, copia completa ni RPO/RTO para hacerlo.
No se afirma que exista un respaldo completo ni se autoriza destruir datos,
publicar recursos, cambiar DNS, desplegar, cortar tráfico o dar de baja servicios.
El procedimiento de recuperación completa sigue siendo referencia para otro alcance.

### Diseño ejecutado

1. Fase remota separada, sólo GET con anon: cuatro proyecciones explícitas,
   filtros públicos, paginación por ID y doble lectura idéntica. No SELECT *,
   RPC, POST, service role ni credencial nueva. Dos variables de conexión
   públicas y la site key pública de Turnstile se leen con `parseEnv`;
   ningún secreto pasa al hijo ni se copia un dotenv.
2. Snapshot público y firmas SEO en `cloudflare/.local/datos-publicos/`, ignorado,
   directorios 0700 y archivos 0600. No son dumps PostgreSQL ni recuperan servicios.
   La site key pública queda sólo en el manifiesto local para reproducir SSR;
   no hay secret key y el navegador bloquea el script/captcha remoto.
3. Fase local con red externa bloqueada antes de iniciar workerd/importar.
   D1 nuevo con UUID propio por ensayo, sin cron, Queues, servicios, R2 remoto
   ni credenciales; no se toca `.wrangler/state` compartido. Se cierra al terminar.
   Un batch parametrizado atómico conserva IDs y valores públicos. Repetir el
   mismo snapshot es no-op; un destino distinto/ocupado se rechaza sin borrarlo.
4. Conteos y SHA-256 por tabla, claves/FK, ausencia de triggers y de históricos;
   comparación del sitemap/HTML contra lecturas del sitio publicado. Se mantienen
   canónicas `https://www.siglo21sur.com`, fechas, slugs y orden de dominio.

### Cobertura de la exportación pública real

| Tabla | Columnas explícitas | Filas |
|---|---:|---:|
| carreras | 21 | 93 |
| materias | 17 | 7 |
| novedades | 13 | 12 |
| faq_preguntas | 10 | 0 |

Las listas exactas están en `cloudflare/scripts/datos-publicos.mjs` y en el
manifiesto local. Carreras: proyección pública compartida más fechas, sin
`descuento_especial` ni `area` interna; sólo activas de oferta visible.
Materias: ficha pública compartida, indicadores y fechas; los nombres/contactos
docentes son los que la ficha pública ya muestra, **no** la tabla profesores.
Novedades: sólo `publicada=true`, con texto, fecha, slug, fijada e imagen.
FAQ: sólo aprobadas, destacadas y de modo público, sin contacto ni nombre_contacto.
El cero es el resultado de estos filtros y permisos anon, no prueba que no haya
preguntas privadas o pendientes. No se exportó ninguna.

Las FAQ sintéticas prueban cómo conservar contenido si aparece: `contacto` se
guarda vacío por la restricción NOT NULL heredada, explícitamente sin trasladar
el dato ni inventar una dirección; no cambia la validación de futuros formularios.
Materias/FAQ normalizan timestamps a milisegundos ISO para las CHECK de D1;
no se reemplazan por la fecha de importación. Carrera/novedad conservan las fechas
originales. Los SHA-256 comparan la misma representación normalizada en ambas fases.

No se exportan consultas, solicitudes, suscriptores, precios privados, reservas,
enlaces personales, robot, infraestructura histórica, Auth, profesores privados,
Vault ni secretos. La diferencia CASCADE/NO ACTION de solicitudes no interviene
en este traslado: no se importan solicitudes ni se cambia esa migración histórica.

### Discrepancias SEO encontradas y cambio mínimo

La primera comparación real encontró dos omisiones del port en
`cloudflare/src/entrega/carrera-seo.ts`: el título específico de Cloud Administration
y la descripción específica de Gestión Hotelera. Se copiaron literalmente de
`app/carreras/[slug]/page.tsx`, sin redacción ni optimización nuevas. Una prueba
de regresión contrasta ambos bloques contra la fuente actual de Next.

Los cuerpos de redirects no se comparan como páginas: se verifican status y
Location. El 404 mantiene 404 y noindex; su cuerpo sigue vacío, diferencia conocida
del prototipo, no se presenta como página pública equivalente a la de error de Next.

**Indexación y staging:** no se quitaron guardas para pasar pruebas. La versión
4G ya declara política por ruta, sin noindex global (`robotsDeRuta`); este ensayo
comprueba esa política y las metas HTML. Corre exclusivamente en loopback.
No hay un staging remoto configurado: antes de crearlo debe asegurarse su acceso
privado/noindex de entorno, sin confundir la política canónica de producción con
permiso de publicar este paquete. El corte continúa requiriendo autorización.

### Reproducir sin tocar producción

Desde la raíz:

```sh
npm --prefix cloudflare run exportar:publico
npm --prefix cloudflare run verificar:publico
npm --prefix cloudflare run test:importacion
npm --prefix cloudflare run check
```

`exportar:publico` es la única fase con red remota autorizada: guarda un lote nuevo,
nunca sobreescribe el snapshot anterior. `verificar:publico` toma el último lote
completo por un puntero interno validado; no admite rutas, flags ni destinos remotos.
Comprueba las huellas antes de importar y conserva un informe nuevo/capturas.
No hay un comando de publicación ni una importación al estado del servidor compartido.

### Resultados finales de la continuación pública

- `npm --prefix cloudflare run exportar:publico`: **exit 0**, dos lecturas completas
  iguales, 93/7/12/0 filas con las proyecciones anteriores. Dos exportaciones reales
  separadas dieron las mismas huellas. No se eligió un punto RPO/RTO ni se produjo
  un respaldo privado/completo.
- `npm --prefix cloudflare run test:importacion`: **exit 0, 10/10**, sin skips.
  Cubre paginación de 253 filas, truncamiento/repetición, allowlist, IDs/rutas,
  rechazo de claves privilegiadas y GET de handlers, flags remotos, FAQ sin
  contactos, destino ocupado, idempotencia y rollback atómico. Red externa
  bloqueada en las pruebas. No hubo cambio de esquema: los upgrades existentes
  también se ejercitaron en el check completo.
- `npm --prefix cloudflare run verificar:publico`: **exit 0**, ensayo nuevo y
  cerrado al finalizar, cuatro conteos/huellas idénticos, IDs conservados,
  `foreign_key_check` vacío, cero triggers, **12 tablas privadas vacías** y cursor
  de outbox inicial sin trabajos. Se repite la comprobación después de las capturas:
  éstas sólo admiten GET/HEAD locales y bloquean telemetría POST y todo host externo.
- Sitemap: **115/115 URLs**, ninguna faltante/extra ni diferencia de fechas o
  imágenes. HTML: **121 respuestas** (115 entradas y seis sondas) sin diferencias
  en los campos comparados de páginas 200: title, description, canonical, robots,
  JSON-LD parseado/escapado, texto principal, enlaces internos e imágenes
  normalizadas; status/Location exactos en redirects/404. `robots.txt` coincide.
  No se comparan byte a byte CSS/HTML ni cuerpos de error/redirects.
- Media: **236/236 referencias autorizadas** respondieron 200 en el sitio,
  coinciden por SHA-256 con archivos seguidos por Git en `public/` y se sirven en
  el build local con las mismas huellas. Seis referencias (tres archivos con coma,
  repetidos) requieren la normalización 307 de Workers Assets: se despachan dentro
  del harness HTTPS canónico, nunca siguiendo el Location por red.
- Se observaron **10 referencias externas sin consultar**: ocho de
  `images.unsplash.com` y dos de `i.ytimg.com`. No se hicieron pedidos a esos
  hosts. Se preservan sus URLs y se abortan en las capturas; su disponibilidad
  no está certificada. Además, la CSP actual del port no permite Unsplash:
  resolver la entrega de esas imágenes antes de publicar sigue pendiente.
  No se listaron buckets ni se infirió que Storage esté vacío. No aparecieron
  objetos Storage públicos referenciados en el material relevado; eso no constituye
  un inventario de objetos ajenos a estas referencias.
- `npm --prefix cloudflare run check`: **exit 0, 243/243**, cero fallos,
  cancelaciones o skips; Astro revisó 112 archivos con cero diagnósticos.
  Build/runtime aprobados, paridad 26/26 y E2E 19/19. Persisten los avisos de
  PostCSS conocidos de imports tardíos en hojas compartidas; no se cambiaron.
  No se repitió el check de Next: no se cambió código/configuración de la raíz.

Incidencias de ejecución, no de cuota: el primer test nuevo tenía invertidas
las columnas del fixture de rate limit y se corrigió con nombres explícitos.
La regresión SEO se reprodujo antes de copiar los dos bloques faltantes.
Un primer ensayo usó el build anterior y mostró aún esos metadatos; el ensayo
posterior usa el build actualizado y coincide. Una corrida completa falló porque
se lanzó un build separado mientras `entrega` leía `dist/` (ENOENT); se repitió
**todo el check en serie, sin builds concurrentes**, y terminó aprobado.

### Artefactos locales y capturas

Lote definitivo, relativo a la raíz (ignorado, directorio 0700; archivos 0600):

```text
cloudflare/.local/datos-publicos/2026-10-25T21-06-38.465Z-7b467d4b-9c5c-4183-a525-a211e8285664/
  snapshot.json
  manifest.json
  fuente-seo.json
  verificacion-2026-10-25T21-19-40.019Z.json
  captura-home-escritorio-1792963169874.png
  captura-home-movil-1792963177521.png
  captura-carrera-escritorio-1792963176136.png
  captura-carrera-movil-1792963178909.png
```

El manifiesto registra inicio/fin, cobertura, columnas y huellas; el informe
registra destino efímero, cero intentos de red externa de la aplicación, integridad,
comparaciones y capturas. La guarda externa se probó antes de crear/importar.
Registro del check: `cloudflare/.local/check-publico-final.log`, también 0600.
Los ensayos/exportaciones anteriores se conservan separados como evidencia local,
no se mezclan ni publican. No se hizo una comparación visual contra producción
con navegador: las capturas son del D1 real local, con terceros bloqueados; el
check E2E compara visualmente contra Next local con fixtures sintéticos.

### Alcance que sigue pendiente

**La copia pública local y la paridad SEO comparada están comprobadas; la
migración productiva no está terminada.** Las diez imágenes externas tienen
disponibilidad y decodificación comprobadas; si se copian a otro almacenamiento
falta revisar su licencia. Staging tiene barrera y contrato **fail-closed**, pero
no acceso real ni recursos: elegir el mecanismo de autenticación y crear D1/Queues
requiere la próxima autorización. Configurar servicios/secretos, Turnstile servidor,
mail/Telegram/HubSpot/robot y analítica queda para el alcance futuro autorizado.
Los precios privados **vigentes** de «Ver precio»
son configuración comercial, no historial prescindible: no se trasladaron y no se
inventaron. Sus publicadores y futuras integraciones requieren trabajo aparte.
No se acredita envío ni operativa productiva con este ensayo.

No se tocaron Supabase/Vercel, DNS, pagos, recursos Cloudflare, servicios remotos,
`PENDIENTES.md`, cambios ajenos, ni se hizo commit/push. Archivos propios nuevos:
`scripts/{datos-publicos,exportar-datos,importar-datos,verificar-datos}.mjs` y
`tests/importacion.test.mjs` dentro de `cloudflare/`; modificaciones acotadas al
runner/package, dos metadatos del port y documentación de alcance. Snapshot/datos
no entran al build ni a Git. Revisión final de los 12 archivos propios sin
espacios finales, rutas absolutas ni los patrones de secretos comprobados;
29 enlaces locales válidos y permisos de artefactos 0700/0600 comprobados.
Fuentes: [referencias del traslado público](../../referencias/2026-10-25-cloudflare-contenido-publico.md).

El inventario siguiente es **antecedente del alcance completo descartado para
este traslado público**, no un bloqueo reintroducido.

## Inventario anterior al cambio de alcance (25/10/2026)

**Bloque 5 parcialmente relevado; gate NO aprobado.** Se consultó la fuente
real con `cau_editor`, exclusivamente en lectura. No se obtuvo un respaldo,
ni siquiera parcial, ni se restauraron datos reales. No se inició conversión
a D1/R2, importación definitiva ni corte.

La autorización de esta continuación permite inventario, copia y ensayo local
aislado; no reemplaza los requisitos de credencial completa y custodia de
[recuperación de Supabase](../../docs/recuperacion-supabase.md).

## Procedimiento y evidencia de acceso

- Fuente identificada comparando en memoria el proyecto de la URL pública
  configurada con el host/usuario de `EDITOR_DATABASE_URL`: coincidencia positiva.
  No se registraron cadenas de conexión ni valores de entorno.
- `.env.local` se leyó con `node:util.parseEnv`; nunca mediante `source` ni se
  copió al paquete Cloudflare. Cliente `pg` existente, certificado local de
  Supabase y `rejectUnauthorized: true`.
- PostgreSQL **17.6**; identidad comprobada `cau_editor`, sin superusuario,
  `BYPASSRLS` ni creación de roles. `transaction_read_only = on`.
- Tres conexiones secuenciales, cerradas al finalizar. Transacciones de lectura
  y `ROLLBACK`; las dos últimas, `REPEATABLE READ`. Timeout de conexión 10 s,
  de consulta cliente 12 s, de sentencia 8 s y de espera de bloqueo 1 s.
- Foto de conteos: **2026-10-25 20:41:32.418 UTC**. No representa un punto de
  respaldo: las consultas de las otras conexiones tienen snapshots diferentes.
- No se ejecutaron funciones de aplicación, comandos cron, escrituras, pruebas
  de formularios, envío de avisos ni SQL histórico en la fuente.

## Inventario comprobado por catálogo

Tamaño de la base observado: **17.321.107 bytes**. Es espacio PostgreSQL,
no tamaño de dump, archivos Storage ni costo futuro D1/R2.

### Tablas de `public`

Las 18 tienen RLS encendido y una PK declarada. Se observaron **193 columnas,
45 restricciones y 33 índices**. Los conteos siguientes son exactos para las
filas visibles por el rol, no acreditan por sí solos cobertura total bajo RLS.
No se extrajeron filas, correos, teléfonos, precios ni legajos.

| Tabla | Columnas | Filas visibles contadas |
|---|---:|---:|
| career_clicks | 4 | 1809 |
| carreras | 23 | 139 |
| consultas | 34 | 116 |
| descuentos | 7 | No contado |
| enlaces_inscripcion | 5 | No contado |
| faq_preguntas | 12 | No contado |
| form_rate_limits | 3 | No contado |
| materias | 17 | 7 |
| novedades | 13 | 72 |
| plantillas_mensajes | 5 | No contado |
| precios_carreras | 12 | No contado |
| precios_meta | 16 | No contado |
| precios_privados | 7 | 83 |
| profesores | 8 | No contado |
| reservas_mail_precio | 3 | No contado |
| robot_autoinscripciones | 7 | No contado |
| solicitudes_clase | 8 | No contado |
| suscripciones_newsletter | 9 | No contado |

`pg_class.reltuples` se consultó para dimensionamiento, pero no se usó como
conteo: hubo valores `-1` y estimaciones distintas de los conteos efectivos.

### Diferencias importantes respecto del prototipo

- `faq_preguntas.estado` tiene default `'pendiente'::text` y `destacada`, `false`:
  confirma los defaults provisionales del lote 3B.
- `solicitudes_clase.materia_id → materias` tiene **ON DELETE CASCADE**, no el
  `NO ACTION` provisional del lote 3C. Se registra para la conversión posterior;
  no se alteraron las migraciones locales durante este relevamiento.
- Otras FK comprobadas: enlaces → consultas, precios privados → carreras,
  reservas → carreras y robot → consultas con CASCADE; profesores → materias
  con SET NULL y → `auth.users` con CASCADE; newsletter → carreras con NO ACTION.
  Las ocho FK están validadas en catálogo. Esto no es una prueba de restauración
  ni un cotejo fila por fila de relaciones.

### Funciones, triggers y automatismos

- Diez funciones en `public`/`private`: `current_user_is_admin` (private),
  `check_faq_rate_limit`, `check_form_rate_limit`, `check_solicitud_rate_limit`,
  `notify_edge_function`, `notify_revalidar`, `registrar_click_carrera`,
  `reservar_mail_precio`, `rls_auto_enable`, `update_updated_at`.
- Trece triggers de tabla propios en `public`, todos habilitados (`O`):
  tres de aviso, cuatro de revalidación, cuatro de actualización de fecha
  y dos de límite de FAQ/clases. No hay duplicados en las siete conexiones
  tabla/función de aviso y revalidación esperadas.
- Siete triggers no internos adicionales en `storage`, habilitados; ninguno
  observado en `auth`. Siete event triggers habilitados, incluidos `ensure_rls`,
  los grants de extensiones y los watchers de PostgREST.
- Extensiones: `http 1.6`, `moddatetime 1.0`, `pg_cron 1.6.4`, `pg_net 0.19.5`,
  `pg_stat_statements 1.11`, `pgcrypto 1.3`, `plpgsql 1.0`,
  `supabase_vault 0.3.1`, `uuid-ossp 1.1`.
- Una publicación, `supabase_realtime`, no de todas las tablas, habilitada para
  INSERT/UPDATE/DELETE/TRUNCATE. No se inventariaron sus miembros en esta pasada.
- Existen `cron.job` y `cron.job_run_details`. **No se verificaron jobs,
  horarios, comandos ni ejecuciones**: falta USAGE de esquema. Aunque el
  privilegio SELECT de tabla devuelve true, acceder responde **42501**.
  Los jobs citados por documentación no se presentan como inventario real actual.

### Grants y RLS

Se consultó la matriz SELECT/INSERT/UPDATE/DELETE para `anon`, `authenticated`
y `cau_editor` sobre las 18 tablas, y metadatos de policies: **23 en public,
6 en storage, 31 en total de la base**. También se contaron 33 roles; no se
exportaron roles, membresías, contraseñas ni ACL globales completas.

- `cau_editor` tiene SELECT de tabla en las seis tablas contadas. En FAQ tiene
  SELECT por columna en 10 de 12 campos, no en `contacto`/`nombre_contacto`.
- INSERT denegado por grant a `anon` y `authenticated` en las tres tablas de
  formularios. EXECUTE denegado a ambos sobre `notify_edge_function`,
  `notify_revalidar` y `rls_auto_enable`.
- Los grants reales de tabla no coinciden literalmente con algunas
  simplificaciones documentales: `anon` conserva SELECT de tabla en consultas,
  FAQ y solicitudes, condicionado por RLS; `authenticated` no tiene UPDATE de
  tabla en materias aunque exista `materias_approved_update`. No se probaron
  escrituras ni se cambió ningún permiso. Un grant o el nombre de una policy
  no demuestra autorización efectiva: falta validar roles/sesiones en el restore.

### Auth, Storage, Vault y servicios

Se enumeraron por catálogo 27 tablas de Auth, 8 de Storage y `vault.secrets`.
`cau_editor` no tiene USAGE de esos esquemas ni lectura de sus tablas.
Las comprobaciones mínimas `count(*)` sobre `auth.users`, `storage.objects`
y `vault.secrets` respondieron **42501**, sin devolver filas. Se recuperó la
transacción mediante SAVEPOINT y se cerró con ROLLBACK.

Por tanto quedan **sin verificar** usuarios/identidades/factores Auth, configuración
actual de proveedores/SMTP/redirects, buckets, objetos, tamaños y huellas de
archivos, material criptográfico de Vault y configuración/secretos desplegados de
Edge Functions. La revisión de dashboard del 21/10 es antecedente documental,
no observación nueva. No se puede retirar Auth por haber eliminado el panel web.

### Consumidores: cobertura y límites

- Código vigente consultado con CodeGraph: clientes público y administrativo,
  `herramientas/db.mjs`, `leads.mjs` e `integraciones.mjs`. Los tres últimos usan
  la conexión del editor; no se ejecutaron sus operaciones de negocio.
- Lecturas SSR/API y Edge Functions siguen siendo consumidores declarados por
  el proyecto. No se ejecutaron los handlers ni se probaron sus efectos reales.
- Búsqueda acotada en 132 archivos `.mjs` privados de `herramientas/ventas`,
  sin ejecutar ninguno ni divulgar contenido: usos de API Supabase en
  `extraer-planes-siglo21.mjs` y `publicar-precios-siglo21.mjs`; conexión editor en
  `publicar-precios.mjs`. No hubo coincidencias de `.auth.`/`.storage.` allí.
  No se modificaron ni versionaron esas fuentes privadas.
- Búsqueda complementaria de llamadas `.auth.`/`.storage.` en fuentes visibles:
  coincidencias Auth en pruebas de integración, no en la aplicación vigente.
  Ausencia de coincidencias no prueba ausencia de clientes HTTP externos.
- `pg_stat_activity` mostró conexiones agrupadas de `authenticator`, `pgbouncer`,
  `postgres`, `supabase_admin` y la conexión propia del editor. La visibilidad
  restringida oculta detalles; no acredita ausencia de consumidores apagados,
  robots u otras máquinas. Inventario externo pendiente de confirmación.

## Huellas de metadatos, no respaldo

Se calcularon SHA-256 en memoria sobre `JSON.stringify(rows)` del cliente `pg`,
con orden estable por tabla/posición, tabla/nombre, tabla/índice, esquema/tabla/policy
y esquema/función/argumentos respectivamente. Se incluyen definiciones, defaults,
predicados y configuración/ACL de funciones sólo en el cálculo; no se imprimieron
ni guardaron sus cuerpos. No son huellas de datos ni un artefacto restaurable.

| Proyección de catálogo | Registros | SHA-256 |
|---|---:|---|
| Columnas public, tipos, nulabilidad, identidad, defaults | 193 | `9652fecfe6de074fdda088fb0515b4e5331c9279fa1bb064df0188fe4c7f75b0` |
| Restricciones public y definiciones | 45 | `37b7d3f11523e2934a7a83fc4379dfb643a5b0305084957434c1573aed7f97c1` |
| Índices public y definiciones | 33 | `ba043d926fde9620cef1af7cd3d9504d9a090415b37b2ba2832786d6478a8249` |
| Policies public/storage y expresiones | 29 | `9021b8673769d7d9bea252b577f84f01b698268db1f963294966b6a642af383f` |
| Funciones public/private, cuerpo, configuración y ACL | 10 | `3717bafe08f4d1b75d54ecf8024a0cef339dcfc8ffba9fb5dc870ee02c61f0ac` |

## Bloqueos de respaldo y ensayo

1. **Credencial incompleta.** Entre las variables configuradas comprobadas sólo
   existe `EDITOR_DATABASE_URL`; ausentes `DATABASE_URL`, `SUPABASE_DB_URL`,
   `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`.
   No hay archivo de token en las dos ubicaciones convencionales comprobadas
   de la CLI Supabase. No es un barrido de gestores privados ni de toda la máquina.
   La denegación real de acceso confirma que este rol no sirve para copia completa;
   no se intentó elevarlo, obtener claves privilegiadas ni eludir permisos.
2. **Custodia pendiente.** El procedimiento exige copia cifrada fuera del repo,
   clave separada, responsable, retención y acceso registrados. No hay destino ni
   destinatario criptográfico acordados en los documentos leídos. No se inventaron:
   no se creó un dump en claro, un export parcial ni un archivo privado ignorado
   como sustituto de custodia. RPO/RTO siguen sin acordarse.
3. **Destino no iniciado.** Docker responde y no mostró contenedores en ejecución.
   Está disponible localmente `public.ecr.aws/supabase/postgres:17.6.1.171`
   (ID `658d1c9b09ae`). No hay `pg_dump`, `pg_restore` ni `psql` en PATH del host;
   eso no implica que falten en la imagen, que no se arrancó. GPG está instalado;
   `age` no se encontró. No se descargó nada ni se reutilizaron/borraron recursos.

**Restauración real: no realizada.** Sin copia completa y custodia definida,
no corresponde arrancar un ensayo parcial para presentarlo como gate aprobado.
Tampoco se ejecutó de nuevo el ensayo sintético de octubre.

## Próximo paso exacto

Definir con el responsable la custodia cifrada (destino privado fuera del repo,
destinatario/clave separada, responsable, acceso y retención) y RPO/RTO; aportar
por medio privado autorizado la credencial de respaldo completo, nunca en chat
ni en Git. Después verificar su alcance antes de copiar DB/roles/Auth y objetos
Storage, con recuperación privada de configuración y Vault según su método.

Sólo entonces preparar un contenedor nuevo identificable y efímero sin red
(`--network none`), sin puertos publicados, con cron/background workers y salidas
inhabilitados desde antes de importar. Estudiar el dump y seleccionar previamente
qué funciones, triggers, event triggers, jobs y secretos no se activarán. No basta
con desactivar triggers durante INSERT. Probar integridad, conteos, PK/FK, huellas,
RLS con roles y archivos/Auth/Vault; registrar tiempos reales y limpieza propia.
La restauración PostgreSQL y la posterior conversión a D1/R2 son gates distintos.

## Archivos y verificaciones de esta continuación

Único archivo creado: este seguimiento. Se preservaron los cambios ajenos,
incluidos `PENDIENTES.md`, documentación, componentes y todo `cloudflare/`.
No se cambió código, scripts, dependencias ni configuración; no corresponde
presentar `npm run check` como prueba de recuperación y no se volvió a correr.
Las verificaciones fueron lecturas reales, ACL, denegaciones controladas,
catálogos, conteos, huellas de metadatos y disponibilidad local de herramientas.
No se generaron artefactos con datos privados, ni se hicieron commit/push/deploy.
Revisión documental aprobada: whitespace sin errores, diez enlaces locales
existentes y sin rutas absolutas ni los patrones de credenciales comprobados.

Fuentes locales: [criterios](../../docs/criterios.md),
[recuperación](../../docs/recuperacion-supabase.md),
[rol editor](../../docs/rol-editor.md),
[variables](../../docs/variables-de-entorno.md),
[herramientas](../../docs/herramientas.md),
[seguridad](../../docs/seguridad.md),
bloque 5,
[paquete local](../../cloudflare/LEER.md) y
[seguimiento de paridad](../../cloudflare/SEGUIMIENTO-4C.md).
La continuación de inventario no consultó fuentes web nuevas; la de staging sí
revisó la documentación oficial enumerada en
[referencias](../../referencias/2026-10-25-cloudflare-staging.md).
