-- Publicar el soporte FAQ y verificar el deploy ANTES de ejecutar.
-- Tres fichas; preservar todos los bloques y campos ajenos al ajuste.
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
    "descripcion": "Estudiá Procurador a distancia y formate en gestión de expedientes y trámites judiciales.",
    "items": [
      {
        "pregunta": "¿Qué hace un procurador?",
        "respuesta": "Gestiona expedientes, presenta documentación y sigue trámites judiciales y administrativos, trabajando con equipos jurídicos."
      },
      {
        "pregunta": "¿En qué se diferencia de Abogacía?",
        "respuesta": "Procurador se centra en los procedimientos y la gestión procesal. Abogacía profundiza el asesoramiento, la estrategia legal y la defensa de los intereses del cliente."
      },
      {
        "pregunta": "¿Dónde puede trabajar?",
        "respuesta": "En estudios jurídicos, departamentos legales de empresas y organismos públicos."
      }
    ],
    "nombre": "Procurador",
    "huella": "ab074fcbddebdb55a90c9c86445b0905"
  },
  {
    "id": 227,
    "descripcion": "Aprendé a registrar operaciones y gestionar información contable con herramientas digitales. Podés trabajar en estudios contables y áreas administrativas o contables de empresas.",
    "items": [
      {
        "pregunta": "¿Qué voy a aprender?",
        "respuesta": "Contabilidad, análisis de estados contables, técnica impositiva y legislación laboral, con herramientas digitales y software de gestión."
      },
      {
        "pregunta": "¿Es lo mismo que Contador Público?",
        "respuesta": "No. Gestión Contable es una formación técnica distinta de la carrera de Contador Público."
      },
      {
        "pregunta": "¿Puedo continuar mis estudios?",
        "respuesta": "Podés consultar la articulación con Contador Público. Las equivalencias se evalúan según tu trayectoria académica; no son automáticas."
      }
    ],
    "nombre": "Tecnicatura Superior en Gestión Contable",
    "huella": "f1b551cafd88bebaf0dd9d519985d9b8"
  },
  {
    "id": 228,
    "descripcion": "Aprendé a analizar riesgos y gestionar pólizas y siniestros. Podés trabajar en aseguradoras, brokers y oficinas de productores.",
    "items": [
      {
        "pregunta": "¿Qué voy a aprender?",
        "respuesta": "Análisis de riesgos, elección de coberturas y gestión de pólizas y siniestros, con conocimientos técnicos y legales."
      },
      {
        "pregunta": "¿Puedo matricularme como Productor Asesor de Seguros?",
        "respuesta": "Al egresar de Teclab, podés tramitar la matrícula ante la SSN sin rendir el examen de competencia, cumpliendo los requisitos administrativos vigentes."
      },
      {
        "pregunta": "¿El título implica matrícula automática?",
        "respuesta": "No. Para ejercer como Productor Asesor de Seguros tenés que completar la matriculación ante la SSN."
      }
    ],
    "nombre": "Tecnicatura Superior en Seguros",
    "huella": "c73f0f8185fcfbce45abad732c1aa51b"
  }
]$datos$::jsonb)
  LOOP
    SELECT to_jsonb(c) INTO fila_actual FROM public.carreras c
    WHERE c.id = (cambio->>'id')::integer AND c.nombre = cambio->>'nombre'
    FOR UPDATE;
    IF fila_actual IS NULL OR md5(fila_actual::text) IS DISTINCT FROM cambio->>'huella' THEN
      RAISE EXCEPTION 'La ficha % falta o cambió: se revierte toda la transacción', cambio->>'id';
    END IF;
    nuevos_slides := COALESCE(NULLIF(fila_actual->'slides', 'null'::jsonb), '[]'::jsonb);
    IF jsonb_typeof(nuevos_slides) IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Slides inválidos en la ficha %', cambio->>'id';
    END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements(nuevos_slides) s WHERE s->>'type' = 'faq') THEN
      RAISE EXCEPTION 'La ficha % ya tiene FAQ: revisar antes de reemplazar', cambio->>'id';
    END IF;
    nuevos_slides := nuevos_slides || jsonb_build_array(jsonb_build_object('type','faq','items',cambio->'items'));
    UPDATE public.carreras SET descripcion = cambio->>'descripcion', slides = nuevos_slides
    WHERE id = (cambio->>'id')::integer AND nombre = cambio->>'nombre';
    GET DIAGNOSTICS afectadas = ROW_COUNT;
    IF afectadas <> 1 THEN
      RAISE EXCEPTION 'Se esperaba una fila para %, se obtuvieron %', cambio->>'id', afectadas;
    END IF;
    total := total + afectadas;
  END LOOP;
  IF total <> 3 THEN RAISE EXCEPTION 'Se esperaban tres filas, se obtuvieron %', total; END IF;
END;
$actualizacion$;
COMMIT;
