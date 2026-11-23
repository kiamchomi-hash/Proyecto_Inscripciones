// Eventos de conversion para Web Analytics.
//
// El pageview ya lo cuenta el componente <Analytics> del layout: con eso se
// sabe que fichas de carrera se miran. Lo que faltaba es lo otro, que es lo
// unico que el sitio persigue de verdad: cuales terminan en un formulario
// enviado. Con la campana de indexacion andando, esa es la diferencia entre
// saber que una pagina trae visitas y saber que trae inscripciones.
//
// Se dispara solo cuando el POST a /api/formularios respondio ok: un envio que
// fallo no es una conversion. track() no manda nada en desarrollo (loguea en
// consola) y no lanza si algo sale mal, asi que ninguna de estas llamadas puede
// romper el envio, que a esa altura ya ocurrio.

import { track } from '@/lib/analytics-destino';
import { EVENTOS_VOCACIONAL_MEDIDOS } from '@/lib/vocacional-analytics';

/** Desde dónde se envió la consulta, para distinguir cada superficie de captación. */
export type OrigenConsulta = 'home' | 'teclab' | 'contacto';

/** Primer uso del formulario; sólo categorías, nunca valores ingresados. */
export function trackInicioFormulario(origen: OrigenConsulta, modo: string) {
  track('formulario-iniciado', { origen, modo });
}

export function trackFormularioVisto(origen: OrigenConsulta, modo: string) {
  track('formulario-visto', { origen, modo });
}

export function trackCtaInscripcion(destino: string) {
  track('cta-inscripcion', { destino });
}

/** Sólo cuenta enlaces internos a la oferta cuando el clic nace en el calendario. */
export function destinoDesdeCalendario(
  paginaActual: string,
  href: string,
  origen: string,
): 'oferta' | 'teclab' | 'carrera' | 'preinscripcion' | 'contacto' | null {
  if (paginaActual !== '/calendario-academico') return null;
  const destino = new URL(href, origen);
  if (destino.origin !== new URL(origen).origin) return null;
  const ruta = destino.pathname;
  if (/^\/carreras\/[^/]+\/inscripcion$/.test(ruta)) return 'preinscripcion';
  if (ruta.startsWith('/carreras/')) return 'carrera';
  if (ruta === '/teclab') return 'teclab';
  if (ruta === '/contacto') return 'contacto';
  if (ruta !== '/') return null;
  return 'oferta';
}

/**
 * El calendario académico es la página que más visitas trae después de las
 * fichas, y hasta ahora sus salidas hacia la oferta sólo vivían en memoria del
 * navegador: no había forma de saber si esa visita termina en una carrera. Va
 * por el mismo camino que el clic de WhatsApp, que el servidor cuenta en D1 sin
 * mandar aviso a Telegram.
 */
export function trackSalidaCalendario(
  destino: 'oferta' | 'teclab' | 'carrera' | 'preinscripcion' | 'contacto',
) {
  track('calendario-salida', { origen: 'calendario', destino });
  enviarEventoServidor('calendario-salida', { destino });
}

export function trackIntentoFormulario(origen: OrigenConsulta, modo: string, resultado: string) {
  track('formulario-intento', { origen, modo, resultado });
  if (resultado !== 'valido') enviarEventoServidor('formulario-intento', { origen, modo, resultado });
}

/**
 * Registra el abandono observable del formulario. No puede saber por qué se
 * fue una persona, pero sí el último campo enfocado y si quedó una validación
 * o un error de envío visible. Nunca incluye los valores escritos.
 */
export function trackAbandonoFormulario(
  origen: OrigenConsulta,
  modo: string,
  ultimoCampo: string,
  motivo: string,
  camposCompletados: number,
) {
  track('formulario-abandonado', {
    origen,
    modo,
    ultimo_campo: ultimoCampo || 'sin campo',
    motivo,
    campos_completados: camposCompletados,
  });
  enviarEventoServidor('formulario-abandonado', {
    origen,
    modo,
    ultimo_campo: ultimoCampo || 'sin campo',
    motivo,
    campos_completados: camposCompletados,
  });
}

/**
 * Manda el evento al servidor, que decide qué guarda y qué avisa: suma el clic
 * de WhatsApp en cualquier dispositivo, cuenta las salidas del calendario y sólo
 * alerta por Telegram en los casos que la allowlist permite.
 */
function enviarEventoServidor(evento: string, datos: Record<string, string | number>) {
  if (typeof window === 'undefined') return;
  void fetch('/api/alertas-analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evento, datos }),
    keepalive: true,
  }).catch(() => undefined);
}

/**
 * Client Hints es la señal principal porque la entrega el navegador como un
 * booleano. Safari y Firefox no la exponen; ahí usamos capacidad táctil más
 * ancho de pantalla. Al servidor llega sólo el resultado, nunca el user agent,
 * la resolución ni otra huella del dispositivo.
 */
function esDispositivoMovil() {
  if (typeof window === 'undefined') return false;
  const navegador = window.navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  };
  if (typeof navegador.userAgentData?.mobile === 'boolean') {
    return navegador.userAgentData.mobile;
  }
  return window.matchMedia('(pointer: coarse) and (max-width: 900px)').matches;
}

/**
 * La carrera va como propiedad y no como evento aparte para poder agrupar por
 * ella en el panel. El de /contacto no pregunta carrera, de ahi el 'sin
 * especificar' en vez de omitir la propiedad: si falta, la fila no aparece al
 * desglosar y el total deja de cerrar.
 */
export function trackConsulta(
  origen: OrigenConsulta,
  carrera: string | null,
  tipo: string | null,
) {
  track('consulta', {
    origen,
    carrera: carrera || 'sin especificar',
    tipo: tipo || 'sin especificar',
  });
  avisarConsultaEnviada();
}

export function trackPreguntaFaq(modo: string) {
  track('pregunta-faq', { modo: modo === 'privada' ? 'privada' : 'publica' });
}

export function trackSolicitudClase(materias: number) {
  track('solicitud-clase', { materias });
}

/** Interacciones del embudo de clases; nunca incluye datos personales. */
export function trackMateriaClase(materia: string) {
  track('clase-materia', { materia });
}

export function trackDiaClase(materia: string) {
  track('clase-dia', { materia });
}

export function trackHorarioClase(materia: string, horario: string) {
  track('clase-horario', { materia, horario });
}

export function trackWhatsappClase(materia: string) {
  track('clase-whatsapp', { materia });
  enviarEventoServidor('clase-whatsapp', { materia });
}

/** Avisa sólo fallos de infraestructura; validaciones, captcha y cuota no llaman a esta función. */
export function avisarFalloFormularioContacto(
  origen: OrigenConsulta,
  motivo: 'red' | 'servidor',
) {
  enviarEventoServidor('formulario-fallo', { origen, motivo });
}

/** Clasifica sólo fallos técnicos; 4xx esperables no generan avisos. */
export function tipoFalloTecnicoFormulario(estadoRespuesta: number | null): 'red' | 'servidor' | null {
  if (estadoRespuesta === null) return 'red';
  return estadoRespuesta >= 500 ? 'servidor' : null;
}

/**
 * Un clic en cualquiera de los botones de WhatsApp que llevan al numero del
 * CAU. Es la conversion mas transitada del sitio y hasta ahora no se media:
 * como WhatsApp se abre en otra pestana, la visita terminaba contando como
 * rebote, sin forma de distinguir al que escribio del que se fue.
 *
 * `origen` es el pathname donde ocurrio el clic. En las fichas
 * (`/carreras/<slug>`) eso ya dice que carrera genero el lead; los botones de
 * los modales de la home reportan `/`, porque el modal no cambia la URL - para
 * ese tramo el dato esta en `career_clicks`, que registra que ficha se abrio.
 *
 * Quedan afuera a proposito los otros dos tipos de enlace `wa.me` del sitio: el
 * de clases de apoyo va al numero del profesor y ya tiene su propio evento, y
 * el de compartir una novedad no lleva numero - no es un lead, y sumarlo
 * ensuciaria el total.
 *
 * El evento viaja al servidor en los dos dispositivos: ahi se cuenta en
 * `whatsapp_clicks` y cada clic avisa por Telegram, sea del dispositivo que sea.
 */
export function trackWhatsapp(origen: string) {
  track('whatsapp', { origen });
  // Se manda siempre y el servidor decide: suma el clic al agregado de D1 en
  // cualquier dispositivo y avisa por Telegram cada vez que entra al contador.
  // El dispositivo se envía sólo para el informe de leads, no para filtrar el
  // aviso.
  enviarEventoServidor('whatsapp', { origen, movil: esDispositivoMovil() ? 1 : 0 });
}

/**
 * Recorrido de una carrera de Teclab (modal o ficha), contado en
 * `teclab_embudo` sin aviso. Va el slug de la carrera porque el modal no
 * cambia la URL: sin él, todo figuraría como `/`. `grupo` es el de la prueba
 * A/B de los tickets; el modal no participa y va `sin-prueba`.
 */
export function trackEmbudoTeclab(
  superficie: import('./teclab-embudo').SuperficieTeclab,
  carrera: string,
  evento: import('./teclab-embudo').EventoTeclab,
  paso: import('./teclab-embudo').PasoTeclab,
  grupo: import('./teclab-embudo').GrupoTeclab = 'sin-prueba',
) {
  const movil = esDispositivoMovil() ? 1 : 0;
  track('teclab-embudo', { superficie, carrera, evento, paso, movil, grupo });
  enviarEventoServidor('teclab-embudo', { superficie, carrera, evento, paso, movil, grupo });
}

/** El evento de `window` que dispara cada formulario cuando el servidor confirmó la consulta. */
export const EVENTO_CONSULTA_ENVIADA = 'cau:consulta-enviada';

/**
 * Avisa a la página que una consulta entró: la medición de la ficha de Teclab
 * lo escucha para no contar como «se fue» a quien dejó sus datos.
 */
export function avisarConsultaEnviada() {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new Event(EVENTO_CONSULTA_ENVIADA));
  } catch { /* sin efecto en el envío */ }
}

/** Embudo vocacional sin respuestas ni avisos de Telegram. */
export function trackVocacional(
  evento: import('./vocacional-analytics').EventoVocacional,
  datos: import('./vocacional-analytics').DatosVocacional,
) {
  const { test, pregunta, respondidas, total, destino, etapa } = datos;
  track(evento, {
    test, pregunta, respondidas, total,
    ...(destino ? { destino } : {}),
    ...(etapa ? { etapa } : {}),
  });
  // El recorrido, además, queda contado en D1: la analítica del navegador ya no
  // sale a la red y sin esto no se puede leer en qué pregunta se cae la gente.
  // Va sólo el paso alcanzado, nunca la respuesta elegida.
  if ((EVENTOS_VOCACIONAL_MEDIDOS as readonly string[]).includes(evento)) {
    enviarEventoServidor(evento, { test, pregunta });
  }
}
