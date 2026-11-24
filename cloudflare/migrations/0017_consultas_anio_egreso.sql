-- Año de egreso del secundario, que pide la preinscripción de Teclab.
-- Texto como el resto del legajo: el formulario lo guarda tal cual lo escribió
-- el lead y un valor raro no rebota la consulta.
--
-- Se aplica ANTES de publicar el código que lo escribe: con la columna ausente,
-- D1 rechaza el INSERT entero y deja de entrar toda preinscripción de Teclab.
ALTER TABLE consultas ADD COLUMN anio_egreso TEXT;
