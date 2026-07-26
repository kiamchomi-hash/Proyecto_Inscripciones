// Datos de marca y clasificacion del Instituto Tecnico Superior Teclab.
// Fuente: PDF oficiales de plan de estudio y el render de Remotion
// (Desktop\Teclab Info\remotion-teclab-carreras), del que salen las dos
// esteticas: cian #2ee7d7 para tecnologia y violeta #8e2cf2 para el resto,
// sobre fondo tinta #071822.

import type { Carrera } from './types';

export const TECLAB_CYAN = '#2ee7d7';
export const TECLAB_PURPLE = '#8e2cf2';
export const TECLAB_INK = '#071822';

/** Las dos familias de carreras, cada una con su acento. */
export type TeclabFamilia = 'tecnologia' | 'gestion';

export function getFamiliaTeclab(c: Carrera): TeclabFamilia | null {
  if (c.nivel === 'Teclab - Tecnología') return 'tecnologia';
  if (c.nivel === 'Teclab - Gestión') return 'gestion';
  return null;
}

export function esTeclab(c: Carrera): boolean {
  return getFamiliaTeclab(c) !== null;
}

export function acentoTeclab(familia: TeclabFamilia): string {
  return familia === 'tecnologia' ? TECLAB_CYAN : TECLAB_PURPLE;
}

// Tipo de cada programa, tal como se rotula en el render. Es lo que alimenta
// las pildoras de la seccion de gestion y el chip de cada tarjeta.
// La clave es una palabra distintiva del nombre en Supabase.
const TIPOS: { match: string; tipo: string }[] = [
  { match: 'marketing digital', tipo: 'Marketing' },
  { match: 'inbound marketing', tipo: 'Marketing' },
  { match: 'customer experience', tipo: 'Negocios' },
  { match: 'venta directa', tipo: 'Negocios' },
  { match: 'contable', tipo: 'Gestión' },
  { match: 'seguros', tipo: 'Gestión' },
  { match: 'agraria', tipo: 'Gestión' },
  { match: 'relaciones laborales', tipo: 'Gestión' },
  { match: 'hotelera', tipo: 'Servicios' },
  { match: 'eventos', tipo: 'Servicios' },
  { match: 'periodismo', tipo: 'Comunicación' },
];

/** Orden en que se muestran las pildoras de tipo dentro de la seccion de gestion. */
export const TIPOS_GESTION = ['Negocios', 'Gestión', 'Servicios', 'Marketing', 'Comunicación'] as const;

export function getTipoTeclab(carrera: Carrera): string | null {
  const familia = getFamiliaTeclab(carrera);
  if (familia === null) return null;
  if (familia === 'tecnologia') return 'Tecnología';
  const nombre = carrera.nombre.toLowerCase();
  return TIPOS.find(t => nombre.includes(t.match))?.tipo ?? null;
}

// ── Ficha oficial de cada carrera en teclab.edu.ar ──

export const TECLAB_SITIO = 'https://teclab.edu.ar';
export const TECLAB_CARRERAS = 'https://teclab.edu.ar/carreras/';

export interface TeclabFicha {
  /**
   * Ficha oficial de la carrera en teclab.edu.ar. Es la fuente del material de
   * esta tabla, no un enlace del sitio: no se muestra en ningun lado, porque el
   * contacto tiene que pasar por WhatsApp o el formulario del CAU.
   */
  url: string;
  /** Foto de portada de esa misma ficha, bajada con scripts/descargar-assets-teclab.mjs */
  imagen: string;
  /** Segunda foto de la ficha (la del pie), para el slide de cierre del modal */
  imagenCierre: string;
  /** Bajada oficial de la ficha (su meta description) */
  resumen: string;
  /**
   * Empresa con la que Teclab cocreo la carrera. `logo` es el archivo blanco que
   * publica la ficha; las que no muestran logo van solo con el nombre.
   */
  partner?: { nombre: string; logo?: string };
}

// La clave es una palabra distintiva del nombre en Supabase, como en TIPOS.
// El partner sale de la ficha oficial, que manda sobre el campo "Cocreación" de
// Supabase: ahi quedaron valores genericos ("Perfil laboral", "Sector
// financiero") que no son empresas.
const FICHAS: { match: string; ficha: TeclabFicha }[] = [
  {
    match: 'programación',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-programacion/',
      imagen: '/imagenes/teclab/carreras/programacion.webp',
      imagenCierre: '/imagenes/teclab/carreras/programacion-cierre.webp',
      resumen: 'Estudiá programación 100% online y convertite en desarrollador en 2 años. Aprendé desde cero y entrá al nuevo mercado laboral.',
      partner: { nombre: 'Avenga', logo: '/imagenes/teclab/partners/avenga.webp' },
    },
  },
  {
    match: 'data science',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/carrera-de-data-science/',
      imagen: '/imagenes/teclab/carreras/data-science.webp',
      imagenCierre: '/imagenes/teclab/carreras/data-science-cierre.webp',
      resumen: 'Convertite en Analista de Datos con la carrera de Data Science. Preparate para destacarte en industrias de tecnología y negocios.',
      partner: { nombre: 'AWS Academy', logo: '/imagenes/teclab/partners/aws.webp' },
    },
  },
  {
    match: 'quality assurance',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-quality-assurance/',
      imagen: '/imagenes/teclab/carreras/quality-assurance.webp',
      imagenCierre: '/imagenes/teclab/carreras/quality-assurance-cierre.webp',
      resumen: 'Lográ tu título en Quality Assurance con una carrera que te permite avanzar a tu ritmo. Convertite en QA Tester y crecé en testing de software.',
      partner: { nombre: 'Microsoft', logo: '/imagenes/teclab/partners/microsoft.webp' },
    },
  },
  {
    match: 'cloud administration',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-en-cloud-administration/',
      imagen: '/imagenes/teclab/carreras/cloud-administration.webp',
      imagenCierre: '/imagenes/teclab/carreras/cloud-administration-cierre.webp',
      resumen: 'Aprendé a administrar servicios en la nube con herramientas AWS y desarrollate en una de las áreas con mayor crecimiento en IT.',
      partner: { nombre: 'AWS Academy', logo: '/imagenes/teclab/partners/aws.webp' },
    },
  },
  {
    match: 'seguridad informática',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-en-seguridad-informatica/',
      imagen: '/imagenes/teclab/carreras/seguridad-informatica.webp',
      imagenCierre: '/imagenes/teclab/carreras/seguridad-informatica-cierre.webp',
      resumen: 'Estudiá Seguridad Informática 100% online y protegé sistemas y datos. Formate en 2 años y preparate para crecer en ciberseguridad.',
      partner: { nombre: 'Mercado IT' },
    },
  },
  {
    match: 'redes informáticas',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-redes-informaticas/',
      imagen: '/imagenes/teclab/carreras/redes-informaticas.webp',
      imagenCierre: '/imagenes/teclab/carreras/redes-informaticas-cierre.webp',
      resumen: 'Lográ tu título en Redes Informáticas 100% online. Aprendé sobre redes y telecomunicaciones con las habilidades que buscan las industrias en crecimiento.',
      partner: { nombre: 'Cisco Networking' },
    },
  },
  {
    match: 'marketing digital',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-marketing-digital/',
      imagen: '/imagenes/teclab/carreras/marketing-digital.webp',
      imagenCierre: '/imagenes/teclab/carreras/marketing-digital-cierre.webp',
      resumen: 'Estudiá Marketing Digital 100% online y aprendé publicidad, redes sociales y estrategia. Recibite en 2 años con lo que busca el nuevo mercado laboral.',
      partner: { nombre: 'Google', logo: '/imagenes/teclab/partners/google.webp' },
    },
  },
  {
    match: 'inbound marketing',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-inbound-marketing/',
      imagen: '/imagenes/teclab/carreras/inbound-marketing.webp',
      imagenCierre: '/imagenes/teclab/carreras/inbound-marketing-cierre.webp',
      resumen: 'Aprendé a crear contenidos, automatizar campañas y generar leads en una carrera de 2 años y con un amplio campo laboral.',
      partner: { nombre: 'HubSpot', logo: '/imagenes/teclab/partners/hubspot.webp' },
    },
  },
  {
    match: 'customer experience',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-customer-experience/',
      imagen: '/imagenes/teclab/carreras/customer-experience.webp',
      imagenCierre: '/imagenes/teclab/carreras/customer-experience-cierre.webp',
      resumen: 'Diseñá experiencias centradas en clientes y resolvé casos de atención y fidelización usando herramientas y metodologías de Zendesk.',
      partner: { nombre: 'Zendesk', logo: '/imagenes/teclab/partners/zendesk.webp' },
    },
  },
  {
    // Teclab todavia no le abrio ficha propia: su URL cae en el listado general.
    match: 'venta directa',
    ficha: {
      url: TECLAB_CARRERAS,
      imagen: '/imagenes/teclab/carreras/venta-directa.webp',
      imagenCierre: '/imagenes/teclab/carreras/venta-directa-cierre.webp',
      resumen: 'Formate en venta directa y gestión comercial con una carrera oficial de 2 años, 100% online.',
    },
  },
  {
    match: 'gestión contable',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-gestion-contable/',
      imagen: '/imagenes/teclab/carreras/gestion-contable.webp',
      imagenCierre: '/imagenes/teclab/carreras/gestion-contable-cierre.webp',
      resumen: 'Estudiá Gestión Contable y aprendé contabilidad, impuestos y finanzas. Recibite en 2 años con un perfil clave para las industrias en crecimiento.',
    },
  },
  {
    match: 'seguros',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-seguros/',
      imagen: '/imagenes/teclab/carreras/seguros.webp',
      imagenCierre: '/imagenes/teclab/carreras/seguros-cierre.webp',
      resumen: 'Estudiá Seguros 100% online y lográ tu matrícula PAS sin necesidad de examen. Una carrera de 2 años que te vuelve imprescindible en el mundo laboral.',
    },
  },
  {
    match: 'agraria',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-gestion-empresa-agraria/',
      imagen: '/imagenes/teclab/carreras/gestion-agraria.webp',
      imagenCierre: '/imagenes/teclab/carreras/gestion-agraria-cierre.webp',
      resumen: 'Formate en Gestión Agraria 100% online y aprendé sobre empresas agropecuarias y agronegocios con las habilidades que busca el mercado laboral.',
    },
  },
  {
    match: 'relaciones laborales',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-relaciones-laborales/',
      imagen: '/imagenes/teclab/carreras/relaciones-laborales.webp',
      imagenCierre: '/imagenes/teclab/carreras/relaciones-laborales-cierre.webp',
      resumen: 'Formate en Relaciones Laborales de manera 100% online. Aprendé junto a expertos y lográ tu título dominando la gestión de personas.',
    },
  },
  {
    match: 'hotelera',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-gestion-hotelera/',
      imagen: '/imagenes/teclab/carreras/gestion-hotelera.webp',
      imagenCierre: '/imagenes/teclab/carreras/gestion-hotelera-cierre.webp',
      resumen: 'Estudiá Gestión Hotelera 100% online y obtené tu título oficial en 2 años. Formate en operaciones, turismo, eventos y hospitalidad.',
    },
  },
  {
    match: 'eventos',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-planificacion-y-organizacion-de-eventos/',
      imagen: '/imagenes/teclab/carreras/eventos.webp',
      imagenCierre: '/imagenes/teclab/carreras/eventos-cierre.webp',
      resumen: 'Aprendé a crear experiencias memorables desde el inicio de tu carrera, con una formación práctica orientada al mundo de eventos y producción.',
    },
  },
  {
    match: 'periodismo',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-periodismo-y-nuevas-tecnologias/',
      imagen: '/imagenes/teclab/carreras/periodismo.webp',
      imagenCierre: '/imagenes/teclab/carreras/periodismo-cierre.webp',
      resumen: 'Incorporá tecnologías de vanguardia a la comunicación y desarrollate en medios, contenidos digitales y entornos multiplataforma.',
    },
  },
];

export function getFichaTeclab(carrera: Pick<Carrera, 'nombre'>): TeclabFicha | null {
  const nombre = carrera.nombre.toLowerCase();
  return FICHAS.find(f => nombre.includes(f.match))?.ficha ?? null;
}

// ── Parsers de los campos de texto que llegan de Supabase ──

/** enfoque: "Modalidad: ...\nDuración: ...\nTítulo: ...\nCertificado intermedio: ...\nCocreación: ..." */
export function parseEnfoqueTeclab(enfoque: string | null) {
  const out: Record<string, string> = {};
  for (const line of (enfoque || '').split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) out[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  }
  return {
    modalidad: out['modalidad'] || '100% Online',
    duracion: out['duración'] || out['duracion'] || '2 años',
    titulo: out['título'] || out['titulo'] || '',
    certificado: out['certificado intermedio'] || '',
    cocreacion: out['cocreación'] || out['cocreacion'] || '',
  };
}

/**
 * descripcion: viene en dos partes, "que vas a hacer" y donde se trabaja
 * ("Empresas de desarrollo de software, areas de sistemas..."). La segunda
 * oracion es la salida laboral y se muestra aparte.
 */
export function partirDescripcionTeclab(descripcion: string | null): { perfil: string; salida: string } {
  const texto = (descripcion || '').trim();
  if (!texto) return { perfil: '', salida: '' };
  const oraciones = texto.split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ¿])/).map(s => s.trim()).filter(Boolean);
  if (oraciones.length < 2) return { perfil: texto, salida: '' };
  return {
    perfil: oraciones.slice(0, -1).join(' '),
    salida: oraciones[oraciones.length - 1],
  };
}

/** seccion_modalidad: competencias profesionales, una por linea con vineta. */
export function parseCompetenciasTeclab(raw: string | null): string[] {
  const items = (raw || '')
    .split('\n')
    .map(l => l.replace(/^[•·-]\s*/, '').trim())
    .filter(Boolean);
  // Varias fichas traen la misma competencia repetida (Data Science, por
  // ejemplo, lista dos veces la de principios matematicos).
  return [...new Set(items)];
}

/**
 * plan_estudios: bloques separados por linea en blanco, con cabecera
 * "Primer Año | 1er cuatrimestre" y las materias en lineas "• materia".
 */
export interface TeclabPeriodo {
  año: string;
  label: string;
  materias: string[];
}

export function parsePlanTeclab(plan: string | null): TeclabPeriodo[] {
  const periodos: TeclabPeriodo[] = [];
  for (const bloque of (plan || '').split(/\n\s*\n+/)) {
    const lines = bloque.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const [año, label] = lines[0].split('|').map(s => s.trim());
    periodos.push({
      año: año || '',
      label: label || '',
      materias: lines.slice(1).map(l => l.replace(/^[•·-]\s*/, '')),
    });
  }
  return periodos;
}
