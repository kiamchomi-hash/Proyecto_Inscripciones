'use client';

import { useEffect } from 'react';
import { EVENTO_CONSULTA_ENVIADA, trackEmbudoTeclab } from '@/lib/analytics';
import {
  PASOS_FICHA_TECLAB, SECCIONES_FICHA_TECLAB,
  crearMedicionTeclab, ctaDelEnlace, type PasoTeclab,
} from '@/lib/teclab-embudo';

/**
 * Recorrido de la ficha de una carrera de Teclab: hasta qué sección baja la
 * visita, en cuál se va sin hacer nada y desde dónde toca WhatsApp, inscribirse
 * u otra carrera. Se cuenta en `teclab_embudo` con `superficie = 'ficha'`.
 *
 * Una sección cuenta como alcanzada cuando queda en pantalla al menos
 * `PERMANENCIA_MS`; la sección «actual», para ubicar una CTA, es la última cuyo
 * borde pasó la mitad. Por selector y no por ref porque el formulario se
 * reemplaza al cargarse.
 *
 * Tocar «Quiero inscribirme» baja al formulario de la misma página: no termina
 * la visita. La terminan WhatsApp, otra carrera o enviar una consulta; irse
 * sin ninguna de esas cuenta como `cerrado` en la sección más honda vista.
 */
const PERMANENCIA_MS = 700;

export default function EmbudoFichaTeclab({ slug }: { slug: string }) {
  useEffect(() => {
    const ruta = `/carreras/${slug}`;
    const medicion = crearMedicionTeclab(
      (evento, paso) => trackEmbudoTeclab('ficha', slug, evento, paso),
      ['whatsapp', 'relacionada', 'consulta'],
    );
    const orden = (paso: PasoTeclab) => (PASOS_FICHA_TECLAB as readonly string[]).indexOf(paso);
    // La portada es la entrada: cuenta apenas carga, aunque la visita rebote.
    medicion.alcanzar('portada');
    let masHondo: PasoTeclab = 'portada';
    const visibleDesde = new Map<PasoTeclab, number>();

    // Una sección cuenta como vista cuando ocupa la pantalla durante
    // PERMANENCIA_MS: el salto suave de «Quiero inscribirme» al formulario
    // cruza el plan y las preguntas en un instante, y eso no es leerlas.
    const revisar = () => {
      const alto = window.innerHeight;
      const ahora = performance.now();
      for (const [paso, selector] of SECCIONES_FICHA_TECLAB) {
        const seccion = document.querySelector(selector);
        const caja = seccion?.getBoundingClientRect();
        if (!caja || caja.top >= alto * 0.85 || caja.bottom <= alto * 0.15) {
          visibleDesde.delete(paso);
          continue;
        }
        const desde = visibleDesde.get(paso);
        if (desde === undefined) visibleDesde.set(paso, ahora);
        else if (ahora - desde >= PERMANENCIA_MS) {
          medicion.alcanzar(paso);
          if (orden(paso) > orden(masHondo)) masHondo = paso;
        }
      }
    };

    // La sección «actual», para ubicar una CTA: la última cuyo borde pasó la
    // mitad de la pantalla. Se calcula en el momento del clic.
    const seccionActual = (): PasoTeclab => {
      let actual: PasoTeclab = 'portada';
      for (const [paso, selector] of SECCIONES_FICHA_TECLAB) {
        const caja = document.querySelector(selector)?.getBoundingClientRect();
        if (caja && caja.top < window.innerHeight / 2) actual = paso;
      }
      return actual;
    };

    let pendiente = false;
    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => { pendiente = false; revisar(); });
    };
    // Quien se queda quieto leyendo no dispara `scroll`: el reloj completa la
    // permanencia de la sección que ya está en pantalla.
    const reloj = window.setInterval(revisar, 400);

    const alHacerClic = (evento: MouseEvent) => {
      const objetivo = evento.target as Element | null;
      // Lo de adentro del modal de la carrera lo mide el modal.
      if (objetivo?.closest?.('dialog')) return;
      const enlace = objetivo?.closest?.('a[href]');
      const destino = enlace ? ctaDelEnlace(enlace.getAttribute('href') ?? '', ruta) : null;
      if (destino) medicion.cta(destino, seccionActual());
    };

    const alConsultar = () => medicion.cta('consulta', seccionActual());
    const alSalir = (evento: PageTransitionEvent) => {
      if (!evento.persisted) medicion.cerrar(masHondo);
    };

    revisar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    window.addEventListener('resize', alDesplazar, { passive: true });
    document.addEventListener('click', alHacerClic, true);
    window.addEventListener(EVENTO_CONSULTA_ENVIADA, alConsultar);
    window.addEventListener('pagehide', alSalir);
    return () => {
      window.clearInterval(reloj);
      window.removeEventListener('scroll', alDesplazar);
      window.removeEventListener('resize', alDesplazar);
      document.removeEventListener('click', alHacerClic, true);
      window.removeEventListener(EVENTO_CONSULTA_ENVIADA, alConsultar);
      window.removeEventListener('pagehide', alSalir);
    };
  }, [slug]);

  return null;
}
