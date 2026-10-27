import { createContext, useContext } from 'react';

// Reemplazo mínimo de `next/navigation`. Astro no tiene router de cliente: la
// ruta se conoce una sola vez, cuando se arma la página en el servidor.
// Las islas la reciben por contexto (`ProveedorRuta`), así el HTML del servidor
// y el del cliente coinciden; sin proveedor cae en `window.location` y, durante
// el render del servidor, en `/`.
//
// Límite conocido: no hay navegación sin recarga. Cuando se migren las páginas
// enlazadas habrá que volver a decidir si se usa View Transitions o un router
// propio; este shim no lo resuelve.

export const RutaContext = createContext<string | null>(null);

export function usePathname(): string {
  const ruta = useContext(RutaContext);
  if (ruta !== null) return ruta;
  if (typeof window !== 'undefined') return window.location.pathname;
  return '/';
}
