// Si el lead que escribe ya pidió el precio antes. Quien manda una consulta o
// una preinscripción después de ver cuánto sale ya pasó ese filtro, y el aviso
// lo marca para atenderlo primero (odd/tasks/priorizar-leads-que-vieron-precio.md).
//
// Sin nada de Deno adentro, igual que `enlace.ts`, para que
// `tests/precio-visto.test.mjs` lo corra con Node: las credenciales y el
// `fetch` llegan por parámetro desde `index.ts`.

type Fila = Record<string, unknown>;

export interface PrecioVisto {
  carrera: string | null;
  created_at: string;
}

export interface DependenciasPrecioVisto {
  supabaseUrl: string;
  serviceRoleKey: string;
  fetch?: typeof fetch;
  log?: (...datos: unknown[]) => void;
}

/** El valor de `tipo_formulario` de «Ver precio» (`FORMULARIO_PRECIO` en casas.ts). */
const FORMULARIO_PRECIO = 'precio';

// Corto a propósito: es un adorno del aviso, y el aviso no puede esperar.
const TOPE_MS = 3_000;

function mailDe(fila: Fila): string {
  return typeof fila.email === 'string' ? fila.email.trim() : '';
}

/** Se busca para todo lo que no sea el propio «Ver precio», si trae mail. */
export function correspondeBuscarPrecio(fila: Fila): boolean {
  return fila.tipo_formulario !== FORMULARIO_PRECIO && mailDe(fila) !== '';
}

/**
 * En un ILIKE `%` y `_` son comodines, y un `_` es común en un mail: sin
 * escapar, `ana_p@x.com` también traería a `anaxp@x.com`. PostgREST además
 * convierte `*` en `%`, y ese no se puede escapar: un mail con `*` no se busca.
 */
function patronExacto(mail: string): string | null {
  if (mail.includes('*')) return null;
  return mail.replace(/[\\%_]/g, letra => `\\${letra}`);
}

/**
 * El «Ver precio» más reciente del mismo mail, anterior a esta fila. Si la
 * consulta falla o tarda, devuelve null: el aviso sale igual, sin la marca.
 */
export async function buscarPrecioVisto(fila: Fila, deps: DependenciasPrecioVisto): Promise<PrecioVisto | null> {
  if (!correspondeBuscarPrecio(fila)) return null;
  const patron = patronExacto(mailDe(fila));
  if (!patron || !deps.supabaseUrl || !deps.serviceRoleKey) return null;

  const params = new URLSearchParams({
    select: 'carrera,created_at',
    tipo_formulario: `eq.${FORMULARIO_PRECIO}`,
    email: `ilike.${patron}`,
    order: 'created_at.desc',
    limit: '1',
  });
  if (typeof fila.id === 'number') params.set('id', `neq.${fila.id}`);
  if (typeof fila.created_at === 'string') params.set('created_at', `lt.${fila.created_at}`);

  try {
    const respuesta = await (deps.fetch ?? fetch)(
      `${deps.supabaseUrl.replace(/\/+$/, '')}/rest/v1/consultas?${params}`,
      {
        headers: {
          apikey: deps.serviceRoleKey,
          Authorization: `Bearer ${deps.serviceRoleKey}`,
        },
        signal: AbortSignal.timeout(TOPE_MS),
      },
    );
    if (!respuesta.ok) throw new Error(`consultas respondió ${respuesta.status}: ${await respuesta.text()}`);
    const filas = await respuesta.json() as PrecioVisto[];
    const ultima = Array.isArray(filas) ? filas[0] : undefined;
    return ultima && typeof ultima.created_at === 'string'
      ? { carrera: ultima.carrera ?? null, created_at: ultima.created_at }
      : null;
  } catch (error) {
    (deps.log ?? console.error)('No se pudo ver si el lead ya pidió el precio:', String(error));
    return null;
  }
}
