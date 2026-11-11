import type { APIRoute } from 'astro';
import { construirMarkdownCalendario } from '../entrega/markdown-calendario';
import { BASE } from '../entrega/sitemap-xml';

// La versión markdown del calendario académico: `/calendario-academico.md`.
export const GET: APIRoute = () => new Response(construirMarkdownCalendario(`${BASE}/calendario-academico`), {
  status: 200,
  headers: {
    'Content-Type': 'text/markdown; charset=utf-8',
    'Cache-Control': 'no-store',
  },
});
