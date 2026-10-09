-- Alta de la Tecnicatura Superior en Gestión Ambiental (Teclab) como
-- «Próximamente», con los datos de la capacitación de admisión del 09/10/2026.
--
-- No confundir con la Licenciatura en Gestión Ambiental de Siglo 21 (id 20): es
-- otra casa y otro slug (tecnicatura-superior-en-gestion-ambiental).
--
-- Sigue en proximamente = true: no hay precio, fecha de inicio ni ficha oficial.
-- El plan se publica por año porque la fuente no lo reparte por bimestre.
--
-- Requiere el código que le da tipo y portada ya publicado.
--
-- Correr con: npm run db -- --archivo sql/2026-10-09_teclab_gestion_ambiental.sql
-- Es idempotente: si el nombre ya existe no se vuelve a insertar.

insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  'Tecnicatura Superior en Gestión Ambiental', 'Teclab - Gestión', 'Tecnicatura Superior en',
  'Gestión Ambiental',
  'Estudiá gestión ambiental a distancia: normativa ambiental, monitoreo de emisiones, residuos y consumo de recursos, sistemas de gestión y auditoría y prevención de impactos. Sumás economía circular, cambio climático y huella de carbono para mejorar el desempeño ambiental de una organización. Empresas e industrias, consultoras ambientales, organismos públicos, organizaciones y emprendimientos.',
  '100% Online',
  '2 años',
  'Técnico Superior en Gestión Ambiental',
  E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Gestión Ambiental\nCertificado intermedio: Asistente en Gestión Ambiental',
  E'Primer Año | Bimestres 1 a 4\n'
    '• Ambiente, Sociedad y Desarrollo Sostenible\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Legislación Ambiental\n'
    '• Identificación y Evaluación de Riesgo\n'
    '• Evaluación de Impacto Ambiental\n'
    '• Residuos y Economía Circular\n'
    '• Cambio Climático y Huella de Carbono\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Sistemas de Gestión y Auditoría\n'
    '• Gestión de Presupuestos\n'
    '• Sostenibilidad Organizacional\n'
    '• Seguridad y Gestión de Sustancias Químicas\n'
    '• Liderazgo y Pensamiento Sistémico\n'
    '• Gestión de Proyectos\n'
    '• Práctica Profesionalizante',
  '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Gestión Ambiental?",
     "respuesta": "Estudiás legislación ambiental, evaluación de riesgo e impacto ambiental, residuos y economía circular, cambio climático y huella de carbono, y sistemas de gestión y auditoría, junto con presupuestos, proyectos y sostenibilidad organizacional."},
    {"pregunta": "¿Qué hace un técnico en Gestión Ambiental?",
     "respuesta": "Organiza matrices de cumplimiento, trámites y documentación, releva datos de emisiones, residuos y consumo de recursos, participa en programas ambientales y procesos de auditoría y apoya acciones de mitigación y mejora del desempeño ambiental."},
    {"pregunta": "¿Cuál es la salida laboral de Gestión Ambiental?",
     "respuesta": "Empresas e industrias, en seguimiento de impactos y sistemas de gestión ambiental; consultoras ambientales, en documentación técnica, auditorías y monitoreo; organismos públicos, en cumplimiento normativo y políticas ambientales, y organizaciones y emprendimientos, en gestión de residuos y acciones de sostenibilidad."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer año obtenés el certificado de Asistente en Gestión Ambiental, y al egresar, el título de Técnico Superior en Gestión Ambiental."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización. Para hacerla se necesitan al menos 8 materias aprobadas, según las correlatividades del plan."}
  ]}]'::jsonb,
  E'• Interpretar y aplicar normativa ambiental.\n'
    '• Relevar información sobre emisiones, residuos y recursos.\n'
    '• Participar en sistemas y programas de gestión ambiental.\n'
    '• Preparar matrices de cumplimiento, trámites, documentación y reportes.\n'
    '• Organizar indicadores para el seguimiento ambiental.\n'
    '• Colaborar en auditorías y seguimiento de certificaciones.\n'
    '• Apoyar acciones para reducir impactos ambientales.\n'
    '• Proponer mejoras y seguir programas de sostenibilidad.',
  null,
  1107, true, false, false, true
where not exists (
  select 1 from public.carreras where nombre = 'Tecnicatura Superior en Gestión Ambiental'
);
