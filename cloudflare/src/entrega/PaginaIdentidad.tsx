import CareersCatalog from '@/components/index/careers-catalog';
import FormularioLead from '@/components/formularios/formulario-lead';
import type { CarreraCatalogo } from '@/components/index/types';
import { ContextoTurnstile, type ConfigTurnstile } from './turnstile-contexto';

/**
 * Portada de topykly: la Academia Identidad Argentina como sitio propio.
 *
 * No reusa la home del CAU porque el héroe, las estadísticas y los formularios
 * hablan de Universidad Siglo 21. El catálogo, en cambio, es el mismo: con sólo
 * las ocho fichas de la Academia, la sección queda como única oferta. Los
 * títulos y la bajada son etiquetas de la casa y de los datos, no copy nuevo.
 */
export default function PaginaIdentidad(
  { carreras, turnstile }: { carreras: CarreraCatalogo[]; turnstile: ConfigTurnstile },
) {
  return (
    <ContextoTurnstile.Provider value={turnstile}>
      <main className="flex-1">
        <header className="mx-auto w-full max-w-[2400px] px-4 pb-2 pt-12 text-center sm:px-8 sm:pt-16 xl:px-20">
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white min-[380px]:text-4xl sm:text-5xl">
            Academia Identidad Argentina
          </h1>
          <p className="mt-3 text-sm text-white/70 sm:text-base">Diplomaturas y cursos</p>
        </header>
        <CareersCatalog carreras={carreras} />
        {/* Los mismos dos formularios de la home del CAU, con la oferta acotada
            a la Academia: el contacto general y la preinscripción. */}
        <FormularioLead carreras={carreras} modo="contacto" origen="home" />
        <FormularioLead carreras={carreras} modo="preinscripcion" origen="home" />
      </main>
    </ContextoTurnstile.Provider>
  );
}
