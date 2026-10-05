-- Mejora de contenido de tres fichas. Preparado el 05/10/2026; aplicación manual.
-- Fuentes y alcance: referencias/2026-10-05_seo_tres_carreras.md.
-- La huella cubre la fila completa previa; cualquier cambio concurrente frena todo.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $actualizacion$
DECLARE
  cambio jsonb;
  fila_actual jsonb;
  afectadas integer;
  total integer := 0;
BEGIN
  FOR cambio IN SELECT value FROM jsonb_array_elements($datos$[
  {
    "id": 87,
    "descripcion": "La carrera de Procurador a distancia te prepara para gestionar expedientes, presentar documentación y seguir trámites judiciales y administrativos. Su formación se centra en los procedimientos y el trabajo con equipos jurídicos; Abogacía profundiza el asesoramiento, la estrategia legal y la defensa de los intereses del cliente. Podés desempeñarte en estudios jurídicos, departamentos legales de empresas y organismos públicos.",
    "bullets": [
      "Formate en gestión de expedientes, escritos y plazos procesales",
      "Conocé las funciones del procurador y su trabajo junto a abogados"
    ],
    "nombre": "Procurador",
    "huella": "2ff50b97a4b3b45ba30afe8448a3d8ad"
  },
  {
    "id": 227,
    "descripcion": "La Tecnicatura Superior en Gestión Contable te prepara para registrar operaciones, analizar estados contables y organizar información para la toma de decisiones. Aprendé contabilidad, técnica impositiva y legislación laboral con herramientas digitales y software de gestión. Es una formación técnica distinta de la carrera de Contador Público; las equivalencias para continuar estudios se evalúan según tu trayectoria académica. Podés trabajar en estudios contables y áreas administrativas o contables de empresas.",
    "seccion_modalidad": "• Registrar operaciones y controlar la documentación de los circuitos administrativos contables.\n• Analizar estados contables y preparar información para la gestión de presupuestos.\n• Aplicar conocimientos impositivos y laborales en tareas de administración contable.\n• Utilizar software de gestión y herramientas digitales para organizar datos y elaborar informes.\n• Colaborar con profesionales y equipos contables en empresas y estudios.",
    "nombre": "Tecnicatura Superior en Gestión Contable",
    "huella": "2796bdd752ceec181b603829d8ea6ee0"
  },
  {
    "id": 228,
    "descripcion": "La Tecnicatura Superior en Seguros te prepara para analizar riesgos, comparar coberturas y gestionar pólizas y siniestros. Al egresar de Teclab, podés tramitar la matrícula de Productor Asesor de Seguros ante la SSN sin rendir el examen de competencia, cumpliendo los requisitos administrativos vigentes; el título no implica matrícula automática. Podés trabajar en aseguradoras, brokers y oficinas de productores, o ejercer como productor asesor una vez matriculado.",
    "seccion_modalidad": "• Evaluar riesgos y orientar la elección de coberturas para personas y empresas.\n• Preparar cotizaciones y gestionar contratos y pólizas, incluida su documentación digital.\n• Acompañar la denuncia y el seguimiento de siniestros con conocimientos técnicos y legales.\n• Asesorar a clientes y dar seguimiento a sus necesidades de protección.\n• Participar en procesos de comercialización y gestión del negocio asegurador.",
    "nombre": "Tecnicatura Superior en Seguros",
    "huella": "644c0f6920118b64d948bb1efe87f0bb"
  }
]$datos$::jsonb)
  LOOP
    SELECT to_jsonb(c) INTO fila_actual
    FROM public.carreras c
    WHERE c.id = (cambio->>'id')::integer AND c.nombre = cambio->>'nombre'
    FOR UPDATE;
    IF fila_actual IS NULL OR md5(fila_actual::text) IS DISTINCT FROM cambio->>'huella' THEN
      RAISE EXCEPTION 'La ficha % falta o cambió desde el respaldo: no se actualizó ninguna fila', cambio->>'id';
    END IF;
    IF cambio ? 'bullets' THEN
      IF fila_actual #>> '{slides,0,type}' IS DISTINCT FROM 'portada' THEN
        RAISE EXCEPTION 'La portada de la ficha % no coincide con el esquema esperado', cambio->>'id';
      END IF;
      UPDATE public.carreras
      SET descripcion = cambio->>'descripcion',
          slides = jsonb_set(slides::jsonb, '{0,bullets}', cambio->'bullets', false)
      WHERE id = (cambio->>'id')::integer AND nombre = cambio->>'nombre';
    ELSE
      UPDATE public.carreras
      SET descripcion = cambio->>'descripcion', seccion_modalidad = cambio->>'seccion_modalidad'
      WHERE id = (cambio->>'id')::integer AND nombre = cambio->>'nombre';
    END IF;
    GET DIAGNOSTICS afectadas = ROW_COUNT;
    IF afectadas <> 1 THEN
      RAISE EXCEPTION 'Se esperaba una fila para %, se obtuvieron %', cambio->>'id', afectadas;
    END IF;
    total := total + afectadas;
  END LOOP;
  IF total <> 3 THEN
    RAISE EXCEPTION 'Se esperaban exactamente tres actualizaciones, se obtuvieron %', total;
  END IF;
END;
$actualizacion$;
COMMIT;
