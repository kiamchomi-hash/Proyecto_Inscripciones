// Qué cubre el pago, en Teclab y en Siglo 21: las dos cobran la matrícula y
// los bimestres por cuatrimestre (Reglamento Institucional de Teclab, 4.1).
// El cuatrimestre siguiente vuelve a cobrar las dos cosas: decir sólo «los
// bimestres siguientes se pagan aparte» dejaba creer que la matrícula ya no
// se pagaba más.
//
// Un solo texto para todos los casos. No nombra los meses ni cuenta los
// bimestres de la carrera: se puede entrar al inicio o a mitad de
// cuatrimestre, pagar uno o dos bimestres, y lo cubierto ya lo dice el
// detalle de conceptos de arriba. Contarlos con la duración salía mal en las
// carreras que no tienen dos bimestres parejos por cuatrimestre.
//
// Autocontenido a propósito, como `financiacion-teclab.ts`: lo importan
// componentes del navegador.

interface Concepto {
  concepto: string;
}

export const COBERTURA_PAGO =
  'Este pago cubre la matrícula y los bimestres detallados. El cuatrimestre siguiente requiere un nuevo pago de matrícula y bimestres.';

/**
 * La aclaración de qué cubre el pago, o `null` si no hay bimestres en el
 * precio (un curso de pago único): ahí no se afirma nada.
 */
export function coberturaDelPago(conceptos: Concepto[]): string | null {
  // «Bimestre (marzo-abril)» y también «Primer bimestre», que es como rotula
  // el robot cuando no sabe el período.
  return conceptos.some(c => /\bbimestre\b/i.test(c.concepto)) ? COBERTURA_PAGO : null;
}
