-- Añadir un único FAQ a las 14 carreras Teclab que todavía no tienen slides.
-- Fuentes y alcance: referencias/2026-10-07-faq-seo-teclab.md.
-- Aplicar una vez tras revisión; cualquier cambio previo aborta toda la transacción.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $actualizacion$
DECLARE
  cambio jsonb;
  fila_actual jsonb;
  afectadas integer;
  total integer := 0;
  datos jsonb := $datos$[
  {
    "id": 217,
    "nombre": "Tecnicatura Superior en Programación",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Tecnología",
    "activa": true,
    "huella": "b05ff81592d970e5c9003994d0ed994b",
    "items": [
      {
        "pregunta": "¿Qué se aprende en la Tecnicatura en Programación?",
        "respuesta": "La formación abarca lógica de programación, bases de datos, desarrollo web e integración de sistemas. Aprendés a construir aplicaciones y a conectar sus interfaces con los servicios que procesan y almacenan la información."
      },
      {
        "pregunta": "¿Qué significa desarrollo Full Stack en Programación?",
        "respuesta": "Es el trabajo con las dos partes de una aplicación: la interfaz que utiliza la persona y la lógica que funciona detrás. La carrera combina contenidos de front-end, back-end y bases de datos para desarrollar soluciones digitales."
      },
      {
        "pregunta": "¿Qué tareas puede realizar un técnico en Programación?",
        "respuesta": "Puede participar en la creación y mantenimiento de aplicaciones web y móviles, integrar sistemas y organizar bases de datos. Estas tareas forman parte de proyectos de desarrollo de software para personas y organizaciones."
      }
    ]
  },
  {
    "id": 218,
    "nombre": "Tecnicatura Superior en Data Science",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Tecnología",
    "activa": true,
    "huella": "566f88c25c77be7aad1d7b4754575f5c",
    "items": [
      {
        "pregunta": "¿Qué se aprende en la Tecnicatura en Data Science?",
        "respuesta": "Estudiás análisis y visualización de datos, estadística, bases de datos, Big Data y Machine Learning. La formación combina procesamiento de información y programación para encontrar patrones y comunicar resultados."
      },
      {
        "pregunta": "¿Cuál es la diferencia entre Data Science y análisis de datos?",
        "respuesta": "El análisis de datos ayuda a interpretar información y elaborar informes. Data Science incorpora además estadística, programación y modelos de Machine Learning para explorar patrones y realizar predicciones a partir de los datos."
      },
      {
        "pregunta": "¿Cuál es la salida laboral de Data Science?",
        "respuesta": "La formación se vincula con tareas de análisis, visualización e inteligencia de negocio en empresas tecnológicas, consultoras y áreas que usan datos para tomar decisiones. También permite participar en proyectos de analítica de manera independiente."
      }
    ]
  },
  {
    "id": 219,
    "nombre": "Tecnicatura Superior en Quality Assurance",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Tecnología",
    "activa": true,
    "huella": "c54231a56d5f95c27826839cfcaaf763",
    "items": [
      {
        "pregunta": "¿Qué hace un QA tester?",
        "respuesta": "Prueba aplicaciones para detectar fallas, registra los problemas encontrados y verifica las correcciones. También diseña casos de prueba y colabora con el equipo de desarrollo para revisar la calidad del software."
      },
      {
        "pregunta": "¿Qué se aprende en la Tecnicatura en Quality Assurance?",
        "respuesta": "Estudiás lógica de programación, bases de datos, scripting, desarrollo de tests, planificación de pruebas y testing de aplicaciones móviles. Estos contenidos permiten organizar pruebas y avanzar en su automatización."
      },
      {
        "pregunta": "¿Cuál es la diferencia entre Quality Assurance y Programación?",
        "respuesta": "Programación se orienta a construir aplicaciones y sus funcionalidades. Quality Assurance se enfoca en comprobar su funcionamiento y detectar errores. Ambos perfiles trabajan con software; QA también utiliza programación para automatizar pruebas."
      }
    ]
  },
  {
    "id": 220,
    "nombre": "Tecnicatura Superior en Redes Informáticas",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Tecnología",
    "activa": true,
    "huella": "fd350826ac84af1f85688db27090113b",
    "items": [
      {
        "pregunta": "¿Qué se aprende en la Tecnicatura en Redes Informáticas?",
        "respuesta": "Estudiás fundamentos e interconexión de redes, servidores, servicios de red, scripting y automatización. La formación también incluye seguridad y gestión de redes para administrar la conectividad de una organización."
      },
      {
        "pregunta": "¿Qué hace un técnico en Redes Informáticas?",
        "respuesta": "Configura y administra redes de datos, servidores y servicios de conectividad. Puede trabajar con direccionamiento IP, switching y routing, además de automatizar tareas de gestión de la infraestructura informática."
      },
      {
        "pregunta": "¿Cuál es la diferencia entre Redes Informáticas y Seguridad Informática?",
        "respuesta": "Redes Informáticas se centra en la conectividad y la administración de redes y servidores. Seguridad Informática profundiza la protección de sistemas y datos, el análisis de riesgos y la respuesta ante amenazas. Las dos carreras comparten contenidos de redes."
      }
    ]
  },
  {
    "id": 221,
    "nombre": "Tecnicatura Superior en Seguridad Informática",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Tecnología",
    "activa": true,
    "huella": "2df0a8dbf25482a55d4b084a106e5102",
    "items": [
      {
        "pregunta": "¿Qué se aprende en la Tecnicatura en Seguridad Informática?",
        "respuesta": "Estudiás seguridad de redes y servidores, programación y scripting, riesgos, operaciones de seguridad y análisis de ataques. La formación se orienta a proteger sistemas y datos y a detectar vulnerabilidades."
      },
      {
        "pregunta": "¿Qué hace un técnico en Seguridad Informática?",
        "respuesta": "Participa en la protección de sistemas, el monitoreo de amenazas y la identificación de vulnerabilidades. También puede colaborar en el análisis de incidentes y la aplicación de controles para reducir riesgos de seguridad."
      },
      {
        "pregunta": "¿Cuál es la salida laboral de Seguridad Informática?",
        "respuesta": "La formación se relaciona con tareas en áreas de informática y ciberseguridad, consultoras y equipos internos de seguridad. Incluye monitoreo, protección de información y respuesta ante incidentes en organizaciones que necesitan cuidar sus sistemas y datos."
      }
    ]
  },
  {
    "id": 222,
    "nombre": "Tecnicatura Superior en Cloud Administration",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Tecnología",
    "activa": true,
    "huella": "202224229724bd17d6ddd789f34d9acc",
    "items": [
      {
        "pregunta": "¿Qué se aprende en Cloud Administration?",
        "respuesta": "Estudiás gestión operativa en la nube, arquitectura de soluciones, redes, bases de datos y administración de sistemas cloud. La carrera se enfoca en implementar y mantener infraestructura tecnológica en la nube."
      },
      {
        "pregunta": "¿Qué hace un administrador de servicios en la nube?",
        "respuesta": "Configura y administra recursos para que las aplicaciones y los servicios estén disponibles. También puede resolver incidentes, automatizar tareas y revisar el uso de recursos y los costos de la infraestructura cloud."
      },
      {
        "pregunta": "¿Con qué plataformas se trabaja en Cloud Administration?",
        "respuesta": "La propuesta oficial incluye AWS, Microsoft Azure y Google Cloud. La formación aborda la administración de recursos y servicios en distintos entornos de nube, sin limitarse a un único proveedor."
      }
    ]
  },
  {
    "id": 223,
    "nombre": "Tecnicatura Superior en Marketing Digital",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Gestión",
    "activa": true,
    "huella": "dc21371a6f9deb4c1e34896aa4b55f02",
    "items": [
      {
        "pregunta": "¿Qué se aprende en la Tecnicatura en Marketing Digital?",
        "respuesta": "Estudiás estrategias de marketing, gestión de marca, publicidad digital, contenidos y comercio electrónico. La formación incluye presupuestos y análisis de resultados para planificar y mejorar acciones comerciales en canales digitales."
      },
      {
        "pregunta": "¿Marketing Digital es solamente manejar redes sociales?",
        "respuesta": "No. Las redes sociales son uno de sus canales. La carrera también aborda publicidad digital, gestión de marca, contenidos, comercio electrónico y métricas para integrar distintas acciones dentro de una estrategia."
      },
      {
        "pregunta": "¿Qué tareas puede realizar un técnico en Marketing Digital?",
        "respuesta": "Puede planificar campañas y contenidos, administrar publicidad digital y analizar indicadores para evaluar resultados. También puede colaborar en estrategias de marca y acciones comerciales para negocios que venden o se comunican por canales digitales."
      }
    ]
  },
  {
    "id": 224,
    "nombre": "Tecnicatura Superior en Inbound Marketing",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Gestión",
    "activa": true,
    "huella": "fe70aa29abc4f7888efce42f99f79659",
    "items": [
      {
        "pregunta": "¿Qué se aprende en la Tecnicatura en Inbound Marketing?",
        "respuesta": "Estudiás atracción y conversión de clientes, contenidos, gestión de marca y planificación de estrategias de Inbound Marketing. La propuesta incluye automatización, CRM y métricas para acompañar la relación con los clientes."
      },
      {
        "pregunta": "¿Cuál es la diferencia entre Inbound Marketing y Marketing Digital?",
        "respuesta": "Marketing Digital abarca estrategias y acciones en distintos canales digitales. Inbound Marketing pone el foco en atraer personas con contenido útil, convertir ese interés en consultas y acompañar la relación hasta la fidelización del cliente."
      },
      {
        "pregunta": "¿Para qué sirven los contenidos y el CRM en Inbound Marketing?",
        "respuesta": "Los contenidos ayudan a atraer audiencias interesadas y responder sus dudas. El CRM organiza la información y el seguimiento de los contactos, mientras la automatización permite acompañar distintas etapas de la relación con el cliente."
      }
    ]
  },
  {
    "id": 225,
    "nombre": "Tecnicatura Superior en Experiencia del Cliente",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Gestión",
    "activa": true,
    "huella": "cf6ab5f0f4832105cf997edbeddef482",
    "items": [
      {
        "pregunta": "¿Qué se aprende en Experiencia del Cliente o Customer Experience?",
        "respuesta": "Estudiás análisis de la experiencia del cliente, diseño de servicios, gestión de marca y planificación de CX. La formación se orienta a mejorar los puntos de contacto entre las personas y una organización."
      },
      {
        "pregunta": "¿Qué hace un técnico en Experiencia del Cliente?",
        "respuesta": "Analiza cómo se relacionan los clientes con una empresa, detecta dificultades en ese recorrido y propone mejoras en la atención y los servicios. También participa en estrategias de satisfacción, retención y fidelización."
      },
      {
        "pregunta": "¿La carrera de Customer Experience incluye experiencia de usuario?",
        "respuesta": "Sí. El plan incluye Experiencia de Usuario y contenidos de diseño del servicio al cliente. La formación integra esas herramientas con la gestión de la relación entre la organización y sus clientes en distintos puntos de contacto."
      }
    ]
  },
  {
    "id": 229,
    "nombre": "Tecnicatura Superior en Gestión Agraria",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Gestión",
    "activa": true,
    "huella": "0c030fbc97b32ec53661b48f8bfc637e",
    "items": [
      {
        "pregunta": "¿Qué se aprende en la Tecnicatura en Gestión Agraria?",
        "respuesta": "Estudiás administración de la empresa agraria, presupuestos, circuitos contables, cultivos y producción animal. La formación combina gestión y conocimientos del sector agropecuario para organizar recursos y procesos."
      },
      {
        "pregunta": "¿Qué hace un técnico en Gestión Agraria?",
        "respuesta": "Participa en la administración de recursos, costos y presupuestos de una empresa agropecuaria. También puede colaborar en la planificación y el seguimiento de la producción y en el análisis de la comercialización."
      },
      {
        "pregunta": "¿Cuál es la salida laboral de Gestión Agraria?",
        "respuesta": "La formación se vincula con tareas administrativas, comerciales y de seguimiento de procesos en empresas y establecimientos agropecuarios. Permite participar en la organización de recursos y unidades de negocio del sector."
      }
    ]
  },
  {
    "id": 230,
    "nombre": "Tecnicatura Superior en Relaciones Laborales",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Gestión",
    "activa": true,
    "huella": "f474c901280113f4da3273fbc6a956e4",
    "items": [
      {
        "pregunta": "¿Qué se aprende en la Tecnicatura en Relaciones Laborales?",
        "respuesta": "Estudiás relaciones individuales y colectivas del trabajo, remuneraciones, indemnizaciones, selección de personal y compensaciones. La formación combina normativa laboral y gestión de personas para acompañar los vínculos dentro de una organización."
      },
      {
        "pregunta": "¿Relaciones Laborales incluye liquidación de sueldos?",
        "respuesta": "Sí. La formación aborda remuneraciones e indemnizaciones y la gestión de haberes, aportes y licencias. También incluye beneficios y compensaciones, vinculados con la administración de personal."
      },
      {
        "pregunta": "¿Cuál es la salida laboral de Relaciones Laborales?",
        "respuesta": "La formación se relaciona con áreas de recursos humanos, administración de personal, liquidaciones, reclutamiento y selección. Puede aplicarse en empresas, consultoras y organizaciones que gestionan equipos y relaciones de trabajo."
      }
    ]
  },
  {
    "id": 231,
    "nombre": "Tecnicatura Superior en Gestión Hotelera",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Gestión",
    "activa": true,
    "huella": "ee0f40070f93f2b0ff2d597874cc4d40",
    "items": [
      {
        "pregunta": "¿Qué se aprende en la Tecnicatura en Gestión Hotelera?",
        "respuesta": "Estudiás reservas y recepción, housekeeping, alimentos y bebidas, eventos y experiencia del huésped. La formación también incluye presupuestos, comercialización y revenue management para administrar servicios hoteleros."
      },
      {
        "pregunta": "¿Qué hace un técnico en Gestión Hotelera?",
        "respuesta": "Participa en la coordinación de reservas, recepción, servicios y equipos de un establecimiento. También puede colaborar en la organización de eventos y en el control de la calidad de la experiencia del huésped."
      },
      {
        "pregunta": "¿Gestión Hotelera incluye administración y comercialización?",
        "respuesta": "Sí. Además de las operaciones del hotel, el plan aborda gestión de presupuestos, proyectos, comercialización y revenue management. Son herramientas para analizar ingresos, tarifas y recursos del negocio hotelero."
      }
    ]
  },
  {
    "id": 232,
    "nombre": "Tecnicatura Superior en Planificación y Organización de Eventos",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Gestión",
    "activa": true,
    "huella": "0206fd295aa7a2385ef18b86cabf429f",
    "items": [
      {
        "pregunta": "¿Qué se aprende en Planificación y Organización de Eventos?",
        "respuesta": "Estudiás diseño y planificación de eventos, presupuestos, alimentos y bebidas, ceremonial y protocolo. La formación también incluye comunicación, tecnología y gestión de proyectos para coordinar recursos y proveedores."
      },
      {
        "pregunta": "¿Qué hace un organizador de eventos?",
        "respuesta": "Define la propuesta, organiza el presupuesto y coordina equipos, proveedores y tiempos. Durante la realización del evento, acompaña la logística y la ejecución de lo planificado según los objetivos de cada proyecto."
      },
      {
        "pregunta": "¿Cuál es la salida laboral de Organización de Eventos?",
        "respuesta": "La formación se aplica en agencias, empresas, instituciones y centros de convenciones. Permite participar en eventos sociales y corporativos, gestionar logística y proveedores o desarrollar servicios de organización de manera independiente."
      }
    ]
  },
  {
    "id": 233,
    "nombre": "Tecnicatura Superior en Periodismo y Nuevas Tecnologías",
    "prefix": "Tecnicatura Superior en",
    "nivel": "Teclab - Gestión",
    "activa": true,
    "huella": "27dada19a3092b69b4f7c5b84210de8e",
    "items": [
      {
        "pregunta": "¿Qué se aprende en Periodismo y Nuevas Tecnologías?",
        "respuesta": "Estudiás producción de noticias, redacción digital, redes sociales, multimedios y periodismo de datos. La formación combina investigación y comunicación con herramientas para crear contenidos en nuevos formatos."
      },
      {
        "pregunta": "¿La carrera de Periodismo incluye formatos digitales y multimedia?",
        "respuesta": "Sí. La propuesta aborda noticias para plataformas digitales, redes sociales y producción multimedia. Incluye trabajo con formatos como podcast, radio digital y video, además del análisis de datos para producir información periodística."
      },
      {
        "pregunta": "¿Cuál es la salida laboral de Periodismo y Nuevas Tecnologías?",
        "respuesta": "La formación se vincula con medios, redacciones, áreas de prensa, agencias de contenidos y proyectos de comunicación digital. Permite participar en redacción multimedia, producción audiovisual y gestión de contenidos para redes sociales."
      }
    ]
  }
]$datos$::jsonb;
BEGIN
  IF jsonb_array_length(datos) <> 14 OR
    (SELECT count(DISTINCT (value->>'id')::integer)
     FROM jsonb_array_elements(datos)) <> 14 THEN
    RAISE EXCEPTION 'Se esperan catorce identidades distintas';
  END IF;
  -- Orden estable para evitar invertir el orden de bloqueos entre ejecuciones.
  FOR cambio IN SELECT value FROM jsonb_array_elements(datos)
    ORDER BY (value->>'id')::integer
  LOOP
    IF (cambio->>'id')::integer NOT IN
      (217,218,219,220,221,222,223,224,225,229,230,231,232,233) THEN
      RAISE EXCEPTION 'Identidad fuera del alcance';
    END IF;
    SELECT to_jsonb(c) INTO fila_actual FROM public.carreras c
    WHERE c.id = (cambio->>'id')::integer FOR UPDATE;
    IF fila_actual IS NULL OR
      md5(fila_actual::text) IS DISTINCT FROM cambio->>'huella' OR
      fila_actual->>'nombre' IS DISTINCT FROM cambio->>'nombre' OR
      fila_actual->'prefix' IS DISTINCT FROM cambio->'prefix' OR
      fila_actual->>'nivel' IS DISTINCT FROM cambio->>'nivel' OR
      fila_actual->'activa' IS DISTINCT FROM 'true'::jsonb OR
      fila_actual->>'nivel' NOT IN ('Teclab - Tecnología','Teclab - Gestión') OR
      fila_actual->'slides' IS DISTINCT FROM 'null'::jsonb THEN
      RAISE EXCEPTION 'Ficha % ausente, modificada o no elegible: rollback', cambio->>'id';
    END IF;
    IF jsonb_typeof(cambio->'items') IS DISTINCT FROM 'array' OR
      jsonb_array_length(cambio->'items') <> 3 THEN
      RAISE EXCEPTION 'Cada ficha requiere tres preguntas';
    END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(cambio->'items') item
      WHERE jsonb_typeof(item->'pregunta') IS DISTINCT FROM 'string'
        OR jsonb_typeof(item->'respuesta') IS DISTINCT FROM 'string'
        OR length(btrim(item->>'pregunta')) = 0
        OR length(btrim(item->>'respuesta')) = 0) THEN
      RAISE EXCEPTION 'Texto FAQ inválido';
    END IF;
    UPDATE public.carreras
    SET slides = jsonb_build_array(jsonb_build_object('type','faq','items',cambio->'items'))
    WHERE id = (cambio->>'id')::integer AND slides IS NULL;
    GET DIAGNOSTICS afectadas = ROW_COUNT;
    IF afectadas <> 1 THEN RAISE EXCEPTION 'Cantidad de filas inesperada'; END IF;
    total := total + afectadas;
  END LOOP;
  IF total <> 14 THEN RAISE EXCEPTION 'Se esperaban catorce actualizaciones'; END IF;
END;
$actualizacion$;
COMMIT;
