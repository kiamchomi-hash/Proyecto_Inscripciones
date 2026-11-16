-- Fuente: Dashboard Comercial de Teclab (TEC-026) y ficha oficial.
-- Sin precio: no figura en el simulador del período 1A 2027.
-- No repetir la carga: comprobar primero la ausencia de la carrera en D1.
INSERT INTO carreras (
  nombre, nivel, modalidad, activa, destacada, nueva, proximamente, orden,
  prefix, nombre_corto, duracion, titulo, area, descripcion, enfoque,
  plan_estudios, seccion_duracion, seccion_modalidad, slides, descuento_especial
)
SELECT
  'Tecnicatura Superior en Gestión de Inteligencia Artificial y Transformación Digital',
  'Teclab - Tecnología', '100% Online', 1, 0, 1, 0, 1009,
  'Tecnicatura Superior en', 'Gestión de Inteligencia Artificial y Transformación Digital',
  '2 años', 'Técnico Superior en Gestión de Inteligencia Artificial y Transformación Digital',
  NULL,
  'Estudiá gestión de inteligencia artificial y transformación digital a distancia: automatización de procesos, herramientas sin código, asistentes inteligentes y análisis de datos. Áreas de tecnología, innovación y operaciones, consultoras, agencias, startups y PyMEs.',
  'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Gestión de Inteligencia Artificial y Transformación Digital
Certificado intermedio: Asistente en Inteligencia Artificial Estratégica',
  'Primer Año | 1er cuatrimestre
• Inteligencia Artificial
• Organización del Tiempo y el Trabajo
• Modelado Operacional con IA
• Transformación e Innovación Organizacional

Primer Año | 2do cuatrimestre
• Automatización de Procesos de Negocio
• Gestión de Objetivos
• Integración de Servicios
• Aprendizaje Ágil (Learning Agility)

Segundo Año | 3er cuatrimestre
• Diseño de Asistentes Inteligentes
• Comunicación Efectiva
• Evaluación de Soluciones Inteligentes
• Decisiones y Resoluciones Eficientes

Segundo Año | 4to cuatrimestre
• Inteligencia de Negocios
• Gestión de Presupuestos
• Práctica Profesionalizante',
  NULL,
  '• Detectar oportunidades de aplicación de inteligencia artificial en procesos.
• Diseñar automatizaciones e integrar herramientas sin código.
• Analizar y visualizar datos para acompañar decisiones.',
  '[{"type":"faq","items":[{"pregunta":"¿Cuánto dura la carrera?","respuesta":"Dura 2 años y se cursa 100% online."},{"pregunta":"¿Necesito saber programar?","respuesta":"No se requieren conocimientos avanzados de programación. La formación incluye herramientas sin código y automatización."},{"pregunta":"¿Qué certificado intermedio ofrece?","respuesta":"Asistente en Inteligencia Artificial Estratégica, al completar el primer año."},{"pregunta":"¿Incluye práctica profesional?","respuesta":"Sí. El plan incluye una Práctica Profesionalizante en el último bimestre."},{"pregunta":"¿Qué título se obtiene?","respuesta":"Técnico Superior en Gestión de Inteligencia Artificial y Transformación Digital."}]}]',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM carreras
  WHERE lower(nombre) LIKE '%gestión de inteligencia artificial%transformación digital%'
);
