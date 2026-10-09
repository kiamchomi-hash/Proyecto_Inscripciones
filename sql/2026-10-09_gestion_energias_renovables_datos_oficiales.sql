-- Gestión de Energías Renovables (Teclab): nombre oficial y datos de la
-- capacitación de admisión del 09/10/2026 para la fila cargada como
-- «Próximamente» (id 242) con el nombre provisorio «Energías Renovables».
--
-- El renombre cambia el slug: el viejo redirige al nuevo desde next.config.ts,
-- que tiene que estar publicado antes de correr esto.
--
-- Sigue en proximamente = true: no hay precio, fecha de inicio ni ficha oficial.
-- El plan se publica por año porque la fuente no lo reparte por bimestre.
--
-- Correr con: npm run db -- --archivo sql/2026-10-09_gestion_energias_renovables_datos_oficiales.sql

UPDATE carreras SET
  nombre = 'Tecnicatura Superior en Gestión de Energías Renovables',
  nombre_corto = 'Gestión de Energías Renovables',
  duracion = '2 años',
  titulo = 'Técnico Superior en Gestión de Energías Renovables',
  enfoque = E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Gestión de Energías Renovables\nCertificado intermedio: Asistente en Gestión de Energías Renovables',
  descripcion = 'Estudiá gestión de energías renovables a distancia: planificación de proyectos solares y eólicos, análisis de viabilidad técnica, económica y ambiental, monitoreo de sistemas y eficiencia energética. Sumás normativa y mercado eléctrico, diagnósticos y auditorías energéticas para proponer ahorro y optimización. Empresas de energías renovables, proveedores y servicios técnicos, industria y sector agropecuario y organismos públicos.',
  plan_estudios = E'Primer Año | Bimestres 1 a 4\n'
    '• Ecosistema de Energías Renovables\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Infraestructura Energética\n'
    '• Aprendizaje Ágil (Learning Agility)\n'
    '• Comunicación Efectiva\n'
    '• Sistemas de Generación Solar Térmica y Fotovoltaica\n'
    '• Sistema de Generación Eólica\n'
    '• Procesos y Estrategias de Mejora\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Normativa y Mercado Eléctrico\n'
    '• Gestión de Presupuestos\n'
    '• Eficiencia Energética\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '• Gestión de Proyectos\n'
    '• Diseño de Sistemas Sostenibles\n'
    '• Práctica Profesionalizante',
  seccion_modalidad = E'• Organizar etapas, recursos y objetivos de proyectos solares y eólicos.\n'
    '• Asistir en análisis de factibilidad técnica, económica y ambiental.\n'
    '• Interpretar datos de producción y funcionamiento.\n'
    '• Gestionar presupuestos, cronogramas y aprovisionamiento.\n'
    '• Comparar alternativas y riesgos del proyecto energético.\n'
    '• Utilizar monitoreo remoto para detectar fallas y apoyar el mantenimiento.\n'
    '• Participar en diagnósticos y auditorías energéticas.\n'
    '• Identificar consumos críticos y proponer ahorro y optimización.',
  slides = '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Gestión de Energías Renovables?",
     "respuesta": "Estudiás sistemas de generación solar y eólica, infraestructura energética, normativa y mercado eléctrico y eficiencia energética, junto con gestión de proyectos y presupuestos y diseño de sistemas sostenibles."},
    {"pregunta": "¿Qué hace un técnico en Gestión de Energías Renovables?",
     "respuesta": "Organiza presupuestos, etapas y recursos de soluciones energéticas, asiste en evaluaciones técnicas, económicas y ambientales, interpreta datos de funcionamiento para detectar fallas y participa en diagnósticos para proponer medidas de ahorro energético."},
    {"pregunta": "¿Cuál es la salida laboral de Gestión de Energías Renovables?",
     "respuesta": "Empresas de energías renovables, en planificación y seguimiento de proyectos e instalaciones; proveedores y servicios técnicos, en abastecimiento, equipamiento y mantenimiento; la industria y el sector agropecuario, en eficiencia y operación de infraestructura energética, y organismos públicos, en programas energéticos y proyectos de desarrollo local."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer año obtenés el certificado de Asistente en Gestión de Energías Renovables, y al egresar, el título de Técnico Superior en Gestión de Energías Renovables."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización. Para hacerla se necesitan al menos 8 materias aprobadas, según las correlatividades del plan."}
  ]}]'::jsonb
WHERE id = 242 AND nombre = 'Tecnicatura Superior en Energías Renovables';
