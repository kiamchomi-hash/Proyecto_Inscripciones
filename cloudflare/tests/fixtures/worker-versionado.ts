// Sonda local del versionado de HTML: devuelve una página armada a mano que
// tiene, en el mismo texto, una referencia de asset y los operadores que el
// navegador necesita crudos (`&&`, `=>`) más un JSON-LD con `&`.
//
// El caso importa porque `versionarRespuestaHtml` reescribe el texto de
// `style,script:not([src])`; si lo escribe como texto HTML, escapa `&`, `<` y
// `>` y deja el script sin poder parsearse.
import { versionarRespuestaHtml } from '../../src/entrega/assets-r2.ts';

const VERSION = '11111111-2222-4333-8444-555555555555';

const PAGINA = `<!doctype html><html><head><style>.a > .b{background:url(/imagenes/logo.webp)}</style></head><body><script>const suma = 1 && 2; const ruta = () => '/imagenes/logo.webp';</script><script type="application/ld+json">{"nombre":"A & B","imagen":"/imagenes/og/default.jpg"}</script></body></html>`;

export default {
  async fetch() {
    return versionarRespuestaHtml(
      new Response(PAGINA, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
      VERSION,
      'https://www.siglo21sur.com',
    );
  },
};
