-- Gestión de Alimentos (Teclab): datos oficiales de la capacitación de admisión
-- del 09/10/2026. Completa duración, título, certificado, plan, competencias y
-- preguntas frecuentes de la fila cargada como «Próximamente» (id 246).
--
-- Sigue en proximamente = true: todavía no hay precio, fecha de inicio ni ficha
-- oficial en teclab.edu.ar. El plan se publica por año porque la fuente no
-- reparte las materias por bimestre (8 bimestres, 4 por año).
--
-- Correr con: npm run db -- --archivo sql/2026-10-09_gestion_alimentos_datos_oficiales.sql

UPDATE carreras SET
  duracion = '2 años',
  titulo = 'Técnico Superior en Gestión de Alimentos',
  enfoque = E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Gestión de Alimentos\nCertificado intermedio: Asistente en Gestión de Alimentos',
  descripcion = 'Estudiá gestión de alimentos a distancia: supervisión de procesos desde la materia prima hasta el producto final, inocuidad, trazabilidad y mejora de la producción. Sumás Código Alimentario Argentino, Buenas Prácticas de Manufactura y sistemas HACCP para asegurar la calidad de lo que se produce. Industrias alimentarias, establecimientos elaboradores, laboratorios y servicios de calidad, organismos y emprendimientos.',
  plan_estudios = E'Primer Año | Bimestres 1 a 4\n'
    '• Análisis y Conservación de Alimentos\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Producción Alimentaria y Buenas Prácticas de Manufactura\n'
    '• Gestión de Presupuestos\n'
    '• Tecnología de los Alimentos\n'
    '• Gestión de Personas\n'
    '• Gestión de Proyectos\n'
    '• Trazabilidad y Cadena de Suministro\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Rotulación y Legislación Alimentaria\n'
    '• Comunicación Efectiva\n'
    '• Sistema de Gestión de Inocuidad Alimentaria\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '• Diseño de Productos Industriales\n'
    '• Proceso y Estrategia de Mejora\n'
    '• Práctica Profesionalizante',
  seccion_modalidad = E'• Controlar procesos desde las materias primas hasta el producto final.\n'
    '• Aplicar buenas prácticas y sistemas de inocuidad.\n'
    '• Organizar registros y documentación técnica.\n'
    '• Supervisar parámetros productivos, de conservación y de calidad.\n'
    '• Verificar procedimientos y controles alimentarios.\n'
    '• Seguir el producto a través de la cadena de suministro.\n'
    '• Analizar datos e indicadores de producción.\n'
    '• Proponer mejoras en rendimientos, eficiencia y reducción de desperdicios.',
  slides = '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Gestión de Alimentos?",
     "respuesta": "Estudiás análisis y conservación de alimentos, tecnología alimentaria, Buenas Prácticas de Manufactura, inocuidad, trazabilidad y legislación alimentaria. La formación suma gestión de presupuestos, personas y proyectos para organizar la producción."},
    {"pregunta": "¿Qué hace un técnico en Gestión de Alimentos?",
     "respuesta": "Controla parámetros desde la materia prima hasta el producto final, aplica procedimientos de control alimentario, organiza registros para seguir los productos en la cadena y analiza indicadores, rendimientos y desperdicios."},
    {"pregunta": "¿Cuál es la salida laboral de Gestión de Alimentos?",
     "respuesta": "Industrias alimentarias, en control de procesos, calidad e inocuidad; establecimientos elaboradores, en producción y conservación; laboratorios y servicios de calidad, y organismos o emprendimientos que necesitan apoyo técnico en control, producción e innovación alimentaria."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer año obtenés el certificado de Asistente en Gestión de Alimentos, y al egresar, el título de Técnico Superior en Gestión de Alimentos."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización, para aplicar lo aprendido en situaciones reales."}
  ]}]'::jsonb
WHERE id = 246 AND nombre = 'Tecnicatura Superior en Gestión de Alimentos';
