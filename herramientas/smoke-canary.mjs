import { setTimeout as dormir } from 'node:timers/promises';

// Cloudflare puede ignorar el override hasta que el deployment llegue al
// borde. Sólo un 200 identificable de otra versión justifica esperar.
export async function esperarPortadaCandidata(version, pedir, {
  intentos = 8, pausaMs = 4000, esperar = dormir,
} = {}) {
  let anterior;
  for (let intento = 1; intento <= intentos; intento++) {
    const { status, crudo } = await pedir();
    if (status !== 200) throw new Error(`Portada del canary: HTTP ${status}.`);
    const referencias = [...crudo.toString('utf8').matchAll(
      /\/__assets\/([a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12})\/[^"'<>\s]+/gi,
    )];
    const versiones = new Set(referencias.map(([, id]) => id.toLowerCase()));
    if (!versiones.size) throw new Error('Portada del canary sin referencias versionadas.');
    if (versiones.size !== 1) throw new Error('Portada del canary con referencias de más de una versión.');
    if (versiones.has(version.toLowerCase())) return { asset: referencias[0][0], intentos: intento };
    [anterior] = versiones;
    if (intento < intentos) await esperar(pausaMs);
  }
  throw new Error(`Override no confirmado tras ${intentos} pedidos: se esperaba ${version}; el borde sirvió ${anterior}.`);
}
