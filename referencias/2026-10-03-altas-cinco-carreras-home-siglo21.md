# Cinco altas públicas Siglo 21

## Fuentes oficiales

- [Licenciatura en Antropología Organizacional](https://21.edu.ar/carreras-y-programas/licenciatura-en-antropologia-organizacional): 50 entradas del plan, verificadas el 03/10/2026.
- [Licenciatura en Administración Hotelera](https://21.edu.ar/carreras-y-programas/licenciatura-en-administracion-hotelera): 47 entradas del plan, verificadas el 03/10/2026.
- [Licenciatura en Ambiente y Energías Renovables](https://21.edu.ar/carreras-y-programas/licenciatura-en-ambiente-y-energias-renovables): 48 entradas del plan, verificadas el 03/10/2026.
- [Licenciatura en Hidrocarburos y Geociencias](https://21.edu.ar/carreras-y-programas/licenciatura-en-hidrocarburos-y-geociencias): 51 entradas del plan, verificadas el 03/10/2026.
- [Licenciatura en Administración de Infraestructura Tecnológica](https://21.edu.ar/carreras-y-programas/licenciatura-en-administracion-de-infraestructura-tecnologica): 50 entradas del plan, verificadas el 03/10/2026.

## Interpretación y límites

Se conservan cuatro años y Educación Distribuida Home. Las instancias presenciales impiden afirmar 100% virtual. Infraestructura no publica el nombre del título intermedio: se omite. Hotelera publica dos entradas separadas, `Pisos y Habitaciones - Mantenimiento y Seguridad` y `Hotelera`; no se fusionan ni se agrega una electiva que no figura. Hidrocarburos publica `Otros requisitos`, `Noveno Cuatrimestre`, que se conserva como extras sin inferir un quinto año.

Los reconocimientos oficiales se guardan como metadata de fuente en el fixture, no como instrucciones internas renderizadas. Ambiente distingue R.S.E. 13/25 para distancia y R.M. 308/17 para presencial.

La foto específica de Hotelera contiene marca UMOV ACADEMY. Por autorización del padre se usa el banner genérico existente, también usado para Antropología, Ambiente e Infraestructura. Hidrocarburos reutiliza la imagen temática de la tecnicatura con encuadre 40% center. No se modifican activos; el encuadre final requiere capturas posteriores a la carga.

## Identidad y guardas

Se actualizan ID77 Antropología, ID63 Hotelera e ID18 Infraestructura preservando nombre, prefix y orden exactos. Ambiente e Hidrocarburos son INSERT sin ID prefijado. La tecnicatura ID97 no se modifica. Los dos nuevos órdenes 58 y 59 no alteran registros existentes.

SQL atómico con timeout, bloqueo transaccional breve de tabla por ausencia de UNIQUE de nombre, tres guardas de identidad/updated_at con FOR UPDATE, ausencia de las dos licenciaturas por variantes, conteo por escritura y cinco activas al final. El bloqueo evita una carrera concurrente entre comprobar ausencia e insertar; si no se obtiene en cinco segundos falla sin aplicar nada.

La taxonomía vigente no se modifica: Antropología puede no tener área detectada; Hotelera e Infraestructura pueden caer en Negocios por el texto Administración. Son visibles como licenciaturas. Corregir categorías exigiría otro alcance y deploy.

## Estado

Preparación local, no aplicación remota. Las páginas y los slugs se resuelven por las rutas dinámicas existentes al activar las filas y mediante revalidación ya montada. No se afirma publicación ni readback remoto hasta completar T2.

### Aplicación detenida

03/10/2026: el único intento autorizado del SQL protegido abortó con P0001, seguido de respuesta a ROLLBACK explícito. Sin COMMIT ni IDs nuevos observados. Readback posterior falló ENETUNREACH; no se afirma alta pública ni verificación HTTP. Causa específica pendiente de evidencia de sólo lectura. No hubo reintento de escritura.

### Corrección puntual del baseline, sin aplicación remota

Causa comprobada por SELECT autorizado: pg convirtió timestamptz a Date y perdió microsegundos. La primera guarda ID77 comparaba .010Z contra .010409+00 y abortó; ID63 tenía .993736+00 e ID18 .15959+00. Los demás campos coincidían. Readback posterior exitoso confirmó tres filas inactivas y ambas nuevas ausentes: no se publicaron altas del intento abortado.

Se reemplazan únicamente los tres timestamps esperados del SQL y fixture por updated_at::text exacto. Se conservan guardas, comparación timestamptz, bloqueo, conteos y todos los payloads académicos. Regresión determinística nueva: RED 2 aprobadas/1 falla por precisión truncada; GREEN 3/3. Comparaciones PostgreSQL de sólo lectura posteriores: campos y timestamps coinciden true para IDs77/63/18. No DO, escrituras remotas ni commits en esta corrección.

SQL anterior fallido SHA256 7185d63735d6ee451fb5280428b1b65311e42992a42d10ddbcf4f50691d4768b se conserva como evidencia histórica. Candidato corregido SQL SHA256 908ceeb9649ffcbe0c64d1b71f32dc122bd4f1512068e2bef2721add8429d60f; fixture SHA256 aaae4187c1f3fab235d3b3b2a5566908b1cd43fb4b2b67e0bb745a012eb0bc3e. Semántica fuera de baseline idéntica, comprobada normalizando sólo esas tres fechas; SHA256 del payload público serializado con claves ordenadas 445107e7aafb37fd464673d96fea0d612426b80e7e4a27c7a6e0fcf21676af8d.
