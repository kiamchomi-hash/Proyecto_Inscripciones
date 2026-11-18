import type { APIRoute } from 'astro';
import { manejarCorreoPrueba } from '../../api/correo-prueba.ts';
import {
  bindingCorreo, bindingDb, destinoCorreoPrueba, secretoCorreoPrueba,
} from '../../api/runtime.ts';
import { idParaBaja } from '../../datos/newsletter.ts';
import { enviarCorreoDePrueba } from '../../operativa/transportes.ts';

export const prerender = false;

export const POST: APIRoute = ({ request }) => {
  const binding = bindingCorreo();
  const db = bindingDb();
  return manejarCorreoPrueba(request, {
    secreto: secretoCorreoPrueba(),
    destino: destinoCorreoPrueba(),
    idBaja: db ? email => idParaBaja(db, email) : undefined,
    mail: binding ? (para, bajaUrl) => enviarCorreoDePrueba(binding, para, bajaUrl) : undefined,
  });
};

export const ALL: APIRoute = () => new Response(
  JSON.stringify({ error: 'Método no permitido' }),
  { status: 405, headers: { 'Content-Type': 'application/json', Allow: 'POST' } },
);
