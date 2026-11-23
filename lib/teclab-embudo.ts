/**
 * Recorrido de una carrera de Teclab, en sus dos superficies: el modal de la
 * home y la ficha `/carreras/<slug>`. Hasta dónde llega cada visita, en qué
 * parte se va sin hacer nada y desde dónde toca una CTA.
 *
 * Se declara una sola vez y lo leen el navegador, el Worker y la migración
 * `cloudflare/migrations/0016_teclab_embudo.sql` (una prueba fija que coincidan). Al servidor viajan
 * sólo la superficie, la carrera (slug), el paso, el evento y si es móvil: ni
 * mail, ni identificadores, ni filas por visita.
 */

export const SUPERFICIES_TECLAB = ['modal', 'ficha'] as const;
export type SuperficieTeclab = (typeof SUPERFICIES_TECLAB)[number];

/** Las claves de los slides de `teclab-modal.tsx`, en el orden en que aparecen. */
export const PASOS_MODAL_TECLAB = ['portada', 'cursada', 'plan', 'cierre', 'precio'] as const;

/**
 * Las secciones de la ficha de Teclab, en el orden de la página, con el
 * selector que las ubica. Por selector y no por ref: el formulario se reemplaza
 * al cargarse y la sección de perfil cambia según la carrera.
 */
export const SECCIONES_FICHA_TECLAB = [
  ['portada', '.career-hero'],
  ['plan', '#plan'],
  ['faq', '#preguntas-frecuentes'],
  ['formulario', '#preinscripcion'],
  ['perfil', '#perfil'],
  ['oficial', '.career-oficial'],
  ['relacionadas', '.career-related'],
] as const;
export const PASOS_FICHA_TECLAB = SECCIONES_FICHA_TECLAB.map(([paso]) => paso);

/** La unión, en el orden que acepta la base. */
export const PASOS_TECLAB = [
  'portada', 'cursada', 'plan', 'cierre', 'precio', 'faq', 'formulario', 'perfil', 'oficial', 'relacionadas',
] as const;
export type PasoTeclab = (typeof PASOS_TECLAB)[number];
export type PasoModalTeclab = (typeof PASOS_MODAL_TECLAB)[number];

/**
 * `alcanzado`: la visita llegó a ese slide o sección (una vez por visita).
 * `cerrado`: se fue (cerró el modal o la página) sin una CTA que cierre la
 * visita; el paso es el slide visible o la sección más honda alcanzada.
 * `whatsapp` / `inscripcion`: la CTA tocada y desde dónde. `inscripcion` es ir
 * a inscribirse o al formulario.
 * `relacionada`: en la ficha, salió hacia otra carrera.
 * `consulta`: en la ficha, envió un formulario.
 */
export const EVENTOS_TECLAB = ['alcanzado', 'cerrado', 'whatsapp', 'inscripcion', 'relacionada', 'consulta'] as const;
export type EventoTeclab = (typeof EVENTOS_TECLAB)[number];
export type CtaTeclab = Exclude<EventoTeclab, 'alcanzado' | 'cerrado'>;

/**
 * Grupo de la prueba A/B de los tickets (`lib/ab-ticket-teclab.ts`).
 * `sin-prueba`: el modal, las filas anteriores a la prueba y las fichas sin
 * precio cargado (no pueden mostrar ticket, así que no cuentan para ningún
 * grupo). `revision`: una visita con `?ticket=` forzado, para no mezclar las
 * revisiones a mano con las visitas reales.
 */
export const GRUPOS_TECLAB = ['sin-prueba', 'control', 'bimestres', 'bimestres-azul', 'revision'] as const;
export type GrupoTeclab = (typeof GRUPOS_TECLAB)[number];

export function grupoValido(valor: unknown): valor is GrupoTeclab {
  return typeof valor === 'string' && (GRUPOS_TECLAB as readonly string[]).includes(valor);
}

export const TOPE_SLUG = 120;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugValido(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.length <= TOPE_SLUG && SLUG.test(valor);
}

export function superficieValida(valor: unknown): valor is SuperficieTeclab {
  return typeof valor === 'string' && (SUPERFICIES_TECLAB as readonly string[]).includes(valor);
}

/** El paso tiene que existir en la superficie: «precio» no es una sección de la ficha. */
export function pasoValido(superficie: SuperficieTeclab, valor: unknown): valor is PasoTeclab {
  const lista: readonly string[] = superficie === 'modal' ? PASOS_MODAL_TECLAB : PASOS_FICHA_TECLAB;
  return typeof valor === 'string' && lista.includes(valor);
}

export function eventoValido(superficie: SuperficieTeclab, valor: unknown): valor is EventoTeclab {
  if (typeof valor !== 'string' || !(EVENTOS_TECLAB as readonly string[]).includes(valor)) return false;
  return superficie === 'ficha' || (valor !== 'relacionada' && valor !== 'consulta');
}

/**
 * Qué CTA es un enlace. Los `wa.me` de estas superficies llevan el número del
 * CAU; inscribirse es la página dedicada o cualquiera de los dos formularios;
 * otra ficha es una relacionada. `actual` es la ruta de la ficha, para no
 * contar como relacionada un enlace a sí misma.
 */
export function ctaDelEnlace(href: string, actual = ''): CtaTeclab | null {
  if (href.includes('wa.me/')) return 'whatsapp';
  if (href === '#preinscripcion' || href === '#formulario') return 'inscripcion';
  if (/^\/carreras\/[^/?#]+\/inscripcion(?:[?#].*)?$/.test(href)) return 'inscripcion';
  const ficha = href.match(/^\/carreras\/([^/?#]+)(?:[?#].*)?$/);
  if (ficha && `/carreras/${ficha[1]}` !== actual) return 'relacionada';
  return null;
}

/**
 * Estado efímero de una visita. `terminales` son las CTA que la dan por
 * resuelta: después de una, irse ya no cuenta como `cerrado`. En el modal
 * inscribirse cierra el modal; en la ficha sólo baja al formulario de la misma
 * página, así que no termina nada. No lanza: medir no puede romper la página.
 */
export function crearMedicionTeclab(
  emitir: (evento: EventoTeclab, paso: PasoTeclab) => void,
  terminales: readonly CtaTeclab[],
) {
  const alcanzados = new Set<PasoTeclab>();
  const ctas = new Set<CtaTeclab>();
  let terminado = false;
  const enviar = (evento: EventoTeclab, paso: PasoTeclab) => {
    try { emitir(evento, paso); } catch { /* sin efecto en la página */ }
  };
  return {
    alcanzar(paso: PasoTeclab) {
      if (alcanzados.has(paso)) return;
      alcanzados.add(paso);
      enviar('alcanzado', paso);
    },
    /** Cada CTA se cuenta una vez por visita. */
    cta(destino: CtaTeclab, paso: PasoTeclab) {
      if (terminales.includes(destino)) terminado = true;
      if (ctas.has(destino)) return;
      ctas.add(destino);
      enviar(destino, paso);
    },
    cerrar(paso: PasoTeclab) {
      if (terminado) return;
      terminado = true;
      enviar('cerrado', paso);
    },
  };
}
