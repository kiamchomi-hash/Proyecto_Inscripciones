# FAQ de carreras Teclab: evidencia y alcance

Preparados 42 FAQ originales para 14 carreras activas y visibles que tenían `slides = null` el 07/10/2026. Publicados y verificados el 07/10/2026. El objetivo es responder dudas concretas sobre formación y trabajo; no se atribuyen volúmenes de búsqueda ni resultados de posicionamiento.

## Alcance y lectura

- IDs 217–225 y 229–233: añadir un slide `faq` con tres preguntas.
- Gestión Contable (227) y Seguros (228): conservar sus FAQ actuales completos.
- Venta Directa (226, inactiva), curso de IA (235) e Identidad Argentina: fuera del cambio.
- Filtro comprobado con `activa && esCarreraVisible() && esTeclab()` reales: 16 elegibles, 14 sin FAQ.
- Sólo cambia `slides`; los triggers existentes pueden actualizar `updated_at` y revalidar las páginas. No se modifican descripción, planes, precios ni diseño.

## Fuentes y criterio editorial

[Dashboard Comercial Teclab para agentes](https://informacion.teclab.edu.ar/hubfs/ADMISION/CALIDAD%20Y%20%20TRAINING/Dashboard_Comercial_Teclab%20(Agentes).html), consultado el 07/10/2026. Datos extraídos de `const DATA` como JSON, sin ejecutar el código del sitio. Se contrastaron descripción y competencias con las fichas oficiales abajo. La herramienta web no accedió al dashboard; la descarga pública por HTTPS sí.

El campo `campo` tiene contenido cruzado entre carreras y se descartó. También se descartó `perfilEgreso` de Periodismo porque habla de eventos. No se usan salarios, garantías de empleo, becas, fechas, precios ni certificados intermedios discrepantes. Las preguntas son una selección editorial de dudas útiles, no una medición de Search Console. Las diferencias entre disciplinas son síntesis conceptuales de las dos fichas, no nombres de asignaturas ni promesas institucionales.

## Respaldo de cada respuesta

El orden de Q1/Q2/Q3 coincide con el JSON del SQL. Cada fila remite al encabezado de formación, competencias o plan de la ficha oficial; las respuestas están redactadas de nuevo, no copiadas del FAQ oficial.

| ID / carrera y ficha oficial | Q1 | Q2 | Q3 |
|---|---|---|---|
| 217 [Programación](https://teclab.edu.ar/carrera/tecnico-superior-en-programacion/) | Formación: lógica, bases de datos, desarrollo e integración | Competencia de desarrollo Full Stack; explicación conceptual de interfaz y lógica | Competencias: aplicaciones, integración y bases de datos |
| 218 [Data Science](https://teclab.edu.ar/carrera/carrera-de-data-science/) | Formación y plan: estadística, Big Data, Machine Learning | Diferencia explicada en FAQ oficial; alcance de análisis frente a modelos | Sección salida profesional: analítica, visualización e inteligencia de negocio |
| 219 [Quality Assurance](https://teclab.edu.ar/carrera/tecnico-superior-en-quality-assurance/) | Validación de software, incidencias y diseño de tests | Plan: lógica, bases de datos, scripting, tests y mobile testing | Síntesis de competencias QA y ficha de Programación (217); ambos usan código |
| 220 [Redes Informáticas](https://teclab.edu.ar/carrera/tecnico-superior-en-redes-informaticas/) | Formación y plan: redes, servicios, scripting, seguridad | Competencias de administración, switching, routing e IP | Síntesis comparativa con ficha de Seguridad (221): conectividad frente a protección |
| 221 [Seguridad Informática](https://teclab.edu.ar/carrera/tecnico-en-seguridad-informatica/) | Formación y plan: redes, servidores, scripting y riesgos | Competencias: protección, detección y respuesta a incidentes | Sección salida profesional: equipos IT, consultoras y ciberseguridad |
| 222 [Cloud Administration](https://teclab.edu.ar/carrera/tecnico-en-cloud-administration/) | Formación y plan: operaciones, arquitectura, redes y bases de datos | Formación: administración, incidentes, automatización y costos | Descripción y competencia multicloud: AWS, Azure y Google Cloud |
| 223 [Marketing Digital](https://teclab.edu.ar/carrera/tecnico-superior-en-marketing-digital/) | Formación y plan: publicidad, marca, contenidos y e-commerce | Síntesis del alcance del plan: varios canales, no sólo redes | Competencias: estrategias, campañas e interpretación de métricas |
| 224 [Inbound Marketing](https://teclab.edu.ar/carrera/tecnico-superior-en-inbound-marketing/) | Formación: atracción, conversión, fidelización, CRM y automatización | Síntesis del foco de Inbound y alcance de Marketing Digital (223) | Descripción y competencias de contenidos, CRM y automatización; explicación conceptual |
| 225 [Experiencia del Cliente](https://teclab.edu.ar/carrera/tecnico-superior-en-customer-experience/) | Formación y plan: análisis, servicio, marca y estrategia CX | Competencias: puntos de contacto, customer journey, retención y fidelización | Plan: Experiencia de Usuario y Diseño del Servicio al Cliente |
| 229 [Gestión Agraria](https://teclab.edu.ar/carrera/tecnico-superior-gestion-empresa-agraria/) | Formación y plan: administración, presupuesto, contabilidad y producción | Competencias: recursos, costos, producción y mercados | Sección salida laboral: empresas, establecimientos y unidades de negocio |
| 230 [Relaciones Laborales](https://teclab.edu.ar/carrera/tecnico-superior-en-relaciones-laborales/) | Formación y plan: relaciones, remuneraciones, selección y compensaciones | Competencia liquidación de haberes y materias de remuneraciones/beneficios | Sección salida profesional: RRHH, liquidaciones, selección y consultoras |
| 231 [Gestión Hotelera](https://teclab.edu.ar/carrera/tecnico-superior-en-gestion-hotelera/) | Formación y plan: recepción, housekeeping, eventos y comercialización | Competencias: reservas, experiencias y coordinación de eventos | Plan: presupuestos, proyectos, comercialización y revenue management |
| 232 [Organización de Eventos](https://teclab.edu.ar/carrera/tecnico-superior-en-planificacion-y-organizacion-de-eventos/) | Formación y plan: diseño, presupuestos, ceremonial, tecnología | Competencias: organización, logística, recursos y proveedores | Sección salida laboral: agencias, empresas, instituciones y trabajo independiente |
| 233 [Periodismo y Nuevas Tecnologías](https://teclab.edu.ar/carrera/tecnico-superior-en-periodismo-y-nuevas-tecnologias/) | Formación y plan: noticias, redacción digital, multimedios y datos | Competencia multimedia: podcast, radio digital y video | Sección salida laboral: redacciones, prensa, agencias y contenidos digitales |

## Aplicación segura y verificación

El SQL `sql/2026-10-07_faq_seo_teclab.sql` contiene un listado cerrado de 14 identidades y sólo un `UPDATE` con `WHERE`. Bloquea cada fila en orden de ID y compara la huella completa `md5(to_jsonb(c)::text)`, nombre, prefijo, nivel, actividad y `slides = null`. Cualquier deriva aborta toda la transacción. No es una migración automática y no debe aplicarse de nuevo después del primer éxito.

La tabla no almacena `slug`: se deriva de nombre y prefijo con `carreraToSlug()`. El control local usa esa función real; el control de identidad SQL conserva ambos campos y la huella completa. El respaldo privado local tiene permiso 0600 y no debe versionarse. Las fuentes descargadas y scripts de validación quedan en `notas-locales/faq-seo-teclab/`, fuera de git.

Validación local: parser real `validarSlides()`, 3 items por fila, identidad y filtros, preservación simulada de campos ajenos y exclusiones. El SQL fue probado en PostgreSQL 17.6 local: aplicación de 14 filas y 42 respuestas, preservación de campos ajenos y rollback completo ante deriva intencional en la última fila. El fixture usa ID entero y otras columnas JSONB; reproduce la serialización y las huellas, no todos los tipos ni los triggers de producción.

Aplicación autorizada realizada una sola vez con COMMIT confirmado. El readback verificó las 14 fichas y 42 respuestas exactas, preservando las demás columnas salvo el timestamp mantenido por triggers y las cuatro exclusiones. Las 14 páginas públicas respondieron HTTP 200 y contienen las 42 respuestas sin depender de JavaScript. Las capturas revisadas confirmaron legibilidad y ausencia de desbordamiento, sin cambios de diseño. No se añade otro esquema FAQ ni se garantiza un resultado enriquecido.
