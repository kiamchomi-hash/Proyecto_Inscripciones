import type { APIRoute } from 'astro';
import { construirMarkdownContacto } from '../entrega/markdown-contacto';
import { BASE } from '../entrega/sitemap-xml';

// La versión markdown de la página de contacto: `/contacto.md`.
export const GET: APIRoute = () => new Response(construirMarkdownContacto(`${BASE}/contacto`), {
  status: 200,
  headers: {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});
