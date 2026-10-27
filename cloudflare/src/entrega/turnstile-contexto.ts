import { createContext } from 'react';

/**
 * Configuración pública de Turnstile que el servidor conoce al renderizar.
 * Va por contexto y no por props de cada formulario porque los componentes del
 * sitio (`formulario-lead.tsx`, `ver-precio-teclab.tsx`, …) instancian el widget
 * sin conocer la configuración: la isla la recibe una sola vez en `PaginaHome`.
 *
 * Con esto el HTML del servidor ya trae el marcador y el hueco de 71 px cuando
 * hay site key, igual que el sitio en Next; y no trae nada cuando falta, que es
 * el fallo cerrado.
 */
export type ConfigTurnstile = {
  /** Site key pública, o `null` si el runtime no la tiene. */
  sitio: string | null;
  /** `APP_STAGE=local` + `FORMULARIOS_DEMO=1`: no se toca Cloudflare. */
  demo: boolean;
};

export const ContextoTurnstile = createContext<ConfigTurnstile | null>(null);
