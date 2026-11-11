import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { listarNovedades } from '../../datos/novedades';
import { construirMarkdownNovedades } from '../../entrega/markdown-novedades';
import { BASE } from '../../entrega/sitemap-xml';

// La versión markdown del listado de novedades: `/novedades/<n>.md`. Una
// página que no existe da 404, igual que su versión HTML.
export const GET: APIRoute = async ({ params }) => {
  const pagina = params.page ?? '';
  const datos = await listarNovedades(env.DB, pagina);
  if (!datos) {
    return new Response('No encontrado\n', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return new Response(construirMarkdownNovedades({
    currentPage: datos.currentPage,
    totalPages: datos.totalPages,
    pinned: datos.pinnedItem,
    items: datos.items,
  }, `${BASE}/novedades/${pagina}`), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
