// ── Slide types for carousel modals ──

export interface SlidePortada {
  type: 'portada';
  imagen_desktop?: string;
  imagen_desktop_position?: string;
  // Multiplicador de brillo CSS para imagen_desktop (ej. 1.5); sin campo = sin filtro
  imagen_brightness?: number;
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
  slides: CarreraSlide[] | null;
  orden: number;
  activa: boolean;
  destacada: boolean;
  nueva: boolean;
  // Anunciada por Universidad Siglo 21 pero todavia sin inscripcion abierta. La
  // ficha se publica igual (capta la busqueda) pero no ofrece inscribirse.
  proximamente?: boolean;
}

// Lo minimo que necesita el select del formulario de inscripcion. Mandarle la
// fila completa metia todas las carreras enteras en el HTML de cada pagina.
export type CarreraOpcion = Pick<Carrera, 'id' | 'nombre' | 'nivel'>;

// Lo minimo para pintar un enlace a otra carrera (nombre + slug).
export type CarreraEnlace = Pick<Carrera, 'id' | 'nombre' | 'prefix'>;

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
  { id: 'identidad_argentina', label: 'Identidad Argentina', sublabel: 'Convenio', niveles: ['Identidad Argentina'], featured: true },
  { id: 'teclab_tecnologia', label: 'Teclab Tecnología', sublabel: 'Tecnicaturas y cursos', niveles: ['Teclab - Tecnología', 'Teclab - Curso'], featured: true },
  { id: 'teclab_gestion', label: 'Teclab Gestión', sublabel: 'Tecnicaturas', niveles: ['Teclab - Gestión'], featured: true },
];

// Mapping from Supabase nivel to display categories
export function getCategoryForCarrera(c: Pick<Carrera, 'nivel'>): string {
  if (c.nivel === 'Grado' || c.nivel === 'Grado (CCC)') return 'licenciaturas';
  if (c.nivel === 'Pregrado') return 'tecnicaturas';
  if (c.nivel === 'Identidad Argentina') return 'identidad_argentina';
  if (c.nivel === 'Teclab - Tecnología' || c.nivel === 'Teclab - Curso') return 'teclab_tecnologia';
  if (c.nivel === 'Teclab - Gestión') return 'teclab_gestion';

  // Any other nivel is not displayed in the current categories
  return '_hidden';
}

// La oferta del sitio son Grado, Pregrado, Teclab e Identidad Argentina. De los
// cursos se publica unicamente el nivel especifico "Teclab - Curso", dentro de
// Teclab Tecnologia. Los cursos historicos de Siglo 21 siguen ocultos junto con
// Posgrado, APLV - Extragrado y Certificacion.
export function esCarreraVisible(c: Pick<Carrera, 'nivel'>): boolean {
  return getCategoryForCarrera(c) !== '_hidden';
}

// ── Orden del select del formulario ──

// Las que van arriba de la lista, en este orden. Editar aca es todo lo que hace
// falta para cambiar la vidriera del formulario: el nombre tiene que coincidir
// exacto con la columna `nombre` de Supabase, y si una carrera se da de baja
// simplemente no aparece (no rompe nada).
export const DESTACADAS_FORMULARIO: string[] = [
  'Abogacía',
  'Tecnicatura Superior en Programación',
  'Contador Público',
  'Tecnicatura Superior en Data Science',
  'Inteligencia Artificial y Robótica',
  'Administración',
  'Escribanía',
  'Tecnicatura Superior en Marketing Digital',
  'Gestión de Recursos Humanos',
  'Psicopedagogía (CCC)',
];

// Despues de las destacadas, por categoria. El convenio va al final: son
// diplomaturas cortas y arriba tapaban las carreras largas, que es lo que el
// visitante viene a buscar.
const PESO_CATEGORIA: Record<string, number> = {
  licenciaturas: 0,
  teclab_tecnologia: 1,
  tecnicaturas: 2,
  teclab_gestion: 3,
  identidad_argentina: 4,
};

// El `orden` de Supabase arranca en 1 dentro de cada nivel, asi que ordenar solo
// por esa columna intercala las diplomaturas de Identidad Argentina entre las
// primeras licenciaturas (Abogacía 1, Oratoria 1, Escribanía 2...). Esto reordena
// sin tocar la base. El sort de JS es estable, asi que dentro de cada categoria
// se conserva el `orden` con que vino la consulta.
export function ordenarParaFormulario<T extends Pick<Carrera, 'nombre' | 'nivel'>>(carreras: T[]): T[] {
  const rango = (c: T) => {
    const destacada = DESTACADAS_FORMULARIO.indexOf(c.nombre);
    if (destacada !== -1) return destacada;
    const peso = PESO_CATEGORIA[getCategoryForCarrera(c)] ?? 99;
    return DESTACADAS_FORMULARIO.length + peso;
  };
  return [...carreras].sort((a, b) => rango(a) - rango(b));
}

// ── Area classification ──

export const AREAS = [
  { id: 'derecho', label: 'Derecho' },
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'exactas', label: 'Ciencias Exactas' },
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

// Varias de estas palabras las tomamos del tag que la propia Siglo 21 le pone a
// cada carrera en el hero de su ficha (relevado en `notas-locales/tags-oficiales-21.md`):
// por eso Martillero es Derecho y no Negocios, Comercialización es Comunicación,
// y Matemática es Educación — el plan oficial es de perfil docente.
//
// OJO: el orden de las claves es la precedencia, gana la primera que matchea. Va de
// lo específico a lo general: `gobierno` tiene que ir antes que `negocios` porque
// 'administración' se come 'Administración Pública'. No es el orden de `AREAS`,
// que es el de la lista del filtro.
const AREA_KEYWORDS: Record<AreaId, string[]> = {
  derecho: ['abogacía', 'escribanía', 'procurador', 'criminología', 'crimen', 'seguridad privada', 'forense', 'constitución de sociedades', 'martillero', 'corredor'],
  tecnologia: ['informática', 'inteligencia artificial', 'robótica', 'seguridad informática', 'ciencias de datos', 'redes informáticas', 'telecomunicaciones', 'prompt engineering', 'programación', 'data science', 'quality assurance', 'cloud administration', 'fraude financiero', 'prevención del fraude', 'ciberseguridad'],
  exactas: ['estadística'],
  gobierno: ['ciencia política', 'administración pública', 'políticas públicas', 'relaciones internacionales'],
  negocios: ['administración', 'finanzas', 'negocios digitales', 'comercio internacional', 'actuario', 'emprendimiento', 'contador', 'contable', 'impositiva', 'empresas familiares', 'negocios inmobiliarios', 'propiedad horizontal', 'equipo de venta', 'equipos de venta', 'e-commerce', 'business analysis', 'customer experience', 'seguros', 'logística', 'marketing para emprendedores', 'compliance', 'management hotelero'],
  salud: ['nutrición', 'gerontología', 'terapia ocupacional', 'servicios de salud', 'coaching nutricional', 'personas mayores', 'láser', 'tecnologías médicas', 'mindfulness', 'bienestar integral', 'bioinformática'],
  educacion: ['educación', 'psicopedagogía', 'profesorado', 'innovación educativa', 'niñez', 'adolescencia', 'matemática'],
  comunicacion: ['periodismo', 'publicidad', 'relaciones públicas', 'social media', 'diseño y animación', 'moda', 'protocolo', 'eventos', 'comercialización', 'videojuegos', 'marketing digital', 'inbound marketing'],
  ambiente: ['ambiental', 'agraria', 'agroecológicos', 'hidrocarburos', 'geociencias', 'energías renovables', 'higiene', 'seguridad laboral', 'auditorías ambientales'],
  turismo: ['turística', 'turísticos', 'hotelera', 'turismo'],
  rrhh: ['recursos humanos', 'relaciones laborales', 'clima laboral', 'liderazgo', 'responsabilidad', 'gestión social', 'oratoria', 'equipos de alto desempeño', 'rrhh'],
  deporte: ['deportiva', 'deportivo', 'nutrición deportiva', 'fútbol'],
};

// La palabra clave tiene que arrancar donde arranca una palabra del nombre. Sin
// esto 'informatica' se come 'Bioinformatica', que va en Salud y se evalua despues.
// El final queda libre a proposito: 'ambiental' tiene que seguir matcheando
// 'Auditorias Ambientales'.
function empiezaPalabra(nombre: string, kw: string): boolean {
  let i = nombre.indexOf(kw);
  while (i !== -1) {
    if (!/[a-z0-9áéíóúüñ]/.test(nombre[i - 1] ?? ' ')) return true;
    i = nombre.indexOf(kw, i + 1);
  }
  return false;
}

export function getAreaForCarrera(c: Carrera): AreaId | null {
  const nombre = c.nombre.toLowerCase();
  for (const [area, keywords] of Object.entries(AREA_KEYWORDS) as [AreaId, string[]][]) {
    for (const kw of keywords) {
      if (empiezaPalabra(nombre, kw)) return area;
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
export function carreraFullName(carrera: Pick<Carrera, 'nombre' | 'prefix'>): string {
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
  if (p.includes('certificado')) return `Certificado en ${nombre}`;
  // "Curso de", no "en": el prefijo de la base ya viene asi y "Curso en
  // Actualizacion Profesional..." no se dice. La pagina redirige sola el slug
  // viejo, que compara contra el canonico.
  if (p.includes('curso')) return `Curso de ${nombre}`;
  return nombre;
}

// Slug-friendly name for share URLs: remove accents, lowercase, spaces → -
export function carreraToSlug(carrera: Pick<Carrera, 'nombre' | 'prefix'> | string): string {
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

// Marca en sessionStorage: la URL /carreras/{slug} la puso el modal de la home,
// no una visita real a la pagina de carrera. La escribe careers-catalog y la
// consume ScrollResetOnLoad para no restaurar el scroll del catalogo.
export const MARCA_MODAL = 'carrera-modal-url';
