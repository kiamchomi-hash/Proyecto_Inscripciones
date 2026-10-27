import type { APIRoute } from 'astro';
import { manejarApertura } from '../../api/tracking.ts';
import { bindingDb } from '../../api/runtime.ts';

export const prerender = false;

export const POST: APIRoute = ({ request }) => manejarApertura(request, bindingDb(), 'modal');

export const ALL: APIRoute = () => new Response(
  JSON.stringify({ error: 'Método no permitido' }),
  { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST' } },
);
