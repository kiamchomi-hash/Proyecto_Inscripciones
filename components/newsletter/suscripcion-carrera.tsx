'use client';

import { FormEvent, useState } from 'react';
import TurnstileWidget from '@/components/turnstile-widget';

interface Props {
  carreraId: number;
  carreraNombre: string;
}

export default function SuscripcionCarrera({ carreraId, carreraNombre }: Props) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [estado, setEstado] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle');

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !email) return;
    setEstado('enviando');
    try {
      const response = await fetch('/api/formularios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'newsletter',
          token,
          payload: { email, carrera_id: carreraId, carrera_nombre: carreraNombre },
        }),
      });
      setEstado(response.ok ? 'ok' : 'error');
      if (response.ok) setEmail('');
    } catch {
      setEstado('error');
    }
  }

  return (
    <section className="career-newsletter" aria-labelledby="newsletter-carrera-titulo">
      <div>
        <p className="career-newsletter-eyebrow">Novedades de esta carrera</p>
        <h2 id="newsletter-carrera-titulo">Enterate cuando abra una nueva inscripción</h2>
        <p>Recibí las fechas importantes y escribinos por WhatsApp cuando quieras avanzar.</p>
      </div>
      {estado === 'ok' ? (
        <p className="career-newsletter-feedback" role="status">
          Listo. Te vamos a avisar sobre {carreraNombre}.
        </p>
      ) : (
        <form onSubmit={enviar} className="career-newsletter-form">
          <label htmlFor="newsletter-email">Tu email</label>
          <div className="career-newsletter-fields">
            <input
              id="newsletter-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
            <button type="submit" disabled={estado === 'enviando' || !token}>
              {estado === 'enviando' ? 'Guardando…' : 'Quiero recibir avisos'}
            </button>
          </div>
          <TurnstileWidget onVerify={setToken} onExpire={() => setToken('')} />
          {estado === 'error' && <p className="career-newsletter-error" role="alert">No pudimos guardar la suscripción. Intentá de nuevo.</p>}
        </form>
      )}
    </section>
  );
}
