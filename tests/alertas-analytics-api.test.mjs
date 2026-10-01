import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

test('el endpoint acepta sólo alertas conocidas, sanitiza sus campos y limita abuso', async t => {
  const anteriores = Object.fromEntries(['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'].map(k => [k, process.env[k]]));
  const fetchAnterior = globalThis.fetch;
  const logError = console.error;
  t.after(() => {
    globalThis.fetch = fetchAnterior;
    console.error = logError;
    for (const [k, valor] of Object.entries(anteriores)) {
      if (valor === undefined) delete process.env[k]; else process.env[k] = valor;
    }
  });
  console.error = () => {};
  process.env.TELEGRAM_BOT_TOKEN = 'token-prueba';
  process.env.TELEGRAM_CHAT_ID = 'chat-prueba';

  let permitido = true;
  const cuotas = [];
  const mensajes = [];
  globalThis.fetch = async (_url, opciones) => {
    mensajes.push(JSON.parse(opciones.body));
    return new Response(null, { status: 200 });
  };
  const { POST } = cargarTypescript('app/api/alertas-analytics/route.ts', {
    'next/server': { NextResponse: Response },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => ({
      rpc: async (_nombre, parametros) => {
        cuotas.push(parametros);
        return { data: permitido, error: null };
      },
    }) },
  });
  const enviarCrudo = cuerpo => POST(new Request('http://localhost/api/alertas-analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '203.0.113.8' },
    body: cuerpo,
  }));
  const enviar = cuerpo => enviarCrudo(JSON.stringify(cuerpo));

  assert.equal((await enviarCrudo('{')).status, 400);
  assert.equal((await enviar(null)).status, 400);
  assert.equal((await enviar([])).status, 400);
  assert.equal((await enviar({ evento: 'visita', datos: { origen: '/' } })).status, 400);
  assert.equal((await enviar({ evento: 'whatsapp', datos: [] })).status, 400);
  assert.equal(cuotas.length, 0, 'los sobres inválidos no consumen cuota');

  assert.equal((await enviar({ evento: 'whatsapp', datos: { origen: '/contacto\nDato privado: 123', telefono: '1144445555' } })).status, 200);
  assert.equal((await enviar({ evento: 'clase-whatsapp', datos: { materia: 'matematica\nchat-id: 1', nombre: 'Persona' } })).status, 200);
  assert.equal((await enviar({ evento: 'formulario-fallo', datos: { origen: 'contacto', motivo: 'servidor', email: 'persona@example.test' } })).status, 200);

  assert.deepEqual(mensajes.map(item => item.text), [
    'Clic móvil a WhatsApp\nPágina: /contacto Dato privado: 123',
    'Clic a WhatsApp de clases\nMateria: matematica chat-id: 1',
    'Fallo técnico del formulario de contacto\nOrigen: contacto\nTipo: servidor',
  ]);
  assert.equal(mensajes.some(item => /1144445555|Persona|persona@example\.test/.test(item.text)), false);
  assert.equal(cuotas[0].p_max_requests <= 6, true);
  assert.equal(cuotas[0].p_window_seconds, 600);

  permitido = false;
  assert.equal((await enviar({ evento: 'whatsapp', datos: { origen: '/' } })).status, 200);
  assert.equal(mensajes.length, 3, 'un evento sin cuota no manda Telegram');
});

test('el endpoint rechaza valores fuera de la allowlist del evento', async () => {
  const { POST } = cargarTypescript('app/api/alertas-analytics/route.ts', {
    'next/server': { NextResponse: Response },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => ({ rpc: async () => ({ data: true, error: null }) }) },
  });
  const enviar = datos => POST(new Request('http://localhost/api/alertas-analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evento: 'formulario-fallo', datos }),
  }));

  assert.equal((await enviar({ origen: 'contacto', motivo: 'captcha' })).status, 400);
  assert.equal((await enviar({ origen: 'contacto', motivo: 'validacion' })).status, 400);
  assert.equal((await enviar({ origen: 'otra-pagina', motivo: 'servidor' })).status, 400);
});
