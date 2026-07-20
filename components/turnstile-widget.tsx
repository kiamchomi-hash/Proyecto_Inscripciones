'use client';

import { useEffect, useRef } from 'react';
import { Turnstile } from 'react-turnstile';

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
};

export default function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const onVerifyRef = useRef(onVerify);

  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  useEffect(() => {
    if (!sitekey) onVerifyRef.current('rate-limit-only');
  }, [sitekey]);

  if (!sitekey) return null;

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
