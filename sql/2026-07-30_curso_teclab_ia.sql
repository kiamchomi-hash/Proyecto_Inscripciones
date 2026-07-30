-- Curso de Actualización Profesional en Inteligencia Artificial de Teclab.
-- Ejecutar en el SQL Editor de Supabase.
--
-- Teclab no publica una ficha abierta con duración, modalidad o plan de
-- estudios. Esos campos quedan expresamente como "Consultar" o NULL para no
-- comunicar datos no verificados. Cuando Teclab entregue la ficha comercial,
-- completar esta misma sentencia y volver a ejecutarla.

update carreras
set
  nivel = 'Teclab - Curso',
  duracion = 'Consultar',
  titulo = 'Curso de actualización profesional',
  enfoque = 'Inteligencia artificial aplicada al ámbito laboral',
  modalidad = 'Consultar',
  descripcion = 'Actualización profesional orientada a incorporar herramientas de inteligencia artificial al trabajo y al desarrollo del perfil profesional.',
  prefix = 'Curso de',
  nombre_corto = 'Actualización Profesional en Inteligencia Artificial',
  seccion_duracion = null,
  seccion_modalidad = null,
  plan_estudios = null,
  slides = null,
  orden = 1018,
  activa = true,
  destacada = false,
  nueva = true,
  proximamente = false
where lower(nombre) = lower('Actualización Profesional en Inteligencia Artificial');

insert into carreras (
  nombre,
  nivel,
  duracion,
  titulo,
  enfoque,
  modalidad,
  descripcion,
  prefix,
  nombre_corto,
  seccion_duracion,
  seccion_modalidad,
  plan_estudios,
  slides,
  orden,
  activa,
  destacada,
  nueva,
  proximamente
)
select
  'Actualización Profesional en Inteligencia Artificial',
  'Teclab - Curso',
  'Consultar',
  'Curso de actualización profesional',
  'Inteligencia artificial aplicada al ámbito laboral',
  'Consultar',
  'Actualización profesional orientada a incorporar herramientas de inteligencia artificial al trabajo y al desarrollo del perfil profesional.',
  'Curso de',
  'Actualización Profesional en Inteligencia Artificial',
  null,
  null,
  null,
  null,
  1018,
  true,
  false,
  true,
  false
where not exists (
  select 1
  from carreras
  where lower(nombre) = lower('Actualización Profesional en Inteligencia Artificial')
);
