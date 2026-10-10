'use client';

import { useEffect, useRef, useState } from 'react';
import IsotipoIA from '@/components/index/ia-isotipo';

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  /**
   * Qué marca lleva el marcador mientras el widget carga. Se declara acá y no
   * se importa de `casas.ts` para que el widget siga sirviendo a la FAQ y a
   * clases de apoyo, que no tienen casa.
   */
  marca?: 'siglo21' | 'teclab' | 'identidad';
  /**
   * Modo invisible de Cloudflare (`interaction-only`): verifica por detras y
   * solo muestra el desafio si sospecha de un bot. Sin marcador ni lugar
   * reservado, porque casi nunca se ve nada.
   */
  invisible?: boolean;
};

/** La marca de la casa, para el marcador. Identidad va en su isotipo propio. */
function Marca({ marca }: { marca: 'siglo21' | 'teclab' | 'identidad' }) {
  if (marca === 'identidad') return <IsotipoIA className="h-6 w-auto opacity-70" />;
  const src = marca === 'teclab'
    ? '/imagenes/teclab/logo-teclab.webp'
    : '/imagenes/imagenes_cau/siglo21-marca.svg';
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-6 w-auto opacity-40" />;
}

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      theme: 'dark';
      size: 'flexible' | 'compact';
      appearance?: 'always' | 'execute' | 'interaction-only';
    },
  ) => string;
  remove: (widgetId: string) => void;
};

const SCRIPT_ID = 'cloudflare-turnstile-script';
const SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/**
 * Tope para sacar el marcador si el `load` del iframe nunca llega. Es largo a
 * propósito: es preferible que el marcador se quede de más antes que dejar el
 * hueco vacío que se ve cuando se lo saca antes de tiempo.
 */
const ESPERA_MAXIMA_MS = 10000;

/**
 * Cloudflare no deja bajar el tamaño `flexible` de 300 px: en un celular
 * angosto el widget se salía de la tarjeta y la página scrolleaba de costado.
 * Debajo de ese ancho se usa `compact`, que mide 150 × 140. El tamaño no se
 * puede cambiar en un widget ya dibujado: si el ancho cruza este límite, se
 * vuelve a dibujar.
 */
const ANCHO_MINIMO_FLEXIBLE = 300;

export default function TurnstileWidget({ onVerify, onExpire, marca = 'siglo21', invisible = false }: TurnstileWidgetProps) {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  // Lo que se mide es el envoltorio y no el contenedor: en modo compacto el
  // envoltorio centra con flex y el contenedor se encoge al ancho del widget.
  const envoltorioRef = useRef<HTMLDivElement>(null);
  // Mientras Cloudflare no pintó el iframe, su lugar reservado es un hueco
  // vacío que aleja al botón de los datos. El marcador lo ocupa hasta que el
  // iframe termina de cargar; recién entonces se revela el widget.
  const [montado, setMontado] = useState(false);
  const [compacto, setCompacto] = useState(false);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  }, [onExpire, onVerify]);

  useEffect(() => {
    if (!sitekey) {
      if (process.env.NODE_ENV === 'development' &&
          process.env.NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL === '1') {
        onVerifyRef.current('rate-limit-only');
      }
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const turnstileWindow = window as Window & { turnstile?: TurnstileApi };
    let widgetId: string | undefined;
    let cancelled = false;
    let observer: MutationObserver | undefined;
    let medidor: ResizeObserver | undefined;
    let compactoActual: boolean | undefined;
    let tope: ReturnType<typeof setTimeout> | undefined;
    let iframeEsperado: HTMLIFrameElement | null = null;

    const listo = () => {
      if (cancelled) return;
      observer?.disconnect();
      if (tope) clearTimeout(tope);
      iframeEsperado?.removeEventListener('load', listo);
      setMontado(true);
    };

    // `render()` vuelve antes de que el iframe tenga contenido: sacar el
    // marcador ahí deja el hueco vacío justo el rato que tarda en pintarse.
    // Se espera al `load` del iframe, que Cloudflare crea dentro del contenedor
    // un momento después.
    const engancharIframe = () => {
      const iframe = container.querySelector('iframe');
      if (!iframe) return false;
      iframeEsperado = iframe;
      iframe.addEventListener('load', listo, { once: true });
      return true;
    };

    const esperarAlIframe = () => {
      // También cubre el iframe que render() insertó sincrónicamente.
      tope = setTimeout(listo, ESPERA_MAXIMA_MS);
      if (engancharIframe()) return;
      observer = new MutationObserver(() => {
        if (engancharIframe()) observer?.disconnect();
      });
      observer.observe(container, { childList: true, subtree: true });
    };

    const medirCompacto = () =>
      (envoltorioRef.current ?? container).clientWidth < ANCHO_MINIMO_FLEXIBLE;

    const renderWidget = () => {
      if (cancelled || widgetId || !turnstileWindow.turnstile) return;

      const esCompacto = medirCompacto();
      compactoActual = esCompacto;
      setCompacto(esCompacto);
      widgetId = turnstileWindow.turnstile.render(container, {
        sitekey,
        callback: (token) => onVerifyRef.current(token),
        'expired-callback': () => onExpireRef.current?.(),
        theme: 'dark',
        size: esCompacto ? 'compact' : 'flexible',
        ...(invisible ? { appearance: 'interaction-only' as const } : {}),
      });
      esperarAlIframe();
    };

    // El tamaño se elige al dibujar. Si la ventana cambia de ancho después
    // (girar el celular, achicar el navegador) y cruza el límite, el widget
    // quedaba trabado en el tamaño equivocado: compacto en un lugar ancho.
    const redibujarSiCambio = () => {
      if (cancelled || !widgetId || !turnstileWindow.turnstile) return;
      if (medirCompacto() === compactoActual) return;
      turnstileWindow.turnstile.remove(widgetId);
      widgetId = undefined;
      observer?.disconnect();
      if (tope) clearTimeout(tope);
      iframeEsperado?.removeEventListener('load', listo);
      // El token del widget anterior se descarta con él.
      onExpireRef.current?.();
      setMontado(false);
      renderWidget();
    };

    if (typeof ResizeObserver !== 'undefined') {
      medidor = new ResizeObserver(redibujarSiCambio);
      medidor.observe(envoltorioRef.current ?? container);
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (turnstileWindow.turnstile) {
      renderWidget();
    } else if (script) {
      script.addEventListener('load', renderWidget, { once: true });
    } else {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', renderWidget, { once: true });
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      medidor?.disconnect();
      observer?.disconnect();
      if (tope) clearTimeout(tope);
      iframeEsperado?.removeEventListener('load', listo);
      script?.removeEventListener('load', renderWidget);
      if (widgetId && turnstileWindow.turnstile) {
        turnstileWindow.turnstile.remove(widgetId);
      }
    };
  }, [sitekey, invisible]);

  if (!sitekey) return null;

  // Invisible: el contenedor queda vacio y solo crece si Cloudflare tiene que
  // mostrar el desafio.
  if (invisible) return <div ref={containerRef} className="flex justify-center" />;

  // El iframe del widget mide 71 px al montar (medido en prod, desktop y mobile);
  // sin reservar ese lugar, todo lo que está debajo salta cuando aparece. El
  // compacto mide 140 px y va centrado.
  return (
    <div ref={envoltorioRef} className={compacto ? 'relative flex min-h-[140px] justify-center' : 'relative min-h-[71px]'}>
      {!montado && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-3 border border-[var(--catalogo-acento)]/25 bg-[var(--catalogo-form-campo)] px-4"
        >
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--catalogo-etiqueta)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--catalogo-acento)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Verificación de seguridad
          </span>
          <Marca marca={marca} />
        </div>
      )}
      {/* Ocultar el iframe evita que se vea a través de fondos transparentes. */}
      <div ref={containerRef} style={{ visibility: montado ? 'visible' : 'hidden', opacity: montado ? 1 : 0 }} />
    </div>
  );
}
