'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { type Carrera, type CarreraSlide, type SlidePlanEstudios, carreraToSlug, getAreaForCarrera } from './types';

interface Props {
  carrera: Carrera;
  onClose: () => void;
  initiallyVisible?: boolean;
}

// Encode path segments with special chars (tildes, spaces) while preserving slashes
function encodeImagePath(path: string): string {
  if (!path) return path;
  return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
}

const ICON_PATHS: Record<string, string> = {
  location: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
  monitor: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  chat: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  book: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
};

function getCleanName(carrera: Carrera): { prefix: string; cleanName: string } {
  if (carrera.prefix !== null || carrera.nombre_corto !== null) {
    return { prefix: carrera.prefix || '', cleanName: carrera.nombre_corto || carrera.nombre };
  }
  let prefix = '';
  let cleanName = carrera.nombre;
  const lower = carrera.nombre.toLowerCase();
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
    if (lower.startsWith(p.match)) {
      prefix = p.display;
      cleanName = carrera.nombre.substring(p.len).trim();
      break;
    }
  }
  cleanName = cleanName.replace(/\s*\(CCC\)/gi, '').replace(/\s*-\s*CCC\b/gi, '').replace(/\s+CCC$/i, '').replace(/\s\s+/g, ' ').trim();
  if (cleanName.toLowerCase().startsWith('en ')) {
    prefix += ' en';
    cleanName = cleanName.substring(3).trim();
  }
  if (cleanName.length > 0) cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  return { prefix, cleanName };
}

// ── Display name for portada slide (e.g. "Lic. en Finanzas") ──
function getPortadaName(carrera: Carrera): string {
  const p = (carrera.prefix || '').toLowerCase();
  const name = carrera.nombre_corto || carrera.nombre;
  if (p.includes('licenciatura')) return `Lic. en ${name}`;
  if (p.includes('tecnicatura')) return `Tec. en ${name}`;
  if (p.includes('maestría') || p.includes('maestria')) return `Maestría en ${name}`;
  if (p.includes('especialización') || p.includes('especializacion')) return `Esp. en ${name}`;
  if (p.includes('diplomatura')) return `Diplomatura en ${name}`;
  // For careers where nombre already includes the full title (Licenciatura en X, etc.)
  const lower = carrera.nombre.toLowerCase();
  if (lower.startsWith('licenciatura')) return carrera.nombre.replace(/^Licenciatura/i, 'Lic.');
  if (lower.startsWith('tecnicatura')) return carrera.nombre.replace(/^Tecnicatura Universitaria/i, 'Tec. Univ.').replace(/^Tecnicatura/i, 'Tec.');
  return carrera.nombre;
}

// ── Flatten paginas into individual year panels ──
interface YearPanel {
  tipo: 'year';
  año: string;
  cuatrimestres: { label: string; materias: string[] }[];
}
type Panel = YearPanel;

function flattenPaginas(paginas: SlidePlanEstudios['paginas']): Panel[] {
  const panels: Panel[] = [];
  for (const page of paginas) {
    if (page.izquierda) panels.push({ tipo: 'year', año: page.izquierda.año, cuatrimestres: page.izquierda.cuatrimestres });
    if (page.derecha) panels.push({ tipo: 'year', año: page.derecha.año, cuatrimestres: page.derecha.cuatrimestres });
  }
  return panels;
}

// ── Panel content renderer (shared between mobile & desktop) ──
function PanelContent({ panel, showTitle, cuatStartIdx }: { panel: Panel; showTitle?: boolean; cuatStartIdx?: number }) {
  return (
    <>
      {showTitle && (
        <p className="text-[0.85rem] md:text-base font-black text-white uppercase tracking-wider mb-2 pb-1" style={{ borderBottom: '1px solid rgba(0,199,177,0.15)' }}>{panel.año}</p>
      )}
      {/* Mobile: stacked; Desktop: side by side */}
      <div className="md:grid md:gap-4" style={{ gridTemplateColumns: `repeat(${panel.cuatrimestres.length}, 1fr)` }}>
        {panel.cuatrimestres.map((c, ci) => (
          <div key={ci} data-cuat-idx={cuatStartIdx != null ? cuatStartIdx + ci : undefined}>
            {/* Mobile separator between cuatrimestres */}
            {ci > 0 && (
              <div className="my-3 h-[2px] rounded-full md:hidden" style={{ background: 'linear-gradient(90deg, rgba(0,199,177,0.35) 0%, rgba(0,199,177,0.08) 60%, transparent 100%)' }} />
            )}
            <p className="text-[0.6rem] md:text-[0.75rem] font-bold uppercase tracking-[0.1em] mb-1 text-[#00c7b1]">{c.label}</p>
            <div className="flex flex-col gap-0.5">
              {c.materias.map((m, mi) => (
                <div key={mi} className="flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full mt-[0.45rem] md:mt-[0.55rem] flex-shrink-0 bg-[#00c7b1]/40" />
                  <p className="text-[0.78rem] md:text-[0.95rem] text-[#c8d8d4] leading-relaxed">{m}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── PDF download helper (in-page, no new window) ──
async function downloadPlanPDF(panels: Panel[], carreraNombre: string) {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default ?? (jsPDFModule as any).jsPDF;
  await import('jspdf-autotable');
  const yearPanels = panels.filter(p => p.tipo === 'year') as YearPanel[];

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 18;
  const marginR = 18;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = 20;
    }
  };

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(1, 55, 41); // #013729
  doc.text(carreraNombre.toUpperCase(), marginL, y);
  y += 8;

  // Subtitle
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('PLAN DE ESTUDIOS', marginL, y);
  y += 3;
  doc.setDrawColor(0, 199, 177); // #00c7b1
  doc.setLineWidth(0.6);
  doc.line(marginL, y, marginL + contentW, y);
  y += 10;

  // Years — 3 per page, then new page
  const renderYear = (panel: YearPanel) => {
    // Year header with teal left bar
    doc.setFillColor(232, 245, 243);
    doc.rect(marginL, y - 4, contentW, 8, 'F');
    doc.setFillColor(0, 199, 177);
    doc.rect(marginL, y - 4, 1.2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(1, 55, 41);
    doc.text(panel.año.toUpperCase(), marginL + 4, y + 1);
    y += 10;

    for (const cuatri of panel.cuatrimestres) {
      checkPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 85, 135); // #005587
      doc.text(cuatri.label.toUpperCase(), marginL + 5, y);
      y += 4;

      for (const materia of cuatri.materias) {
        checkPage(6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 51, 51);
        doc.setFillColor(0, 199, 177);
        doc.circle(marginL + 7, y - 1, 0.8, 'F');
        doc.text(materia, marginL + 11, y);
        y += 4.5;
      }
      y += 2;
    }
    y += 3;
  };

  // Page 1: years 1-3
  for (let i = 0; i < Math.min(3, yearPanels.length); i++) {
    renderYear(yearPanels[i]);
  }

  // Page 2: years 4+
  if (yearPanels.length > 3) {
    doc.addPage();
    y = 20;
    for (let i = 3; i < yearPanels.length; i++) {
      renderYear(yearPanels[i]);
    }
  }

  doc.save(`Plan de Estudios - ${carreraNombre}.pdf`);
}

// ── Plan panels: left=year buttons, right=content ──
function PlanPanels({ paginas, carreraNombre, isVisible }: { paginas: SlidePlanEstudios['paginas']; carreraNombre: string; isVisible?: boolean }) {
  const requisito = paginas.flatMap(p => p.extras || []).find(e => e.titulo.toLowerCase().includes('requisito'));
  const panels = flattenPaginas(paginas);
  // -2 = show requisito only, -1 = show all, >= 0 = specific panel
  const [active, setActive] = useState(0);

  useEffect(() => {
    // Solo en desktop (>= 768px) arranca en Plan Completo (-1)
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      setActive(-1);
    }
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentVisibleIdx, setCurrentVisibleIdx] = useState(requisito ? -1 : 0);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const showAll = active === -1;
  const showRequisito = active === -2;
  const activePanel = active >= 0 ? panels[active] : null;
  const activeLabel = activePanel ? activePanel.año : showRequisito ? 'Requisitos' : 'Plan Completo';

  // Reset scroll state when switching views
  useEffect(() => {
    setCurrentVisibleIdx(requisito ? -1 : 0);
    setIsAtBottom(false);
    const container = scrollContainerRef.current;
    if (container) container.scrollTop = 0;
  }, [active]);

  // Reset when returning to this slide from another
  const prevVisible = useRef(isVisible);
  useEffect(() => {
    if (isVisible && !prevVisible.current) {
      const container = scrollContainerRef.current;
      if (container) container.scrollTop = 0;
      setCurrentVisibleIdx(requisito ? -1 : 0);
      setCurrentCuatIdx(0);
      setIsAtBottom(false);
      setCuatBtnVisible(true);
      cuatGracePeriod.current = false;
      if (cuatHideTimer.current) clearTimeout(cuatHideTimer.current);
      cuatHideTimer.current = setTimeout(() => setCuatBtnVisible(false), 5000);
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        setActive(-1);
      } else {
        setActive(0);
      }
    }
    prevVisible.current = isVisible;
  }, [isVisible]);

  // Get visible panel elements (not inside display:none)
  const getVisiblePanelEls = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return [];
    return Array.from(container.querySelectorAll<HTMLDivElement>('[data-panel-idx]'))
      .filter(el => el.offsetParent !== null);
  }, []);

  // Get element's top offset relative to the scroll container
  const getOffsetInContainer = useCallback((el: HTMLElement) => {
    const container = scrollContainerRef.current;
    if (!container) return 0;
    return el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
  }, []);

  // Scroll to a specific panel — precise alignment
  const scrollToPanel = useCallback((idx: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (idx === 0) {
      if (!requisito) {
        container.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Scroll to the separator line between requisito and 1er año
        const panel0 = container.querySelector<HTMLDivElement>('[data-panel-idx="0"]');
        const sep = panel0?.previousElementSibling as HTMLElement | null;
        if (sep && 'sep' in (sep.dataset || {})) {
          container.scrollTo({ top: getOffsetInContainer(sep), behavior: 'smooth' });
        } else if (panel0) {
          container.scrollTo({ top: getOffsetInContainer(panel0), behavior: 'smooth' });
        }
      }
      return;
    }
    const els = getVisiblePanelEls();
    const el = els.find(e => e.dataset.panelIdx === String(idx));
    if (el) {
      const sep = el.querySelector<HTMLDivElement>('[data-sep]');
      if (sep) {
        const sepTop = sep.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
        container.scrollTo({ top: sepTop, behavior: 'smooth' });
      } else {
        container.scrollTo({ top: getOffsetInContainer(el), behavior: 'smooth' });
      }
    }
  }, [getVisiblePanelEls, getOffsetInContainer, requisito]);

  // Track visible panel + detect bottom during scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const onScroll = () => {
      const els = getVisiblePanelEls();
      const scrollTop = container.scrollTop;
      
      // Detect if scrolled to bottom (within 40px tolerance)
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 40;
      setIsAtBottom(atBottom);

      if (atBottom && els.length > 0) {
        setCurrentVisibleIdx(els.length - 1);
        return;
      }

      // If requisito exists and first panel isn't reached yet, show "Ver 1er Año"
      if (els.length > 0) {
        const firstPanelTop = getOffsetInContainer(els[0]);
        if (requisito && scrollTop < firstPanelTop - 20) {
          setCurrentVisibleIdx(-1);
          return;
        }
      }

      let closest = 0;
      let closestDist = Infinity;
      els.forEach(el => {
        const idx = Number(el.dataset.panelIdx);
        const top = getOffsetInContainer(el);
        const dist = Math.abs(top - scrollTop);
        if (dist < closestDist) { closestDist = dist; closest = idx; }
      });
      setCurrentVisibleIdx(closest);

      // Track visible cuatrimestre (mobile)
      const cuatEls = Array.from(container.querySelectorAll<HTMLDivElement>('[data-cuat-idx]'))
        .filter(el => el.offsetParent !== null);
      if (cuatEls.length > 0) {
        let closestCuat = 0;
        let closestCuatDist = Infinity;
        cuatEls.forEach(el => {
          const idx = Number(el.dataset.cuatIdx);
          const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + scrollTop;
          const dist = Math.abs(top - scrollTop);
          if (dist < closestCuatDist) { closestCuatDist = dist; closestCuat = idx; }
        });
        setCurrentCuatIdx(closestCuat);
      }
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [showAll, getVisiblePanelEls, getOffsetInContainer, panels.length]);

  // Next panel info for the floating button
  const nextIdx = currentVisibleIdx + 1;
  const hasNext = nextIdx >= 0 && nextIdx < panels.length;
  const nextPanel = hasNext ? panels[nextIdx] : null;
  const nextLabel = nextPanel ? nextPanel.año : null;

  // Floating button: show "Volver al inicio" when at bottom, otherwise "Ver X"
  const showFloatingNav = showAll || (typeof window !== 'undefined' && window.innerWidth < 768);

  // ── Cuatrimestre-level navigation (mobile only) ──
  const allCuatLabels = useMemo(() => panels.flatMap(p => p.cuatrimestres.map(c => c.label)), [panels]);
  const [currentCuatIdx, setCurrentCuatIdx] = useState(0);
  const [cuatBtnVisible, setCuatBtnVisible] = useState(true);

  // Auto-hide cuatrimestre button after 5s on first appearance
  const cuatHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cuatInitialShown = useRef(false);
  useEffect(() => {
    if (!cuatInitialShown.current) {
      cuatInitialShown.current = true;
      setCuatBtnVisible(true);
      cuatHideTimer.current = setTimeout(() => setCuatBtnVisible(false), 5000);
    }
    return () => { if (cuatHideTimer.current) clearTimeout(cuatHideTimer.current); };
  }, []);
  const cuatGracePeriod = useRef(false);
  const showCuatBtn = useCallback(() => {
    if (cuatHideTimer.current) clearTimeout(cuatHideTimer.current);
    cuatGracePeriod.current = false;
    setCuatBtnVisible(true);
  }, []);
  const hideCuatBtn = useCallback(() => {
    if (cuatGracePeriod.current) return;
    cuatHideTimer.current = setTimeout(() => setCuatBtnVisible(false), 200);
  }, []);

  // When year button disappears while cuat is hovered/open, keep it open 5s more
  const prevHasNext = useRef(hasNext);
  useEffect(() => {
    if (prevHasNext.current && !hasNext && cuatBtnVisible) {
      cuatGracePeriod.current = true;
      if (cuatHideTimer.current) clearTimeout(cuatHideTimer.current);
      cuatHideTimer.current = setTimeout(() => {
        cuatGracePeriod.current = false;
        setCuatBtnVisible(false);
      }, 5000);
    }
    prevHasNext.current = hasNext;
  }, [hasNext, cuatBtnVisible]);

  // Scroll to a cuatrimestre by its global index
  const scrollToCuat = useCallback((idx: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLDivElement>(`[data-cuat-idx="${idx}"]`);
    if (el) {
      const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      container.scrollTo({ top: Math.max(0, top - 8), behavior: 'smooth' });
    }
  }, []);

  const nextCuatIdx = currentCuatIdx + 1;
  const hasNextCuat = nextCuatIdx < allCuatLabels.length;
  const nextCuatLabel = hasNextCuat ? allCuatLabels[nextCuatIdx] : null;

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-0 min-h-0 overflow-hidden md:rounded-xl md:border md:border-[#00c7b1]/20" style={{
      background: 'linear-gradient(160deg, rgba(18,46,46,0.4) 0%, rgba(10,30,28,0.6) 100%)',
    }}>
      {/* Year buttons — horizontal on mobile, vertical sidebar on desktop */}
      <div className="flex-shrink-0 flex flex-row items-center md:items-stretch md:flex-col gap-1 md:gap-0.5 w-full max-w-full min-w-0 md:w-[160px] md:py-1.5 md:px-1.5 md:overflow-hidden md:border-r md:border-[#00c7b1]/12 px-1.5 py-1.5 overflow-x-auto md:overflow-x-hidden" style={{
        background: 'linear-gradient(180deg, rgba(1,42,31,0.35) 0%, rgba(6,28,26,0.5) 100%)',
      }}>
        {/* Ver plan completo — desktop only */}
        <button
          onClick={() => setActive(-1)}
          className="hidden md:flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-300 flex-shrink-0"
          style={showAll ? {
            background: 'linear-gradient(135deg, #008c7d, #006c5b)',
            border: '1px solid rgba(0,199,177,0.3)',
            boxShadow: '0 2px 8px rgba(0,199,177,0.15)',
          } : {
            background: 'linear-gradient(135deg, #046353, #058c70)',
            border: '1px solid rgba(0,199,177,0.2)',
          }}
        >
          <svg className="w-3 h-3 flex-shrink-0 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span className="text-[0.56rem] font-bold uppercase tracking-wider whitespace-nowrap text-white">Plan completo</span>
        </button>

        <div className="hidden md:block mx-1.5 my-px h-px" style={{ background: 'linear-gradient(90deg, rgba(0,199,177,0.12) 0%, transparent 80%)' }} />

        {/* Requisitos button — scrolls to requisito section */}
        {requisito && (<>
          {/* Mobile */}
          <button
            onClick={() => setActive(-2)}
            className="md:hidden px-3 py-2.5 min-h-[44px] rounded flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 flex-shrink-0"
            style={{
              background: 'rgba(220,60,60,0.12)',
              border: '1px solid rgba(220,60,60,0.5)',
            }}
          >
            <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-red-600 text-[0.5rem] font-black leading-none" style={{ background: '#e69b05' }}>!</span>
            <span className="text-[0.55rem] leading-none font-bold uppercase tracking-wider whitespace-nowrap text-white">Requisitos</span>
          </button>
          {/* Desktop */}
          <button
            onClick={() => setActive(-2)}
            className="hidden md:flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-200 flex-shrink-0"
            style={{
              background: 'rgba(220,60,60,0.12)',
              border: '1px solid rgba(220,60,60,0.5)',
            }}
          >
            <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-red-600 text-[0.5rem] font-black leading-none" style={{ background: '#e69b05' }}>!</span>
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.06em] whitespace-nowrap text-white">Requisitos</span>
          </button>
          <div className="hidden md:block mx-1.5 my-px h-px" style={{ background: 'linear-gradient(90deg, rgba(220,60,60,0.15) 0%, transparent 80%)' }} />
        </>)}

        {/* Year buttons — minimalist inactive, solid brand when active */}
        {panels.map((panel, i) => {
          const isDesktopActive = i === active;
          const isMobileActive = i === currentVisibleIdx;
          const label = panel.año;
          const handleClick = () => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              scrollToPanel(i);
            } else {
              setActive(i);
            }
          };
          return (
            <span key={i} className="contents">
              {/* Mobile button */}
              <button
                onClick={handleClick}
                className={`md:hidden px-3 py-2.5 min-h-[44px] rounded flex flex-1 items-center justify-center cursor-pointer transition-all duration-200 border border-[#00c7b1]/30 ${
                  isMobileActive ? 'bg-[#00c7b1]/10 border-[#00c7b1]/60 shadow-[0_0_8px_rgba(0,199,177,0.2)]' : ''
                }`}
                style={isMobileActive ? {
                  background: 'linear-gradient(135deg, #008c7d, #006c5b)',
                  border: '1px solid rgba(0,199,177,0.5)',
                  boxShadow: '0 2px 8px rgba(0,199,177,0.2)',
                } : undefined}
              >
                <span className={`text-[0.55rem] leading-none font-bold uppercase tracking-wider whitespace-nowrap ${
                  isMobileActive ? 'text-white' : 'text-[#00c7b1]'
                }`}>
                  {label}
                </span>
              </button>
              {/* Desktop button */}
              <button
                onClick={handleClick}
                className={`hidden md:block px-2 py-1.5 rounded-lg text-center cursor-pointer transition-all duration-200 flex-shrink-0 ${
                  isDesktopActive ? '' : 'border border-[#00c7b1]/30 hover:bg-[#00c7b1]/15 hover:border-[#00c7b1]/50'
                }`}
                style={isDesktopActive ? {
                  background: 'linear-gradient(135deg, #008c7d, #006c5b)',
                  border: '1px solid rgba(0,199,177,0.5)',
                  boxShadow: '0 2px 10px rgba(0,199,177,0.2)',
                } : undefined}
              >
                <span className={`text-[0.6rem] font-bold uppercase tracking-[0.06em] whitespace-nowrap ${
                  isDesktopActive ? 'text-white' : 'text-[#00c7b1]'
                }`}>
                  {label}
                </span>
              </button>
            </span>
          );
        })}


      </div>

      {/* Right: content area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden rounded-xl md:rounded-none border border-[#00c7b1]/15 md:border-0 relative" style={{
        background: 'linear-gradient(160deg, rgba(18,46,46,0.3) 0%, rgba(10,30,28,0.5) 100%)',
      }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 10% 20%, rgba(0,199,177,0.03) 0%, transparent 60%)',
        }} />
        {/* Header bar — desktop only */}
        <div className="hidden md:flex flex-shrink-0 items-center gap-2.5 px-5 py-2 relative z-10" style={{
          background: 'linear-gradient(135deg, rgba(1,42,31,0.5) 0%, rgba(13,48,64,0.3) 100%)',
          borderBottom: '1px solid rgba(0,199,177,0.12)',
        }}>
          <p className="text-sm font-extrabold text-white uppercase tracking-[0.08em]">{activeLabel}</p>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,199,177,0.15) 0%, transparent 80%)' }} />
        </div>

        {/* Scrollable content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 md:px-5 pt-3 flex flex-col gap-2 custom-scrollbar relative z-10 pb-20 md:pb-10">
          {/* Mobile: all panels with requisito on top */}
          <div className="md:hidden flex flex-col gap-2">
            {requisito && (<>
              <div data-requisito className="flex items-start gap-2.5 py-2.5 rounded-lg border border-[#e69b05]/40 px-2" style={{ background: 'rgba(230,155,5,0.08)' }}>
                <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-red-600 text-xs font-black leading-none" style={{ background: '#e69b05' }}>!</span>
                <div className="min-w-0">
                  <p className="text-[0.6rem] font-black uppercase tracking-widest text-[#e69b05] mb-0.5">Requisito obligatorio</p>
                  {requisito.items.map((item, i) => (
                    <p key={i} className="text-[0.65rem] text-[#e0d8c8] leading-snug">{item}</p>
                  ))}
                </div>
              </div>
              <div data-sep className="my-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,199,177,0.2) 0%, transparent 60%)' }} />
            </>)}
            {panels.reduce<{ elements: React.ReactNode[]; cuatAcc: number }>((acc, panel, i) => {
              acc.elements.push(
                <div key={i} data-panel-idx={i}>
                  {i > 0 && <div data-sep className="my-3 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,199,177,0.2) 0%, transparent 60%)' }} />}
                  <PanelContent panel={panel} showTitle cuatStartIdx={acc.cuatAcc} />
                </div>
              );
              acc.cuatAcc += panel.cuatrimestres.length;
              return acc;
            }, { elements: [], cuatAcc: 0 }).elements}
            {/* Botón Volver al inicio para Mobile con margen inferior para el scroll */}
            <div className="mt-12 mb-[30vh] flex justify-center">
              <button
                onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#00c7b1]/10 border border-[#00c7b1]/30 text-[#00c7b1] font-bold uppercase tracking-widest hover:bg-[#00c7b1]/20 transition-all cursor-pointer group"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                <span>Volver al inicio</span>
              </button>
            </div>
          </div>
          {/* Desktop: showAll or single panel, requisito on top when showAll */}
          <div className="hidden md:block">
            {showRequisito && requisito ? (
              <div className="flex items-start gap-3 py-4 rounded-lg border border-[#e69b05]/40 px-4" style={{ background: 'rgba(230,155,5,0.08)' }}>
                <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-red-600 text-sm font-black leading-none" style={{ background: '#e69b05' }}>!</span>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-[#e69b05] mb-1">Requisito obligatorio</p>
                  {requisito.items.map((item, i) => (
                    <p key={i} className="text-sm text-[#e0d8c8] leading-relaxed">{item}</p>
                  ))}
                </div>
              </div>
            ) : showAll ? (
              <div>
                {requisito && (
                  <div data-requisito className="flex items-start gap-2.5 py-2.5 rounded-lg border border-[#e69b05]/40 mb-3 px-2" style={{ background: 'rgba(230,155,5,0.08)' }}>
                    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-red-600 text-xs font-black leading-none" style={{ background: '#e69b05' }}>!</span>
                    <div className="min-w-0">
                      <p className="text-[0.65rem] font-black uppercase tracking-widest text-[#e69b05] mb-0.5">Requisito obligatorio</p>
                      {requisito.items.map((item, i) => (
                        <p key={i} className="text-xs text-[#e0d8c8] leading-snug">{item}</p>
                      ))}
                    </div>
                  </div>
                )}
                {panels.reduce<{ elements: React.ReactNode[]; cuatAcc: number }>((acc, panel, i) => {
                  acc.elements.push(
                    <div key={i} data-panel-idx={i}>
                      {i > 0 && <div data-sep className="my-3 h-px" style={{ background: 'linear-gradient(90deg, rgba(0,199,177,0.2) 0%, transparent 60%)' }} />}
                      <PanelContent panel={panel} showTitle cuatStartIdx={acc.cuatAcc} />
                    </div>
                  );
                  acc.cuatAcc += panel.cuatrimestres.length;
                  return acc;
                }, { elements: [], cuatAcc: 0 }).elements}

                {/* Botón Volver al inicio para Desktop Plan Completo con margen inferior para el scroll */}
                <div className="mt-12 mb-[30vh] flex justify-center">
                  <button
                    onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#00c7b1]/10 border border-[#00c7b1]/30 text-[#00c7b1] font-bold uppercase tracking-widest hover:bg-[#00c7b1]/20 transition-all cursor-pointer group"
                  >
                    <svg className="w-4 h-4 transition-transform group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    <span>Volver al inicio</span>
                  </button>
                </div>
              </div>
            ) : (
              activePanel && <PanelContent panel={activePanel} />
            )}
          </div>
        </div>

        {/* Top+bottom fade overlays on mobile */}
        <div className="md:hidden absolute top-0 left-0 right-0 h-4 z-10 pointer-events-none" style={{
          background: 'linear-gradient(to bottom, rgba(10,30,28,0.7) 0%, transparent 100%)',
        }} />
        <div className="md:hidden absolute bottom-0 left-0 right-0 h-10 z-10 pointer-events-none" style={{
          background: 'linear-gradient(to top, rgba(10,30,28,0.5) 0%, transparent 100%)',
        }} />

        {/* Floating cuatrimestre nav button — mobile only, circle → expands left on hover */}
        {hasNextCuat && !isAtBottom && (
          <button
            onClick={() => {
              showCuatBtn();
              scrollToCuat(nextCuatIdx);
              if (cuatHideTimer.current) clearTimeout(cuatHideTimer.current);
              cuatHideTimer.current = setTimeout(() => setCuatBtnVisible(false), 5000);
            }}
            onPointerEnter={showCuatBtn}
            onPointerLeave={hideCuatBtn}
            className="absolute right-5 z-20 md:hidden flex items-center justify-center rounded-full cursor-pointer overflow-hidden"
            style={{
              bottom: hasNext ? '3.5rem' : '0.75rem',
              height: '32px',
              minWidth: '32px',
              maxWidth: cuatBtnVisible ? '220px' : '32px',
              padding: cuatBtnVisible ? '0 12px' : '0 9px',
              background: 'linear-gradient(135deg, #1a5c4a, #14473a)',
              border: '1px solid rgba(0,199,177,0.2)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
              transition: 'max-width 0.3s ease, padding 0.3s ease, bottom 0.3s ease',
            }}
          >
            <span
              className="text-[0.5rem] font-bold uppercase tracking-wider text-[#b4e8dd] whitespace-nowrap"
              style={{
                opacity: cuatBtnVisible ? 1 : 0,
                maxWidth: cuatBtnVisible ? 160 : 0,
                marginRight: cuatBtnVisible ? 5 : 0,
                overflow: 'hidden',
                transition: 'opacity 0.3s, max-width 0.3s, margin 0.3s',
              }}
            >
              Ver {nextCuatLabel}
            </span>
            {/* Chevron — rotates from down (closed) to left (open) */}
            <svg
              style={{
                width: 14, height: 14, minWidth: 14, minHeight: 14,
                transform: cuatBtnVisible ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
              className="text-[#b4e8dd] flex-shrink-0"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* Floating nav button — mobile */}
        {hasNext && (
          <button
            onClick={() => {
              if (isAtBottom) {
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                scrollToPanel(nextIdx);
              }
            }}
            className="absolute bottom-3 right-5 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full cursor-pointer transition-all duration-300 md:hidden group"
            style={{
              background: 'linear-gradient(135deg, #00c7b1, #009681)',
              boxShadow: '0 4px 24px rgba(0,199,177,0.3), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {isAtBottom ? (
              <>
                <svg className="w-3.5 h-3.5 text-[#013729]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                <span className="text-[0.6rem] font-black uppercase tracking-wider text-[#013729] whitespace-nowrap">Inicio</span>
              </>
            ) : (
              <>
                <span className="text-[0.6rem] font-black uppercase tracking-wider text-[#013729] whitespace-nowrap">
                  Ver {nextLabel}
                </span>
                <svg className="w-3.5 h-3.5 text-[#013729]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}

        {/* Floating nav button — desktop showAll */}
        {showAll && hasNext && (
          <button
            onClick={() => {
              if (isAtBottom) {
                scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                scrollToPanel(nextIdx);
              }
            }}
            className="absolute bottom-3 right-6 z-20 hidden md:flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer transition-all duration-300 hover:brightness-110 group"
            style={{
              background: 'linear-gradient(135deg, #00c7b1, #009681)',
              boxShadow: '0 4px 24px rgba(0,199,177,0.3), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            {isAtBottom ? (
              <>
                <svg className="w-4 h-4 text-[#013729]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                <span className="text-[0.65rem] font-black uppercase tracking-wider text-[#013729] whitespace-nowrap">Volver al inicio</span>
              </>
            ) : (
              <>
                <span className="text-[0.65rem] font-black uppercase tracking-wider text-[#013729] whitespace-nowrap">
                  Ver {nextLabel}
                </span>
                <svg className="w-4 h-4 text-[#013729]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main carousel modal ──
export default function CarouselModal({ carrera, onClose, initiallyVisible = false }: Props) {
  const slides = useMemo(() => {
    return (carrera.slides || [])
      .filter(s => s.type !== 'modalidad' && s.type !== 'evaluacion');
  }, [carrera.slides]);

  const [slideIdx, setSlideIdx] = useState(0);
  const [visible, setVisible] = useState(initiallyVisible);
  const [closing, setClosing] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const totalSlides = slides.length;
  const { cleanName } = getCleanName(carrera);

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
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  const waMsg = `Hola, me gustaría recibir más información sobre ${carrera.nombre}`;
  const waHref = `https://wa.me/5491166522722?text=${encodeURIComponent(waMsg)}`;
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/carreras/${carreraToSlug(carrera)}`
    : '';

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className={`absolute inset-0 bg-[#011a14]/80 backdrop-blur-[3px] transition-opacity duration-300 ${visible && !closing ? 'opacity-100' : 'opacity-0'}`} onClick={handleClose} />

      {/* Panel */}
      <div className={`relative z-10 bg-[#1c2f31] border-2 border-[#00c7b1] rounded-2xl w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl md:w-[min(64rem,75vw)]
        h-[90vh] sm:h-[92vh] max-h-[90vh] sm:max-h-[92vh] overflow-hidden flex flex-col
        shadow-[0_0_50px_rgba(0,199,177,0.3)]`}>

        {/* Header */}
        <div className="flex-shrink-0 px-5 py-3 sm:px-6 sm:py-4 border-b border-[#00c7b1]/20 bg-[#051a1a]">
          <div className="flex justify-between items-center gap-3">
            <h3 className={`text-xl sm:text-2xl font-black text-white uppercase tracking-tighter leading-tight truncate min-w-0 ${slideIdx === 0 ? 'invisible' : ''}`}>
              {cleanName}
            </h3>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <img src="/imagenes/Modales/Abogac%C3%ADa/logo_siglo.png" alt="Siglo 21" className="h-7 sm:h-9 w-auto object-contain block" />
              <button ref={closeBtnRef} onClick={handleClose}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-red-600/20 text-red-500 hover:bg-red-600/40 hover:text-red-400 transition-colors" aria-label="Cerrar">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Slides */}
        <div className="flex-1 min-h-0 overflow-hidden relative" style={{ contain: 'strict' }}>
          <div className="flex h-full will-change-transform transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]" style={{ transform: `translateX(-${slideIdx * 100}%)` }}>
            {slides.map((slide, si) => (
              <div key={si} className="flex-shrink-0 w-full h-full overflow-hidden" style={{ contain: 'layout paint', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
                {renderSlide(slide, carrera, si === slideIdx)}
              </div>
            ))}
          </div>
        </div>

        {/* Carousel nav */}
        <div className="flex-shrink-0 flex justify-between items-center px-2 py-2.5 sm:px-6 sm:py-4 bg-[#011a14] border-t border-[#00c7b1]/15">
          <button onClick={() => setSlideIdx(i => Math.max(0, i - 1))} disabled={slideIdx === 0} aria-label="Slide anterior"
            className="flex items-center gap-1 sm:gap-2 text-[#00c7b1] text-[0.6rem] sm:text-sm font-bold uppercase tracking-wider px-2 py-1.5 sm:px-4 sm:py-2 rounded border border-[#00c7b1]/30 hover:bg-[#00c7b1]/10 disabled:opacity-30 disabled:pointer-events-none transition-all">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            <span className="hidden min-[360px]:inline">Anterior</span>
          </button>
          <div className="flex justify-center items-center gap-1.5 sm:gap-2.5">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setSlideIdx(i)} className={`carousel-dot ${slideIdx === i ? 'active' : ''}`} aria-label={`Ir a slide ${i + 1}`} aria-current={slideIdx === i ? 'step' : undefined} />
            ))}
          </div>
          <button onClick={() => setSlideIdx(i => Math.min(totalSlides - 1, i + 1))} disabled={slideIdx === totalSlides - 1} aria-label="Slide siguiente"
            className="flex items-center gap-1 sm:gap-2 text-[#00c7b1] text-[0.6rem] sm:text-sm font-bold uppercase tracking-wider px-2 py-1.5 sm:px-4 sm:py-2 rounded bg-[#00c7b1]/10 border border-[#00c7b1]/50 hover:bg-[#00c7b1]/20 disabled:opacity-30 disabled:pointer-events-none transition-all">
            <span className="hidden min-[360px]:inline">Siguiente</span>
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* Footer */}
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

// ── Render individual slide by type ──
function renderSlide(slide: CarreraSlide, carrera: Carrera, isVisible: boolean) {
  switch (slide.type) {
    case 'portada': return <SlidePortadaView slide={slide} carrera={carrera} />;
    case 'modalidad': return <SlideModalidadView slide={slide} />;
    case 'evaluacion': return <SlideEvaluacionView slide={slide} />;
    case 'plan_estudios': return <SlidePlanView slide={slide} carrera={carrera} isVisible={isVisible} />;
    case 'cierre': return <SlideCierreView slide={slide} carrera={carrera} />;
    default: return null;
  }
}

function SlidePortadaView({ slide, carrera }: { slide: import('./types').SlidePortada; carrera: Carrera }) {
  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      <div className="flex-1 flex flex-col md:justify-start pt-1 sm:pt-2 pb-6 sm:pb-8 px-6 sm:px-8 md:pt-3 md:pb-1 md:px-8 md:gap-1 bg-gradient-to-br from-[#011f17] to-[#0c2920] overflow-y-auto">
        {/* Mobile: two zones - content (grows, centers children) + image/badges (fixed bottom) */}
        {/* Desktop: all sequential with justify-start */}

        <div className="flex-shrink-0 flex items-center justify-between flex-wrap gap-x-[clamp(0.4rem,2vw,1rem)] gap-y-2 text-left w-full">
          <div className="flex items-center gap-[clamp(0.6rem,2.2vw,1.2rem)]">
            <img src="/imagenes/Modales/Abogac%C3%ADa/9KPyxWIc_400x400.jpg" alt="Siglo 21" className="h-[clamp(1.4rem,2.8vh,1.8rem)] w-auto rounded-sm block shadow-sm" />
            <p className="text-[clamp(0.62rem,1.6vh,0.78rem)] font-black tracking-widest text-[#00c7b1] uppercase m-0 leading-tight">
              <span>Nivel: {carrera.nivel}</span>
              <span className="block text-white">Duración: {carrera.duracion}</span>
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center bg-[#00c7b1]/12 border border-[#00c7b1]/35 rounded px-2.5 py-1">
            <span className="text-[clamp(0.55rem,1.6vw,0.72rem)] font-black text-white uppercase tracking-wider leading-none">
              Modalidad: <span className="text-[#00c7b1]">Virtual</span>
            </span>
          </div>
        </div>

        {/* Línea independiente para quedar pegada al header */}
        <div className="flex-shrink-0 border-t border-[#00c7b1]/20 w-full mt-1.5 md:mt-1" />

        <div className="flex-shrink-0 flex justify-start pt-3 md:pt-[clamp(0.5rem,2vh,1rem)] mt-0 md:mt-0 gap-2.5">
          {(() => { const { prefix, cleanName } = getCleanName(carrera);
            const cccMatch = cleanName.match(/\s*\(CCC\)\s*$/i);
            const displayName = cccMatch ? cleanName.replace(cccMatch[0], '') : cleanName;
            return (<>
            <div className="flex gap-2.5">
              <div className="w-[3px] bg-[#00c7b1] rounded-sm flex-shrink-0 self-stretch" />
              <div>
                {prefix && <p className="text-[clamp(0.55rem,2vw,0.75rem)] font-bold text-[#00c7b1] uppercase tracking-widest leading-none mb-1.5 md:mb-1 text-left">{prefix}</p>}
                <h2 className={`font-black text-white leading-[1] md:leading-[1.05] uppercase tracking-tighter ${displayName.length > 40 ? 'text-[clamp(0.9rem,min(5vw,3vh),1.4rem)] md:text-[clamp(1.2rem,min(2.5vw,3vh),1.8rem)]' : displayName.length > 25 ? 'text-[clamp(1rem,min(6vw,4vh),1.7rem)] md:text-[clamp(1.4rem,min(3vw,4vh),2.2rem)]' : 'text-[clamp(1.2rem,min(7.5vw,5vh),2rem)] md:text-[clamp(1.8rem,min(3.5vw,5vh),3rem)]'}`}>{displayName.toUpperCase()}</h2>
                {cccMatch && <p className="text-[0.6rem] md:text-xs font-bold text-[#7ca19b] uppercase tracking-widest mt-0.5">Ciclo de Complementación Curricular</p>}
              </div>
            </div>
          </>); })()}
        </div>

        {/* Mobile: banner bajo el título — foto mobile si existe, si no cover generado */}
        <div className="md:hidden flex-shrink-0 relative w-full h-[22vh] rounded-xl overflow-hidden border border-[#00c7b1]/15 mt-3">
          {slide.imagen_mobile ? (
            <>
              <img
                src={encodeImagePath(slide.imagen_mobile)}
                alt={carrera.nombre}
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 70%, rgba(1,31,23,0.55) 100%)' }} />
            </>
          ) : (
            <CareerCoverArt carrera={carrera} />
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center gap-[clamp(0.5rem,2vh,1rem)] md:gap-[clamp(0.25rem,1.5vh,0.5rem)]">
          {slide.bullets.map((b, i) => (
            <p key={i} className="text-[clamp(0.8rem,2.5vw,0.95rem)] md:text-[clamp(0.9rem,2vh,1.25rem)] text-[#e0f0ed] leading-snug font-medium">
              <span className="text-[#00c7b1] font-bold mr-1">&bull;</span> {b}
            </p>
          ))}
        </div>

        {slide.badges && (
          <div className="md:hidden mt-auto flex-shrink-0 grid grid-cols-2 gap-2 border-t border-[#00c7b1]/20 pt-2">
            {slide.badges.map((badge, i) => (
              <div key={i} className="bg-[#00c7b1]/5 border border-[#00c7b1]/20 rounded p-1.5 flex flex-col justify-center items-center text-center">
                <span className="block text-[0.45rem] font-bold uppercase tracking-widest text-[#00c7b1]">{badge.label}</span>
                <span className={`block text-white font-extrabold mt-0.5 ${badge.value.length > 35 ? 'text-[0.6rem]' : 'text-xs'}`}>{badge.value}</span>
              </div>
            ))}
          </div>
        )}
        {slide.badges && (
          <div className="hidden md:grid mt-auto grid-cols-2 gap-2 border-t border-[#00c7b1]/20 pt-2 flex-shrink-0">
            {slide.badges.map((badge, i) => (
              <div key={i} className="bg-[#00c7b1]/5 border border-[#00c7b1]/20 rounded p-1.5 flex flex-col justify-start items-start text-left">
                <span className="block text-[0.5rem] font-bold uppercase tracking-widest text-[#00c7b1]">{badge.label}</span>
                <span className={`block text-white font-extrabold mt-0.5 ${badge.value.length > 35 ? 'text-xs' : 'text-sm'}`}>{badge.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {slide.imagen_desktop && (
        <div className="hidden md:flex flex-none h-full overflow-hidden border-l border-[#00c7b1]/20 relative" style={{ width: '42%' }}>
          <img src={encodeImagePath(slide.imagen_desktop!)} alt={carrera.nombre} className={`absolute inset-0 w-full h-full object-cover ${['Abogacía', 'Comercio Internacional', 'Contador Público', 'Administración Pública', 'Administración Hotelera', 'Relaciones Internacionales', 'Profesorado Universitario para Nivel Secundario y Superior (CCC)', 'Negocios Agroecológicos', 'Responsabilidad y Gestión Social', 'Relaciones Laborales', 'Investigación de la escena del crimen'].includes(carrera.nombre) ? '' : 'brightness-150'}`} style={{ objectPosition: slide.imagen_desktop_position || 'top' }} />
        </div>
      )}
    </div>
  );
}

function SlideModalidadView({ slide }: { slide: import('./types').SlideModalidad }) {
  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">
      {slide.imagen && (
        <div className="w-full hidden min-[400px]:block md:w-[42%] shrink-0 relative overflow-hidden h-[clamp(4.5rem,18vh,12rem)] md:h-full">
          <img src={encodeImagePath(slide.imagen!)} alt="Modalidad" className="absolute inset-0 w-full h-full object-cover object-[center_15%]" />
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-[#1c2f31] to-transparent z-20 pointer-events-none" />
        </div>
      )}
      <div className="flex-1 overflow-hidden flex flex-col justify-center">
        <div className="px-6 md:px-10 py-6 flex flex-col gap-5">
          <div>
            <p className="text-[0.65rem] font-bold tracking-widest text-[#00c7b1] uppercase mb-1">Modalidad de cursado</p>
            <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider">{slide.titulo}</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
            {slide.items.map((item, i) => (
              <div key={i} className="flex items-start gap-1 md:gap-2 text-sm leading-snug">
                <span className="text-[#00c7b1] font-bold mt-[0.1em] shrink-0">✓</span>
                <span className="text-[#b4d3ce]">
                  {item.bold_inicio && <b className="text-white">{item.bold_inicio}</b>}
                  {item.texto}
                  {item.bold_fin && <b className="text-white">{item.bold_fin}</b>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideEvaluacionView({ slide }: { slide: import('./types').SlideEvaluacion }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-3 sm:p-10 gap-2 sm:gap-4 bg-gradient-to-br from-[#011f17] to-[#0c2920] overflow-y-auto custom-scrollbar">
      <div className="text-center flex-shrink-0">
        <p className="text-[0.6rem] font-bold tracking-[0.16em] text-[#00c7b1] uppercase mb-0.5 sm:mb-1">Proceso de evaluacion</p>
        <h3 className="text-sm sm:text-lg font-black text-white uppercase tracking-wider">¿Como te evaluamos?</h3>
      </div>
      <div className="flex gap-1.5 sm:gap-3 w-full max-w-md">
        {slide.cards.map((card, i) => (
          <div key={i} className={`flex-1 min-w-0 rounded-xl p-1.5 sm:p-4 text-center ${card.accent ? 'bg-[#00c7b1]/10 border-[1.5px] border-[#00c7b1]' : 'bg-[#1c2f31] border border-[#00c7b1]/18'}`}>
            <div className="text-2xl sm:text-4xl font-black text-[#00c7b1] leading-none">{card.numero}</div>
            <div className="text-[0.45rem] sm:text-[0.65rem] font-semibold text-[#7ca19b] uppercase tracking-normal sm:tracking-wider mt-1 whitespace-pre-line">{card.label}</div>
            <div className={`text-[0.45rem] sm:text-[0.6rem] mt-0.5 ${card.accent ? 'text-[#00c7b1] font-bold' : 'text-[#48b3a4]'}`}>{card.sub}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 sm:gap-1.5 flex-wrap justify-center">
        {slide.tags.map(tag => (
          <span key={tag} className="bg-[#00c7b1]/8 border border-[#00c7b1]/22 text-[#b4d3ce] text-[0.6rem] sm:text-[0.7rem] px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-semibold">{tag}</span>
        ))}
      </div>
      <p className="text-xs sm:text-sm text-[#7ca19b] text-center max-w-sm leading-relaxed [&_b]:text-[#00c7b1]" dangerouslySetInnerHTML={{ __html: slide.nota }} />
    </div>
  );
}

function SlidePlanView({ slide, carrera, isVisible }: { slide: SlidePlanEstudios; carrera: Carrera; isVisible?: boolean }) {
  const panels = flattenPaginas(slide.paginas);

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 gap-3 overflow-hidden" style={{
      background: 'linear-gradient(170deg, #041211 0%, #071d1b 30%, #082422 60%, #061716 100%)',
      backfaceVisibility: 'hidden',
      transform: 'translateZ(0)',
    }}>
      <div className="flex-shrink-0 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
          background: 'rgba(0,199,177,0.08)',
          border: '1px solid rgba(0,199,177,0.18)',
        }}>
          <svg className="w-3.5 h-3.5 text-[#00c7b1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[0.5rem] font-bold tracking-[0.14em] uppercase text-[#9ac5be]">{carrera.nivel} · {carrera.duracion}</p>
          <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wider leading-tight">Plan de Estudios</h3>
        </div>
        <button
          onClick={() => downloadPlanPDF(panels, carrera.nombre)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[0.58rem] md:text-[0.63rem] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex-shrink-0 hover:brightness-115"
          style={{
            background: 'linear-gradient(135deg, #005587, #058c70)',
            color: 'white',
            border: '1px solid rgba(0,199,177,0.25)',
          }}
        >
          <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="hidden sm:inline">Descargar Plan de Estudio</span>
          <span className="sm:hidden">Descargar</span>
          <span className="px-1.5 py-0.5 rounded text-[0.5rem] font-black tracking-wider" style={{ background: '#c0392b', color: 'white' }}>PDF</span>
        </button>
      </div>
      <PlanPanels paginas={slide.paginas} carreraNombre={carrera.nombre} isVisible={isVisible} />
    </div>
  );
}

function SlideCierreView({ slide, carrera }: { slide: import('./types').SlideCierre; carrera?: Carrera }) {
  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden relative bg-[#011f17]">
      {/* Mobile top banner */}
      {slide.imagen && (
        <div className="md:hidden relative h-[24vh] shrink-0 overflow-hidden">
          <img src={encodeImagePath(slide.imagen!)} alt="Instituto" className="absolute inset-0 w-full h-full object-cover object-center" />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent 55%, #011f17 100%)' }} />
        </div>
      )}
      {/* Desktop side image */}
      {slide.imagen && (
        <div className="hidden md:block w-[42%] shrink-0 relative overflow-hidden bg-[#0c2b24] z-10">
          <img src={encodeImagePath(slide.imagen!)} alt="Instituto" className="absolute inset-0 w-full h-full object-cover object-left-bottom" />
          <div className="absolute inset-0 z-20 pointer-events-none" style={{ background: 'linear-gradient(to right, transparent 60%, #011f17 100%)' }} />
        </div>
      )}
      <div className="flex-1 relative z-10 bg-transparent md:bg-[#011f17] px-6 py-5 md:p-10 flex flex-col justify-center gap-5 md:gap-8 overflow-y-auto custom-scrollbar">
        {/* Título */}
        <div className="text-center md:text-left">
          <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-tight" dangerouslySetInnerHTML={{ __html: slide.titulo || 'Estudiá <br><span class="text-[#00c7b1]">con nosotros</span>' }}></h3>
          {slide.subtitulo && (
            <p className="text-[#7ca19b] text-sm md:text-base mt-2">{slide.subtitulo}</p>
          )}
        </div>

        {/* Beneficios */}
        <div className="flex flex-col gap-3 md:gap-5">
          {slide.beneficios.map((b, i) => (
            <div key={i} className="flex items-center gap-2.5 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#00c7b1]/10 flex items-center justify-center text-[#00c7b1] shrink-0">
                <svg className="w-3.5 h-3.5 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  {(ICON_PATHS[b.icono] || ICON_PATHS.star).split(' M').map((d, di) => (
                    <path key={di} strokeLinecap="round" strokeLinejoin="round" d={di === 0 ? d : `M${d}`} />
                  ))}
                </svg>
              </div>
              <span className="text-white text-sm md:text-base font-semibold">{b.texto}</span>
            </div>
          ))}
        </div>

        {/* Botones WhatsApp + Ubicación */}
        <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-2.5 w-full">
          {carrera && (
            <a
              href={`https://wa.me/5491166522722?text=${encodeURIComponent(`Hola, quiero consultar los precios de ${carrera.nombre}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 flex-1 min-w-[10rem] max-w-[14rem] py-2 md:py-2.5 bg-[#25d366] hover:bg-[#1ebe57] text-white font-bold rounded-xl transition-all text-xs md:text-sm"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.504 3.935 1.395 5.608L.054 23.395a.5.5 0 0 0 .611.611l5.787-1.341A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 0 1-5.39-1.583l-.386-.232-3.437.797.813-3.437-.232-.386A9.94 9.94 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
              </svg>
              Consultar precios
            </a>
          )}
          <a
            href="https://maps.google.com/?q=Guamini+4876+Villa+Lugano+Buenos+Aires"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 flex-1 min-w-[10rem] max-w-[14rem] py-2 md:py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all text-xs md:text-sm border border-white/20"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            Guaminí 4876
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Cover art generado por carrera (banner mobile de la portada) ──
// Ícono según el área de estudio + variaciones (dirección del degradado,
// posición del glow, rotación) derivadas del nombre, para que cada carrera
// tenga un cover propio sin mantener archivos de imagen.

const COVER_ICONS: Record<string, string> = {
  derecho: 'M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z',
  tecnologia: 'M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z',
  negocios: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  salud: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  educacion: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5',
  comunicacion: 'M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46',
  ambiente: 'M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 01-1.161.886l-.143.048a1.107 1.107 0 00-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 01-1.652.928l-.679-.906a1.125 1.125 0 00-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 00-8.862 12.872M12.75 3.031a9 9 0 016.69 14.036m0 0l-.177-.529A2.25 2.25 0 0017.128 15H16.5l-.324-.324a1.453 1.453 0 00-2.328.377l-.036.073a1.586 1.586 0 01-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 01-5.276 3.67m0 0a9 9 0 01-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25',
  turismo: 'M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z',
  gobierno: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z',
  rrhh: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
  deporte: 'M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0',
  default: 'M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z',
  diseno: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42',
  juegos: 'M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z',
  moda: 'M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863l2.077-1.199m0-3.328a4.323 4.323 0 012.068-1.379l5.325-1.628a4.5 4.5 0 012.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0010.607 12m3.736 0l7.794 4.5-.802.215a4.5 4.5 0 01-2.48-.043l-5.326-1.629a4.324 4.324 0 01-2.068-1.379M14.343 12l-2.882 1.664',
  seguridad: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  logistica: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12',
  matematica: 'M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z',
};

// Ajustes puntuales donde el área del catálogo elige un ícono sin sentido
// (ej: "Negocios Digitales" cae en tecnología → chip). Se evalúan en orden
// sobre el nombre en minúsculas, antes del mapeo por área.
const COVER_OVERRIDES: [string, string][] = [
  ['negocios digitales', 'negocios'],
  ['diseño y animación', 'diseno'],
  ['videojuegos', 'juegos'],
  ['de moda', 'moda'],
  ['higiene', 'seguridad'],
  ['seguridad laboral', 'seguridad'],
  ['logística', 'logistica'],
  ['administración pública', 'gobierno'],
  ['políticas públicas', 'gobierno'],
  ['hotelera', 'turismo'],
  ['servicios de salud', 'salud'],
  ['sociología', 'rrhh'],
  ['matemática', 'matematica'],
  ['estadística', 'matematica'],
  ['venta', 'negocios'],
];

function coverIconFor(carrera: Carrera): string {
  const nombre = carrera.nombre.toLowerCase();
  for (const [kw, key] of COVER_OVERRIDES) {
    if (nombre.includes(kw)) return COVER_ICONS[key];
  }
  return COVER_ICONS[getAreaForCarrera(carrera) || 'default'] || COVER_ICONS.default;
}

function CareerCoverArt({ carrera }: { carrera: Carrera }) {
  let h = 0;
  for (const c of carrera.nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const icon = coverIconFor(carrera);
  const uid = `cv${h % 100000}`;
  const dirs = [
    { x1: 0, y1: 0, x2: 1, y2: 1 },
    { x1: 1, y1: 0, x2: 0, y2: 1 },
    { x1: 0, y1: 1, x2: 1, y2: 0 },
    { x1: 0, y1: 0, x2: 0, y2: 1 },
  ];
  const d = dirs[h % 4];
  const rot = (h % 5) * 4 - 8;
  const iconX = 470 + (h % 3) * 30;
  const glowX = (h >> 3) % 2 ? 620 : 130;
  const ringX = glowX === 620 ? 90 : 600;
  const dots = (h >> 5) % 2 === 0;

  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 720 360" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={carrera.nombre}>
      <defs>
        <linearGradient id={`${uid}-g`} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}>
          <stop offset="0" stopColor="#06251d" />
          <stop offset="0.55" stopColor="#0a2f26" />
          <stop offset="1" stopColor="#0e3d30" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#00c7b1" stopOpacity="0.16" />
          <stop offset="1" stopColor="#00c7b1" stopOpacity="0" />
        </radialGradient>
        <pattern id={`${uid}-p`} width="28" height="28" patternUnits="userSpaceOnUse">
          {dots
            ? <circle cx="2" cy="2" r="1.3" fill="#00c7b1" opacity="0.10" />
            : <path d="M0 28L28 0" stroke="#00c7b1" strokeWidth="0.6" opacity="0.07" />}
        </pattern>
      </defs>
      <rect width="720" height="360" fill={`url(#${uid}-g)`} />
      <rect width="720" height="360" fill={`url(#${uid}-p)`} />
      <circle cx={glowX} cy="150" r="230" fill={`url(#${uid}-glow)`} />
      <circle cx={ringX} cy="290" r="150" fill="none" stroke="#00c7b1" strokeWidth="1.2" opacity="0.12" />
      <circle cx={ringX} cy="290" r="105" fill="none" stroke="#00c7b1" strokeWidth="0.8" opacity="0.08" />
      <g transform={`translate(${iconX}, 55) scale(10.5) rotate(${rot} 12 12)`}>
        <path d={icon} fill="none" stroke="#00c7b1" strokeWidth="0.85" strokeLinecap="round" strokeLinejoin="round" opacity="0.34" />
      </g>
      <g transform="translate(52, 250) scale(2.6)">
        <path d={icon} fill="none" stroke="#00ffe1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
      </g>
    </svg>
  );
}

