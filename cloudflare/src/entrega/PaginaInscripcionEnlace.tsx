import { numeroWhatsAppDe } from '@/lib/whatsapp';
import { WhatsAppIcon } from '@/components/icons';
import InscripcionEnlace from '@/components/formularios/inscripcion-enlace';
import type { CargaEnlace } from '../datos/inscripcion-enlace';
import { ContextoTurnstile, type ConfigTurnstile } from './turnstile-contexto';

export default function PaginaInscripcionEnlace({ carga, turnstile, demo = false }: { carga: CargaEnlace; turnstile: ConfigTurnstile; demo?: boolean }) {
  return <ContextoTurnstile.Provider value={turnstile}>
    <main className="inscripcion-enlace fuente-poppins">
      {carga.estado === 'valido' ? <InscripcionEnlace {...carga.props} demo={demo} /> :
        <section className="ie-tarjeta ie-aviso">
          <h1 className="ie-titulo">Este enlace ya no está disponible</h1>
          <p className="ie-texto">Escribinos y te ayudamos a completar tu inscripción.</p>
          <a href={`https://wa.me/${numeroWhatsAppDe('teclab')}?text=${encodeURIComponent('Hola, quiero completar mi inscripción en Teclab')}`}
            target="_blank" rel="noopener nofollow" className="ie-whatsapp">
            <WhatsAppIcon className="h-4 w-4" />Escribinos por WhatsApp
          </a>
          <a href={carga.carreraUrl ?? '/teclab'} className="ie-secundario">
            {carga.carreraUrl ? 'Ver la carrera' : 'Ver las carreras de Teclab'}
          </a>
        </section>}
    </main>
  </ContextoTurnstile.Provider>;
}
