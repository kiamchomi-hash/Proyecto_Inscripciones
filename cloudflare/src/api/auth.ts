import { igualdadTiempoConstante } from './seguro.ts';

/**
 * Autorización de los endpoints que dispara un cron o un trigger externo.
 * Mismo contrato que los handlers vigentes: sin la variable configurada se
 * responde 503 y con otro `Bearer` 401. La comparación usa los hashes en tiempo
 * constante, como el robot; el valor esperado nunca se registra ni se devuelve.
 */
export async function rechazoBearer(
  request: Request, secreto: string | undefined, variable: string,
): Promise<Response | null> {
  if (!secreto) {
    return new Response(JSON.stringify({ error: `${variable} sin configurar` }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }
  const recibido = await huella(request.headers.get('authorization') ?? '');
  if (!igualdadTiempoConstante(recibido, await huella(`Bearer ${secreto}`))) {
    return new Response(JSON.stringify({ error: 'no autorizado' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

async function huella(texto: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)));
}
