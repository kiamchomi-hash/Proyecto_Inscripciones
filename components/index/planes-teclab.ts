// El programa oficial que Teclab publica para cada carrera, servido desde
// public/planes/teclab/. Son los mismos PDF que el bot adjunta por WhatsApp
// (carreras/teclab/pdfs/), copiados al repo porque esa carpeta no está
// versionada. Pesan 16 MB en total; logística es el más grande (2,6 MB).
//
// La lista es explícita y no se deduce del nombre: cuando el archivo no está,
// la ficha arma un PDF con el plan que tiene en la base (lib/plan-pdf.ts), así
// que un archivo que falta no deja la ficha sin descarga. El test
// tests/planes-teclab.test.mjs cuida que no sobre ni falte ninguno.

import type { Carrera } from './types';

const PLANES: { match: string; archivo: string }[] = [
  { match: 'administración de empresas', archivo: 'administracion-de-empresas.pdf' },
  { match: 'cloud administration', archivo: 'cloud-administration.pdf' },
  { match: 'comercio electrónico', archivo: 'comercio-electronico-e-commerce.pdf' },
  { match: 'customer experience', archivo: 'customer-experience.pdf' },
  { match: 'data science', archivo: 'data-science.pdf' },
  { match: 'desarrollo de videojuegos', archivo: 'desarrollo-de-videojuegos.pdf' },
  { match: 'diseño de producto digital', archivo: 'diseno-de-producto-digital.pdf' },
  { match: 'gestión ambiental', archivo: 'gestion-ambiental.pdf' },
  { match: 'gestión contable', archivo: 'gestion-contable.pdf' },
  { match: 'empresa agraria', archivo: 'gestion-de-la-empresa-agraria.pdf' },
  { match: 'proyectos mineros', archivo: 'gestion-de-proyectos-mineros.pdf' },
  { match: 'gestión hotelera', archivo: 'gestion-hotelera.pdf' },
  { match: 'higiene y seguridad', archivo: 'higiene-y-seguridad-en-el-trabajo.pdf' },
  { match: 'inbound marketing', archivo: 'inbound-marketing.pdf' },
  { match: 'logística', archivo: 'logistica.pdf' },
  { match: 'marketing digital', archivo: 'marketing-digital.pdf' },
  { match: 'periodismo', archivo: 'periodismo-y-nuevas-tecnologias.pdf' },
  { match: 'planificación y organización de eventos', archivo: 'planificacion-y-organizacion-de-eventos.pdf' },
  { match: 'programación', archivo: 'programacion.pdf' },
  { match: 'quality assurance', archivo: 'qa.pdf' },
  { match: 'redes informáticas', archivo: 'redes-informaticas.pdf' },
  { match: 'relaciones laborales', archivo: 'relaciones-laborales.pdf' },
  { match: 'seguridad informática', archivo: 'seguridad-informatica.pdf' },
  { match: 'seguros', archivo: 'seguros.pdf' },
];

/** Sin acentos ni mayúsculas: el nombre en D1 y el de Teclab no siempre coinciden. */
function normalizar(valor: string): string {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Ruta del programa oficial de una carrera de Teclab, o null si no lo tenemos
 * (las anunciadas «Próximamente» todavía no lo tienen publicado).
 */
export function getPlanOficialTeclab(
  carrera: Pick<Carrera, 'nombre'> & Partial<Pick<Carrera, 'nombre_corto'>>,
): string | null {
  const nombre = normalizar(`${carrera.nombre} ${carrera.nombre_corto ?? ''}`);
  const plan = PLANES.find(p => nombre.includes(normalizar(p.match)))?.archivo;
  return plan ? `/planes/teclab/${plan}` : null;
}
