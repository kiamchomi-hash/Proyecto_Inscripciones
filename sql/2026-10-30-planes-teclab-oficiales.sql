-- Planes de estudio de Teclab alineados con los PDF oficiales de teclab.edu.ar.
-- Fuente de cada plan: el programa descargable de su ficha "carrera/<slug>/", bajado el 30/10/2026.
-- Antes estaban desfasados en 17 carreras: una sola "Práctica Profesionalizante" en lugar de
-- "Práctica Profesional I" y "II", y materias que el programa vigente no trae.
-- Seguros repite "Práctica Profesional" en los dos últimos bimestres: se publica una sola vez.
-- Ejecutar: npm run db:d1 -- --archivo sql/2026-10-30-planes-teclab-oficiales.sql --escribir

-- 217 · Tecnicatura Superior en Programación
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Lógica de programación
• Organización del tiempo y del trabajo
• Base de datos
• Experiencia de usuario

Primer Año | 2do cuatrimestre
• Gestión de la configuración
• Gestión operativa en la nube
• Programación para web
• Gestión de personas

Segundo Año | 1er cuatrimestre
• Integraciones web
• Diseño de sistemas de información
• Interfaz de desarrollo
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Gestión de proyectos
• Programación mobile
• Práctica profesional I
• Práctica profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 217;

-- 218 · Tecnicatura Superior en Data Science
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Análisis y visualización de datos
• Organización del tiempo y del trabajo
• Procesamiento de datos
• Scripting

Primer Año | 2do cuatrimestre
• Base de datos y big data
• Matemática y estadística
• Introducción al machine learning
• Learning agility

Segundo Año | 1er cuatrimestre
• Machine learning: clasificación y regresión
• Gestión operativa en la nube
• Procesamiento natural del lenguaje (NLP)
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Comunicación efectiva
• Machine learning en la nube
• Práctica profesional I
• Práctica profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 218;

-- 219 · Tecnicatura Superior en Quality Assurance
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Lógica de programación
• Organización del tiempo y del trabajo
• Base de datos
• Scripting

Primer Año | 2do cuatrimestre
• Desarrollo de tests
• Comunicación efectiva
• Diseño de sistemas de información
• Learning agility

Segundo Año | 1er cuatrimestre
• Mobile testing
• Gestión de proyectos
• Planificación de pruebas
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Proceso y estrategia de mejora
• Hacking ético
• Práctica profesional I
• Práctica profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 219;

-- 220 · Tecnicatura Superior en Redes Informáticas
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Fundamento de redes
• Organización del tiempo y del trabajo
• Servidores y servicios de red
• Lógica de programación

Primer Año | 2do cuatrimestre
• Interconexión de redes
• Comunicación efectiva
• Scripting
• Gestión de personas

Segundo Año | 1er cuatrimestre
• Gestión operativa en la nube
• Diseño de sistemas de información
• Automatización y programabilidad de redes
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Gestión de proyectos
• Seguridad y gestión de redes
• Práctica profesional I
• Práctica profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 220;

-- 221 · Tecnicatura Superior en Seguridad Informática
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Fundamento de redes
• Organización del tiempo y del trabajo
• Lógica de programación
• Servidores y servicios de red

Primer Año | 2do cuatrimestre
• Seguridad en endpoints y servers
• Programación y scripting
• Inteligencia de ataques
• Toma de decisiones para la acción

Segundo Año | 1er cuatrimestre
• Manejo de riesgos y operaciones de seguridad
• Resolución de problemas
• Seguridad y gestión de redes
• Cultura del trabajo, calidad y equipos

Segundo Año | 2do cuatrimestre
• Seguridad en la nube y protección de datos
• Comunicación efectiva
• Práctica profesional I
• Práctica profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 221;

-- 222 · Tecnicatura Superior en Cloud Administration
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Gestión operativa en la nube
• Organización del tiempo y del trabajo
• Gestión de personas
• Lógica de programación

Primer Año | 2do cuatrimestre
• Matemáticas y estadística
• Fundamentos de redes
• Arquitectura de soluciones
• Toma de decisiones para la acción

Segundo Año | 1er cuatrimestre
• Diseño de sistemas de información
• Resolución de problemas
• Administración de sistemas en la nube
• Base de datos

Segundo Año | 2do cuatrimestre
• Comunicación efectiva
• Gestión de proyectos
• Práctica profesional I
• Práctica profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 222;

-- 223 · Tecnicatura Superior en Marketing Digital
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Gestión de Publicidad Digital
• Organización del Tiempo y del Trabajo
• Estrategias de Marketing Digital
• Gestión de Marca

Primer Año | 2do cuatrimestre
• Administración de Publicidad Digital
• Comunicación Efectiva
• Monetización Publicitaria
• Aprendizaje Ágil (Learning Agility)

Segundo Año | 1er cuatrimestre
• Estrategia de Crecimiento
• Diseño de Contenidos
• Marketing para E-commerce
• Decisiones y Resoluciones Eficientes

Segundo Año | 2do cuatrimestre
• Análisis de Experiencia del Cliente
• Estrategia y Planificación Comercial
• Práctica Profesional I
• Práctica Profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 223;

-- 224 · Tecnicatura Superior en Inbound Marketing
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Análisis de Inbound Marketing
• Organización del Tiempo y del Trabajo
• Estrategia de Marketing Digital
• Gestión de Marca

Primer Año | 2do cuatrimestre
• Análisis de la Experiencia del Cliente
• Comunicación Efectiva
• Sistemas de Generación y Conversión
• Aprendizaje Ágil (Learning Agility)

Segundo Año | 1er cuatrimestre
• Gestión de Presupuestos
• Diseño de Contenidos
• Metodología de Inbound Marketing
• Decisiones y Resoluciones Eficientes

Segundo Año | 2do cuatrimestre
• Proceso y Estrategia de Mejora
• Estrategia y Planificación de Contenidos de Marketing
• Práctica profesional I
• Práctica profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 224;

-- 225 · Tecnicatura Superior en Experiencia del Cliente
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Análisis de la Experiencia del Cliente
• Organización del Tiempo y del Trabajo
• Bases Operativas de Experiencia del Cliente
• Gestión de Personas

Primer Año | 2do cuatrimestre
• Diseño del Servicio al Cliente
• Comunicación Efectiva
• Experiencia de Usuario
• Aprendizaje Ágil (Learning Agility)

Segundo Año | 1er cuatrimestre
• Administración Digital de Experiencia del Cliente
• Gestión de Proyectos
• Planificación estratégica de Experiencia del Cliente
• Decisiones y Resoluciones Eficientes

Segundo Año | 2do cuatrimestre
• Gestión de Marca
• Estrategias de Transformación Digital
• Práctica profesional I
• Práctica profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 225;

-- 227 · Tecnicatura Superior en Gestión Contable
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Fundamentos de Contabilidad
• Organización del Tiempo y del Trabajo
• Circuitos Administrativos Contables Claves
• Gestión de Personas

Primer Año | 2do cuatrimestre
• Sociedades Comerciales
• Gestión de Presupuestos
• Contabilidad Patrimonial
• Aprendizaje Ágil (Learning Agility)

Segundo Año | 1er cuatrimestre
• Análisis de Estados Contables
• Comunicación Efectiva
• Técnica Impositiva
• Decisiones y Resoluciones Eficientes

Segundo Año | 2do cuatrimestre
• Legislación Laboral
• Tecnología para la Gestión Contable
• Práctica profesional I
• Práctica profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 227;

-- 228 · Tecnicatura Superior en Seguros
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Marco Legal del Contrato de Seguros
• Organización del Tiempo y del Trabajo
• Contrato de Seguros
• Gestión de Personas

Primer Año | 2do cuatrimestre
• Seguros Específicos I
• Fundamentos de Contabilidad
• Seguros Específicos II
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Comercialización en Seguros
• Proceso y Estrategia de Mejora
• Análisis de Riesgo
• Decisiones y Resoluciones Eficientes

Segundo Año | 2do cuatrimestre
• Gestión de Proyectos
• Práctica Profesional
• Transformación y el Negocio del Seguro', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 228;

-- 229 · Tecnicatura Superior en Gestión Agraria
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Gestión Operativa de la Empresa Agraria
• Organización del Tiempo y del Trabajo
• Circuitos Administrativos Contables Claves
• Gestión de Personas

Primer Año | 2do cuatrimestre
• Gestión de Cultivos Extensivos
• Gestión de Presupuesto
• Gestión de la Producción Animal
• Aprendizaje Ágil (Learning Agility)

Segundo Año | 1er cuatrimestre
• Marco Legal y Ambiental de la Empresa Agraria
• Proceso y Estrategia de Mejora
• Administración General de la Empresa Agraria
• Decisiones y Resoluciones Eficientes

Segundo Año | 2do cuatrimestre
• Gestión de Proyectos
• Agricultura Digital
• Práctica Profesional I
• Práctica Profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 229;

-- 230 · Tecnicatura Superior en Relaciones Laborales
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Relaciones individuales y colectivas del trabajo
• Organización del tiempo y del trabajo
• Remuneraciones e indemnizaciones
• Gestión de personas

Primer Año | 2do cuatrimestre
• Relaciones laborales como proceso
• Comunicación efectiva
• Responsabilidad empresarial
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Reclutamiento y selección de personas
• Gestión de presupuestos
• Beneficios y compensaciones
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Experiencia de las personas
• Transformación e innovación organizacional
• Práctica profesional I
• Práctica profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 230;

-- 231 · Tecnicatura Superior en Gestión Hotelera
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Gestión de Reservas y Front Desk
• Organización del Tiempo y del Trabajo
• Housekeeping
• Gestión de Personas

Primer Año | 2do cuatrimestre
• Alimentos y Bebidas & Eventos
• Gestión de Presupuestos
• Planificación de Eventos
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Sitios Web y Publicidad Digital
• Proceso y Estrategia de Mejora
• Experiencia del Huésped
• Decisiones y Resoluciones Eficientes

Segundo Año | 2do cuatrimestre
• Comercialización y Revenue Management
• Gestión de Proyectos
• Práctica Profesional I
• Práctica Profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 231;

-- 232 · Tecnicatura Superior en Planificación y Organización de Eventos
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Diseño de Eventos
• Organización del Tiempo y del Trabajo
• Planificación de Eventos
• Gestión de Personas

Primer Año | 2do cuatrimestre
• Servicio de Alimentos y Bebidas para Eventos
• Comunicación Efectiva
• Ceremonial y Protocolo
• Aprendizaje Ágil (Learning Agility)

Segundo Año | 1er cuatrimestre
• Sitios Web y Publicidad Digital
• Gestión de Presupuestos
• Comunicación de Eventos y Nuevas Tecnologías
• Decisiones y Resoluciones Eficientes

Segundo Año | 2do cuatrimestre
• Gestión de Proyectos
• Emprendimiento e Innovación en Eventos
• Práctica Profesional I
• Práctica Profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 232;

-- 233 · Tecnicatura Superior en Periodismo y Nuevas Tecnologías
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Producción de Noticias
• Organización del Tiempo y del Trabajo
• Redacción Periodística en la Era Digital
• Experiencia de Usuario

Primer Año | 2do cuatrimestre
• Periodismo y Redes Sociales
• Comunicación Efectiva
• Nuevo Periodismo
• Aprendizaje Ágil (Learning Agility)

Segundo Año | 1er cuatrimestre
• Gestión de Proyectos
• Diseño de Contenidos
• Multimedios
• Decisiones y Resoluciones Eficientes

Segundo Año | 2do cuatrimestre
• Sitios Web y Publicidad Digital
• Periodismo de Datos
• Práctica Profesional I
• Práctica Profesional II', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 233;

-- 243 · Tecnicatura Superior en Logística
UPDATE carreras SET plan_estudios = 'Primer Año | 1er cuatrimestre
• Bases Operativas de Logística Materia
• Organización del Tiempo y del Trabajo Materia
• Gestión de Manipulación y Distribución de Envíos Materia
• Aprendizaje Ágil (Learning Agility) Materia

Primer Año | 2do cuatrimestre
• Fundamentos del Comercio Exterior Materia
• Operatoria del Régimen Courier Materia
• Procedimientos y Regímenes Aduaneros Materia
• Decisiones y Resoluciones Eficientes Materia

Segundo Año | 3er cuatrimestre
• Despacho de Mercadería Materia
• Gestión de Proyectos Materia
• Gestión del Transporte Materia
• Negociación y Persuasión Materia

Segundo Año | 4to cuatrimestre
• Comunicación Efectiva Materia
• Gestión de Personas Materia
• Práctica Profesionalizante Materia
• Materia', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = 243;
