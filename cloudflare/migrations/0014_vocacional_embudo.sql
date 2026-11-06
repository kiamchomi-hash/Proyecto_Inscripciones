-- Embudo del test vocacional, agregado por día, test, evento y pregunta.
--
-- Hasta el corte a Cloudflare (27/10/2026) el recorrido se leía en Vercel Web
-- Analytics. En el Worker los eventos quedaban en memoria del navegador y no
-- había forma de saber en qué pregunta se caía la gente. Esta tabla guarda sólo
-- el paso alcanzado: ni respuestas, ni perfil vocacional, ni identificadores.
--
-- `fecha` es el día en Argentina, igual que `whatsapp_clicks` y
-- `calendario_salidas`, para poder cruzar las tres. `pregunta` es la posición
-- visible desde 1, la misma que manda el navegador. La lista de eventos es la
-- de `EVENTOS_VOCACIONAL_MEDIDOS` en `lib/vocacional-analytics.ts`: `retroceso`,
-- `reiniciado` y `cta` no se cuentan acá porque no ayudan a leer la caída y la
-- CTA ya se mide como clic en `career_clicks`.
CREATE TABLE vocacional_embudo (
  fecha TEXT NOT NULL CHECK (length(fecha) = 10 AND fecha IS date(fecha, '+0 days')),
  test TEXT NOT NULL CHECK (test IN ('general', 'teclab')),
  evento TEXT NOT NULL CHECK (
    evento IN (
      'vocacional-iniciado', 'vocacional-pregunta',
      'vocacional-completado', 'vocacional-salida'
    )
  ),
  pregunta INTEGER NOT NULL CHECK (pregunta BETWEEN 1 AND 30),
  veces INTEGER NOT NULL DEFAULT 0 CHECK (veces BETWEEN 0 AND 2147483647),
  PRIMARY KEY (fecha, test, evento, pregunta)
) STRICT;
