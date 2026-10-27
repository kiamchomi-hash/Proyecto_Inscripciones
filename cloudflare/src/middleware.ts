import { defineMiddleware } from 'astro:middleware';
import { aplicarCabeceras } from './entrega/cabeceras.ts';
import {
  buscarRedireccion, redireccionDeHost, ubicacionRedireccion,
} from './entrega/redirects.ts';

// Primero los redirects (host, después ruta, como el borde de producción) y
// después las cabeceras de entrega. Los redirects de `next.config.ts` no
// llevan cabeceras de seguridad: el navegador sigue el salto, no renderiza.
export const onRequest = defineMiddleware(async (contexto, siguiente) => {
  const pedida = new URL(contexto.request.url);

  const porHost = redireccionDeHost(pedida.host, pedida.pathname);
  if (porHost) {
    return new Response(null, {
      status: porHost.estado,
      headers: { Location: ubicacionRedireccion(porHost, pedida.search) },
    });
  }

  const redireccion = buscarRedireccion(pedida.pathname);
  if (redireccion) {
    return new Response(null, {
      status: redireccion.estado,
      headers: { Location: ubicacionRedireccion(redireccion, pedida.search) },
    });
  }

  const original = await siguiente();
  const respuesta = new Response(original.body, original);
  return aplicarCabeceras(respuesta, { ruta: pedida.pathname, estado: original.status });
});
