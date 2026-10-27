import { barridoDeEfectos, manejarLote, type LoteCola, type ProductorCola } from './colas.ts';
import { crearTransportes, type Buscar, type ConfigEnvios } from './transportes.ts';
import type { Transportes } from './consumidores.ts';
import { manejarNewsletter, type EntornoNewsletter } from '../api/newsletter.ts';
import { manejarRecordatorio } from '../api/recordatorio-teclab.ts';
import { manejarVigilancia } from '../api/vigilancia.ts';
import { enviarDigest } from './digest.ts';

/**
 * Operativa de producción: consumo de la cola y barrido del outbox.
 *
 * Sólo se cablea con `APP_STAGE === 'produccion'`. Cada transporte se arma con lo
 * que exista en el entorno: un canal sin credencial devuelve `sin-transfigurar`
 * en el transporte y la intención queda **pendiente** en el outbox, que es
 * recuperable. Nunca se inventa un destino ni se manda a un buzón por defecto.
 */

export interface EntornoProduccion {
  APP_STAGE?: string;
  DB?: D1Database;
  EFECTOS?: ProductorCola;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  SMTP2GO_API_KEY?: string;
  HUBSPOT_HABILITADO?: string;
}

export const COLA_EFECTOS = 'cau-efectos';

/** Sólo la configuración de los canales que realmente están cargados. */
export function configEnvios(entorno: EntornoProduccion): ConfigEnvios {
  const config: ConfigEnvios = {};
  if (entorno.TELEGRAM_BOT_TOKEN && entorno.TELEGRAM_CHAT_ID) {
    config.telegram = { token: entorno.TELEGRAM_BOT_TOKEN, chatId: entorno.TELEGRAM_CHAT_ID };
  }
  if (entorno.SMTP2GO_API_KEY) config.smtp = { clave: entorno.SMTP2GO_API_KEY };
  if (entorno.HUBSPOT_HABILITADO === 'si') config.hubspot = { habilitado: true };
  return config;
}

export function transportesProduccion(
  entorno: EntornoProduccion,
  db: D1Database,
  buscar: Buscar = (url, init) => fetch(url, init),
): Transportes {
  const config = configEnvios(entorno);
  if (Object.keys(config).length === 0) return {};
  return crearTransportes(config, buscar, db);
}

function exigirProduccion(entorno: EntornoProduccion): D1Database {
  if (entorno.APP_STAGE !== 'produccion' || !entorno.DB) {
    throw new Error('Operativa de producción sin configurar');
  }
  return entorno.DB;
}

/** Consume un lote. La cola se compara por nombre: otra cola no se procesa. */
export async function manejarColaProduccion(
  lote: LoteCola & { queue: string },
  entorno: EntornoProduccion,
  buscar?: Buscar,
): Promise<unknown> {
  const db = exigirProduccion(entorno);
  if (lote.queue !== COLA_EFECTOS) throw new Error('Cola no autorizada');
  return manejarLote(lote, db, transportesProduccion(entorno, db, buscar));
}

/** Barrido del cron: lo que nunca llegó a la cola o quedó sin transporte. */
export async function manejarProgramadoProduccion(
  entorno: EntornoProduccion,
  buscar?: Buscar,
): Promise<unknown> {
  const db = exigirProduccion(entorno);
  return barridoDeEfectos(db, transportesProduccion(entorno, db, buscar));
}

/**
 * Programados de producción y el cron exacto de cada uno.
 *
 * Se despacha por la expresión del `triggers.crons`, nunca por hora del reloj, y
 * una expresión desconocida falla. Todos los handlers exigen el mismo
 * `CRON_SECRET` que hoy protege las rutas de Vercel: si falta, responden 401 y no
 * hacen nada, en vez de correr sin autenticación.
 *
 * El resumen diario de clics (`digest-clicks` en Supabase) todavía no está
 * implementado: produce números que se avisan, así que hay que leer su contrato
 * antes de reescribirlo. Ese cron no se declara.
 */
export const CRONES = {
  /** Barrido del outbox: recupera lo que no llegó a la cola. */
  efectos: '*/5 * * * *',
  vigilancia: '0 */6 * * *',
  newsletter: '0 13 * * *',
  recordatorio: '0 12 * * 1',
  digest: '0 12 * * *',
} as const;

export type NombreCron = keyof typeof CRONES;

export interface ContextoProgramado {
  db: D1Database | null;
  secretoCron?: string;
  origen: string;
  buscar: Buscar;
  telegram?: (texto: string, timeoutMs?: number) => Promise<string>;
  mail?: EntornoNewsletter['mail'];
  usuariosActivos?: (fecha: string) => Promise<number>;
  telegramConfig?: { token: string; chatId: string };
  smtpClave?: string;
}

const tareaDe = (expresion: string): NombreCron | null =>
  (Object.entries(CRONES) as [NombreCron, string][]).find(([, cron]) => cron === expresion)?.[0] ?? null;

export async function manejarProgramado(
  expresion: string,
  contexto: ContextoProgramado,
): Promise<{ tarea: NombreCron; status: number; cuerpo: unknown }> {
  const tarea = tareaDe(expresion);
  if (!tarea) throw new Error('Cron no autorizado');

  const request = new Request(`${contexto.origen}/api/${tarea === 'recordatorio' ? 'recordatorio-teclab' : tarea}`, {
    headers: contexto.secretoCron ? { Authorization: `Bearer ${contexto.secretoCron}` } : {},
  });

  if (tarea === 'efectos') {
    if (!contexto.db) throw new Error('Barrido sin base');
    const resumen = await barridoDeEfectos(
      contexto.db,
      contexto.telegram || contexto.mail
        ? crearTransportes(
          {
            ...(contexto.telegram ? { telegram: contexto.telegramConfig! } : {}),
            ...(contexto.mail ? { smtp: { clave: contexto.smtpClave! } } : {}),
          },
          contexto.buscar, contexto.db,
        )
        : {},
    );
    return { tarea, status: 200, cuerpo: resumen };
  }

  if (tarea === 'digest') {
    if (!contexto.db) throw new Error('Digest sin base');
    if (!contexto.telegram) throw new Error('Digest sin canal');
    const resultado = await enviarDigest({
      db: contexto.db,
      telegram: (texto) => contexto.telegram!(texto),
      usuariosActivos: contexto.usuariosActivos,
    });
    return { tarea, status: resultado.enviados > 0 ? 200 : 503, cuerpo: resultado };
  }

  const respuesta = tarea === 'vigilancia'
    ? await manejarVigilancia(request, { secretoCron: contexto.secretoCron, buscar: contexto.buscar, telegram: contexto.telegram })
    : tarea === 'newsletter'
      ? await manejarNewsletter(request, contexto.db, { secretoCron: contexto.secretoCron, mail: contexto.mail })
      : await manejarRecordatorio(request, contexto.db, { secretoCron: contexto.secretoCron, telegram: contexto.telegram });

  const cuerpo = await respuesta.json().catch(() => null);
  return { tarea, status: respuesta.status, cuerpo };
}
