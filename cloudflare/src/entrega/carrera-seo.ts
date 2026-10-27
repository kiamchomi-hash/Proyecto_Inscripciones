import type { Carrera } from '@/components/index/types';
import { carreraFullName, carreraToSlug } from '@/components/index/types';
import { esCursoTeclab, esTeclab, getFamiliaTeclab, getFichaTeclab, parseEnfoqueTeclab } from '@/components/index/teclab';
import { parseIAMeta, tienePlanDeEstudios } from '@/components/carreras/career-content';
import ogTeclab from '@/components/carreras/og-teclab.json';

// Port de los contratos SEO de app/carreras/[slug]/page.tsx. El presupuesto se
// prueba por nombre y luego por sufijo: no sacrificar el prefijo académico antes.
const ESPECIFICOS: Record<string, { title: string; description: string }> = {
  'Tecnicatura en Diseño y Desarrollo de Videojuegos': {
    title: 'Tecnicatura en Diseño y Desarrollo de Videojuegos | Siglo 21',
    description: 'Aprendé programación, animación 2D y 3D, inteligencia artificial y motores de videojuegos. Conocé el plan de la tecnicatura a distancia de Siglo 21.',
  },
  'Licenciatura en Finanzas': {
    title: 'Licenciatura en Finanzas a Distancia | Siglo 21',
    description: 'Estudiá mercados, inversiones, riesgo y tecnología financiera. Conocé el plan de estudios y cómo inscribirte en la Licenciatura en Finanzas a distancia.',
  },
  'Tecnicatura Superior en Marketing Digital': {
    title: 'Tecnicatura en Marketing Digital | Teclab Online',
    description: 'Estudiá marketing digital, publicidad, contenidos, e-commerce y experiencia del cliente. Título oficial, 2 años y modalidad 100% online en Teclab.',
  },
  'Tecnicatura Superior en Cloud Administration': {
    title: 'Técnico Superior en Cloud Administration online | Teclab',
    description: 'Aprendé a administrar servicios en la nube con AWS, Azure y Google Cloud. Título oficial de Teclab en 2 años, 100% online. Conocé el plan de estudios.',
  },
  'Tecnicatura Superior en Gestión Contable': {
    title: 'Tecnicatura en Gestión Contable Online | Teclab',
    description: 'Título oficial en 2 años, 100% online, con certificación intermedia de Auxiliar Contable. Estudiá contabilidad, impuestos y estados contables en Teclab.',
  },
  'Tecnicatura Superior en Gestión Hotelera': {
    title: 'Tecnicatura Superior en Gestión Hotelera | Teclab · Siglo 21',
    description: 'Estudiá hotelería y gestión hotelera a distancia: reservas, recepción, eventos y administración de alojamientos. Título oficial de Teclab en 2 años, online.',
  },
  'Tecnicatura en Marketing y Publicidad Digital': {
    title: 'Tecnicatura en Marketing y Publicidad Digital | Siglo 21',
    description: 'Marketing digital en Universidad Siglo 21: SEO/SEM, redes sociales y email marketing. Tecnicatura a distancia de 2 años. Consultá el plan de estudios.',
  },
  Procurador: {
    title: 'Procurador a Distancia | Universidad Siglo 21',
    description: 'Estudiá Procurador a distancia: formación en derecho procesal, trámites y representación jurídica. Conocé el plan de estudios y cómo inscribirte.',
  },
};

export function tituloCarrera(carrera: Carrera) {
  const completo = carreraFullName(carrera);
  const teclab = esTeclab(carrera) || esCursoTeclab(carrera);
  const sufijos = carrera.nivel === 'Identidad Argentina'
    ? [' | Academia Identidad Argentina', ' | Identidad Argentina']
    : teclab ? [' | Teclab · Siglo 21'] : [' a Distancia | Siglo 21', ' | Siglo 21'];
  const minimo = teclab ? ' | Teclab' : sufijos.at(-1)!;
  const tecnico = teclab && completo.startsWith('Tecnicatura Superior en ')
    ? completo.replace('Tecnicatura Superior en ', 'Tecnicatura en ') : null;
  const nombres = [completo, tecnico, carrera.nombre_corto]
    .filter((n): n is string => Boolean(n)).filter((n, i, arr) => arr.indexOf(n) === i);
  for (const nombre of nombres) for (const sufijo of sufijos) {
    if (nombre.length + sufijo.length <= 61) return `${nombre}${sufijo}`;
  }
  const corto = `${nombres.at(-1)}${minimo}`;
  return corto.length <= 66 ? corto : completo;
}

function juntar(partes: (string | false | null | undefined)[]) {
  const vivas = partes.filter((p): p is string => Boolean(p));
  while (vivas.length > 1 && vivas.join(' ').length > 165) vivas.pop();
  return vivas.join(' ');
}

export function descripcionCarrera(c: Carrera): string {
  const nombre = carreraFullName(c);
  const cierre = c.proximamente ? 'Todavía no abrió la inscripción: dejanos tus datos y te avisamos.'
    : tienePlanDeEstudios(c) ? 'Consultá el plan de estudios y cómo inscribirte.' : 'Consultá la modalidad y cómo inscribirte.';
  if (c.nivel === 'Identidad Argentina') {
    const { modalidad } = parseIAMeta(c.enfoque || '');
    return juntar([`${c.nombre_corto || nombre} con la Academia Identidad Argentina: ${c.duracion}, ${(modalidad || 'a distancia').toLowerCase()}.`, cierre, 'Certificación nacional e internacional.']);
  }
  if ((esTeclab(c) || esCursoTeclab(c)) && c.proximamente) {
    return juntar([`${c.nombre_corto || nombre}: ${esCursoTeclab(c) ? 'nuevo curso' : 'nueva carrera'} de Teclab, a distancia.`, cierre]);
  }
  if (esCursoTeclab(c)) {
    const { modalidad } = parseEnfoqueTeclab(c.enfoque);
    return juntar([`${c.nombre_corto || nombre}: curso de Teclab de ${c.duracion}, ${(modalidad || 'a distancia').toLowerCase()}.`, 'Certificado oficial. Consultá la modalidad y cómo inscribirte.']);
  }
  if (esTeclab(c)) {
    const { titulo, modalidad } = parseEnfoqueTeclab(c.enfoque);
    const grado = (titulo || nombre).replace(/\s*\([^)]*\)/g, '').replace(/\.$/, '');
    const partner = getFichaTeclab(c)?.partner?.nombre;
    return juntar([`Carrera de Teclab. Recibite de ${grado} en ${c.duracion}, ${(modalidad || 'a distancia').toLowerCase()}.`, partner && `Cocreada con ${partner}.`, cierre]);
  }
  return juntar([`${c.enfoque.trim().replace(/\.$/, '')}.`, 'A distancia con Universidad Siglo 21.', cierre, `Duración: ${c.duracion}.`]);
}

export function seoCarrera(c: Carrera) {
  const nombre = carreraFullName(c);
  const titulo = ESPECIFICOS[nombre]?.title ?? tituloCarrera(c);
  const descripcion = ESPECIFICOS[nombre]?.description ?? descripcionCarrera(c);
  const slug = carreraToSlug(c);
  const familia = getFamiliaTeclab(c);
  const imagen = c.nivel === 'Identidad Argentina' ? '/imagenes/og/default-identidad-argentina.jpg'
    : ogTeclab.slugs.includes(slug) ? `/imagenes/og/teclab/${slug}.jpg`
    : familia ? `/imagenes/og/default-teclab-${familia}.jpg` : '/imagenes/og/default.jpg';
  const palabrasClave = c.nivel === 'Identidad Argentina'
    ? [nombre, c.nombre, 'academia identidad argentina', 'diplomatura online', 'villa lugano', c.nivel, 'CABA']
    : esTeclab(c) || esCursoTeclab(c)
      ? [nombre, c.nombre, 'teclab', 'instituto tecnico superior teclab', 'universidad siglo 21', c.nivel, 'estudiar online']
      : [nombre, c.nombre, 'universidad siglo 21', 'villa lugano', c.nivel, 'estudiar a distancia', 'CABA'];
  return { titulo, descripcion, imagen, palabrasClave };
}
