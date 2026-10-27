import ReservaClase from '@/components/clases-apoyo/reserva/reserva-clase';
import MateriaGenerica from '@/components/clases-apoyo/materia-generica';
import ComputacionPixel from '@/components/clases-apoyo/computacion/computacion-pixel';
import { OtrasMaterias, VolverAClases } from '@/components/clases-apoyo/navegacion-materia';
import TextoMateria from '@/components/clases-apoyo/texto-materia';
import type { MateriaFicha } from '@/lib/datos/materia';
import type { MateriaOtra } from '@/components/clases-apoyo/navegacion-materia';
import { ContextoTurnstile, type ConfigTurnstile } from './turnstile-contexto';

// Mismo despacho y reserva que la página Next. Sólo recibe la ficha pública.
export default function PaginaMateria({ ficha, otras, turnstile }: { ficha: MateriaFicha; otras: MateriaOtra[]; turnstile: ConfigTurnstile }) {
  const esComputacion = ficha.slug === 'computacion' && !ficha.en_construccion;
  return <ContextoTurnstile.Provider value={turnstile}>
    <div className="ca-materia-pagina">
      {!esComputacion && <VolverAClases />}
      {esComputacion ? <ComputacionPixel materia={ficha} parrafos={ficha.texto_seo} /> : <MateriaGenerica materia={ficha} />}
      {!ficha.en_construccion && !esComputacion && <ReservaClase materia={{ id: ficha.id, slug: ficha.slug, modo_manana: ficha.modo_manana, dias_bloqueados: ficha.dias_bloqueados, horarios_bloqueados: ficha.horarios_bloqueados }} />}
      <OtrasMaterias materias={otras} actual={ficha.slug} />
    </div>
    {!esComputacion && <TextoMateria label={ficha.label} parrafos={ficha.texto_seo} />}
  </ContextoTurnstile.Provider>;
}
