-- Actualiza la página y el modal de Estadística (id 132).
-- Ejecutar en el SQL Editor de Supabase. No requiere deploy ni nuevos triggers.
-- Fuente consultada el 07/09/2026:
-- https://21.edu.ar/carreras-y-programas/tecnicatura-en-estadistica-aplicada-y-analisis-avanzado
-- La portada oficial dice 2 años y medio y el plan tiene cinco cuatrimestres.
-- Su FAQ dice 3 años: se descarta esa respuesta por contradicción con ambos.
-- La disponibilidad en el CAU fue confirmada por el usuario.
-- Se conservan nombre, prefijo y URL. La foto se reutiliza del material local.

BEGIN;

DO $validar$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.carreras
    WHERE id = 132 AND nombre = 'Estadística Aplicada y Análisis Avanzado'
      AND nivel = 'Pregrado' AND activa = true
  ) THEN
    RAISE EXCEPTION 'La carrera 132 no coincide con la ficha esperada';
  END IF;
END
$validar$;

UPDATE public.carreras
SET proximamente = false,
    duracion = '2 años y medio',
    titulo = 'Técnico/a Universitario/a en Estadística Aplicada y Análisis Avanzado',
    modalidad = 'A distancia',
    descripcion = 'Aprendé a recolectar, organizar e interpretar datos con herramientas estadísticas. Formate para elaborar indicadores, informes y visualizaciones que ayuden a tomar decisiones en organizaciones e integrar equipos de análisis cuantitativo.',
    enfoque = 'Estadística y análisis de datos',
    seccion_duracion = 'Cinco cuatrimestres de formación, con integración profesional y seminario de práctica profesional en el último período.',
    seccion_modalidad = 'Educación Distribuida: cursado online con cuatro encuentros presenciales por materia en el CAU. Educación Distribuida Home: cursado online y exámenes parciales y finales en el CAU.',
    slides = $slides$[
      {
        "type": "portada",
        "imagen_desktop": "/imagenes/Modales/Licenciatura en Ciencias de Datos/Foto-hero-licenciatura-ciencia-datos.webp",
        "imagen_desktop_position": "35% center",
        "imagen_brightness": 1.5,
        "bullets": [
          "Analizá datos con métodos estadísticos y herramientas de programación",
          "Creá indicadores y visualizaciones para orientar decisiones"
        ],
        "badges": [
          { "label": "Título", "value": "Técnico/a Universitario/a en Estadística Aplicada y Análisis Avanzado" },
          { "label": "Área", "value": "Estadística y análisis de datos" }
        ]
      },
      {
        "type": "plan_estudios",
        "paginas": [
          {
            "izquierda": {
              "año": "1er Año",
              "cuatrimestres": [
                {
                  "label": "1er Cuatrimestre",
                  "materias": [
                    "Herramientas Matemáticas I - Álgebra",
                    "Ética y Deontología Profesional",
                    "Introducción a las Técnicas de Recolección de Datos",
                    "Introducción a la Estadística"
                  ]
                },
                {
                  "label": "2do Cuatrimestre",
                  "materias": [
                    "Herramientas Matemáticas III - Estadística I",
                    "Herramientas Matemáticas II - Análisis",
                    "Herramientas Matemáticas V - Estadística II",
                    "Análisis Combinatorio"
                  ]
                }
              ]
            },
            "derecha": {
              "año": "2do Año",
              "cuatrimestres": [
                {
                  "label": "3er Cuatrimestre",
                  "materias": [
                    "Cálculo Avanzado",
                    "Inferencia Estadística",
                    "Probabilidades",
                    "Introducción a la Ciencia de Datos"
                  ]
                },
                {
                  "label": "4to Cuatrimestre",
                  "materias": [
                    "Métodos Estadísticos",
                    "Métodos Estadísticos Aplicados",
                    "Programación para Ciencia de Datos",
                    "Estadística Computacional"
                  ]
                }
              ]
            }
          },
          {
            "izquierda": {
              "año": "3er Año",
              "cuatrimestres": [
                {
                  "label": "5to Cuatrimestre",
                  "materias": [
                    "Integración Profesional: El Estudio del Caso",
                    "Seminario de Práctica Profesional"
                  ]
                }
              ]
            }
          }
        ]
      },
      {
        "type": "cierre",
        "imagen": "/imagenes/imagenes_cau/entrada_estetica.png",
        "titulo": "Estudiá<br><span style=\"color:#00c7b1\">con nosotros</span>",
        "beneficios": [
          { "icono": "monitor", "texto": "Cursá online con el acompañamiento de profesores" },
          { "icono": "chat", "texto": "Consultanos y resolvé tus dudas sobre la inscripción" }
        ]
      }
    ]$slides$::jsonb,
    updated_at = now()
WHERE id = 132
  AND nombre = 'Estadística Aplicada y Análisis Avanzado'
  AND nivel = 'Pregrado'
  AND activa = true;

COMMIT;

-- Debe devolver una fila, proximamente=false, tres slides y 18 materias.
SELECT id, nombre, duracion, titulo, proximamente,
       jsonb_array_length(slides::jsonb) AS cantidad_slides,
       jsonb_array_length(jsonb_path_query_array(
         slides::jsonb, '$[*] ? (@.type == "plan_estudios").paginas[*].*.cuatrimestres[*].materias[*]'
       )) AS cantidad_materias
FROM public.carreras
WHERE id = 132;
