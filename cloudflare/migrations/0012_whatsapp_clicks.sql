-- Clics a WhatsApp del CAU, agregados por día, página de origen y dispositivo.
--
-- Existe porque la medición anterior vivía en Vercel Analytics y el sitio pasó a
-- Cloudflare: desde el corte, un clic al botón de WhatsApp no dejaba rastro. Es
-- la conversión más transitada del sitio, así que sin esto no hay forma de saber
-- si una caída de consultas viene de menos visitas o de menos clics.
--
-- Guarda agregados y nunca filas por visita: ni IP, ni user agent, ni sesión. El
-- `origen` es el pathname donde se tocó el botón, sin query ni hash, y `movil`
-- separa el clic que abre WhatsApp con la sesión puesta del que cae en la
-- pantalla de descarga de WhatsApp Web. `fecha` es el día en Argentina, igual
-- que `career_clicks`: las dos tablas tienen que poder cruzarse.
CREATE TABLE whatsapp_clicks (
  fecha TEXT NOT NULL CHECK (length(fecha) = 10 AND fecha IS date(fecha, '+0 days')),
  origen TEXT NOT NULL CHECK (length(origen) BETWEEN 1 AND 120 AND substr(origen, 1, 1) = '/'),
  movil INTEGER NOT NULL CHECK (movil IN (0, 1)),
  clicks INTEGER NOT NULL DEFAULT 0 CHECK (clicks BETWEEN 0 AND 2147483647),
  PRIMARY KEY (fecha, origen, movil)
) STRICT;
