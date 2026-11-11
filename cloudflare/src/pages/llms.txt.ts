import { env } from 'cloudflare:workers';
import { datosLlmsTxt } from '../datos/llms-txt.ts';
import { construirLlmsTxt } from '../entrega/llms-txt.ts';

// Se genera en cada pedido, como `sitemap.xml`: el archivo tiene que reflejar
// altas y bajas de la oferta sin esperar un deploy. No va en el sitemap ni en
// `robots.txt`: es para los agentes que leen el sitio, no para el buscador.
export async function GET() {
  const markdown = construirLlmsTxt(await datosLlmsTxt(env.DB));
  return new Response(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
