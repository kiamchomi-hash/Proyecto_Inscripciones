import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
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

// Poppins es la fuente de marca de Teclab. Se carga sólo en sus páginas (no en
// el layout) y llega a la hoja de estilos como --font-poppins.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

// La vista previa al compartir el enlace por WhatsApp. Es la misma para todos
// los códigos y no nombra a la persona ni la carrera: la página no confirma
// qué códigos existen. Sin esto heredaba la del sitio, que es de Siglo 21.
const TITULO = 'Tu inscripción en Teclab';
const DESCRIPCION = 'Revisá tus datos y el precio de tu carrera, y confirmá tu inscripción. Al inscribirte todavía no pagás nada.';
const IMAGEN_OG = '/imagenes/og/default-teclab-inscripcion.jpg';

export const metadata: Metadata = {
  title: { absolute: TITULO },
  description: DESCRIPCION,
  robots: { index: false, follow: false },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'CAU Online',
    title: TITULO,
    description: DESCRIPCION,
    images: [{ url: IMAGEN_OG, width: 1200, height: 630, alt: 'Tu inscripción en Teclab' }],
  },
  twitter: { card: 'summary_large_image', title: TITULO, description: DESCRIPCION, images: [IMAGEN_OG] },
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
      .select('id, nombre, prefix, duracion')
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
        carrera: { nombre: carrera.data.nombre, url: carreraUrl, duracion: carrera.data.duracion },
        filaPrecio: precio.error ? null : (precio.data as FilaPrecio | null),
        ahora,
      }),
    };
  } catch (error) {
    console.error('[inscripcion] No se pudo resolver el enlace', error);
    return invalido();
  }
}

// Sólo en desarrollo: `/inscripcion/demo` muestra la página con datos falsos y
// «Inscribirme» pasa a «¡Listo!» sin enviar nada. En producción no existe.
const DEMO: PropsInscripcionEnlace = {
  codigo: 'demo',
  carrera: { nombre: 'Tecnicatura Superior en Programación', url: '/carreras/tecnicatura-superior-en-programacion', duracion: '2 años' },
  precio: {
    estado: 'vigente',
    precio: {
      conceptos: [
        { concepto: 'Matrícula', monto: '$ 64.228', descuento: 75 },
        { concepto: 'Bimestre 2B', monto: '$ 488.131', descuento: 24 },
      ],
      total: '$ 552.359',
      nota: null,
      vigenteHasta: '2026-10-31',
    },
  },
  datos: { nombre: 'Prueba Demo', dni: '99000099', email: 'prueba@example.test', carrera: 'Tecnicatura Superior en Programación' },
  completo: true,
};

export default async function Page({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  if (process.env.NODE_ENV !== 'production' && codigo === 'demo') {
    return (
      <main className={`inscripcion-enlace ${poppins.variable}`}>
        <InscripcionEnlace {...DEMO} demo />
      </main>
    );
  }
  const carga = await cargar(codigo);

  return (
    <main className={`inscripcion-enlace ${poppins.variable}`}>
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
