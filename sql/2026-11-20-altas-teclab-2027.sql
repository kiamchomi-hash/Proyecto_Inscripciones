-- Altas de las dos carreras nuevas 2027 confirmadas por el asesor comercial.
-- Fuente: Dashboard Comercial de Teclab en vivo, bloque CARRERAS_NUEVAS_2027
-- (TEC-027 y TEC-028). Ver referencias/2026-11-20-dashboard-comercial-carreras-nuevas-2027.md
-- No repetir la carga: los INSERT llevan WHERE NOT EXISTS.
-- Sin precio: el dashboard dice "A validar con equipo comercial" para ambas.
-- Sin resolución/dictamen: el dashboard las marca como pendiente.

INSERT INTO carreras (
  nombre, nivel, modalidad, activa, destacada, nueva, proximamente, orden,
  prefix, nombre_corto, duracion, titulo, area, descripcion, enfoque,
  plan_estudios, seccion_duracion, seccion_modalidad, slides, descuento_especial
)
SELECT
  'Tecnicatura Superior en Diseño y Desarrollo de Inteligencia Artificial',
  'Teclab - Tecnología', '100% Online', 1, 0, 1, 0, 1010,
  'Tecnicatura Superior en', 'Diseño y Desarrollo de Inteligencia Artificial',
  '2 años', 'Técnico Superior en Diseño y Desarrollo de Inteligencia Artificial',
  NULL,
  'Estudiá diseño y desarrollo de inteligencia artificial a distancia: programación, matemática y estadística, análisis de datos, machine learning, IA generativa, agentes inteligentes, despliegue de modelos y MLOps. Empresas tecnológicas, startups, laboratorios de innovación, industrias y áreas de transformación digital, consultoras, agencias y equipos de producto, datos y MLOps.',
  'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Diseño y Desarrollo de Inteligencia Artificial
Certificado intermedio: Asistente en Inteligencia Artificial',
  'Primer Año | 1er cuatrimestre
• Inteligencia Artificial
• Matemática y Estadística
• Decisiones y Resoluciones Eficientes
• Scripting

Primer Año | 2do cuatrimestre
• Análisis y Visualización de Datos
• Organización del Tiempo y el Trabajo
• Aprendizaje Supervisado y No Supervisado
• Procesamiento de Datos

Segundo Año | 3er cuatrimestre
• IA Generativa y Redes Neuronales
• Gestión de Proyectos
• Arquitectura de Agentes Inteligentes
• Aprendizaje Ágil (Learning Agility)

Segundo Año | 4to cuatrimestre
• Despliegue y Producción de Modelos
• Transformación e Innovación Organizacional
• Práctica Profesionalizante',
  NULL,
  '• Comprender fundamentos de IA, machine learning, lenguaje natural y visión por computadora.
• Preprocesar, analizar y visualizar datos para modelos predictivos y generativos.
• Desarrollar, entrenar, evaluar e integrar modelos de inteligencia artificial.
• Consumir APIs y servicios de IA de plataformas líderes con seguridad y documentación.
• Diseñar agentes inteligentes con embeddings, bases vectoriales y arquitecturas RAG.
• Desplegar y monitorear modelos y agentes con Docker, FastAPI y prácticas de MLOps.
• Evaluar viabilidad técnica, operativa y económica de soluciones inteligentes.
• Aplicar ética, privacidad, equidad, trazabilidad y responsabilidad algorítmica.',
  '[{"type":"faq","items":[{"pregunta":"¿Cuánto dura la carrera?","respuesta":"Dura 2 años y se cursa 100% online."},{"pregunta":"¿Qué se estudia?","respuesta":"Machine learning, IA generativa, agentes inteligentes, análisis y visualización de datos, despliegue de modelos y MLOps."},{"pregunta":"¿Necesito saber programar?","respuesta":"El plan incluye Scripting y Procesamiento de Datos desde los primeros cuatrimestres; no se requiere experiencia previa."},{"pregunta":"¿Qué certificado intermedio ofrece?","respuesta":"Asistente en Inteligencia Artificial, al completar el primer año."},{"pregunta":"¿Incluye práctica profesional?","respuesta":"Sí. El plan incluye una Práctica Profesionalizante en el último cuatrimestre."},{"pregunta":"¿Qué título se obtiene?","respuesta":"Técnico Superior en Diseño y Desarrollo de Inteligencia Artificial."}]}]',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM carreras
  WHERE instr(lower(nombre), 'diseño y desarrollo de inteligencia artificial') > 0
);

INSERT INTO carreras (
  nombre, nivel, modalidad, activa, destacada, nueva, proximamente, orden,
  prefix, nombre_corto, duracion, titulo, area, descripcion, enfoque,
  plan_estudios, seccion_duracion, seccion_modalidad, slides, descuento_especial
)
SELECT
  'Tecnicatura Superior en Administración de Negocios Digitales Financieros',
  'Teclab - Gestión', '100% Online', 1, 0, 1, 0, 1011,
  'Tecnicatura Superior en', 'Administración de Negocios Digitales Financieros',
  '2 años', 'Técnico Superior en Administración de Negocios Digitales Financieros',
  NULL,
  'Estudiá administración de negocios digitales financieros a distancia: transacciones y medios de pago, experiencia del cliente, riesgos, fraude, regulación, datos, blockchain y modelos de servicios financieros. Fintechs, startups, billeteras virtuales, neobancos, procesadoras y pasarelas de pago, exchanges, bancos y entidades financieras, consultoras de tecnología y servicios.',
  'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Administración de Negocios Digitales Financieros
Certificado intermedio: Asistente en Administración de Negocios Digitales Financieros',
  'Primer Año | 1er cuatrimestre
• Ecosistema Financiero Digital
• Organización del Tiempo y del Trabajo
• Operaciones Financieras
• Administración Digital de CX

Primer Año | 2do cuatrimestre
• Probabilidad y Estadística
• Transacciones Digitales
• Control de Riesgos, Fraude y Regulación
• Decisiones y Resoluciones Eficientes

Segundo Año | 3er cuatrimestre
• Administración Financiera
• Comunicación Efectiva
• Análisis de Producto
• Tecnología Blockchain y Ecosistema Cripto

Segundo Año | 4to cuatrimestre
• Modelos Financieros para Servicios Digitales
• Aprendizaje Ágil (Learning Agility)
• Práctica Profesionalizante',
  NULL,
  '• Operar procesos financieros digitales y comprender el ciclo de vida de una transacción.
• Monitorear, controlar y validar operaciones, conciliaciones y medios de pago.
• Identificar riesgos operativos y colaborar en la prevención de fraudes.
• Interpretar el ecosistema Fintech, sus actores, servicios y regulación básica.
• Analizar datos operativos y elaborar reportes para apoyar decisiones.
• Acompañar integraciones de APIs, plataformas de pago y servicios asociados.
• Documentar procesos y relevar oportunidades de mejora y experiencia de usuario.
• Trabajar con producto, tecnología, riesgos, operaciones y atención al cliente.',
  '[{"type":"faq","items":[{"pregunta":"¿Cuánto dura la carrera?","respuesta":"Dura 2 años y se cursa 100% online."},{"pregunta":"¿Qué se estudia?","respuesta":"Medios de pago, transacciones digitales, control de riesgos y fraude, regulación, blockchain y análisis de producto."},{"pregunta":"¿Qué certificado intermedio ofrece?","respuesta":"Asistente en Administración de Negocios Digitales Financieros, al completar el primer año."},{"pregunta":"¿Incluye práctica profesional?","respuesta":"Sí. El plan incluye una Práctica Profesionalizante en el último cuatrimestre."},{"pregunta":"¿Qué título se obtiene?","respuesta":"Técnico Superior en Administración de Negocios Digitales Financieros."}]}]',
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM carreras
  WHERE instr(lower(nombre), 'negocios digitales financieros') > 0
);
