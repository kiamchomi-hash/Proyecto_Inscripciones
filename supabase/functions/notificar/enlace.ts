// El enlace de inscripción que suma el aviso de cada preinscripción de Teclab.
// Sin nada de Deno adentro, igual que `mensajes.ts`, para que
// `tests/enlace-inscripcion.test.mjs` lo corra con Node: las credenciales y el
// `fetch` llegan por parámetro desde `index.ts`.
//
// El código va a `enlaces_inscripcion` (sql/2026-10-03_enlaces_inscripcion.sql)
// y la página `/inscripcion/<codigo>` del sitio lo resuelve con la service
// role. La URL no lleva ningún dato personal.

type Fila = Record<string, unknown>;

// Sólo letras y números. El aviso sale con `parse_mode: "Markdown"`, y un `_`
// o un `*` suelto en la URL hace que Telegram rechace el mensaje entero: el
// aviso no llegaría. 32 caracteres de 62 son unos 190 bits de azar.
const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const LARGO = 32;

/** Un código al azar con `crypto.getRandomValues`, sin sesgo de módulo. */
export function nuevoCodigo(): string {
  let codigo = '';
  while (codigo.length < LARGO) {
    for (const byte of crypto.getRandomValues(new Uint8Array(LARGO))) {
      // 248 es el mayor múltiplo de 62 que entra en un byte: lo de arriba se
      // descarta para que todas las letras salgan con la misma probabilidad.
      if (byte < 248 && codigo.length < LARGO) codigo += ALFABETO[byte % 62];
    }
  }
  return codigo;
}

/** Sólo las preinscripciones de Teclab llevan enlace. */
export function correspondeEnlace(tabla: string, fila: Fila): boolean {
  return tabla === 'consultas' &&
    fila.casa === 'teclab' &&
    fila.tipo_formulario === 'preinscripcion' &&
    typeof fila.id === 'number';
}

export interface DependenciasEnlace {
  supabaseUrl: string;
  serviceRoleKey: string;
  sitioUrl: string;
  fetch?: typeof fetch;
  generar?: () => string;
  log?: (...datos: unknown[]) => void;
}

/** Guarda el código con la service role, directo contra PostgREST. */
async function guardarCodigo(consultaId: number, deps: DependenciasEnlace): Promise<string> {
  if (!deps.supabaseUrl || !deps.serviceRoleKey) throw new Error('SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY sin configurar');
  const codigo = (deps.generar ?? nuevoCodigo)();
  const respuesta = await (deps.fetch ?? fetch)(`${deps.supabaseUrl.replace(/\/+$/, '')}/rest/v1/enlaces_inscripcion`, {
    method: 'POST',
    headers: {
      apikey: deps.serviceRoleKey,
      Authorization: `Bearer ${deps.serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ codigo, consulta_id: consultaId }),
    signal: AbortSignal.timeout(5_000),
  });
  if (!respuesta.ok) throw new Error(`enlaces_inscripcion respondió ${respuesta.status}: ${await respuesta.text()}`);
  return codigo;
}

/**
 * El texto del aviso con el enlace al final, si corresponde. Si crearlo falla,
 * devuelve el aviso tal cual: perder el enlace es un problema menor, perder el
 * aviso de un lead no.
 */
export async function agregarEnlace(texto: string, fila: Fila, deps: DependenciasEnlace): Promise<string> {
  if (!correspondeEnlace('consultas', fila)) return texto;
  try {
    const codigo = await guardarCodigo(fila.id as number, deps);
    const url = `${deps.sitioUrl.replace(/\/+$/, '')}/inscripcion/${codigo}`;
    return `${texto}\n\n🔗 *Enlace para inscribirse:* ${url}`;
  } catch (error) {
    (deps.log ?? console.error)('No se pudo crear el enlace de inscripción:', String(error));
    return texto;
  }
}
