-- Reemplazar sólo el bloque FAQ; preservar cada campo y slide restante.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $actualizacion$
DECLARE
  cambio jsonb;
  fila_actual jsonb;
  nuevos_slides jsonb;
  afectadas integer;
  total integer := 0;
BEGIN
  FOR cambio IN SELECT value FROM jsonb_array_elements($datos$[
  {
    "id": 87,
    "nombre": "Procurador",
    "huella": "b256703ccebcc696bc1f34f8587129be",
    "items": [
      {
        "pregunta": "¿Qué hace un procurador?",
        "respuesta": "Gestiona expedientes, presenta escritos y documentación, controla plazos procesales y realiza el seguimiento de trámites judiciales y administrativos junto a equipos jurídicos."
      },
      {
        "pregunta": "¿Cuál es la diferencia entre Procurador y Abogacía?",
        "respuesta": "Procurador se enfoca en la gestión de expedientes y trámites procesales. Abogacía profundiza el asesoramiento jurídico, la estrategia legal y la defensa de los intereses del cliente."
      },
      {
        "pregunta": "¿Cuál es la salida laboral de Procurador?",
        "respuesta": "Podés trabajar en estudios jurídicos, departamentos legales de empresas, juzgados y organismos públicos, realizando tareas de gestión de expedientes y seguimiento de trámites judiciales y administrativos."
      }
    ]
  },
  {
    "id": 227,
    "nombre": "Tecnicatura Superior en Gestión Contable",
    "huella": "9ae804199cada1e70eb44e4c3a263462",
    "items": [
      {
        "pregunta": "¿Qué se aprende en la Tecnicatura en Gestión Contable?",
        "respuesta": "Aprendés contabilidad, análisis de estados contables, liquidación de impuestos y sueldos y legislación laboral. Usás software de gestión e inteligencia artificial para agilizar registros, conciliaciones e informes contables."
      },
      {
        "pregunta": "¿Cuál es la diferencia entre Gestión Contable y Contador Público?",
        "respuesta": "Gestión Contable es una tecnicatura orientada al registro, control y análisis de información contable. Es una formación distinta de la carrera universitaria de Contador Público y no otorga ese título."
      },
      {
        "pregunta": "¿Puedo continuar con Contador Público después de Gestión Contable?",
        "respuesta": "Podés consultar la articulación con Contador Público en Universidad Siglo 21. Las equivalencias se evalúan según tu trayectoria académica; no son automáticas."
      }
    ]
  },
  {
    "id": 228,
    "nombre": "Tecnicatura Superior en Seguros",
    "huella": "6d3013bd2a753eaf2c7c9352f99499dd",
    "items": [
      {
        "pregunta": "¿Qué se aprende en la Tecnicatura en Seguros?",
        "respuesta": "Aprendés a analizar riesgos, elegir coberturas y gestionar pólizas y siniestros, con conocimientos técnicos y legales y herramientas digitales para el negocio asegurador."
      },
      {
        "pregunta": "¿Puedo obtener la matrícula de Productor Asesor de Seguros con este título?",
        "respuesta": "El título permite obtener la matrícula de Productor Asesor de Seguros sin rendir el examen de competencia."
      },
      {
        "pregunta": "¿Cuál es la salida laboral de la Tecnicatura en Seguros?",
        "respuesta": "Podés trabajar en aseguradoras, brokers, oficinas de productores y áreas de gestión de siniestros. Para ejercer como Productor Asesor de Seguros tenés que completar la matriculación ante la SSN."
      }
    ]
  }
]$datos$::jsonb)
  LOOP
    SELECT to_jsonb(c) INTO fila_actual FROM public.carreras c
    WHERE c.id = (cambio->>'id')::integer AND c.nombre = cambio->>'nombre' FOR UPDATE;
    IF fila_actual IS NULL OR md5(fila_actual::text) IS DISTINCT FROM cambio->>'huella' THEN
      RAISE EXCEPTION 'La ficha % falta o cambió: rollback obligatorio', cambio->>'id';
    END IF;
    IF jsonb_typeof(fila_actual->'slides') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Slides inválidos';
    END IF;
    IF (SELECT count(*) FROM jsonb_array_elements(fila_actual->'slides') s WHERE s->>'type'='faq') <> 1 THEN
      RAISE EXCEPTION 'Se esperaba exactamente un FAQ';
    END IF;
    SELECT jsonb_agg(CASE WHEN s->>'type'='faq' THEN jsonb_set(s,'{items}',cambio->'items') ELSE s END ORDER BY posicion)
    INTO nuevos_slides FROM jsonb_array_elements(fila_actual->'slides') WITH ORDINALITY AS entrada(s,posicion);
    UPDATE public.carreras SET slides = nuevos_slides
    WHERE id = (cambio->>'id')::integer AND nombre = cambio->>'nombre';
    GET DIAGNOSTICS afectadas = ROW_COUNT;
    IF afectadas <> 1 THEN RAISE EXCEPTION 'Cantidad de filas inesperada'; END IF;
    total := total + afectadas;
  END LOOP;
  IF total <> 3 THEN RAISE EXCEPTION 'Se esperaban tres filas'; END IF;
END;
$actualizacion$;
COMMIT;
