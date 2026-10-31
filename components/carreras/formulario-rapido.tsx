'use client';

import { useCallback, useEffect, useState } from 'react';
import TurnstileWidget from '@/components/turnstile-widget';

/**
 * Formulario corto del lateral de la ficha: nombre, apellido, mail y teléfono.
 *
 * Manda lo mismo que el formulario de contacto de la página —`kind: 'consulta'`
 * al mismo endpoint, con la carrera de esta ficha ya puesta— así que el lead
 * llega con su contexto y pasa por el mismo aviso y el mismo captcha. No manda
 * `newsletter`: sin la casilla a la vista no hay consentimiento.
 *
 * El captcha se monta recién al primer «Enviar»: en la tarjeta angosta, el
 * widget visible desarmaba la composición, y en el caso normal (verificación
 * invisible) no hace falta mostrarlo mientras se completa.
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
  const [pidiendoToken, setPidiendoToken] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState('');

  const cambiar = (campo: keyof typeof valores) => (evento: React.ChangeEvent<HTMLInputElement>) =>
    setValores(previos => ({ ...previos, [campo]: evento.target.value }));

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valores.email.trim());
  const telefonoOk = valores.telefono.replace(/\D/g, '').length >= 8;
  const completo = valores.nombre.trim() !== '' && valores.apellido.trim() !== ''
    && emailOk && telefonoOk;

  const enviar = useCallback(async () => {
    if (enviando) return;
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
      // El token es de un solo uso: el próximo intento pide uno nuevo.
      setToken('');
      setPidiendoToken(false);
    } finally {
      setEnviando(false);
    }
  }, [casa, carrera, carreraId, enviando, token, valores]);

  // Con el token en mano —lo trae el captcha recién montado— sale el envío.
  useEffect(() => {
    if (pidiendoToken && token) void enviar();
  }, [pidiendoToken, token, enviar]);

  function alEnviar(evento: React.FormEvent) {
    evento.preventDefault();
    if (enviando) return;
    if (!completo) {
      setError('Completá nombre, apellido, mail y teléfono.');
      return;
    }
    if (!token) {
      setPidiendoToken(true);
      return;
    }
    void enviar();
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
      <form onSubmit={alEnviar} noValidate>
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
        {pidiendoToken && !token && (
          <div className="career-form-rapido-captcha">
            <TurnstileWidget
              marca={casa}
              invisible
              onVerify={setToken}
              onExpire={() => setToken('')}
            />
          </div>
        )}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando…' : 'Enviar'}
        </button>
        {error && <p className="career-form-rapido-error" role="alert">{error}</p>}
      </form>
    </section>
  );
}
