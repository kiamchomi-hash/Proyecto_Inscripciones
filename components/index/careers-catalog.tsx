'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { type Carrera, CATEGORIES, getCategoryForCarrera, findCarreraBySlug, carreraToSlug } from './types';

const CareerModal = dynamic(() => import('./career-modal'));
const CarouselModal = dynamic(() => import('./carousel-modal'));

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
  // Check each word
  const words = t.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(q.slice(0, 3))) return true;
    if (q.length >= 3 && levenshtein(word.slice(0, q.length + 2), q) <= 2) return true;
  }
  return false;
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
  const [placeholder, setPlaceholder] = useState('BUSCAR CARRERA');
  const [selectedCarrera, setSelectedCarrera] = useState<Carrera | null>(null);
  const [pillsHidden, setPillsHidden] = useState(true);

  // Responsive placeholder
  useEffect(() => {
    const updatePlaceholder = () => {
      if (window.innerWidth >= 768) {
        setPlaceholder('Buscar carrera, revisa nuestra oferta académica');
      } else {
        setPlaceholder('Buscar carrera');
      }
    };
    updatePlaceholder();
    window.addEventListener('resize', updatePlaceholder);
    return () => window.removeEventListener('resize', updatePlaceholder);
  }, []);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);


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

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return carreras.filter(c => fuzzyMatch(c.nombre, searchQuery.trim()));
  }, [carreras, searchQuery]);

  // Sections to display (filtered by category)
  const sectionsToShow = useMemo(() => {
    if (searchResults) return []; // hide sections when searching
    const displayOrder = ['licenciaturas', 'tecnicaturas', 'maestrias', 'certificaciones', 'especializaciones', 'diplomaturas', 'cursos'];
    if (activeCategory === 'all') return displayOrder.filter(id => grouped[id]?.length);
    return [activeCategory].filter(id => grouped[id]?.length);
  }, [activeCategory, grouped, searchResults]);

  const handleCategoryClick = useCallback((catId: string) => {
    setActiveCategory(catId);
    setSearchQuery('');
    delayedScroll();
  }, [delayedScroll]);

  const handleCareerClick = useCallback((carrera: Carrera) => {
    setSelectedCarrera(carrera);
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
      document.title = 'Universidad Siglo 21 CAU Villa Lugano | Oferta académica 2026';
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

  const sectionLabels: Record<string, { title: string; accent?: string; placeholder: string }> = {
    licenciaturas: { title: 'Licenciaturas', accent: 'Grado', placeholder: 'BUSCAR LICENCIATURA...' },
    tecnicaturas: { title: 'Tecnicaturas', accent: 'Pregrado', placeholder: 'BUSCAR TECNICATURA...' },
    maestrias: { title: 'Maestrias', placeholder: 'BUSCAR MAESTRIA...' },
    certificaciones: { title: 'Certificaciones', placeholder: 'BUSCAR CERTIFICACION...' },
    especializaciones: { title: 'Especializaciones', placeholder: 'BUSCAR ESPECIALIZACION...' },
    diplomaturas: { title: 'Diplomaturas', placeholder: 'BUSCAR DIPLOMATURA...' },
    cursos: { title: 'Cursos', placeholder: 'BUSCAR CURSO...' },
  };

  return (
    <>
      <div className="mx-auto w-full pt-0 px-4 pb-4 sm:pt-0 sm:px-8 sm:pb-8 xl:px-20" data-testid="careers-catalog">

        {/* Scroll anchor (non-sticky, keeps its natural position) */}
        <div ref={scrollAnchorRef} aria-hidden="true" />

        {/* Sticky search + filters */}
        <div className="sticky-search-wrapper">
          <div className="sticky-pills-zone">
            {/* Search bar */}
            <div className="relative w-full search-input-wrapper">
              <form role="search" aria-label="Buscar carrera" onSubmit={e => e.preventDefault()}>
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
                  className="search-input-custom w-full"
                />
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-[#7ca19b] pointer-events-none"
                  style={{ right: '1.75rem' }}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </form>
            </div>

            {/* Mobile toggle for filter pills */}
            <button
              className={`filter-pills-toggle ${pillsHidden ? 'collapsed' : ''}`}
              onClick={() => setPillsHidden(!pillsHidden)}
              aria-label={pillsHidden ? 'Mostrar filtros de categoría' : 'Ocultar filtros de categoría'}
              aria-expanded={!pillsHidden}
            >
              <span>{pillsHidden ? 'Mostrar filtros' : 'Ocultar filtros'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
            </button>

            {/* Category pills */}
            <div className={`filter-container ${pillsHidden ? 'pills-hidden' : ''}`} role="group" aria-label="Filtros de categoría">
              {visibleCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`filter-pill ${cat.id === 'all' ? 'filter-pill-all' : ''} ${activeCategory === cat.id ? 'active' : ''} ${cat.featured ? 'featured' : ''}`}
                  aria-pressed={activeCategory === cat.id}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main grid: content + sidebar */}
        <div className="main-grid">
          {/* Left column: carreras */}
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
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
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

            {/* Career sections */}
            {!searchResults && sectionsToShow.map(sectionId => {
              const section = sectionLabels[sectionId];
              const items = grouped[sectionId] || [];
              if (!section || items.length === 0) return null;

              return (
                <CareerSection
                  key={sectionId}
                  sectionId={sectionId}
                  title={section.title}
                  accent={section.accent}
                  carreras={items}
                  onCareerClick={handleCareerClick}
                />
              );
            })}
          </div>

          {/* Right column: sidebar (visible ≥1600px via CSS) */}
          <aside className="sidebar-column">
            <div className="sidebar-benefits-card">
              <div className="sidebar-benefits-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                Beneficios
              </div>
              <div className="flex flex-col gap-3.5">
                <div className="sidebar-benefit-chip">
                  <div className="sidebar-benefit-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 100 100" fill="none">
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
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
          </aside>
        </div>

      </div>

      {/* Career Modal */}
      {selectedCarrera && (
        selectedCarrera.slides && selectedCarrera.slides.length > 0 ? (
          <CarouselModal carrera={selectedCarrera} onClose={() => setSelectedCarrera(null)} />
        ) : (
          <CareerModal carrera={selectedCarrera} onClose={() => setSelectedCarrera(null)} />
        )
      )}
    </>
  );
}

// Career section component
function CareerSection({ sectionId, title, accent, carreras, onCareerClick }: {
  sectionId: string;
  title: string;
  accent?: string;
  carreras: Carrera[];
  onCareerClick: (c: Carrera) => void;
}) {
  const [sectionSearch, setSectionSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredCarreras = useMemo(() => {
    if (!sectionSearch.trim()) return carreras;
    return carreras.filter(c => fuzzyMatch(c.nombre, sectionSearch.trim()));
  }, [carreras, sectionSearch]);

  return (
    <section id={`section-${sectionId}`} className="mb-10">
      <div className="section-header-container">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 min-w-0">
          <h2 className="text-xl min-[380px]:text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter min-w-0 pr-1">
            {title}
            {accent && (
              <> / <span style={{ color: 'var(--color-highlight)' }}>{accent}</span></>
            )}
          </h2>
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

        <div className="flex-grow h-px section-divider" />
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0 mb-6">
        {filteredCarreras.map(c => (
          <CareerCard key={c.id} carrera={c} onClick={onCareerClick} />
        ))}
      </ul>
    </section>
  );
}

// Individual career card
function CareerCard({ carrera, onClick }: { carrera: Carrera; onClick: (c: Carrera) => void }) {
  const { prefix, cleanName } = getCareerInfo(carrera);
  const badge = carrera.nueva ? 'Nueva' : carrera.destacada ? 'Más buscada' : null;

  return (
    <li
      className="career-card group"
      data-testid="career-card"
      onClick={() => onClick(carrera)}
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
    </li>
  );
}
