/**
 * Visitantes de un día según Cloudflare Web Analytics (RUM).
 *
 * Se consulta por GraphQL porque no hay endpoint REST para esto. La ventana es
 * obligatoria: sin `date_geq`/`date_leq` la API rechaza la consulta por rango
 * demasiado amplio. El sitio sólo acumula datos cuando el dominio pasa por
 * Cloudflare, así que antes del corte la respuesta es «sin datos» y no un cero.
 */

export interface LecturaAnalytics {
  token: string;
  cuenta: string;
  siteTag: string;
  buscar?: (url: string, init: RequestInit) => Promise<Response>;
}

export const URL_GRAPHQL = 'https://api.cloudflare.com/client/v4/graphql';

const CONSULTA = `query Visitantes($cuenta: String!, $sitio: String!, $desde: Date!, $hasta: Date!) {
  viewer { accounts(filter: { accountTag: $cuenta }) {
    rumPageloadEventsAdaptiveGroups(limit: 1, filter: { siteTag: $sitio, date_geq: $desde, date_leq: $hasta }) {
      count
      sum { visits }
      dimensions { date }
    }
  } }
}`;

/**
 * `visits` es la sesión que cuenta Cloudflare Web Analytics. Devuelve `null`
 * cuando no hay datos o la consulta falla: nunca inventa un cero.
 */
export async function usuariosActivos(
  fecha: string,
  { token, cuenta, siteTag, buscar = (url, init) => fetch(url, init) }: LecturaAnalytics,
): Promise<number | null> {
  if (!token || !cuenta || !siteTag) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;

  let respuesta: Response;
  try {
    respuesta = await buscar(URL_GRAPHQL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: CONSULTA,
        variables: { cuenta, sitio: siteTag, desde: fecha, hasta: fecha },
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return null;
  }
  if (!respuesta.ok) return null;

  const cuerpo = await respuesta.json().catch(() => null) as {
    data?: { viewer?: { accounts?: { rumPageloadEventsAdaptiveGroups?: { sum?: { visits?: number } }[] }[] } };
  } | null;
  const grupos = cuerpo?.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups;
  if (!Array.isArray(grupos) || grupos.length === 0) return null;
  const visitas = grupos[0]?.sum?.visits;
  return typeof visitas === 'number' && visitas >= 0 ? visitas : null;
}
