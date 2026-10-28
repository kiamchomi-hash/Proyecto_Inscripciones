import type { APIRoute } from 'astro';
import { manejarAlertaCloudflare } from '../../api/alerta-cloudflare.ts';
import { bindingDb, secretoAlertaCloudflare, telegramAlerta } from '../../api/runtime.ts';

export const prerender = false;

export const POST: APIRoute = ({ request }) => manejarAlertaCloudflare(request, bindingDb(), {
  telegram: telegramAlerta,
  secreto: secretoAlertaCloudflare(),
});

export const ALL: APIRoute = () => new Response(
  JSON.stringify({ error: 'Método no permitido' }),
  { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST' } },
);
