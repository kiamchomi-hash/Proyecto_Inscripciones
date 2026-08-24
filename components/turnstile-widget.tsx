'use client';

import { useEffect, useRef, useState } from 'react';

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
};

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

export default function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
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

    const renderWidget = () => {
      if (cancelled || widgetId || !turnstileWindow.turnstile) return;

      widgetId = turnstileWindow.turnstile.render(container, {
        sitekey,
        callback: (token) => onVerifyRef.current(token),
        'expired-callback': () => onExpireRef.current?.(),
        theme: 'dark',
        size: 'flexible',
      });
      setMontado(true);
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
          className="absolute inset-0 flex items-center justify-between gap-3 rounded-lg border border-[var(--catalogo-acento)]/25 bg-[var(--catalogo-form-campo)] px-4"
        >
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--catalogo-etiqueta)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--catalogo-acento)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Verificación de seguridad
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/imagenes/imagenes_cau/siglo21-marca.svg"
            alt=""
            className="h-6 w-auto opacity-40"
          />
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
