// Los bloques de la preinscripción: tramos seguidos de campos del mismo grupo,
// cada uno con su rótulo. Veinte campos sueltos se leen como una pared; en
// bloques se ve cuánto falta y de qué se trata cada parte.
//
// Sólo importa tipos para que los tests lo carguen directo con Node: el grupo
// de cada campo llega como función.

import type { Grupo } from './casas';

export const ROTULO_GRUPO: Record<Grupo, string> = {
  consulta: 'Tu consulta',
  personales: 'Tus datos',
  domicilio: 'Domicilio',
  estudios: 'Estudios',
  contacto: 'Contacto',
};

export interface Bloque<T> {
  grupo: Grupo;
  campos: T[];
}

/** Parte la lista en tramos del mismo grupo, sin reordenar nada. */
export function bloquesDe<T>(campos: T[], grupoDe: (id: T) => Grupo): Bloque<T>[] {
  const bloques: Bloque<T>[] = [];
  for (const id of campos) {
    const grupo = grupoDe(id);
    const ultimo = bloques[bloques.length - 1];
    if (ultimo?.grupo === grupo) ultimo.campos.push(id);
    else bloques.push({ grupo, campos: [id] });
  }
  return bloques;
}
