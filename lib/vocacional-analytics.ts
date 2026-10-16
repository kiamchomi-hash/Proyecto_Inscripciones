export type TestVocacional = 'general' | 'teclab';
export type EventoVocacional = `vocacional-${'iniciado' | 'pregunta' | 'completado' | 'retroceso' | 'reiniciado' | 'salida' | 'cta'}`;
export type DestinoVocacional = 'carrera' | 'inscripcion' | 'whatsapp' | 'oferta' | 'inicio';
export type DatosVocacional = {
  test: TestVocacional;
  pregunta: number;
  respondidas: number;
  total: number;
  destino?: DestinoVocacional;
  etapa?: 'preguntas' | 'resultado';
};

/** Estado efímero por montaje: no recibe respuestas, perfiles ni identificadores. */
export function crearAnalyticsVocacional(
  test: TestVocacional,
  total: number,
  emitir: (evento: EventoVocacional, datos: DatosVocacional) => void,
) {
  let iniciado = false;
  let completado = false;
  let salida = false;
  let respondidas = 0;
  let montaje = 0;
  const alcanzadas = new Set<number>();
  function enviar(evento: EventoVocacional, extra: Partial<Pick<DatosVocacional, 'destino' | 'etapa'>> = {}) {
    try {
      emitir(evento, { test, pregunta: Math.min(respondidas + 1, total), respondidas, total, ...extra });
    } catch { /* Una falla de medición no interrumpe el test. */ }
  }
  function pregunta() {
    if (respondidas >= total || alcanzadas.has(respondidas)) return;
    alcanzadas.add(respondidas);
    enviar('vocacional-pregunta');
  }
  function iniciar() {
    if (iniciado) return;
    iniciado = true;
    enviar('vocacional-iniciado');
    pregunta();
  }
  function salir() {
    if (!iniciado || completado || salida) return;
    salida = true;
    enviar('vocacional-salida');
  }
  return {
    iniciar,
    avanzar(cantidad: number) {
      iniciar();
      respondidas = Math.max(0, Math.min(total, cantidad));
      if (respondidas === total) {
        if (!completado) { completado = true; enviar('vocacional-completado'); }
      } else pregunta();
    },
    volver(cantidad: number) {
      if (!iniciado || completado) return;
      respondidas = Math.max(0, Math.min(total - 1, cantidad));
      enviar('vocacional-retroceso');
      pregunta();
    },
    reiniciar() {
      if (iniciado) enviar('vocacional-reiniciado');
      iniciado = false; completado = false; salida = false; respondidas = 0;
      alcanzadas.clear();
    },
    cta(destino: DestinoVocacional) {
      if (iniciado) enviar('vocacional-cta', { destino, etapa: completado ? 'resultado' : 'preguntas' });
    },
    salir,
    conectar(ventana: Pick<Window, 'addEventListener' | 'removeEventListener'>) {
      const actual = ++montaje;
      const alSalir = (evento: Event) => {
        // BFCache conserva el intento; cambiar de pestaña tampoco es una salida.
        if (!(evento as PageTransitionEvent).persisted) salir();
      };
      ventana.addEventListener('pagehide', alSalir);
      return () => {
        ventana.removeEventListener('pagehide', alSalir);
        // El remontaje inmediato de StrictMode invalida esta limpieza simulada.
        queueMicrotask(() => { if (actual === montaje) salir(); });
      };
    },
  };
}
