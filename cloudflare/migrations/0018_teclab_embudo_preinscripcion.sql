-- El modal de Teclab suma un slide de preinscripción después del precio
-- (27/11/2026). Para contar cuántos llegan y cuántos se van sin enviar, el
-- paso `preinscripcion` tiene que entrar en el CHECK de `teclab_embudo`.
--
-- SQLite no permite cambiar un CHECK: se arma la tabla nueva, se copian las
-- filas tal cual y se reemplaza la vieja. La lista de pasos es la de
-- `PASOS_TECLAB` en `lib/teclab-embudo.ts`, en el mismo orden; una prueba fija
-- que coincidan.
CREATE TABLE teclab_embudo_nueva (
  fecha TEXT NOT NULL CHECK (length(fecha) = 10 AND fecha IS date(fecha, '+0 days')),
  superficie TEXT NOT NULL CHECK (superficie IN ('modal', 'ficha')),
  carrera TEXT NOT NULL CHECK (length(carrera) BETWEEN 1 AND 120),
  evento TEXT NOT NULL CHECK (evento IN ('alcanzado', 'cerrado', 'whatsapp', 'inscripcion', 'relacionada', 'consulta')),
  paso TEXT NOT NULL CHECK (paso IN ('portada', 'cursada', 'plan', 'cierre', 'precio', 'preinscripcion', 'faq', 'formulario', 'perfil', 'oficial', 'relacionadas')),
  movil INTEGER NOT NULL CHECK (movil IN (0, 1)),
  veces INTEGER NOT NULL DEFAULT 0 CHECK (veces BETWEEN 0 AND 2147483647),
  PRIMARY KEY (fecha, superficie, carrera, evento, paso, movil)
) STRICT;

INSERT INTO teclab_embudo_nueva (fecha, superficie, carrera, evento, paso, movil, veces)
  SELECT fecha, superficie, carrera, evento, paso, movil, veces FROM teclab_embudo;

DROP TABLE teclab_embudo;

ALTER TABLE teclab_embudo_nueva RENAME TO teclab_embudo;
