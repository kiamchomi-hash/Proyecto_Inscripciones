import { NextRequest, NextResponse } from 'next/server';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function POST(req: NextRequest) {
  const { token } = await req.json();

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ success: false, error: 'Token faltante' }, { status: 400 });
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('[Turnstile] TURNSTILE_SECRET_KEY no configurada');
    return NextResponse.json({ success: false, error: 'Error de configuración' }, { status: 500 });
  }

  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });

  const data = await res.json() as {
    success?: boolean;
    hostname?: string;
    action?: string;
    'error-codes'?: string[];
  };

  if (!data.success) {
    console.error('[Turnstile] Siteverify failed', {
      status: res.status,
      errorCodes: data['error-codes'] ?? [],
      hostname: data.hostname ?? null,
      action: data.action ?? null,
    });

    return NextResponse.json({ success: false, error: 'Verificación fallida' }, { status: 403 });
  }

  console.info('[Turnstile] Siteverify success', {
    hostname: data.hostname ?? null,
    action: data.action ?? null,
  });

  return NextResponse.json({ success: true });
}
