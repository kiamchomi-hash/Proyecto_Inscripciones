-- Recorrido de las carreras de Teclab, agregado por día, superficie, carrera,
-- evento, paso y dispositivo.
--
-- `whatsapp_clicks` dice cuántos tocaron WhatsApp y desde qué ruta, pero no en
-- qué parte: el modal de la home no cambia la URL y la ficha es una sola
-- página larga. Esta tabla guarda el paso (slide del modal o sección de la
-- ficha): ni mail, ni identificadores, ni filas por visita.
--
-- `fecha` es el día en Argentina, igual que `whatsapp_clicks` y
-- `vocacional_embudo`. Los valores de `superficie`, `evento` y `paso` son los
-- de `lib/teclab-embudo.ts`; una prueba fija que coincidan.
CREATE TABLE teclab_embudo (
  fecha TEXT NOT NULL CHECK (length(fecha) = 10 AND fecha IS date(fecha, '+0 days')),
  superficie TEXT NOT NULL CHECK (superficie IN ('modal', 'ficha')),
  carrera TEXT NOT NULL CHECK (length(carrera) BETWEEN 1 AND 120),
  evento TEXT NOT NULL CHECK (evento IN ('alcanzado', 'cerrado', 'whatsapp', 'inscripcion', 'relacionada', 'consulta')),
  paso TEXT NOT NULL CHECK (paso IN ('portada', 'cursada', 'plan', 'cierre', 'precio', 'faq', 'formulario', 'perfil', 'oficial', 'relacionadas')),
  movil INTEGER NOT NULL CHECK (movil IN (0, 1)),
  veces INTEGER NOT NULL DEFAULT 0 CHECK (veces BETWEEN 0 AND 2147483647),
  PRIMARY KEY (fecha, superficie, carrera, evento, paso, movil)
) STRICT;
