import Hero from '@/components/index/hero';
import StatsCounter from '@/components/index/stats-counter';
import CareersCatalog from '@/components/index/careers-catalog';
import FormularioLead from '@/components/formularios/formulario-lead';
import type { CarreraCatalogo } from '@/components/index/types';
import { ContextoTurnstile, type ConfigTurnstile } from './turnstile-contexto';

/**
 * Cuerpo de la home vigente (`app/page.tsx`), sin rediseño ni secciones nuevas.
 * Se monta como una única isla porque el catálogo, los dos formularios y el
 * carrusel del hero son interactivos; separarlos obligaría a repetir el payload
 * del catálogo en cada isla.
 *
 * `turnstile` llega del servidor para que el HTML renderizado ya sepa si hay
 * site key (marcador y hueco de 71 px) o si no hay nada (fallo cerrado). Los
 * componentes del formulario no cambian: el widget lo lee del contexto.
 */
export default function PaginaHome(
  { carreras, turnstile }: { carreras: CarreraCatalogo[]; turnstile: ConfigTurnstile },
) {
  return (
    <ContextoTurnstile.Provider value={turnstile}>
      <main className="flex-1">
        <h1 className="sr-only">Universidad Siglo 21 online: carreras e inscripciones</h1>
        <Hero />
        <CareersCatalog carreras={carreras} teclabLandingHref="/teclab" />
        {/* Dos formularios y no uno: el contacto es la puerta general y ofrece
            toda la oferta; la preinscripción arma el legajo y sus campos los
            define la casa de la carrera que el lead elija. */}
        <FormularioLead carreras={carreras} modo="contacto" origen="home" />
        <FormularioLead carreras={carreras} modo="preinscripcion" origen="home" />
        <StatsCounter />
      </main>
    </ContextoTurnstile.Provider>
  );
}
