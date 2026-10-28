import { env } from 'cloudflare:workers';
import { resolverDb } from '../datos/binding.ts';
import type { EntornoFormularios } from './formularios.ts';
import { verificarTurnstile } from './turnstile.ts';
import type { ProductorCola } from '../operativa/colas.ts';
import { crearTransporteMail, type Buscar } from '../operativa/transportes.ts';
import {
  enviarTelegramDirecto, enviarTelegramSeguro, type ConfigTelegram,
} from '../operativa/telegram.ts';

// Puente con el runtime del Worker. Sólo los adaptadores de `src/pages/api/` lo
// importan: los módulos de `src/api/` se prueban en Node sin `cloudflare:workers`.
// Ninguna función devuelve el objeto de entorno completo: sólo el valor acotado
// que necesita cada contrato.

type EntornoRuntime = {
  DB?: D1Database;
  EFECTOS?: ProductorCola;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_EXPECTED_HOSTNAME?: string;
  APP_STAGE?: string;
  DB_STAGE?: string;
  DB_NAME?: string;
  FORMULARIOS_DEMO?: string;
  FORMULARIOS_PRUEBA_LOCAL?: string;
  CRON_SECRET?: string;
  REVALIDATE_SECRET?: string;
  SMTP2GO_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_CHAT_ID?: string;
  ALERTA_CLOUDFLARE_SECRETO?: string;
};

const runtime = env as unknown as EntornoRuntime;

/** Lectura de staging separada; esto no habilita acceso, captcha ni efectos. */
export const bindingDb = (): D1Database | null =>
  resolverDb(runtime);

// Local y producción encolan; staging nunca. Sin binding no se pierde nada: la
// intención queda en el outbox y la levanta el barrido.
export const bindingCola = (): ProductorCola | undefined =>
  runtime.APP_STAGE === 'local' || runtime.APP_STAGE === 'produccion' ? runtime.EFECTOS : undefined;

export const secretoCron = (): string | undefined => runtime.CRON_SECRET;

/**
 * Secreto del destino webhook de Cloudflare Notifications («Telegram CAU»).
 * Cloudflare lo manda en `cf-webhook-auth` y sin él el endpoint no reenvía
 * nada: es público y cualquiera podría llenar el chat de Telegram.
 */
export const secretoAlertaCloudflare = (): string | undefined => runtime.ALERTA_CLOUDFLARE_SECRETO;

export const secretoRevalidar = (): string | undefined => runtime.REVALIDATE_SECRET;

/** Sólo el par token/chat; jamás el entorno completo. */
export const configTelegram = (): ConfigTelegram | undefined => {
  const token = runtime.TELEGRAM_BOT_TOKEN;
  const chatId = runtime.TELEGRAM_CHAT_ID;
  return token && chatId ? { token, chatId } : undefined;
};

export const buscarRed: Buscar = (url, init) => fetch(url, init);

/** El transporte de SMTP2GO sólo existe si hay clave; nunca se interpola. */
export const transporteMail = () => runtime.SMTP2GO_API_KEY
  ? crearTransporteMail({ smtp: { clave: runtime.SMTP2GO_API_KEY } }, buscarRed)
  : undefined;

export const telegramCron = (texto: string, timeoutMs?: number) =>
  enviarTelegramSeguro(configTelegram(), buscarRed, texto, timeoutMs);

export const telegramAlerta = (texto: string) =>
  enviarTelegramDirecto(configTelegram(), buscarRed, texto);

/**
 * Configuración de la API de formularios. Falla cerrado: sin
 * `TURNSTILE_SECRET_KEY` no se acepta ningún envío (503) y no se verifica el
 * captcha. La verificación usa `fetch` real sólo acá; las pruebas inyectan un
 * doble y nunca salen a la red.
 *
 * El modo demo y el token de prueba local exigen `APP_STAGE === 'local'`: en un
 * entorno publicado la bandera no habilita nada, igual que `NODE_ENV` en el sitio
 * vigente.
 */
export const entornoFormularios = (): EntornoFormularios => {
  const secreto = runtime.TURNSTILE_SECRET_KEY;
  const local = runtime.APP_STAGE === 'local';
  return {
    cola: bindingCola(),
    captchaConfigurado: Boolean(secreto),
    pruebaLocal: local && runtime.FORMULARIOS_PRUEBA_LOCAL === '1',
    demo: local && runtime.FORMULARIOS_DEMO === '1',
    verificarCaptcha: (token, ip) => secreto
      ? verificarTurnstile(token, ip, {
        secreto,
        hostnamesPermitidos: runtime.TURNSTILE_EXPECTED_HOSTNAME,
        buscar: (url, init) => fetch(url, init),
      })
      : Promise.resolve(false),
  };
};
