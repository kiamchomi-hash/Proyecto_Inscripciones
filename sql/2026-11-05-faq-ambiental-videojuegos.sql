-- Fuente: fichas oficiales de Teclab, revisión 05/11/2026.
-- https://teclab.edu.ar/carrera/tecnico-superior-en-gestion-ambiental/
-- https://teclab.edu.ar/carrera/tecnico-superior-en-desarrollo-de-videojuegos/
-- No ejecutar en producción sin autorización. Conserva las FAQ existentes;
-- sólo actualiza si el contenido coincide con lo leído antes de preparar el SQL.

UPDATE carreras
SET slides = json_insert(slides,
  '$[0].items[#]', json_object('pregunta', '¿Necesito experiencia previa para estudiar Gestión Ambiental?', 'respuesta', 'No. La carrera aborda fundamentos ambientales, legislación y herramientas técnicas desde el primer año.'),
  '$[0].items[#]', json_object('pregunta', '¿Se estudian cambio climático y huella de carbono?', 'respuesta', 'Sí. El plan incluye Cambio Climático y Huella de Carbono, con contenidos sobre emisiones, medición de la huella y acciones de mitigación y adaptación.'),
  '$[0].items[#]', json_object('pregunta', '¿Qué se aprende sobre evaluación de impacto ambiental?', 'respuesta', 'Se estudia cómo identificar impactos, trabajar con matrices y colaborar en relevamientos, monitoreo y documentación técnica.'),
  '$[0].items[#]', json_object('pregunta', '¿La carrera incluye sistemas de gestión y auditoría ambiental?', 'respuesta', 'Sí. Se estudian sistemas de gestión ambiental, la norma ISO 14001 y tareas de apoyo a auditorías y procesos de certificación.')
), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 246 AND nombre = 'Tecnicatura Superior en Gestión Ambiental'
  AND json(slides) = json('[{"type":"faq","items":[{"pregunta":"¿Qué certificado intermedio ofrece la carrera?","respuesta":"Asistente en Gestión Ambiental, al completar el primer año."},{"pregunta":"¿Qué título se obtiene?","respuesta":"Técnico Superior en Gestión Ambiental."}]}]');

UPDATE carreras
SET slides = json_insert(slides,
  '$[0].items[#]', json_object('pregunta', '¿Necesito experiencia previa en programación?', 'respuesta', 'No. La carrera está pensada para comenzar sin experiencia previa y avanzar con el acompañamiento de docentes y tutores.'),
  '$[0].items[#]', json_object('pregunta', '¿Qué motores de videojuegos se trabajan?', 'respuesta', 'La formación contempla motores como Unity o Unreal Engine, junto con la integración de scripts y recursos digitales.'),
  '$[0].items[#]', json_object('pregunta', '¿La carrera incluye testing de videojuegos?', 'respuesta', 'Sí. Incluye Testing Manual y Automatizado, con contenidos de control de calidad, pruebas e identificación y seguimiento de errores.'),
  '$[0].items[#]', json_object('pregunta', '¿Se estudian inteligencia artificial y videojuegos multijugador?', 'respuesta', 'Sí. El plan incluye Inteligencia Artificial Aplicada a Videojuegos y Sistemas de Juego Multijugador; el alcance de los proyectos depende de las actividades académicas.')
), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 247 AND nombre = 'Tecnicatura Superior en Desarrollo de Videojuegos'
  AND json(slides) = json('[{"type":"faq","items":[{"pregunta":"¿Qué certificado intermedio ofrece la carrera?","respuesta":"Asistente en Desarrollo de Videojuegos, al completar el primer año."},{"pregunta":"¿Qué título se obtiene?","respuesta":"Técnico Superior en Desarrollo de Videojuegos."}]}]');
