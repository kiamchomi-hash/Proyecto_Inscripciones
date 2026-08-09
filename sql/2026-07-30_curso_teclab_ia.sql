-- Curso de Actualización Profesional en Inteligencia Artificial de Teclab.
-- Ejecutar en el SQL Editor de Supabase.
--
-- Teclab no publica una ficha abierta con duración, modalidad o plan de
-- estudios. Esos campos quedan expresamente como "Consultar" o NULL para no
-- comunicar datos no verificados. Cuando Teclab entregue la ficha comercial,
-- completar esta misma sentencia y volver a ejecutarla.

begin;

-- Consolida una posible fila histórica con el nombre mal codificado. Conserva
-- el ID más antiguo para no romper referencias externas.
with coincidencias as (
  select
    id,
    row_number() over (order by id) as posicion
  from public.carreras
  where
    lower(nombre) = lower('Actualizaci' || chr(243) || 'n Profesional en Inteligencia Artificial')
    or nombre like 'Actualizaci% Profesional en Inteligencia Artificial'
)
delete from public.carreras
where id in (
  select id
  from coincidencias
  where posicion > 1
);

update public.carreras
set
  nombre = 'Actualizaci' || chr(243) || 'n Profesional en Inteligencia Artificial',
  nivel = 'Teclab - Curso',
  duracion = 'Consultar',
  titulo = 'Curso de actualizaci' || chr(243) || 'n profesional',
  enfoque = 'Inteligencia artificial aplicada al ' || chr(225) || 'mbito laboral',
  modalidad = 'Consultar',
  descripcion = 'Actualizaci' || chr(243) || 'n profesional orientada a incorporar herramientas de inteligencia artificial al trabajo y al desarrollo del perfil profesional.',
  prefix = 'Curso de',
  nombre_corto = 'Actualizaci' || chr(243) || 'n Profesional en Inteligencia Artificial',
  seccion_duracion = null,
  seccion_modalidad = null,
  plan_estudios = null,
  slides = null,
  orden = 1018,
  activa = true,
  destacada = false,
  nueva = true,
  proximamente = false
where
  lower(nombre) = lower('Actualizaci' || chr(243) || 'n Profesional en Inteligencia Artificial')
  -- Corrige también el registro que una ejecución antigua guardó con U+FFFD.
  or nombre like 'Actualizaci% Profesional en Inteligencia Artificial';

insert into public.carreras (
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
  'Actualizaci' || chr(243) || 'n Profesional en Inteligencia Artificial',
  'Teclab - Curso',
  'Consultar',
  'Curso de actualizaci' || chr(243) || 'n profesional',
  'Inteligencia artificial aplicada al ' || chr(225) || 'mbito laboral',
  'Consultar',
  'Actualizaci' || chr(243) || 'n profesional orientada a incorporar herramientas de inteligencia artificial al trabajo y al desarrollo del perfil profesional.',
  'Curso de',
  'Actualizaci' || chr(243) || 'n Profesional en Inteligencia Artificial',
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
  from public.carreras
  where lower(nombre) = lower('Actualizaci' || chr(243) || 'n Profesional en Inteligencia Artificial')
);

commit;
