// Montaje del widget de Turnstile para el navegador.
//
// Está separado del componente React a propósito: así las pruebas ejercitan la
// carga del script, el montaje, el tamaño, la limpieza y el fallo cerrado con
// dobles del documento en vez de salir a la red. Nada de acá llama a Cloudflare
// por su cuenta: si no hay site key (y no hay modo demo), no se carga el script.
//
// La site key es pública y llega en un `<meta name="turnstile-site-key">` que
// arma `Sitio.astro` leyendo la variable de runtime. Nunca se escribe en el
// código ni se confunde con la secret key, que no entra a este paquete.

export const SCRIPT_ID = 'cloudflare-turnstile-script';
export const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
export const META_SITEKEY = 'turnstile-site-key';
export const META_DEMO = 'formularios-demo';

/** Token que entrega el modo demo. El endpoint no lo verifica, igual que en el sitio. */
export const TOKEN_DEMO = 'demo';

/**
 * Cloudflare no deja bajar el tamaño `flexible` de 300 px: en un celular
 * angosto el widget se salía de la tarjeta y la página scrolleaba de costado.
 * Debajo de ese ancho se usa `compact`. Mismo umbral que el sitio vigente.
 */
export const ANCHO_MINIMO_FLEXIBLE = 300;

/**
 * Tope para sacar el marcador si el `load` del iframe nunca llega. Es largo a
 * propósito: es preferible que el marcador se quede de más antes que dejar el
 * hueco vacío que se ve cuando se lo saca antes de tiempo.
 */
export const ESPERA_MAXIMA_MS = 10000;

export type ApiTurnstile = {
  render: (
    contenedor: unknown,
    opciones: {
      sitekey: string;
      action?: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      theme: 'dark';
      size: 'flexible' | 'compact';
      appearance?: 'always' | 'execute' | 'interaction-only';
    },
  ) => string;
  remove: (id: string) => void;
};

type ScriptFalso = {
  id?: string;
  src?: string;
  async?: boolean;
  defer?: boolean;
  addEventListener: (evento: string, cb: () => void, opciones?: { once?: boolean }) => void;
  removeEventListener?: (evento: string, cb: () => void) => void;
  remove?: () => void;
};

export type DocumentoMinimo = {
  getElementById: (id: string) => unknown;
  createElement: (etiqueta: string) => ScriptFalso;
  head: { appendChild: (nodo: unknown) => void };
  querySelector: (selector: string) => { getAttribute: (nombre: string) => string | null } | null;
};

export type VentanaMinima = { turnstile?: ApiTurnstile };

/** `demo` es un estado más, no un error: no hay nada que verificar ni que dibujar. */
export type EstadoTurnstile = 'sin-configurar' | 'demo' | 'cargando' | 'montado' | 'error';

/** Lee la site key pública que dejó el servidor en el `<head>`. */
export function leerSitio(documento: Pick<DocumentoMinimo, 'querySelector'>): string | null {
  const meta = documento.querySelector(`meta[name="${META_SITEKEY}"]`);
  const valor = meta?.getAttribute('content')?.trim();
  return valor ? valor : null;
}

/**
 * Modo demo del navegador. Sólo lo habilita el servidor cuando
 * `APP_STAGE=local` y `FORMULARIOS_DEMO=1`; en producción el meta no existe.
 * Se lee del documento y no de `process.env`: en el Worker no hay entorno de
 * build que reemplazar y una bandera congelada no serviría.
 */
export function leerDemo(documento: Pick<DocumentoMinimo, 'querySelector'>): boolean {
  const meta = documento.querySelector(`meta[name="${META_DEMO}"]`);
  return meta?.getAttribute('content')?.trim() === '1';
}

/**
 * Carga `api.js` con `render=explicit` una sola vez por documento. Si el script
 * ya está puesto espera su `load`; un error de red deja la promesa rechazada y
 * el widget no se dibuja (fallo cerrado).
 */
export function cargarScriptTurnstile(
  documento: DocumentoMinimo,
  ventana: VentanaMinima,
): Promise<ApiTurnstile> {
  return new Promise((resolver, rechazar) => {
    if (ventana.turnstile) {
      resolver(ventana.turnstile);
      return;
    }
    const existente = documento.getElementById(SCRIPT_ID) as ScriptFalso | null;
    const alCargar = () => {
      if (ventana.turnstile) resolver(ventana.turnstile);
      else rechazar(new Error('Turnstile no quedó disponible.'));
    };
    const alFallar = () => rechazar(new Error('No se pudo cargar Turnstile.'));
    if (existente) {
      existente.addEventListener('load', alCargar, { once: true });
      existente.addEventListener('error', alFallar, { once: true });
      return;
    }
    const script = documento.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', alCargar, { once: true });
    script.addEventListener('error', alFallar, { once: true });
    documento.head.appendChild(script);
  });
}

export type OpcionesMontaje = {
  sitio: string | null | undefined;
  contenedor: unknown;
  ventana: VentanaMinima;
  documento: DocumentoMinimo;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onEstado?: (estado: EstadoTurnstile) => void;
  invisible?: boolean;
  /** Sólo para el demo del servidor; si es `true`, no se toca Cloudflare. */
  demo?: boolean;
  /** `true` cuando el contenedor mide menos de 300 px. */
  medirCompacto?: () => boolean;
  /** Se llama después de cada `render`, con el tamaño elegido. */
  onDibujado?: (compacto: boolean) => void;
  /** Se llama cuando el iframe del widget terminó de cargar (o venció la espera). */
  onMontado?: () => void;
  cargar?: () => Promise<ApiTurnstile>;
};

export type ControlTurnstile = {
  /** Desmonta el widget y descarta cualquier token posterior. */
  desmontar: () => void;
  /**
   * Vuelve a dibujar si el ancho cruzó el umbral de 300 px. Sin cruce no hace
   * nada: el tamaño no se puede cambiar en un widget ya dibujado.
   */
  redibujar: () => void;
};

type NodoConIframe = {
  querySelector?: (selector: string) => unknown;
  removeEventListener?: (evento: string, cb: () => void) => void;
  addEventListener?: (evento: string, cb: () => void, opciones?: { once?: boolean }) => void;
};

/**
 * `render()` vuelve antes de que el iframe tenga contenido: sacar el marcador
 * ahí deja el hueco vacío justo el rato que tarda en pintarse. Se espera al
 * `load` del iframe, que Cloudflare crea dentro del contenedor un momento
 * después, con un tope de 10 s. Sin DOM (pruebas) no se espera nada.
 */
function esperarIframe(contenedor: unknown, alListo: () => void): () => void {
  const nodo = contenedor as NodoConIframe;
  let observador: MutationObserver | undefined;
  let tope: ReturnType<typeof setTimeout> | undefined;
  let iframe: NodoConIframe | null = null;
  let cancelado = false;

  const limpiar = () => {
    cancelado = true;
    if (tope) clearTimeout(tope);
    observador?.disconnect();
    iframe?.removeEventListener?.('load', listo);
  };
  function listo() {
    if (cancelado) return;
    limpiar();
    alListo();
  }

  if (typeof MutationObserver === 'undefined' || typeof nodo?.querySelector !== 'function') {
    return limpiar;
  }

  const enganchar = () => {
    const encontrado = nodo.querySelector?.('iframe') as NodoConIframe | null;
    if (typeof encontrado?.addEventListener !== 'function') return false;
    iframe = encontrado;
    encontrado.addEventListener('load', listo, { once: true });
    return true;
  };

  // También cubre el iframe que render() insertó sincrónicamente.
  tope = setTimeout(listo, ESPERA_MAXIMA_MS);
  if (enganchar()) return limpiar;
  observador = new MutationObserver(() => {
    if (enganchar()) observador?.disconnect();
  });
  observador.observe(contenedor as Node, { childList: true, subtree: true });
  return limpiar;
}

/**
 * Monta el widget si hay site key o si el servidor habilitó el demo. Un token
 * sólo se entrega mientras el control siga montado: desmontar antes de que
 * cargue el script no dibuja nada, y desmontar después llama a `remove`.
 */
export function montarTurnstile(opciones: OpcionesMontaje): ControlTurnstile {
  const {
    contenedor, ventana, documento, onVerify, onExpire, onEstado,
    invisible = false, demo = false,
  } = opciones;
  const sitio = typeof opciones.sitio === 'string' ? opciones.sitio.trim() : '';

  // Igual que el sitio vigente: el demo gana sobre la site key y no toca red.
  if (demo) {
    onEstado?.('demo');
    onVerify(TOKEN_DEMO);
    return { desmontar() {}, redibujar() {} };
  }

  if (!sitio) {
    onEstado?.('sin-configurar');
    return { desmontar() {}, redibujar() {} };
  }

  let desmontado = false;
  let api: ApiTurnstile | null = null;
  let widgetId: string | undefined;
  let compactoActual = false;
  let generacion = 0;
  let cancelarEspera: (() => void) | undefined;
  const medirCompacto = opciones.medirCompacto ?? (() => false);
  const cargar = opciones.cargar ?? (() => cargarScriptTurnstile(documento, ventana));

  let montadoAvisado = false;
  const avisarMontado = () => {
    if (desmontado || montadoAvisado) return;
    montadoAvisado = true;
    opciones.onMontado?.();
  };

  const dibujar = () => {
    if (desmontado || !api || widgetId !== undefined) return;
    const compacto = medirCompacto();
    compactoActual = compacto;
    // Un widget reemplazado ya no es dueño de su token: aunque su callback se
    // dispare después de `remove`, se descarta.
    const miGeneracion = ++generacion;
    widgetId = api.render(contenedor, {
      sitekey: sitio,
      ...(documento.querySelector('meta[name="turnstile-action"]')?.getAttribute('content')
        ? { action: documento.querySelector('meta[name="turnstile-action"]')!.getAttribute('content')! } : {}),
      callback: token => {
        if (!desmontado && miGeneracion === generacion) onVerify(token);
      },
      'expired-callback': () => {
        if (!desmontado && miGeneracion === generacion) onExpire?.();
      },
      theme: 'dark',
      size: compacto ? 'compact' : 'flexible',
      ...(invisible ? { appearance: 'interaction-only' as const } : {}),
    });
    // Cada dibujo vuelve a mostrar el marcador hasta que el iframe carga.
    montadoAvisado = false;
    cancelarEspera?.();
    cancelarEspera = esperarIframe(contenedor, avisarMontado);
    opciones.onDibujado?.(compacto);
  };

  onEstado?.('cargando');
  cargar()
    .then(cargada => {
      if (desmontado) return;
      api = cargada;
      dibujar();
      onEstado?.('montado');
    })
    .catch(() => {
      // Sin script no hay token: el formulario queda bloqueado, no a medias.
      if (!desmontado) onEstado?.('error');
    });

  return {
    desmontar() {
      desmontado = true;
      cancelarEspera?.();
      if (widgetId !== undefined && api) {
        api.remove(widgetId);
        widgetId = undefined;
      }
    },
    redibujar() {
      if (desmontado || !api || widgetId === undefined) return;
      if (medirCompacto() === compactoActual) return;
      // El token del widget anterior se descarta con él.
      generacion += 1;
      api.remove(widgetId);
      widgetId = undefined;
      onExpire?.();
      dibujar();
    },
  };
}
