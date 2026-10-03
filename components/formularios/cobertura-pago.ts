// Qué cubre el pago de Teclab, dicho a partir de los conceptos del precio.
// La matrícula y los aranceles se pagan por cuatrimestre (Reglamento
// Institucional de Teclab, 4.1). Quien entra al inicio paga la matrícula y
// los dos bimestres; quien entra en junio u octubre paga la matrícula de ese
// cuatrimestre y el único bimestre que queda. El cuatrimestre siguiente
// vuelve a cobrar las dos cosas: decir sólo «los bimestres siguientes se
// pagan aparte» dejaba creer que la matrícula ya no se pagaba más.
//
// Sale de los conceptos y no de la `nota` de la base porque ahí sólo dice
// «un bimestre» o «un cuatrimestre», sin los meses ni lo que viene después.
//
// Autocontenido a propósito, como `financiacion-teclab.ts`: lo importan
// componentes del navegador.

interface Concepto {
  concepto: string;
}

const SIGUIENTE = 'El cuatrimestre siguiente se paga de nuevo, matrícula y bimestres.';

/**
 * `2 años` -> 4, `24 meses` -> 6; `null` si no se puede pasar a cuatrimestres
 * enteros (un curso de `4 semanas`, o la duración vacía).
 */
function cuatrimestresDe(duracion: string | null | undefined): number | null {
  const m = duracion?.trim().match(/^(\d+)\s*(años?|meses?)$/i);
  if (!m) return null;
  const n = Number(m[1]);
  const c = /^a/i.test(m[2]) ? n * 2 : n / 4;
  return Number.isInteger(c) && c > 0 ? c : null;
}

/** El cierre: con la duración, cuántos cuatrimestres se pagan; sin ella, el genérico. */
function cierre(duracion: string | null | undefined): string {
  const c = cuatrimestresDe(duracion);
  if (c === null) return SIGUIENTE;
  const tramo = c === 1 ? '1 cuatrimestre (2 bimestres)' : `${c} cuatrimestres (${c * 2} bimestres)`;
  return `La carrera tiene ${tramo}, y cada uno se paga aparte: matrícula y bimestres.`;
}

/** `Bimestre (octubre-noviembre)` -> `['octubre', 'noviembre']`, o `null` sin meses. */
function mesesDe(concepto: string): [string, string] | null {
  const meses = concepto.match(/\(\s*([a-záéíóú]+)\s*-\s*([a-záéíóú]+)\s*\)/i);
  return meses ? [meses[1].toLowerCase(), meses[2].toLowerCase()] : null;
}

/**
 * La aclaración de qué cubre el pago, o `null` si no hay bimestres en el
 * precio (un curso de pago único): ahí no se afirma nada. Con la `duracion`
 * de la carrera dice cuántos cuatrimestres se pagan en total.
 */
export function coberturaDelPago(conceptos: Concepto[], duracion?: string | null): string | null {
  // «Bimestre (marzo-abril)» y también «Primer bimestre», que es como rotula
  // el robot cuando no sabe el período.
  const bimestres = conceptos.filter(c => /\bbimestre\b/i.test(c.concepto));
  if (!bimestres.length) return null;

  const conMatricula = conceptos.some(c => /^matr[ií]cula\b/i.test(c.concepto.trim()));
  const inicio = conMatricula ? 'Cubre la matrícula y' : 'Cubre';
  const primero = mesesDe(bimestres[0].concepto);
  const ultimo = mesesDe(bimestres[bimestres.length - 1].concepto);

  // Un solo bimestre es entrar a mitad de cuatrimestre: se paga lo que queda.
  if (bimestres.length === 1) {
    const cual = primero ? `el bimestre de ${primero[0]} y ${primero[1]}` : 'un bimestre de cursada';
    return `${inicio} lo que queda del cuatrimestre: ${cual}. ${cierre(duracion)}`;
  }
  const desde = primero && ultimo ? `, de ${primero[0]} a ${ultimo[1]}` : '';
  return `${inicio} el cuatrimestre completo${desde}. ${cierre(duracion)}`;
}
