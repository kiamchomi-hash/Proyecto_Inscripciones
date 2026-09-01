import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")!;

const TOP_N = 10;

function secureEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

function fechaEnBuenosAires(offsetDias = 0): string {
  // en-CA da YYYY-MM-DD, que es el formato que espera PostgREST.
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
  if (offsetDias === 0) return hoy;
  // El corrimiento se hace sobre la fecha ya convertida a Buenos Aires, no sobre
  // el instante UTC: asi "ayer" es ayer aunque el cron corra a cualquier hora.
  const [y, m, d] = hoy.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + offsetDias);
  return base.toISOString().slice(0, 10);
}

// Permite reenviar un dia puntual: POST {"fecha":"2026-07-28"}. Sirve para
// recuperar un digest que no salio, sin tocar el cron.
async function fechaPedida(req: Request): Promise<string | null> {
  try {
    const body = await req.json();
    const f = body?.fecha;
    return typeof f === "string" && /^\d{4}-\d{2}-\d{2}$/.test(f) ? f : null;
  } catch {
    return null; // body vacio o no-JSON: se usa el default
  }
}

// Markdown de Telegram: los nombres de carrera traen paréntesis y guiones.
function escapeMarkdown(s: string): string {
  return s.replace(/([_*\[\]`])/g, "\\$1");
}

interface ClickRow {
  carrera: string;
  clicks: number;
}

async function fetchClicks(fecha: string, origen: "modal" | "directa" = "modal"): Promise<ClickRow[]> {
  const url = `${SUPABASE_URL}/rest/v1/career_clicks` +
    `?select=carrera,clicks&fecha=eq.${fecha}&origen=eq.${origen}&order=clicks.desc`;
  const res = await fetch(url, {
    headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`PostgREST ${res.status}: ${await res.text()}`);
  return await res.json() as ClickRow[];
}

function buildDigest(fecha: string, rows: ClickRow[]): string {
  const total = rows.reduce((sum, r) => sum + r.clicks, 0);
  const [y, m, d] = fecha.split("-");
  const encabezado = `📊 *Resumen del ${d}/${m}/${y}*`;

  if (!total) {
    return `${encabezado}\n\nSin aperturas de tarjetas ese día.`;
  }

  const top = rows.slice(0, TOP_N).map((r, i) => {
    const medalla = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    return `${medalla} ${escapeMarkdown(r.carrera)} — *${r.clicks}*`;
  }).join("\n");

  const resto = rows.length > TOP_N ? `\n\n_y ${rows.length - TOP_N} carreras más_` : "";
  return `${encabezado}\n\n👆 *${total}* aperturas sobre *${rows.length}* carreras\n\n${top}${resto}`;
}

function buildDirectDigest(fecha: string, rows: ClickRow[]): string {
  const total = rows.reduce((sum, r) => sum + r.clicks, 0);
  const [y, m, d] = fecha.split("-");
  const encabezado = `📊 *Aperturas directas del ${d}/${m}/${y}*`;
  const lista = rows.map((r, i) => `${i + 1}. ${escapeMarkdown(r.carrera)} — *${r.clicks}*`).join("\n");
  return `${encabezado}\n\n🔗 *${total}* aperturas sobre *${rows.length}* carreras\n\n${lista}`;
}

async function sendTelegram(text: string): Promise<boolean> {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) console.error("Telegram error:", await res.text());
  return res.ok;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (!WEBHOOK_SECRET) {
    console.error("WEBHOOK_SECRET no configurado");
    return new Response("Server misconfigured", { status: 500 });
  }
  const authorization = req.headers.get("authorization") || "";
  if (!secureEqual(authorization, `Bearer ${WEBHOOK_SECRET}`)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Por defecto informa el dia anterior completo. Antes informaba el dia en
    // curso y el cron corria a las 20:00, asi que todos los dias se perdian los
    // clicks de 20:00 a medianoche.
    const fecha = (await fechaPedida(req)) ?? fechaEnBuenosAires(-1);
    const [rows, directRows] = await Promise.all([
      fetchClicks(fecha),
      fetchClicks(fecha, "directa"),
    ]);
    const enviado = await sendTelegram(buildDigest(fecha, rows));
    const enviadoDirectas = directRows.length > 0
      ? await sendTelegram(buildDirectDigest(fecha, directRows))
      : true;

    return new Response(JSON.stringify({ ok: true, fecha, carreras: rows.length, directas: directRows.length, telegram: enviado && enviadoDirectas }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
