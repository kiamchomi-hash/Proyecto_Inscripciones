import type { APIRoute } from 'astro';
import { manejarCorreoPrueba } from '../../api/correo-prueba.ts';
import {
  bindingCorreo, destinoCorreoPrueba, secretoCorreoPrueba,
} from '../../api/runtime.ts';
import { enviarCorreoDePrueba } from '../../operativa/transportes.ts';

export const prerender = false;

export const POST: APIRoute = ({ request }) => {
  const binding = bindingCorreo();
  return manejarCorreoPrueba(request, {
    secreto: secretoCorreoPrueba(),
    destino: destinoCorreoPrueba(),
    mail: binding ? para => enviarCorreoDePrueba(binding, para) : undefined,
  });
};

export const ALL: APIRoute = () => new Response(
  JSON.stringify({ error: 'Método no permitido' }),
  { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST' } },
);
