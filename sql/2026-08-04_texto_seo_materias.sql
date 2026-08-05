-- Texto propio de cada materia en /clases-apoyo/<slug>, más los acentos que
-- faltaban en las viñetas. Inglés y Apoyo Secundario van sin texto: están en
-- construcción. El porqué está en INDEXACION.md § 1.

-- descripcion es jsonb, así que texto_seo va igual. El drop es por si quedó
-- creada como text[] en un intento anterior: la columna es nueva y no tiene
-- datos que perder.
alter table materias drop column if exists texto_seo;
alter table materias add column texto_seo jsonb;

comment on column materias.texto_seo is
  'Párrafos que se renderizan bajo la app en /clases-apoyo/<slug>. Admite <strong>; pasa por sanitizeContent.';

-- ── Matemática ──
update materias set texto_seo = jsonb_build_array(
  'Las clases de apoyo de Matemática del CAU Villa Lugano son <strong>individuales y presenciales</strong>: un alumno por turno, en Guaminí 4876. No hay un programa cerrado ni un grupo al que alcanzar. Traés los temas que estás viendo en la escuela y se trabaja sobre eso, al ritmo que te haga falta.',
  'Se cubren los contenidos habituales de primaria y secundaria: operaciones con números enteros, racionales y reales, ecuaciones e inecuaciones, sistemas de ecuaciones, polinomios, funciones y sus gráficos, geometría, trigonometría, probabilidad y estadística. También la preparación puntual de una evaluación, un final o una materia previa.',
  'El foco no está sólo en resolver el ejercicio de hoy: está en el <strong>método de estudio</strong>. La idea es que entiendas por qué un procedimiento funciona y puedas encarar solo el ejercicio siguiente, sin depender de que alguien te lo explique cada vez.',
  'Para tomar una clase elegís el día en el calendario de esta página y el horario que te quede cómodo, dejás tus datos y te responde el profesor por WhatsApp. Los turnos son de lunes a viernes. Quienes asisten <strong>todas las semanas</strong> tienen un descuento por continuidad.'
) where slug = 'matematica';

-- ── Lengua ──
update materias set texto_seo = jsonb_build_array(
  'Las clases de apoyo de Lengua del CAU Villa Lugano son <strong>individuales y presenciales</strong>, en Guaminí 4876. Se trabaja sobre el material de tu escuela: la consigna que no entendés, el texto que tenés que analizar o el trabajo práctico que hay que entregar.',
  'Los temas más pedidos son <strong>análisis sintáctico</strong>, ortografía, gramática y comprensión de textos. También producción escrita: cómo armar un resumen, cómo estructurar un texto argumentativo y cómo revisar lo que escribiste antes de entregarlo.',
  'Para exámenes y trabajos prácticos se practica con modelos de evaluación y guías de estudio vigentes, de modo que llegues a la prueba habiendo resuelto antes ejercicios del mismo tipo.',
  'Para tomar una clase elegís el día en el calendario de esta página y el horario disponible, dejás tus datos y te responde la profesora por WhatsApp. Los turnos son de lunes a viernes.'
) where slug = 'lengua';

-- ── Computación ──
update materias set texto_seo = jsonb_build_array(
  'Las clases de Computación del CAU Villa Lugano son <strong>individuales y presenciales</strong>, en Guaminí 4876, y se arman según lo que necesites resolver: no hay un curso con temario fijo al que haya que entrar.',
  'Se ven <strong>herramientas ofimáticas</strong> —procesador de textos, planillas de cálculo y presentaciones—, manejo del sistema operativo, organización de archivos y uso de internet: buscar información, correo electrónico, trámites en línea y cuidado de los datos personales.',
  'Buena parte de las consultas son de <strong>alfabetización informática</strong> para adultos que arrancan de cero, y de manejo de plataformas educativas: entrar al campus, subir un trabajo, rendir en línea o resolver el software específico que pide una materia.',
  'También hay apoyo en proyectos digitales escolares. Para tomar una clase elegís el día en el calendario de esta página y el horario disponible, dejás tus datos y te responde el profesor por WhatsApp. Los turnos son de lunes a viernes.'
) where slug = 'computacion';

-- ── Arte ──
update materias set texto_seo = jsonb_build_array(
  'Las clases de Arte del CAU Villa Lugano son <strong>individuales y presenciales</strong>, en Guaminí 4876. Sirven tanto para resolver un trabajo puntual de la escuela como para desarrollar producción propia sin una entrega de por medio.',
  'Se trabajan <strong>técnicas visuales</strong> —dibujo, color, composición—, historia del arte y expresión creativa. El acompañamiento incluye la <strong>carpeta técnica</strong>: cómo presentarla, qué tiene que mostrar y cómo justificar las decisiones que tomaste en cada lámina.',
  'La parte de análisis compositivo es la que más cuesta y la que más se pide: reconocer qué hace que una imagen funcione, poder explicarlo con vocabulario preciso y después aplicarlo en tu propia producción.',
  'Para tomar una clase elegís el día en el calendario de esta página y el horario disponible, dejás tus datos y te responde la profesora por WhatsApp. Los turnos son de lunes a viernes.'
) where slug = 'arte';

-- ── Acentos faltantes en las viñetas del panel ──
update materias set descripcion = jsonb_build_array(
  'Ayuda en: <strong>Análisis sintáctico, Ortografía, Gramática y Comprensión de textos</strong>.',
  'Preparación para <strong>exámenes y trabajos prácticos</strong> académicos.',
  'Práctica con modelos de evaluación y <strong>guías de estudio</strong> vigentes.'
) where slug = 'lengua';

update materias set descripcion = jsonb_build_array(
  'Capacitación en <strong>Herramientas Ofimáticas, Sistemas Operativos e Internet</strong>.',
  'Apoyo en <strong>proyectos digitales y alfabetización informática</strong>.',
  'Optimización del uso de <strong>plataformas educativas y software específico</strong>.'
) where slug = 'computacion';

update materias set descripcion = jsonb_build_array(
  'Exploración de <strong>Técnicas Visuales, Historia del Arte y Expresión Creativa</strong>.',
  'Apoyo en <strong>proyectos artísticos escolares y carpetas técnicas</strong>.',
  'Desarrollo de <strong>habilidades estéticas y análisis compositivo</strong>.'
) where slug = 'arte';

-- Control: las cuatro con texto, las dos en construcción sin él.
select slug, en_construccion, coalesce(jsonb_array_length(texto_seo), 0) as parrafos
from materias where activa = true order by orden;
