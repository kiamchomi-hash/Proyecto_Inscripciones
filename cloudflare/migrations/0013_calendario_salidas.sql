-- Salidas del calendario académico hacia la oferta, agregadas por día y destino.
--
-- El calendario es la segunda página que más clics de Google recibe y hasta acá
-- sus salidas hacia las carreras sólo vivían en memoria del navegador: se sabía
-- que la visita llegaba, no si terminaba en una ficha. Guarda el destino, no la
-- página de origen (siempre es /calendario-academico) ni nada de la visita.
--
-- `fecha` es el día en Argentina, igual que `whatsapp_clicks` y `career_clicks`:
-- las tres tablas tienen que poder cruzarse. Los destinos son los que clasifica
-- `destinoDesdeCalendario` en `lib/analytics.ts`; la lista cerrada acá es la
-- misma y evita que un valor raro del navegador invente filas nuevas.
CREATE TABLE calendario_salidas (
  fecha TEXT NOT NULL CHECK (length(fecha) = 10 AND fecha IS date(fecha, '+0 days')),
  destino TEXT NOT NULL CHECK (
    destino IN ('oferta', 'teclab', 'carrera', 'preinscripcion', 'contacto')
  ),
  salidas INTEGER NOT NULL DEFAULT 0 CHECK (salidas BETWEEN 0 AND 2147483647),
  PRIMARY KEY (fecha, destino)
) STRICT;
