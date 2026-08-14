import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Avisos de los tres formularios publicos. Telegram es el unico canal desde el
// 01/08/2026: el mail salia del dominio compartido de pruebas de Resend, caia en
// spam y nadie lo leia. Si algun dia vuelve a hacer falta, el envio por Resend
// esta en el historial de git (hasta el commit de esa fecha) junto con la
// plantilla HTML con la marca del CAU.
const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")!;

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

function secureEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i];
  return diff === 0;
}

/* ── Message builders ── */
function buildConsultaMessage(r: Record<string, unknown>): string {
  const fecha = r.created_at ? formatDate(r.created_at as string) : "—";
  const nombre = `${r.nombre || "—"} ${r.apellido || ""}`.trim();

  // Los datos de preinscripción son opcionales y la mayoría de las consultas
  // llegan sin ninguno: se listan sólo cuando el lead completó alguno, para que
  // el aviso no sean diez renglones con un guion.
  const preinscripcion: Array<[string, unknown]> = [
    ["🪪 *DNI:*", r.dni],
    ["🎂 *Nacimiento:*", r.fecha_nacimiento],
    ["🌎 *Nacionalidad:*", r.nacionalidad],
    ["🏙️ *Localidad de nacimiento:*", r.localidad_nacimiento],
    ["🗺️ *País de residencia:*", r.pais_residencia],
    ["⚧ *Sexo:*", r.sexo],
    ["💍 *Estado civil:*", r.estado_civil],
    ["🏠 *Dirección:*", r.direccion],
    ["🏘️ *Barrio:*", r.barrio],
    ["📮 *Código postal:*", r.codigo_postal],
  ];
  const completados = preinscripcion.filter(([, valor]) => valor).map(([rotulo, valor]) => `${rotulo} ${valor}`);

  return [
    `📚 *Nueva consulta de carrera*`,
    ``,
    `👤 *Nombre:* ${nombre}`,
    `🎓 *Carrera:* ${r.carrera || "No especificada"}`,
    `📋 *Tipo:* ${r.tipo || "—"}`,
    `📧 *Email:* ${r.email || "—"}`,
    `📱 *Teléfono:* ${r.telefono || "—"}`,
    `📍 *Localidad:* ${r.localidad || "—"}`,
    `🔄 *Equivalencias:* ${r.equivalencias ? "Sí" : "No"}`,
    ...(completados.length ? [``, `📝 *Datos para la preinscripción*`, ...completados] : []),
    `🕐 *Fecha:* ${fecha}`,
  ].join("\n");
}

function buildSolicitudClaseMessage(r: Record<string, unknown>): string {
  const fecha = r.created_at ? formatDate(r.created_at as string) : "—";
  const dias = Array.isArray(r.dias) ? (r.dias as string[]).join(", ") : "—";
  const horarios = Array.isArray(r.horarios) ? (r.horarios as string[]).join(", ") : "—";
  const bloqueo = r.bloqueo_semanal ? "✅ Sí — Reserva semanal fija" : "❌ No";

  return [
    `📖 *Nueva solicitud de clase de apoyo*`,
    ``,
    `👤 *Nombre:* ${r.nombre || "—"}`,
    `📱 *Teléfono:* ${r.telefono || "—"}`,
    `📅 *Días:* ${dias}`,
    `⏰ *Horarios:* ${horarios}`,
    `🔁 *Reserva semanal:* ${bloqueo}`,
    `🕐 *Fecha:* ${fecha}`,
  ].join("\n");
}

function buildFaqMessage(r: Record<string, unknown>): string {
  const fecha = r.created_at ? formatDate(r.created_at as string) : "—";

  return [
    `❓ *Nueva pregunta en FAQ*`,
    ``,
    `📝 *Título:* ${r.titulo || "—"}`,
    `💬 *Descripción:* ${r.descripcion || "—"}`,
    `🔒 *Modo:* ${r.modo || "—"}`,
    `📧 *Contacto:* ${r.contacto || "—"}`,
    r.nombre_contacto ? `👤 *Nombre:* ${r.nombre_contacto}` : null,
    `🕐 *Fecha:* ${fecha}`,
  ].filter(Boolean).join("\n");
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
        texto = buildConsultaMessage(record);
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
