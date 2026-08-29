// Acceso a Search Console, compartido por el informe SEO y el tablero de leads.
//
// Firma un JWT con la service account de ~/.gsc/service_account.json -la misma
// credencial que usa el MCP `gsc`-. La API de Search Console es REST plana, asi
// que no hace falta el SDK de Google ni ninguna dependencia nueva.
//
// Lanza en vez de cortar el proceso, que es la unica diferencia con la version
// que vivia adentro de seo-semanal.mjs: el informe SEO sin Search Console no
// tiene nada que decir y sale con codigo 2, pero el tablero de leads muestra
// las otras dos fuentes igual. Quien llama decide que hacer con la falta.

import { createSign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const CREDENCIAL = path.join(os.homedir(), '.gsc', 'service_account.json');

export const SIN_CREDENCIAL =
  `No esta la credencial de Search Console: ${CREDENCIAL}\n`
  + 'Traerla con: node herramientas/entorno.mjs importar --desde=<paquete>';

/** Token de acceso de la service account. Vale una hora, no se cachea en disco. */
export async function acceso() {
  if (!existsSync(CREDENCIAL)) throw new Error(SIN_CREDENCIAL);

  const cred = JSON.parse(readFileSync(CREDENCIAL, 'utf8'));
  const ahora = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');

  const sinFirmar = [
    b64({ alg: 'RS256', typ: 'JWT' }),
    b64({
      iss: cred.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: ahora,
      exp: ahora + 3600,
    }),
  ].join('.');

  const firma = createSign('RSA-SHA256').update(sinFirmar).sign(cred.private_key, 'base64url');

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${sinFirmar}.${firma}`,
    }),
  });

  if (!r.ok) throw new Error(`No se pudo autenticar contra Google (${r.status}): ${await r.text()}`);
  return (await r.json()).access_token;
}

/**
 * Una consulta a searchAnalytics. `dataState: 'final'` deja afuera los datos
 * que Google todavia esta consolidando: son los que despues cambian y hacen
 * parecer que el trafico cayo.
 */
export async function consultar(token, sitio, cuerpo) {
  const r = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(sitio)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cuerpo, dataState: 'final' }),
    },
  );
  if (!r.ok) throw new Error(`searchAnalytics ${r.status}: ${await r.text()}`);
  return (await r.json()).rows ?? [];
}
