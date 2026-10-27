import { consumirEfecto, consumirPendientes, type Transportes } from './consumidores.ts';
import { TOPE_LOTE_OUTBOX, type ResumenConsumo } from './outbox.ts';

// Puente entre el outbox duradero y Cloudflare Queues/cron. La tabla es la
// autoridad: un mensaje lleva sólo el id de la fila, nunca el legajo ni el
// contenido del mail. Queues entrega al menos una vez, así que el consumidor
// vuelve a leer el estado antes de enviar: una entrega repetida de una fila
// `enviado` no llama al proveedor.
//
// Recibe productor/lote como puertos. `worker.ts` conecta queue/scheduled locales;
// todos los caminos comparten el reclamo durable antes de preparar o enviar.

export interface MensajeEfecto {
  tipo: 'efecto';
  /** Id de la fila del outbox. Es la única referencia que viaja. */
  id: number;
}

export interface ProductorCola {
  send(cuerpo: MensajeEfecto): Promise<unknown>;
}

export interface MensajeCola {
  readonly body: unknown;
  readonly attempts: number;
  ack(): void;
  retry(options?: { delaySeconds?: number }): void;
}

export interface LoteCola {
  readonly messages: readonly MensajeCola[];
}

const ID_MAXIMO = Number.MAX_SAFE_INTEGER;

/** Valida un cuerpo de cola; cualquier otra cosa se descarta sin reintentar. */
export function leerMensajeEfecto(cuerpo: unknown): MensajeEfecto | null {
  if (cuerpo === null || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) return null;
  const { tipo, id } = cuerpo as Record<string, unknown>;
  if (tipo !== 'efecto') return null;
  if (typeof id !== 'number' || !Number.isSafeInteger(id) || id < 1 || id > ID_MAXIMO) return null;
  return { tipo, id };
}

export function mensajeEfecto(id: number): MensajeEfecto {
  if (!Number.isSafeInteger(id) || id < 1 || id > ID_MAXIMO) throw new TypeError('ID de efecto inválido.');
  return { tipo: 'efecto', id };
}

/**
 * Publica las referencias de las filas recién escritas. No lanza: el outbox ya
 * quedó confirmado y un fallo de la cola no cambia la respuesta pública; la fila
 * sigue `pendiente` y el barrido la recupera. Devuelve cuántas se publicaron.
 */
export async function publicarEfectos(cola: ProductorCola | undefined, ids: readonly number[]): Promise<number> {
  if (!cola || ids.length === 0) return 0;
  let publicados = 0;
  const vistos = new Set<number>();
  for (const id of ids) {
    if (!Number.isSafeInteger(id) || id < 1 || vistos.has(id)) continue;
    vistos.add(id);
    try {
      await cola.send(mensajeEfecto(id));
      publicados += 1;
    } catch (error) {
      // Sólo el tipo de error: ni datos del lead ni el cuerpo del mensaje.
      console.error('[colas] No se pudo publicar el efecto', {
        code: error instanceof Error ? error.name : 'desconocido',
      });
    }
  }
  return publicados;
}

export interface ResumenLote {
  total: number;
  enviados: number;
  omitidos: number;
  errores: number;
  ambiguos: number;
  sinTransporte: number;
  ignorados: number;
  invalidos: number;
  reintentos: number;
}

/**
 * Consume un lote de Queues. Un cuerpo inválido se descarta (ack) y una fila ya
 * terminada se ignora sin volver a enviar. Los errores de base se reintentan con
 * el backoff del proveedor; un rechazo o una ambigüedad del transporte ya quedó
 * marcado en el outbox y se confirma, porque reintentarlo automáticamente
 * duplicaría o repetiría lo que la política prohíbe.
 */
export async function manejarLote(
  lote: LoteCola, db: D1Database, transportes: Transportes,
): Promise<ResumenLote> {
  const resumen: ResumenLote = {
    total: lote.messages.length,
    enviados: 0, omitidos: 0, errores: 0, ambiguos: 0,
    sinTransporte: 0, ignorados: 0, invalidos: 0, reintentos: 0,
  };
  for (const mensaje of lote.messages) {
    const efecto = leerMensajeEfecto(mensaje.body);
    if (!efecto) {
      mensaje.ack();
      resumen.invalidos += 1;
      continue;
    }
    try {
      const resultado = await consumirEfecto(db, efecto.id, transportes);
      mensaje.ack();
      if (resultado === 'enviado') resumen.enviados += 1;
      else if (resultado === 'omitido') resumen.omitidos += 1;
      else if (resultado === 'error') resumen.errores += 1;
      else if (resultado === 'ambiguo') resumen.ambiguos += 1;
      else if (resultado === 'sin-transporte') resumen.sinTransporte += 1;
      else resumen.ignorados += 1;
    } catch (error) {
      // Error de base: todavía no se sabe el resultado; Queues reintenta. El
      // máximo de intentos y la cola de fallos son configuración del binding,
      // no una política nueva de este módulo.
      console.error('[colas] Error al consumir el efecto', {
        code: error instanceof Error ? error.name : 'desconocido',
      });
      mensaje.retry();
      resumen.reintentos += 1;
    }
  }
  return resumen;
}

/**
 * Barrido que ejecuta el cron: recupera lo que nunca llegó a la cola, lo que
 * quedó sin transporte y lo que se publicó dos veces, con rotación durable.
 */
export function barridoDeEfectos(
  db: D1Database, transportes: Transportes, { limite = TOPE_LOTE_OUTBOX }: { limite?: number } = {},
): Promise<ResumenConsumo> {
  return consumirPendientes(db, transportes, { limite });
}
