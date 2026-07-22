'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { type Carrera, CATEGORIES, getCategoryForCarrera, findCarreraBySlug, carreraToSlug, AREAS, type AreaId, getAreaForCarrera, DURATION_GROUPS, type DurationGroupId, getDurationGroup } from './types';
import { getEscuelaIA } from './identidad-argentina';
import { esTeclab, getFamiliaTeclab, getTipoTeclab, TIPOS_GESTION, type TeclabFamilia } from './teclab';

const CareerModal = dynamic(() => import('./career-modal'));
const CarouselModal = dynamic(() => import('./carousel-modal'));
const IAModal = dynamic(() => import('./ia-modal'));
const TeclabModal = dynamic(() => import('./teclab-modal'));

// Levenshtein distance for fuzzy search
function levenshtein(a: string, b: string): number {
  const an = a.length, bn = b.length;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];
  for (let i = 0; i <= bn; i++) matrix[i] = [i];
  for (let j = 0; j <= an; j++) matrix[0][j] = j;
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      matrix[i][j] = b[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[bn][an];
}

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return true;
  // Check that every query word matches at least one word in the text
  const queryWords = q.split(/\s+/).filter(Boolean);
  const textWords = t.split(/\s+/);
  return queryWords.every(qw =>
    textWords.some(tw =>
      tw.includes(qw) || tw.startsWith(qw.slice(0, 3)) || (qw.length >= 3 && levenshtein(tw.slice(0, qw.length + 2), qw) <= 2)
    )
  );
}

// Parse career name into prefix + clean name
// Uses DB fields (prefix, nombre_corto) if available, otherwise falls back to parsing
function getCareerInfo(carrera: Carrera): { prefix: string; cleanName: string } {
  if (carrera.prefix !== null || carrera.nombre_corto !== null) {
    return { prefix: carrera.prefix || '', cleanName: carrera.nombre_corto || carrera.nombre };
  }
  return parseCareerName(carrera.nombre);
}

function parseCareerName(name: string): { prefix: string; cleanName: string } {
  let prefix = '';
  let cleanName = name;
  const nameLower = name.toLowerCase();

  const prefixMap = [
    { match: 'lic.', display: 'Licenciatura', len: 4 },
    { match: 'lic ', display: 'Licenciatura', len: 4 },
    { match: 'licenciatura', display: 'Licenciatura', len: 12 },
    { match: 'tec.', display: 'Tecnicatura', len: 4 },
    { match: 'tec ', display: 'Tecnicatura', len: 4 },
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
      cleanName = name.substring(p.len).trim();
      break;
    }
  }

  cleanName = cleanName.replace(/Universitaria|Universitario|Univ\./g, '').replace(/\s\s+/g, ' ').trim();

  if (cleanName.toLowerCase().startsWith('en ')) {
    prefix += ' en';
    cleanName = cleanName.substring(3).trim();
  }

  if (cleanName.length > 0) {
    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  }

  return { prefix, cleanName };
}

interface Props {
  carreras: Carrera[];
  initialCarreraSlug?: string;
}

export default function CareersCatalog({ carreras, initialCarreraSlug }: Props) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [placeholder, setPlaceholder] = useState('Buscar carrera');
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterArea, setFilterArea] = useState<AreaId | null>(null);
  const [filterDuration, setFilterDuration] = useState<DurationGroupId | null>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const hasFilters = filterArea !== null || filterDuration !== null || activeCategory !== 'all';
  const filterCount = (activeCategory !== 'all' ? 1 : 0) + (filterArea ? 1 : 0) + (filterDuration ? 1 : 0);
  // Responsive placeholder
  useEffect(() => {
    const updatePlaceholder = () => {
      if (window.innerWidth >= 768) {
        setPlaceholder('Buscar carrera, revisá nuestra oferta académica');
      } else {
        setPlaceholder('Buscar carrera');
      }
    };
    updatePlaceholder();
    window.addEventListener('resize', updatePlaceholder);
    return () => window.removeEventListener('resize', updatePlaceholder);
  }, []);

  // Close filter dropdown on click outside
  useEffect(() => {
    if (!showFilters) return;
    const handler = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showFilters]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);


  // Scroll so the sticky wrapper sits right below the navbar
  const scrollToSearchBar = useCallback(() => {
    const anchor = scrollAnchorRef.current;
    if (!anchor) return;
    const navbarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--navbar-height')) || 60;
    const anchorTop = anchor.getBoundingClientRect().top + window.pageYOffset;
    const targetScrollY = anchorTop - navbarHeight;
    if (Math.abs(window.pageYOffset - targetScrollY) > 1) {
      // Override CSS scroll-behavior: smooth to ensure instant jump
      const html = document.documentElement;
      html.style.scrollBehavior = 'auto';
      window.scrollTo(0, targetScrollY);
      html.style.scrollBehavior = '';
    }
  }, []);

  const delayedScroll = useCallback(() => {
    setTimeout(scrollToSearchBar, 150);
  }, [scrollToSearchBar]);

  // Group carreras by display category
  const grouped = useMemo(() => {
    const groups: Record<string, Carrera[]> = {};
    for (const c of carreras) {
      const cat = getCategoryForCarrera(c);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    }
    // Sort each group by name length (shorter first)
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => {
        const aClean = getCareerInfo(a).cleanName;
        const bClean = getCareerInfo(b).cleanName;
        return aClean.length - bClean.length;
      });
    }
    return groups;
  }, [carreras]);

  // Visible categories (categories that have at least one career)
  const visibleCategories = useMemo(() => {
    return CATEGORIES.filter(cat => {
      if (cat.id === 'all') return true;
      return grouped[cat.id] && grouped[cat.id].length > 0;
    });
  }, [grouped]);

  // Desktop filter dropdown sub-sections
  const [desktopFilterSection, setDesktopFilterSection] = useState<'area' | 'duracion' | null>(null);

  // Apply area/duration filters to grouped data
  const filteredGrouped = useMemo(() => {
    if (!hasFilters) return grouped;
    const result: Record<string, Carrera[]> = {};
    for (const [key, items] of Object.entries(grouped)) {
      const filtered = items.filter(c => {
        if (filterArea && getAreaForCarrera(c) !== filterArea) return false;
        if (filterDuration && getDurationGroup(c.duracion) !== filterDuration) return false;
        return true;
      });
      if (filtered.length > 0) result[key] = filtered;
    }
    return result;
  }, [grouped, filterArea, filterDuration, hasFilters]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    let results = carreras.filter(c => fuzzyMatch(c.nombre, searchQuery.trim()));
    if (filterArea) results = results.filter(c => getAreaForCarrera(c) === filterArea);
    if (filterDuration) results = results.filter(c => getDurationGroup(c.duracion) === filterDuration);
    return results;
  }, [carreras, searchQuery, filterArea, filterDuration]);

  // Sections to display (filtered by category)
  const sectionsToShow = useMemo(() => {
    if (searchResults) return []; // hide sections when searching
    const displayOrder = ['licenciaturas', 'tecnicaturas', 'teclab_tecnologia', 'teclab_gestion', 'identidad_argentina'];
    if (activeCategory === 'all') return displayOrder.filter(id => filteredGrouped[id]?.length);
    return [activeCategory].filter(id => filteredGrouped[id]?.length);
  }, [activeCategory, filteredGrouped, searchResults]);

  const handleCategoryClick = useCallback((catId: string) => {
    setActiveCategory(catId);
    setSearchQuery('');
    delayedScroll();
  }, [delayedScroll]);

  const handleCareerClick = useCallback((carrera: Carrera) => {
    setSelectedCarrera(carrera);
    // Las de convenio y las de Teclab tienen su propio modal de slides armado
    // desde los campos de texto: no cuentan como faltantes
    if (carrera.nivel !== 'Identidad Argentina' && !esTeclab(carrera) && (!carrera.slides || carrera.slides.length === 0)) {
      fetch('/api/notificar-carrera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: carrera.nombre }),
      }).catch(() => {});
    }
  }, []);



  // Auto-open modal from prop or URL param
  const initialSlug = initialCarreraSlug || null;
  useEffect(() => {
    const slug = initialSlug || new URLSearchParams(window.location.search).get('carrera');
    if (slug) {
      const found = findCarreraBySlug(carreras, slug)
        || carreras.find(c => c.nombre === slug);
      if (found) setSelectedCarrera(found);
    }
  }, [carreras, initialSlug]);

  // Update title and URL when modal opens/closes
  const defaultTitle = useRef<string>('');
  const defaultPath = useRef<string>('');
  const modalOpenRef = useRef(false);
  useEffect(() => {
    // Capture defaults once on mount
    if (!defaultTitle.current) defaultTitle.current = document.title;
    if (!defaultPath.current) defaultPath.current = window.location.pathname + window.location.search;
  }, []);
  useEffect(() => {
    if (selectedCarrera) {
      document.title = `${selectedCarrera.nombre} | Universidad Siglo 21 CAU Villa Lugano`;
      const carreraPath = `/carreras/${carreraToSlug(selectedCarrera)}`;
      if (window.location.pathname !== carreraPath) {
        if (!modalOpenRef.current) {
          // First open: push so back button closes modal
          window.history.pushState({ modal: true }, '', carreraPath);
        } else {
          // Navigating between careers: replace
          window.history.replaceState({ modal: true }, '', carreraPath);
        }
      }
      modalOpenRef.current = true;
    } else if (modalOpenRef.current) {
      document.title = `Universidad Siglo 21 CAU Villa Lugano | Oferta académica ${new Date().getFullYear()}`;
      if (window.location.pathname !== '/') {
        window.history.replaceState(null, '', '/');
      }
      modalOpenRef.current = false;
    }
  }, [selectedCarrera]);

  // Handle browser back button closing the modal
  useEffect(() => {
    const onPopState = () => {
      if (modalOpenRef.current) {
        setSelectedCarrera(null);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // `titleFiltrado` es como se nombra la seccion cuando el acento no se muestra:
  // las dos de Teclab comparten titulo y solo se distinguen por el acento.
  const sectionLabels: Record<string, { title: string; accent?: string; titleFiltrado?: string; placeholder: string }> = {
    licenciaturas: { title: 'Licenciaturas', accent: 'Grado', placeholder: 'BUSCAR LICENCIATURA...' },
    tecnicaturas: { title: 'Tecnicaturas', accent: 'Pregrado', placeholder: 'BUSCAR TECNICATURA...' },
    identidad_argentina: { title: 'Identidad Argentina', accent: 'Convenio', placeholder: 'BUSCAR PROGRAMA...' },
    teclab_tecnologia: { title: 'Teclab', accent: 'Tecnología', titleFiltrado: 'Teclab Tecnología', placeholder: 'BUSCAR TECNICATURA...' },
    teclab_gestion: { title: 'Teclab', accent: 'Gestión', titleFiltrado: 'Teclab Gestión', placeholder: 'BUSCAR TECNICATURA...' },
  };

  return (
    <>
      <div className="mx-auto w-full max-w-[2400px] pt-0 px-4 pb-4 sm:pt-0 sm:px-8 sm:pb-8 xl:px-20" data-testid="careers-catalog">

        {/* Scroll anchor (non-sticky, keeps its natural position) */}
        <div ref={scrollAnchorRef} aria-hidden="true" />

        {/* Sticky search + filters */}
        <div className="sticky-search-wrapper">
          <div className="sticky-pills-zone">
            {/* Search bar + filter button (right side) */}
            <div className="search-input-wrapper flex items-center gap-2">
              <form role="search" aria-label="Buscar carrera" onSubmit={e => e.preventDefault()} className="relative flex-1 min-w-0">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={delayedScroll}
                  onPointerDown={delayedScroll}
                  placeholder={placeholder}
                  aria-label="Buscar carrera"
                  autoComplete="off"
                  className="search-input-custom"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-[16px] w-[16px] text-[#7ca19b] pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </form>
              {/* Filter button (right of search) */}
              <div ref={filtersRef} className="relative flex items-center gap-1.5">
                <button
                  onClick={() => { setShowFilters(!showFilters); setDesktopFilterSection(null); }}
                  className={`filter-toggle-btn ${hasFilters ? 'active' : ''}`}
                  aria-label="Filtros por área y duración"
                  aria-expanded={showFilters}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span className="hidden sm:inline">Filtros</span>
                  <span className="filter-count-badge">{filterCount}</span>
                </button>
                {/* Desktop: limpiar filtros al lado del buscador */}
                <button
                  onClick={() => { if (hasFilters) { setFilterArea(null); setFilterDuration(null); setActiveCategory('all'); } }}
                  className={`filter-toggle-btn desktop-clear-filters ${hasFilters ? 'filter-clear-btn-red-full' : 'filter-clear-disabled'}`}
                  title="Limpiar filtros"
                  aria-disabled={!hasFilters}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  <span>Limpiar filtros</span>
                </button>

                {showFilters && (
                  <div className="filter-dropdown">
                    {/* Área */}
                    <button className={`filter-dropdown-header ${desktopFilterSection === 'area' ? 'open' : ''}`} onClick={() => setDesktopFilterSection(desktopFilterSection === 'area' ? null : 'area')}>
                      <span>Área {filterArea ? `· ${AREAS.find(a => a.id === filterArea)?.label}` : ''}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                    {desktopFilterSection === 'area' && (
                      <div className="filter-dropdown-options">
                        {AREAS.map(a => (
                          <button
                            key={a.id}
                            onClick={() => setFilterArea(filterArea === a.id ? null : a.id)}
                            className={`filter-option ${filterArea === a.id ? 'active' : ''}`}
                          >
                            {a.label}
                          </button>
                        ))}
                        {filterArea && (
                          <button onClick={() => setFilterArea(null)} className="filter-section-clear">✕ Limpiar filtro área</button>
                        )}
                      </div>
                    )}
                    {/* Duración */}
                    <button className={`filter-dropdown-header ${desktopFilterSection === 'duracion' ? 'open' : ''}`} onClick={() => setDesktopFilterSection(desktopFilterSection === 'duracion' ? null : 'duracion')}>
                      <span>Duración {filterDuration ? `· ${DURATION_GROUPS.find(d => d.id === filterDuration)?.label}` : ''}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                    </button>
                    {desktopFilterSection === 'duracion' && (
                      <div className="filter-dropdown-options">
                        {DURATION_GROUPS.map(d => (
                          <button
                            key={d.id}
                            onClick={() => setFilterDuration(filterDuration === d.id ? null : d.id)}
                            className={`filter-option ${filterDuration === d.id ? 'active' : ''}`}
                          >
                            {d.label}
                          </button>
                        ))}
                        {filterDuration && (
                          <button onClick={() => setFilterDuration(null)} className="filter-section-clear">✕ Limpiar filtro duración</button>
                        )}
                      </div>
                    )}
                    {hasFilters && (
                      <button
                        onClick={() => { setFilterArea(null); setFilterDuration(null); setActiveCategory('all'); }}
                        className="filter-clear-btn-red"
                      >
                        ✕ Limpiar filtros
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>


            {/* Mobile: limpiar filtros (entre buscador y píldoras) */}
            {hasFilters && (
              <button
                onClick={() => { setFilterArea(null); setFilterDuration(null); setActiveCategory('all'); }}
                className="mobile-clear-filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>Limpiar filtros</span>
              </button>
            )}

            {/* Category pills — unified row (4 pills fit on all screens) */}
            <div ref={pillsRef} className="filter-container" role="group" aria-label="Filtros de categoría">
              {visibleCategories.map(cat => {
                const count = cat.id === 'all' ? carreras.filter(c => getCategoryForCarrera(c) !== '_hidden').length : (grouped[cat.id]?.length ?? 0);
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat.id)}
                    className={`filter-pill ${cat.id === 'all' ? 'filter-pill-all' : ''} ${activeCategory === cat.id ? 'active' : ''} ${cat.featured ? 'featured' : ''} ${cat.id === 'identidad_argentina' ? 'filter-pill-ia' : ''} ${
                      cat.id === 'teclab_tecnologia' ? 'filter-pill-teclab teclab-tecnologia'
                        : cat.id === 'teclab_gestion' ? 'filter-pill-teclab teclab-gestion'
                        : ''
                    }`}
                    aria-pressed={activeCategory === cat.id}
                  >
                    {cat.label}{count > 0 ? ` (${count})` : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Beneficios strip (desktop) */}
        <div className="benefits-strip">
          <div className="benefits-strip-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
            Beneficios
          </div>
          <div className="benefits-strip-chips">
            <div className="sidebar-benefit-chip">
              <div className="sidebar-benefit-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 100 100" fill="none">
                  <defs>
                    <clipPath id="tennis-clip">
                      <circle cx="50" cy="50" r="46"/>
                    </clipPath>
                  </defs>
                  <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="3"/>
                  <g clipPath="url(#tennis-clip)" stroke="currentColor" strokeWidth="3">
                    <path d="M 18,8 Q 30,50 18,92"/>
                    <path d="M 82,8 Q 70,50 82,92"/>
                  </g>
                </svg>
              </div>
              <div>
                <strong>Deportistas Federados</strong>
                <span><b className="sidebar-benefit-pct">10%</b> bonificacion en aranceles</span>
              </div>
            </div>
            <div className="sidebar-benefit-chip">
              <div className="sidebar-benefit-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="3" width="16" height="18"/><line x1="4" y1="21" x2="20" y2="21"/><rect x="7" y="6" width="3" height="3"/><rect x="14" y="6" width="3" height="3"/><rect x="7" y="12" width="3" height="3"/><rect x="14" y="12" width="3" height="3"/><rect x="10" y="18" width="4" height="3"/>
                </svg>
              </div>
              <div>
                <strong>Organizacion Amiga</strong>
                <span><b className="sidebar-benefit-pct">10%</b> familias y empresas con convenio</span>
              </div>
            </div>
            <div className="sidebar-benefit-chip">
              <div className="sidebar-benefit-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"/>
                </svg>
              </div>
              <div>
                <strong>Amigo Referido</strong>
                <span><b className="sidebar-benefit-pct">10%</b> para quien recomienda y el ingresante</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid: content */}
        <div className="main-grid">
          {/* Carreras */}
          <div>
            {/* Search results */}
            {searchResults && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-full" style={{ backgroundColor: 'rgba(0, 199, 177, 0.1)', border: '1px solid #00c7b1' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00c7b1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h4 className="text-2xl font-bold text-white">
                    {searchResults.length > 0
                      ? `Resultados de busqueda (${searchResults.length})`
                      : 'Sin resultados'}
                  </h4>
                </div>
                {searchResults.length > 0 ? (
                  <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0">
                    {searchResults.map(c => (
                      <CareerCard key={c.id} carrera={c} onClick={handleCareerClick} />
                    ))}
                  </ul>
                ) : (
                  <p className="text-xl text-[#7ca19b] text-center py-12">
                    No se encontraron resultados para tu busqueda.
                  </p>
                )}
              </div>
            )}

            {/* Active filters banner */}
            {hasFilters && !searchResults && (
              <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
                <span className="text-[#7ca19b] font-semibold uppercase tracking-wider text-xs">Filtros:</span>
                {activeCategory !== 'all' && (
                  <span className="filter-active-tag">Tipo: {sectionLabels[activeCategory]?.titleFiltrado ?? sectionLabels[activeCategory]?.title}</span>
                )}
                {filterArea && (
                  <span className="filter-active-tag">Área: {AREAS.find(a => a.id === filterArea)?.label}</span>
                )}
                {filterDuration && (
                  <span className="filter-active-tag">Duración: {DURATION_GROUPS.find(d => d.id === filterDuration)?.label}</span>
                )}
                <button onClick={() => { setFilterArea(null); setFilterDuration(null); setActiveCategory('all'); }} className="filter-clear-btn-red filter-clear-btn-inline">
                  ✕ Limpiar filtros
                </button>
              </div>
            )}

            {/* No results with filters */}
            {hasFilters && !searchResults && sectionsToShow.length === 0 && (
              <p className="text-lg text-[#7ca19b] text-center py-12">
                No se encontraron carreras con los filtros seleccionados.
              </p>
            )}

            {/* Career sections */}
            {!searchResults && sectionsToShow.map(sectionId => {
              const section = sectionLabels[sectionId];
              const items = filteredGrouped[sectionId] || [];
              if (!section || items.length === 0) return null;

              return (
                <CareerSection
                  key={sectionId}
                  sectionId={sectionId}
                  title={hasFilters ? section.titleFiltrado ?? section.title : section.title}
                  accent={hasFilters ? undefined : section.accent}
                  carreras={items}
                  onCareerClick={handleCareerClick}
                  isIdentidadArgentina={sectionId === 'identidad_argentina'}
                  familiaTeclab={
                    sectionId === 'teclab_tecnologia' ? 'tecnologia'
                      : sectionId === 'teclab_gestion' ? 'gestion'
                      : undefined
                  }
                />
              );
            })}
          </div>

        </div>

      </div>

      {/* Career Modal */}
      {selectedCarrera && (
        selectedCarrera.nivel === 'Identidad Argentina' ? (
          <IAModal carrera={selectedCarrera} onClose={() => setSelectedCarrera(null)} />
        ) : esTeclab(selectedCarrera) ? (
          <TeclabModal carrera={selectedCarrera} onClose={() => setSelectedCarrera(null)} />
        ) : selectedCarrera.slides && selectedCarrera.slides.length > 0 ? (
          <CarouselModal carrera={selectedCarrera} onClose={() => setSelectedCarrera(null)} />
        ) : (
          <CareerModal carrera={selectedCarrera} onClose={() => setSelectedCarrera(null)} />
        )
      )}
    </>
  );
}

// Career section component
function CareerSection({ sectionId, title, accent, carreras, onCareerClick, isIdentidadArgentina, familiaTeclab }: {
  sectionId: string;
  title: string;
  accent?: string;
  carreras: Carrera[];
  onCareerClick: (c: Carrera) => void;
  isIdentidadArgentina?: boolean;
  familiaTeclab?: TeclabFamilia;
}) {
  const [sectionSearch, setSectionSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  // Pildora de tipo activa dentro de la seccion de gestion de Teclab
  const [tipoActivo, setTipoActivo] = useState<string | null>(null);

  // Tipos presentes en esta seccion, en el orden del render
  const tipos = useMemo(() => {
    if (familiaTeclab !== 'gestion') return [];
    const presentes = new Set(carreras.map(c => getTipoTeclab(c)).filter(Boolean) as string[]);
    return TIPOS_GESTION.filter(t => presentes.has(t));
  }, [carreras, familiaTeclab]);

  const filteredCarreras = useMemo(() => {
    let items = carreras;
    if (tipoActivo) items = items.filter(c => getTipoTeclab(c) === tipoActivo);
    if (sectionSearch.trim()) items = items.filter(c => fuzzyMatch(c.nombre, sectionSearch.trim()));
    return items;
  }, [carreras, sectionSearch, tipoActivo]);

  const colorAcento = isIdentidadArgentina
    ? 'var(--ia-blue)'
    : familiaTeclab === 'tecnologia'
      ? 'var(--teclab-cyan)'
      : familiaTeclab === 'gestion'
        ? 'var(--teclab-purple)'
        : 'var(--color-highlight)';

  return (
    <section id={`section-${sectionId}`} className="mb-10">
      <div className="section-header-container">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 min-w-0">
          <h2 className="text-xl min-[380px]:text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter min-w-0 pr-1">
            {title}
            {accent && (
              <> / <span style={{ color: colorAcento }}>{accent}</span></>
            )}
          </h2>
          {isIdentidadArgentina && (
            <span className="ia-section-badge shrink-0">Convenio</span>
          )}
          {familiaTeclab && (
            <span className={`teclab-section-badge teclab-${familiaTeclab} shrink-0`}>
              Instituto Técnico
            </span>
          )}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg shadow-sm transition-colors shrink-0 ${showSearch ? 'bg-[#00c7b1] hover:bg-[#00c7b1]/80' : 'bg-white/90 hover:bg-white/60'}`}
            title={`Buscar en ${title}`}
            aria-label={`Buscar en ${title}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${showSearch ? 'text-white' : 'text-[#013729]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {showSearch && (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              className="flex-1 bg-[#0f2825] border border-[#00c7b1]/25 rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#7ca19b]/60 focus:outline-none focus:border-[#00c7b1]/60 transition-colors uppercase font-bold tracking-wider"
              placeholder={`BUSCAR ${title.toUpperCase()}...`}
              value={sectionSearch}
              onChange={e => setSectionSearch(e.target.value)}
              aria-label={`Buscar ${title.toLowerCase()}`}
            />
            <button
              onClick={() => { setShowSearch(false); setSectionSearch(''); }}
              className="text-[#7ca19b] hover:text-white text-xl px-2"
              aria-label="Cerrar busqueda"
            >
              x
            </button>
          </div>
        )}

        {/* Pildoras de tipo: cada familia del render tiene su propio rotulo */}
        {tipos.length > 0 && (
          <div className="teclab-tipo-pills" role="group" aria-label="Filtrar por tipo de programa">
            {tipos.map(tipo => {
              const count = carreras.filter(c => getTipoTeclab(c) === tipo).length;
              return (
                <button
                  key={tipo}
                  onClick={() => setTipoActivo(tipoActivo === tipo ? null : tipo)}
                  className={`teclab-tipo-pill ${tipoActivo === tipo ? 'active' : ''}`}
                  aria-pressed={tipoActivo === tipo}
                >
                  {tipo} ({count})
                </button>
              );
            })}
          </div>
        )}

        <div
          className={`flex-grow h-px section-divider ${isIdentidadArgentina ? 'section-divider-ia' : ''} ${familiaTeclab ? `section-divider-teclab teclab-${familiaTeclab}` : ''}`}
        />
      </div>

      <ul
        className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 min-w-0 mb-6 ${isIdentidadArgentina ? 'ia-section-cards' : ''}`}
      >
        {filteredCarreras.map(c => (
          <CareerCard key={c.id} carrera={c} onClick={onCareerClick} />
        ))}
      </ul>
    </section>
  );
}

// Prefetch slide images on hover/touch
function prefetchImages(carrera: Carrera) {
  if (!carrera.slides?.length) return;
  const seen = new Set<string>();
  for (const slide of carrera.slides) {
    const src = ('imagen_desktop' in slide && slide.imagen_desktop) ||
      ('imagen' in slide && typeof slide.imagen === 'string' ? slide.imagen : undefined);
    if (src && !seen.has(src)) {
      seen.add(src);
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = src.split('/').map((s: string) => encodeURIComponent(s)).join('/');
      document.head.appendChild(link);
    }
  }
}

// Individual career card
function CareerCard({ carrera, onClick }: { carrera: Carrera; onClick: (c: Carrera) => void }) {
  const { prefix, cleanName } = getCareerInfo(carrera);
  const badge = carrera.nueva ? 'Nueva' : carrera.destacada ? 'Más buscada' : null;
  const isIA = getCategoryForCarrera(carrera) === 'identidad_argentina';
  const escuela = isIA ? getEscuelaIA(carrera) : null;
  const familiaTeclab = getFamiliaTeclab(carrera);
  const tipoTeclab = familiaTeclab ? getTipoTeclab(carrera) : null;
  const prefetched = useRef(false);
  const handlePrefetch = useCallback(() => {
    if (!prefetched.current) { prefetched.current = true; prefetchImages(carrera); }
  }, [carrera]);

  return (
    <li className="contents">
      <button
        type="button"
        className={`career-card group w-full ${isIA ? 'career-card-ia' : ''} ${familiaTeclab ? `career-card-teclab teclab-${familiaTeclab}` : ''}`}
        data-testid="career-card"
        onClick={() => onClick(carrera)}
        onMouseEnter={handlePrefetch}
        onTouchStart={handlePrefetch}
        aria-label={`Ver detalles de ${carrera.nombre}`}
      >
        {badge && (
          <span className={`career-badge ${carrera.nueva ? 'career-badge--nueva' : 'career-badge--destacada'}`}>
            {badge}
          </span>
        )}
        <div className="flex-grow relative min-w-0">
          {prefix && (
            <span className="career-prefix block mb-0.5">{prefix}</span>
          )}
          <span className="block font-semibold text-[1.1rem] leading-tight text-white">
            {cleanName}
          </span>
        </div>
        <span className="text-[0.65rem] min-[380px]:text-xs font-bold detail-link px-2 min-[380px]:px-4 py-1.5 min-[380px]:py-2 rounded-lg cursor-pointer text-center self-center">
          Ver detalles
        </span>
        {isIA && (
          <div className="ia-card-meta">
            {escuela && <span className="ia-chip ia-chip-escuela">{escuela}</span>}
            {carrera.duracion && <span className="ia-chip">{carrera.duracion}</span>}
          </div>
        )}
        {familiaTeclab && (
          <div className="ia-card-meta">
            {tipoTeclab && <span className="teclab-chip teclab-chip-tipo">{tipoTeclab}</span>}
            {carrera.duracion && <span className="teclab-chip">{carrera.duracion}</span>}
            <span className="teclab-chip">100% online</span>
          </div>
        )}
      </button>
    </li>
  );
}
