-- Carreras del Instituto Técnico Superior Teclab (17 tecnicaturas).
-- Generado desde los PDF oficiales de plan de estudio.
-- Ejecutar en el SQL Editor de Supabase.

delete from carreras where nivel in ('Teclab - Tecnología', 'Teclab - Gestión');

insert into carreras (nombre, nivel, duracion, titulo, enfoque, modalidad, descripcion, prefix, nombre_corto, seccion_duracion, seccion_modalidad, plan_estudios, orden, activa, destacada, nueva) values
  ('Tecnicatura Superior en Programación', 'Teclab - Tecnología', '2 años', 'Técnico Superior en Programación', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Programación
Certificado intermedio: Auxiliar en Programación
Cocreación: Avenga', '100% Online', 'Dominá distintos lenguajes de programación y creá aplicaciones, sitios web y sistemas de software, desde el front end hasta la base de datos. Empresas de desarrollo de software, áreas de sistemas de cualquier compañía, sector público, emprendimientos propios y trabajo freelance.', 'Tecnicatura Superior en', 'Programación', NULL, '• Gestionar la configuración del software, implementando técnicas y metodologías para documentar, evaluar y mantener su correcto funcionamiento.
• Manejo de clases, creación de módulos, diseño de pantallas, implementación de rutinas, subsistemas, conforme a requerimientos (funcionales y técnicos) e integrarlos en aplicaciones, acorde al desarrollo del proyecto.
• Analizar y gestionar bases de datos y sistemas gestores conforme a los requerimientos del entorno, garantizando la integridad, disponibilidad y confidencialidad de la información.
• Desarrollar sitios web modulares y eficientes, a partir de la estructura de un proyecto, cumpliendo con un alto grado de responsividad del sitio.
• Escribir el código que le da diseño a la interfaz gráfica de una aplicación (front end), así como el manejo de la base de datos y de los diversos procesos operativos del desarrollo (back end).
• Comprender los procesos para construir una aplicación, con su respectiva documentación, desarrollo de pruebas unitarias, para garantizar la sostenibilidad y escalabilidad del desarrollo.
• Diseñar la interfaz de sitios web y aplicaciones, en función de los requerimientos establecidos y/o necesidades de desarrollo del cliente.', 'Primer Año | 1er cuatrimestre
• Lógica de programación
• Organización del Tiempo y del Trabajo
• Base de Datos
• Experiencia de usuario

Primer Año | 2do cuatrimestre
• Gestión de la configuración
• Gestión operativa en la nube (Cloud Practitioner)
• Programación para Web
• Gestión de personas

Segundo Año | 1er cuatrimestre
• Integraciones web
• Diseño de sistemas de información
• Interfaz de desarrollo
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Gestión de proyectos
• Práctica Profesionalizante
• Programación mobile', 1001, true, false, false),
  ('Tecnicatura Superior en Data Science', 'Teclab - Tecnología', '2 años', 'Técnico Superior en Data Science', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Data Science
Certificado intermedio: Asistente en Analítica de Datos (Data Analytics Assistant)
Cocreación: AWS Academy', '100% Online', 'Analizá grandes volúmenes de datos, detectá patrones de comportamiento y generá modelos predictivos para la toma de decisiones. Data Analyst, Big Data Analyst y Data Scientist en empresas de tecnología, banca, retail y consultoría.', 'Tecnicatura Superior en', 'Data Science', NULL, '• Analizar y explorar datos a partir de hipótesis y del descubrimiento de aspectos relevantes, utilizando a tal fin herramientas especializadas.
• Realizar operaciones concretas con grandes volúmenes de datos, utilizando lenguajes de programación específicos.
• Procesar datos, entrenar modelos y generar predicciones a partir de los servicios en la nube.
• Dominar principios matemáticos y estadísticos básicos y aplicar eficazmente sus procedimientos para la resolución de problemas, descripción y presentación de datos.
• Dominar principios matemáticos y estadísticos básicos y aplicar eficazmente sus procedimientos para la resolución de problemas, descripción y presentación de datos.
• Gestionar bases de datos orientadas al Big Data, utilizando a tal fin tecnologías de procesamiento.
• Utilizar técnicas básicas del procesamiento natural del lenguaje y de reprocesamiento de texto, a los efectos de mejorar las tareas y la funcionalidad de las aplicaciones.
• Transmitir la información necesaria en forma precisa y programar con orientación a Data Science.
• Procesar datos que permitan realizar análisis exploratorios y entrenamiento de modelos predictivos aplicando librerías de base.', 'Primer Año | 1er semestre
• Análisis y visualización de datos
• Organización del Tiempo y del Trabajo
• Procesamiento de datos
• Scripting

Primer Año | 2do semestre
• Base de Datos y Big Data
• Matemática y Estadística
• Agilidad para el aprendizaje (Learning Agility)
• Introducción al Machine Learning

Segundo Año | 1er semestre
• Machine Learning: Clasificación y Regresión
• Gestión Operativa en la Nube (Cloud Practitioner)
• Procesamiento Natural del Lenguaje (NPL)
• Decisiones y resoluciones eficientes

Segundo Año | 2do semestre
• Práctica Profesionalizante
• Comunicación efectiva
• Machine Learning en la Nube', 1002, true, false, false),
  ('Tecnicatura Superior en Quality Assurance', 'Teclab - Tecnología', '2 años', 'Técnico Superior en Quality Assurance', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Quality Assurance
Certificado intermedio: Asistente de Pruebas de Calidad (QA Tester Assistant)
Cocreación: Mercado IT', '100% Online', 'Validá sistemas, detectá errores y automatizá pruebas para asegurar la calidad de los productos de software. Analista de Testing, QA Tester y QA Automatizador Junior en empresas de base tecnológica y consultoras.', 'Tecnicatura Superior en', 'Quality Assurance', NULL, '• Dominar distintos lenguajes de programación para diseñar pruebas de software funcionales y no funcionales. Utilizar Tests de Penetración o de análisis de vulnerabilidades, con una filosofía enfocada a la ética profesional.
• Diseñar y evaluar la arquitectura de los sistemas, seleccionando adecuadamente los modelos que mejor se adapten para dar soluciones a los problemas de información.
• Gestionar la calidad basada en procesos, determinando acciones concretas y circuitos de mejoras continuas de los servicios y/o los resultados obtenidos.
• Planificar e implementar proyectos con una marcada orientación a resultados, adaptándose a la utilización de diferentes metodologías.
• Analizar y aportar soluciones eficaces y eficientes los problemas, favoreciendo el proceso de toma de decisiones.
• Aplicar técnicas de diseño centrado en las necesidades de los usuarios para resolver sus requerimientos.
• Gestionar bases de datos y sistemas gestores conforme a los requerimientos del entorno, garantizando la integridad, disponibilidad y confidencialidad de la información.
• Identificar las funcionalidades que necesitan ser testeadas, establecer criterio de prueba y gestionar herramientas de control, seguimiento y reporte de errores en el ciclo de vida de la prueba.
• Crear planes de pruebas y automatizar pruebas móviles, teniendo en la característica de la tecnología móvil, pudiendo realizar pruebas en múltiples dispositivos a la vez.', 'Primer Año | 1er semestre
• Organización del Tiempo y del Trabajo
• Lógica de programación
• Scripting
• Base de datos

Primer Año | 2do semestre
• Diseño de sistemas de información
• Comunicación efectiva
• Agilidad para el aprendizaje (Learning Agility)
• Desarrollo de Tests

Segundo Año | 1er semestre
• Planificación de pruebas
• Gestión de proyectos
• Decisiones y resoluciones eficientes
• Mobile Testing

Segundo Año | 2do semestre
• Proceso y estrategia de mejora
• Práctica Profesionalizante
• Hacking ético', 1003, true, false, false),
  ('Tecnicatura Superior en Redes Informáticas', 'Teclab - Tecnología', '2 años', 'Técnico Superior en Redes Informáticas', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Redes Informáticas
Certificado intermedio: Asistente en Redes Informáticas
Cocreación: Cisco Networking', '100% Online', 'Diseñá y administrá la conectividad física y virtual de una empresa, su infraestructura de TI y el monitoreo de las redes. Administrador de redes, soporte técnico corporativo y especialista en conectividad.', 'Tecnicatura Superior en', 'Redes Informáticas', NULL, '• Implementar seguridad en redes, a través de la gestión de diversos recursos y aplicaciones, prevenir y mitigar los riesgos vinculados a ataques informáticos y proponer soluciones que mantengan la eficiencia y efectividad del sistema.
• Asistir en la instalación o reemplazo de componentes de la Infraestructura de TI o adaptarla a nuevas condiciones de servicios externos minimizando riesgos para la seguridad y continuidad del servicio.
• Desarrollar scripts que permitan automatizar el despliegue de configuración, monitoreo y detección de errores en distintos dispositivos y plataformas de red.
• Configurar redes de acuerdo a los requerimientos operativos y de seguridad que se establezcan.
• Planear, implementar, administrar y monitorear redes locales, seleccionando y configurando el equipamiento necesario de acuerdo a estándares.
• Administrar Redes: diseñar, implementar y dar soporte a la infraestructura.
• Emplear protocolos de automatización que permitan agilizar las tareas operativas. Interactuar con distintas plataformas de red a través de APIs.', 'Primer Año | 1er cuatrimestre
• Fundamentos de Redes
• Organización del Tiempo y del Trabajo
• Servidores y servicios de red
• Lógica de programación

Primer Año | 2do cuatrimestre
• Interconexión de Redes
• Comunicación Efectiva
• Scripting
• Gestión de personas

Segundo Año | 1er cuatrimestre
• Gestión Operativa en la nube (Cloud Practitioner)
• Diseño de sistemas de información
• Automatización y Programabilidad de Redes
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Gestión de Proyectos
• Práctica Profesionalizante
• Seguridad y Gestión de Redes', 1004, true, false, false),
  ('Tecnicatura Superior en Seguridad Informática', 'Teclab - Tecnología', '2 años', 'Técnico Superior en Seguridad Informática', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Seguridad Informática
Certificado intermedio: Auxiliar en Administración de Seguridad Informática
Cocreación: Mercado IT', '100% Online', 'Protegé datos corporativos, mitigá amenazas cibernéticas, audità sistemas y diseñá planes de contingencia ante ataques. Especialista en ciberseguridad, analista de vulnerabilidades y analista de incidentes.', 'Tecnicatura Superior en', 'Seguridad Informática', NULL, '• Sabrás responder de forma efectiva y eficiente los ataques contra la seguridad informática. Supervisarás las aplicaciones para identificar un posible ciberataque o intrusión y determinar si se trata de una amenaza real y el posible impacto en la organización.
• Aprenderás a identificar riesgos y vulnerabilidades de un sistema, utilizando varias herramientas tales como: SIEM, Antivirus, IPS, DLP, AppControl, IDS, EDR. Sabrás cómo realizar un escaneo de redes para mantener la seguridad.
• Vas a poder asegurar la confidencialidad, disponibilidad, integridad y autenticidad de la información. Supervisarás el uso y acceso de archivos de datos para salvaguardar la información de la organización.
• Obtendrás todos los conocimientos necesarios para certificarte en Seguridad en Sistemas y Seguridad Informática a nivel internacional. Con esto podrás validar tus conocimientos y lograr un desarrollo profesional extra, donde quiera que estés.
• Tendrás la capacidad de trabajar en equipo y apoyar otras áreas que requieran soluciones en procesos y sistemas de seguridad.
• Analizarás el resultado de las auditorías internas y propondrás mejoras en los procesos y/o controles basados en normas relativas a la seguridad informática.
• Desarrollarás una mirada integral de los sistemas que te permitirá resolver problemas, priorizando según su nivel de importancia y magnitud.', 'Primer Año | 1er cuatrimestre
• Fundamento en Redes
• Organización del tiempo y del trabajo
• Lógica de Programación
• Servidores y Servicios de Red

Primer Año | 2do cuatrimestre
• Seguridad en EndPoint y Servers
• Programación y Scripting
• Inteligencia de ataques
• Toma de decisiones para la acción.

Segundo Año | 1er cuatrimestre
• Manejo de Riesgos y Operaciones de Seguridad
• Resolución de Problemas
• Cultura del trabajo, calidad y equipos
• Seguridad y Gestión de Redes

Segundo Año | 2do cuatrimestre
• Comunicación Efectiva
• Seguridad en la Nube y protección de datos.
• Práctica Profesionalizante I
• Práctica Profesionalizante II', 1005, true, false, false),
  ('Tecnicatura Superior en Cloud Administration', 'Teclab - Tecnología', '2 años', 'Técnico Superior en Administración de Servicios en la Nube (Cloud Administration).', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Administración de Servicios en la Nube (Cloud Administration).
Certificado intermedio: Asistente en Administración de Servicios en la Nube (Cloud Assistant).
Cocreación: AWS Academy', '100% Online', 'Diseñá, configurá, migrá y gestioná infraestructura y bases de datos en la nube con AWS, Microsoft Azure y Google Cloud. Administrador cloud, analista de infraestructura IT y especialista en automatización de servidores.', 'Tecnicatura Superior en', 'Cloud Administration', NULL, '• Esta carrera fue creada en alianza con AWS Amazon Academy. Podrás aprender y practicar en los laboratorios de Amazon para poner a prueba tus nuevas habilidades en entornos reales.
• Conocerás los conceptos asociados a red privada de nube, sus grupos de seguridad y su implementación. Además, entenderás las características y limitaciones de los servicios asociados a almacenamiento e implementación.
• Aprenderás herramientas de cálculos de costos de los servicios e infraestructura on-premise y cloud computing. Además, lograrás identificar oportunidades de optimización de costo basado en el uso, recolección y análisis de datos.
• Conocé todo sobre cloud computing y su infraestructura básica. Entenderás los distintos tipos de arquitecturas de infraestructuras que soportan los servicios en la nube.
• Preparate para monitorear el desempeño de los servicios que soportan un sistema de información, podrás construir entornos de arquitectura escalables y elásticos para asegurar un máximo desempeño. Implementarás y administrarás políticas de seguridad.
• Diseñá e implementá herramientas para usuarios, como interfaces de ventas y sitios web. Conocerás la arquitectura de aplicaciones y desarrollo de servicios Web y lenguajes de desarrollo.
• Preparate para rendir de forma directa 3 certificados internacionales: AWS Certified Cloud Practitioner, AWS Certified Solutions Architect – Associate y AWS Certified SysOps Administration – Associate. Como graduado de Teclab, podrás acceder a un 50% de descuento en la certificación.
• Obtén tu título de como Técnico Superior en Administración de Servicios en la Nube (Cloud Administration) y a mitad de carrera obtienes el certificado intermedio: Asistente en Administración de Servicios en la Nube (Cloud Assistant).', 'Primer Año | 1er cuatrimestre
• Gestión Operativa en la nube (Cloud Practitioner)
• Organización del tiempo y del trabajo
• Gestión de personas
• Lógica de Programación

Primer Año | 2do cuatrimestre
• Matemática y Estadísticas
• Fundamento de Redes
• Arquitectura de Soluciones
• Toma de decisiones para la acción

Segundo Año | 1er cuatrimestre
• Diseño de sistemas de información
• Resolución de Problemas
• Administración de sistemas en la nube (SysOps Administration)
• Base de Datos

Segundo Año | 2do cuatrimestre
• Comunicación Efectiva
• Gestión de Proyectos
• Práctica Profesionalizante I
• Práctica Profesionalizante II', 1006, true, false, false),
  ('Tecnicatura Superior en Marketing Digital', 'Teclab - Gestión', '2 años', 'Técnico Superior en Marketing Digital', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Marketing Digital
Certificado intermedio: Asistente de Marketing Digital
Cocreación: Google', '100% Online', 'Diseñá estrategias de crecimiento online: pauta digital, redes sociales, branding y embudos de venta. Agencias digitales, equipos de marketing de pymes y empresas, ONG y trabajo independiente.', 'Tecnicatura Superior en', 'Marketing Digital', NULL, '• Confeccionar, gestionar y analizar presupuestos de campañas publicitarias digitales.
• Elaborar diferentes reportes de marketing, analizando los resultados de campañas en búsqueda de oportunidades de mejora.
• Diseñar, implementar y evaluar la estrategia y puesta en marcha de planes de marketing digital.
• Gestionar campañas publicitarias, a través de múltiples canales digitales: redes sociales, buscadores, correo electrónico, entre otros.
• Diseñar contenidos digitales para ser utilizados en publicidad digital. Supervisar las herramientas de métricas sociales y web para medir y mejorar el impacto de las campañas en curso.
• Adaptarse a las nuevas tecnologías, comprendiendo las nuevas formas de comunicación marcadas por la interactividad y la hipertextualidad, siendo efectivo en sus mensajes.
• Coordinar acciones, trabajando en equipo con los diversos actores intervinientes en su labor (analistas de diseño digital, programadores, diseñadores UX, Gerentes de marketing y negocio).
• Desarrollar estrategias para potenciar el marketing digital de negocios electrónicos. Implementar técnicas de posicionamiento en herramientas digitales, tales como buscadores.', 'Primer Año | 1er cuatrimestre
• Gestión de Publicidad Digital
• Organización del Tiempo y del Trabajo
• Estrategias de Marketing Digital
• Gestión de Marca

Primer Año | 2do cuatrimestre
• Administración de Publicidad Digital
• Comunicación Efectiva
• Monetización Publicitaria
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Gestión de Presupuestos
• Diseño de Contenidos
• Marketing para E-commerce
• Decisiones y Resoluciones Eficientes

Segundo Año | 2do cuatrimestre
• Análisis de la Experiencia del Cliente
• Práctica Profesionalizante
• Estrategia y Planificación Comercial', 1007, true, false, false),
  ('Tecnicatura Superior en Inbound Marketing', 'Teclab - Gestión', '2 años', 'Técnico Superior en Inbound Marketing', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Inbound Marketing
Certificado intermedio: Inbound Marketing Assistant
Cocreación: HubSpot', '100% Online', 'Atraé, convertí, nutrí y fidelizá clientes con contenidos orgánicos relevantes y automatización de marketing. Especialista en generación de leads, nurturing manager y estratega de contenidos.', 'Tecnicatura Superior en', 'Inbound Marketing', NULL, '• Establecer y alcanzar los objetivos comerciales de empresas, aportando a su crecimiento en el ciclo de vida del cliente, en el contexto del Inbound Marketing.
• Generar contenido facilitando información que permita al cliente generar un beneficio, tanto en el contexto comercial como automatizado, asociado al Inbound Marketing.
• Dominio de herramientas en Marketing Digital, Publicidad, Contenidos y Redes Sociales, Ventas, Procesos Comerciales, Gestión Estratégica y de Negocios y Herramientas de Analítica digitales.
• Analizar y comprender el proceso de Marketing, diseñando e implementando campañas de Marketing Automation y Lead Nurturing omnicanal (Email, WhatsApp, SMS, etc).
• Diseñar estrategias efectivas para la generación, conversión, retención y fidelización del cliente final, desde las herramientas del Inbound Marketing.
• Analizar, medir y reportar datos y métricas generadas en los ámbitos del marketing, venta y post venta para la toma de decisiones, generación y control de indicadores de cara a la optimización de las estrategias.
• Diseñar y gestionar acciones de seguimiento de las variables, relacionadas con la experiencia de compra y atención brindada al cliente para generar segundas oportunidades de compra.
• Tomar decisiones tácticas y estratégicas de forma autónoma, que incidan en la mejora de los procesos de marketing, venta y post venta, de forma proactiva y con adaptación al cambio.
• Desarrollar, revisar y publicar contenidos digitales, con enfoque en la generación de oportunidades, para el ciclo de vida del prospecto/ cliente, dirigido al Buyer persona.', 'Primer Año | 1er cuatrimestre
• Análisis de Inbound Marketing
• Organización del Tiempo y del Trabajo
• Estrategias de Marketing Digital
• Gestión de Marca

Primer Año | 2do cuatrimestre
• Análisis de Experiencia del Cliente
• Comunicación Efectiva
• Sistemas de Generación y Conversión
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Gestión de Presupuestos
• Diseño de Contenidos
• Metodología de Inbound Marketing
• Decisiones y Resoluciones Eficientes

Segundo Año | 2do cuatrimestre
• Proceso y Estrategia de Mejora
• Práctica Profesionalizante
• Estrategia y Planificación de Inbound Marketing', 1008, true, false, false),
  ('Tecnicatura Superior en Customer Experience', 'Teclab - Gestión', '2 años', 'Técnico Superior en Customer Experience', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Customer Experience
Certificado intermedio: Customer Experience Assistant
Cocreación: HubSpot', '100% Online', 'Diseñá y auditá todo el recorrido del cliente, optimizá los canales de soporte y trabajá la fidelización y retención. Empresas de servicios, e-commerce, banca, telecomunicaciones y startups.', 'Tecnicatura Superior en', 'Customer Experience', NULL, '• Analizar, definir y documentar diferentes perfiles de clientes a quienes la empresa vende productos / servicios, para crear procesos centrados en el cliente.
• Crear y ejecutar estrategias de atención y soporte al cliente, según su recorrido y las “buyer personas” identificadas, para optimizar canales sincrónicos y asincrónicos.
• Definir y evaluar la estrategia de interacción de los clientes con la marca, en entornos físicos o digitales, durante todo el ciclo de vida del cliente.
• Utilizar eficientemente la tecnología, a través de diferentes herramientas de Customer Relationship Management, para centralizar la interacción con los usuarios.
• Diseñar e implementar, a través del Design Thinking, el ciclo de viaje del cliente durante todo el proceso de compra, incluyendo todos los canales y puntos de contacto físicos y digitales.
• Determinar y analizar las métricas e indicadores claves, tanto estratégicos como operacionales para medir el éxito de la estrategia de CX y toma de decisiones estratégicas y operacionales.
• Definir, escoger e implementar la tecnología que permita soportar, facilitar y centralizar la gestión del cliente en cada una de las etapas del ciclo de vida.
• Planear, organizar, motivar y controlar recursos con el propósito de alcanzar uno o varios objetivos, a través de proyectos que promuevan la innovación en el área del CX.', 'Primer Año | 1er cuatrimestre
• Análisis de Experiencia del Cliente
• Organización del Tiempo y del Trabajo
• Experiencia de Usuario
• Gestión de Personas

Primer Año | 2do cuatrimestre
• Diseño del Servicio al Cliente
• Comunicación Efectiva
• Gestión de Marca
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Gestión de Experiencia del Cliente (Customer Experience Management)
• Proceso y Estrategia de Mejora
• Planificación Estratégica de Experiencia del Cliente
• Decisiones y Resoluciones Eficientes

Segundo Año | 2do cuatrimestre
• Gestión de Proyectos
• Práctica Profesionalizante
• Estrategias de Transformación Digital', 1009, true, false, false),
  ('Tecnicatura Superior en Venta Directa', 'Teclab - Gestión', '2 años', 'Técnico Superior en Venta Directa', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Venta Directa
Certificado intermedio: Asistente en Venta Directa
Cocreación: Sector comercial', '100% Online', 'Formate en gestión comercial, análisis de KPI de ventas, tableros de control de rendimiento y liderazgo de equipos. Analista comercial, coordinador de ventas y responsable de experiencia de cliente.', 'Tecnicatura Superior en', 'Venta Directa', NULL, '• Gestionar prospectos, logrando la conversión de clientes y garantizando una buena experiencia durante todo el proceso.
• Gestionar la calidad basada en procesos, determinando acciones concretas y circuitos de mejoras continuas de los servicios y/o los resultados obtenidos.
• Gestionar las etapas del proceso de ventas en empresas de diferentes rubros y/o en emprendimientos personales de comercialización.
• Utilizar herramientas de monitoreo de evolución de indicadores de venta, tales como generación de prospectos, tasa de respuestas, tasa de conversión, tasas de barrido, cumplimiento de objetivos y otros vinculados a los niveles de capacitación de los equipos.
• Utilizar redes publicitarias y espacios digitales para campañas, acorde a las estrategias de marketing y a cada una de las etapas de la venta digital.
• Planificar y ejecutar planes de formación, tareas y objetivos de los equipos de fuerzas de venta, teniendo en cuenta las necesidades de desarrollo profesional del equipo.
• Planificar e implementar proyectos con una marcada orientación a resultados, adaptándose a la utilización de diferentes metodologías.', 'Primer Año | 1er cuatrimestre
• Principios de Comercialización
• Organización del Tiempo y del Trabajo
• Captación y Venta
• Gestión de personas

Primer Año | 2do cuatrimestre
• Planeamiento comercial
• Gestión de presupuestos
• Estrategias de Venta Directa
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Publicidad y Venta Directa Digital
• Proceso y estrategia de mejora
• Herramientas Comerciales
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Gestión de Proyectos
• Práctica Profesionalizante
• Incentivos y formación de equipos de venta', 1010, true, false, false),
  ('Tecnicatura Superior en Gestión Contable', 'Teclab - Gestión', '2 años', 'Técnico Superior en Gestión Contable', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Gestión Contable
Certificado intermedio: Auxiliar Contable
Cocreación: Perfil laboral', '100% Online', 'Aprendé liquidación de impuestos, conciliaciones bancarias, balances y análisis de costos con herramientas digitales e IA. Estudios contables, bancos y áreas administrativas. Articula con la carrera de Contador Público.', 'Tecnicatura Superior en', 'Gestión Contable', NULL, '• Diferenciar los documentos comerciales que intervienen en cada circuito contable, sus requisitos de validez y su implicancia fiscal.
• Dominar el marco legal de la administración de personal a fin de contar con las habilidades necesarias para la gestión del proceso de inicio, modificación o extinción del vínculo laboral, y la liquidación de sueldos y jornales.
• Registrar operaciones comerciales, aplicando los métodos de registro contable según la normativa vigente.
• Utilizar sistemas y bases de datos de gestión contable, aplicando herramientas de analítica e inteligencia empresarial para la confección de informes.
• Registrar las operaciones relativas a la constitución, organización y liquidación fiscal de las sociedades comerciales, según su naturaleza jurídica.
• Apropiarse de las nuevas herramientas tecnológicas y softwares vinculados a la gestión administrativa-contable.
• Establecer prioridades claras a cada una de sus tareas teniendo en cuenta los objetivos planteados, asumiendo compromiso y responsabilidad.', 'Primer Año | 1er cuatrimestre
• Fundamentos de contabilidad
• Organización del Tiempo y del Trabajo
• Circuitos administrativos contables claves
• Gestión de personas

Primer Año | 2do cuatrimestre
• Sociedades Comerciales
• Gestión de presupuestos
• Contabilidad patrimonial
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Análisis de estados contables
• Comunicación efectiva
• Técnica Impositiva
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Legislación laboral
• Práctica Profesionalizante
• Tecnología para la Gestión Contable', 1011, true, false, false),
  ('Tecnicatura Superior en Seguros', 'Teclab - Gestión', '2 años', 'Técnico Superior en Seguros', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Seguros
Certificado intermedio: Auxiliar de Seguros
Cocreación: Sector financiero', '100% Online', 'Analizá riesgos, asesorá en pólizas y gestioná siniestros con enfoque técnico y jurídico. Productor asesor independiente, brokers, bancos y compañías de seguros.', 'Tecnicatura Superior en', 'Seguros', NULL, '• Gestionar solicitudes de cotizaciones de nuevos contratos de acuerdo a las necesidades del cliente, tanto a empresas como a particulares.
• Asistir al cliente en la tramitación y gestión de denuncias de siniestros; interpretando los informes periciales y otros trámites relativos al expediente siniestral.
• Contribuir a la formalización de los contratos de seguros y la tramitación de expedientes, aplicando conocimientos legales y técnicos específicos en la materia.
• Abordar los distintos procesos correspondientes a la atención del cliente -empresas y particulares- desde la identificación de las necesidades, la confección de la propuesta aseguradora adecuada, hasta el seguimiento continuo.
• Asesorar sobre los distintos tipos de seguros, las condiciones de cada uno de ellos atendiendo a las necesidades específicas, tanto a empresas como particulares.
• Gestionar la tramitación de pólizas digitales, incluyendo la documentación que permita la formalización del mismo, aplicando y brindando especial atención a los asuntos legales, técnicos y específicos.
• Participar de la gestión de reaseguros en los trámites de transferencia de riesgo y tramitación del siniestro ante el reasegurador.', 'Primer Año | 1er cuatrimestre
• Marco Legal del Contrato de Seguros
• Organización del Tiempo y del Trabajo
• Contrato de Seguros
• Gestión de personas

Primer Año | 2do cuatrimestre
• Seguros Específicos I
• Fundamentos de contabilidad
• Seguros Específicos II
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Comercialización en Seguros
• Comunicación efectiva
• Análisis del Riesgo
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Gestión de Presupuestos
• Práctica Profesionalizante
• Transformación y el negocio del Seguro', 1012, true, false, false),
  ('Tecnicatura Superior en Gestión Agraria', 'Teclab - Gestión', '2 años', 'Técnico Superior en Gestión de la Empresa Agraria', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Gestión de la Empresa Agraria
Certificado intermedio: Auxiliar en Gestión de la Empresa Agraria
Cocreación: Sector productivo', '100% Online', 'Administrá finanzas, logística y producción de emprendimientos agropecuarios, integrando Agtech y agricultura digital. Empresas rurales, acopios, cooperativas y emprendimientos agropecuarios propios.', 'Tecnicatura Superior en', 'Gestión Agraria', NULL, '• Contribuir al desarrollo y crecimiento de la empresa agraria, con conocimiento del contexto y el mercado económico regional y nacional, con criterio de responsabilidad y sustentabilidad.
• Seleccionar y utilizar tecnologías de agricultura digital aplicada al monitoreo de la producción, y el control del negocio gestionando la información obtenida de dichas herramientas, para la toma de decisiones.
• Gestionar en forma eficiente los procesos inherentes al funcionamiento de la empresa agraria.
• Definir estrategias de control a partir de los presupuestos proyectados, y establecer procesos de ajustes que posibiliten la fijación de nuevos objetivos.
• Gestionar planes de producción y comercialización agraria teniendo en cuenta los análisis de indicadores productivos y económico- financieros de la organización.
• Analizar y aportar soluciones eficaces y ágiles a los problemas, favoreciendo el proceso de toma de decisiones.
• Planificar e implementar proyectos con una marcada orientación a resultados, adaptándose a la utilización de diferentes metodologías.', 'Primer Año | 1er cuatrimestre
• Gestión operativa de la empresa agraria
• Organización del Tiempo y del Trabajo
• Circuitos administrativos contables claves
• Gestión de personas

Primer Año | 2do cuatrimestre
• Gestión de cultivos extensivos
• Gestión de presupuestos
• Gestión de la producción animal
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Proceso y estrategia de mejora
• Marco Legal y ambiental de la Empresa Agraria
• Administración general de la Empresa Agraria
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Gestión de proyectos
• Práctica Profesionalizante
• Agricultura Digital', 1013, true, false, false),
  ('Tecnicatura Superior en Relaciones Laborales', 'Teclab - Gestión', '2 años', 'Técnico Superior en Relaciones Laborales', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Relaciones Laborales
Certificado intermedio: Auxiliar de Relaciones Laborales
Cocreación: Gestión de personas', '100% Online', 'Gestioná los vínculos laborales de una organización: derecho laboral, gestión de personal y liquidación de sueldos. RRHH de pymes y empresas, organismos públicos, consultoras de selección y capacitación.', 'Tecnicatura Superior en', 'Relaciones Laborales', NULL, '• Cumplimentar la normativa aplicable a las relaciones laborales, respecto de las personas con la empresa y de organismos y autoridades de control.
• Procesar la documentación pertinente de legajos, sanciones, despidos, ausencias del personal, evaluación de desempeño y seguimiento de la información relativa a compensaciones y beneficios.
• Aplicar políticas de administración de personal y de seguridad laboral.
• Elaborar informes o manuales para mantener y actualizar las estadísticas de personal y/o procedimientos de trabajo, utilizando a tal fin tecnologías de la información.
• Manejar adecuadamente la normativa laboral y convencional, como también los manuales de liquidación internos de la empresa.
• Aplicar políticas de reclutamiento, selección, integración, formación, capacitación y desarrollo de las personas que integran la organización.
• Administrar los sistemas de información y archivo en soporte convencional y digital.', 'Primer Año | 1er cuatrimestre
• Relaciones individuales y colectivas de trabajo
• Organización del Tiempo y del Trabajo
• Remuneraciones e indemnizaciones
• Gestión de personas

Primer Año | 2do cuatrimestre
• Las Relaciones Laborales como proceso
• Comunicación efectiva
• Responsabilidad empresarial
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Reclutamiento y selección de personas
• Gestión de presupuestos
• Beneficios y compensaciones
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Experiencia de las personas
• Práctica Profesionalizante
• Transformación e Innovación organizacional', 1014, true, false, false),
  ('Tecnicatura Superior en Gestión Hotelera', 'Teclab - Gestión', '2 años', 'Técnico Superior en Gestión Hotelera', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Gestión Hotelera
Certificado intermedio: Asistente en Operación de Hoteles
Cocreación: Industria hotelera', '100% Online', 'Gestioná la operación de un hotel: reservas, front desk, housekeeping, atención al huésped y administración. Hoteles, cadenas de alojamiento, turismo receptivo y administración de servicios.', 'Tecnicatura Superior en', 'Gestión Hotelera', NULL, '• Supervisar el cumplimiento de los estándares de calidad y normas de cada sector, aplicando la mejora continua de procesos para garantizar la satisfacción del huésped.
• Aplicar técnicas básicas de Revenue Management, que midan la capacidad de respuesta del cliente a las promociones con el fin de lograr un equilibrio entre el crecimiento de volumen y rentabilidad del hotel.
• Organizar y ejecutar los procesos operativos de las áreas Reservas, Front Desk, Housekeeping, Alimentos y Bebidas y Eventos, y Comercial, teniendo en cuenta los protocolos o normas vigentes del área.
• Definir estrategias de control a partir de los presupuestos proyectados, y establecer procesos de ajustes que posibiliten la fijación de nuevos objetivos.
• Evaluar la operación y analizar los resultados de las políticas planificadas, ya sean procedimentales (normas, protocolos y otros métodos de trabajo) o comerciales.
• Apropiarse de las tecnologías y sistemas de gestión hotelera, interpretando los reportes que de ellos se emanen para la toma de decisiones.
• Proponer estrategias de experiencias personalizadas dentro del sector involucrado, con conocimiento de la importancia de la gestión de los servicios, y de los recursos digitales de comunicación con el cliente.', 'Primer Año | 1er cuatrimestre
• Gestión Reserva y Front Desk
• Organización del Tiempo y del Trabajo
• Housekeeping
• Gestión de personas

Primer Año | 2do cuatrimestre
• Alimentos y Bebidas & Eventos
• Gestión de presupuestos
• Planificación de Eventos
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Sitios web y publicidad digital
• Proceso y estrategia de mejora
• Experiencia del Huésped
• Decisiones & resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Gestión de proyectos
• Práctica Profesionalizante
• Comercialización y Revenue Management', 1015, true, false, false),
  ('Tecnicatura Superior en Planificación y Organización de Eventos', 'Teclab - Gestión', '2 años', 'Técnico Superior en Planificación y Organización de Eventos', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Planificación y Organización de Eventos
Certificado intermedio: Asistente de Organización de Eventos
Cocreación: Industria creativa', '100% Online', 'Planificá, presupuestá y coordiná la producción de eventos, con ceremonial y protocolo y gestión de proveedores. Eventos corporativos, congresos, celebraciones sociales, culturales y turísticos.', 'Tecnicatura Superior en', 'Planificación y Organización de Eventos', NULL, '• Administrar recursos y herramientas en la planificación de eventos, identificando los parámetros de calidad y seguridad que correspondan.
• Utilizar herramientas tecnológicas y de comunicación digital propios del sector, para la gestión de eventos.
• Diseñar, planificar, implementar, y evaluar los diferentes tipos y formatos de eventos, de acuerdo al objetivo y al segmento al que va dirigido.
• Proponer soluciones de catering a un evento, como así también gestionar la calidad de servicio brindado.
• Implementar las normas de ceremonial y protocolo, acorde al tipo de evento.
• Definir estrategias de control a partir de los presupuestos proyectados, y establecer procesos de ajustes que posibiliten la fijación de nuevos objetivos.
• Aplicar estrategias y herramientas para la comunicación de eventos y nuevas tecnologías, garantizando una buena experiencia de usuario, antes, durante y después del evento.', 'Primer Año | 1er cuatrimestre
• Diseño de Eventos
• Organización del Tiempo y del Trabajo
• Planificación de Eventos
• Gestión de Personas

Primer Año | 2do cuatrimestre
• Servicio de alimentos y bebidas para eventos
• Comunicación efectiva
• Ceremonial y Protocolo
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Sitios Web y publicidad digital
• Gestión de presupuestos
• Comunicación de eventos y nuevas tecnologías
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Gestión de proyectos
• Práctica Profesionalizante
• Emprendimiento e Innovación en eventos', 1016, true, false, false),
  ('Tecnicatura Superior en Periodismo y Nuevas Tecnologías', 'Teclab - Gestión', '2 años', 'Técnico Superior en Periodismo y Nuevas Tecnologías', 'Modalidad: 100% Online
Duración: 2 años
Título: Técnico Superior en Periodismo y Nuevas Tecnologías
Certificado intermedio: Asistente en Periodismo
Cocreación: Medios digitales', '100% Online', 'Producí contenidos periodísticos digitales, podcast y piezas audiovisuales, apoyándote en IA y plataformas digitales. Medios digitales, productoras de contenido, comunicación institucional y periodismo multimedia.', 'Tecnicatura Superior en', 'Periodismo y Nuevas Tecnologías', NULL, '• Documentar la información a través de soportes tradicionales y digitales.
• Analizar y jerarquizar la información, procesarla y darle un formato adecuado para la visualización de datos y de construcción de la historia.
• Planear, producir y difundir información periodística utilizando las Tecnologías de la Información y la Comunicación.
• Adaptarse a los desafíos técnicos y de producción de contenidos. Construir relaciones comunicativas horizontales con los usuarios y desarrollar canales dinámicos de feedback.
• Innovar en nuevas formas de plantear el contenido, empleando soportes digitales heterogéneos.
• Adaptarse a las tecnologías, comprendiendo las nuevas formas de comunicación marcada por la interactividad, la hipertextualidad y la convergencia multimedia.
• Conocer las fuentes adecuadas para recopilar información, con una amplia visión de la gestión de contenidos digitales y redes sociales.', 'Primer Año | 1er cuatrimestre
• Producción de Noticias
• Organización del Tiempo y del Trabajo
• Experiencia de usuario
• Redacción periodística en la era digital

Primer Año | 2do cuatrimestre
• Periodismo y Redes Sociales
• Comunicación efectiva
• Nuevo Periodismo
• Cibercapacidades

Segundo Año | 1er cuatrimestre
• Gestión de proyectos
• Diseño de contenidos
• Multimedios
• Decisiones y resoluciones eficientes

Segundo Año | 2do cuatrimestre
• Sitios Web y Publicidad Digital
• Práctica Profesionalizante
• Práctica profesionalizante
• Periodismo de datos', 1017, true, false, false);
