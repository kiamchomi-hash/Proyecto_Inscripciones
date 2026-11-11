import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { datosLlmsTxt } from '../datos/llms-txt';
import { construirMarkdownInicio } from '../entrega/markdown-inicio';
import { BASE } from '../entrega/sitemap-xml';

// La versión markdown de la home: `/index.md`. Astro quita sólo la última
// extensión, así que este archivo convive con `index.astro` sin pisarlo.
export const GET: APIRoute = async () => {
  const datos = await datosLlmsTxt(env.DB);
  return new Response(construirMarkdownInicio(datos.carreras, BASE), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
