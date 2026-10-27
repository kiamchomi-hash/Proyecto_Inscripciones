import type { ConfigTurnstile } from './turnstile-contexto';

/**
 * Traduce el entorno del Worker a la configuración pública de Turnstile.
 * Pura y sin acceso a red para poder probarla: el `<meta>` del `<head>` y el
 * contexto de la isla salen de acá, así las dos puntas dicen lo mismo.
 *
 * - `PUBLIC_TURNSTILE_SITE_KEY`: pública, se provee en runtime y no está en
 *   `wrangler.json` a propósito. Sin ella no se carga el script ni se entrega
 *   token (fallo cerrado).
 * - `FORMULARIOS_DEMO`: sólo vale junto con `APP_STAGE=local`, igual que el
 *   gate de la API. En producción la bandera no existe.
 */
export function configTurnstile(entorno: Record<string, unknown>): ConfigTurnstile {
  const crudo = entorno.PUBLIC_TURNSTILE_SITE_KEY;
  const sitio = typeof crudo === 'string' && crudo.trim() ? crudo.trim() : null;
  const demo = entorno.APP_STAGE === 'local' && entorno.FORMULARIOS_DEMO === '1';
  return { sitio, demo };
}
