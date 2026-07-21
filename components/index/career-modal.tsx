'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { type Carrera, carreraToSlug } from './types';
import { getEscuelaIA } from './identidad-argentina';

interface Props {
  carrera: Carrera;
  onClose: () => void;
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

/** Parse IA enfoque field into structured metadata */
function parseIAMeta(enfoque: string): { modalidad: string; certificacion: string } {
  const lines = enfoque.split('\n');
  let modalidad = '100% Online';
  let certificacion = 'Nacional e Internacional';
  for (const line of lines) {
    if (line.startsWith('Modalidad:')) modalidad = line.replace('Modalidad:', '').trim();
    if (line.startsWith('Certificación:')) certificacion = line.replace('Certificación:', '').trim();
  }
  return { modalidad, certificacion };
}

/** Parse IA plan_estudios into structured modules */
function parsePlanModulos(plan: string): { titulo: string; contenido: string }[] {
  const blocks = plan.split(/\n\n+/);
  const modulos: { titulo: string; contenido: string }[] = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const firstLine = lines[0]?.trim() || '';
    if (firstLine.startsWith('Módulo ') || firstLine.startsWith('Masterclass ')) {
      modulos.push({
        titulo: firstLine,
        contenido: lines.slice(1).join('\n').trim(),
      });
    } else {
      modulos.push({ titulo: '', contenido: block.trim() });
    }
  }
  return modulos;
}

/** Parse IA seccion_modalidad (docente) into name + bio lines */
function parseDocente(raw: string): { nombre: string; bio: string[] } {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const nombre = lines[0] || '';
  const bio = lines.slice(1).map(l => l.replace(/^·\s*/, ''));
  return { nombre, bio };
}

export default function CareerModal({ carrera, onClose, initiallyVisible = false }: Props) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [closing, setClosing] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const { prefix, cleanName } = getCareerPrefix(carrera);
  const isIA = carrera.nivel === 'Identidad Argentina';

  // Paleta: la del convenio (azul #0090C1 / amarillo #F1CF1C / tinta #101820)
  // o la de Siglo 21 para el resto de las carreras.
  const accent = isIA ? '#0090c1' : '#00c7b1';
  const accentLight = isIA ? '#f1cf1c' : '#00ffe1';
  const accentBg = isIA ? '#16242e' : '#013729';
  const accentBorder = isIA ? 'rgba(0,144,193,0.35)' : 'rgba(0,199,177,0.2)';
  const accentGlow = isIA ? 'rgba(0,144,193,0.3)' : 'rgba(0,199,177,0.3)';
  const panelBg = isIA ? '#101820' : '#1c2f31';
  const headerBg = isIA ? '#0a1219' : '#051a1a';

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    const inerted: Element[] = [];
    let current: Element | null = dialogRef.current;
    while (current?.parentElement) {
      for (const sibling of Array.from(current.parentElement.children)) {
        if (sibling !== current && !sibling.hasAttribute('inert')) {
          sibling.setAttribute('inert', '');
          inerted.push(sibling);
        }
      }
      current = current.parentElement;
    }
    requestAnimationFrame(() => setVisible(true));
    closeBtnRef.current?.focus();
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      inerted.forEach((element) => element.removeAttribute('inert'));
      openerRef.current?.focus();
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
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  // WhatsApp link
  const waMsg = `Hola, me gustaría recibir más información sobre ${carrera.nombre}`;
  const waHref = `https://wa.me/5491166522722?text=${encodeURIComponent(waMsg)}`;

  // Share URL
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/carreras/${carreraToSlug(carrera)}`
    : '';

  // Build metadata items depending on type
  let metaItems: { label: string; value: string }[];
  const escuelaIA = isIA ? getEscuelaIA(carrera) : null;
  if (isIA) {
    const iaMeta = parseIAMeta(carrera.enfoque || '');
    metaItems = [
      { label: 'Escuela', value: escuelaIA || carrera.prefix || 'Diplomatura' },
      { label: 'Duración', value: carrera.duracion },
      { label: 'Modalidad', value: iaMeta.modalidad },
      { label: 'Certificación', value: iaMeta.certificacion },
    ];
  } else {
    metaItems = [
      { label: 'Nivel', value: carrera.nivel },
      { label: 'Duracion', value: carrera.duracion },
      { label: 'Titulo', value: carrera.titulo },
      { label: 'Foco', value: carrera.enfoque },
    ];
  }

  // Sections
  const hasSections = carrera.seccion_duracion || carrera.seccion_modalidad || carrera.plan_estudios;

  // IA-specific parsed data
  const iaDocente = isIA && carrera.seccion_modalidad ? parseDocente(carrera.seccion_modalidad) : null;
  const iaModulos = isIA && carrera.plan_estudios ? parsePlanModulos(carrera.plan_estudios) : null;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 backdrop-blur-[3px] transition-opacity duration-300
          ${visible && !closing ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: isIA ? 'rgba(5,15,25,0.85)' : 'rgba(1,26,20,0.8)' }}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className="relative z-10 rounded-2xl w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl md:w-[min(64rem,75vw)]
          h-[88dvh] sm:h-[92vh] max-h-[88dvh] sm:max-h-[92vh] overflow-hidden flex flex-col"
        style={{
          background: panelBg,
          border: `2px solid ${accent}`,
          boxShadow: `0 0 50px ${accentGlow}`,
        }}
      >
        {/* Header */}
        <div
          className={`flex-shrink-0 px-5 py-3 sm:px-6 sm:py-4 border-b ${isIA ? 'ia-modal-header' : ''}`}
          style={{ background: headerBg, borderColor: accentBorder }}
        >
          <div className="relative flex justify-between items-center gap-3">
            <h3 id="modal-title" className="text-lg sm:text-2xl font-black text-white uppercase tracking-tighter leading-tight truncate min-w-0">
              {prefix && (
                <span
                  className="block text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-0.5 leading-normal"
                  style={{ color: accentLight }}
                >
                  {prefix}
                </span>
              )}
              <span className="block">{cleanName}</span>
            </h3>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {isIA && (
                <span className="ia-modal-badge hidden sm:inline-flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Convenio
                </span>
              )}
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
            {metaItems.map(item => {
              // En el convenio la escuela es el dato principal: bloque amarillo lleno
              const esPrimario = isIA && item.label === 'Escuela';
              return (
              <div
                key={item.label}
                className="rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2"
                style={
                  esPrimario
                    ? { background: 'rgba(241,207,28,0.94)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)' }
                    : isIA
                      ? { background: 'rgba(255,255,255,0.075)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }
                      : { background: accentBg }
                }
              >
                <span
                  className="block text-[9px] sm:text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: esPrimario ? 'rgba(16,24,32,0.7)' : isIA ? '#7ecbe6' : accent }}
                >
                  {item.label}
                </span>
                <span
                  className="block text-[0.8rem] sm:text-sm font-semibold mt-0.5 leading-tight"
                  style={{ color: esPrimario ? '#101820' : '#fff' }}
                >
                  {item.value}
                </span>
              </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar flex-1 min-h-0">
          {isIA ? (
            /* ── Identidad Argentina layout ── */
            <div className="space-y-6">
              {/* Objetivos / Descripcion */}
              {carrera.descripcion && (
                <div>
                  <h4
                    className="text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                    style={{ color: '#4fbfe3' }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Objetivos
                  </h4>
                  <p className="text-[#b4cce0] text-[0.95rem] sm:text-lg leading-relaxed">
                    {carrera.descripcion}
                  </p>
                </div>
              )}

              {/* Docente */}
              {iaDocente && iaDocente.nombre && (
                <div
                  className="rounded-xl p-4 sm:p-5"
                  style={{
                    background: 'rgba(255,255,255,0.055)',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
                  }}
                >
                  <h4
                    className="text-sm font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                    style={{ color: '#4fbfe3' }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Docente
                  </h4>
                  <p className="text-white font-bold text-base sm:text-lg">{iaDocente.nombre}</p>
                  {iaDocente.bio.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {iaDocente.bio.map((line, i) => (
                        <li key={i} className="text-[#8ab4d0] text-sm flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accent }} />
                          {line}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Plan de estudios — módulos */}
              {iaModulos && iaModulos.length > 0 && (
                <div>
                  <h4
                    className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2"
                    style={{ color: '#4fbfe3' }}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Plan de estudios
                  </h4>
                  <div className="space-y-3">
                    {iaModulos.map((mod, i) => {
                      // Las masterclass se marcan en amarillo para distinguirlas de los modulos
                      const esMasterclass = mod.titulo.startsWith('Masterclass');
                      return (
                      <div
                        key={i}
                        className="rounded-lg p-3 sm:p-4"
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
                          borderLeft: `3px solid ${esMasterclass ? accentLight : accent}`,
                        }}
                      >
                        {mod.titulo && (
                          <p
                            className="font-bold text-sm sm:text-[0.95rem] mb-1.5"
                            style={{ color: esMasterclass ? accentLight : '#fff' }}
                          >
                            {mod.titulo}
                          </p>
                        )}
                        {mod.contenido && (
                          <p className="text-[#8ab4d0] text-[0.82rem] sm:text-sm leading-relaxed whitespace-pre-wrap">
                            {mod.contenido}
                          </p>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : hasSections ? (
            /* ── Standard Siglo 21 layout with sections ── */
            <div className="space-y-6">
              {carrera.descripcion && (
                <div>
                  <p className="text-[#b4d3ce] text-[0.95rem] sm:text-lg leading-relaxed">
                    {carrera.descripcion}
                  </p>
                </div>
              )}

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
            /* ── Fallback: description only ── */
            <div className="text-[#b4d3ce] text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
              {carrera.descripcion || 'Informacion no disponible aun para esta carrera.'}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex-shrink-0 p-4 border-t flex flex-wrap gap-2 items-center"
          style={{ background: headerBg, borderColor: accentBorder }}
        >
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
              className="w-36 flex items-center justify-center gap-2 py-2 text-white font-bold rounded-lg hover:brightness-110 transition-colors text-sm whitespace-nowrap"
              style={{ background: isIA ? accent : '#6c2381' }}
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
              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-[11px] font-mono focus:outline-none cursor-text transition-colors truncate"
              style={{
                background: accentBg,
                border: `1px solid ${accentBorder}`,
                color: isIA ? '#6b9fc0' : '#7ca19b',
              }}
            />
            <button
              onClick={() => navigator.clipboard?.writeText(shareUrl)}
              title="Compartir enlace"
              className="w-36 flex-shrink-0 flex items-center justify-center gap-1.5 py-2 font-bold rounded-lg hover:brightness-110 transition-colors text-sm"
              style={
                isIA
                  ? { background: 'transparent', border: `1px solid ${accent}`, color: '#7ecbe6' }
                  : { background: accent, color: '#013729' }
              }
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
  );
}
