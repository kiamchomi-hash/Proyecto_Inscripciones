import { createServer } from 'node:http';
import { once } from 'node:events';
import { setTimeout as esperar } from 'node:timers/promises';

// Utilidades de red para las pruebas de navegador: puerto libre, espera de
// arranque y cierre del grupo de procesos. Todo en loopback.

export async function puertoLibre() {
  const servidor = createServer();
  servidor.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const { port } = servidor.address();
  servidor.close();
  await once(servidor, 'close');
  return port;
}

/** Espera a que una URL responda (cualquier estado) o falla con el último error. */
export async function esperarHttp(url, limiteMs) {
  const hasta = Date.now() + limiteMs;
  let ultimoError;
  while (Date.now() < hasta) {
    try {
      const respuesta = await fetch(url);
      if (respuesta.status > 0) return respuesta;
    } catch (error) {
      ultimoError = error;
    }
    await esperar(500);
  }
  throw new Error(`No respondió ${url}: ${ultimoError?.message ?? 'sin detalle'}`);
}

/** Mata el grupo entero: `wrangler dev` deja hijos. */
export function matarGrupo(hijo) {
  if (!hijo?.pid) return;
  try { process.kill(-hijo.pid, 'SIGKILL'); } catch { /* ya terminó */ }
}
