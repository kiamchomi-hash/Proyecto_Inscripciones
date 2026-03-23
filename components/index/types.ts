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

// ── Descuento type ──

export interface Descuento {
  id: number;
  nombre: string;
  porcentaje: number | null;
  tipo: 'sede' | 'universidad' | 'promocion';
  activo: boolean;
}

/** Descuento especial por carrera (matrícula, ticket A, ticket B). */
export interface DescuentoEspecial {
  matricula?: number | null;
  ticket_a?: number | null;
  ticket_b?: number | null;
}

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
  descuento_especial?: DescuentoEspecial | null;
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
  { id: 'tecnicaturas', label: 'Tecnicaturas', sublabel: 'Pregrado', niveles: ['Pregrado'], featured: true },
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
  if (c.nivel === 'Pregrado') return 'tecnicaturas';

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

// ── Area classification ──

export const AREAS = [
  { id: 'derecho', label: 'Derecho' },
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'negocios', label: 'Negocios' },
  { id: 'salud', label: 'Salud' },
  { id: 'educacion', label: 'Educación' },
  { id: 'comunicacion', label: 'Comunicación y Diseño' },
  { id: 'ambiente', label: 'Ambiente y Agro' },
  { id: 'turismo', label: 'Turismo y Hotelería' },
  { id: 'gobierno', label: 'Ciencias Políticas' },
  { id: 'rrhh', label: 'RRHH' },
  { id: 'deporte', label: 'Deporte' },
] as const;

export type AreaId = (typeof AREAS)[number]['id'];

const AREA_KEYWORDS: Record<AreaId, string[]> = {
  derecho: ['abogacía', 'escribanía', 'procurador', 'criminología', 'crimen', 'seguridad privada', 'forense'],
  tecnologia: ['informática', 'inteligencia artificial', 'robótica', 'seguridad informática', 'ciencias de datos', 'bioinformática', 'redes informáticas', 'telecomunicaciones', 'videojuegos', 'prompt engineering', 'negocios digitales'],
  negocios: ['administración', 'finanzas', 'comercialización', 'comercio internacional', 'actuario', 'emprendimiento', 'contador', 'contable', 'impositiva', 'empresas familiares', 'negocios inmobiliarios', 'propiedad horizontal', 'equipo de venta', 'e-commerce', 'business analysis', 'martillero', 'corredor'],
  salud: ['nutrición', 'gerontología', 'terapia ocupacional', 'servicios de salud', 'coaching nutricional', 'personas mayores', 'láser', 'tecnologías médicas'],
  educacion: ['educación', 'psicopedagogía', 'profesorado', 'innovación educativa', 'niñez', 'adolescencia'],
  comunicacion: ['periodismo', 'publicidad', 'relaciones públicas', 'social media', 'diseño y animación', 'moda', 'protocolo', 'eventos'],
  ambiente: ['ambiental', 'agraria', 'agroecológicos', 'hidrocarburos', 'geociencias', 'energías renovables', 'higiene', 'seguridad laboral', 'auditorías ambientales'],
  turismo: ['turística', 'turísticos', 'hotelera', 'turismo'],
  gobierno: ['ciencia política', 'administración pública', 'políticas públicas', 'relaciones internacionales'],
  rrhh: ['recursos humanos', 'relaciones laborales', 'clima laboral', 'liderazgo', 'responsabilidad', 'gestión social'],
  deporte: ['deportiva', 'deportivo', 'nutrición deportiva', 'fútbol'],
};

export function getAreaForCarrera(c: Carrera): AreaId | null {
  const nombre = c.nombre.toLowerCase();
  for (const [area, keywords] of Object.entries(AREA_KEYWORDS) as [AreaId, string[]][]) {
    for (const kw of keywords) {
      if (nombre.includes(kw)) return area;
    }
  }
  return null;
}

// ── Duration grouping ──

export const DURATION_GROUPS = [
  { id: 'corta', label: 'Menos de 1 año' },
  { id: '1-2', label: '1 a 2 años' },
  { id: '2-3', label: '2 a 3 años' },
  { id: '4', label: '4 años' },
  { id: '5+', label: '5+ años' },
] as const;

export type DurationGroupId = (typeof DURATION_GROUPS)[number]['id'];

export function getDurationGroup(duracion: string): DurationGroupId | null {
  if (!duracion) return null;
  const d = duracion.toLowerCase();
  // Extract numeric years
  const yearsMatch = d.match(/(\d+(?:\.\d+)?)\s*año/);
  if (yearsMatch) {
    const years = parseFloat(yearsMatch[1]);
    if (years < 1) return 'corta';
    if (years >= 1 && years <= 2) return '1-2';
    if (years > 2 && years <= 3) return '2-3';
    if (years > 3 && years <= 4.5) return '4';
    return '5+';
  }
  // Months
  const monthsMatch = d.match(/(\d+)\s*mes/);
  if (monthsMatch) {
    const months = parseInt(monthsMatch[1]);
    if (months < 12) return 'corta';
    return '1-2';
  }
  // "Título previo + X años"
  if (d.includes('título previo') || d.includes('titulo previo')) {
    const prevMatch = d.match(/\+\s*(\d+)/);
    if (prevMatch) {
      const y = parseInt(prevMatch[1]);
      if (y <= 2) return '1-2';
      return '2-3';
    }
  }
  return null;
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

// Slug-friendly name for share URLs: remove accents, lowercase, spaces → -
export function carreraToSlug(carrera: Carrera | string): string {
  const fullName = typeof carrera === 'string' ? carrera : carreraFullName(carrera);
  return fullName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Find carrera by slug (reverse of carreraToSlug), supports old format
export function findCarreraBySlug(carreras: Carrera[], slug: string): Carrera | undefined {
  const normalized = slug.toLowerCase().replace(/_/g, '-');
  return carreras.find(c => carreraToSlug(c) === slug || carreraToSlug(c) === normalized);
}
