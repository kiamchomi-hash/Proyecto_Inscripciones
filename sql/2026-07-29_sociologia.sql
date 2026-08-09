-- Carga la ficha de la Licenciatura en Sociología (id 131), que estaba
-- publicada con `slides` y `plan_estudios` en NULL: sin portada, sin temario y
-- disparando el mail de /api/notificar-carrera cada vez que alguien la abría.
-- Era una de las 2 carreras que marcaba `npm run auditar` el 29/07/2026.
--
-- Fuente: PDF oficial https://contenidos.21.edu.ar/pdf/carreras/grado/lic-sociologia.pdf
-- (12 páginas, texto real; se extrajo con PyMuPDF). Perfil profesional en la
-- página 3, salida laboral en la 4, plan de estudios en la 5.
--
-- ── El dato que cambia la ficha ──
-- La página 2 del PDF dice, textual:
--
--   "Esta carrera sólo está disponible como doble titulación
--    de la Licenciatura en Relaciones Internacionales"
--   "11 materias adicionales al plan de estudio de la Licenciatura
--    en Relaciones Internacionales"
--
-- O sea que Sociología NO tiene plan propio: son 11 materias que se suman al
-- plan de RRII (id 69). El sitio la publicaba como una licenciatura suelta de
-- 4 años, lo que no es incorrecto en la duración pero omitía la condición.
--
-- Por eso el slide de plan replica los 4 años de RRII —que es lo que la persona
-- efectivamente cursa— y cierra con un bloque `extras` que lista las 11 propias
-- y explica la doble titulación. El grid de años se copió tal cual de la fila
-- 69 de Supabase, sin reescribir ninguna materia.
--
-- La aclaración va además en `descripcion`, que se renderiza arriba de todo:
-- el bloque `extras` aparece recién después del grid y alguien que escanea la
-- página podría leer el plan de RRII como si fuera el de Sociología.
--
-- No se toca `duracion` (4 años, los de RRII) ni `modalidad` (Distancia: el PDF
-- ofrece Presencial y Distribuida Home, y el CAU dicta la segunda).
--
-- Título otorgado según el PDF: "Licenciado en Sociología". Acreditación
-- R.M. 0924/95.

UPDATE public.carreras
SET
  descripcion = 'Estudio de las estructuras, dinámicas y transformaciones sociales, con herramientas de investigación aplicadas a distintos ámbitos. Se cursa como doble titulación de la Licenciatura en Relaciones Internacionales: son 11 materias adicionales a ese plan.',
  slides = $json$[
  {
    "type": "portada",
    "badges": [
      { "label": "Título", "value": "Licenciado/a en Sociología" },
      { "label": "Área", "value": "Investigación Social y Políticas Públicas" }
    ],
    "bullets": [
      "Diseñá proyectos de investigación social y dirigí la ejecución y evaluación de los resultados",
      "Asesorá en la planificación de políticas, proyectos y programas de alcance sectorial, regional y nacional"
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
                "Antropología",
                "Epistemología",
                "Historia Moderna",
                "Intro. a la Ciencia Política y a las RRII",
                "Introducción a la Filosofía",
                "Sociología General"
              ]
            },
            {
              "label": "2do Cuatrimestre",
              "materias": [
                "Herramientas Matemáticas II - Análisis",
                "Historia Contemporánea",
                "Métodos y Técnicas de Investigación Social",
                "Psicología Social",
                "Teoría Política I",
                "Idioma Extranjero I"
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
                "Derecho Constitucional",
                "Economía I",
                "Herramientas Matemáticas III - Estadística I",
                "Política Internacional",
                "Teoría Política II",
                "Idioma Extranjero II"
              ]
            },
            {
              "label": "4to Cuatrimestre",
              "materias": [
                "Economía II",
                "Geografía Económica",
                "Introducción al Comercio Exterior",
                "Problemas Internacionales Contemporáneos",
                "Teoría Política III",
                "Idioma Extranjero III"
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
                "Economía Internacional",
                "Historia de América Latina",
                "Metodología de Análisis de Datos Cuantitativos",
                "Economía Política Internacional",
                "Teoría de las Relaciones Internacionales",
                "Idioma Extranjero IV"
              ]
            },
            {
              "label": "6to Cuatrimestre",
              "materias": [
                "Derecho Internacional Público",
                "Finanzas Internacionales",
                "Historia Argentina",
                "Seguridad Internacional",
                "Sistemas Políticos Comparados",
                "Idioma Extranjero V"
              ]
            }
          ]
        },
        "derecha": {
          "año": "4to Año",
          "cuatrimestres": [
            {
              "label": "7mo Cuatrimestre",
              "materias": [
                "Organizaciones Internacionales y Transnacionales",
                "Procesos de Integración Regional",
                "Producción y Análisis de Datos Cualitativos",
                "Práctica Prof. de Relaciones Internacionales",
                "Idioma Extranjero VI"
              ]
            },
            {
              "label": "8vo Cuatrimestre",
              "materias": [
                "Agenda Internacional",
                "Derecho Internacional Privado",
                "Economía Argentina",
                "Historia Diplomática y Política Exterior Argentina y Latinoamericana",
                "Seminario Final de Relaciones Internacionales"
              ]
            }
          ]
        },
        "extras": [
          {
            "titulo": "Las 11 materias propias de Sociología",
            "items": [
              "Teoría Social I",
              "Epistemología de la Sociología",
              "Teoría Social II",
              "Teoría de la Administración Pública",
              "Teoría Social III",
              "Comunicación Política",
              "Sociología de las Organizaciones",
              "Sociología Económica",
              "Problemática Sociológica Contemporánea",
              "Teoría del Cambio y la Estratificación Social",
              "Diagnóstico y Programación Social"
            ],
            "nota": "El grid de arriba es el plan de la Licenciatura en Relaciones Internacionales, que es la carrera base. Estas 11 materias se suman a ese recorrido y son las que otorgan el título de Licenciado/a en Sociología (R.M. 0924/95). La carrera sólo está disponible bajo esta doble titulación."
          }
        ]
      }
    ]
  },
  {
    "type": "cierre",
    "imagen": "/imagenes/imagenes_cau/entrada_estetica.png",
    "titulo": "Estudiá<br><span style=\"color:#00c7b1\">con nosotros</span>",
    "beneficios": [
      { "icono": "monitor", "texto": "Estudiá 100% online, rendí y cursá donde quieras" },
      { "icono": "chat", "texto": "Chateá con nosotros y resolvé todas tus dudas" }
    ]
  }
]$json$::jsonb,
  updated_at = now()
WHERE id = 131;

-- Verificación: 1 fila, 3 slides, 46 materias en el grid y 11 en el bloque extra.
SELECT
  id,
  nombre,
  jsonb_array_length(slides) AS slides,
  (SELECT count(*)
     FROM jsonb_array_elements(slides) s,
          jsonb_array_elements(s->'paginas') p,
          jsonb_array_elements(coalesce(p->'izquierda'->'cuatrimestres', '[]') ||
                               coalesce(p->'derecha'->'cuatrimestres', '[]')) cu,
          jsonb_array_elements_text(cu->'materias')
    WHERE s->>'type' = 'plan_estudios') AS materias_grid,
  (SELECT count(*)
     FROM jsonb_array_elements(slides) s,
          jsonb_array_elements(s->'paginas') p,
          jsonb_array_elements(coalesce(p->'extras', '[]')) e,
          jsonb_array_elements_text(e->'items')
    WHERE s->>'type' = 'plan_estudios') AS materias_propias
FROM public.carreras
WHERE id = 131;
