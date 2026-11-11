import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { PAGINAS } from '@/lib/paginas';
import { datosLlmsTxt } from '../datos/llms-txt';
import { construirMarkdownCatalogo } from '../entrega/markdown-catalogos';
import { lineaDeMateria } from '../entrega/llms-txt';
import { BASE } from '../entrega/sitemap-xml';

// La versión markdown de la landing de las clases de apoyo: `/clases-apoyo.md`.
export const GET: APIRoute = async () => {
  const datos = await datosLlmsTxt(env.DB);
  const items = datos.materias.map(lineaDeMateria);
  return new Response(construirMarkdownCatalogo({
    titulo: PAGINAS.clases.titulo,
    descripcion: PAGINAS.clases.descripcion,
    url: `${BASE}/clases-apoyo`,
    secciones: [{ titulo: 'Materias', items }],
  }), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
