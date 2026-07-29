'use client';

import { useEffect, useRef } from 'react';

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
  return <div ref={containerRef} className="min-h-[71px]" />;
}
