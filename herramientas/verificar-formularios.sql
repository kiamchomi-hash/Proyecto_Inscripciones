-- Verificacion de los formularios por casa (23/08/2026).
--
-- Correr DESPUES de mandar una consulta real de cada tipo desde produccion:
--   1. Contacto en la home, eligiendo una carrera de Siglo 21.
--   2. Preinscripcion en la home, con esa misma carrera.
--   3. Preinscripcion en www.siglo21sur.com/teclab.
--
-- Lo que tiene que verse: `casa` y `tipo_formulario` cargados en las tres, y
-- los campos del legajo poblados solo donde corresponde. Si `casa` viene en
-- null, el componente no esta mandando el discriminador.

select
  created_at,
  casa,
  tipo_formulario,
  carrera,
  coalesce(nombre, '') || ' ' || coalesce(apellido, '') as lead,
  -- Los que solo pide Siglo 21: en una fila de Teclab tienen que estar vacios.
  tipo_documento,
  pais_residencia,
  barrio,
  torre,
  -- Los que solo pide Teclab: al reves.
  nivel_estudios,
  colegio,
  medio_pago
from public.consultas
order by created_at desc
limit 10;

-- Y el estado real de los avisos: un 401 aca significa que WEBHOOK_SECRET no
-- coincide, y el INSERT igual respondio 201 porque net.http_post encola.
select
  id,
  status_code,
  created
from net._http_response
order by created desc
limit 10;
