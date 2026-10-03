'use client';

// Lo que sigue a los datos en la autoinscripción de Teclab: la confirmación
// «Inscribirme» de la entrada normal y del enlace, y el «¡Listo!». El paso 1 es
// la preinscripción de siempre, y el estado vive en `formulario-lead.tsx` (o en
// `inscripcion-enlace.tsx`); acá sólo se pintan.
//
// Los recorridos están en `odd/tasks/autoinscripcion-teclab.md`. Desde el
// 03/10/2026 no hay paso de medio de pago: el portal del alumno pide la
// tarjeta y decide la financiación solo, así que preguntarlo acá era un paso
// de más. La entrada directa (`?inscripcion=auto`) envía desde los datos; la
// normal, después de enviar la preinscripción, ofrece «Inscribirme» con la
// pregunta «¿Querés gestionar tu inscripción?».

import { type FormEvent, type ReactNode } from 'react';
import Image from 'next/image';
import TurnstileWidget from '@/components/turnstile-widget';
import { WhatsAppIcon } from '@/components/icons';

// Sin sesión, el portal redirige a /login?redirect=%2Fpayments%2Fselect y,
// al entrar, vuelve a la pantalla de pago. Falta probarlo con una cuenta que
// entre por primera vez (cambio de contraseña y términos en el medio).
export const PORTAL_ALUMNO_TECLAB = 'https://portalalumno.teclab.edu.ar/payments/select';

const BOTON_PRINCIPAL = 'w-full rounded-lg py-2 text-sm font-black uppercase tracking-widest transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40';
const ESTILO_PRINCIPAL = { background: 'linear-gradient(90deg, var(--catalogo-acento), var(--catalogo-acento-oscuro))', color: 'var(--catalogo-acento-tinta)', letterSpacing: '0.12em' };
const LINK_SECUNDARIO = 'w-full cursor-pointer py-1 text-sm font-bold text-[var(--catalogo-texto-suave)] underline underline-offset-2 transition-colors hover:text-white';

/** Lo que se muestra si se aprieta antes de que el captcha invisible devuelva el token. */
export const AVISO_TOKEN = 'Estamos verificando la conexión. Probá de nuevo en un segundo.';

/**
 * La confirmación de la autoinscripción: «Inscribirme», con el captcha
 * invisible que firma el envío. En la entrada normal del formulario suma la
 * pregunta y «Ahora no» (la preinscripción ya salió y esto es opcional); en el
 * enlace va sola, debajo de los datos precargados.
 */
/**
 * Inscribirse no cobra nada: el portal genera el ticket y la persona paga
 * después, en «Pagos en línea». Va debajo de cada botón «Inscribirme».
 */
export function AvisoSinPago() {
  return (
    <p className="text-center text-[11px] leading-snug text-[var(--catalogo-texto-suave)]">
      Inscribirte no te cobra nada: se genera un ticket de pago para que pagues desde el portal del alumno.
    </p>
  );
}

export function PasoInscribirme({
  pregunta, intentado, enviando, error, captcha = true, captchaKey, token, onToken, onEnviar, onSaltear,
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
  captchaKey: number;
  token: string;
  onToken: (token: string) => void;
  onEnviar: () => void;
  onSaltear?: () => void;
}) {
  const aviso = error
    ? <span className="text-red-400">{error}</span>
    : intentado && !token
      ? <span className="text-amber-300">{AVISO_TOKEN}</span>
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
        {onSaltear && (
          <button type="button" onClick={onSaltear} disabled={enviando} className={LINK_SECUNDARIO}>
            Ahora no
          </button>
        )}
        {/* Invisible, como en «Ver precio»: Cloudflare solo pide algo si
            sospecha de un bot. Va último para que lo que mida no corra el botón. */}
        <div>
          {captcha && (
            <TurnstileWidget
              key={captchaKey}
              marca="teclab"
              invisible
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
 * El precio vigente, como un paso propio del carrusel entre la preinscripción
 * y «Inscribirme». Sólo aparece en la entrada normal y con precio vigente: la
 * entrada directa viene de «Ver precio», que ya lo mostró.
 */
export function PasoPrecio({ detalle, onContinuar, onSaltear }: {
  detalle: ReactNode;
  onContinuar: () => void;
  onSaltear?: () => void;
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
            Continuar
          </button>
          {onSaltear && (
            <button type="button" onClick={onSaltear} className={LINK_SECUNDARIO}>
              Ahora no
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function PasoListo({ waHref, dni }: { waHref: string; dni: string }) {
  const usuario = dni.replace(/\D/g, '');
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
      <p data-paso-foco tabIndex={-1} className="text-3xl font-black tracking-tight text-white focus:outline-none">¡Listo!</p>
      {usuario ? (
        <dl className="grid w-full max-w-xs grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 rounded-xl border border-white/15 bg-white/5 px-5 py-4 text-left">
          <dt className="text-xs font-bold uppercase leading-none tracking-wider text-[var(--catalogo-etiqueta)]">Usuario</dt>
          <dd className="text-right font-mono text-xl font-bold leading-none tabular-nums tracking-wider text-white">{usuario}</dd>
          <dt className="text-xs font-bold uppercase leading-none tracking-wider text-[var(--catalogo-etiqueta)]">Contraseña</dt>
          <dd className="text-right font-mono text-xl font-bold leading-none tabular-nums tracking-wider text-white">{usuario}</dd>
        </dl>
      ) : (
        <p className="max-w-md text-base leading-snug text-white">
          Tu usuario y tu contraseña son <strong className="font-black">tu DNI, sin puntos</strong>.
        </p>
      )}
      <p className="max-w-md text-[15px] leading-snug text-white/85">
        A la brevedad te llega un mail de Teclab, «PAGO AUTOGESTIONADO!». Si no lo ves, revisá el correo no deseado.
      </p>
      <Desplegable titulo="Así se ve el mail">
        <Image
          src="/imagenes/teclab/autoinscripcion/mail-pago-autogestionado.webp"
          alt="Mail de Teclab «PAGO AUTOGESTIONADO!»: tu DNI como usuario y contraseña y el botón «Ingresar ahora»."
          width={523} height={637}
          className="h-auto w-full rounded-lg"
        />
      </Desplegable>
      <div className="mt-2 flex w-full max-w-sm flex-col gap-2">
        <a
          href={PORTAL_ALUMNO_TECLAB}
          target="_blank"
          rel="noopener"
          className={`${BOTON_PRINCIPAL} text-center`}
          style={ESTILO_PRINCIPAL}
        >
          Entrar al portal
        </a>
        <a
          href={PORTAL_ALUMNO_TECLAB}
          target="_blank"
          rel="noopener"
          className="-mt-1 text-xs text-[var(--catalogo-texto-suave)] underline decoration-white/20 underline-offset-2 hover:text-white"
        >
          portalalumno.teclab.edu.ar
        </a>
        <Desplegable titulo="¿Entraste y no ves la pantalla de pago?">
          <ol className="flex flex-col gap-3 text-left text-sm text-white">
            <li>
              <p className="mb-1.5">1. Si aparece un cartel, cerralo. Después tocá el menú, arriba a la izquierda.</p>
              <Image
                src="/imagenes/teclab/autoinscripcion/portal-paso-1-menu.webp"
                alt="Inicio del portal del alumno con el botón de menú marcado."
                width={504} height={330}
                className="h-auto w-full rounded-lg"
              />
            </li>
            <li>
              <p className="mb-1.5">2. Entrá a <strong>Pagos</strong> y después a <strong>Pagos en línea</strong>.</p>
              <Image
                src="/imagenes/teclab/autoinscripcion/portal-paso-2-pagos.webp"
                alt="Menú del portal con Pagos y Pagos en línea marcados."
                width={504} height={500}
                className="h-auto w-full rounded-lg"
              />
            </li>
          </ol>
        </Desplegable>
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

function Desplegable({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="group w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.03] text-left">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-bold text-white/90 [&::-webkit-details-marker]:hidden">
        {titulo}
        <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="px-3 pb-3">{children}</div>
    </details>
  );
}
