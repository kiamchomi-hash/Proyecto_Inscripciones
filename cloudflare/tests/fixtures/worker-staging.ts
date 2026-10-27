// Entry exclusivo del ensayo workerd. Nunca referenciado por una config remota.
// @ts-expect-error El build es JavaScript generado, sin declaraciones de tipos.
import aplicacion from '../../dist/server/entry.mjs';
import { crearEnsayoStaging } from '../../staging/worker.ts';
import { bindingDb, bindingCola } from '../../src/api/runtime.ts';

export default {
  async fetch(request: Request, env: Parameters<ReturnType<typeof crearEnsayoStaging>['fetch']>[1], ctx: ExecutionContext) {
    return crearEnsayoStaging(async pedido => {
      if (new URL(pedido.url).pathname === '/sonda-binding') {
        const db = bindingDb();
        if (!db || bindingCola()) throw Error('Binding incorrecto');
        const n = await db.prepare('SELECT count(*) AS n FROM carreras').first('n');
        return new Response(`<html><main>carreras=${n}</main></html>`, { headers: { 'Content-Type': 'text/html' } });
      }
      if (new URL(pedido.url).pathname === '/sonda-egress') {
        await fetch('https://egress-prohibido.invalid/');
        throw Error('La red debió estar bloqueada');
      }
      return aplicacion.fetch(pedido, env, ctx);
    }).fetch(request, env);
  },
  async queue(): Promise<never> { throw Error('Cola de staging no autorizada'); },
  async scheduled(): Promise<never> { throw Error('Cron de staging no autorizado'); },
};
