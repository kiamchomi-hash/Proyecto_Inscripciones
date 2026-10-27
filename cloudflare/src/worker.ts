import { handle } from '@astrojs/cloudflare/handler';
import { manejarColaLocal, manejarProgramadoLocal } from './operativa/programados.ts';

// Sin configuración/secretos/transportes externos, incluso si el entorno padre
// los contiene. Este entrypoint sólo conecta los servicios emulados locales.
export default {
  fetch: handle,
  async queue(lote, entorno) {
    await manejarColaLocal(lote, entorno);
  },
  async scheduled(evento, entorno) {
    await manejarProgramadoLocal(evento, entorno);
  },
} satisfies ExportedHandler<Env>;
