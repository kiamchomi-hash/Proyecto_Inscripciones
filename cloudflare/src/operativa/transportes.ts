import { armarMailPrecio, REMITENTE_MAIL } from '../../../components/formularios/mail-precio.ts';
import type { PrecioDelMail } from '../../../components/formularios/mail-precio.ts';
import {
  buildConsultaMessage, buildFaqMessage, buildSolicitudClaseMessage,
} from './mensajes.ts';
import {
  ErrorAmbiguo, ErrorRechazo,
  type PedidoLeadSede, type PedidoMail, type PedidoTelegram,
  type ResultadoTransporte, type Transportes,
} from './consumidores.ts';

// Adaptadores de los proveedores externos. Este módulo no lee variables de
// entorno ni llama a `fetch` por su cuenta: recibe la configuración y el
// `buscar` desde el Worker. Las pruebas usan un `buscar` simulado, así que
// ningún test sale a la red ni manda un mail o un aviso real.
//
// El correo sale por el binding `send_email` de Cloudflare. SMTP2GO se retiró el
// 29/10/2026: cómo se activó el binding, con qué orden y qué pasa con el SPF,
// está en `docs/correo-cloudflare.md`.
//
// Regla de ambigüedad: una respuesta HTTP no-2xx es un rechazo conocido y se
// puede reintentar; una excepción de red o un timeout después de enviar no
// permiten saber si el proveedor aceptó, así que se marca `ambiguo` y no se
// reintenta solo. Es la misma regla de la reserva de 168 h y del diseño.

export const TIMEOUT_TELEGRAM_MS = 8_000;
export const TIMEOUT_HUBSPOT_MS = 5_000;

/**
 * Lo mínimo del binding `send_email` de Cloudflare que necesita el adaptador.
 *
 * Se declara acá, estructural, y no importando el tipo generado: así el módulo
 * se prueba en Node sin el runtime del Worker, y `wrangler types` puede cambiar
 * sin tocar este archivo. La forma es la documentada para `env.EMAIL.send()`.
 */
export interface CorreoBinding {
  send(mensaje: {
    to: string;
    from: { email: string; name?: string };
    subject: string;
    html?: string;
    text?: string;
    headers?: Record<string, string>;
  }): Promise<{ messageId?: string }>;
}

export interface ConfigEnvios {
  telegram?: { token: string; chatId: string };
  /** Correo por el binding de Cloudflare: no hay clave que custodiar. */
  email?: CorreoBinding;
  /** La URL viaja en el pedido, armada desde `casas.ts`; acá sólo se habilita. */
  hubspot?: { habilitado: boolean };
}

export type Buscar = (url: string, init: RequestInit) => Promise<Response>;

/** Sólo el estado HTTP: el cuerpo del proveedor puede traer datos del lead. */
const codigoHttp = (respuesta: Response) => `http-${respuesta.status}`;

/**
 * Ejecuta el pedido y traduce el resultado. Un no-2xx es rechazo conocido; una
 * excepción (red, DNS, timeout) es ambigua porque el pedido pudo haber llegado.
 */
async function enviar(
  buscar: Buscar, url: string, init: RequestInit, timeoutMs: number,
): Promise<ResultadoTransporte> {
  let respuesta: Response;
  try {
    respuesta = await buscar(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    throw new ErrorAmbiguo(error instanceof Error ? error.name : 'red');
  }
  if (!respuesta.ok) throw new ErrorRechazo(codigoHttp(respuesta));
  return 'enviado';
}

/** El texto del aviso con los constructores vigentes; nunca se escribe acá. */
async function textoTelegram(db: D1Database, pedido: PedidoTelegram): Promise<{ texto: string; markdown: boolean }> {
  if (pedido.fuente === 'faq') {
    const fila = await db.prepare('SELECT * FROM faq_preguntas WHERE id = ?1')
      .bind(Number(pedido.id)).first<Record<string, unknown>>();
    if (!fila) throw new ErrorRechazo('fila-inexistente');
    return { texto: buildFaqMessage(fila), markdown: true };
  }
  if (pedido.fuente === 'clase') {
    const fila = await db.prepare('SELECT * FROM solicitudes_clase WHERE id = ?1')
      .bind(String(pedido.id)).first<Record<string, unknown>>();
    if (!fila) throw new ErrorRechazo('fila-inexistente');
    return { texto: buildSolicitudClaseMessage(fila), markdown: true };
  }
  const consulta = await db.prepare('SELECT * FROM consultas WHERE id = ?1')
    .bind(Number(pedido.id)).first<Record<string, unknown>>();
  if (!consulta) throw new ErrorRechazo('fila-inexistente');
  // Sin `precio-visto` ni el enriquecimiento del aviso de consulta: las dos
  // consultas del contrato vigente van a la base por el adaptador propio.
  return { texto: buildConsultaMessage(consulta), markdown: true };
}

/** Telegram: `sendMessage` con `parse_mode` Markdown, como la Edge Function. */
function transportarTelegram(
  db: D1Database, config: ConfigEnvios, buscar: Buscar,
): NonNullable<Transportes['telegram']> {
  return async (pedido: PedidoTelegram) => {
    if (!config.telegram?.token || !config.telegram.chatId) return 'sin-configurar';
    const { texto, markdown } = await textoTelegram(db, pedido);
    return enviar(buscar, `https://api.telegram.org/bot${config.telegram.token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.telegram.chatId,
        text: texto,
        ...(markdown ? { parse_mode: 'Markdown' } : {}),
      }),
    }, TIMEOUT_TELEGRAM_MS);
  };
}

/**
 * `'CAU Online <inscripciones@siglo21sur.com>'` → las dos partes que pide el
 * binding. Se parsea en vez de escribir la dirección dos veces: el remitente
 * sigue teniendo un solo dueño, `REMITENTE_MAIL`.
 */
export function remitenteEstructurado(remitente: string): { email: string; name?: string } {
  const partes = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(remitente);
  if (!partes) return { email: remitente.trim() };
  return partes[1] ? { email: partes[2].trim(), name: partes[1] } : { email: partes[2].trim() };
}

/** Código de error del binding (`E_SENDER_NOT_VERIFIED`, …), si lo trae. */
const codigoDeError = (error: unknown): string | null => {
  if (error === null || typeof error !== 'object') return null;
  const codigo = (error as { code?: unknown }).code;
  return typeof codigo === 'string' && codigo.length > 0 ? codigo : null;
};

/** El mail armado; la plantilla es la misma para los dos caminos de salida. */
function armarMailDelPrecio(pedido: PedidoMail, precio: PrecioDelMail) {
  // La misma plantilla del resumen transaccional; el newsletter sólo le suma
  // el pie con la baja y los encabezados de un clic (RFC 8058).
  return pedido.newsletter
    ? armarMailPrecio({
      carrera: pedido.carrera,
      precio,
      hoy: new Date(),
      tipo: 'newsletter',
      bajaUrl: pedido.newsletter.bajaUrl,
    })
    : armarMailPrecio({
      carrera: pedido.carrera,
      precio,
      hoy: new Date(),
    });
}

type MailArmado = { asunto: string; html: string; texto: string };

/**
 * Un mensaje al binding y su traducción de errores. El binding devuelve
 * `messageId` cuando aceptó y lanza un error con `code` cuando rechazó: un error
 * con código es un rechazo conocido (nada salió) y uno sin código es una falla
 * del runtime, que se trata como ambigua igual que una excepción de red en los
 * demás transportes.
 */
async function enviarPorBinding(
  binding: CorreoBinding, mensaje: Parameters<CorreoBinding['send']>[0],
): Promise<ResultadoTransporte> {
  try {
    await binding.send(mensaje);
  } catch (error) {
    const codigo = codigoDeError(error);
    if (codigo) throw new ErrorRechazo(codigo);
    throw new ErrorAmbiguo(error instanceof Error ? error.name : 'correo');
  }
  return 'enviado';
}

/** Correo del pedido, con la plantilla del precio y los encabezados del newsletter. */
function porBinding(
  binding: CorreoBinding, pedido: PedidoMail, mail: MailArmado,
): Promise<ResultadoTransporte> {
  return enviarPorBinding(binding, {
    to: pedido.para,
    from: remitenteEstructurado(REMITENTE_MAIL),
    subject: mail.asunto,
    html: mail.html,
    text: mail.texto,
    ...(pedido.newsletter
      ? { headers: Object.fromEntries(pedido.newsletter.encabezados.map(({ header, value }) => [header, value])) }
      : {}),
  });
}

/**
 * Correo fijo para `/api/correo-prueba`: mismo binding, mismo remitente y misma
 * traducción de errores que un envío real, sin carrera, precio ni plantilla.
 */
export function enviarCorreoDePrueba(
  binding: CorreoBinding, para: string,
): Promise<ResultadoTransporte> {
  return enviarPorBinding(binding, {
    to: para,
    from: remitenteEstructurado(REMITENTE_MAIL),
    subject: 'Prueba de correo del Worker del CAU',
    text: 'Correo de prueba del envío saliente del sitio. Sale del Worker de producción por el binding de Cloudflare.',
    html: '<p>Correo de prueba del envío saliente del sitio. Sale del Worker de producción por el binding de Cloudflare.</p>',
  });
}

/**
 * El correo sale por el binding de Cloudflare. Sin binding devuelve
 * `sin-configurar`: la intención queda pendiente en el outbox y la levanta un
 * barrido posterior.
 */
function transportarMail(config: ConfigEnvios): NonNullable<Transportes['mail']> {
  return async (pedido: PedidoMail) => {
    const binding = config.email;
    if (!binding) return 'sin-configurar';
    if (pedido.precio.estado !== 'vigente') throw new ErrorRechazo('sin-precio-vigente');
    return porBinding(binding, pedido, armarMailDelPrecio(pedido, pedido.precio.precio));
  };
}

/** HubSpot: la URL y el cuerpo ya vienen armados por `pedidoLeadSede`. */
function transportarHubspot(config: ConfigEnvios, buscar: Buscar): NonNullable<Transportes['hubspot']> {
  return async (pedido: PedidoLeadSede) => {
    if (!config.hubspot?.habilitado) return 'sin-configurar';
    return enviar(buscar, pedido.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pedido.body),
    }, TIMEOUT_HUBSPOT_MS);
  };
}

/**
 * Los tres transportes con la configuración y el `buscar` inyectados. Sin la
 * sección correspondiente devuelven `sin-configurar`: la intención queda
 * pendiente en el outbox y la levanta un barrido posterior.
 */
export function crearTransportes(config: ConfigEnvios, buscar: Buscar, db: D1Database): Transportes {
  return {
    telegram: transportarTelegram(db, config, buscar),
    mail: transportarMail(config),
    hubspot: transportarHubspot(config, buscar),
  };
}

/** El mismo transporte de mail, sin exigir una base para los otros canales. */
export function crearTransporteMail(
  config: ConfigEnvios, _buscar: Buscar,
): NonNullable<Transportes['mail']> {
  return transportarMail(config);
}
