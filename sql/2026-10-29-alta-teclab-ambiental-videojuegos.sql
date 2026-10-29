-- Fuentes: fichas oficiales de Teclab y capacitación de admisión del bloque 4.
-- Ejecutar después de publicar el código: npm run db:d1 -- --archivo sql/2026-10-29-alta-teclab-ambiental-videojuegos.sql --escribir
INSERT INTO carreras (nombre, nivel, modalidad, activa, destacada, nueva, proximamente, orden, prefix, nombre_corto, duracion, titulo, descripcion, enfoque, plan_estudios, seccion_modalidad, slides)
SELECT 'Tecnicatura Superior en Gestión Ambiental', 'Teclab - Gestión', '100% Online', 1, 0, 1, 0, 1107, 'Tecnicatura Superior en', 'Gestión Ambiental', '2 años', 'Técnico Superior en Gestión Ambiental',
'Estudiá gestión ambiental a distancia: legislación, evaluación de impacto, residuos, cambio climático y sistemas de gestión. Empresas e industrias, consultoras ambientales y organismos públicos.',
'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Gestión Ambiental
Certificado intermedio: Asistente en Gestión Ambiental',
'Primer Año | 1er cuatrimestre
• Ambiente, Sociedad y Desarrollo Sostenible
• Organización del Tiempo y del Trabajo
• Legislación Ambiental
• Identificación y Evaluación de Riesgo

Primer Año | 2do cuatrimestre
• Evaluación de Impacto Ambiental
• Residuos y Economía Circular
• Cambio Climático y Huella de Carbono
• Decisiones y Resoluciones Eficientes

Segundo Año | 3er cuatrimestre
• Sistemas de Gestión y Auditoría
• Gestión de Presupuestos
• Sostenibilidad Organizacional
• Seguridad y Gestión de Sustancias Químicas

Segundo Año | 4to cuatrimestre
• Liderazgo y Pensamiento Sistémico
• Gestión de Proyectos
• Práctica Profesionalizante',
'• Interpretar legislación y documentación ambiental.
• Relevar información sobre emisiones, residuos y recursos.
• Participar en sistemas de gestión y auditorías ambientales.',
'[{"type":"faq","items":[{"pregunta":"¿Qué certificado intermedio ofrece la carrera?","respuesta":"Asistente en Gestión Ambiental, al completar el primer año."},{"pregunta":"¿Qué título se obtiene?","respuesta":"Técnico Superior en Gestión Ambiental."}]}]'
WHERE NOT EXISTS (SELECT 1 FROM carreras WHERE nombre = 'Tecnicatura Superior en Gestión Ambiental' AND nivel LIKE 'Teclab%');

INSERT INTO carreras (nombre, nivel, modalidad, activa, destacada, nueva, proximamente, orden, prefix, nombre_corto, duracion, titulo, descripcion, enfoque, plan_estudios, seccion_modalidad, slides)
SELECT 'Tecnicatura Superior en Desarrollo de Videojuegos', 'Teclab - Tecnología', '100% Online', 1, 0, 1, 0, 1007, 'Tecnicatura Superior en', 'Desarrollo de Videojuegos', '2 años', 'Técnico Superior en Desarrollo de Videojuegos',
'Estudiá desarrollo de videojuegos a distancia: programación, motores de desarrollo, pruebas y optimización de experiencias interactivas. Estudios de videojuegos, empresas de software, agencias digitales y proyectos educativos.',
'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Desarrollo de Videojuegos
Certificado intermedio: Asistente en Desarrollo de Videojuegos',
'Primer Año | 1er cuatrimestre
• Matemática y Física para Videojuegos
• Organización del Tiempo y del Trabajo
• Gestión de Proyectos
• Lógica de Programación

Primer Año | 2do cuatrimestre
• Sistema de Juego en Tiempo Real
• Programación Orientada a Objetos
• Renderizado y Optimización
• Experiencia de Usuario

Segundo Año | 3er cuatrimestre
• Testing Manual y Automatizado
• Inteligencia Artificial Aplicada a Videojuegos
• Gestión de Flujos de Producción
• Aprendizaje Ágil (Learning Agility)

Segundo Año | 4to cuatrimestre
• Comunicación Efectiva
• Sistemas de Juego Multijugador
• Práctica Profesionalizante',
'• Programar mecánicas y sistemas de interacción.
• Configurar proyectos e integrar recursos en motores de videojuegos.
• Probar, corregir y optimizar videojuegos.',
'[{"type":"faq","items":[{"pregunta":"¿Qué certificado intermedio ofrece la carrera?","respuesta":"Asistente en Desarrollo de Videojuegos, al completar el primer año."},{"pregunta":"¿Qué título se obtiene?","respuesta":"Técnico Superior en Desarrollo de Videojuegos."}]}]'
WHERE NOT EXISTS (SELECT 1 FROM carreras WHERE nombre = 'Tecnicatura Superior en Desarrollo de Videojuegos' AND nivel LIKE 'Teclab%');
