import 'server-only';

// Aviso por Telegram desde Next, con el bot y el chat de siempre
// (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`). Lo usan la vigilancia
// (`/api/vigilancia`) y el robot de Teclab (`/api/robot/autoinscripciones`).
// Texto plano, sin `parse_mode`: nada que escapar.
//
// Nunca lanza: devuelve cómo le fue, para que quien avisa lo registre o lo
// devuelva sin que un Telegram caído tumbe lo que estaba haciendo.

export async function enviarTelegram(texto: string, timeoutMs = 15000): Promise<string> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return 'sin configurar';

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: texto, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(timeoutMs),
    });
    return r.ok ? 'enviado' : `error HTTP ${r.status}`;
  } catch (e) {
    return `error ${e instanceof Error ? e.message : String(e)}`;
  }
}
