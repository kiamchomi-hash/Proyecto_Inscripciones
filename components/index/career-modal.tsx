'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { type Carrera, carreraToSlug } from './types';

interface Props {
  carrera: Carrera;
  onClose: () => void;
  onNextCarrera?: () => void;
  onPrevCarrera?: () => void;
  hasNextCarrera?: boolean;
  hasPrevCarrera?: boolean;
  nextCarreraName?: string;
  prevCarreraName?: string;
  initiallyVisible?: boolean;
}

function getCareerPrefix(carrera: Carrera): { prefix: string; cleanName: string } {
  if (carrera.prefix !== null || carrera.nombre_corto !== null) {
    return { prefix: carrera.prefix || '', cleanName: carrera.nombre_corto || carrera.nombre };
  }
  let prefix = '';
  let cleanName = carrera.nombre;
  const nameLower = carrera.nombre.toLowerCase();
  const prefixMap = [
    { match: 'licenciatura', display: 'Licenciatura', len: 12 },
    { match: 'tecnicatura', display: 'Tecnicatura', len: 11 },
    { match: 'maestría', display: 'Maestria', len: 8 },
    { match: 'maestria', display: 'Maestria', len: 8 },
    { match: 'especialización', display: 'Especializacion', len: 15 },
    { match: 'especializacion', display: 'Especializacion', len: 15 },
    { match: 'diplomatura', display: 'Diplomatura', len: 11 },
    { match: 'certificado', display: 'Certificado', len: 11 },
    { match: 'curso de ', display: 'Curso de', len: 9 },
    { match: 'curso', display: 'Curso', len: 5 },
  ];
  for (const p of prefixMap) {
    if (nameLower.startsWith(p.match)) {
      prefix = p.display;
      cleanName = carrera.nombre.substring(p.len).trim();
      break;
    }
  }
  cleanName = cleanName.replace(/Universitaria|Universitario|Univ\./g, '').replace(/\s*\(CCC\)/gi, '').replace(/\s*-\s*CCC\b/gi, '').replace(/\s+CCC$/i, '').replace(/\s\s+/g, ' ').trim();
  if (cleanName.toLowerCase().startsWith('en ')) {
    prefix += ' en';
    cleanName = cleanName.substring(3).trim();
  }
  if (cleanName.length > 0) {
    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }
  return { prefix, cleanName };
}

export default function CareerModal({ carrera, onClose, onNextCarrera, onPrevCarrera, hasNextCarrera, hasPrevCarrera, nextCarreraName, prevCarreraName, initiallyVisible = false }: Props) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [closing, setClosing] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { prefix, cleanName } = getCareerPrefix(carrera);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    closeBtnRef.current?.focus();
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  // WhatsApp link
  const waMsg = `Hola, me gustaría recibir más información sobre ${carrera.nombre}`;
  const waHref = `https://wa.me/5491166522722?text=${encodeURIComponent(waMsg)}`;

  // Share URL
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?carrera=${carreraToSlug(carrera.nombre)}`
    : '';

  const metaItems = [
    { label: 'Nivel', value: carrera.nivel },
    { label: 'Duracion', value: carrera.duracion },
    { label: 'Titulo', value: carrera.titulo },
    { label: 'Foco', value: carrera.enfoque },
  ];

  // Sections
  const hasSections = carrera.seccion_duracion || carrera.seccion_modalidad || carrera.plan_estudios;

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-[#011a14]/80 backdrop-blur-[3px] transition-opacity duration-300
          ${visible && !closing ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Layout: modal + flechas absolutas */}
      <div className={`relative z-10 flex flex-col items-center w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl md:max-w-none md:w-auto transition-all duration-300 ${visible && !closing ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-[0.97]'}`}>



        {/* Desktop: flecha izquierda (absoluta) */}
        {hasPrevCarrera && onPrevCarrera && (
          <button
            onClick={onPrevCarrera}
            className="group hidden md:flex min-w-0 absolute right-full top-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 py-6 w-[clamp(80px,9vw,110px)] rounded-l-2xl bg-[#0a1f1d]/90 border border-r-0 border-[#00c7b1]/40 text-white hover:bg-[#00c7b1]/20 hover:border-[#00c7b1]/70 transition-all backdrop-blur-sm cursor-pointer"
            aria-label="Carrera anterior"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-[#00c7b1] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            <div className="flex flex-col items-center leading-tight text-center">
              <span className="text-[0.65rem] font-black uppercase tracking-widest whitespace-nowrap">Anterior</span>
              <span className="text-[0.65rem] font-black uppercase tracking-widest whitespace-nowrap">Carrera</span>
            </div>
          </button>
        )}

        {/* Desktop: flecha derecha (absoluta) */}
        {hasNextCarrera && onNextCarrera && (
          <button
            onClick={onNextCarrera}
            className="group hidden md:flex min-w-0 absolute left-full top-1/2 -translate-y-1/2 flex-col items-center justify-center gap-1 py-6 w-[clamp(80px,9vw,110px)] rounded-r-2xl bg-[#0a1f1d]/90 border border-l-0 border-[#00c7b1]/40 text-white hover:bg-[#00c7b1]/20 hover:border-[#00c7b1]/70 transition-all backdrop-blur-sm cursor-pointer"
            aria-label="Carrera siguiente"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-[#00c7b1] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            <div className="flex flex-col items-center leading-tight text-center">
              <span className="text-[0.65rem] font-black uppercase tracking-widest whitespace-nowrap">Siguiente</span>
              <span className="text-[0.65rem] font-black uppercase tracking-widest whitespace-nowrap">Carrera</span>
            </div>
          </button>
        )}

      {/* Panel */}
      <div
        className={`relative bg-[#1c2f31] border-2 border-[#00c7b1] rounded-2xl w-full md:w-[min(64rem,75vw)]
          h-[88dvh] sm:h-[92vh] max-h-[88dvh] sm:max-h-[92vh] overflow-hidden flex flex-col
          shadow-[0_0_50px_rgba(0,199,177,0.3)]`}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-3 sm:px-6 sm:py-4 border-b border-[#00c7b1]/20 bg-[#051a1a]">
          <div className="flex justify-between items-center gap-3">
            <h3 id="modal-title" className="text-lg sm:text-2xl font-black text-white uppercase tracking-tighter leading-tight truncate min-w-0">
              {prefix && (
                <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#00ffe1] mb-0.5 leading-normal">
                  {prefix}
                </span>
              )}
              <span className="block">{cleanName}</span>
            </h3>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                ref={closeBtnRef}
                onClick={handleClose}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-red-600/20 text-red-500 hover:bg-red-600/40 hover:text-red-400 transition-colors"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Metadata badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-3 sm:mt-4">
            {metaItems.map(item => (
              <div key={item.label} className="bg-[#013729] rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2">
                <span className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#00c7b1]">{item.label}</span>
                <span className="block text-[0.8rem] sm:text-sm text-white font-semibold mt-0.5 leading-tight">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {hasSections ? (
            <div className="space-y-6">
              {/* Descripcion */}
              {carrera.descripcion && (
                <div>
                  <p className="text-[#b4d3ce] text-[0.95rem] sm:text-lg leading-relaxed">
                    {carrera.descripcion}
                  </p>
                </div>
              )}

              {/* Duracion section */}
              {carrera.seccion_duracion && (
                <div className="bg-[#013729]/50 border border-[#00c7b1]/15 rounded-xl p-4 sm:p-5">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#00c7b1] mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Duracion
                  </h4>
                  <p className="text-[#b4d3ce] text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {carrera.seccion_duracion}
                  </p>
                </div>
              )}

              {/* Modalidad section */}
              {carrera.seccion_modalidad && (
                <div className="bg-[#013729]/50 border border-[#00c7b1]/15 rounded-xl p-4 sm:p-5">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#00c7b1] mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Modalidad
                  </h4>
                  <p className="text-[#b4d3ce] text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {carrera.seccion_modalidad}
                  </p>
                </div>
              )}

              {/* Plan de estudios section */}
              {carrera.plan_estudios && (
                <div className="bg-[#013729]/50 border border-[#00c7b1]/15 rounded-xl p-4 sm:p-5">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#00c7b1] mb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Plan de estudios
                  </h4>
                  <p className="text-[#b4d3ce] text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                    {carrera.plan_estudios}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[#b4d3ce] text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
              {carrera.descripcion || 'Informacion no disponible aun para esta carrera.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 bg-[#051a1a] border-t border-[#00c7b1]/20 flex flex-wrap gap-2 items-center">
          {/* WhatsApp + Form buttons */}
          <div className="order-1 sm:order-2 w-full sm:w-auto flex items-center gap-2 justify-end sm:flex-shrink-0">
            <a
              href={waHref}
              target="_blank"
              rel="noopener nofollow"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] text-white font-bold rounded-lg hover:brightness-110 transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <a
              href="#formulario"
              onClick={(e) => {
                e.preventDefault();
                handleClose();
                setTimeout(() => {
                  const form = document.getElementById('formulario');
                  if (form) form.scrollIntoView({ behavior: 'smooth' });
                }, 350);
              }}
              className="w-36 flex items-center justify-center gap-2 py-2 bg-[#6c2381] text-white font-bold rounded-lg hover:brightness-110 transition-colors text-sm whitespace-nowrap"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Inscribite ya
            </a>
          </div>

          {/* Share URL */}
          <div className="order-2 sm:order-1 w-full sm:flex-1 flex items-center gap-1.5 min-w-0">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={e => (e.target as HTMLInputElement).select()}
              className="flex-1 min-w-0 px-3 py-2 bg-[#013729] border border-[#00c7b1]/20 rounded-lg text-[#7ca19b] text-[11px] font-mono focus:outline-none focus:border-[#00c7b1]/50 cursor-text transition-colors truncate"
            />
            <button
              onClick={() => navigator.clipboard?.writeText(shareUrl)}
              title="Compartir enlace"
              className="w-36 flex-shrink-0 flex items-center justify-center gap-1.5 py-2 bg-[#00c7b1] text-[#013729] font-bold rounded-lg hover:brightness-110 transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Compartir</span>
            </button>
          </div>
        </div>
      </div>

      </div>
    </div>
  );
}
