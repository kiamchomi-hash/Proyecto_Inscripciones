import type { APIRoute } from 'astro';
import { manejarNewsletter } from '../../api/newsletter.ts';
import { bindingDb, secretoCron, transporteMail } from '../../api/runtime.ts';

// Adaptador delgado del cron: autenticación, lectura D1 y reclamo durable viven
// en `src/api/newsletter.ts`. Sólo GET, como el handler vigente.
export const prerender = false;

export const GET: APIRoute = ({ request }) => manejarNewsletter(request, bindingDb(), {
  secretoCron: secretoCron(),
  mail: transporteMail(),
});

export const ALL: APIRoute = () => new Response(
  JSON.stringify({ error: 'Método no permitido' }),
  { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'GET' } },
);
