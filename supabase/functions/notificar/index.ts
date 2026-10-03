import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// Los textos viven aparte para que corran bajo Node en tests/avisos.test.mjs:
// aca adentro no se puede, porque el modulo lee Deno.env al cargarse.
import {
  buildConsultaMessage,
  buildFaqMessage,
  buildSolicitudClaseMessage,
} from "./mensajes.ts";
import { agregarEnlace } from "./enlace.ts";

// Avisos de los tres formularios publicos. Telegram es el unico canal desde el
// 01/08/2026: el mail salia del dominio compartido de pruebas de Resend, caia en
// spam y nadie lo leia. Si algun dia vuelve a hacer falta, el envio por Resend
// esta en el historial de git (hasta el commit de esa fecha) junto con la
// plantilla HTML con la marca del CAU.
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")!;

// Para el enlace de inscripción de las preinscripciones de Teclab (ver
// enlace.ts). SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY las inyecta Supabase en
// toda Edge Function; SITIO_URL es opcional y sólo cambia el dominio del enlace.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SITIO_URL = Deno.env.get("SITIO_URL") || "https://www.siglo21sur.com";

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: Record<string, unknown>;
  schema: string;
}

function secureEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

/* ── Sender ── */
async function sendTelegram(text: string) {
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) console.error("Telegram error:", await res.text());
  return res.ok;
}

/* ── Handler ── */
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
    const payload: WebhookPayload = await req.json();
    const { table, record } = payload;
    if (payload.type !== "INSERT" || payload.schema !== "public" || !record || typeof record !== "object") {
      return new Response("Invalid webhook payload", { status: 400 });
    }

    let texto: string;

    switch (table) {
      case "consultas":
        // Si el enlace no se puede crear, el aviso sale igual, sin él.
        texto = await agregarEnlace(buildConsultaMessage(record), record, {
          supabaseUrl: SUPABASE_URL,
          serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
          sitioUrl: SITIO_URL,
        });
        break;
      case "solicitudes_clase":
        texto = buildSolicitudClaseMessage(record);
        break;
      case "faq_preguntas":
        texto = buildFaqMessage(record);
        break;
      default:
        return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: { "Content-Type": "application/json" } });
    }

    // Con un solo canal, un envio fallado tiene que verse: el INSERT responde
    // 201 igual -net.http_post encola sin bloquear- y lo unico que queda para
    // darse cuenta es el status que guarda net._http_response. Devolver ok:true
    // ahi seria repetir el corte silencioso del 20 al 27/07/2026.
    const ok = await sendTelegram(texto);
    return new Response(JSON.stringify({ ok, telegram: ok }), {
      status: ok ? 200 : 502,
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
