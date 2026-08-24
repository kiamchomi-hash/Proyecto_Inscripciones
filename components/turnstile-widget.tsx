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
      size: 'flexible';
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

export default function TurnstileWidget({ onVerify, onExpire, marca = 'siglo21' }: TurnstileWidgetProps) {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  // Mientras Cloudflare no pintó el iframe, su lugar reservado es un hueco
  // vacío que aleja al botón de los datos. El marcador lo ocupa hasta que el
  // widget llega y lo tapa.
  const [montado, setMontado] = useState(false);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  }, [onExpire, onVerify]);

  useEffect(() => {
    if (!sitekey) {
      onVerifyRef.current('rate-limit-only');
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const turnstileWindow = window as Window & { turnstile?: TurnstileApi };
    let widgetId: string | undefined;
    let cancelled = false;
    let observer: MutationObserver | undefined;
    let tope: ReturnType<typeof setTimeout> | undefined;

    const listo = () => {
      if (cancelled) return;
      setMontado(true);
    };

    // `render()` vuelve antes de que el iframe tenga contenido: sacar el
    // marcador ahí deja el hueco vacío justo el rato que tarda en pintarse.
    // Se espera al `load` del iframe, que Cloudflare crea dentro del contenedor
    // un momento después.
    const engancharIframe = () => {
      const iframe = container.querySelector('iframe');
      if (!iframe) return false;
      iframe.addEventListener('load', listo, { once: true });
      return true;
    };

    const esperarAlIframe = () => {
      if (engancharIframe()) return;
      observer = new MutationObserver(() => {
        if (engancharIframe()) observer?.disconnect();
      });
      observer.observe(container, { childList: true, subtree: true });
      tope = setTimeout(listo, ESPERA_MAXIMA_MS);
    };

    const renderWidget = () => {
      if (cancelled || widgetId || !turnstileWindow.turnstile) return;

      widgetId = turnstileWindow.turnstile.render(container, {
        sitekey,
        callback: (token) => onVerifyRef.current(token),
        'expired-callback': () => onExpireRef.current?.(),
        theme: 'dark',
        size: 'flexible',
      });
      esperarAlIframe();
    };

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
      observer?.disconnect();
      if (tope) clearTimeout(tope);
      script?.removeEventListener('load', renderWidget);
      if (widgetId && turnstileWindow.turnstile) {
        turnstileWindow.turnstile.remove(widgetId);
      }
    };
  }, [sitekey]);

  if (!sitekey) return null;

  // El iframe del widget mide 71 px al montar (medido en prod, desktop y mobile);
  // sin reservar ese lugar, todo lo que está debajo salta cuando aparece.
  return (
    <div className="relative min-h-[71px]">
      {!montado && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 border border-[var(--catalogo-acento)]/25 bg-[var(--catalogo-form-campo)] px-4"
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
      <div ref={containerRef} />
    </div>
  );
}
