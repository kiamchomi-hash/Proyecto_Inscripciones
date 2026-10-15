# Estado de actualización de precios 2027

## Objetivo y autorización
Corregir la selección de carreras y mostrar cuando el relevamiento diario falla o queda incompleto, distinguiendo vigencia de promoción y fecha de publicación. Autorizado por el usuario: «sí corregilo». Trabajo local, sin publicación ni uso de sesiones remotas.

## Tareas
- [ ] T1 Corregir selección CASA con confirmación robusta y pruebas de regresión.
- [x] T2 Persistir resultado de actualización y mostrar advertencia en HTML y panel, con compatibilidad de snapshots anteriores y pruebas.
- [ ] T3 Verificar checks y presentación local, dejando limitaciones explícitas.

## Ruta y controles
Delegada: lógica en varios archivos y preparación para escritura. RED/GREEN cuando haya prueba determinista; no ejecutar cotizaciones autenticadas sin autorización específica. npm run check y pruebas focales comerciales; generación local sin red, revisión visual. Las carpetas comerciales son privadas e ignoradas: nunca agregarlas a git. Otros cambios existentes no se tocan. Main según política del proyecto, sin ramas ni PR. Sin commit automático por política específica de commit sólo a pedido. RDD activo: normalizar antes de preflight; consentimiento nativo si corresponde. Pronóstico 300 líneas propias, generados excluidos; estrategia ask-on-risk.

## Evidencia inicial
Diario de cau-precios.service: fallo de selección C6:D6 en turno tarde15/10 y publicación posterior. Panel verde por existencia HTML. Excluir grupo2027 del bloqueo permite mantener otras instituciones; propagar estado explícito sin ocultar fallo.

## Estado
Exploración finalizada. Próximo: implementación delegada, pruebas offline y revisión independiente. No se garantiza reparar una interacción remota no reproducida; distinguir mejora comprobada de prueba real pendiente.

## Implementación local (15/10/2026)
- T1: recuperación explícita del receptor de teclado y relectura de posición antes de cada apertura; se exige cierre del desplegable y lectura de valor real. RED de contrato observado, GREEN offline. La causa exacta de la interacción remota no está reproducida; prueba autenticada pendiente, no afirmar reparación comprobada de CASA.
- T2: estado privado atómico derivado de PRECIOS/2027; intento actual separado del último éxito, con alcance explícito 1A. Se registra incompleta antes de que otras instituciones regeneren. No se inventó estado exitoso para datos anteriores. HTML incorpora estado y evalúa frescura diariamente en Argentina al abrir, enfocar y cada minuto. Panel online hace lo mismo, muestra promoción vencida separadamente y llama Publicado a la fecha de subida. Supabase toma estado del HTML incluso si el JSON lateral es legado, contradictorio o inválido.
- Pruebas focales: seis archivos pasan, incluyendo estado diario, fronteras de medianoche argentina, metadatos remotos laterales y selección por teclado. Generación offline de vista de revisión exitosa, sin reemplazar el HTML comercial. Script embebido válido y estado desconocido explícito (null).
- npm run check: primera corrida lint sin errores (28 advertencias), typecheck correcto; suite falló en deploy, pre-push, secretos, supabase-local-safety y el mock nuevo de snapshot. Se corrigió el mock y su prueba pasó; segunda corrida final: lint sin errores (28 advertencias), typecheck correcto y suite 55/59 archivos correctos; fallan deploy, pre-push, secretos y supabase-local-safety, fuera del alcance editado. Deploy reproduce spawnSync git EPERM en repositorio temporal; supabase-local-safety no obtiene stderr esperado del subproceso. No se modificaron esos tests ni se omitieron.
- Capturas: Chromium no pudo iniciar por restricción del entorno (sandbox_host: Operation not permitted). Se preparó una maqueta estática del componente admin real con HTML de revisión, sin autenticar ni acceder al sitio; no sustituye una captura del panel online.
- Alcance online: el flujo existente publicar-buscador envía el HTML a /api/admin/buscador y Storage privado. Tras desplegar estos cambios, snapshots sin estado ya no se mostrarán verdes. Para informar un fallo local concreto, el nuevo HTML con su estado debe ser publicado por ese flujo; no se publicó ni se desplegó en esta sesión.
- Próximo paso: verificación independiente, capturas si el entorno lo permite, decisión del usuario para publicar y comprobar una corrida CASA real. Sin commit, push, acceso autenticado ni actualización real de precios.

## Verificación independiente y ajuste de mensaje
Implementación local T1/T2 realizada y pruebas focales verificadas por un segundo agente. T1 no cerrado: no se repitió la selección en CASA con sesión remota. T2 implementada: registro de intento separado, metadatos embebidos autoritativos frente a JSON lateral, avisos de incompleta/sin verificar/desactualizada y promoción vencida independiente en HTML y panel online; fecha argentina recalculada. Sin despliegue, publicación ni éxito ficticio.
T3 parcial: focales y sintaxis pasan, npm run check lint/types correctos (28 advertencias), tests 55/59 archivos pasan; fallan deploy, pre-push, secretos y supabase-local-safety con restricciones ambientales (git EPERM, hooks inaccesibles, Gitleaks no disponible). Chromium/sockets bloquean capturas y prueba de navegador. Preflight RDD falló antes de iniciar mutación: operation_failed al congelar target por filesystem read-only; no hay resultado de revisión ni aprobación.
Usuario aclaró que afecta buscador online /admin y pidió quitar «Referencia de promoción registrada; confirmar cotización final en CASA.» del mensaje. Eliminada la línea únicamente del generador y del HTML local actual; ausencia y sintaxis verificadas. No se publicó la modificación online.
Siguiente: revisión visual/corrida CASA autorizada y despliegue/publicación por decisión del usuario. No tocar otros cambios existentes.

## Preparación autorizada de publicación (15/10/2026)
Usuario autorizó usar las credenciales configuradas de GitHub/Vercel y del panel para publicar; no autoriza en esta etapa enviar newsletter ni ejecutar CASA. Preparación local sin push, deploy ni subida de HTML.
- `npm run check` fuera del sandbox: lint 0 errores y 28 advertencias; typecheck correcto; 453 pruebas aprobadas, 0 fallidas, 0 omitidas. Las restricciones ambientales anteriores no reaparecieron. El AssertionError del fixture de deploy es una comprobación negativa esperada, no un fallo de la suite.
- Focales comerciales: 5 archivos aprobados, 0 fallidos. `tests/ventas-estado.test.mjs`: 1 archivo aprobado. `git diff --check` de superficies propias correcto.
- HTML comercial regenerado offline con la configuración por defecto y `--salida ventas/buscador-carreras.html`. Campo legado `periodo: 2B`, pero ciclo inicial visible 2027 y 70 carreras con `lista2027`. Estado de actualización `null`: se informa sin verificar, nunca éxito. Frase solicitada ausente. Intento explícito `--periodo 1A` rechaza la ausencia de tabla de promociones y no modifica el archivo; no se inventan descuentos.
- Capturas 1280 y 375 obtenidas con Chromium fuera del sandbox, fixture local del componente admin, todas las solicitudes externas bloqueadas. No representan una sesión autenticada online.
- Build no ejecutado: comprobaciones funcionales anteriores aprobadas; compilación completa y despliegue pendientes del agente principal. T1 mantiene prueba CASA pendiente.
- Unidad de rollback: los cinco archivos de panel/estado/pruebas y este documento; excluye formularios, contratos y documentación ajena. Scripts comerciales y HTML ignorados quedan fuera del commit público.
