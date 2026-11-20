import type { APIRoute } from 'astro';
import { manejarRecordatorioPlanesTeclab } from '../../api/recordatorio-planes-teclab.ts';
import { secretoCron, telegramCron } from '../../api/runtime.ts';

export const prerender = false;

export const GET: APIRoute = ({ request }) => manejarRecordatorioPlanesTeclab(request, {
  secretoCron: secretoCron(),
  telegram: texto => telegramCron(texto),
});

export const ALL: APIRoute = () => new Response(
  JSON.stringify({ error: 'Método no permitido' }),
  { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'GET' } },
);
