export interface ConfigTelegram {
  token: string;
  chatId: string;
}

export type Buscar = (url: string, init: RequestInit) => Promise<Response>;

export const TIMEOUT_TELEGRAM_MS = 15_000;
const TIMEOUT_ALERTA_MS = 8_000;

export const configurado = (config: ConfigTelegram | undefined | null): config is ConfigTelegram =>
  Boolean(config?.token && config.chatId);

/**
 * Aviso de los crons: mismo texto plano que `lib/telegram.ts`, sin `parse_mode`
 * y sin lanzar. Devuelve el estado legible que consumen los handlers, nunca la
 * clave ni el chat.
 */
export async function enviarTelegramSeguro(
  config: ConfigTelegram | undefined | null,
  buscar: Buscar,
  texto: string,
  timeoutMs = TIMEOUT_TELEGRAM_MS,
): Promise<string> {
  if (!configurado(config)) return 'sin configurar';
  try {
    const respuesta = await buscar(`https://api.telegram.org/bot${config.token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: config.chatId, text: texto, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return respuesta.ok ? 'enviado' : `error HTTP ${respuesta.status}`;
  } catch (error) {
    // Sólo el tipo de error: ni token, ni chat, ni el texto del aviso.
    return `error ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Aviso de las alertas de analítica: el handler vigente devuelve `false` sin
 * configuración, `true` con un 2xx y deja que una excepción de red la trate el
 * `catch` del endpoint. Se conserva esa forma para no cambiar los códigos.
 */
export async function enviarTelegramDirecto(
  config: ConfigTelegram | undefined | null,
  buscar: Buscar,
  texto: string,
  timeoutMs = TIMEOUT_ALERTA_MS,
): Promise<boolean> {
  if (!configurado(config)) return false;
  const respuesta = await buscar(`https://api.telegram.org/bot${config.token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: config.chatId, text: texto, disable_web_page_preview: true }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  return respuesta.ok;
}
