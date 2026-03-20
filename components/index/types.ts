// ── Slide types for carousel modals ──

export interface SlidePortada {
  type: 'portada';
  imagen_desktop?: string;
  imagen_desktop_position?: string;
  imagen_mobile?: string;
  bullets: string[];
  badges?: { label: string; value: string }[];
}

export interface SlideModalidad {
  type: 'modalidad';
  imagen?: string;
  titulo: string;
  items: { texto: string; bold_inicio?: string; bold_fin?: string }[];
}

export interface SlideEvaluacion {
  type: 'evaluacion';
  cards: { numero: string; label: string; sub: string; accent?: boolean }[];
  tags: string[];
  nota: string;
}

export interface SlidePlanEstudios {
  type: 'plan_estudios';
  paginas: {
    izquierda: { año: string; cuatrimestres: { label: string; materias: string[] }[] };
    derecha?: { año: string; cuatrimestres: { label: string; materias: string[] }[] };
    extras?: { titulo: string; items: string[]; nota?: string }[];
  }[];
}

export interface SlideCierre {
  type: 'cierre';
  imagen?: string;
  titulo: string;
  subtitulo?: string;
  beneficios: { icono: string; texto: string }[];
}

export type CarreraSlide = SlidePortada | SlideModalidad | SlideEvaluacion | SlidePlanEstudios | SlideCierre;

// ── Main carrera type ──

export interface Carrera {
  id: number;
  nombre: string;
  nivel: string;
  duracion: string;
  titulo: string;
  enfoque: string;
  modalidad: string;
  descripcion: string;
  prefix: string | null;
  nombre_corto: string | null;
  seccion_duracion: string | null;
  seccion_modalidad: string | null;
  plan_estudios: string | null;
  imagenes: string[];
  slides: CarreraSlide[] | null;
  orden: number;
  activa: boolean;
  destacada: boolean;
  nueva: boolean;
}

export interface CarreraCategory {
  id: string;
  label: string;
  sublabel?: string;
  niveles: string[];
  featured?: boolean;
}

export const CATEGORIES: CarreraCategory[] = [
  { id: 'all', label: 'Ver Todo', niveles: [], featured: false },
  { id: 'licenciaturas', label: 'Licenciaturas', sublabel: 'Grado', niveles: ['Grado', 'Grado (CCC)'], featured: true },
  { id: 'tecnicaturas', label: 'Tecnicaturas', sublabel: 'Pregrado', niveles: ['Pregrado (Tecnicatura)'], featured: true },
  { id: 'maestrias', label: 'Maestrias', sublabel: undefined, niveles: ['Posgrado'], featured: false },
  { id: 'diplomaturas', label: 'Diplomaturas', sublabel: undefined, niveles: ['APLV - Extragrado'], featured: false },
  { id: 'certificaciones', label: 'Certificaciones', sublabel: undefined, niveles: ['Certificacion'], featured: false },
  { id: 'especializaciones', label: 'Especializaciones', sublabel: undefined, niveles: ['Posgrado'], featured: false },
  { id: 'cursos', label: 'Cursos', sublabel: undefined, niveles: ['APLV - Extragrado', 'Curso'], featured: false },
];

// Mapping from Supabase nivel to display categories
// Since Posgrado contains both Maestrias and Especializaciones,
// and APLV - Extragrado contains Diplomaturas, Certificados, and Cursos,
// we use name prefix to further categorize
export function getCategoryForCarrera(c: Carrera): string {
  const nombre = c.nombre.toLowerCase();

  if (c.nivel === 'Grado' || c.nivel === 'Grado (CCC)') return 'licenciaturas';
  if (c.nivel === 'Pregrado (Tecnicatura)') return 'tecnicaturas';

  // Posgrado: split into maestrias and especializaciones
  if (c.nivel === 'Posgrado') {
    if (nombre.startsWith('maestría') || nombre.startsWith('maestria')) return 'maestrias';
    return 'especializaciones';
  }

  // Certificacion
  if (c.nivel === 'Certificación') return 'certificaciones';

  // APLV - Extragrado: split into diplomaturas, certificaciones, cursos
  if (c.nivel === 'APLV - Extragrado') {
    if (nombre.startsWith('diplomatura')) return 'diplomaturas';
    if (nombre.startsWith('certificado')) return 'certificaciones';
    return 'cursos';
  }

  if (c.nivel === 'Curso') return 'cursos';

  return 'cursos'; // fallback
}

// Build full name from prefix + nombre for slug generation
function carreraFullName(carrera: Carrera): string {
  const p = (carrera.prefix || '').toLowerCase();
  const nombre = carrera.nombre;
  // If nombre already starts with a known type word, use as-is
  const lower = nombre.toLowerCase();
  if (lower.startsWith('licenciatura') || lower.startsWith('tecnicatura') || lower.startsWith('maestría') || lower.startsWith('maestria') || lower.startsWith('especialización') || lower.startsWith('especializacion') || lower.startsWith('diplomatura') || lower.startsWith('profesorado') || lower.startsWith('certificado') || lower.startsWith('curso')) {
    return nombre;
  }
  // Prepend from prefix
  if (p.includes('licenciatura')) return `Licenciatura en ${nombre}`;
  if (p.includes('tecnicatura')) return `Tecnicatura en ${nombre}`;
  if (p.includes('maestría') || p.includes('maestria')) return `Maestría en ${nombre}`;
  if (p.includes('especialización') || p.includes('especializacion')) return `Especialización en ${nombre}`;
  if (p.includes('diplomatura')) return `Diplomatura en ${nombre}`;
  return nombre;
}

// Slug-friendly name for share URLs: remove accents, spaces → _
export function carreraToSlug(carrera: Carrera | string): string {
  const fullName = typeof carrera === 'string' ? carrera : carreraFullName(carrera);
  return fullName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

// Find carrera by slug (reverse of carreraToSlug)
export function findCarreraBySlug(carreras: Carrera[], slug: string): Carrera | undefined {
  return carreras.find(c => carreraToSlug(c) === slug);
}
