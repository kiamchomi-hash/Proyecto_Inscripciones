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

function hoyEnBuenosAires(): string {
  // en-CA da YYYY-MM-DD, que es el formato que espera PostgREST.
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
}

// Markdown de Telegram: los nombres de carrera traen paréntesis y guiones.
function escapeMarkdown(s: string): string {
  return s.replace(/([_*\[\]`])/g, "\\$1");
}

interface ClickRow {
  carrera: string;
  clicks: number;
}

async function fetchClicks(fecha: string): Promise<ClickRow[]> {
  const url = `${SUPABASE_URL}/rest/v1/career_clicks` +
    `?select=carrera,clicks&fecha=eq.${fecha}&order=clicks.desc`;
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
    return `${encabezado}\n\nSin aperturas de tarjetas hoy.`;
  }

  const top = rows.slice(0, TOP_N).map((r, i) => {
    const medalla = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
    return `${medalla} ${escapeMarkdown(r.carrera)} — *${r.clicks}*`;
  }).join("\n");

  const resto = rows.length > TOP_N ? `\n\n_y ${rows.length - TOP_N} carreras más_` : "";
  return `${encabezado}\n\n👆 *${total}* aperturas sobre *${rows.length}* carreras\n\n${top}${resto}`;
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
    const fecha = hoyEnBuenosAires();
    const rows = await fetchClicks(fecha);
    const enviado = await sendTelegram(buildDigest(fecha, rows));

    return new Response(JSON.stringify({ ok: true, fecha, carreras: rows.length, telegram: enviado }), {
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
