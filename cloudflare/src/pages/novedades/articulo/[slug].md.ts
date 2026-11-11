import { env } from 'cloudflare:workers';
import type { APIRoute } from 'astro';
import { leerArticulo } from '../../../datos/novedades';
import { construirMarkdownArticulo, urlArticulo } from '../../../entrega/markdown-articulo';

// La versión markdown del artículo: `/novedades/articulo/<slug>.md`.
export const GET: APIRoute = async ({ params }) => {
  const slug = params.slug ?? '';
  const articulo = await leerArticulo(env.DB, slug);
  if (!articulo) return new Response(null, { status: 404 });
  return new Response(construirMarkdownArticulo(articulo, urlArticulo(articulo.slug)), {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
