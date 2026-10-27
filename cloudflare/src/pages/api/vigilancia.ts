import type { APIRoute } from 'astro';
import { lectorDePrecios, manejarVigilancia } from '../../api/vigilancia.ts';
import { bindingDb, buscarRed, secretoCron, telegramCron } from '../../api/runtime.ts';

// Sólo lectura: los chequeos HTTP usan el `fetch` del Worker y la consulta de
// precios va parametrizada. Nada de esto se ejecuta en las pruebas, que inyectan
// `buscar` y lectores dobles.
export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const db = bindingDb();
  return manejarVigilancia(request, {
    secretoCron: secretoCron(),
    buscar: buscarRed,
    telegram: (texto, timeoutMs) => telegramCron(texto, timeoutMs),
    ...(db ? { precios: lectorDePrecios(db) } : {}),
  });
};

export const ALL: APIRoute = () => new Response(
  JSON.stringify({ error: 'Método no permitido' }),
  { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'GET' } },
);
