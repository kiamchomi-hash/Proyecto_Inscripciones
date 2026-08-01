// Datos de marca y clasificacion del Instituto Tecnico Superior Teclab.
// Fuente: PDF oficiales de plan de estudio y el render de Remotion
// (Desktop\Teclab Info\remotion-teclab-carreras), del que salen las dos
// esteticas: cian #2ee7d7 para tecnologia y violeta #8e2cf2 para el resto,
// sobre fondo tinta #071822.

import type { Carrera } from './types';

export const TECLAB_CYAN = '#2ee7d7';
export const TECLAB_PURPLE = '#8e2cf2';
export const TECLAB_AMBER = '#f4aa22';
export const TECLAB_INK = '#071822';
export const NIVEL_CURSO_TECLAB = 'Teclab - Curso';

/** Las dos familias de carreras, cada una con su acento. */
export type TeclabFamilia = 'tecnologia' | 'gestion';

export function getFamiliaTeclab(c: Pick<Carrera, 'nivel'>): TeclabFamilia | null {
  if (c.nivel === 'Teclab - Tecnología') return 'tecnologia';
  if (c.nivel === 'Teclab - Gestión') return 'gestion';
  return null;
}

export function esTeclab(c: Pick<Carrera, 'nivel'>): boolean {
  return getFamiliaTeclab(c) !== null;
}

/** Cursos breves de Teclab: se presentan separados de sus tecnicaturas. */
export function esCursoTeclab(c: Pick<Carrera, 'nivel'>): boolean {
  return c.nivel === NIVEL_CURSO_TECLAB;
}

export function acentoTeclab(familia: TeclabFamilia): string {
  return familia === 'tecnologia' ? TECLAB_CYAN : TECLAB_PURPLE;
}

/**
 * Acento y clase con la que se pinta el modal. Los cursos no son una familia
 * -no arman seccion propia, entran en Teclab Tecnologia- pero si tienen color
 * propio: el ambar que ya usan su tarjeta del catalogo y su ficha en /carreras.
 */
export function getMarcoTeclab(c: Pick<Carrera, 'nivel'>): { clase: string; acento: string } {
  if (esCursoTeclab(c)) return { clase: 'teclab-curso', acento: TECLAB_AMBER };
  const familia = getFamiliaTeclab(c) ?? 'gestion';
  return { clase: `teclab-${familia}`, acento: acentoTeclab(familia) };
}

/** Sobre el violeta el texto va blanco; sobre el cian y el ambar, tinta. */
export function textoSobreAcentoTeclab(acento: string): string {
  return acento === TECLAB_PURPLE ? '#ffffff' : TECLAB_INK;
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

/** Categorías internas de la sección Teclab Tecnología. */
export const CATEGORIAS_TECNOLOGIA = [
  'Desarrollo',
  'Datos e IA',
  'Infraestructura',
  'Ciberseguridad',
] as const;

export function getCategoriaTeclabTecnologia(carrera: Pick<Carrera, 'nombre' | 'nivel'>): string | null {
  const esTecnologia = getFamiliaTeclab(carrera) === 'tecnologia' || esCursoTeclab(carrera);
  if (!esTecnologia) return null;

  const nombre = carrera.nombre.toLowerCase();
  if (nombre.includes('data science') || nombre.includes('inteligencia artificial')) return 'Datos e IA';
  if (nombre.includes('cloud administration') || nombre.includes('redes informáticas')) return 'Infraestructura';
  if (nombre.includes('seguridad informática')) return 'Ciberseguridad';
  if (nombre.includes('programación') || nombre.includes('quality assurance')) return 'Desarrollo';
  return null;
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
      partner: { nombre: 'Avenga', logo: '/imagenes/teclab/partners/avenga.webp' },
    },
  },
  {
    match: 'data science',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/carrera-de-data-science/',
      imagen: '/imagenes/teclab/carreras/data-science.webp',
      imagenCierre: '/imagenes/teclab/carreras/data-science-cierre.webp',
      partner: { nombre: 'AWS Academy', logo: '/imagenes/teclab/partners/aws.webp' },
    },
  },
  {
    match: 'quality assurance',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-quality-assurance/',
      imagen: '/imagenes/teclab/carreras/quality-assurance.webp',
      imagenCierre: '/imagenes/teclab/carreras/quality-assurance-cierre.webp',
      partner: { nombre: 'Microsoft', logo: '/imagenes/teclab/partners/microsoft.webp' },
    },
  },
  {
    match: 'cloud administration',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-en-cloud-administration/',
      imagen: '/imagenes/teclab/carreras/cloud-administration.webp',
      imagenCierre: '/imagenes/teclab/carreras/cloud-administration-cierre.webp',
      partner: { nombre: 'AWS Academy', logo: '/imagenes/teclab/partners/aws.webp' },
    },
  },
  {
    match: 'seguridad informática',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-en-seguridad-informatica/',
      imagen: '/imagenes/teclab/carreras/seguridad-informatica.webp',
      imagenCierre: '/imagenes/teclab/carreras/seguridad-informatica-cierre.webp',
      partner: { nombre: 'Mercado IT' },
    },
  },
  {
    match: 'redes informáticas',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-redes-informaticas/',
      imagen: '/imagenes/teclab/carreras/redes-informaticas.webp',
      imagenCierre: '/imagenes/teclab/carreras/redes-informaticas-cierre.webp',
      partner: { nombre: 'Cisco Networking' },
    },
  },
  {
    match: 'marketing digital',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-marketing-digital/',
      imagen: '/imagenes/teclab/carreras/marketing-digital.webp',
      imagenCierre: '/imagenes/teclab/carreras/marketing-digital-cierre.webp',
      partner: { nombre: 'Google', logo: '/imagenes/teclab/partners/google.webp' },
    },
  },
  {
    match: 'inbound marketing',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-inbound-marketing/',
      imagen: '/imagenes/teclab/carreras/inbound-marketing.webp',
      imagenCierre: '/imagenes/teclab/carreras/inbound-marketing-cierre.webp',
      partner: { nombre: 'HubSpot', logo: '/imagenes/teclab/partners/hubspot.webp' },
    },
  },
  {
    match: 'customer experience',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-customer-experience/',
      imagen: '/imagenes/teclab/carreras/customer-experience.webp',
      imagenCierre: '/imagenes/teclab/carreras/customer-experience-cierre.webp',
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
    },
  },
  {
    match: 'gestión contable',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-gestion-contable/',
      imagen: '/imagenes/teclab/carreras/gestion-contable.webp',
      imagenCierre: '/imagenes/teclab/carreras/gestion-contable-cierre.webp',
    },
  },
  {
    match: 'seguros',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-seguros/',
      imagen: '/imagenes/teclab/carreras/seguros.webp',
      imagenCierre: '/imagenes/teclab/carreras/seguros-cierre.webp',
    },
  },
  {
    match: 'agraria',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-gestion-empresa-agraria/',
      imagen: '/imagenes/teclab/carreras/gestion-agraria.webp',
      imagenCierre: '/imagenes/teclab/carreras/gestion-agraria-cierre.webp',
    },
  },
  {
    match: 'relaciones laborales',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-relaciones-laborales/',
      imagen: '/imagenes/teclab/carreras/relaciones-laborales.webp',
      imagenCierre: '/imagenes/teclab/carreras/relaciones-laborales-cierre.webp',
    },
  },
  {
    match: 'hotelera',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-gestion-hotelera/',
      imagen: '/imagenes/teclab/carreras/gestion-hotelera.webp',
      imagenCierre: '/imagenes/teclab/carreras/gestion-hotelera-cierre.webp',
    },
  },
  {
    match: 'eventos',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-planificacion-y-organizacion-de-eventos/',
      imagen: '/imagenes/teclab/carreras/eventos.webp',
      imagenCierre: '/imagenes/teclab/carreras/eventos-cierre.webp',
    },
  },
  {
    match: 'periodismo',
    ficha: {
      url: 'https://teclab.edu.ar/carrera/tecnico-superior-en-periodismo-y-nuevas-tecnologias/',
      imagen: '/imagenes/teclab/carreras/periodismo.webp',
      imagenCierre: '/imagenes/teclab/carreras/periodismo-cierre.webp',
    },
  },
  {
    // Curso, no tecnicatura: su landing no publica fotos propias -el hero es un
    // recorte sobre fondo liso-, asi que usa dos del mismo banco de imagenes que
    // el resto. Con nombre propio, para poder cambiarlas sin tocar el codigo.
    match: 'inteligencia artificial',
    ficha: {
      url: 'https://teclab.edu.ar/landing/curso-profesional-ia/',
      imagen: '/imagenes/teclab/carreras/curso-ia.webp',
      imagenCierre: '/imagenes/teclab/carreras/curso-ia-cierre.webp',
    },
  },
];

export function getFichaTeclab(carrera: Pick<Carrera, 'nombre'>): TeclabFicha | null {
  const nombre = carrera.nombre.toLowerCase();
  return FICHAS.find(f => nombre.includes(f.match))?.ficha ?? null;
}

/**
 * Las tres competencias que muestra el modal, elegidas a mano de la lista
 * oficial: las fichas traen entre siete y nueve, muchas repiten formulas
 * genericas ("planificar e implementar proyectos con orientacion a
 * resultados") y algunas mezclan avisos que no son competencias (la alianza
 * con AWS, el titulo, el descuento en la certificacion). La lista completa
 * sigue estando en la pagina de cada carrera.
 *
 * Se identifican por como empiezan y no por su posicion, asi reordenar la
 * ficha en Supabase no cambia cual se muestra.
 */
const DESTACADAS: Record<string, string[]> = {
  'programación': ['Escribir el código', 'Desarrollar sitios web modulares', 'Analizar y gestionar bases de datos'],
  'data science': ['Analizar y explorar datos', 'Procesar datos, entrenar modelos', 'Gestionar bases de datos orientadas'],
  'quality assurance': ['Identificar las funcionalidades', 'Crear planes de pruebas', 'Dominar distintos lenguajes'],
  'cloud administration': ['Conocé todo sobre cloud computing', 'Conocerás los conceptos asociados', 'Preparate para monitorear'],
  'seguridad informática': ['Sabrás responder', 'Aprenderás a identificar riesgos', 'Vas a poder asegurar'],
  'redes informáticas': ['Planear, implementar, administrar', 'Implementar seguridad en redes', 'Desarrollar scripts'],
  'marketing digital': ['Diseñar, implementar y evaluar', 'Gestionar campañas publicitarias', 'Elaborar diferentes reportes'],
  'inbound marketing': ['Diseñar estrategias efectivas', 'Analizar y comprender el proceso', 'Desarrollar, revisar y publicar'],
  'customer experience': ['Diseñar e implementar, a través del Design Thinking', 'Crear y ejecutar estrategias', 'Determinar y analizar las métricas'],
  'venta directa': ['Gestionar las etapas del proceso', 'Gestionar prospectos', 'Utilizar herramientas de monitoreo'],
  'gestión contable': ['Registrar operaciones comerciales', 'Dominar el marco legal', 'Utilizar sistemas y bases de datos'],
  'seguros': ['Asesorar sobre los distintos tipos', 'Gestionar solicitudes de cotizaciones', 'Asistir al cliente'],
  'agraria': ['Gestionar planes de producción', 'Seleccionar y utilizar tecnologías', 'Gestionar en forma eficiente'],
  'relaciones laborales': ['Aplicar políticas de reclutamiento', 'Procesar la documentación', 'Manejar adecuadamente la normativa'],
  'hotelera': ['Organizar y ejecutar los procesos', 'Aplicar técnicas básicas de Revenue', 'Supervisar el cumplimiento'],
  'eventos': ['Diseñar, planificar, implementar', 'Administrar recursos y herramientas', 'Implementar las normas de ceremonial'],
  'periodismo': ['Planear, producir y difundir', 'Analizar y jerarquizar', 'Conocer las fuentes adecuadas'],
};

const sinTildes = (texto: string) =>
  texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * Las tres competencias del modal. Si una elegida no aparece -porque cambio el
 * texto de la ficha- se completa con las primeras de la lista, asi el slide
 * nunca queda corto.
 */
export function destacarCompetencias(competencias: string[], carrera: Pick<Carrera, 'nombre' | 'nivel'>): string[] {
  // Los cursos publican una lista corta y hecha para leerse entera: no hay
  // formulas genericas que podar, asi que van las cuatro.
  if (esCursoTeclab(carrera)) return competencias;

  const nombre = carrera.nombre.toLowerCase();
  const clave = Object.keys(DESTACADAS).find(k => nombre.includes(k));
  const elegidas: string[] = [];

  for (const inicio of clave ? DESTACADAS[clave] : []) {
    const hallada = competencias.find(c => sinTildes(c).startsWith(sinTildes(inicio)) && !elegidas.includes(c));
    if (hallada) elegidas.push(hallada);
  }
  for (const c of competencias) {
    if (elegidas.length >= 3) break;
    if (!elegidas.includes(c)) elegidas.push(c);
  }
  return elegidas.slice(0, 3);
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
