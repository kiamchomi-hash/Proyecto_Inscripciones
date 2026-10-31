-- Altas de Teclab, bloque 4 (30/10/2026): las dos que faltaban del catálogo
-- oficial. Desarrollo de Videojuegos (247) ya estaba cargada.
--
-- Fuente: las fichas de teclab.edu.ar, recorridas el 30/10/2026.
--   /carrera/tecnico-superior-en-comercio-electronico/   Dictamen 3391/26
--   /carrera/tecnico-superior-en-diseno-de-producto-digital/  Dictamen 3390/26
-- El plan es el de las fichas (cuatro cuatrimestres de cuatro materias, con la
-- Práctica Profesionalizante en el último).
--
-- Sin precio: Teclab todavía no lo pasó. Entran abiertas, como Videojuegos.
-- Comercio Electrónico va en Gestión → Negocios (TIPOS); Diseño de Producto
-- Digital en Tecnología → Desarrollo (getCategoriaTeclabTecnologia).

INSERT INTO carreras (
  nombre, nivel, modalidad, activa, destacada, nueva, proximamente, orden,
  prefix, nombre_corto, duracion, titulo, area, descripcion, enfoque,
  plan_estudios, seccion_duracion, seccion_modalidad, slides, descuento_especial
) VALUES (
  'Tecnicatura Superior en Comercio Electrónico (e-commerce)',
  'Teclab - Gestión',
  '100% Online',
  1, 0, 1, 0, 1112,
  'Tecnicatura Superior en',
  'Comercio Electrónico (e-commerce)',
  '2 años',
  'Técnico Superior en Comercio Electrónico (e-commerce)',
  NULL,
  'Estudiá comercio electrónico a distancia: tiendas online y marketplaces, publicidad digital, medios de pago, logística y análisis de ventas. Áreas de e-commerce y marketing digital, retailers, marketplaces, agencias, consultoras, startups, fintech y empresas de logística.',
  'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Comercio Electrónico (e-commerce)
Certificado intermedio: Asistente en Comercio Electrónico (e-commerce)',
  'Primer Año | 1er cuatrimestre
• Análisis de Experiencia al Cliente
• Organización del Tiempo y del Trabajo
• Ecosistema Digital y Comercio Electrónico
• Marketing para e-commerce

Primer Año | 2do cuatrimestre
• Diseño de Contenidos
• Gestión de Comercio Electrónico
• Experiencia de Usuario
• Gestión de Marca

Segundo Año | 3er cuatrimestre
• Gestión de la Publicidad Digital
• Administración Digital de Experiencia al Cliente
• Logística para Negocios Digitales
• Decisiones y Resoluciones Eficientes

Segundo Año | 4to cuatrimestre
• Regulación y Medios de Pago
• Inteligencia de Negocios
• Práctica Profesionalizante',
  NULL,
  '• Gestionar tiendas online y marketplaces de punta a punta.
• Ejecutar campañas de publicidad digital y medir conversiones.
• Coordinar medios de pago, logística y posventa.',
  '[{"type":"faq","items":[{"pregunta":"¿Cuánto dura la carrera?","respuesta":"Dura 2 años y se cursa 100% online, con una Práctica Profesionalizante en el último cuatrimestre."},{"pregunta":"¿Qué diferencia hay con un curso para crear una tienda online?","respuesta":"La tecnicatura aborda el negocio completo: plataformas, catálogos, campañas, experiencia del cliente, medios de pago, logística y análisis de resultados."},{"pregunta":"¿Qué certificado intermedio ofrece?","respuesta":"Asistente en Comercio Electrónico (e-commerce), al completar el primer año."},{"pregunta":"¿Se estudian logística y medios de pago?","respuesta":"Sí. El segundo año incluye Logística para Negocios Digitales y Regulación y Medios de Pago."},{"pregunta":"¿Qué título se obtiene?","respuesta":"Técnico Superior en Comercio Electrónico (e-commerce)."}]}]',
  NULL
);

INSERT INTO carreras (
  nombre, nivel, modalidad, activa, destacada, nueva, proximamente, orden,
  prefix, nombre_corto, duracion, titulo, area, descripcion, enfoque,
  plan_estudios, seccion_duracion, seccion_modalidad, slides, descuento_especial
) VALUES (
  'Tecnicatura Superior en Diseño de Producto Digital',
  'Teclab - Tecnología',
  '100% Online',
  1, 0, 1, 0, 1008,
  'Tecnicatura Superior en',
  'Diseño de Producto Digital',
  '2 años',
  'Técnico Superior en Diseño de Producto Digital',
  NULL,
  'Estudiá diseño de producto digital a distancia: investigación de usuarios, UX/UI, metodologías ágiles, métricas e inteligencia artificial aplicada al producto. Startups, empresas tecnológicas, e-commerce, consultoras y equipos de producto.',
  'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Diseño de Producto Digital
Certificado intermedio: Asistente en Diseño de Producto Digital',
  'Primer Año | 1er cuatrimestre
• Diseño de Productos Digitales
• Organización del Tiempo y del Trabajo
• Gestión Operativa de Producto
• Análisis de Producto

Primer Año | 2do cuatrimestre
• Descubrimiento de Productos Digitales con IA
• Gestión de Objetivos
• Gestión Estratégica y Planificación de Productos Digitales
• Aprendizaje Ágil (Learning Agility)

Segundo Año | 3er cuatrimestre
• IA Aplicada al Diseño y Gestión de Producto
• Comunicación Efectiva
• Transformación e Innovación Organizacional
• Decisiones y Resoluciones Eficientes

Segundo Año | 4to cuatrimestre
• Gestión de Presupuestos
• Inteligencia de Negocios
• Práctica Profesionalizante',
  NULL,
  '• Investigar necesidades y validar productos con usuarios.
• Priorizar funcionalidades y armar roadmaps con equipos ágiles.
• Analizar métricas de uso e incorporar IA al proceso de producto.',
  '[{"type":"faq","items":[{"pregunta":"¿Qué hace un Técnico Superior en Diseño de Producto Digital?","respuesta":"Colabora en la investigación de necesidades, la definición de requerimientos, la planificación de funcionalidades, la validación con usuarios y el análisis de desempeño del producto."},{"pregunta":"¿La carrera incluye diseño UX UI?","respuesta":"Sí. Trabaja fundamentos de experiencia de usuario, diseño centrado en el usuario, usabilidad y prototipado."},{"pregunta":"¿Voy a aprender sobre product management?","respuesta":"Sí: gestión operativa y estratégica de productos, historias de usuario, métricas, prioridades y roadmaps. Son roles del sector, no títulos adicionales."},{"pregunta":"¿Incluye práctica profesional?","respuesta":"Sí. El cuarto cuatrimestre incluye una Práctica Profesionalizante de 340 horas."},{"pregunta":"¿Qué título se obtiene?","respuesta":"Técnico Superior en Diseño de Producto Digital, con acreditación nacional."}]}]',
  NULL
);
