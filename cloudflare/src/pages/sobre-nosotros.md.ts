import type { APIRoute } from 'astro';
import { construirMarkdownSobreNosotros } from '../entrega/markdown-sobre-nosotros';
import { BASE } from '../entrega/sitemap-xml';

// La versión markdown de la página del CAU: `/sobre-nosotros.md`.
export const GET: APIRoute = () => new Response(construirMarkdownSobreNosotros(`${BASE}/sobre-nosotros`), {
  status: 200,
  headers: {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});
