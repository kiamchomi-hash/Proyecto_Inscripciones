'use client';

import { useState } from 'react';
import TurnstileWidget from '@/components/turnstile-widget';

/**
 * Formulario corto del lateral de la ficha: nombre, apellido, mail y teléfono.
 *
 * Manda lo mismo que el formulario de contacto de la página —`kind: 'consulta'`
 * al mismo endpoint, con la carrera de esta ficha ya puesta— así que el lead
 * llega con su contexto y pasa por el mismo aviso y el mismo captcha. No manda
 * `newsletter`: sin la casilla a la vista no hay consentimiento.
 */
export default function FormularioRapido({
  casa,
  carrera,
  carreraId,
}: {
  casa: 'teclab';
  carrera: string;
  carreraId: number;
}) {
  const [valores, setValores] = useState({ nombre: '', apellido: '', email: '', telefono: '' });
  const [token, setToken] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState('');

  const cambiar = (campo: keyof typeof valores) => (evento: React.ChangeEvent<HTMLInputElement>) =>
    setValores(previos => ({ ...previos, [campo]: evento.target.value }));

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valores.email.trim());
  const telefonoOk = valores.telefono.replace(/\D/g, '').length >= 8;
  const completo = valores.nombre.trim() !== '' && valores.apellido.trim() !== ''
    && emailOk && telefonoOk;

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    // El servidor acepta sólo uno de los dos contactos; acá se piden los dos
    // porque el pedido fue ese, y sin uno de ellos el envío no sale.
    if (!completo) {
      setError('Completá nombre, apellido, mail y teléfono.');
      return;
    }
    // El captcha invisible puede tardar: se avisa en vez de dejar el botón
    // apagado sin explicación.
    if (!token) {
      setError('Falta la verificación de seguridad. Esperá un segundo y probá de nuevo.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const respuesta = await fetch('/api/formularios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'consulta',
          token,
          payload: {
            casa,
            tipoFormulario: 'contacto',
            carrera,
            carreraId,
            nombre: valores.nombre.trim(),
            apellido: valores.apellido.trim(),
            email: valores.email.trim(),
            telefono: valores.telefono.trim(),
          },
        }),
      });
      if (!respuesta.ok) throw new Error(String(respuesta.status));
      setListo(true);
      setValores({ nombre: '', apellido: '', email: '', telefono: '' });
    } catch {
      setError('No pudimos enviarlo. Probá de nuevo o escribinos por WhatsApp.');
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <section className="career-form-rapido career-form-rapido--listo" aria-live="polite">
        <p className="career-form-rapido-titulo">Inscripción rápida</p>
        <p className="career-form-rapido-aviso">Recibimos tus datos.</p>
      </section>
    );
  }

  return (
    <section className="career-form-rapido" aria-labelledby="career-form-rapido-titulo">
      <p className="career-form-rapido-titulo" id="career-form-rapido-titulo">Inscripción rápida</p>
      <form onSubmit={enviar} noValidate>
        <div className="career-form-rapido-fila">
          <label>
            <span>Nombre</span>
            <input
              type="text"
              autoComplete="given-name"
              maxLength={60}
              value={valores.nombre}
              onChange={cambiar('nombre')}
            />
          </label>
          <label>
            <span>Apellido</span>
            <input
              type="text"
              autoComplete="family-name"
              maxLength={60}
              value={valores.apellido}
              onChange={cambiar('apellido')}
            />
          </label>
        </div>
        <label>
          <span>Mail</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            maxLength={254}
            value={valores.email}
            onChange={cambiar('email')}
          />
        </label>
        <label>
          <span>Teléfono</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={30}
            value={valores.telefono}
            onChange={cambiar('telefono')}
          />
        </label>
        <TurnstileWidget
          marca={casa}
          invisible
          onVerify={setToken}
          onExpire={() => setToken('')}
        />
        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar'}
        </button>
        {error && <p className="career-form-rapido-error" role="alert">{error}</p>}
      </form>
    </section>
  );
}
