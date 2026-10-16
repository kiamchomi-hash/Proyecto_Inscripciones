-- Alta de nueve tecnicaturas nuevas de Teclab (bloques 2 y 3) con inscripción
-- abierta, con los datos de las capacitaciones de admisión de Teclab del
-- 16/10/2026: duración, título, certificado intermedio, plan por año,
-- competencias, áreas de trabajo y práctica profesionalizante.
--
-- Entran con proximamente = false y nueva = true aunque todavía no haya precio,
-- fecha de inicio ni opción de HubSpot (decisión del usuario, 16/10/2026).
-- Ninguna tiene ficha oficial en teclab.edu.ar todavía.
--
-- No confundir con las de Siglo 21 que comparten palabras (Licenciatura en
-- Administración, Gestión de Recursos Humanos): es otra casa y otro slug. Las
-- anunciadas Fintech (id 244) y Producto Digital (id 245) siguen dadas de baja;
-- Diseño de Producto Digital y Negocios Digitales Financieros son carreras
-- distintas, con su propio slug.
--
-- Requiere el código que les da área, tipo, portada y perfil del test
-- vocacional ya publicado: el trigger revalida al instante.
--
-- Correr con: npm run db -- --archivo sql/2026-10-16_teclab_bloques_2_y_3.sql
-- Es idempotente: si el nombre ya existe no se vuelve a insertar.

-- 1. Tecnicatura Superior en Administración de Empresas (Teclab - Gestión)
insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  'Tecnicatura Superior en Administración de Empresas', 'Teclab - Gestión', 'Tecnicatura Superior en',
  'Administración de Empresas',
  'Estudiá administración de empresas a distancia: contabilidad, técnica impositiva, operaciones financieras, presupuestos y costos para registrar y analizar la información de una organización. Sumás relaciones laborales, sociedades comerciales, inteligencia de negocios y transformación digital de procesos para apoyar las decisiones. Empresas privadas, organismos públicos, emprendimientos propios y consultoría y servicios.',
  '100% Online',
  '2 años',
  'Técnico Superior en Administración de Empresas',
  E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Administración de Empresas\nCertificado intermedio: Asistente en Administración de Empresas',
  E'Primer Año | Bimestres 1 a 4\n'
    '• Fundamentos de Contabilidad\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Técnica Impositiva\n'
    '• Operaciones Financieras\n'
    '• Gestión de Presupuestos\n'
    '• Relaciones Individuales y Colectivas del Trabajo\n'
    '• Procesos de Costos\n'
    '• Aprendizaje Ágil (Learning Agility)\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Estrategias de Desarrollo Humano\n'
    '• Sociedades Comerciales\n'
    '• Transformación e Innovación Organizacional\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '• Comunicación Efectiva\n'
    '• Inteligencia de Negocios\n'
    '• Práctica Profesionalizante',
  '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Administración de Empresas?",
     "respuesta": "Estudiás contabilidad, técnica impositiva, operaciones financieras, presupuestos y costos, junto con relaciones laborales, desarrollo humano, sociedades comerciales, inteligencia de negocios y transformación e innovación organizacional."},
    {"pregunta": "¿Qué hace un técnico en Administración de Empresas?",
     "respuesta": "Registra y analiza datos administrativos, contables y financieros, planifica recursos, controla gastos y analiza costos, participa en cambios e innovación dentro de la organización y usa información de negocio y herramientas de gestión para apoyar las decisiones."},
    {"pregunta": "¿Cuál es la salida laboral de Administración de Empresas?",
     "respuesta": "Empresas privadas, en presupuestos, gestión administrativa y operaciones; organismos públicos, en planificación y control de programas y recursos; emprendimientos propios, en el desarrollo y la administración de proyectos de negocio, y consultoría y servicios, en mejora de procesos y apoyo a la gestión organizacional."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer año obtenés el certificado de Asistente en Administración de Empresas, y al egresar, el título de Técnico Superior en Administración de Empresas."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización. Para hacerla se necesitan al menos 8 materias aprobadas, según las correlatividades del plan."}
  ]}]'::jsonb,
  E'• Procesar información administrativa, económica y financiera.\n'
    '• Organizar datos que apoyen la planificación y las decisiones.\n'
    '• Colaborar en la planificación y control de recursos.\n'
    '• Proyectar presupuestos, controlar gastos y analizar costos.\n'
    '• Participar en la transformación digital de procesos.\n'
    '• Aplicar mejoras e innovación en la organización.\n'
    '• Utilizar herramientas digitales y ambientes analíticos.\n'
    '• Generar reportes para decisiones estratégicas y operativas.',
  null,
  1109, true, false, true, false
where not exists (
  select 1 from public.carreras where nombre = 'Tecnicatura Superior en Administración de Empresas'
);

-- 2. Tecnicatura Superior en Administración de Negocios Digitales Financieros (Teclab - Gestión)
insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  'Tecnicatura Superior en Administración de Negocios Digitales Financieros', 'Teclab - Gestión', 'Tecnicatura Superior en',
  'Administración de Negocios Digitales Financieros',
  'Estudiá administración de negocios digitales financieros a distancia: el circuito completo de un pago digital, desde el alta del usuario hasta la autorización, la compensación y la liquidación. Sumás conciliaciones, control de riesgos y prevención de fraude, análisis de producto, métricas operativas y blockchain y ecosistema cripto. Fintech y billeteras virtuales, procesadoras y pasarelas de pago, bancos y entidades financieras y consultoras de tecnología.',
  '100% Online',
  '2 años',
  'Técnico Superior en Administración de Negocios Digitales Financieros',
  E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Administración de Negocios Digitales Financieros\nCertificado intermedio: Asistente en Administración de Negocios Digitales Financieros',
  E'Primer Año | Bimestres 1 a 4\n'
    '• Ecosistema Financiero Digital\n'
    '• Organización del Tiempo y el Trabajo\n'
    '• Operaciones Financieras\n'
    '• Administración Digital de CX\n'
    '• Probabilidad y Estadística\n'
    '• Transacciones Digitales\n'
    '• Control de Riesgos, Fraude y Regulación\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Administración Financiera\n'
    '• Comunicación Efectiva\n'
    '• Análisis de Producto\n'
    '• Tecnología Blockchain y Ecosistema Cripto\n'
    '• Modelos Financieros para Servicios Digitales\n'
    '• Aprendizaje Ágil (Learning Agility)\n'
    '• Práctica Profesionalizante',
  '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Administración de Negocios Digitales Financieros?",
     "respuesta": "Estudiás el ecosistema financiero digital, transacciones y operaciones financieras, control de riesgos, fraude y regulación, probabilidad y estadística, análisis de producto, modelos financieros para servicios digitales y tecnología blockchain y ecosistema cripto."},
    {"pregunta": "¿Qué hace un técnico en Administración de Negocios Digitales Financieros?",
     "respuesta": "Monitorea transacciones, valida operaciones y realiza conciliaciones, identifica incidencias y colabora en controles y prevención de fraude, elabora reportes y documenta flujos para mejorar la operación, y articula con producto, tecnología, riesgos y atención al cliente."},
    {"pregunta": "¿Cuál es la salida laboral de Administración de Negocios Digitales Financieros?",
     "respuesta": "Fintech y startups, como billeteras virtuales, neobancos, procesadoras y pasarelas de pago; bancos y entidades financieras, en banca digital, pagos, prevención de fraude y monitoreo operativo, y consultoras de tecnología y servicios, en la implementación e integración de soluciones de pago y servicios financieros digitales."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer año obtenés el certificado de Asistente en Administración de Negocios Digitales Financieros, y al egresar, el título de Técnico Superior en Administración de Negocios Digitales Financieros."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8 e integra los aprendizajes en un contexto laboral: son 340 horas reloj, 40 virtuales y 300 con la organización. Para hacerla se necesitan al menos 8 materias aprobadas."}
  ]}]'::jsonb,
  E'• Validar y dar de alta a los usuarios (onboarding).\n'
    '• Seguir la autorización, compensación, monitoreo y liquidación final de las transacciones.\n'
    '• Realizar conciliaciones y validaciones.\n'
    '• Detectar errores y aplicar controles y medidas de prevención de fraude definidos por la organización.\n'
    '• Registrar e interpretar datos y métricas operativas.\n'
    '• Elaborar reportes que apoyen las decisiones de niveles superiores.\n'
    '• Mapear y documentar flujos de negocio.\n'
    '• Proponer mejoras y coordinar con producto, tecnología, riesgos y atención al cliente.',
  null,
  1110, true, false, true, false
where not exists (
  select 1 from public.carreras where nombre = 'Tecnicatura Superior en Administración de Negocios Digitales Financieros'
);

-- 3. Tecnicatura Superior en Logística (Teclab - Gestión)
insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  'Tecnicatura Superior en Logística', 'Teclab - Gestión', 'Tecnicatura Superior en',
  'Logística',
  'Estudiá logística a distancia: transporte, almacenamiento y distribución, control de stock y manipulación de envíos, con la operatoria del régimen courier y los regímenes aduaneros. Sumás despacho de mercadería, gestión del transporte, proyectos y negociación para coordinar proveedores, transportistas y clientes. Transporte y distribución, industria y comercio, comercio electrónico, comercio exterior y consultoría.',
  '100% Online',
  '2 años',
  'Técnico Superior en Logística',
  E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Logística\nCertificado intermedio: Asistente en Logística',
  E'Primer Año | Bimestres 1 a 4\n'
    '• Bases Operativas de Logística\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Gestión de Manipulación y Distribución de Envíos\n'
    '• Aprendizaje Ágil (Learning Agility)\n'
    '• Fundamentos del Comercio Exterior\n'
    '• Operatoria del Régimen Courier\n'
    '• Procedimientos y Regímenes Aduaneros\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Despacho de Mercadería\n'
    '• Gestión de Proyectos\n'
    '• Gestión del Transporte\n'
    '• Negociación y Persuasión\n'
    '• Comunicación Efectiva\n'
    '• Gestión de Personas\n'
    '• Práctica Profesionalizante',
  '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Logística?",
     "respuesta": "Estudiás las bases operativas de la logística, la manipulación y distribución de envíos, el régimen courier, los procedimientos aduaneros y el despacho de mercadería, junto con gestión del transporte, gestión de proyectos, negociación y gestión de personas."},
    {"pregunta": "¿Qué hace un técnico en Logística?",
     "respuesta": "Integra transporte, almacenamiento y distribución, registra movimientos y optimiza niveles de stock, articula proveedores, transportistas y clientes y analiza costos, tiempos y riesgos en la cadena de suministro."},
    {"pregunta": "¿Cuál es la salida laboral de Logística?",
     "respuesta": "Transporte y distribución, en planificación de rutas, flotas y movimientos de carga; industria y comercio, en abastecimiento, almacenamiento y distribución de bienes; comercio electrónico, en gestión de pedidos y entregas de última milla, y comercio exterior y consultoría, en documentación y mejora de procesos logísticos."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer año obtenés el certificado de Asistente en Logística, y al egresar, el título de Técnico Superior en Logística."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización. Para hacerla se necesitan al menos 8 materias aprobadas, según las correlatividades del plan."}
  ]}]'::jsonb,
  E'• Integrar transporte, almacenamiento y distribución.\n'
    '• Equilibrar costos, calidad y tiempos de entrega de la cadena.\n'
    '• Registrar movimientos y controlar niveles de stock.\n'
    '• Organizar inventarios y mejorar el uso del espacio de almacenamiento.\n'
    '• Coordinar proveedores, transportistas y clientes.\n'
    '• Articular flujos de bienes, información y recursos.\n'
    '• Analizar datos y oportunidades de mejora.\n'
    '• Evaluar costos, tiempos y riesgos de operaciones nacionales e internacionales.',
  null,
  1111, true, false, true, false
where not exists (
  select 1 from public.carreras where nombre = 'Tecnicatura Superior en Logística'
);

-- 4. Tecnicatura Superior en Comercio Exterior (Teclab - Gestión)
insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  'Tecnicatura Superior en Comercio Exterior', 'Teclab - Gestión', 'Tecnicatura Superior en',
  'Comercio Exterior',
  'Estudiá comercio exterior a distancia: documentación de importación y exportación, procedimientos y regímenes aduaneros, clasificación arancelaria y finanzas y pagos internacionales. Sumás transporte internacional, costos y precios internacionales y estrategias de comercialización para identificar oportunidades en otros mercados. Empresas importadoras y exportadoras, agencias de carga, despachos de aduana y consultoras y compras internacionales.',
  '100% Online',
  '2 años',
  'Técnico Superior en Comercio Exterior',
  E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Comercio Exterior\nCertificado intermedio: Asistente en Comercio Exterior',
  E'Primer Año | Bimestres 1 a 4\n'
    '• Fundamentos del Comercio Exterior\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Economía Aplicada y Competitividad\n'
    '• Finanzas y Pagos Internacionales\n'
    '• Administración Jurídica\n'
    '• Gestión Operativa de Importación\n'
    '• Procedimientos y Regímenes Aduaneros\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Clasificación Arancelaria\n'
    '• Gestión Operativa de Exportación\n'
    '• Gestión del Transporte\n'
    '• Administración Digital de Operaciones de Comercio Exterior\n'
    '• Estrategias de Comercialización Internacional\n'
    '• Aprendizaje Ágil (Learning Agility)\n'
    '• Práctica Profesionalizante',
  '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Comercio Exterior?",
     "respuesta": "Estudiás la gestión operativa de importación y exportación, procedimientos y regímenes aduaneros, clasificación arancelaria, finanzas y pagos internacionales y gestión del transporte, junto con economía aplicada, administración jurídica y estrategias de comercialización internacional."},
    {"pregunta": "¿Qué hace un técnico en Comercio Exterior?",
     "respuesta": "Prepara y controla documentos de importación y exportación, selecciona y sigue cadenas de transporte internacional, aplica variables fiscales, logísticas y condiciones comerciales y organiza datos para identificar oportunidades en el exterior."},
    {"pregunta": "¿Cuál es la salida laboral de Comercio Exterior?",
     "respuesta": "Empresas importadoras y exportadoras, en documentación y seguimiento de operaciones comerciales; agencias de carga, en coordinación de fletes y logística internacional; despachos de aduana, en apoyo técnico y verificación de documentación, y consultoras y compras internacionales, en información de mercados y seguimiento de proveedores."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer año obtenés el certificado de Asistente en Comercio Exterior, y al egresar, el título de Técnico Superior en Comercio Exterior."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización. Para hacerla se necesitan al menos 8 materias aprobadas, según las correlatividades del plan."}
  ]}]'::jsonb,
  E'• Preparar y verificar documentación comercial y contractual.\n'
    '• Aplicar condiciones de compraventa y requisitos aduaneros.\n'
    '• Seleccionar cadenas de transporte multimodal.\n'
    '• Seguir mercaderías, fletes y seguros internacionales.\n'
    '• Determinar costos y precios internacionales.\n'
    '• Considerar variables fiscales, logísticas y condiciones comerciales.\n'
    '• Relevar y procesar datos para perfiles de mercado.\n'
    '• Apoyar planes de exportación y oportunidades de intercambio.',
  null,
  1112, true, false, true, false
where not exists (
  select 1 from public.carreras where nombre = 'Tecnicatura Superior en Comercio Exterior'
);

-- 5. Tecnicatura Superior en Administración de Riesgos Empresariales (Teclab - Gestión)
insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  'Tecnicatura Superior en Administración de Riesgos Empresariales', 'Teclab - Gestión', 'Tecnicatura Superior en',
  'Administración de Riesgos Empresariales',
  'Estudiá administración de riesgos empresariales a distancia: análisis de riesgo, matrices y controles, prevención de fraude y cumplimiento normativo, y el marco legal del contrato de seguros. Sumás continuidad del negocio, manejo de riesgos y operaciones de seguridad, estadística e inteligencia de negocios para monitorear la exposición de una organización. Fintech, banca y seguros, áreas de control interno, organismos públicos y consultoría especializada.',
  '100% Online',
  '2 años',
  'Técnico Superior en Administración de Riesgos Empresariales',
  E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Administración de Riesgos Empresariales\nCertificado intermedio: Asistente en Administración de Riesgos Empresariales',
  E'Primer Año | Bimestres 1 a 4\n'
    '• Sociedades Comerciales\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Análisis de Riesgo\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '• Marco Legal del Contrato de Seguros\n'
    '• Aplicación de Procedimientos en la Gestión de Riesgos\n'
    '• Comunicación Efectiva\n'
    '• Control de Riesgo, Fraude y Regulación\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Probabilidad y Estadística\n'
    '• Manejo de Riesgos y Operaciones de Seguridad\n'
    '• Aprendizaje Ágil (Learning Agility)\n'
    '• Gestión de la Continuidad del Negocio\n'
    '• Ecosistema Financiero Digital\n'
    '• Inteligencia de Negocios\n'
    '• Práctica Profesionalizante',
  '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Administración de Riesgos Empresariales?",
     "respuesta": "Estudiás análisis de riesgo, procedimientos de gestión de riesgos, control de riesgo, fraude y regulación y el marco legal del contrato de seguros, junto con continuidad del negocio, operaciones de seguridad, probabilidad y estadística e inteligencia de negocios."},
    {"pregunta": "¿Qué hace un técnico en Administración de Riesgos Empresariales?",
     "respuesta": "Releva vulnerabilidades y construye matrices de riesgo, verifica procesos y colabora en la prevención de fraude, administra información de seguros y el seguimiento de siniestros y ejecuta protocolos ante interrupciones e incidentes."},
    {"pregunta": "¿Cuál es la salida laboral de Administración de Riesgos Empresariales?",
     "respuesta": "Fintech, banca y seguros, en fraude, cumplimiento y gestión administrativa de coberturas; control interno, en auditoría de circuitos y seguimiento de riesgos operativos; organismos públicos, en fiscalización y protocolos de respuesta ante contingencias, y consultoría especializada, en diagnósticos de riesgo y continuidad del negocio."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer año obtenés el certificado de Asistente en Administración de Riesgos Empresariales, y al egresar, el título de Técnico Superior en Administración de Riesgos Empresariales."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización. Para hacerla se necesitan al menos 8 materias aprobadas, según las correlatividades del plan."}
  ]}]'::jsonb,
  E'• Detectar y registrar vulnerabilidades de procesos.\n'
    '• Utilizar mapas y matrices para analizar riesgos.\n'
    '• Verificar circuitos y ejecutar auditorías operativas.\n'
    '• Colaborar en la detección de fraude y el cumplimiento normativo.\n'
    '• Administrar documentación y contratos de seguros.\n'
    '• Analizar cláusulas y seguir la gestión de siniestros.\n'
    '• Ejecutar planes de continuidad del negocio.\n'
    '• Aplicar protocolos para reducir el impacto de interrupciones e incidentes.',
  null,
  1113, true, false, true, false
where not exists (
  select 1 from public.carreras where nombre = 'Tecnicatura Superior en Administración de Riesgos Empresariales'
);

-- 6. Tecnicatura Superior en Diseño de Producto Digital (Teclab - Tecnología)
insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  'Tecnicatura Superior en Diseño de Producto Digital', 'Teclab - Tecnología', 'Tecnicatura Superior en',
  'Diseño de Producto Digital',
  'Estudiá diseño de producto digital a distancia: cómo coordinar el ciclo de vida de una aplicación o un servicio digital, conectando las necesidades del negocio y del usuario con el trabajo de diseño y tecnología. Sumás descubrimiento de productos con inteligencia artificial, hojas de ruta, métricas de conversión y retención y metodologías ágiles. Equipos de producto digital, análisis funcional, investigación y validación con usuarios y proyectos de transformación digital.',
  '100% Online',
  '2 años',
  'Técnico Superior en Diseño de Producto Digital',
  E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Diseño de Producto Digital\nCertificado intermedio: Asistente en Diseño de Producto Digital',
  E'Primer Año | Bimestres 1 a 4\n'
    '• Diseño de Productos Digitales\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Gestión Operativa de Producto\n'
    '• Análisis de Producto\n'
    '• Descubrimiento de Productos Digitales con IA\n'
    '• Gestión de Objetivos\n'
    '• Gestión Estratégica y Planificación de Productos Digitales\n'
    '• Aprendizaje Ágil (Learning Agility)\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• IA Aplicada al Diseño y Gestión de Producto\n'
    '• Comunicación Efectiva\n'
    '• Transformación e Innovación Organizacional\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '• Gestión de Presupuestos\n'
    '• Inteligencia de Negocios\n'
    '• Práctica Profesionalizante',
  '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Diseño de Producto Digital?",
     "respuesta": "Estudiás diseño, análisis y gestión operativa de productos digitales, descubrimiento de productos con inteligencia artificial, planificación estratégica y gestión de objetivos, junto con IA aplicada al diseño y la gestión de producto, presupuestos e inteligencia de negocios."},
    {"pregunta": "¿Qué hace un técnico en Diseño de Producto Digital?",
     "respuesta": "Prioriza funcionalidades y elabora hojas de ruta del producto, identifica problemas de usuarios y valida soluciones tempranas, interpreta conversiones, retención y tableros de control y gestiona tareas con metodologías ágiles entre diseño, tecnología y negocio."},
    {"pregunta": "¿Cuál es la salida laboral de Diseño de Producto Digital?",
     "respuesta": "Equipos de producto digital, en planificar funcionalidades y coordinar el trabajo entre negocio, diseño y tecnología; análisis funcional, en relevar necesidades y documentar historias de usuario; investigación y validación, en entrevistas, prototipos y pruebas de usabilidad, y transformación digital, en la digitalización de servicios y la automatización de flujos."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer tramo de la carrera obtenés el certificado de Asistente en Diseño de Producto Digital, y al egresar, el título de Técnico Superior en Diseño de Producto Digital."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización. Para hacerla se necesitan al menos 8 materias aprobadas, según las correlatividades del plan."}
  ]}]'::jsonb,
  E'• Priorizar funcionalidades y elaborar hojas de ruta del producto.\n'
    '• Definir objetivos e indicadores para seguir su evolución.\n'
    '• Identificar problemas de usuarios y validar soluciones tempranas.\n'
    '• Participar en prototipos y pruebas para incorporar mejoras.\n'
    '• Interpretar conversiones, retención y tableros de control.\n'
    '• Elaborar reportes que orienten decisiones de producto.\n'
    '• Gestionar tareas con metodologías ágiles y facilitar la comunicación.\n'
    '• Articular requerimientos entre diseño, tecnología y negocio.',
  null,
  1114, true, false, true, false
where not exists (
  select 1 from public.carreras where nombre = 'Tecnicatura Superior en Diseño de Producto Digital'
);

-- 7. Tecnicatura Superior en Diseño de Experiencia de Usuario (User Experience) (Teclab - Tecnología)
insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  'Tecnicatura Superior en Diseño de Experiencia de Usuario (User Experience)', 'Teclab - Tecnología', 'Tecnicatura Superior en',
  'Diseño de Experiencia de Usuario (UX)',
  'Estudiá diseño de experiencia de usuario a distancia: investigación con usuarios, arquitectura de la información, diseño de interacción y de contenidos y prototipado. Sumás pruebas de usabilidad, sistemas de diseño y la entrega a desarrollo para crear productos digitales fáciles de usar y accesibles. Startups y empresas, consultoras y agencias, equipos de producto y servicios independientes.',
  '100% Online',
  '2 años',
  'Técnico Superior en Diseño de Experiencia de Usuario (User Experience)',
  E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Diseño de Experiencia de Usuario (User Experience)\nCertificado intermedio: Asistente en Diseño de Experiencia de Usuario (User Experience)',
  E'Primer Año | Bimestres 1 a 4\n'
    '• Principios de Diseño de UX\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Estrategias de Investigación\n'
    '• Gestión de Marca\n'
    '• Arquitectura de la Información\n'
    '• Diseño de Contenidos\n'
    '• Diseño de Interacción\n'
    '• Aprendizaje Ágil (Learning Agility)\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Prototipado y Validación\n'
    '• Proceso y Estrategia de Mejora\n'
    '• Sistema de Diseño\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '• Comunicación Efectiva\n'
    '• Estrategias de Presentación de Producto\n'
    '• Práctica Profesionalizante',
  '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Diseño de Experiencia de Usuario (User Experience)?",
     "respuesta": "Estudiás principios de diseño de UX, estrategias de investigación, arquitectura de la información, diseño de contenidos y de interacción, prototipado y validación y sistemas de diseño, junto con gestión de marca y estrategias de presentación de producto."},
    {"pregunta": "¿Qué hace un técnico en Diseño de Experiencia de Usuario (User Experience)?",
     "respuesta": "Releva necesidades y comportamientos de los usuarios con entrevistas y pruebas, organiza información, navegación y flujos de interacción, construye prototipos para evaluar las soluciones y aplica pruebas de usabilidad para mejorar el diseño con evidencia."},
    {"pregunta": "¿Cuál es la salida laboral de Diseño de Experiencia de Usuario (User Experience)?",
     "respuesta": "Startups y empresas, en el diseño y la evaluación de experiencias digitales; consultoras y agencias, en investigación y propuestas de diseño para clientes; equipos de producto, en la articulación con diseño, desarrollo y áreas de negocio, y servicios independientes, en proyectos de investigación y diseño de experiencia."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer año obtenés el certificado de Asistente en Diseño de Experiencia de Usuario (User Experience), y al egresar, el título de Técnico Superior en Diseño de Experiencia de Usuario (User Experience)."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización. Para hacerla se necesitan al menos 8 materias aprobadas, según las correlatividades del plan."}
  ]}]'::jsonb,
  E'• Investigar necesidades, motivaciones y problemas de los usuarios.\n'
    '• Realizar entrevistas y pruebas para orientar el diseño.\n'
    '• Organizar contenidos, navegación y flujos de interacción.\n'
    '• Diseñar experiencias con foco en facilidad de uso y accesibilidad.\n'
    '• Transformar ideas en prototipos.\n'
    '• Hacer tangibles las soluciones para probar su funcionamiento.\n'
    '• Evaluar las soluciones con usuarios.\n'
    '• Mejorar iterativamente el diseño a partir de pruebas de usabilidad.',
  null,
  1115, true, false, true, false
where not exists (
  select 1 from public.carreras where nombre = 'Tecnicatura Superior en Diseño de Experiencia de Usuario (User Experience)'
);

-- 8. Tecnicatura Superior en Gestión de Equipos Ágiles (Agile Coaching) (Teclab - Gestión)
insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  'Tecnicatura Superior en Gestión de Equipos Ágiles (Agile Coaching)', 'Teclab - Gestión', 'Tecnicatura Superior en',
  'Gestión de Equipos Ágiles (Agile Coaching)',
  'Estudiá gestión de equipos ágiles a distancia: principios de la agilidad, estrategias de facilitación, formación de equipos ágiles y modelos y técnicas de escalado. Sumás liderazgo y pensamiento sistémico, gestión de personas y de objetivos y transformación organizacional para acompañar a equipos y líderes en el cambio. Gestión de organizaciones, servicios y consultoría, áreas de personas y equipos de tecnología y de otros sectores.',
  '100% Online',
  '2 años',
  'Técnico Superior en Gestión de Equipos Ágiles (Agile Coaching)',
  E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Gestión de Equipos Ágiles (Agile Coaching)\nCertificado intermedio: Asistente en Gestión de Equipos Ágiles (Agile Coaching)',
  E'Primer Año | Bimestres 1 a 4\n'
    '• Principios de la Agilidad\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Estrategias de Facilitación\n'
    '• Aprendizaje Ágil (Learning Agility)\n'
    '• Formación de Equipos Ágiles\n'
    '• Experiencia de las Personas\n'
    '• Ecosistema de la Evolución Ágil e Innovación\n'
    '• Gestión de Personas\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Gestión de Objetivos\n'
    '• Liderazgo y Pensamiento Sistémico\n'
    '• Modelos y Técnicas de Escalado\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '• Análisis de Experiencia del Cliente\n'
    '• Transformación e Innovación Organizacional\n'
    '• Práctica Profesionalizante',
  '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Gestión de Equipos Ágiles (Agile Coaching)?",
     "respuesta": "Estudiás principios de la agilidad, estrategias de facilitación, formación de equipos ágiles y modelos y técnicas de escalado, junto con gestión de personas y de objetivos, liderazgo y pensamiento sistémico y transformación e innovación organizacional."},
    {"pregunta": "¿Qué hace un técnico en Gestión de Equipos Ágiles (Agile Coaching)?",
     "respuesta": "Organiza conversaciones, reuniones y eventos de equipos, guía el uso de métodos y herramientas según el proyecto, promueve el aprendizaje y una mentalidad ágil en la organización y observa resultados para detectar obstáculos y facilitar mejoras."},
    {"pregunta": "¿Cuál es la salida laboral de Gestión de Equipos Ágiles (Agile Coaching)?",
     "respuesta": "Gestión de organizaciones, en coordinación de equipos y mejora de procesos; servicios y consultoría, en el acompañamiento de proyectos y cambios organizacionales; áreas de personas, en agilidad aplicada al talento y a la cultura de trabajo, y tecnología y otros sectores, en facilitación de equipos y adopción de marcos ágiles."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el primer año obtenés el certificado de Asistente en Gestión de Equipos Ágiles (Agile Coaching), y al egresar, el título de Técnico Superior en Gestión de Equipos Ágiles (Agile Coaching)."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización. Para hacerla se necesitan al menos 8 materias aprobadas, según las correlatividades del plan."}
  ]}]'::jsonb,
  E'• Facilitar conversaciones, reuniones y eventos de equipos.\n'
    '• Promover colaboración, autogestión y aprendizaje continuo.\n'
    '• Guiar la adopción de métodos ágiles según el proyecto.\n'
    '• Acompañar a equipos y líderes en el uso de sus herramientas.\n'
    '• Desarrollar pensamiento y cultura ágil.\n'
    '• Participar con líderes en la estrategia de transformación organizacional.\n'
    '• Observar cómo trabajan y se relacionan los equipos.\n'
    '• Detectar obstáculos y facilitar mejoras en sus resultados.',
  null,
  1116, true, false, true, false
where not exists (
  select 1 from public.carreras where nombre = 'Tecnicatura Superior en Gestión de Equipos Ágiles (Agile Coaching)'
);

-- 9. Tecnicatura Superior en Recursos Humanos (Teclab - Gestión)
insert into public.carreras (
  nombre, nivel, prefix, nombre_corto, descripcion, modalidad,
  duracion, titulo, enfoque, plan_estudios, slides, seccion_modalidad, seccion_duracion,
  orden, activa, destacada, nueva, proximamente
)
select
  'Tecnicatura Superior en Recursos Humanos', 'Teclab - Gestión', 'Tecnicatura Superior en',
  'Recursos Humanos',
  'Estudiá recursos humanos a distancia: el proceso de reclutamiento completo, de la descripción del puesto a las técnicas de atracción de talento, la entrevista y la preselección. Sumás onboarding, experiencia de las personas, indicadores de selección y fidelización de talento. Áreas internas de recursos humanos, consultoras de selección, empresas de servicios de personal y reclutamiento especializado.',
  '100% Online',
  '2 años',
  'Técnico Superior en Recursos Humanos',
  E'Modalidad: 100% Online\nDuración: 2 años\nTítulo: Técnico Superior en Recursos Humanos\nCertificado intermedio: Asistente en Recursos Humanos',
  E'Primer Año | Bimestres 1 a 4\n'
    '• Proceso de Reclutamiento\n'
    '• Organización del Tiempo y del Trabajo\n'
    '• Técnicas de Reclutamiento y Atracción de Talento\n'
    '• Negociación y Persuasión\n'
    '• Entrevista y Preselección\n'
    '• Comunicación Efectiva\n'
    '• Técnicas de Preselección\n'
    '• Aprendizaje Ágil (Learning Agility)\n'
    '\n'
    'Segundo Año | Bimestres 5 a 8\n'
    '• Análisis de Experiencia del Cliente\n'
    '• Experiencia de Personas\n'
    '• Análisis de Indicadores de Selección\n'
    '• Decisiones y Resoluciones Eficientes\n'
    '• Gestión de Presupuestos\n'
    '• Fidelización de Talento\n'
    '• Práctica Profesionalizante',
  '[{"type": "faq", "items": [
    {"pregunta": "¿Qué se aprende en la Tecnicatura en Recursos Humanos?",
     "respuesta": "Estudiás el proceso de reclutamiento, técnicas de atracción de talento, entrevista y preselección, negociación y comunicación, junto con experiencia de las personas, análisis de indicadores de selección, presupuestos y fidelización de talento."},
    {"pregunta": "¿Qué hace un técnico en Recursos Humanos?",
     "respuesta": "Comprende las necesidades y describe el puesto a cubrir, selecciona fuentes y canales para las búsquedas, analiza perfiles y realiza entrevistas de preselección y participa en el onboarding y la inducción de nuevos colaboradores."},
    {"pregunta": "¿Cuál es la salida laboral de Recursos Humanos?",
     "respuesta": "Áreas internas de recursos humanos, en reclutamiento y apoyo a la gestión de personas; consultoras de selección, en búsqueda y preselección de candidatos para clientes; empresas de servicios de personal, en la administración y el seguimiento de procesos de contratación, y reclutamiento especializado, en la atracción y evaluación inicial de perfiles profesionales."},
    {"pregunta": "¿Tiene certificado intermedio?",
     "respuesta": "Sí. Al completar el trayecto inicial obtenés el certificado de Asistente en Recursos Humanos, y al egresar, el título de Técnico Superior en Recursos Humanos."},
    {"pregunta": "¿Tiene prácticas?",
     "respuesta": "Sí. La Práctica Profesionalizante se cursa en el bimestre 8: son 340 horas reloj, 40 virtuales y 300 en una organización. Para hacerla se necesitan al menos 8 materias aprobadas, según las correlatividades del plan."}
  ]}]'::jsonb,
  E'• Relevar necesidades y requerimientos del puesto.\n'
    '• Definir el perfil que orientará la búsqueda de candidatos.\n'
    '• Elegir fuentes, canales y contenidos de reclutamiento.\n'
    '• Diseñar ofertas alineadas con la cultura y los valores de la organización.\n'
    '• Identificar candidatos y realizar entrevistas de preselección.\n'
    '• Organizar información y etapas del proceso de reclutamiento.\n'
    '• Participar en onboarding e inducción.\n'
    '• Cuidar la experiencia del candidato y acompañar su incorporación.',
  null,
  1117, true, false, true, false
where not exists (
  select 1 from public.carreras where nombre = 'Tecnicatura Superior en Recursos Humanos'
);
