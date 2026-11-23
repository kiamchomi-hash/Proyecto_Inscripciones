'use client';

import { useCallback, useEffect, useState } from 'react';
import TurnstileWidget from '@/components/turnstile-widget';
import { EMAIL_VALIDO, TELEFONO_VALIDO } from '@/components/formularios/casas';
import { avisarConsultaEnviada } from '@/lib/analytics';

/**
 * Formulario corto del lateral de la ficha: nombre, apellido y un solo dato de
 * contacto, mail o teléfono, el que la persona prefiera dejar.
 *
 * Manda lo mismo que el formulario de contacto de la página —`kind: 'consulta'`
 * al mismo endpoint, con la carrera de esta ficha ya puesta— así que el lead
 * llega con su contexto y pasa por el mismo aviso y el mismo captcha. No manda
 * `newsletter`: sin la casilla a la vista no hay consentimiento.
 *
 * El dato único se separa al enviar: lo que tiene arroba va como `email` y el
 * resto como `telefono`. El servidor ya acepta uno u otro —la regla de contacto
 * es «mail o teléfono», no los dos— y la ficha guarda cada valor en su columna,
 * así el aviso y el mail de precios siguen funcionando igual.
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
  const [valores, setValores] = useState({ nombre: '', apellido: '', contacto: '' });
  const [token, setToken] = useState('');
  const [pidiendoToken, setPidiendoToken] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState('');

  const cambiar = (campo: keyof typeof valores) => (evento: React.ChangeEvent<HTMLInputElement>) =>
    setValores(previos => ({ ...previos, [campo]: evento.target.value }));

  // Las dos reglas son las del servidor: así nunca rebota un dato que acá se dio
  // por bueno. Un teléfono de menos de 8 dígitos o un texto suelto no pasan.
  const contacto = valores.contacto.trim();
  const esMail = EMAIL_VALIDO.test(contacto);
  const esTelefono = contacto.replace(/\D/g, '').length >= 8 && TELEFONO_VALIDO.test(contacto);
  const completo = valores.nombre.trim() !== '' && valores.apellido.trim() !== ''
    && (esMail || esTelefono);

  const enviar = useCallback(async () => {
    if (enviando) return;
    setEnviando(true);
    setError('');
    const dato = valores.contacto.trim();
    const email = EMAIL_VALIDO.test(dato) ? dato : '';
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
            origen: 'inscripcion-rapida',
            carrera,
            carreraId,
            nombre: valores.nombre.trim(),
            apellido: valores.apellido.trim(),
            email,
            telefono: email ? '' : dato,
          },
        }),
      });
      if (!respuesta.ok) throw new Error(String(respuesta.status));
      avisarConsultaEnviada();
      setListo(true);
      setValores({ nombre: '', apellido: '', contacto: '' });
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
      setError('Completá nombre, apellido y tu mail o teléfono.');
      return;
    }
    if (!token) {
      setPidiendoToken(true);
      return;
    }
    void enviar();
  }

  return (
    <section className="career-form-rapido" aria-labelledby="career-form-rapido-titulo">
      <p className="career-form-rapido-titulo" id="career-form-rapido-titulo">Inscripción rápida</p>
      <form onSubmit={alEnviar} noValidate className={listo ? 'career-form-rapido-form--oculto' : undefined} inert={listo} aria-hidden={listo || undefined}>
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
          <span>Mail o Teléfono</span>
          {/* Un solo campo para las dos cosas: no hay un `type` que sirva para
              ambas, así que va texto con el teclado de mail, que conserva la
              arroba y los dígitos, y sin corrección ni mayúsculas automáticas
              porque lo que se escribe es un dato, no una frase. */}
          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            value={valores.contacto}
            onChange={cambiar('contacto')}
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
      {listo && (
        <div className="career-form-rapido-confirmacion" role="status">
          <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4L19 6" /></svg>
          <p className="career-form-rapido-aviso">Recibimos tus datos.</p>
        </div>
      )}
    </section>
  );
}
