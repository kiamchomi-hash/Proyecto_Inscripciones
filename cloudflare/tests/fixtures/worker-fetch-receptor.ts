// Sonda exclusivamente local: el harness intercepta toda salida, sin red real.
import { URL_SMTP2GO } from '../../staging/correo-controlado.ts';

const original = globalThis.fetch;
globalThis.fetch = () => Promise.reject(new Error('Egreso global cerrado'));

export default {
  async fetch(request: Request) {
    try {
      const r = await original(URL_SMTP2GO, { method: 'POST', body: '{}',
        redirect: new URL(request.url).pathname === '/manual' ? 'manual' : 'error' });
      return Response.json({ status: r.status });
    } catch (e) {
      const error = e as Error;
      // Sólo datos sintéticos en esta sonda; nunca secretos, cabeceras ni payload.
      return Response.json({ nombre: error.name, mensaje: error.message, stack: error.stack });
    }
  },
};
