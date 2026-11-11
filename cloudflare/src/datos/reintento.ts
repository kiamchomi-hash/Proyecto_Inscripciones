// Margen de reintentos para las lecturas de D1.
//
// El fallo medido fue un 401 de la API de Cloudflare cuando wrangler renueva
// el token OAuth: la primera llamada vuelve `401 Unauthorized` y la
// siguiente, con el mismo token ya guardado, responde 200. Las lecturas de la
// base no deberían fallar por eso —el binding no renueva tokens—, pero el
// sitemap ya lo contempla y las dos rutas tienen que comportarse igual.

const REINTENTOS = 2;

export async function consultarConReintentos<T>(consulta: () => Promise<T>): Promise<T> {
  let ultimoError: unknown;
  for (let intento = 0; intento <= REINTENTOS; intento++) {
    try {
      return await consulta();
    } catch (error) {
      ultimoError = error;
      if (intento < REINTENTOS) {
        await new Promise(resolver => setTimeout(resolver, 250 * (intento + 1)));
      }
    }
  }
  throw ultimoError;
}
