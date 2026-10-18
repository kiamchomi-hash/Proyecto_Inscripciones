// Parejas de fichas de casas distintas que Google confunde entre si.
//
// Medido en Search Console a 90 dias (18/10/2026): "siglo 21 marketing digital"
// y "marketing digital siglo 21" (493 impresiones) caian en la ficha de Teclab
// en posicion 6-7, mientras la de Siglo 21 quedaba en la 13. El que busca la
// universidad ve un resultado de Teclab y no clickea. Las dos son oferta real,
// asi que no va un 301: cada ficha enlaza a la otra con el nombre de la casa en
// el texto del enlace, que es lo que le dice a Google cual responde a cada marca.
//
// Sin 'use client': lo usa la pagina, que es un Server Component.

import { carreraFullName, type Carrera } from '@/components/index/types';

type CarreraEnlace = Pick<Carrera, 'id' | 'nombre' | 'prefix' | 'nivel'>;

// Por nombre completo, igual que SEO_ESPECIFICO: el id no se lee en el codigo.
const PAREJAS: [teclab: string, siglo21: string][] = [
  ['Tecnicatura Superior en Marketing Digital', 'Tecnicatura en Marketing y Publicidad Digital'],
];

export interface Equivalente {
  carrera: CarreraEnlace;
  casa: 'Teclab' | 'Universidad Siglo 21';
}

/** La ficha de la otra casa, si existe y sigue en la oferta que se pasa. */
export function carreraEquivalente(carrera: CarreraEnlace, carreras: CarreraEnlace[]): Equivalente | null {
  const nombre = carreraFullName(carrera);
  for (const [teclab, siglo21] of PAREJAS) {
    const otro = nombre === teclab ? siglo21 : nombre === siglo21 ? teclab : null;
    if (!otro) continue;
    const encontrada = carreras.find(c => carreraFullName(c) === otro);
    if (!encontrada) return null;
    const { id, nombre: n, prefix, nivel } = encontrada;
    return { carrera: { id, nombre: n, prefix, nivel }, casa: otro === teclab ? 'Teclab' : 'Universidad Siglo 21' };
  }
  return null;
}
