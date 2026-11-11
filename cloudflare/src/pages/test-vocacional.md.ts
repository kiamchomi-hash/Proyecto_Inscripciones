import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { PAGINAS } from '@/lib/paginas';
import { datosLlmsTxt } from '../datos/llms-txt';
import { construirMarkdownCatalogo } from '../entrega/markdown-catalogos';
import { lineaDeCarrera } from '../entrega/llms-txt';
import { BASE } from '../entrega/sitemap-xml';

// La versión markdown del test vocacional: `/test-vocacional.md`. El test
// general recorre las carreras de la oferta salvo las de Identidad Argentina,
// que tienen su propio test.
export const GET: APIRoute = async () => {
  const datos = await datosLlmsTxt(env.DB);
  const items = datos.carreras
    .filter(carrera => carrera.nivel !== 'Identidad Argentina')
    .map(lineaDeCarrera);
  return new Response(construirMarkdownCatalogo({
    titulo: PAGINAS.vocacional.titulo,
    descripcion: PAGINAS.vocacional.descripcion,
    url: `${BASE}/test-vocacional`,
    secciones: [{ titulo: 'Carreras de la oferta', items }],
  }), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
