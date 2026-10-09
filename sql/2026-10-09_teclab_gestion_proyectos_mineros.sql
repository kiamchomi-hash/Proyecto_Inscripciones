-- Alta de la Tecnicatura Superior en Gestión de Proyectos Mineros (Teclab) como
-- «Próximamente», con los datos de la capacitación de admisión del 09/10/2026:
-- duración, título, certificado intermedio, plan por año, competencias y
-- preguntas frecuentes.
--
-- Sigue en proximamente = true: no hay precio, fecha de inicio ni ficha oficial
-- en teclab.edu.ar. El plan se publica por año porque la fuente no reparte las
-- materias por bimestre (8 bimestres, 4 por año).
--
-- Requiere el código que le da tipo, portada y área ya publicado: el trigger de
-- `carreras` revalida al instante.
--
-- Correr con: npm run db -- --archivo sql/2026-10-09_teclab_gestion_proyectos_mineros.sql
-- Es idempotente: si el nombre ya existe no se vuelve a insertar.

insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  'Tecnicatura Superior en Gestión de Proyectos Mineros', 'Teclab - Gestión', 'Tecnicatura Superior en',
  'Gestión de Proyectos Mineros',
  'Estudiá gestión de proyectos mineros a distancia: planificación y control de proyectos, cronogramas, hitos y reportes de avance, datos técnicos y operativos, y seguimiento de proveedores y contratistas. Sumás legislación de la industria minera, tableros de gestión y tecnologías digitales aplicadas al sector. Empresas operadoras, proveedores y contratistas, consultoras especializadas y áreas de compras y logística.',
  '100% Online',
  '2 años',
  'Técnico Superior en Gestión de Proyectos Mineros',
  E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Gestión de Proyectos Mineros\nCertificado intermedio: Asistente en Gestión de Proyectos Mineros',
  E'Primer Año | Bimestres 1 a 4\n'
    '• Industria Minera\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Análisis de Operaciones Mineras\n'
    '• Legislación de la Industria Minera\n'
    '• Gestión de Presupuestos\n'
    '• Gestión de Proyectos\n'
    '• Bases Operativas de Logística\n'
    '• Aprendizaje Ágil (Learning Agility)\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Gestión de Servicios y Proveedores\n'
    '• Comunicación Efectiva\n'
    '• Tecnologías Digitales Aplicadas a la Gestión Minera\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '• Proceso y Estrategia de Mejora\n'
    '• Gestión de Información y Análisis de Datos Operativos\n'
    '• Práctica Profesionalizante',
  '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Gestión de Proyectos Mineros?",
     "respuesta": "Estudiás la industria minera, sus operaciones y su legislación, junto con gestión de proyectos, presupuestos, logística, proveedores y análisis de datos operativos. La formación suma tecnologías digitales aplicadas a la gestión minera."},
    {"pregunta": "¿Qué hace un técnico en Gestión de Proyectos Mineros?",
     "respuesta": "Organiza cronogramas, hitos y reportes de avance, procesa datos técnicos, operativos y administrativos, asiste en compras, contratos y seguimiento de proveedores, y utiliza indicadores y herramientas digitales de gestión."},
    {"pregunta": "¿Cuál es la salida laboral de Gestión de Proyectos Mineros?",
     "respuesta": "Empresas operadoras, en seguimiento de proyectos y control de gestión; proveedores y contratistas, en organización de servicios y documentación administrativa; consultoras especializadas, y áreas de compras y logística, en seguimiento de proveedores, contratos y abastecimiento."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer año obtenés el certificado de Asistente en Gestión de Proyectos Mineros, y al egresar, el título de Técnico Superior en Gestión de Proyectos Mineros."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización. Para hacerla se necesitan al menos 8 materias aprobadas, según las correlatividades del plan."}
  ]}]'::jsonb,
  E'• Participar en la planificación y control de proyectos.\n'
    '• Relevar y procesar datos técnicos, operativos y administrativos.\n'
    '• Asistir en abastecimiento y coordinación de contratistas.\n'
    '• Seguir cronogramas, hitos, recursos y reportes de avance.\n'
    '• Elaborar informes de gestión para la toma de decisiones.\n'
    '• Seguir órdenes de compra, contratos y servicios tercerizados.\n'
    '• Analizar indicadores operativos, económicos y de desempeño.\n'
    '• Utilizar tableros y herramientas digitales de gestión.',
  null,
  1106, true, false, false, true
where not exists (
  select 1 from public.carreras where nombre = 'Tecnicatura Superior en Gestión de Proyectos Mineros'
);
