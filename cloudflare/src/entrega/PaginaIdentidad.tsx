import CareersCatalog from '@/components/index/careers-catalog';
import FormularioLead from '@/components/formularios/formulario-lead';
import IsotipoIA from '@/components/index/ia-isotipo';
import type { CarreraCatalogo } from '@/components/index/types';
import { ContextoTurnstile, type ConfigTurnstile } from './turnstile-contexto';

/**
 * Portada de topykly: la Academia Identidad Argentina como sitio propio.
 *
 * No reusa la home del CAU porque el héroe, las estadísticas y los formularios
 * hablan de Universidad Siglo 21. El catálogo, en cambio, es el mismo: con sólo
 * las fichas de la Academia, la sección queda como única oferta. Los títulos y
 * la bajada son etiquetas de la casa y de los datos, no copy nuevo.
 */
export default function PaginaIdentidad(
  { carreras, turnstile }: { carreras: CarreraCatalogo[]; turnstile: ConfigTurnstile },
) {
  return (
    <ContextoTurnstile.Provider value={turnstile}>
      <main className="flex-1">
        <header className="identidad-hero">
          {/* Grilla y halos: mecánica de
              ~/Documentos/uiverse/biblioteca/mias/fondo-cuadricula-luminosa-xai-oscuro
              y del halo anclado fuera del bloque de
              ~/.../hero-isometrico-halo-violeta-evervault, recoloreados a la
              paleta de la Academia. */}
          <div className="identidad-hero__grid" aria-hidden="true" />
          <div className="identidad-hero__contenido">
            <IsotipoIA className="identidad-hero__isotipo" />
            <h1 className="identidad-hero__titulo">Academia Identidad Argentina</h1>
            <p className="identidad-hero__bajada">Diplomaturas y cursos</p>
            <span className="identidad-hero__regla" aria-hidden="true" />
          </div>
        </header>
        <CareersCatalog carreras={carreras} />
        {/* Los mismos dos formularios de la home del CAU, con la oferta acotada
            a la Academia: el contacto general y la preinscripción. */}
        <FormularioLead carreras={carreras} modo="contacto" origen="home" casa="identidad" />
        <FormularioLead carreras={carreras} modo="preinscripcion" origen="home" casa="identidad" />
      </main>
    </ContextoTurnstile.Provider>
  );
}
