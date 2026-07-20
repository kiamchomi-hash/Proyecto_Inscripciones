import 'server-only';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

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

  if (!response.ok) return false;

  const result = await response.json() as {
    success?: boolean;
    hostname?: string;
  };
  const expectedHostname = process.env.TURNSTILE_EXPECTED_HOSTNAME;

  return result.success === true &&
    (!expectedHostname || result.hostname === expectedHostname);
}
