import type { APIRoute } from 'astro';
import { responderDetalle } from '../../api/carreras-detalle.ts';
import { bindingDb } from '../../api/runtime.ts';

// Adaptador delgado, como `/api/formularios`: la lectura y el contrato viven en
// `src/api/carreras-detalle.ts`. El handler vigente sólo admite GET; cualquier
// otro método responde 405 en vez del 404 de Astro.
export const prerender = false;

export const GET: APIRoute = () => responderDetalle(bindingDb());

export const ALL: APIRoute = () => new Response(
  JSON.stringify({ error: 'Método no permitido' }),
  {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'GET' },
  },
);
