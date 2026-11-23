-- Grupo de la prueba A/B del ticket de descuento en la ficha de Teclab
-- (lib/ab-ticket-teclab.ts, 23/11/2026).
--
-- El grupo entra en la clave: cada fila agregada es por día, superficie,
-- carrera, evento, paso, dispositivo y grupo. SQLite no cambia la clave
-- primaria de una tabla existente, así que se rearma: se crea la nueva, se
-- copian las filas con `grupo = 'sin-prueba'` (todas son de antes de la prueba)
-- y se reemplaza. Sigue sin guardar mail, identificadores ni filas por visita.
--
-- Los valores de `grupo` son los de `GRUPOS_TECLAB` en lib/teclab-embudo.ts;
-- una prueba fija que coincidan.
CREATE TABLE teclab_embudo_nueva (
  fecha TEXT NOT NULL CHECK (length(fecha) = 10 AND fecha IS date(fecha, '+0 days')),
  superficie TEXT NOT NULL CHECK (superficie IN ('modal', 'ficha')),
  carrera TEXT NOT NULL CHECK (length(carrera) BETWEEN 1 AND 120),
  evento TEXT NOT NULL CHECK (evento IN ('alcanzado', 'cerrado', 'whatsapp', 'inscripcion', 'relacionada', 'consulta')),
  paso TEXT NOT NULL CHECK (paso IN ('portada', 'cursada', 'plan', 'cierre', 'precio', 'faq', 'formulario', 'perfil', 'oficial', 'relacionadas')),
  movil INTEGER NOT NULL CHECK (movil IN (0, 1)),
  grupo TEXT NOT NULL DEFAULT 'sin-prueba' CHECK (grupo IN ('sin-prueba', 'control', 'bimestres', 'bimestres-azul', 'revision')),
  veces INTEGER NOT NULL DEFAULT 0 CHECK (veces BETWEEN 0 AND 2147483647),
  PRIMARY KEY (fecha, superficie, carrera, evento, paso, movil, grupo)
) STRICT;

INSERT INTO teclab_embudo_nueva (fecha, superficie, carrera, evento, paso, movil, grupo, veces)
  SELECT fecha, superficie, carrera, evento, paso, movil, 'sin-prueba', veces FROM teclab_embudo;

DROP TABLE teclab_embudo;

ALTER TABLE teclab_embudo_nueva RENAME TO teclab_embudo;
