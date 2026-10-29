import { rechazoBearer } from './auth.ts';
import {
  ErrorAmbiguo, ErrorRechazo, type ResultadoTransporte,
} from '../operativa/consumidores.ts';

/**
 * `POST /api/correo-prueba`: manda un correo fijo a un destino fijo para
 * comprobar que el binding `send_email` del Worker funciona de verdad.
 *
 * Existe por la novela de SMTP2GO: el camino de la API se puede probar con
 * `wrangler email sending send`, pero eso no dice nada del binding dentro del
 * Worker. Sin esta ruta, la única forma de enterarse de que el correo no sale es
 * un lead que espera un precio que nunca llega.
 *
 * Lo que la hace inofensiva: no lee cuerpo ni query, no acepta destinatario ni
 * contenido, no toca D1 ni el outbox, y exige un secreto propio. Sin
 * `CORREO_PRUEBA_SECRETO` o sin `CORREO_PRUEBA_DESTINO` responde 503.
 */

export interface EntornoCorreoPrueba {
  secreto?: string;
  destino?: string;
  mail?: (para: string) => Promise<ResultadoTransporte>;
}

const respuesta = (cuerpo: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

export async function manejarCorreoPrueba(
  request: Request, entorno: EntornoCorreoPrueba,
): Promise<Response> {
  const negado = await rechazoBearer(request, entorno.secreto, 'CORREO_PRUEBA_SECRETO');
  if (negado) return negado;

  if (!entorno.destino) return respuesta({ error: 'CORREO_PRUEBA_DESTINO sin configurar' }, 503);
  if (!entorno.mail) return respuesta({ error: 'transporte de correo sin configurar' }, 503);

  try {
    const resultado = await entorno.mail(entorno.destino);
    if (resultado !== 'enviado') return respuesta({ ok: false, resultado }, 503);
  } catch (error) {
    // El código del proveedor sirve para diagnosticar; nunca se devuelve el
    // mensaje del error ni el destino.
    if (error instanceof ErrorRechazo) return respuesta({ error: error.codigo }, 502);
    if (error instanceof ErrorAmbiguo) return respuesta({ error: error.codigo }, 504);
    return respuesta({ error: 'error-desconocido' }, 500);
  }

  return respuesta({ ok: true });
}
