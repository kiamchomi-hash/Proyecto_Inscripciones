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
