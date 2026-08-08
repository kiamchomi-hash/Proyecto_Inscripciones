import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Alertas del firewall de Vercel a Telegram. Sin esto, un ataque sólo se ve
// entrando al dashboard: la pestaña Firewall retiene poco (última hora / 24 h)
// y no hay API pública para el desglose de tráfico.
//
// Suscripta a firewall.attack (DDoS: >100.000 requests en 10 min),
// firewall.system-rule-anomaly y firewall.custom-rule-anomaly.
//
// Vercel firma el cuerpo crudo con HMAC-SHA1 y lo manda en x-vercel-signature.
// El secreto lo devuelve Vercel al crear el webhook, va en VERCEL_WEBHOOK_SECRET.
// Ojo: es distinto del WEBHOOK_SECRET que usa `notificar` para los triggers de
// Postgres — ese lo elegimos nosotros, éste lo elige Vercel.
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
const VERCEL_WEBHOOK_SECRET = Deno.env.get("VERCEL_WEBHOOK_SECRET")!;

const TITULOS: Record<string, string> = {
  "firewall.attack": "🚨 *Ataque detectado en el firewall*",
  "firewall.system-rule-anomaly": "⚠️ *Anomalía en una regla del sistema*",
  "firewall.custom-rule-anomaly": "⚠️ *Anomalía en una regla propia*",
  "test-webhook": "✅ *Prueba del webhook de Vercel*",
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Comparación en tiempo constante sobre los bytes de las dos firmas hex.
function secureEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

async function firmaEsperada(cuerpo: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(VERCEL_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(cuerpo));
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// El payload cambia según el evento y Vercel no lo documenta campo por campo,
// así que se toma lo que esté y el resto se manda crudo y recortado. Un aviso
// feo llega; uno que asume una forma que no vino, no.
function buildMessage(evento: Record<string, unknown>): string {
  const tipo = String(evento.type ?? "desconocido");
  const payload = (evento.payload ?? {}) as Record<string, unknown>;
  const proyecto = (payload.project ?? {}) as Record<string, unknown>;

  const lineas: (string | null)[] = [
    TITULOS[tipo] ?? `🔔 *Evento de firewall:* ${tipo}`,
    ``,
    `📦 *Proyecto:* ${proyecto.name ?? payload.projectId ?? "—"}`,
    evento.region ? `🌎 *Región:* ${evento.region}` : null,
    typeof evento.createdAt === "number" ? `🕐 *Fecha:* ${formatDate(evento.createdAt)}` : null,
  ];

  const resto = JSON.stringify(payload);
  if (resto.length > 2) {
    lineas.push(``, `\`\`\`\n${resto.slice(0, 1200)}\n\`\`\``);
  }
  lineas.push(``, `🔗 https://vercel.com/iuys-projects-18eed4e5/proyecto-inscripciones/firewall`);

  return lineas.filter((l) => l !== null).join("\n");
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
  if (!VERCEL_WEBHOOK_SECRET) {
    console.error("VERCEL_WEBHOOK_SECRET no configurado");
    return new Response("Server misconfigured", { status: 500 });
  }

  // Hay que leer el cuerpo crudo antes de parsearlo: la firma es sobre los bytes
  // exactos, y un JSON.stringify del objeto ya parseado no los reproduce.
  const cuerpo = await req.text();
  const firma = req.headers.get("x-vercel-signature") ?? "";
  if (!secureEqual(firma, await firmaEsperada(cuerpo))) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const evento = JSON.parse(cuerpo) as Record<string, unknown>;
    const ok = await sendTelegram(buildMessage(evento));
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
