import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")!;
const EMAIL_TO = "kiamchomi@gmail.com";

interface WebhookPayload {
  type: "INSERT";
  table: string;
  record: Record<string, unknown>;
  schema: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function esc(val: unknown): string {
  const s = String(val ?? "");
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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

/* ── Email template with CAU brand ── */
function emailLayout(title: string, icon: string, rows: [string, string][]): string {
  const tableRows = rows.map(([ label, value ], i) => {
    const bg = i % 2 === 0 ? "#0f2825" : "#162f2e";
    return `<tr style="background:${bg};"><td style="padding:10px 16px;color:#48b3a4;font-weight:700;font-size:13px;white-space:nowrap;border-bottom:1px solid rgba(0,199,177,0.1);">${esc(label)}</td><td style="padding:10px 16px;color:#e0e0e0;font-size:14px;border-bottom:1px solid rgba(0,199,177,0.1);">${esc(value)}</td></tr>`;
  }).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#041211;font-family:'Inter',Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#041211;padding:24px 16px;">
<tr><td align="center">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,#012a1f,#0d3040);border-radius:12px 12px 0 0;padding:24px 28px;border-bottom:2px solid #00c7b1;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="font-size:28px;line-height:1;padding-right:14px;vertical-align:middle;" width="42">${icon}</td>
        <td style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;text-transform:uppercase;">${esc(title)}</td>
      </tr></table>
    </td></tr>
    <!-- Body -->
    <tr><td style="background:#1c2f31;padding:0;border-left:1px solid rgba(0,199,177,0.15);border-right:1px solid rgba(0,199,177,0.15);">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${tableRows}
      </table>
    </td></tr>
    <!-- Footer -->
    <tr><td style="background:#0a1e1c;border-radius:0 0 12px 12px;padding:16px 28px;border-top:1px solid rgba(0,199,177,0.1);border-left:1px solid rgba(0,199,177,0.15);border-right:1px solid rgba(0,199,177,0.15);border-bottom:1px solid rgba(0,199,177,0.15);">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="color:#7ca19b;font-size:11px;">CAU Villa Lugano &mdash; Universidad Siglo 21</td>
        <td align="right"><span style="display:inline-block;background:linear-gradient(135deg,#005587,#058c70);color:#ffffff;font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:5px 14px;border-radius:6px;text-decoration:none;">siglo21sur.com</span></td>
      </tr></table>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}

/* ── Message builders ── */
function buildConsultaMessage(r: Record<string, unknown>) {
  const fecha = r.created_at ? formatDate(r.created_at as string) : "\u2014";
  const nombre = `${r.nombre || "\u2014"} ${r.apellido || ""}`.trim();
  const subject = `\ud83d\udcda Nueva consulta de carrera \u2014 ${r.nombre || "Sin nombre"}`;

  const telegram = [
    `\ud83d\udcda *Nueva consulta de carrera*`,
    ``,
    `\ud83d\udc64 *Nombre:* ${nombre}`,
    `\ud83c\udf93 *Carrera:* ${r.carrera || "No especificada"}`,
    `\ud83d\udccb *Tipo:* ${r.tipo || "\u2014"}`,
    `\ud83d\udce7 *Email:* ${r.email || "\u2014"}`,
    `\ud83d\udcf1 *Tel\u00e9fono:* ${r.telefono || "\u2014"}`,
    `\ud83d\udccd *Localidad:* ${r.localidad || "\u2014"}`,
    `\ud83d\udd04 *Equivalencias:* ${r.equivalencias ? "S\u00ed" : "No"}`,
    `\ud83d\udd50 *Fecha:* ${fecha}`,
  ].join("\n");

  const html = emailLayout("Nueva consulta de carrera", "\ud83d\udcda", [
    ["Nombre", nombre],
    ["Carrera", String(r.carrera || "No especificada")],
    ["Tipo", String(r.tipo || "\u2014")],
    ["Email", String(r.email || "\u2014")],
    ["Tel\u00e9fono", String(r.telefono || "\u2014")],
    ["Localidad", String(r.localidad || "\u2014")],
    ["Equivalencias", r.equivalencias ? "S\u00ed" : "No"],
    ["Fecha", fecha],
  ]);

  return { subject, telegram, html };
}

function buildSolicitudClaseMessage(r: Record<string, unknown>) {
  const fecha = r.created_at ? formatDate(r.created_at as string) : "\u2014";
  const dias = Array.isArray(r.dias) ? (r.dias as string[]).join(", ") : "\u2014";
  const horarios = Array.isArray(r.horarios) ? (r.horarios as string[]).join(", ") : "\u2014";
  const bloqueo = r.bloqueo_semanal ? "\u2705 S\u00ed \u2014 Reserva semanal fija" : "\u274c No";
  const subject = `\ud83d\udcd6 Nueva solicitud de clase \u2014 ${r.nombre || "Sin nombre"}${r.bloqueo_semanal ? " \ud83d\udd01" : ""}`;

  const telegram = [
    `\ud83d\udcd6 *Nueva solicitud de clase de apoyo*`,
    ``,
    `\ud83d\udc64 *Nombre:* ${r.nombre || "\u2014"}`,
    `\ud83d\udcf1 *Tel\u00e9fono:* ${r.telefono || "\u2014"}`,
    `\ud83d\udcc5 *D\u00edas:* ${dias}`,
    `\u23f0 *Horarios:* ${horarios}`,
    `\ud83d\udd01 *Reserva semanal:* ${bloqueo}`,
    `\ud83d\udd50 *Fecha:* ${fecha}`,
  ].join("\n");

  const html = emailLayout("Solicitud de clase de apoyo", "\ud83d\udcd6", [
    ["Nombre", String(r.nombre || "\u2014")],
    ["Tel\u00e9fono", String(r.telefono || "\u2014")],
    ["D\u00edas", dias],
    ["Horarios", horarios],
    ["Reserva semanal", bloqueo],
    ["Fecha", fecha],
  ]);

  return { subject, telegram, html };
}

function buildFaqMessage(r: Record<string, unknown>) {
  const fecha = r.created_at ? formatDate(r.created_at as string) : "\u2014";
  const subject = `\u2753 Nueva pregunta FAQ \u2014 ${((r.titulo as string) || "").slice(0, 50) || "Sin t\u00edtulo"}`;

  const lines = [
    `\u2753 *Nueva pregunta en FAQ*`,
    ``,
    `\ud83d\udcdd *T\u00edtulo:* ${r.titulo || "\u2014"}`,
    `\ud83d\udcac *Descripci\u00f3n:* ${r.descripcion || "\u2014"}`,
    `\ud83d\udd12 *Modo:* ${r.modo || "\u2014"}`,
    `\ud83d\udce7 *Contacto:* ${r.contacto || "\u2014"}`,
    r.nombre_contacto ? `\ud83d\udc64 *Nombre:* ${r.nombre_contacto}` : null,
    `\ud83d\udd50 *Fecha:* ${fecha}`,
  ].filter(Boolean);
  const telegram = lines.join("\n");

  const rows: [string, string][] = [
    ["T\u00edtulo", String(r.titulo || "\u2014")],
    ["Descripci\u00f3n", String(r.descripcion || "\u2014")],
    ["Modo", String(r.modo || "\u2014")],
    ["Contacto", String(r.contacto || "\u2014")],
  ];
  if (r.nombre_contacto) rows.push(["Nombre", String(r.nombre_contacto)]);
  rows.push(["Fecha", fecha]);

  const html = emailLayout("Nueva pregunta en FAQ", "\u2753", rows);
  return { subject, telegram, html };
}

/* ── Senders ── */
async function sendEmail(subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({ from: "CAU Villa Lugano <onboarding@resend.dev>", to: [EMAIL_TO], subject, html }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) console.error("Resend error:", await res.text());
  return res.ok;
}

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

    let message: { subject: string; telegram: string; html: string };

    switch (table) {
      case "consultas":
        message = buildConsultaMessage(record);
        break;
      case "solicitudes_clase":
        message = buildSolicitudClaseMessage(record);
        break;
      case "faq_preguntas":
        message = buildFaqMessage(record);
        break;
      default:
        return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: { "Content-Type": "application/json" } });
    }

    const [emailOk, telegramOk] = await Promise.all([
      sendEmail(message.subject, message.html),
      sendTelegram(message.telegram),
    ]);

    return new Response(JSON.stringify({ ok: true, email: emailOk, telegram: telegramOk }), {
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
