import type { APIRoute } from 'astro';
import { manejarAlertaAnalytics } from '../../api/alertas-analytics.ts';
import { bindingDb, telegramAlerta } from '../../api/runtime.ts';

export const prerender = false;

export const POST: APIRoute = ({ request }) => manejarAlertaAnalytics(request, bindingDb(), {
  telegram: telegramAlerta,
});

export const ALL: APIRoute = () => new Response(
  JSON.stringify({ error: 'Método no permitido' }),
  { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST' } },
);
