# Auditoría del proyecto — 05/09/2026

**Actualización:** las correcciones locales, verificaciones y el límite pendiente del CSS están en [el cierre de esta auditoría](correcciones-auditoria-2026-09-05.md). El diagnóstico original se conserva debajo.

La base funciona: 58 tests aprobados, typecheck y lint sin errores bloqueantes, 111 URLs del sitemap con respuesta 200 y controles de cabeceras y redirects aprobados. Las mejoras prioritarias son recuperar correctamente las fallas de datos, actualizar dependencias con avisos y corregir accesibilidad de formularios. No hay evidencia en esta revisión de una caída general ni de una vulnerabilidad explotada.

## Alcance y evidencia

- Código local sobre `main`, HEAD `cce440d`, con modificaciones previas ajenas. No se modificó la aplicación ni se hizo commit, push o deploy. Los resultados locales no certifican que esas modificaciones estén publicadas.
- `npm run check`: aprobado, 58/58 tests; lint deja advertencias, entre ellas dependencias de hooks y variables sin uso.
- `npm audit`: 3 paquetes afectados, uno alto y dos moderados. `npm audit --omit=dev`: 2 moderados. Se contrastaron los avisos con los usos del código.
- `npm run smoke`: aprobado; 111 URLs responden 200, cabeceras, noindex y redirects correctos. `/api/admin/profesores` sin sesión devuelve 401 y `/admin` redirige al login con 307.
- Lecturas REST con la clave pública de rol `anon`, `limit=1` y salida sin valores personales: `consultas.id`, `solicitudes_clase.id`, `faq_preguntas.contacto`, `faq_preguntas.titulo` y `profesores.id` respondieron 200 con cero filas. `form_rate_limits` y `career_clicks` devolvieron 401/42501. No se observó exposición de filas; un resultado vacío no prueba que los grants por columna estén revocados como dice la documentación, ni distingue ausencia de datos de filtrado por RLS.
- Barrido de formatos completos de PAT de Supabase, tokens clásicos de GitHub y encabezados de claves privadas en archivos textuales versionados: sin coincidencias. No cubre todo tipo de secreto ni el historial de git.
- `npm run auditar`: 88 carreras visibles, 7 materias activas y 9 novedades publicadas. Único aviso: carrera #132, Estadística Aplicada, próxima a publicarse y sin plan/slides, ya registrada en el backlog.
- `npm run seo -- --rapido`: 411 clics y 25.138 impresiones del 06/08 al 02/09, contra 139 clics y 7.701 impresiones del período anterior. CTR 1,6%, posición media 8,3. No se ejecutó inspección individual de indexación.
- Navegador Chromium mediante Playwright, Next dev en `http://localhost:3100`, datos públicos reales, sin sesión: `/`, `/contacto`, `/faq`, `/teclab`, a 1440×900 y 390×900. Las ocho combinaciones tienen un H1 y ancho de documento igual al viewport. Modal de FAQ comprobado a 390×844. Evidencia local en `.agents/reports/web-quality.json`.
- No se completaron envíos reales, no se enviaron mensajes ni se dispararon eventos contra producción. La service role falta en local. No se auditaron permisos efectivos de la base con sesión, dashboard de firewall, secretos del proveedor ni entrega de Telegram. Tampoco se corrió build, Lighthouse, contraste exhaustivo, zoom o trazas de rendimiento; no se afirma conformidad WCAG ni valores de Core Web Vitals.

## Prioridades

### 1. Fallas de Supabase convertidas en ausencia de contenido — alta

**Evidencia de código:** `app/carreras/[slug]/page.tsx:23` ignora `error` y devuelve `[]` cuando falla la lectura. La página termina en `notFound()` en la línea 311. `app/page.tsx:46` registra el error pero continúa con un catálogo vacío. `app/sitemap.ts` tampoco comprueba errores de sus consultas y puede producir un sitemap parcial.

**Impacto:** durante una falla transitoria de la base, contenido existente puede responder como inexistente o desaparecer de una respuesta exitosa. En regeneración existe el riesgo de reemplazar contenido bueno por una representación vacía. Es un defecto confirmado por flujo de código; no se provocó una caída de la base ni se midió su efecto sobre ISR de producción.

**Mejora mínima:** distinguir lectura fallida de resultado vacío; propagar el error para que falle la regeneración y se conserve la última versión válida cuando corresponda. Verificar con un fallo simulado que una carrera existente no se transforme en 404 ni que el sitemap se publique recortado. Leer la documentación local de Next antes de implementar.

### 2. El detalle del catálogo no se recupera de un error de red — alta

**Evidencia reproducida:** `components/index/detalle-carreras.ts:22` conserva la promesa en una variable de módulo. Tanto un HTTP fallido como un rechazo terminan en `{}`, que queda memorizado. Se ejecutó el módulo real transpileado con un fetch simulado: primera descarga fallida y segunda llamada tras recuperar la red dieron `{}`, `{}` y **una sola petición**.

**Impacto:** los modales pueden quedarse sin temario durante toda la vida de ese módulo en la pestaña, aunque vuelva la conexión. Reabrir la carrera no recupera el contenido.

**Mejora mínima:** conservar sólo resultados exitosos, liberar la promesa al fallar y permitir un reintento acotado. Además, `careers-catalog.tsx:271` actualiza la carrera seleccionada al resolver la descarga sin comprobar si el usuario ya cerró o cambió de ficha: proteger esa actualización. Este segundo caso surge de lectura de código y no fue reproducido en navegador.

### 3. Actualizar tres dependencias con avisos publicados — media, próximo mantenimiento

| Paquete instalado | Parche indicado | Alcance observado |
|---|---|---|
| `sanitize-html@2.17.6` | `2.17.7` | Dependencia de producción. El aviso requiere permitir SVG animado; `lib/sanitize-content.ts` excluye `svg`, `animate` y `set`. No se identificó una entrada explotable con la configuración actual. |
| `fflate@0.8.2` | `0.8.3` | Llega por `jspdf`. El aviso afecta `unzipSync` con ZIP64 malformado; el uso localizado genera PDFs y no importa ZIPs del público. |
| `browserslist@4.28.6` | `4.28.7` | Dependencia de desarrollo a través de ESLint/Babel. Los avisos afectan consultas o estadísticas no confiables; no se identificó ese flujo en la aplicación. |

**Mejora mínima:** actualizar el lock de forma selectiva, revisar diff, ejecutar `check`, build y una exportación de PDF. No hace falta una actualización mayor ni `audit fix --force`.

Fuentes: [sanitize-html](https://github.com/advisories/GHSA-g8qq-57p8-ggw5), [fflate](https://github.com/advisories/GHSA-px8p-9vwx-vf98), [Browserslist](https://github.com/advisories/GHSA-c83g-rgw3-j3cx). Next instalado es 16.3.3, versión parcheada del [release de seguridad de agosto](https://nextjs.org/blog/august-2026-security-release).

### 4. Accesibilidad de FAQ y contacto — media

**Reproducción en navegador:** abrir `/faq`, pulsar «Hacer una pregunta» y cerrar con Escape. Abre enfocando el primer campo y cierra correctamente, pero el foco termina en `BODY`, no en el botón que lo abrió. El diálogo no tiene `aria-label` ni `aria-labelledby`, aunque muestra un título (`components/faq-page.tsx:544`).

En `/contacto`, los cinco campos Nombre, Apellido, Email, Teléfono y Localidad dependen del placeholder y no tienen un `label` asociado (`components/contacto/contacto-page.tsx:171`). El buscador de FAQ tiene el mismo patrón (`components/faq-page.tsx:868`). Los placeholders pueden servir de nombre de respaldo en algunos lectores, pero desaparecen al escribir y no reemplazan una etiqueta persistente.

**Mejora mínima:** guardar/restaurar el foco del disparador, vincular el diálogo a su título y asociar etiquetas a los campos. Verificar con teclado, datos escritos y lector de pantalla. No se propone rehacer los modales ni cambiar la identidad visual.

### 5. Respuestas del endpoint y configuración de captcha — media/baja

**Reproducción local:** enviar el cuerpo `{` con `Content-Type: application/json` a `/api/formularios` devuelve **503**. El `SyntaxError` del JSON cae en el error genérico (`app/api/formularios/route.ts:170,205`), aunque es una solicitud inválida. Confunde errores del cliente con indisponibilidad del servicio.

**Mejora mínima:** responder 400 al JSON mal formado y validar explícitamente el sobre, incluyendo arrays y valores nulos. Agregar pruebas de comportamiento del handler con dependencias simuladas para 400, 403, 429, error de base y éxito; las pruebas actuales de formularios se concentran en helpers y las de seguridad incluyen inspecciones textuales. Mantener esos controles y complementar los casos que hoy no ejecutan el endpoint.

**Riesgo condicionado de configuración:** si falta `TURNSTILE_SECRET_KEY`, el servidor acepta el literal `rate-limit-only`, sin exigir que el entorno sea local. Está documentado, pero una omisión de configuración en producción desactiva silenciosamente el captcha; no se comprobó que falte allí. Acotar el modo de prueba a desarrollo explícito y fallar de forma clara si producción no está configurada. Cloudflare documenta [validación en servidor](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/) y [claves de prueba](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

### 6. El informe SEO confunde renombres con bajas — media

**Evidencia:** `herramientas/seo-semanal.mjs:286` considera baja cualquier slug que no figure entre los actuales. El informe del día atribuye **7 clics** a `/carreras/diplomatura-en-fraude-financiero-y-digital` y afirma que redirige a la home. La consulta real devolvió **301 a `/carreras/diplomatura-en-prevencion-de-fraude-financiero-y-digital`**, una ficha renombrada.

**Impacto:** se excluye tráfico válido y se distorsionan comparaciones antes/después de renombrar URLs. No es un problema del redirect ni una carrera para reactivar.

**Mejora mínima:** resolver alias/redirects y consolidar métricas por destino vigente antes de clasificar las bajas; reutilizar la configuración existente. Separar movimientos de URL de bajas reales.

**Oportunidades comerciales medidas:** Procurador, Cloud Administration y Gestión Contable tienen consultas genéricas cerca de la primera página. Priorizar contenido que responda esas búsquedas y la remedición ya prevista, sin prometer clics ni atribuir el crecimiento global a una edición concreta. No evaluar anticipadamente el experimento de títulos previsto para el 07/09 ni ampliar Identidad Argentina, cuya migración ya está decidida.

### 7. Rendimiento y documentación: mejoras acotadas — baja

La home midió **627,6 KB sin comprimir y 63,2 KB Brotli**. El arranque de la hoja CSS aparece **tres veces**, también con Next 16.3.3. Confirma el pendiente existente; no justifica apagar `inlineCss`, cuyo A/B ya favoreció mantenerlo. El peso transferido por sí solo no demuestra un problema de LCP. Antes de optimizar, medir en un build de producción con condiciones móviles repetibles.

La documentación también necesita una pasada puntual: `CLAUDE.md` describe el sitemap como estático, pero `app/sitemap.ts` usa `force-dynamic`; el final de `docs/seguridad.md` deja evaluar OWASP como abierto aunque `docs/criterios.md` ya dice que no se paga. Son contradicciones capaces de orientar mal una intervención futura. El lint además alcanza material comercial local gitignorado; conviene delimitar qué valida el check portable y qué validan las herramientas comerciales, manteniendo sus verificaciones propias.

## Orden recomendado

1. Corregir fallas de lectura y recuperación de detalles con pruebas de error realistas.
2. Actualizar los tres paquetes y validar la generación de PDF.
3. Corregir foco/etiquetas y errores del endpoint.
4. Consolidar renombres en SEO y eliminar contradicciones de documentación.
5. Continuar las mediciones comerciales y de rendimiento existentes, sin duplicar vigilancia ni abrir una reescritura de arquitectura.
