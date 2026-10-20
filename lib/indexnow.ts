// IndexNow: avisarle a Bing (y a los demás buscadores del protocolo) que una URL
// cambió, en vez de esperar a que la vuelva a rastrear.
//
// Importa porque ChatGPT busca sobre el índice de Bing: una ficha que Bing no
// tiene, o tiene vieja, no aparece en sus respuestas aunque en Google esté bien.
//
// La clave no es un secreto: el protocolo pide publicarla en
// `public/<clave>.txt`, y así el buscador comprueba que el aviso viene del dueño
// del dominio. Si se cambia, hay que renombrar ese archivo en el mismo commit.
//
// No importa nada a propósito: `herramientas/indexnow.mjs` lo carga con Node
// pelado, igual que smoke.mjs hace con lib/vigilancia-esperado.ts.

export const INDEXNOW_KEY = '797fb61c1ace165de4ba56d8d37ad9c5';
export const INDEXNOW_HOST = 'www.siglo21sur.com';
const BASE = `https://${INDEXNOW_HOST}`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const TIMEOUT_MS = 5000;

/**
 * URLs públicas de las rutas que rehizo /api/revalidar.
 *
 * Quedan afuera las APIs, los patrones ('/carreras/[slug]', que no son una URL)
 * y el 'layout' de la escotilla 'todo': avisar el sitio entero va por
 * `npm run indexnow`, que lee el sitemap.
 */
export function urlsParaIndexNow(rutas: ReadonlyArray<readonly [string, string?]>): string[] {
  const urls = new Set<string>();
  for (const [ruta, tipo] of rutas) {
    if (tipo === 'layout' || !ruta.startsWith('/') || ruta.startsWith('/api/') || ruta.includes('[')) continue;
    urls.add(`${BASE}${ruta}`);
  }
  return [...urls];
}

/**
 * Manda las URLs en un solo pedido. Devuelve el código HTTP (200 o 202 es que
 * lo tomó) o `null` si no salió. Nunca lanza: un IndexNow caído no puede tumbar
 * la revalidación, que es lo que importa.
 */
export async function avisarIndexNow(urls: string[], hacerFetch: typeof fetch = fetch): Promise<number | null> {
  if (urls.length === 0) return null;
  try {
    const respuesta = await hacerFetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: INDEXNOW_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `${BASE}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return respuesta.status;
  } catch (error) {
    console.error('[indexnow] No se pudo avisar', { urls: urls.length, error: String(error) });
    return null;
  }
}
