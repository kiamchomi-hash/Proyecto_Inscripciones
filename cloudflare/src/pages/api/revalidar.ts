import type { APIRoute } from 'astro';
import { manejarRevalidar } from '../../api/revalidar.ts';
import { secretoRevalidar } from '../../api/runtime.ts';

export const prerender = false;

export const POST: APIRoute = ({ request }) => manejarRevalidar(request, secretoRevalidar());

export const ALL: APIRoute = () => new Response(
  JSON.stringify({ error: 'Método no permitido' }),
  { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST' } },
);
