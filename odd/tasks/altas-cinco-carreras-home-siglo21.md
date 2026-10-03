# Publicar cinco carreras en la home y sus fichas

## Objetivo

Dar de alta pública Antropología Organizacional, Administración Hotelera, Ambiente y Energías Renovables, Hidrocarburos y Geociencias, y Administración de Infraestructura Tecnológica. Las rutas dinámicas existentes generan sus páginas y la home desde Supabase.

## Autorización

Usuario autorizó consultar y cargar únicamente estas cinco en el Supabase de siglo21sur.com usando EDITOR_DATABASE_URL con cau_editor. No usar service role, otras sesiones, ni publicar código ajeno. Sin cambios al buscador previamente publicado, precios o Teclab. La autorización específica permite este canal para las cinco, sin generalizarlo a otras operaciones.

## Tareas

- [x] T1: preparar payloads oficiales con tres slides, validar planes, slugs, títulos e imágenes.
- [ ] T2: aplicar transacción limitada, comprobar cinco filas y páginas públicas, y entregar capturas escritorio/móvil.
- [x] T3: retirar la redirección antigua de Hotelera, publicar únicamente esa corrección y comprobar las cinco páginas directas.

T2 aplicada en Supabase: COMMIT confirmado del SQL corregido, cinco payloads activos coincidentes (77, 63, 18, 240 y 241). Home y sitemap contienen las cinco. La comprobación inicial encontró cuatro páginas con 200 directo y Hotelera con 301 a la home por next.config.ts. La corrección aislada de Hotelera fue publicada en el commit bb1ececaa3abd5ab128c42dd3ffe40f18969b99f y la página responde 200 directo. Capturas pendientes; no se repite la carga SQL.

T3 autorizada explícitamente por el usuario: usar acceso GitHub configurado de este repo para publicar sólo la corrección, sin cambios ajenos. Ruta delegada por preparación y prueba. Checkout limpio y separado, HEAD remoto 13bbfbd6fb60dc2ed09a76c000abc89fe052d3bc, bajo el directorio de worktrees del usuario. No ramas ni PRs; commit separado y push acotado a main sólo si la base remota sigue coincidente, sin force. No publicar los commits locales de SQL, fixtures o documentos con otros trabajos. Estimación menor de 100 líneas authored. Mantener redirecciones de otras carreras y expectativas vigentes de vigilancia.

## Preflight comprobado

Rol cau_editor con SELECT, INSERT, UPDATE y secuencia; sin DELETE. Tabla carreras con 23 columnas, PK por id y sin UNIQUE por nombre. RLS activo y triggers existentes de revalidación y updated. Filas inactivas: Infraestructura ID18, Hotelera ID63, Antropología ID77. Dos INSERT: Ambiente y licenciatura Hidrocarburos. NO modificar tecnicatura Hidrocarburos ID97. Baseline de filas y huella guardados por explorador en Engram#565; guardas contra modificaciones concurrentes antes de escribir.

## Ruta y restricciones

Delegada por fuentes, múltiples payloads y verificación remota. Una unidad coherente. Forecast de código propio menor de 200 líneas, datos académicos de fixture/SQL generados desde fuentes excluidos del conteo de líneas authored. Estrategia ask-on-risk. Trabajar en main según proyecto, no ramas ni PR. Ningún push que incluya cambios ajenos. No modificar componentes/styles/taxonomía ni rutas salvo nueva autorización: se utiliza presentación vigente y sus categorías actuales.

Slides portada (dos bullets, badges título/área), plan completo de cuatro años con extras, cierre explícito. Sin precios/fechas/instrucciones internas ni100%virtual. Fuente pública por carrera y fecha03/10/2026. Infraestructura sin intermedio inventado. Hotelera usa fallback genérico: la foto específica contiene marca UMOV ACADEMY, decisión confirmada por padre; reutilización temáticaHidrocarburos; fallback genérico existente para restantes sin imagen específica. Revisar encuadre visual real.

## Comprobaciones

RED determinístico antes del fixture y GREEN. Validar con validarSlides real y funciones taxonomía/slugs/visibilidad vigentes; comparar planes publicados50/47/48/51/50entradas. Pruebas focalizadas y npmruncheck antes commit. Revisión independiente de datos/SQL antes remota; no usar riesgos de árbol ajeno como aprobación de este alcance. Transacción guardada porIDs/baseline y ausencia comprobada para nuevas; rollback automático si desviaciones. Readback cinco filas, HTTP páginas canónica/SEO/planes/home e imágenes y capturas1280/375, no nuevos triggers. Si revalidación falla, investigar cola sin inventar éxito y sin cambiar configuración.

## Estado

Preflight remoto sólo lectura y preparación local T1 completados. Pendiente revisión independiente y aplicación remota T2. Memoria asociada a este archivo; sin supuestos de estado remoto por snapshots locales antiguos.

### RED de T1
RED observado: prueba nueva falla ENOENT por fixture ausente (1 falla, 0 aprobadas). No se ejecutó SQL remoto.

### Evidencia T1

Ruta delegada: múltiples payloads, SQL y validación real. RED: 1 falla ENOENT antes de crear fixture. GREEN: 2/2 pruebas nuevas; focalizadas carrera-detalle/catalogo 13/13 y combinadas 15/15. npm run check: lint 0 errores, 27 avisos previos fuera alcance; typecheck aprobado; 273/273 tests, sin skips. Algunas pruebas negativas imprimen errores de npm/assert esperados, sin fallos de la suite. git diff --check acotado y revisión de whitespace en seis archivos nuevos/no rastreados: aprobados.

SQL preparado pero NO aplicado ni ejecutado DO remoto. Validación SQL estructural por prueba; compilación completa en PostgreSQL pendiente de revisión independiente y fase T2. Las guardas comparan columnas de identidad y updated_at del baseline #565; no duplican imágenes antiguas. Bloqueo breve SHARE ROW EXCLUSIVE evita inserciones concurrentes al no haber UNIQUE de nombre. Tres UPDATE IDs77/63/18 y dos INSERT con conteo de cinco activas, preservando ID97.

Fixture: cinco fuentes oficiales públicas con metadata verificado 2026-10-03, reconocimientos, planes completos 50/47/48/51/50 y tres slides. No IDs ficticios para INSERT. Dos nuevos orden58/59; tres previos preservados. Modalidad literal Distancia y nivel Grado. Imagen Hotelera rechazada por logo UMOV; padre confirmó fallback existente también para esa carrera. Hidrocarburos reutiliza imagen temática, restantes banner genérico. Encuadre final y capturas pendientes T2.

Sin cambios de taxonomía; Antropología sin área detectada y Hotelera/Infraestructura pueden categorizarse como Negocios, pero son visibles como licenciaturas. Limitación registrada, no ampliación automática.

Aislamiento comprobado: components/index/types.ts SHA256 4da33d70244b0901ffc09e4199766dc88d8a19d9c7b2ba2f866ced98dc8a293a y buscador publicado SHA256 d85334d5fb31b8443783c08dab3d32535cd35641eb4126f6d7237cb93eac4798 sin cambios. SQL SHA256 7185d63735d6ee451fb5280428b1b65311e42992a42d10ddbcf4f50691d4768b. Fixture SHA256 4ab8fc04ed85e7b4c81b3479481dfaceb65c2aadb4c80109f6cbf4ea9ffa4c22.

No commits/push. T2 espera autorización del padre posterior a revisión independiente: no se afirma alta pública todavía.

### Intento T2 en producción, 03/10/2026

Usuario confirmó continuar la transacción protegida en producción aun sin prueba local PostgreSQL de rollback. T1 commit local 8f70ae02 revisado por nativo, aprobado y ACK consumido; aviso R3 informativo, sin reabrir review.

Se verificaron hashes exactos SQL7185d63735d6ee451fb5280428b1b65311e42992a42d10ddbcf4f50691d4768b y fixture4ab8fc04ed85e7b4c81b3479481dfaceb65c2aadb4c80109f6cbf4ea9ffa4c22; rol cau_editor confirmado. Una única ejecución del SQL exacto abortó con código PostgreSQL P0001. El cliente recibió respuesta al ROLLBACK explícito en la misma conexión. No recibió COMMIT ni cinco filas resultantes; no reintentó la mutación. El mensaje específico de excepción no se conservó, por lo que no se identifica qué guarda abortó.

Readback posterior autorizado, sólo lectura de las filas objetivo, no llegó a completarse: ENETUNREACH. No se hicieron GET públicos ni capturas porque no hubo COMMIT exitoso. No se afirma publicación ni se asignan IDs nuevos. T2 pendiente y detenida; resolver causa mediante sólo lectura cuando la conexión esté disponible, sin reaplicar ni cambiar SQL automáticamente.

### Corrección puntual del baseline, sin aplicación remota

Causa comprobada por SELECT autorizado: pg convirtió timestamptz a Date y perdió microsegundos. La primera guarda ID77 comparaba .010Z contra .010409+00 y abortó; ID63 tenía .993736+00 e ID18 .15959+00. Los demás campos coincidían. Readback posterior exitoso confirmó tres filas inactivas y ambas nuevas ausentes: no se publicaron altas del intento abortado.

Se reemplazan únicamente los tres timestamps esperados del SQL y fixture por updated_at::text exacto. Se conservan guardas, comparación timestamptz, bloqueo, conteos y todos los payloads académicos. Regresión determinística nueva: RED 2 aprobadas/1 falla por precisión truncada; GREEN 3/3. Comparaciones PostgreSQL de sólo lectura posteriores: campos y timestamps coinciden true para IDs77/63/18. No DO, escrituras remotas ni commits en esta corrección.

SQL anterior fallido SHA256 7185d63735d6ee451fb5280428b1b65311e42992a42d10ddbcf4f50691d4768b se conserva como evidencia histórica. Candidato corregido SQL SHA256 908ceeb9649ffcbe0c64d1b71f32dc122bd4f1512068e2bef2721add8429d60f; fixture SHA256 aaae4187c1f3fab235d3b3b2a5566908b1cd43fb4b2b67e0bb745a012eb0bc3e. Semántica fuera de baseline idéntica, comprobada normalizando sólo esas tres fechas; SHA256 del payload público serializado con claves ordenadas 445107e7aafb37fd464673d96fea0d612426b80e7e4a27c7a6e0fcf21676af8d.

Verificación de corrección: npm run check aprobado, lint 0 errores/27 avisos fuera alcance, typecheck aprobado, 274/274 tests sin skips; git diff --check de cinco superficies aprobado. Nueva evaluación y autorización de aplicación quedan a cargo del padre; no se aplicó el SQL corregido.
