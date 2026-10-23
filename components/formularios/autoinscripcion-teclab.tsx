'use client';

// Confirmación de preinscripción compartida por los formularios y el enlace.
// El estado vive en `formulario-lead.tsx` o `inscripcion-enlace.tsx`; acá sólo
// se pintan los pasos y la confirmación del enlace.
//
// Los recorridos están en `odd/tasks/autoinscripcion-teclab.md`. Desde el
// 03/10/2026 no hay paso de medio de pago: el portal del alumno pide la
// tarjeta y decide la financiación solo, así que preguntarlo acá era un paso
// de más. La entrada directa (`?inscripcion=auto`) envía desde los datos; la
// normal confirma la preinscripción sin otro envío ni decisiones intermedias.

import { type FormEvent, type ReactNode } from 'react';
import TurnstileWidget from '@/components/turnstile-widget';
import { WhatsAppIcon } from '@/components/icons';

// Sin sesión, el portal redirige a /login?redirect=%2Fpayments%2Fselect y,
// al entrar, vuelve a la pantalla de pago. Falta probarlo con una cuenta que
// entre por primera vez (cambio de contraseña y términos en el medio).
export const PORTAL_ALUMNO_TECLAB = 'https://portalalumno.teclab.edu.ar/payments/select';

const BOTON_PRINCIPAL = 'w-full cursor-pointer rounded-lg py-2 text-sm font-black uppercase tracking-widest transition-all hover:brightness-110 hover:shadow-[0_6px_18px_rgba(var(--catalogo-acento-rgb),0.35)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 disabled:hover:shadow-none';
const ESTILO_PRINCIPAL = { background: 'linear-gradient(90deg, var(--catalogo-acento), var(--catalogo-acento-oscuro))', color: 'var(--catalogo-acento-tinta)', letterSpacing: '0.12em' };

/** Lo que se muestra si se aprieta antes de que el captcha invisible devuelva el token. */
export const AVISO_TOKEN = 'Estamos verificando la conexión. Probá de nuevo en un segundo.';

/** Lo que se muestra con el captcha visible: el pase no sirvió o no lo hubo. */
export const AVISO_VERIFICAR = 'Volvé a verificar la seguridad y enviá la solicitud.';

/**
 * La confirmación de la autoinscripción: «Inscribirme», con el captcha
 * invisible que firma el envío del enlace, debajo de los datos precargados.
 */
/**
 * Inscribirse no cobra nada: el portal genera el ticket y la persona paga
 * después, en «Pagos en línea». Va debajo de cada botón «Inscribirme», salvo
 * en la página dedicada: ahí lo dicen los próximos pasos, debajo del formulario.
 */
export function AvisoSinPago() {
  return (
    <p className="text-center text-[11px] leading-snug text-[var(--catalogo-texto-suave)]">
      Al tocar Inscribirme todavía no pagás nada. Se genera un ticket y lo pagás después desde el portal del alumno de Teclab.
    </p>
  );
}

export function PasoInscribirme({
  pregunta, intentado, enviando, error, captcha = true, captchaVisible = false, captchaKey, token, onToken, onEnviar,
}: {
  pregunta: boolean;
  intentado: boolean;
  enviando: boolean;
  error: string;
  /**
   * Si monta el captcha. En el carrusel lo monta sólo el panel activo: el
   * vencimiento de un widget que sobra borraría el token del que envía.
   */
  captcha?: boolean;
  /**
   * El captcha a la vista, con su casilla. Lo usa el carrusel cuando no tiene
   * el pase de la preinscripción o el servidor lo rechazó: ahí la persona
   * tiene que saber qué resolver. El enlace sigue con el invisible.
   */
  captchaVisible?: boolean;
  captchaKey: number;
  token: string;
  onToken: (token: string) => void;
  onEnviar: () => void;
}) {
  const aviso = error
    ? <span className="text-red-400">{error}</span>
    : captcha && intentado && !token
      ? <span className="text-amber-300">{captchaVisible ? AVISO_VERIFICAR : AVISO_TOKEN}</span>
      : null;
  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (!enviando) onEnviar();
  };

  return (
    <form onSubmit={enviar} noValidate className="flex grow flex-col">
      {pregunta && (
        <h3 data-paso-foco tabIndex={-1} className="px-3 pt-5 text-center text-2xl font-black leading-tight tracking-tight text-white focus:outline-none sm:px-4 sm:text-3xl">
          ¿Querés gestionar tu <span className="text-[var(--catalogo-acento)]">inscripción</span>?
        </h3>
      )}

      <div className="mx-auto w-full max-w-3xl space-y-1.5 px-3 pb-3 pt-4 sm:px-4">
        <button type="submit" disabled={enviando} className={BOTON_PRINCIPAL} style={ESTILO_PRINCIPAL}>
          {enviando ? 'Enviando...' : 'Inscribirme'}
        </button>
        <AvisoSinPago />
        {/* Invisible en el enlace: Cloudflare solo pide algo si sospecha de
            un bot. En el carrusel, sin pase, va visible (ver `captchaVisible`).
            Va último para que lo que mida no corra el botón. */}
        <div>
          {captcha && (
            <TurnstileWidget
              key={captchaKey}
              marca="teclab"
              invisible={!captchaVisible}
              onVerify={onToken}
              onExpire={() => onToken('')}
            />
          )}
        </div>
      </div>

      {/* El pie aparece sólo con un aviso: vacío quedaba como una franja
          oscura sin nada al fondo de la tarjeta. */}
      {aviso && (
        <div
          className="form-card-footer px-3 py-2 sm:px-4"
          style={{ background: 'rgba(0,0,0,0.35)', borderTop: '1px solid rgba(var(--catalogo-acento-rgb), 0.15)' }}
        >
          <p className="min-h-4 text-center text-[11px] leading-4" role={error ? 'alert' : undefined}>
            {aviso}
          </p>
        </div>
      )}
    </form>
  );
}

/**
 * El precio vigente se abre desde la confirmación con «Ver precio».
 * El botón vuelve a la confirmación sin volver a enviar los datos.
 */
export function PasoPrecio({ detalle, onContinuar, textoContinuar = 'Continuar' }: {
  detalle: ReactNode;
  onContinuar: () => void;
  /** «Volver» cuando el precio se abrió desde la confirmación. */
  textoContinuar?: string;
}) {
  return (
    <div className="flex grow flex-col">
      <h3 data-paso-foco tabIndex={-1} className="px-3 pt-5 text-center text-2xl font-black leading-tight tracking-tight text-white focus:outline-none sm:px-4 sm:text-3xl">
        El <span className="text-[var(--catalogo-acento)]">precio</span> de tu carrera
      </h3>
      <div className="mx-auto w-full max-w-3xl space-y-3 px-3 pb-5 pt-4 sm:px-4">
        {detalle}
        <div className="space-y-1.5">
          <button type="button" onClick={onContinuar} className={BOTON_PRINCIPAL} style={ESTILO_PRINCIPAL}>
            {textoContinuar}
          </button>
        </div>
      </div>
    </div>
  );
}

export function PasoListo({ waHref, onVerPrecio }: { waHref: string; dni: string; solicitud?: boolean; onVerPrecio?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center" aria-live="polite">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--catalogo-acento)]"
        style={{ animation: 'formSuccessPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' }}
      >
        <svg
          className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}
          style={{ strokeDasharray: 30, strokeDashoffset: 30, animation: 'formSuccessCheck 0.4s ease 0.4s forwards' }}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p data-paso-foco tabIndex={-1} className="text-3xl font-black tracking-tight text-white focus:outline-none">Preinscripción enviada</p>
      <p className="max-w-md text-base leading-snug text-white">
        Nos comunicamos a la brevedad.
      </p>
      <div className="mt-2 flex w-full max-w-sm flex-col gap-2">
        {/* El precio es el slide siguiente; desde ahí, «Volver» trae acá. */}
        {onVerPrecio && (
          <button
            type="button"
            onClick={onVerPrecio}
            className="cursor-pointer rounded-lg border border-[var(--catalogo-acento)]/60 py-2 text-sm font-bold text-white transition-colors hover:bg-[var(--catalogo-acento)]/15"
          >
            Ver precio
          </button>
        )}
        <a
          href={waHref}
          target="_blank"
          rel="noopener nofollow"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#25D366] py-2 text-sm font-bold text-white transition-colors hover:bg-[#25D366]/15"
        >
          <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
          Escribinos por WhatsApp
        </a>
      </div>
    </div>
  );
}
