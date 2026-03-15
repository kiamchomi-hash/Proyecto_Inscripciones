'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';

interface Props {
  onClose: () => void;
}

const PLAN_PAGES = [
  {
    left: { year: '1° Año', semesters: [
      { label: '1° Cuatrimestre', subjects: ['Introducción al Derecho', 'Derecho Constitucional', 'Historia del Derecho', 'Introducción a la Filosofía'] },
      { label: '2° Cuatrimestre', subjects: ['Derecho Penal: Parte General', 'Bases del Derecho Privado', 'Oratoria', 'Sociología General', 'Principios de Economía'] },
    ]},
    right: { year: '2° Año', semesters: [
      { label: '3° Cuatrimestre', subjects: ['Dcho. Público Prov. y Municipal', 'Derecho Penal: Parte Especial', 'Obligaciones', 'Derecho Ambiental'] },
      { label: '4° Cuatrimestre', subjects: ['Derecho Administrativo', 'Teoría General del Proceso', 'Contratos', 'Teoría de la Arg. Jurídica', 'Derecho Penal Económico'] },
    ]},
  },
  {
    left: { year: '3° Año', semesters: [
      { label: '5° Cuatrimestre', subjects: ['Derecho Internacional Público', 'Dcho. Trabajo y Seg. Social', 'Derechos Reales', 'Contratos de Empresa', 'Proc. Civiles y Comerciales'] },
      { label: '6° Cuatrimestre', subjects: ['Derecho Tributario', 'Derecho de Familia', 'Derecho Procesal Penal', 'Personas Jurídicas', 'Dcho. de Integración Regional'] },
    ]},
    right: { year: '4° Año', semesters: [
      { label: '7° Cuatrimestre', subjects: ['Dcho. Banc. y Mer. de Cap.', 'Derecho Procesal Público', 'Derecho Sucesorio', 'Concursos y Quiebras', 'Derecho de Daños'] },
      { label: '8° Cuatrimestre', subjects: ['Derecho Internacional Privado', 'Derechos Humanos', 'Mediación y Arbitraje', 'Ética y Deontología Prof.', 'Dcho. del Consumidor'] },
    ]},
  },
  {
    left: { year: '5° Año', semesters: [
      { label: '9° Cuatrimestre', subjects: ['Práctica Profesional', 'Seminario Final', 'Examen Final Integrador II', 'Práctica Solidaria', 'Electivas'] },
    ]},
  },
];

export default function AbogaciaModal({ onClose }: Props) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [planIdx, setPlanIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const totalSlides = 5;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    closeBtnRef.current?.focus();
    const scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  const waMsg = 'Hola, me gustaría recibir más información sobre Abogacía';
  const waHref = `https://wa.me/5491166522722?text=${encodeURIComponent(waMsg)}`;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?carrera=${encodeURIComponent('Abogacía')}`
    : '';

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-[#011a14]/80 backdrop-blur-[3px] transition-opacity duration-300 ${visible && !closing ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div className={`relative bg-[#1c2f31] border-2 border-[#00c7b1] rounded-2xl w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl
        h-[90vh] sm:h-[92vh] max-h-[90vh] sm:max-h-[92vh] overflow-hidden flex flex-col
        shadow-[0_0_50px_rgba(0,199,177,0.3)] transition-all duration-300
        ${visible && !closing ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-[0.97]'}`}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-3 sm:px-6 sm:py-4 border-b border-[#00c7b1]/20 bg-[#051a1a]">
          <div className="flex justify-between items-center gap-3">
            <h3 className={`text-xl sm:text-2xl font-black text-white uppercase tracking-tighter leading-tight truncate min-w-0 ${slideIdx === 0 ? 'invisible' : ''}`}>
              Abogacía
            </h3>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Image src="/imagenes/Modales/Abogac%C3%ADa/logo_siglo.png" alt="Siglo 21" width={100} height={36} className="h-7 sm:h-9 w-auto object-contain block" />
              <button ref={closeBtnRef} onClick={handleClose}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-red-600/20 text-red-500 hover:bg-red-600/40 hover:text-red-400 transition-colors" aria-label="Cerrar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Slides container */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <div className="flex h-full transition-transform duration-350 ease-[cubic-bezier(.4,0,.2,1)]" style={{ transform: `translateX(-${slideIdx * 100}%)` }}>

            {/* Slide 1: Presentación */}
            <div className="flex-shrink-0 w-full h-full flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 md:p-10 gap-4 bg-gradient-to-br from-[#011f17] to-[#0c2920] overflow-hidden">
                <div className="flex flex-col gap-[clamp(0.2rem,0.8vh,0.6rem)]">
                  <div className="flex items-center gap-[clamp(0.6rem,2vw,1rem)] text-left">
                    <Image src="/imagenes/Modales/Abogac%C3%ADa/9KPyxWIc_400x400.jpg" alt="Siglo 21" width={28} height={28} className="h-[clamp(1rem,2.6vh,1.8rem)] w-auto rounded block" />
                    <p className="text-[clamp(0.6rem,1.6vh,0.8rem)] font-extrabold tracking-widest text-[#00c7b1] uppercase m-0 leading-tight">
                      <span>Nivel de carrera: Grado</span>
                      <span className="block text-white">Duración: 5 años</span>
                    </p>
                  </div>
                  <div className="pt-[clamp(0.4rem,1.2vh,0.75rem)] border-t border-[#00c7b1]/20 flex flex-col items-center md:items-start text-center md:text-left">
                    <h2 className="text-[clamp(1.6rem,9vw,3.6rem)] md:text-[clamp(1.8rem,4vw,3.5rem)] whitespace-nowrap font-black text-white leading-[0.9] md:leading-normal uppercase tracking-tighter">ABOGACÍA</h2>
                    <div className="w-[clamp(1.2rem,5vw,2.2rem)] h-[3px] bg-[#00c7b1] rounded-sm mt-1" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm md:text-base text-[#e0f0ed] leading-snug font-medium">
                    <span className="text-[#00c7b1] font-bold mr-1">&bull;</span> Asesora, defende y actua en ambitos publicos, privados, provinciales, federales e internacionales.
                  </p>
                  <p className="text-sm md:text-base text-[#e0f0ed] leading-snug font-medium">
                    <span className="text-[#00c7b1] font-bold mr-1">&bull;</span> Profundizar el cuerpo de normas juridicas que permitan la convivencia armonica en el Estado.
                  </p>
                </div>
                {/* Mobile image */}
                <div className="md:hidden flex-1 flex items-center justify-center min-h-0 py-2 relative">
                  <Image src="/imagenes/Modales/Abogac%C3%ADa/tarjeta_abogacia.png" alt="Insignia Abogacía" fill className="object-contain" />
                </div>
                {/* Bottom: Título / Área */}
                <div className="grid grid-cols-2 gap-2 border-t border-[#00c7b1]/20 pt-2 flex-shrink-0">
                  <div className="bg-[#00c7b1]/5 border border-[#00c7b1]/20 rounded p-1.5 flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
                    <span className="block text-[0.5rem] font-bold uppercase tracking-widest text-[#00c7b1]">Título</span>
                    <span className="block text-sm text-white font-extrabold mt-0.5">Abogado/a</span>
                  </div>
                  <div className="bg-[#00c7b1]/5 border border-[#00c7b1]/20 rounded p-1.5 flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
                    <span className="block text-[0.5rem] font-bold uppercase tracking-widest text-[#00c7b1]">Area</span>
                    <span className="block text-sm text-white font-extrabold mt-0.5">Derecho</span>
                  </div>
                </div>
              </div>
              {/* Desktop image */}
              <div className="hidden md:flex flex-none h-full overflow-hidden relative border-l border-[#00c7b1]/20" style={{ width: '42%' }}>
                <Image src="/imagenes/Modales/Abogac%C3%ADa/Experiencia-universitaria-en-la-Siglo-21-donde-los-estudiantes-de-Abogacia-combinan-estudio-y-trabajo-3-1-905x1024.jpg"
                  alt="Abogacía" fill className="object-cover object-top" />
              </div>
            </div>

            {/* Slide 2: Modalidad */}
            <div className="flex-shrink-0 w-full h-full flex flex-col md:flex-row overflow-hidden">
              <div className="w-full hidden min-[400px]:block md:w-[42%] shrink-0 relative overflow-hidden h-[clamp(4.5rem,18vh,12rem)] md:h-full">
                <Image src="/imagenes/Modales/Abogac%C3%ADa/Abogac%C3%ADa.webp" alt="Modalidad"
                  fill className="object-cover object-[center_15%]" />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-[#1c2f31] to-transparent z-20" />
              </div>
              <div className="flex-1 overflow-hidden flex flex-col justify-center">
                <div className="px-6 md:px-10 py-6 flex flex-col gap-5">
                  <div>
                    <p className="text-[0.65rem] font-bold tracking-widest text-[#00c7b1] uppercase mb-1">Modalidad de cursado</p>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">Distribuida Home Virtual</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                    {[
                      { bold: '100% virtual', rest: ' — sin horarios fijos ni clases presenciales.' },
                      { bold: '', rest: 'Plataforma de aprendizaje activa ', boldEnd: 'las 24hs del día', dotEnd: '.' },
                      { bold: '', rest: 'Cursa y rendi desde ', boldEnd: 'donde estes', dotEnd: ', a tu ritmo.' },
                      { bold: '', rest: 'Necesitas ', boldEnd: 'notebook Windows o MAC', dotEnd: ' y camara encendida.' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-1 md:gap-2 text-sm leading-snug">
                        <span className="text-[#00c7b1] font-bold mt-[0.1em] shrink-0">✓</span>
                        <span className="text-[#b4d3ce]">
                          {item.bold && <b className="text-white">{item.bold}</b>}
                          {item.rest}
                          {item.boldEnd && <b className="text-white">{item.boldEnd}</b>}
                          {item.dotEnd}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Slide 3: Evaluación */}
            <div className="flex-shrink-0 w-full h-full flex flex-col items-center justify-center p-6 sm:p-10 gap-4 bg-gradient-to-br from-[#011f17] to-[#0c2920] overflow-y-auto custom-scrollbar">
              <div className="text-center">
                <p className="text-[0.6rem] font-bold tracking-[0.16em] text-[#00c7b1] uppercase mb-1">Proceso de evaluacion</p>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">¿Como te evaluamos?</h3>
              </div>
              <div className="flex gap-3 w-full max-w-md">
                {[
                  { num: '2', label: 'Examenes\nparciales', sub: '(1 por mes)', accent: false },
                  { num: '4', label: 'Trabajos\npracticos', sub: '(obligatorios)', accent: false },
                  { num: '7+', label: 'Nota para\npromocionar', sub: '¡sin rendir final!', accent: true },
                ].map((card, i) => (
                  <div key={i} className={`flex-1 rounded-xl p-4 text-center ${card.accent ? 'bg-[#00c7b1]/10 border-[1.5px] border-[#00c7b1]' : 'bg-[#1c2f31] border border-[#00c7b1]/18'}`}>
                    <div className="text-4xl font-black text-[#00c7b1] leading-none">{card.num}</div>
                    <div className="text-[0.65rem] font-semibold text-[#7ca19b] uppercase tracking-wider mt-1 whitespace-pre-line">{card.label}</div>
                    <div className={`text-[0.6rem] mt-0.5 ${card.accent ? 'text-[#00c7b1] font-bold' : 'text-[#48b3a4]'}`}>{card.sub}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 flex-wrap justify-center">
                {['Multiple choice', 'Entorno seguro virtual', 'Notebook obligatoria'].map(tag => (
                  <span key={tag} className="bg-[#00c7b1]/8 border border-[#00c7b1]/22 text-[#b4d3ce] text-[0.7rem] px-2.5 py-1 rounded-full font-semibold">{tag}</span>
                ))}
              </div>
              <p className="text-sm text-[#7ca19b] text-center max-w-sm leading-relaxed">
                Con <b className="text-[#00c7b1]">7 puntos o mas</b> en los dos parciales, promocionas la materia y quedas eximido del examen final.
              </p>
            </div>

            {/* Slide 4: Plan de Estudios */}
            <div className="flex-shrink-0 w-full h-full flex flex-col p-5 sm:p-6 gap-3 overflow-hidden">
              <div className="flex-shrink-0">
                <p className="text-[0.6rem] font-bold tracking-[0.16em] text-[#00c7b1] uppercase mb-0.5">Grado · 5 años</p>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Plan de Estudios</h3>
              </div>
              {/* Mini carousel */}
              <div className="flex-1 overflow-hidden relative min-h-0">
                <div className="flex h-full transition-transform duration-350 ease-[cubic-bezier(.4,0,.2,1)]" style={{ transform: `translateX(-${planIdx * 100}%)` }}>
                  {PLAN_PAGES.map((page, pi) => (
                    <div key={pi} className="flex-shrink-0 w-full h-full flex gap-2.5">
                      {/* Left column (year) */}
                      <div className="flex-1 bg-[#00c7b1]/4 border border-[#00c7b1]/15 rounded-lg overflow-hidden flex flex-col">
                        <div className="bg-[#00c7b1]/13 border-b-2 border-[#00c7b1] px-3 py-1 flex-shrink-0">
                          <p className="text-xs font-extrabold text-[#00c7b1] uppercase tracking-widest">{page.left.year}</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5 custom-scrollbar">
                          {page.left.semesters.map((sem, si) => (
                            <div key={si}>
                              {si > 0 && <div className="border-t border-[#00c7b1]/10 my-1 pt-1" />}
                              <p className="text-[0.65rem] text-[#48b3a4] font-bold uppercase tracking-wider">{sem.label}</p>
                              {sem.subjects.map((s, ssi) => (
                                <p key={ssi} className="text-sm text-[#b4d3ce] leading-relaxed">{s}</p>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Right column (year or extras) */}
                      {page.right ? (
                        <div className="flex-1 bg-[#00c7b1]/4 border border-[#00c7b1]/15 rounded-lg overflow-hidden flex flex-col">
                          <div className="bg-[#00c7b1]/13 border-b-2 border-[#00c7b1] px-3 py-1 flex-shrink-0">
                            <p className="text-xs font-extrabold text-[#00c7b1] uppercase tracking-widest">{page.right.year}</p>
                          </div>
                          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5 custom-scrollbar">
                            {page.right.semesters.map((sem, si) => (
                              <div key={si}>
                                {si > 0 && <div className="border-t border-[#00c7b1]/10 my-1 pt-1" />}
                                <p className="text-[0.65rem] text-[#48b3a4] font-bold uppercase tracking-wider">{sem.label}</p>
                                {sem.subjects.map((s, ssi) => (
                                  <p key={ssi} className="text-sm text-[#b4d3ce] leading-relaxed">{s}</p>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
              {/* Plan nav */}
              <div className="flex-shrink-0 flex items-center justify-center gap-2.5 pt-1">
                <button onClick={() => setPlanIdx(i => Math.max(0, i - 1))} disabled={planIdx === 0} aria-label="Página anterior del plan"
                  className="w-6 h-6 rounded-full bg-[#013729] border border-[#00c7b1]/30 text-[#00c7b1] flex items-center justify-center disabled:opacity-25 transition-opacity">
                  <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="flex gap-2 items-center">
                  {PLAN_PAGES.map((_, i) => (
                    <button key={i} onClick={() => setPlanIdx(i)} className={`carousel-dot ${planIdx === i ? 'active' : ''}`} aria-label={`Página ${i + 1} del plan`} aria-current={planIdx === i ? 'step' : undefined} />
                  ))}
                </div>
                <button onClick={() => setPlanIdx(i => Math.min(2, i + 1))} disabled={planIdx === 2} aria-label="Página siguiente del plan"
                  className="w-6 h-6 rounded-full bg-[#013729] border border-[#00c7b1]/30 text-[#00c7b1] flex items-center justify-center disabled:opacity-25 transition-opacity">
                  <svg width="9" height="9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>

            {/* Slide 5: Estudia con nosotros */}
            <div className="flex-shrink-0 w-full h-full flex overflow-hidden">
              <div className="hidden md:block w-[42%] shrink-0 relative overflow-hidden bg-[#0c2b24]">
                <Image src="/imagenes/imagenes_cau/entrada_estetica.png" alt="Instituto"
                  fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#011f17] z-20" style={{ background: 'linear-gradient(to right, transparent 60%, #011f17 100%)' }} />
              </div>
              <div className="flex-1 bg-[#011f17] p-6 sm:p-10 flex flex-col justify-center gap-6 overflow-y-auto custom-scrollbar">
                <div>
                  <p className="text-[0.6rem] font-bold tracking-[0.16em] text-[#00c7b1] uppercase mb-2">Beneficios Siglo 21</p>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
                    Estudia<br /><span className="text-[#00c7b1]">con nosotros</span>
                  </h2>
                </div>
                <div className="flex flex-col gap-5">
                  {[
                    { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', text: 'Esta cerca de tu casa' },
                    { icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', text: '100% online' },
                    { icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', text: 'Te acompañamos en tus dudas' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#00c7b1]/10 flex items-center justify-center text-[#00c7b1] shrink-0">
                        <svg className="w-[1.1rem] h-[1.1rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          {b.icon.split(' M').map((d, di) => (
                            <path key={di} strokeLinecap="round" strokeLinejoin="round" d={di === 0 ? d : `M${d}`} />
                          ))}
                        </svg>
                      </div>
                      <span className="text-white text-sm font-semibold">{b.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Carousel navigation bar */}
        <div className="flex-shrink-0 flex justify-between items-center px-2 py-2.5 sm:px-6 sm:py-4 bg-[#011a14] border-t border-[#00c7b1]/15">
          <button
            onClick={() => setSlideIdx(i => Math.max(0, i - 1))}
            disabled={slideIdx === 0}
            aria-label="Slide anterior"
            className="flex items-center gap-1 sm:gap-2 text-[#00c7b1] text-[0.6rem] sm:text-sm font-bold uppercase tracking-wider px-2 py-1.5 sm:px-4 sm:py-2 rounded border border-[#00c7b1]/30 hover:bg-[#00c7b1]/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            <span className="hidden min-[360px]:inline">Anterior</span>
          </button>
          <div className="flex justify-center items-center gap-1.5 sm:gap-2.5">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button key={i} onClick={() => setSlideIdx(i)} className={`carousel-dot ${slideIdx === i ? 'active' : ''}`} aria-label={`Ir a slide ${i + 1}`} aria-current={slideIdx === i ? 'step' : undefined} />
            ))}
          </div>
          <button
            onClick={() => setSlideIdx(i => Math.min(totalSlides - 1, i + 1))}
            disabled={slideIdx === totalSlides - 1}
            aria-label="Slide siguiente"
            className="flex items-center gap-1 sm:gap-2 text-[#00c7b1] text-[0.6rem] sm:text-sm font-bold uppercase tracking-wider px-2 py-1.5 sm:px-4 sm:py-2 rounded bg-[#00c7b1]/10 border border-[#00c7b1]/50 hover:bg-[#00c7b1]/20 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <span className="hidden min-[360px]:inline">Siguiente</span>
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 border-t border-[#00c7b1]/20 bg-[#051a1a]">
          <div className="p-3 flex flex-wrap gap-2 items-center">
            <div className="order-1 sm:order-2 w-full sm:w-auto flex items-center gap-2 justify-end sm:flex-shrink-0">
              <a href={waHref} target="_blank" rel="noopener nofollow"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] text-white font-bold rounded-lg hover:brightness-110 transition-colors text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                WhatsApp
              </a>
              <a href="#formulario" onClick={(e) => { e.preventDefault(); handleClose(); setTimeout(() => { const f = document.getElementById('formulario'); if (f) f.scrollIntoView({ behavior: 'smooth' }); }, 350); }}
                className="w-36 flex items-center justify-center gap-2 py-2 bg-[#6c2381] text-white font-bold rounded-lg hover:brightness-110 transition-colors text-sm whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Inscribite ya
              </a>
            </div>
            <div className="order-2 sm:order-1 w-full sm:flex-1 flex items-center gap-1.5 min-w-0">
              <input type="text" readOnly value={shareUrl} onClick={e => (e.target as HTMLInputElement).select()}
                className="flex-1 min-w-0 px-3 py-2 bg-[#013729] border border-[#00c7b1]/20 rounded-lg text-[#7ca19b] text-[11px] font-mono focus:outline-none focus:border-[#00c7b1]/50 cursor-text transition-colors truncate" />
              <button onClick={() => navigator.clipboard?.writeText(shareUrl)} title="Compartir enlace"
                className="w-36 flex-shrink-0 flex items-center justify-center gap-1.5 py-2 bg-[#00c7b1] text-[#013729] font-bold rounded-lg hover:brightness-110 transition-colors text-sm">
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
