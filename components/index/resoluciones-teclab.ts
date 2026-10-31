// Resoluciones, dictámenes y validez nacional que Teclab publica al pie de cada
// ficha oficial (teclab.edu.ar/carrera/<slug>/, bloque «Elegí Teclab…»).
//
// Es una copia versionada de carreras/teclab/resoluciones-teclab.json: ese
// archivo es la base comercial y no está en el repo. tests/resoluciones-teclab
// compara los dos cuando el JSON está en el disco, para que al regrabarlo el
// sitio no quede atrás.
//
// Programación y Gestión Contable: Teclab publica Resolución 2127/22 + Dictamen
// 2662/22 para la primera y 2357/22 + 2657/22 para la segunda, aunque el Boletín
// Oficial de CABA aprueba el plan de Programación con el Dictamen 2657/22. El
// usuario definió el 31/10/2026 que manda lo que publica Teclab; la diferencia
// sigue anotada en PENDIENTES.md para cuando Secretaría Académica la aclare.

import type { Carrera } from './types';

export interface ResolucionesTeclab {
  /** Resolución que aprueba el plan de estudios. */
  plan?: string;
  /** Aprobación plena: dictamen del Consejo Federal de Educación. */
  dictamen?: string;
  /** Validez nacional del título. */
  validez?: string;
}

export const RESOLUCIONES_TECLAB: { match: string; resoluciones: ResolucionesTeclab }[] = [
  {
    match: 'administración de empresas',
    resoluciones: {
      dictamen: '3345/26 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'cloud administration',
    resoluciones: {
      plan: '335/24 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '3037/24 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'comercio electrónico',
    resoluciones: {
      dictamen: '3391/26 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'customer experience',
    resoluciones: {
      dictamen: '2143/22 del Consejo Federal de Educación, Ministerio de Educación de la Nación',
      validez: '2663/22 del Ministerio de Educación de la Nación',
    },
  },
  {
    match: 'data science',
    resoluciones: {
      plan: '3691/23 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '2856/23 del Consejo Federal de Educación, Ministerio de Educación de la Nación',
      validez: '1266/24 de la Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'desarrollo de videojuegos',
    resoluciones: {
      dictamen: '3396/26 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'diseño de producto digital',
    resoluciones: {
      dictamen: '3390/26 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'gestión ambiental',
    resoluciones: {
      dictamen: '3389/26 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'gestión contable',
    resoluciones: {
      plan: '2357/22 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '2657/22 del Consejo Federal de Educación, Ministerio de Educación de la Nación',
      validez: '434/19 del Ministerio de Educación de la Nación',
    },
  },
  {
    match: 'empresa agraria',
    resoluciones: {
      plan: '2261/22 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '2684/22 del Consejo Federal de Educación, Ministerio de Educación de la Nación',
      validez: '1054/18 del Ministerio de Educación de la Nación',
    },
  },
  {
    match: 'proyectos mineros',
    resoluciones: {
      dictamen: '3387/26 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'gestión hotelera',
    resoluciones: {
      plan: '1334/25 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '3051/24 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
      validez: '1668/25 de la Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'higiene y seguridad',
    resoluciones: {
      dictamen: '3388/26 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'inbound marketing',
    resoluciones: {
      plan: '2208/22 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '2661/22 del Consejo Federal de Educación, Ministerio de Educación de la Nación',
    },
  },
  {
    match: 'logística',
    resoluciones: {
      dictamen: '3403/26 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'marketing digital',
    resoluciones: {
      plan: '121/26 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '3158/25 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'periodismo',
    resoluciones: {
      plan: '2166/22 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '2671/22 del Consejo Federal de Educación, Ministerio de Educación de la Nación',
      validez: '1165/18 del Ministerio de Educación de la Nación',
    },
  },
  {
    match: 'planificación y organización de eventos',
    resoluciones: {
      plan: '1237/22 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '2655/22 del Consejo Federal de Educación, Ministerio de Educación de la Nación',
      validez: '1342/22 del Ministerio de Educación de la Nación',
    },
  },
  {
    match: 'programación',
    resoluciones: {
      plan: '2127/22 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '2662/22 del Consejo Federal de Educación, Ministerio de Educación de la Nación',
      validez: '2029/22 del Ministerio de Educación de la Nación',
    },
  },
  {
    match: 'quality assurance',
    resoluciones: {
      plan: '1184/23 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '2857/23 del Consejo Federal de Educación, Ministerio de Educación de la Nación',
      validez: '591/25 de la Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'redes informáticas',
    resoluciones: {
      dictamen: '2656/22 del Consejo Federal de Educación, Ministerio de Educación de la Nación',
      validez: '1757/19 del Ministerio de Educación de la Nación',
    },
  },
  {
    match: 'relaciones laborales',
    resoluciones: {
      dictamen: '2654/22 del Consejo Federal de Educación, Ministerio de Educación de la Nación',
      validez: '1801/18 del Ministerio de Educación de la Nación',
    },
  },
  {
    match: 'seguridad informática',
    resoluciones: {
      plan: '730/25 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '3032/24 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
      validez: '1413/25 de la Secretaría de Educación de la Nación',
    },
  },
  {
    match: 'seguros',
    resoluciones: {
      plan: '335/24 del Ministerio de Educación de la Ciudad de Buenos Aires',
      dictamen: '3052/24 del Consejo Federal de Educación, Secretaría de Educación de la Nación',
      validez: '1062/25 de la Secretaría de Educación de la Nación',
    },
  },
];

/** Sin acentos ni mayúsculas: el nombre en D1 y el de Teclab no siempre coinciden. */
function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Resoluciones de una tecnicatura de Teclab, o null si todavía no las publica
 * (las anunciadas «Próximamente» no las tienen). Los cursos no llevan.
 */
export function getResolucionesTeclab(
  carrera: Pick<Carrera, 'nombre'> & Partial<Pick<Carrera, 'nombre_corto'>>,
): ResolucionesTeclab | null {
  const nombre = normalizar(`${carrera.nombre} ${carrera.nombre_corto ?? ''}`);
  return RESOLUCIONES_TECLAB.find(r => nombre.includes(normalizar(r.match)))?.resoluciones ?? null;
}
