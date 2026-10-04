# Auditoría técnica: mejorar sin reescribir el sitio

**Fecha:** 02/10/2026. **Base:** `442a95d` más el árbol de trabajo existente, con cambios ajenos sin confirmar. **Alcance:** diagnóstico y recomendaciones; no se modificó la aplicación, la configuración, las dependencias ni la base.

## Conclusión

El proyecto no quedó detenido en las tecnologías de principios de año: el lockfile ya contiene Next.js 16.3.8, React 19.2.4, Tailwind 4.3.3 y Supabase. No hay una razón demostrada para reemplazar Next, Supabase o Vercel. El mayor retorno está en **hacer reproducible el entorno, cerrar errores silenciosos de lectura, tipar el contrato de la base y reducir responsabilidades mezcladas**.

La primera acción no es migrar de framework: **la instalación local ejecuta Next 16.3.3 aunque el lockfile fija 16.3.8**. Las pruebas locales pasaron, pero no prueban el stack fijado en el repositorio. La versión desplegada no se verificó en esta auditoría.

## Prioridades

### Avance posterior del 02/10/2026 (Linux)

Por pedido del usuario de avanzar con la auditoría, se corrigió **A2** en
`app/faq/page.tsx` y `app/clases-apoyo/page.tsx`: ambas lecturas usan
`throwOnError()` antes de construir contenido y JSON-LD. Se mantiene la colección
vacía válida y no se agregaron reintentos ni cambios de caché.

Las dos pruebas nuevas de `tests/resiliencia.test.mjs` fallaron antes de la
corrección y pasan después: cubren errores con `data: null` y `data: []`, además
del éxito con colección vacía. `npm run check` aprobado: 157 tests, cero fallos
y cero omitidos; lint con 27 advertencias y cero errores. `npm run build`
aprobado con Next 16.3.8, FAQ y clases prerenderizadas como páginas estáticas.
**Pendiente para cerrar toda la aceptación de A2:** provocar una lectura fallida
durante revalidación en un preview aislado y verificar que conserva el HTML
anterior. Las pruebas del render y el build no demuestran por sí solos ese caso.

Para **A1**, los manifests instalados en esta máquina de `next`,
`@next/third-parties` y `eslint-config-next` coinciden con el lock en 16.3.8.
No hizo falta reinstalar. Esto no certifica la instalación de Windows ni la
versión del deployment activo. No se modificaron dependencias ni datos, ni se
publicó este cambio.

Guías consultadas: [referencias de esta corrección](../referencias/2026-10-02-fiabilidad-faq-clases.md).

En una segunda intervención se completó **A4**: `lib/auth/exigir-admin.ts`
verifica sesión con `getUser()` y perfil aprobado con rol admin mediante el
cliente anon con cookies. PATCH y DELETE de profesores lo invocan antes de
crear el cliente privilegiado; el proxy conserva su protección. No hay caché
global de permisos ni registro de cuentas desde el helper. Los errores de
verificación impiden escribir. PATCH devuelve 400 para JSON malformado, nulo,
arreglos y cuerpos que no son objetos.

Cuatro pruebas nuevas ejecutan el helper y los handlers reales sin pasar por el
proxy: matriz de autorización, cero clientes privilegiados ante denegación,
operaciones válidas del admin, cuerpos inválidos y errores de escritura.
`npm run check` aprobado: **161 tests**, cero fallos y cero omitidos,
27 advertencias de lint y cero errores. Build aprobado. Estas pruebas usan
dependencias simuladas; no certifican RLS real ni renovación de cookies en un
navegador. No se realizaron escrituras reales ni se publicó el cambio.
[Referencia de autorización](../referencias/2026-10-02-autorizacion-admin.md).

En la tercera intervención se avanzó con **A3, primera etapa**. Se generó
`lib/database.types.ts` mediante la CLI 2.118.0 desde el esquema público real
del proyecto remoto, sin leer filas ni cambiar datos. Se revisó la salida antes
de incorporarla: sólo tipos de columnas, tablas, relaciones y RPC, sin secretos
ni valores comerciales. Los cuatro clientes y el cliente inline del proxy usan
el genérico `Database`. `Campo.columna`/`columnaDe()` quedan ligados al contrato
de insert de consultas y FAQ usa una proyección del tipo generado.

La home y Teclab dejaron de forzar las consultas como `Carrera[]`: usan una
proyección literal inferida y un adaptador de catálogo que normaliza campos
anulables y excluye slides. En el panel se acotó el rol recibido a sus valores
válidos antes de asignarlo al estado. No se modificaron payloads, filtros de
oferta, permisos ni credenciales.

`npm run db:tipos` regeneró correctamente el archivo con la herramienta nueva,
compartida por Windows/Linux. `npm run check` aprobado con **163 tests**, cero
fallos/omitidos, 27 advertencias de lint y cero errores. Typecheck también
comprueba contratos negativos de tablas, columnas, valores y RPC. Build aprobado.
No se probó la regeneración en Windows ni se realizaron escrituras reales.

**A3 sigue abierta:** al cierre de esa primera etapa faltaban adaptadores de
detalle completo y materias, tipar el armado dinámico de consultas y validar JSON.
No se presenta el genérico
`Database` como validación en runtime ni como reemplazo de las pruebas RLS.
[Procedimiento y límites](tipos-supabase.md),
[fuentes](../referencias/2026-10-02-tipos-supabase.md). Cambios locales sin publicar.

En la continuación **A3-D1** se validó el detalle completo de carreras mediante
un adaptador puro. API y página usan proyecciones literales inferidas, sin casts
de `Carrera[]`, y reconstruyen sólo campos públicos. La validación recursiva
cubre las cinco variantes de slides y sus objetos anidados, elimina claves
desconocidas y normaliza opcionales null a ausencia. Se conservan slides null,
listas vacías y filtros de oferta, aplicados antes de validar. Un dato corrupto
visible produce API 502 sin caché pública y error contextual en la página; nunca
una respuesta parcial exitosa. Los errores de validación identifican id y ruta,
sin registrar contenido. No se cambió UI, sitemap ni caché de éxito.

La consulta remota previamente autorizada encontró 89 filas activas visibles
compatibles con esa normalización: ocho `imagen_mobile: null`, una derecha null
y un extras desconocido en la raíz del plan. No hubo escrituras en la base ni
consultas remotas adicionales durante la implementación.

RED observado: el GET real con `materias: 42` respondió 200, cuando la prueba
esperaba 502. GREEN: **11 pruebas nuevas**, más **18 pruebas** en la selección
detalle/catálogo/resiliencia, todas aprobadas. `npm run check` aprobado en el
árbol local con cambios paralelos: **183 tests**, cero fallos/omitidos, typecheck
sin errores y las mismas 27 advertencias de lint fuera de esta unidad.
`git diff --check` aprobado. **Build no ejecutado:** requiere lecturas remotas
de columnas fuera de la autorización acotada actual. Las pruebas simuladas no
certifican caché ISR real ni RLS. Sin commit, push ni publicación.

**Pendiente de A3:** adaptador de materias, armado dinámico de consultas y las
demás fronteras JSON. El detalle de carreras ya tiene validación de runtime;
eso no sustituye las pruebas de integración pendientes.

P1: siguiente intervención, antes de confiar en una nueva publicación. P2: siguiente ciclo de mantenimiento. P3: mejora opcional condicionada a mediciones. Esfuerzos orientativos para una persona familiarizada con el proyecto; incluyen pruebas, no son presupuestos.

| ID | Prioridad | Acción | Impacto | Esfuerzo |
|---|---|---|---|---|
| A1 | P1 | Sincronizar instalación local con el lockfile | Seguridad y reproducibilidad | Menos de medio día |
| A2 | P1 | No convertir fallos de FAQ/materias en páginas vacías | Disponibilidad y contenido indexable | Medio día |
| A3 | P2 | Tipos generados de Supabase y adaptadores por dominio | Evitar errores de columnas y contratos | 1–2 días, gradual |
| A4 | P2 | Autorizar junto a escrituras administrativas privilegiadas | Defensa en profundidad | 1 día |
| A5 | P2 | Alinear soporte de navegadores con Tailwind 4 | Expectativas y compatibilidad móvil | Medio día más validación |
| A6 | P2 | Completar evidencia de integración real ya pendiente | RLS, grants y formularios reales | Depende del entorno |
| A7 | P2 | Separar responsabilidades de formularios/modales | Mantenibilidad y cambios seguros | 2–4 días por etapas |
| A8 | P3 | Medir consultas redundantes y paralelizar lecturas independientes | Latencia de regeneración | Medio a un día |
| A9 | P3 | Evaluar TypeScript 7 y React Compiler por separado | Velocidad de desarrollo/interacción | Pilotos acotados |

Los respaldos y la recuperación de Supabase siguen siendo importantes, pero **ya están en `PENDIENTES.md`**: este informe no crea una segunda tarea ni afirma que se verificaron.

## Evidencia ejecutada y límites

| Comprobación | Resultado de esta sesión |
|---|---|
| Entorno | Node `24.14.1`, npm `11.11.0`, Windows |
| `npm run check` | Código 0, **154 tests aprobados**, 0 fallos, 0 omitidos; TypeScript aprobado; ESLint: **28 advertencias, 0 errores** |
| Duración de `check` | **162,63 s** total; runner de tests: **91,27 s**. Una corrida, no benchmark repetido; lint/typecheck no se cronometraron por separado |
| `npm audit --json` | Código 0, **0 vulnerabilidades informadas** |
| `npm audit --omit=dev --json` | Código 0, **0 vulnerabilidades informadas** |
| `npm outdated --json` | Devolvió diferencias de versiones; no se actualizaron paquetes. Se ejecutó antes del segundo audit en la misma sesión de shell, por lo que no se preservó su código de salida individual |
| Comparación de manifests | Confirmó `16.3.3` instalado para `next`, `@next/third-parties` y `eslint-config-next`; los tres están en `16.3.8` en el lock |
| Fuentes oficiales | Aviso de seguridad de Next del 30/09/2026; documentación de Supabase, Tailwind, React y TypeScript |

**Interpretación de los tests:** incluyen archivos ya presentes sin seguimiento, como `tests/pre-push.test.mjs`; no equivalen a ejecutar sólo el commit `442a95d`. Algunas pruebas del publicador crean repositorios temporales y provocan errores de Git/npm/assert deliberadamente: la suite terminó en verde. No se ejecutó una instalación del proyecto; las instalaciones de fixtures temporales forman parte de esa suite.

**No verificado:** build de producción, despliegue actual, navegador real, accesibilidad interactiva, LCP/INP/CLS, bundle, costos, índices/planes de ejecución, grants/RLS reales, restauración de backups y notificaciones. No se emitieron formularios, analytics ni avisos contra producción. No se inspeccionó material comercial privado ni `contenidos/`.

Las comprobaciones de navegador y producción ya existen como `calidad:web`, `calidad:seo`, `smoke` y las herramientas de vigilancia: no se propone duplicarlas. La evaluación web de este informe es **estática**, no certificación WCAG ni medición de rendimiento.

Incidencias de la inspección: `supabase/config.toml` no existe en la raíz (la configuración de pruebas está en `herramientas/supabase-local/supabase/config.toml`); un intento de leer el subpath exportado `@next/third-parties/package.json` falló con `ERR_PACKAGE_PATH_NOT_EXPORTED`, y se resolvió leyendo su manifest por filesystem. La guía local de autenticación se encontró por su nombre real tras fallar una ruta supuesta. El changelog GitHub de Supabase devolvió un error del lector web; se utilizó la release oficial de 0.12.7. Son límites/errores de inspección, no fallos de la aplicación.

## 1. Estado del stack y actualizaciones

Versiones del **lockfile**, no inferidas de los rangos de `package.json`. La columna disponible viene de la consulta al registro npm del 02/10/2026; no implica compatibilidad probada ni obligación de actualizar.

| Paquete | Lock | Disponible consultado | Recomendación |
|---|---|---|---|
| Next / third-parties / eslint-config-next | 16.3.8 | 16.3.8 | Mantener alineados; reparar instalación local 16.3.3 |
| React / React DOM | 19.2.4 | 19.3.0 | Actualización conjunta, después de estabilizar entorno y con regresión UI |
| Supabase JS | 2.110.7 | 2.117.2 | Revisar changelog y probar auth, consultas y RPC antes de subir |
| Supabase SSR | 0.9.0 | 0.12.7 | Actualización deliberada: `^0.9.0` no cruza automáticamente a 0.12; probar cookies, OAuth y renovación |
| Tailwind | 4.3.3 | Sin diferencia reportada | Conservar; resolver contrato de navegadores |
| TypeScript | 5.9.3 | 7.0.2 | No reemplazar directamente: el harness usa API programática |
| ESLint | 9.39.5 | 10.11.0 | No sumar cambio mayor al de TypeScript; revisar compatibilidad de presets/plugins |
| sanitize-html | 2.17.7 | 2.18.0 | Revisar allowlist y tests del sanitizador; audit actual sin avisos |
| Playwright | 1.61.1 | 1.63.0 | Actualizar junto con navegadores y repetir recorridos existentes |
| sharp | 0.35.4 | 0.35.5 | Revisar changelog; está también forzado por override |
| Analytics / Speed Insights | 1.6.1 / 1.3.1 | 2.0.1 / 2.0.0 | Cambios mayores, baja prioridad sin beneficio identificado; probar sólo local/preview |
| Supabase CLI | 2.118.0 | 2.119.0 | Conservar pin hasta comprobar compatibilidad del fixture local |

También aparecieron actualizaciones menores de `jspdf-autotable`, `pg` y tipos. **No usar `npm update` indiscriminadamente**: mezclar auth, herramientas y UI dificulta aislar una regresión. Mantener `package-lock.json` y `npm ci`, que CI ya utiliza (`.github/workflows/verificar.yml:24`).

### A1. Lock actualizado, instalación local anterior — confirmado

**Evidencia:** `package.json:43–55,70`, `package-lock.json:6495` y lectura directa de manifests instalados. El [aviso oficial de septiembre](https://nextjs.org/blog/september-2026-security-release) identifica 16.3.8 como versión parcheada y describe, entre otros problemas, exposición de información del servidor de desarrollo. El `npm audit` vacío no reemplaza ese aviso ni demuestra que el `node_modules` actual esté corregido.

**Propuesta:** en una intervención autorizada, detener servidores locales del proyecto, ejecutar `npm ci` desde el lock existente y repetir `check` y build. No requiere cambiar versiones en el repositorio. Verificar aparte qué commit/versiones tiene el deployment activo; el desfase local **no prueba** que producción use 16.3.3.

**Aceptación:** los tres manifests instalados coinciden con 16.3.8, instalación reproducible desde lock, `check` y build aprobados. No declarar resuelto con sólo editar `package.json`.

Además, `@types/node` es 25.3.5 mientras CI corre Node 24 (`package.json:65`, `.github/workflows/verificar.yml:22`). Alinear tipos con la línea de runtime elegida y documentar versión de Node para ambas máquinas reduce el riesgo de compilar APIs no disponibles; no se demostró hoy una API incompatible.

## 2. Fiabilidad y contrato de datos

### A2. FAQ y clases convierten errores en contenido vacío — confirmado en código

**Evidencia:** `app/faq/page.tsx:35–44` y `app/clases-apoyo/page.tsx:31–38` toman sólo `data` y usan `data ?? []` sin comprobar `error`. Una respuesta de Supabase con error puede renderizar una página vacía válida. En cambio, home y carreras ya usan `throwOnError`; `tests/resiliencia.test.mjs:40–49` cubre esos casos, no estas dos páginas.

No se informa una caída observada en producción. Es un **camino de fallo confirmado por inspección** y una extensión acotada de la corrección de septiembre, no la afirmación de que aquella corrección no existió.

**Propuesta:** propagar errores de lectura antes de generar HTML/JSON-LD, distinguir colección realmente vacía de consulta fallida y reutilizar reintentos acotados sólo si aportan. No añadir reintentos automáticos a escrituras.

**Aceptación:** pruebas con `{ data: null, error }` rechazan el render; `{ data: [], error: null }` conserva estado vacío legítimo; una regeneración fallida no publica una nueva página vacía como éxito. Confirmar ese último punto en build/preview con el modelo de caché vigente.

### A3. El tipado no llega hasta Supabase — confirmado

**Evidencia:** los cuatro clientes se crean sin genérico `Database` (`lib/supabase.ts:6`, `lib/supabase-auth.ts:4`, `lib/supabase-server.ts:6`, `lib/supabase-admin.ts:12`). `components/index/types.ts:49` declara `Carrera` manualmente, y `app/page.tsx:41` fuerza el resultado con `as unknown as Carrera[]`. El tipo compartido de FAQ también es manual (`lib/types.ts`).

**Propuesta:** generar tipos del esquema autorizado y conectar `createClient<Database>` y equivalentes. Mantener tipos de presentación separados mediante `Pick`/adaptadores, y conservar `casas.ts` como única declaración funcional de formularios. Tipar `columnaDe()` contra las columnas insertables para que un typo falle antes del envío. [Supabase documenta generación e integración del tipo](https://supabase.com/docs/reference/javascript/typescript-support).

**Tradeoff:** los tipos generados exigen refrescarse cuando cambia el esquema y no validan JSON en runtime. El fixture sintético local no representa toda la base: no generar desde él y presentarlo como esquema de producción. Obtener sólo metadatos autorizados, revisar el archivo antes de versionarlo y no incluir datos ni secretos. No hace falta Prisma ni Drizzle para lograr este beneficio.

**Aceptación:** una columna inexistente falla en typecheck; las consultas principales dejan de depender de casts amplios; el contrato de formularios sigue probado; se documenta cuándo regenerar tipos. Esto complementa, no sustituye, las comprobaciones del esquema real y RLS.

## 3. Seguridad: reforzar la frontera existente

### A4. Las escrituras de profesores confían exclusivamente en el proxy — confirmado; no es un bypass demostrado

**Evidencia:** `proxy.ts:59–119` verifica sesión, aprobación y rol; `app/api/admin/profesores/route.ts:6–38` ejecuta PATCH/DELETE con service role sin comprobar al usuario dentro del handler. `tests/accesos.test.mjs` ejercita la matriz del proxy con mocks; existe protección y no corresponde describir la API como pública.

**Riesgo:** al mover una ruta o cambiar el matcher, el handler privilegiado pierde su única autorización. La service role no obtiene una segunda barrera de las policies del profesor. La [guía de Next](https://nextjs.org/docs/app/guides/authentication) recomienda verificar acceso en Route Handlers y centralizar autorización junto a datos.

**Propuesta:** helper pequeño y `server-only` que compruebe sesión + perfil aprobado + rol admin antes de escrituras privilegiadas. Conservar el proxy para navegación; no copiar la lógica en cada handler ni cambiar las escrituras del profesor por service role. Considerar el costo de repetir lecturas de sesión/perfil y deduplicarlas sólo dentro de la solicitud, nunca en una caché pública/global.

**Aceptación:** invocar el handler en pruebas sin pasar por proxy da 401/403 y cero escrituras; admin aprobado funciona; caída de auth/perfil falla cerrada. Añadir JSON inválido/null para PATCH: hoy `request.json()` y el acceso a `body.id` no tienen manejo específico y pueden terminar en error 500 en vez de 400.

Se conservan Turnstile validado en servidor, rate limit, sanitizado, escape de JSON-LD, grants/RLS, `server-only` y Vault. No se confirmó una vulnerabilidad explotable nueva en esta revisión ni se revalidó su configuración real en Supabase/Vercel.

## 4. Frontend, compatibilidad y organización

### A5. Soporte anunciado anterior al que requiere Tailwind 4 — confirmado

**Evidencia:** `package.json:57–61` declara Chrome/Edge 97, Firefox 104 y Safari 15.4; `app/globals.css:4` importa Tailwind 4. Su [matriz oficial](https://tailwindcss.com/docs/compatibility) requiere Chrome 111, Safari 16.4 y Firefox 128. Browserslist por sí solo no convierte todas esas funciones CSS modernas en alternativas antiguas.

**Propuesta:** definir una matriz de soporte real a partir de dispositivos del público y alinear la declaración. Si sostener los navegadores anteriores es un requisito de negocio, elegir fallbacks concretos o un pipeline CSS compatible y presupuestarlo. No bajar todo Tailwind por inercia ni afirmar que ya hay usuarios afectados sin datos.

**Aceptación:** contrato coherente, rutas y formularios probados en la versión mínima elegida y dispositivos móviles representativos. Los navegadores recientes que trae Playwright no demuestran soporte de Safari 15.4.

### A7. Módulos extensos con responsabilidades independientes — oportunidad confirmada

**Evidencia concreta:** `components/index/carousel-modal.tsx` reúne generación PDF (`:134`), `PlanPanels` (`:224`), gestión del modal (`:804`) y render de slides (`:980`). `components/formularios/formulario-lead.tsx` reúne distribución de campos (`:98`), desplegable (`:220`), fecha (`:359`), campo (`:477`) y envío/formulario (`:578`). No es un problema por cantidad de líneas sola: las responsabilidades tienen motivos distintos para cambiar.

**Propuesta de estructura, no archivos creados:**

```text
lib/datos/carreras.ts                 # lectura pública y adaptación de datos
lib/auth/exigir-admin.ts              # autorización privilegiada del servidor
components/formularios/campos/        # fecha, desplegable y campo
components/formularios/use-envio.ts   # estado de envío, errores y captcha
components/index/carrusel/            # paneles y slides, misma presentación
lib/pdf/plan-estudios.ts              # generación cargada dinámicamente
```

`casas.ts`, la taxonomía y los clientes Supabase conservan sus responsabilidades. Extraer de a una unidad con tests y comparación visual; no mover toda la aplicación a `src/`, no crear un monorepo ni imponer capas hexagonales sin un problema concreto.

**Aceptación:** misma UI, foco/Escape/retorno de foco y formularios; sin cambio en eventos, URLs, payloads ni filtros de oferta; PDF se sigue importando bajo demanda. Las marcas de Teclab, Siglo 21 e Identidad no se deben uniformar por el refactor.

### Advertencias y accesibilidad

Las 28 advertencias incluyen dependencias de hooks (`carousel-modal.tsx:252,274,376`, `reserva-clase.tsx:68`), variables sin uso e imágenes nativas. Atender primero hooks con una prueba de cambio de datos; **no añadir dependencias a ciegas** si la identidad cambia cada render. Después retirar código muerto. Las advertencias de `<img>` no prueban LCP malo: medir ruta y visibilidad antes de convertir todo a `Image`.

Ya hay gestión de foco y `aria-modal` en los modales (`career-modal.tsx:66–105,156`, `carousel-modal.tsx:833–884`) y reducción de movimiento en `app/globals.css:167`. Se inspeccionó su existencia, no su comportamiento completo. No reemplazarlos por una biblioteca nueva sin demostrar una carencia; ampliar los recorridos de teclado existentes es menos riesgoso.

## 5. Pruebas y CI

### A6. Completar integración real, no añadir otro framework

**Confirmado:** `check` usa `tests/*.test.mjs` (`package.json:11–12`); `test:integracion` es separado (`:28`). CI ejecuta instalación limpia, escaneo de secretos, check y audit (`.github/workflows/verificar.yml:24–30`). **Vercel sí ejecuta check y build** (`vercel.json:3`), por lo que sería incorrecto afirmar que se despliega sin compilar o validar.

El harness real ya existe en `tests/integracion/supabase.test.mjs` y utiliza Auth/PostgREST/Postgres con protección de destino. Su puesta en marcha sigue pendiente según `PENDIENTES.md` y `docs/pruebas-supabase-local.md`; no se intentó levantar Docker en esta auditoría ni se cerró ese pendiente. El fixture prueba políticas concretas, no equivalencia completa con producción.

**Propuesta:** al retomar el entorno, completar esa suite y registrar evidencia. Después decidir si ejecutarla en un job aislado de CI para cambios en formularios/permisos, con datos sintéticos, sin credenciales ni triggers reales. No introducir Jest/Vitest sólo por ser conocidos: Node test ya permite pruebas de comportamiento y el proyecto las tiene.

**Aceptación:** matriz de anon, pendiente, profesor y admin probada contra la base aislada; inserts HTTP reales; entorno ausente nunca se reporta como aprobado; mismas garantías Windows/Linux.

**Eficiencia:** los 91,27 s de tests justifican medir por archivo antes de tocar el runner. Las pruebas de secretos/publicación crean procesos y fixtures; no son equivalentes a helpers puros. Mantener `check` completo como puerta de publicación y ofrecer selección por dominio para iteraciones locales. No paralelizar suites con recursos compartidos ni reducir aserciones para lograr verde.

## 6. Rendimiento de datos y tecnologías nuevas

### A8. Reducir trabajo de lecturas sin cambiar la caché a ciegas

- **Confirmado:** `app/carreras/[slug]/page.tsx:23–31` carga todas las columnas de carreras activas; metadata (`:284`) y página (`:335`) llaman al mismo helper. **Hipótesis pendiente:** cuántos viajes reales se duplican; Next puede memoizar fetch compatibles. Medir primero y, si corresponde, compartir con `cache()` de React por render; separar detalle de una carrera de la lista ligera usada para relacionados. No afirmar ahorro numérico sin traza. [Modelo de caché de Next](https://nextjs.org/docs/app/guides/caching-without-cache-components).
- **Confirmado:** `app/sitemap.ts:62,91,110,128` espera consultas independientes en secuencia. Se puede evaluar `Promise.all` conservando reintentos, filtros, orden final y propagación de errores. **Tradeoff:** menor latencia potencial, más concurrencia hacia la base; verificar antes/después y no convertir el sitemap a estático, pues su frescura actual tiene un motivo documentado.
- **Confirmado:** home todavía solicita `slides` sólo para derivar `tieneSlides` (`app/page.tsx:30–42`). No viajan completos en RSC, pero sí se transfieren al servidor. Una proyección SQL o metadato mantenido correctamente podría evitarlo si los bytes justifican el cambio. No sumar una columna duplicada sin garantizar consistencia ni aplicar SQL automáticamente.

**Aceptación:** medir consultas/bytes por render frío y regeneración, conservar SEO y revalidación on-demand, y documentar beneficio real. No recomendar índices sin `EXPLAIN` y cardinalidad; no se midió la base.

### A9. Dos pilotos posibles, no una migración conjunta

**TypeScript 7:** es una alternativa real, no una versión inventada: Microsoft publicó la [versión nativa](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) el 08/07/2026. Pero `tests/helpers/cargar-typescript.mjs:3–12` importa `typescript` y usa `transpileModule`. La versión 7.0 no ofrece esa API programática; **reemplazar 5.9 por 7 directamente no es un upgrade compatible de este harness**.

Piloto: evaluar la transición documentada con compilador nativo y API compatible 6 en paralelo, revisar soporte de Next/ESLint/editor y comparar typecheck antes/después. El 10x anunciado por el proveedor no es una estimación para este proyecto. Mantener 5.9 temporalmente es razonable mientras no se haya probado toda la cadena.

**React Compiler:** [React Compiler 1.0 es estable](https://react.dev/blog/2025/10/07/react-compiler-1), y [Next dispone de integración](https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler). Puede reducir memoización manual, pero no resuelve consultas, descarga de imágenes ni contratos de datos. `eslint.config.mjs:34–39` desactiva varias reglas relacionadas con hooks/compilador, y existen warnings de dependencias.

Piloto: corregir primero los casos relevantes y probar opt-in en catálogo o paneles, con perfiles de interacción y comparación de build/bundle. Aceptar sólo si mejora de forma repetible sin regresión funcional. No activar simultáneamente variantes experimentales del compilador y una migración de caché.

**Cache Components / `use cache`:** [existen en Next actual](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents), pero no se recomienda habilitarlos como limpieza cosmética. Cambian el modelo de render/caché y obligan a revisar TTL, invalidación y fronteras de sesión. Aquí ISR + revalidación on-demand ya responde al patrón de contenido; sólo reconsiderar ante una necesidad medida de mezcla estática/dinámica.

## 7. Qué conservar y qué no introducir

- **Conservar** App Router, Server Components, separación de clientes Supabase, RLS, formularios centralizados, taxonomía visible, SQL manual y herramientas `.mjs` multiplataforma.
- **Conservar** `inlineCss: true`: la decisión tiene evidencia A/B propia. No apagarla para reducir el tamaño del HTML sin medir el resultado completo.
- **Conservar** carga diferida de detalles y PDF: `components/index/detalle-carreras.ts:20–36` comparte descarga y permite reintento; PDF ya se importa dinámicamente. No recomendar como nueva una optimización implementada.
- **Conservar** decisiones de indexación, canónicas y redirects. No reactivar carreras dadas de baja ni duplicar landings. Los metadatos/sitemap actuales no equivalen a indexación garantizada.
- **No introducir ahora** otro hosting, ORM, gestor global de estado, monorepo o framework de tests. Agregarían superficie de migración sin solucionar A1–A6.
- **No duplicar** vigilancia, alertas, triggers ni backlog. No contratar OWASP CRS: ya fue descartado con un criterio documentado.

## Plan gradual

1. **Reproducibilidad y fiabilidad:** A1 y A2 en cambios independientes, con nuevas pruebas antes de corregir comportamiento. Confirmar versión del deployment y repetir build/check con instalación coherente.
2. **Contratos y fronteras:** A3 y A4; resolver A5 con evidencia del público. Retomar A6 únicamente cuando se habilite el entorno pendiente; conservar el procedimiento de recuperación ya registrado.
3. **Mantenibilidad:** A7 por unidades pequeñas, conservando presentación y comportamiento. Retirar warnings una vez entendida su causa.
4. **Optimización medida:** A8; después elegir un único piloto de A9 si todavía hay un costo relevante. Mantener el estado anterior disponible para revertir cada cambio.

Este archivo es una propuesta, **no autorización para implementar, actualizar paquetes, publicar o modificar la base**. Las rutas sugeridas no existen todavía. Los hallazgos confirmados describen la fotografía inspeccionada; las hipótesis exigen medición antes de convertirse en tareas de optimización.

Fuentes externas y descartes: [registro de referencias](../referencias/2026-10-02-auditoria-tecnica.md).
