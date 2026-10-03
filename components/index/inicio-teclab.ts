// Fecha de inicio de clases de Teclab y si la inscripcion sigue abierta.
// Fuentes: las fechas de inicio y las ventanas de venta del curso salen del
// calendario del Dashboard Comercial de Teclab
// (carreras/teclab/calendario-teclab.json). El cierre de admision de las
// tecnicaturas (03/11/2026) lo confirmo el usuario el 02/10/2026: el
// calendario no lo publica.
// Al cargar el bimestre siguiente se actualizan solo estos datos.

import type { Carrera } from './types';

/** Tecnicaturas: bimestre en curso de venta. */
const TECNICATURAS = { inicio: '2026-10-14', inscripcionHasta: '2026-11-03' };

/** Curso de IA: cada edicion se vende hasta el dia anterior a su inicio. */
const EDICIONES_CURSO = [
  { inicio: '2026-10-13', ventaDesde: '2026-09-08', ventaHasta: '2026-10-12' },
  { inicio: '2026-11-17', ventaDesde: '2026-10-13', ventaHasta: '2026-11-16' },
];

// Los niveles se repiten aca en vez de importar esTeclab/esCursoTeclab de
// ./teclab: node --test no resuelve imports de valores sin extension. El test
// de este modulo cuida que la clasificacion coincida con la de ./teclab.
const NIVELES_TECNICATURA = ['Teclab - Tecnología', 'Teclab - Gestión'];
const NIVEL_CURSO = 'Teclab - Curso';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export interface InicioTeclab {
  /** Fecha de inicio, YYYY-MM-DD. */
  inicio: string;
  /** Fecha de inicio para mostrar: "14 de octubre". */
  inicioTexto: string;
  abierta: true;
  /** Las clases ya arrancaron pero la inscripcion sigue abierta. */
  empezo: boolean;
  /** Ultimo dia para inscribirse, YYYY-MM-DD. */
  hasta: string;
  /** Ultimo dia para inscribirse, para mostrar: "3 de noviembre". */
  hastaTexto: string;
}

/** Dia calendario en Buenos Aires, YYYY-MM-DD, sin importar el huso de quien lo corre. */
export function fechaArgentina(fecha: Date): string {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}

function textoFecha(iso: string): string {
  const [, mes, dia] = iso.split('-').map(Number);
  return `${dia} de ${MESES[mes - 1]}`;
}

function resultado(inicio: string, hasta: string, hoy: string): InicioTeclab {
  return {
    inicio,
    inicioTexto: textoFecha(inicio),
    abierta: true,
    empezo: hoy >= inicio,
    hasta,
    hastaTexto: textoFecha(hasta),
  };
}

/**
 * Inicio de clases a mostrar en una carrera de Teclab, o null si no es de
 * Teclab o no hay inscripcion abierta. Las fechas se comparan como texto
 * YYYY-MM-DD, que ordena igual que el calendario.
 */
export function inicioTeclab(carrera: Pick<Carrera, 'nivel'>, ahora: Date): InicioTeclab | null {
  const hoy = fechaArgentina(ahora);

  if (carrera.nivel === NIVEL_CURSO) {
    const edicion = EDICIONES_CURSO.find(e => e.ventaDesde <= hoy && hoy <= e.ventaHasta);
    return edicion ? resultado(edicion.inicio, edicion.ventaHasta, hoy) : null;
  }

  if (NIVELES_TECNICATURA.includes(carrera.nivel)) {
    return hoy <= TECNICATURAS.inscripcionHasta
      ? resultado(TECNICATURAS.inicio, TECNICATURAS.inscripcionHasta, hoy)
      : null;
  }

  return null;
}
