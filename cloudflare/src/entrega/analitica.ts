/**
 * Analítica del navegador, local y sin proveedor externo.
 *
 * El sitio vigente manda eventos a Vercel Analytics y, si hay
 * `NEXT_PUBLIC_GA_ID`, a Google. En este paquete no hay tokens, scripts ni
 * pedidos a ninguno de los dos: los eventos se guardan en memoria acotada y se
 * emiten como `CustomEvent` para que las pruebas y el desarrollo puedan verlos.
 * Un proveedor futuro —Google sólo con configuración explícita— consumiría ese
 * mismo flujo en el bloque 6; no se activa por inercia.
 *
 * Reglas duras:
 * - nunca lanza: una falla de medición no puede romper un formulario o un clic;
 * - nunca hace red ni registra en consola;
 * - sólo viajan escalares y se descartan claves con pinta de dato personal;
 * - la cola tiene tope para no crecer sin límite.
 */

export const EVENTO_ANALITICA = 'cau:analitica';
export const MAX_EVENTOS = 200;

const CLAVES_PRIVADAS = /^(?:e-?mail|mail|correo|tel[eé]fono|tel|dni|documento|nombre|apellido|contacto|ip|user[_-]?agent|direcci[oó]n)$/i;
const NOMBRE_VALIDO = /^[a-z0-9][a-z0-9_-]{0,63}$/i;

export interface EventoAnalitica {
  evento: string;
  datos: Record<string, string | number | boolean>;
  t: number;
}

type VentanaAnalitica = Window & { __cauAnalitica?: EventoAnalitica[] };

function datoSeguro(valor: unknown): string | number | boolean | null {
  if (typeof valor === 'string') return valor.slice(0, 120);
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor === 'boolean') return valor;
  // Objetos y arrays pueden arrastrar datos personales anidados: se descartan.
  return null;
}

/** Registra un evento y devuelve lo guardado, o `null` si no había ventana. */
export function registrarEvento(
  evento: string,
  propiedades?: unknown,
): EventoAnalitica | null {
  if (typeof window === 'undefined') return null;
  try {
    const nombre = typeof evento === 'string' ? evento.trim() : '';
    if (!NOMBRE_VALIDO.test(nombre)) return null;

    const datos: Record<string, string | number | boolean> = {};
    if (propiedades !== null && typeof propiedades === 'object' && !Array.isArray(propiedades)) {
      for (const [clave, valor] of Object.entries(propiedades as Record<string, unknown>)) {
        if (CLAVES_PRIVADAS.test(clave)) continue;
        const seguro = datoSeguro(valor);
        if (seguro !== null) datos[clave] = seguro;
      }
    }

    const registro: EventoAnalitica = { evento: nombre, datos, t: Date.now() };
    const ventana = window as VentanaAnalitica;
    const cola = ventana.__cauAnalitica ?? (ventana.__cauAnalitica = []);
    cola.push(registro);
    if (cola.length > MAX_EVENTOS) cola.splice(0, cola.length - MAX_EVENTOS);

    try {
      window.dispatchEvent(new CustomEvent(EVENTO_ANALITICA, { detail: registro }));
    } catch {
      // Sin DOM de eventos el dato ya quedó en la cola; no se interrumpe nada.
    }
    return registro;
  } catch {
    return null;
  }
}

/** Firma de `track` de Vercel Analytics: nombre y propiedades planas. */
export function track(evento: string, propiedades?: Record<string, unknown>): void {
  registrarEvento(evento, propiedades);
}

export function leerEventos(): EventoAnalitica[] {
  if (typeof window === 'undefined') return [];
  return [...((window as VentanaAnalitica).__cauAnalitica ?? [])];
}

export function limpiarEventos(): void {
  if (typeof window === 'undefined') return;
  (window as VentanaAnalitica).__cauAnalitica = [];
}
