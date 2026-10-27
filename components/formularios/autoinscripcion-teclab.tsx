'use client';

// Precio y confirmación compartidos por los formularios de preinscripción.
// El estado vive en `formulario-lead.tsx`; acá sólo se pintan los pasos.
//
// Hasta el 27/10/2026 este archivo tenía también la confirmación de la
// autoinscripción de Teclab («Inscribirme», con el captcha invisible y el
// portal del alumno). Se dio de baja junto con el robot.

import { type ReactNode } from 'react';
import { WhatsAppIcon } from '@/components/icons';

const BOTON_PRINCIPAL = 'w-full cursor-pointer rounded-lg py-2 text-sm font-black uppercase tracking-widest transition-all hover:brightness-110 hover:shadow-[0_6px_18px_rgba(var(--catalogo-acento-rgb),0.35)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:brightness-100 disabled:hover:shadow-none';
const ESTILO_PRINCIPAL = { background: 'linear-gradient(90deg, var(--catalogo-acento), var(--catalogo-acento-oscuro))', color: 'var(--catalogo-acento-tinta)', letterSpacing: '0.12em' };

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

export function PasoListo({ waHref, onVerPrecio }: { waHref: string; onVerPrecio?: () => void }) {
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
