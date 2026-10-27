import type { Carrera, CarreraOpcion, CarreraEnlace } from '@/components/index/types';
import { carreraFullName, carreraToSlug, getAreaForCarrera } from '@/components/index/types';
import { esCursoTeclab, esTeclab } from '@/components/index/teclab';
import CareerDetail from '@/components/carreras/career-detail';
import type { Equivalente } from '@/components/carreras/carrera-equivalente';
import DeferredEnrollmentForm from '@/components/carreras/deferred-enrollment-form';
import DirectCareerOpenTracker from '@/components/carreras/direct-career-open-tracker';
import SiteFooter from '@/components/footer';
import { jsonLdScript } from '@/lib/json-ld';
import { POSTAL_ADDRESS } from '@/lib/sede';
import { duracionISO } from '@/lib/duracion-iso';
import { ContextoTurnstile, type ConfigTurnstile } from './turnstile-contexto';

/** Mismo reparto determinista de seis hermanas y dos cruzadas que la ficha Next. */
export function relacionadasCarrera(carrera: Carrera, carreras: Carrera[]) {
  const mismaCasa = (c: Carrera) => carrera.nivel === 'Identidad Argentina'
    ? c.nivel === 'Identidad Argentina' : c.nivel !== 'Identidad Argentina';
  const hermanas = esCursoTeclab(carrera) ? carreras.filter(esTeclab)
    : carreras.filter(c => c.nivel === carrera.nivel && c.id !== carrera.id && mismaCasa(c));
  const area = getAreaForCarrera(carrera);
  const rotar = (lista: Carrera[], paso: number, cuantas: number) => lista.length
    ? Array.from({ length: Math.min(cuantas, lista.length) }, (_, i) => lista[((carrera.id * paso) % lista.length + i) % lista.length]) : [];
  const porArea = rotar(area ? hermanas.filter(c => getAreaForCarrera(c) === area) : [], 3, 3);
  const porNivel = rotar(hermanas, 6, hermanas.length).filter(c => !porArea.some(a => a.id === c.id));
  const mismoNivel = [...porArea, ...porNivel].slice(0, 6);
  const otros = carreras.filter(c => c.nivel !== carrera.nivel && mismaCasa(c));
  const cruzadaArea = area ? rotar(otros.filter(c => getAreaForCarrera(c) === area), 2, 1) : [];
  const turno = rotar(otros, 1, 2).filter(c => !cruzadaArea.some(a => a.id === c.id));
  const cruzadas = [...cruzadaArea, ...turno].slice(0, 2).filter((c, i, arr) => c && arr.findIndex(o => o.id === c.id) === i);
  return [...mismoNivel, ...cruzadas].filter((c, i, arr) => arr.findIndex(o => o.id === c.id) === i)
    .map(c => ({ id: c.id, nombre: c.nombre, prefix: c.prefix }));
}

export default function PaginaCarrera({ carrera, relacionadas, equivalente, opciones, turnstile }: {
  carrera: Carrera; relacionadas: CarreraEnlace[]; equivalente: Equivalente | null;
  opciones: CarreraOpcion[]; turnstile: ConfigTurnstile;
}) {
  const ia = carrera.nivel === 'Identidad Argentina';
  const curso = esCursoTeclab(carrera);
  const teclab = curso || esTeclab(carrera);
  const url = `https://www.siglo21sur.com/carreras/${carreraToSlug(carrera)}`;
  const provider = ia ? { '@type': 'Organization', name: 'Academia Identidad Argentina', url: 'https://identidadargentina.com.ar' }
    : teclab ? { '@type': 'EducationalOrganization', name: 'Teclab Instituto Técnico Superior', url: 'https://teclab.edu.ar' }
    : { '@type': 'CollegeOrUniversity', name: 'Universidad Siglo 21', url: 'https://21.edu.ar' };
  const duracion = duracionISO(carrera.duracion);
  const course = {
    '@context': 'https://schema.org', '@type': 'Course', name: carreraFullName(carrera), url,
    description: carrera.descripcion || (ia ? `Estudia ${carrera.nombre} con la Academia Identidad Argentina. ${carrera.enfoque}.`
      : curso ? `Curso de ${carrera.nombre} dictado por Teclab. Consultá modalidad e inscripción.`
      : teclab && carrera.proximamente ? `${carrera.nombre}, carrera anunciada por Teclab Instituto Técnico Superior.`
      : teclab ? `${carrera.nombre}, carrera de Teclab Instituto Técnico Superior. Título oficial y cursado online.`
      : `Estudiá ${carrera.nombre} a distancia en Universidad Siglo 21. ${carrera.enfoque}.`),
    provider, educationalLevel: curso ? 'Curso' : carrera.nivel,
    ...(duracion ? { timeToComplete: duracion } : {}),
    ...(carrera.titulo && carrera.titulo !== 'Consultar' ? { educationalCredentialAwarded: carrera.titulo } : {}),
    inLanguage: 'es', ...(teclab ? { courseMode: 'online' } : { courseMode: 'blended', location: { '@type': 'Place', name: 'CAU Villa Lugano', address: POSTAL_ADDRESS } }),
  };
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.siglo21sur.com' },
    { '@type': 'ListItem', position: 2, name: carreraFullName(carrera), item: url },
  ] };
  return <ContextoTurnstile.Provider value={turnstile}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(course) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumb) }} />
    <main className={teclab ? 'flex-1 ficha-teclab fuente-poppins' : ia ? 'flex-1' : 'flex-1 fuente-dm-sans'}>
      <DirectCareerOpenTracker carrera={carreraFullName(carrera)} />
      <CareerDetail carrera={carrera} relacionadas={relacionadas} equivalente={equivalente} />
      <DeferredEnrollmentForm carreras={opciones} carreraInicial={carrera.id} />
    </main>
    <SiteFooter casa={teclab ? 'teclab' : 'cau'} fuente={teclab ? 'fuente-poppins' : ''} />
  </ContextoTurnstile.Provider>;
}
