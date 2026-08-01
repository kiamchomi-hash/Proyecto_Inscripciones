-- Contenido del curso de Teclab en Inteligencia Artificial (id 235), tomado de
-- la landing oficial https://teclab.edu.ar/landing/curso-profesional-ia/ el
-- 01/08/2026. Reemplaza los "Consultar" que dejó sql/2026-07-30_curso_teclab_ia.sql,
-- escrito cuando el instituto todavía no había publicado la ficha comercial.
--
-- Qué hace cada campo en el modal (components/index/teclab-modal.tsx) y en la
-- ficha pública (components/carreras/career-detail.tsx):
--
--   enfoque            los chips de modalidad y duración de la portada
--   descripcion        la primera oración es el perfil; la última, el destacado
--                      que encabeza el slide de contenidos
--   seccion_modalidad  slide "Qué vas a aprender": una viñeta por línea
--   plan_estudios      slide "Cómo se cursa". En un curso NO es un temario por
--                      cuatrimestre —no existe— sino otra lista de viñetas: el
--                      código lo parsea distinto cuando nivel = 'Teclab - Curso'
--
-- Nada de lo que sigue está inventado: la landing no publica temario ni precio,
-- así que no se cargan. Si Teclab publica el detalle de los cuatro encuentros,
-- va acá mismo.

update public.carreras
set
  duracion = '4 semanas',
  modalidad = 'Online en vivo',
  titulo = 'Certificado oficial de Teclab',
  enfoque = 'Modalidad: Online en vivo
Duración: 4 semanas
Título: Certificado oficial de Teclab',
  descripcion = 'Curso online de cuatro semanas para incorporar la inteligencia artificial al trabajo diario: herramientas de productividad, criterios de uso responsable y un perfil profesional actualizado. Está pensado para estudiantes, egresados y profesionales de cualquier carrera que quieran adaptarse a los cambios que la IA trae al mercado laboral.',
  seccion_modalidad = '• Herramientas de productividad aumentada por IA: ChatGPT, Notion, Zapier y otras.
• IA y la transformación del trabajo: cómo está cambiando la dinámica laboral.
• Ética, sesgos, responsabilidad y seguridad: cómo usar la IA de manera responsable.
• Potenciá tu CV con IA: optimizá tu perfil profesional y destacá en las búsquedas.',
  plan_estudios = '• Cuatro semanas, con un encuentro sincrónico por semana.
• Clases en vivo con especialistas del área.
• Comunidad de práctica: se cursa junto a otros estudiantes.
• Sin evaluaciones finales: todo el curso es práctica aplicada.
• Certificado oficial de Teclab al finalizar.',
  seccion_duracion = null,
  updated_at = now()
where id = 235
  and nivel = 'Teclab - Curso';
-- Esperado: UPDATE 1

-- Verificación. Los acentos tienen que leerse bien: si aparece un rombo con un
-- signo de pregunta, el texto se pegó mal y hay que volver a copiarlo.
select id, nombre, duracion, modalidad, titulo, enfoque, seccion_modalidad, plan_estudios
from public.carreras
where id = 235;
