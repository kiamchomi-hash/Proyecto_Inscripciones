-- URLs que el Worker ya avisó a IndexNow.
--
-- El aviso no puede salir del workflow de GitHub: al leer `/sitemap.xml` desde
-- las IPs de los runners, Cloudflare contesta 403 (comprobado el 10/11/2026;
-- desde la máquina de la sede el mismo pedido da 200). El Worker sí tiene la
-- lista a mano en D1, así que un cron la arma con `datosSitemap` +
-- `construirSitemap` y avisa sólo lo que cambió.
--
-- `huella` es el `lastModified` de la entrada del sitemap, o '-' cuando no lo
-- declara. Si una carrera o una novedad se edita, cambia la huella y la URL
-- vuelve a avisarse aunque ya estuviera listada. Las filas de URLs que salieron
-- del sitemap se borran en la misma corrida.
CREATE TABLE indexnow_avisadas (
  url TEXT NOT NULL PRIMARY KEY CHECK (url LIKE 'https://%'),
  huella TEXT NOT NULL,
  avisada_en TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;
