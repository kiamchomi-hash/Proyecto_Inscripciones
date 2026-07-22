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

/** seccion_modalidad: competencias profesionales, una por linea con vineta. */
export function parseCompetenciasTeclab(raw: string | null): string[] {
  return (raw || '')
    .split('\n')
    .map(l => l.replace(/^[•·-]\s*/, '').trim())
    .filter(Boolean);
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
