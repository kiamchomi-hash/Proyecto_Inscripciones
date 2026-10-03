import type { Metadata } from 'next';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { numeroWhatsAppDe } from '@/lib/whatsapp';
import { carreraToSlug } from '@/components/index/types';
import { WhatsAppIcon } from '@/components/icons';
import InscripcionEnlace from '@/components/formularios/inscripcion-enlace';
import {
  CASAS, TABLA_ENLACES, TABLA_PRECIOS,
  consultaConEnlace, esCodigoEnlace, estadoEnlace, propsInscripcionEnlace,
  type FilaEnlace, type FilaPrecio, type PropsInscripcionEnlace,
} from '@/components/formularios/casas';
// Las animaciones de la confirmación (`PasoListo`) viven con el formulario.
import '@/components/formularios/formulario-lead.css';
import './inscripcion-enlace.css';

// El enlace personal que trae el aviso de Telegram de cada preinscripción de
// Teclab (ver `docs/formularios-por-casa.md`). Lee con la service role una
// fila con datos personales: nada de esto se cachea ni se indexa, y al
// navegador llega sólo el resumen oculto que arma `propsInscripcionEnlace`.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: 'Tu inscripción en Teclab' },
  robots: { index: false, follow: false },
};

const WA_TECLAB = (mensaje: string) =>
  `https://wa.me/${numeroWhatsAppDe('teclab')}?text=${encodeURIComponent(mensaje)}`;

type Carga =
  | { estado: 'invalido'; carreraUrl: string | null }
  | { estado: 'valido'; props: PropsInscripcionEnlace };

/**
 * Resuelve el enlace. Cualquier cosa que no sea un enlace vigente de una
 * preinscripción de Teclab con su carrera termina en el mismo mensaje: no se
 * distingue «no existe» de «venció» para no confirmar códigos a quien prueba.
 */
async function cargar(codigo: string): Promise<Carga> {
  const invalido = (carreraUrl: string | null = null): Carga => ({ estado: 'invalido', carreraUrl });
  if (!esCodigoEnlace(codigo)) return invalido();

  try {
    const supabase = createSupabaseAdmin();
    const enlace = await supabase
      .from(TABLA_ENLACES)
      .select('codigo, consulta_id, vence_at, usado_at')
      .eq('codigo', codigo)
      .maybeSingle();
    if (enlace.error || !enlace.data) return invalido();
    const fila = enlace.data as FilaEnlace;

    const consulta = await supabase.from('consultas').select('*').eq('id', fila.consulta_id).maybeSingle();
    if (consulta.error || !consulta.data || !consultaConEnlace(consulta.data) || !consulta.data.carrera) {
      return invalido();
    }

    const carrera = await supabase
      .from('carreras')
      .select('id, nombre, prefix')
      .eq('nombre', consulta.data.carrera)
      .in('nivel', CASAS.teclab.niveles)
      .limit(1)
      .maybeSingle();
    if (carrera.error || !carrera.data) return invalido();
    const carreraUrl = `/carreras/${carreraToSlug(carrera.data)}`;

    const ahora = new Date();
    if (estadoEnlace(fila, ahora) !== 'valido') return invalido(carreraUrl);

    const precio = await supabase
      .from(TABLA_PRECIOS)
      .select('conceptos, total, nota, vigente_hasta')
      .eq('carrera_id', carrera.data.id)
      .maybeSingle();
    if (precio.error) console.error('[inscripcion] No se pudo leer el precio', { code: precio.error.code });

    return {
      estado: 'valido',
      props: propsInscripcionEnlace({
        codigo,
        consulta: consulta.data,
        carrera: { nombre: carrera.data.nombre, url: carreraUrl },
        filaPrecio: precio.error ? null : (precio.data as FilaPrecio | null),
        ahora,
      }),
    };
  } catch (error) {
    console.error('[inscripcion] No se pudo resolver el enlace', error);
    return invalido();
  }
}

export default async function Page({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const carga = await cargar(codigo);

  return (
    <main className="inscripcion-enlace">
      {carga.estado === 'valido' ? (
        <InscripcionEnlace {...carga.props} />
      ) : (
        <section className="ie-tarjeta ie-aviso">
          <h1 className="ie-titulo">Este enlace ya no está disponible</h1>
          <p className="ie-texto">Escribinos y te ayudamos a completar tu inscripción.</p>
          <a
            href={WA_TECLAB('Hola, quiero completar mi inscripción en Teclab')}
            target="_blank"
            rel="noopener nofollow"
            className="ie-whatsapp"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Escribinos por WhatsApp
          </a>
          <a href={carga.carreraUrl ?? '/teclab'} className="ie-secundario">
            {carga.carreraUrl ? 'Ver la carrera' : 'Ver las carreras de Teclab'}
          </a>
        </section>
      )}
    </main>
  );
}
