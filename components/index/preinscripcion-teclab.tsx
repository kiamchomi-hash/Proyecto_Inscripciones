'use client';

// Preinscripción dentro del modal de Teclab: el slide que sigue al precio
// (27/11/2026). Es el mismo envío que la preinscripción de la página
// (`kind: 'consulta'`, `tipoFormulario: 'preinscripcion'`, casa teclab), con
// los mismos cinco datos de `CASAS.teclab.preinscripcion`.
//
// Pensado para que se complete ahí mismo, sin inventar nada:
// - El mail y el celular que dejó para ver el precio ya están: se muestran
//   tildados y sólo quedan nombre, apellido y provincia. Ver lo hecho empuja a
//   terminar lo que falta.
// - Un solo botón, grande, y WhatsApp como salida chica para quien prefiere
//   hablar antes.

import { useCallback, useEffect, useId, useState, type CSSProperties, type FormEvent } from 'react';
import TurnstileWidget from '@/components/turnstile-widget';
import { CAMPOS, EMAIL_VALIDO, TELEFONO_VALIDO } from '@/components/formularios/casas';
import { avisarConsultaEnviada } from '@/lib/analytics';
import { contactoGuardado } from './ver-precio-teclab';

const PROVINCIAS = CAMPOS.provinciaTeclab.opciones ?? [];

/** Cuánto se espera el token del captcha antes de avisar y pedir otro. */
const ESPERA_TOKEN_MS = 15000;

const NOMBRE_CAMPO = {
  nombre: 'el nombre',
  apellido: 'el apellido',
  provincia: 'la provincia',
  email: 'un mail válido',
  telefono: 'un celular válido',
} as const;

/** «Completá el nombre y la provincia.»: qué falta, con sus nombres. */
function mensajeFaltantes(campos: string[]): string {
  if (campos.length <= 1) return `Completá ${campos[0] ?? 'los datos'}.`;
  return `Completá ${campos.slice(0, -1).join(', ')} y ${campos[campos.length - 1]}.`;
}
const ETIQUETAS = CAMPOS.provinciaTeclab.etiquetasOpciones ?? {};

function Tilde() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12l4 4L19 6" />
    </svg>
  );
}

/** Orden en que se ven los campos: el foco va al primero que falte. */
const ORDEN_CAMPOS = ['email', 'telefono', 'nombre', 'apellido', 'provincia'] as const;

export default function PreinscripcionTeclab({
  carrera,
  carreraId,
  nombreCarrera,
  activo,
  acento,
  acentoClaro,
  textoAcento,
  waHref,
  onEnviada,
}: {
  /** Nombre completo, como lo guarda la base: es lo que viaja en `carrera`. */
  carrera: string;
  carreraId: number;
  nombreCarrera: string;
  activo: boolean;
  acento: string;
  acentoClaro: string;
  textoAcento: string;
  waHref: string;
  onEnviada?: () => void;
}) {
  // El mail y el celular se leen cada vez que el slide se ve: el paso del
  // precio los guarda recién cuando lo muestra.
  const [contacto, setContacto] = useState(() => contactoGuardado());
  // Una vez que los toca, no se pisan con lo guardado.
  const [contactoTocado, setContactoTocado] = useState(false);
  const [valores, setValores] = useState({ nombre: '', apellido: '', provincia: '' });
  const [token, setToken] = useState('');
  const [captchaKey, setCaptchaKey] = useState(0);
  const [visitado, setVisitado] = useState(activo);
  if (activo && !visitado) setVisitado(true);
  const [esperandoToken, setEsperandoToken] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [intentado, setIntentado] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);
  const ids = { nombre: useId(), apellido: useId(), provincia: useId(), email: useId(), telefono: useId(), titulo: useId(), faltantes: useId() };

  useEffect(() => {
    if (activo && !contactoTocado) setContacto(contactoGuardado());
  }, [activo, contactoTocado]);

  const email = contacto.email.trim();
  const telefono = contacto.telefono.trim();
  const emailValido = EMAIL_VALIDO.test(email);
  const telefonoValido = telefono.replace(/\D/g, '').length >= 8 && TELEFONO_VALIDO.test(telefono);
  const faltan = {
    nombre: !valores.nombre.trim(),
    apellido: !valores.apellido.trim(),
    provincia: !valores.provincia,
    email: !emailValido,
    telefono: !telefonoValido,
  };
  const completo = !Object.values(faltan).some(Boolean);

  // Envío con datos que faltan: el foco va al primero, en el orden en que se
  // ven. Va en un efecto y no en el submit para que el campo ya tenga su
  // aria-invalid y su mensaje cuando el lector de pantalla lo anuncie.
  // `preventScroll` para no correr el carrusel.
  const [pedidoFoco, setPedidoFoco] = useState(0);
  useEffect(() => {
    if (!pedidoFoco) return;
    const primero = ORDEN_CAMPOS.find(c => faltan[c]);
    if (primero) document.getElementById(ids[primero])?.focus({ preventScroll: true });
    // Sólo cuando se pide; faltan e ids se leen del render que lo pidió.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidoFoco]);

  const enviar = useCallback(async () => {
    if (enviando) return;
    setEnviando(true);
    // Con el token en mano termina la espera: el plazo del captcha no corre
    // durante el POST.
    setEsperandoToken(false);
    setError('');
    let status: number | null = null;
    try {
      const respuesta = await fetch('/api/formularios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'consulta',
          token,
          payload: {
            casa: 'teclab',
            tipoFormulario: 'preinscripcion',
            nombre: valores.nombre.trim(),
            apellido: valores.apellido.trim(),
            email,
            telefono,
            provinciaTeclab: valores.provincia,
            carrera,
            tipo: null,
            carreraId,
            newsletter: false,
          },
        }),
      });
      status = respuesta.status;
      if (!respuesta.ok) throw new Error(String(status));
      avisarConsultaEnviada();
      setListo(true);
      onEnviada?.();
    } catch {
      setError(status === 429
        ? 'Recibimos varias consultas desde tu conexión. Esperá unos minutos o escribinos por WhatsApp.'
        : 'No pudimos enviarlo. Probá de nuevo o escribinos por WhatsApp.');
      // El token es de un solo uso: se pide otro.
      setToken('');
      setCaptchaKey(k => k + 1);
    } finally {
      setEnviando(false);
      setEsperandoToken(false);
    }
  }, [carrera, carreraId, email, enviando, onEnviada, telefono, token, valores]);

  // Tocado antes de que llegue el token: sale solo cuando llega. Los campos
  // quedan bloqueados mientras tanto, y igual se vuelve a validar: lo que sale
  // es lo que se validó.
  useEffect(() => {
    if (!esperandoToken || !token) return;
    if (completo) void enviar();
    else setEsperandoToken(false);
  }, [esperandoToken, token, enviar, completo]);

  // Si el captcha no entrega el token (script bloqueado, red caída), no se
  // espera para siempre: se avisa, se pide otro y el botón vuelve.
  useEffect(() => {
    if (!esperandoToken) return;
    const plazo = setTimeout(() => {
      setEsperandoToken(false);
      setError('No pudimos verificar el envío. Probá de nuevo o escribinos por WhatsApp.');
      setCaptchaKey(k => k + 1);
    }, ESPERA_TOKEN_MS);
    return () => clearTimeout(plazo);
  }, [esperandoToken]);

  function alEnviar(e: FormEvent) {
    e.preventDefault();
    setIntentado(true);
    if (!completo) {
      setPedidoFoco(n => n + 1);
      return;
    }
    if (!token) {
      setEsperandoToken(true);
      return;
    }
    void enviar();
  }

  const cambiar = (campo: keyof typeof valores) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValores(v => ({ ...v, [campo]: e.target.value }));
      setError('');
    };

  const cambiarContacto = (campo: 'email' | 'telefono') =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setContactoTocado(true);
      setContacto(c => ({ ...c, [campo]: e.target.value }));
      setError('');
    };

  const estilos = {
    '--vp-acento': acento,
    '--vp-acento-claro': acentoClaro,
    '--vp-texto-acento': textoAcento,
    '--catalogo-acento': acento,
  } as CSSProperties;

  if (listo) {
    return (
      <section className="pt-contenido pt-listo" style={estilos} role="status">
        <span className="pt-listo-icono"><Tilde /></span>
        <p className="pt-listo-titulo">Preinscripción enviada</p>
        <p className="pt-listo-texto">Nos comunicamos a la brevedad.</p>
        <a href={waHref} target="_blank" rel="noopener nofollow" className="vp-whatsapp vp-whatsapp-lleno">
          Escribinos por WhatsApp
        </a>
      </section>
    );
  }

  const invalido = (campo: keyof typeof faltan) => intentado && faltan[campo];
  // El campo marcado apunta al resumen de lo que falta, que es su mensaje.
  const descripcion = (campo: keyof typeof faltan) => (invalido(campo) ? ids.faltantes : undefined);

  return (
    <section className="pt-contenido" style={estilos} aria-labelledby={ids.titulo}>
      <p className="pt-paso">Último paso</p>
      {/* Sin título a la vista (27/11/2026): el botón ya dice «Preinscribirme».
          Queda para el lector de pantalla. */}
      <h3 id={ids.titulo} className="sr-only">Preinscripción a {nombreCarrera}</h3>

      <form className="pt-form" onSubmit={alEnviar} noValidate>
        {/* Bloqueado mientras se envía: lo que sale es lo que se validó. */}
        <fieldset className="pt-campos" disabled={enviando || esperandoToken}>
        {/* Ya completos con lo que dejó para ver el precio, editables, y con
            un tilde adentro mientras el dato sea válido. */}
        <div className="pt-fila">
          <label className="pt-campo" htmlFor={ids.email}>
            <span className="vp-etiqueta">{CAMPOS.email.label}</span>
            <span className="pt-con-tilde">
              <input
                id={ids.email} type="email" inputMode="email" autoComplete="email"
                maxLength={CAMPOS.email.max} placeholder={CAMPOS.email.placeholder}
                value={contacto.email}
                onChange={cambiarContacto('email')}
                aria-invalid={invalido('email')} aria-describedby={descripcion('email')} required
                className="vp-campo"
              />
              {emailValido && <span className="pt-tilde"><Tilde /></span>}
            </span>
          </label>
          <label className="pt-campo" htmlFor={ids.telefono}>
            <span className="vp-etiqueta">Celular</span>
            <span className="pt-con-tilde">
              <input
                id={ids.telefono} type="tel" inputMode="tel" autoComplete="tel"
                maxLength={CAMPOS.telefono.max} placeholder={CAMPOS.telefono.placeholder}
                value={contacto.telefono}
                onChange={cambiarContacto('telefono')}
                aria-invalid={invalido('telefono')} aria-describedby={descripcion('telefono')} required
                className="vp-campo"
              />
              {telefonoValido && <span className="pt-tilde"><Tilde /></span>}
            </span>
          </label>
        </div>

        <div className="pt-fila">
          <label className="pt-campo" htmlFor={ids.nombre}>
            <span className="vp-etiqueta">Nombre</span>
            <input
              id={ids.nombre} type="text" autoComplete="given-name" maxLength={CAMPOS.nombre.max}
              value={valores.nombre} onChange={cambiar('nombre')}
              aria-invalid={invalido('nombre')} aria-describedby={descripcion('nombre')} required className="vp-campo"
            />
          </label>
          <label className="pt-campo" htmlFor={ids.apellido}>
            <span className="vp-etiqueta">Apellido</span>
            <input
              id={ids.apellido} type="text" autoComplete="family-name" maxLength={CAMPOS.apellido.max}
              value={valores.apellido} onChange={cambiar('apellido')}
              aria-invalid={invalido('apellido')} aria-describedby={descripcion('apellido')} required className="vp-campo"
            />
          </label>
        </div>

        <label className="pt-campo" htmlFor={ids.provincia}>
          <span className="vp-etiqueta">Provincia</span>
          <select
            id={ids.provincia} autoComplete="address-level1" value={valores.provincia} onChange={cambiar('provincia')}
            aria-invalid={invalido('provincia')} aria-describedby={descripcion('provincia')} required className="vp-campo"
          >
            <option value="" disabled>Elegí tu provincia</option>
            {PROVINCIAS.map(p => <option key={p} value={p}>{ETIQUETAS[p] ?? p}</option>)}
          </select>
        </label>
        </fieldset>

        {/* Invisible: se monta la primera vez que se ve el slide, así el token
            ya está cuando la persona termina de completar. */}
        {visitado && (
          <TurnstileWidget
            key={captchaKey}
            marca="teclab"
            invisible
            onVerify={setToken}
            onExpire={() => setToken('')}
          />
        )}

        <button
          type="submit"
          className="vp-primario pt-enviar"
          disabled={enviando || esperandoToken}
          aria-busy={enviando || esperandoToken}
        >
          {enviando || esperandoToken ? 'Enviando…' : 'Preinscribirme'}
        </button>
        {intentado && !completo && (
          <p id={ids.faltantes} className="pt-error" role="alert">
            {mensajeFaltantes((Object.keys(faltan) as (keyof typeof faltan)[]).filter(c => faltan[c]).map(c => NOMBRE_CAMPO[c]))}
          </p>
        )}
        {error && <p className="pt-error" role="alert">{error}</p>}
      </form>

      <a href={waHref} target="_blank" rel="noopener nofollow" className="pt-whatsapp">
        Prefiero consultar por WhatsApp
      </a>
    </section>
  );
}
