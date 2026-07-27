import 'server-only';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Normaliza para comparar: minúsculas, sin protocolo, sin path ni puerto y sin
// el "www." inicial, así el apex y el subdominio www cuentan como el mismo sitio.
const normalizeHostname = (host: string) =>
  host.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[/:].*$/, '')
    .replace(/^www\./, '');

function allowedHostnames() {
  return (process.env.TURNSTILE_EXPECTED_HOSTNAME ?? '')
    .split(',')
    .map(normalizeHostname)
    .filter(Boolean);
}

export async function verifyTurnstile(token: string, remoteIp?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new Error('Turnstile no configurado');

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set('remoteip', remoteIp);

  const response = await fetch(VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    console.error('[turnstile] siteverify respondió', response.status);
    return false;
  }

  const result = await response.json() as {
    success?: boolean;
    hostname?: string;
    'error-codes'?: string[];
  };

  if (result.success !== true) {
    console.error('[turnstile] Token rechazado', {
      codes: result['error-codes'] ?? [],
    });
    return false;
  }

  const allowed = allowedHostnames();
  if (allowed.length && !allowed.includes(normalizeHostname(result.hostname ?? ''))) {
    console.error('[turnstile] Hostname inesperado', {
      recibido: result.hostname,
      esperados: allowed,
    });
    return false;
  }

  return true;
}
