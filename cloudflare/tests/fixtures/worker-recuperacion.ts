// Exclusivo del harness: fallos, pausas y proveedor simulado. No entra en Astro.
import { manejarColaLocal, manejarProgramadoLocal, COLA_EFECTOS } from '../../src/operativa/programados.ts';
import { consumirEfecto } from '../../src/operativa/consumidores.ts';

interface FixtureEnv {
  DB: D1Database;
  EFECTOS: Queue;
  APP_STAGE: string;
  FASE: string;
  REVISION: string;
}
let instancia: string | undefined;
const idInstancia = () => instancia ??= crypto.randomUUID();

async function pausa(db: D1Database, fase: string) {
  await db.prepare('INSERT INTO fixture_pausas(fase,instancia) VALUES (?1,?2)').bind(fase, idInstancia()).run();
  // Timer pendiente real: permite que el test recargue el isolate en este punto.
  await new Promise(resolve => setTimeout(resolve, 60_000));
  throw new Error('La prueba debía interrumpir el isolate antes de continuar');
}

function baseInstrumentada(env: FixtureEnv): D1Database {
  const envolver = (stmt: D1PreparedStatement, sql: string): D1PreparedStatement => new Proxy(stmt, {
    get(target, metodo) {
      if (metodo === 'bind') return (...valores: unknown[]) => envolver(target.bind(...valores), sql);
      const valor = Reflect.get(target, metodo);
      if (typeof valor !== 'function') return valor;
      if (metodo !== 'first') return valor.bind(target);
      return async (...args: unknown[]) => {
        const lectura = sql.includes('FROM outbox WHERE id = ?1');
        if (lectura && env.FASE === 'error-base') throw new Error('D1 sintético no disponible');
        if (lectura && env.FASE === 'antes-claim') await pausa(env.DB, env.FASE);
        const resultado = await valor.apply(target, args);
        if (resultado && sql.includes('INSERT INTO outbox_reclamos') && env.FASE === 'antes-efecto') {
          await pausa(env.DB, env.FASE);
        }
        if (resultado && sql.includes("SET estado = 'enviado'") && env.FASE === 'despues-resultado') {
          await pausa(env.DB, env.FASE);
        }
        return resultado;
      };
    },
  });
  return new Proxy(env.DB, { get(target, metodo) {
    if (metodo === 'prepare') return (sql: string) => envolver(target.prepare(sql), sql);
    const valor = Reflect.get(target, metodo);
    return typeof valor === 'function' ? valor.bind(target) : valor;
  } });
}

function transportes(env: FixtureEnv) {
  return { telegram: async () => {
    await env.DB.prepare('INSERT INTO fixture_intentos(instancia) VALUES (?1)').bind(idInstancia()).run();
    if (env.FASE === 'durante-efecto') await pausa(env.DB, env.FASE);
    // Recibo durable del proveedor ficticio, separado del resultado del outbox.
    await env.DB.prepare('INSERT INTO fixture_entregas(instancia) VALUES (?1)').bind(idInstancia()).run();
    if (env.FASE === 'despues-efecto') await pausa(env.DB, env.FASE);
    return 'enviado' as const;
  } };
}

export default {
  async fetch(request: Request, env: FixtureEnv) {
    if (new URL(request.url).pathname === '/competir') {
      return Response.json({ resultado: await consumirEfecto(baseInstrumentada(env), 1, transportes(env)) });
    }
    if (new URL(request.url).pathname === '/red-bloqueada') {
      try {
        // El proxy de Wrangler puede representar el bloqueo como HTTP 500, no
        // necesariamente como excepción dentro de workerd.
        const respuesta = await fetch('https://red-prohibida.invalid/');
        if (!respuesta.ok) return new Response(null, { status: 503 });
      } catch { return new Response(null, { status: 503 }); }
      return new Response('La red no está bloqueada', { status: 500 });
    }
    return Response.json({ instancia: idInstancia() });
  },
  async queue(lote, env) {
    if (lote.queue !== COLA_EFECTOS) {
      for (const mensaje of lote.messages) {
        await env.DB.prepare('INSERT INTO fixture_dlq(msg_id,cuerpo,fecha) VALUES (?1,?2,?3)')
          .bind(mensaje.id, JSON.stringify(mensaje.body), mensaje.timestamp.toISOString()).run();
        mensaje.ack();
      }
      return;
    }
    for (const mensaje of lote.messages) {
      await env.DB.prepare('INSERT INTO fixture_cola(msg_id,intento,cuerpo) VALUES (?1,?2,?3)')
        .bind(mensaje.id, mensaje.attempts, JSON.stringify(mensaje.body)).run();
      if (env.FASE === 'expiracion-simulada') mensaje.ack();
    }
    // Simula exclusivamente la desaparición de la referencia, NO el TTL de Queues.
    if (env.FASE === 'expiracion-simulada') return;
    await manejarColaLocal(lote, { ...env, DB: baseInstrumentada(env) }, transportes(env));
    for (const mensaje of lote.messages) {
      await env.DB.prepare('INSERT INTO fixture_finalizados(msg_id) VALUES (?1)').bind(mensaje.id).run();
    }
  },
  async scheduled(evento, env) {
    await manejarProgramadoLocal(evento, { ...env, DB: baseInstrumentada(env) }, transportes(env));
  },
} satisfies ExportedHandler<FixtureEnv>;
