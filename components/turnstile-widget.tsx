'use client';

import { Turnstile } from 'react-turnstile';

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
};

export default function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  if (!sitekey) {
    return (
      <p className="w-full text-[11px] text-red-400">
        CAPTCHA no configurado.
      </p>
    );
  }

  return (
    <Turnstile
      sitekey={sitekey}
      onVerify={onVerify}
      onExpire={onExpire}
      theme="dark"
      size="flexible"
    />
  );
}
