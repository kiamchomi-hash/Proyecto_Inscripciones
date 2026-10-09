-- Carreras nuevas de Teclab: el set real (09/10/2026).
--
-- La capacitación de admisión confirmó cinco carreras nuevas: Gestión de
-- Alimentos, Gestión de Proyectos Mineros, Gestión de Energías Renovables,
-- Gestión Ambiental e Higiene y Seguridad en el Trabajo. Fintech,
-- Acompañamiento Terapéutico y Producto Digital, que se habían cargado por un
-- anuncio del Dashboard Comercial, no están: se desactivan (no se borran) y sus
-- slugs redirigen a la home desde next.config.ts.
--
-- Requiere ese código ya publicado.
--
-- Correr con: npm run db -- --archivo sql/2026-10-09_teclab_higiene_y_bajas.sql

UPDATE carreras SET activa = false
WHERE id IN (243, 244, 245)
  AND nombre IN (
    'Tecnicatura Superior en Acompañamiento Terapéutico',
    'Tecnicatura Superior en Fintech',
    'Tecnicatura Superior en Producto Digital'
  );

insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  'Tecnicatura Superior en Higiene y Seguridad en el Trabajo', 'Teclab - Gestión', 'Tecnicatura Superior en',
  'Higiene y Seguridad en el Trabajo',
  'Estudiá higiene y seguridad en el trabajo a distancia: identificación y evaluación de riesgos, mediciones y evaluación de puestos de trabajo, sistemas de seguridad y salud ocupacional y planes de emergencia. Sumás auditoría de seguridad, sistemas de calidad e investigación de incidentes para construir una cultura preventiva. Empresas e industrias, organismos públicos, salud y educación y consultoras especializadas.',
  '100% Online',
  '2 años',
  'Técnico Superior en Higiene y Seguridad en el Trabajo',
  E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Higiene y Seguridad en el Trabajo\nCertificado intermedio: Asistente en Higiene y Seguridad en el Trabajo',
  E'Primer Año | Bimestres 1 a 4\n'
    '• Gestión de la Seguridad y la Salud en el Trabajo\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Seguridad y Gestión de las Sustancias Químicas\n'
    '• Aprendizaje Ágil (Learning Agility)\n'
    '• Ambiente de Trabajo y Legislación\n'
    '• Comunicación Efectiva\n'
    '• Identificación y Evaluación de Riesgos\n'
    '• Planes de Emergencia y Evacuación\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Auditoría de Seguridad\n'
    '• Sistemas de Calidad\n'
    '• Física Aplicada a Ambientes Laborales\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '• Proceso y Estrategia de Mejora\n'
    '• Diseño de Programas de Seguridad e Investigación de Incidentes\n'
    '• Práctica Profesionalizante',
  '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Higiene y Seguridad en el Trabajo?",
     "respuesta": "Estudiás gestión de la seguridad y la salud en el trabajo, legislación, identificación y evaluación de riesgos, sustancias químicas, planes de emergencia, física aplicada a ambientes laborales, auditoría de seguridad y sistemas de calidad."},
    {"pregunta": "¿Qué hace un técnico en Higiene y Seguridad en el Trabajo?",
     "respuesta": "Identifica peligros y propone medidas preventivas, aplica mediciones y evalúa puestos de trabajo, participa en sistemas de seguridad y salud ocupacional y colabora en planes de evacuación y respuesta a contingencias."},
    {"pregunta": "¿Cuál es la salida laboral de Higiene y Seguridad en el Trabajo?",
     "respuesta": "Empresas e industrias, en prevención de riesgos en entornos productivos; organismos públicos, en aplicación de normas y evaluación de condiciones de trabajo; salud y educación, en programas de prevención y control ambiental laboral, y consultoras especializadas, en inspecciones, auditorías y capacitación en seguridad."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer año obtenés el certificado de Asistente en Higiene y Seguridad en el Trabajo, y al egresar, el título de Técnico Superior en Higiene y Seguridad en el Trabajo."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización. Para hacerla se necesitan al menos 8 materias aprobadas, según las correlatividades del plan."}
  ]}]'::jsonb,
  E'• Identificar y evaluar riesgos ambientales, tecnológicos y organizacionales.\n'
    '• Aplicar métodos de monitoreo y medición.\n'
    '• Participar en sistemas de seguridad y salud ocupacional.\n'
    '• Proponer controles para prevenir accidentes y enfermedades laborales.\n'
    '• Analizar condiciones y puestos de trabajo con información técnica.\n'
    '• Colaborar en auditorías y acciones de mejora de la prevención.\n'
    '• Participar en planes de contingencia y evacuación.\n'
    '• Coordinar acciones de respuesta y capacitación preventiva.',
  null,
  1108, true, false, false, true
where not exists (
  select 1 from public.carreras where nombre = 'Tecnicatura Superior en Higiene y Seguridad en el Trabajo'
);
