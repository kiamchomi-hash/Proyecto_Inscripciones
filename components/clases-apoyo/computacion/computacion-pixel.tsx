import Image from 'next/image';
import Carousel from '@/components/clases-apoyo/carrusel-materia';
import WhatsappClase from '@/components/clases-apoyo/whatsapp-clase';
import ReservaClase from '@/components/clases-apoyo/reserva/reserva-clase';
import { VolverAClases } from '@/components/clases-apoyo/navegacion-materia';
import TextoMateria from '@/components/clases-apoyo/texto-materia';
import type { MateriaDB } from '@/components/clases-apoyo/tipos';
import BarraVentana from './barra-ventana';
import { fuentePixel } from './fuente';
import Herramientas, { Programacion } from './herramientas';

/* Computación: fotos, reserva y WhatsApp de la fila de `materias`, vestidos con
   el lenguaje del folleto pixel aprobado
   (contenidos/cau/aprobados/generales/impresion/2026-09-22-folleto-computacion-pixel/): ventanas
   de sistema con barra y botones, bordes de píxel con las esquinas vacías,
   sombras de bloque y la paleta del folleto. La reserva es la misma de todas
   las materias; acá se arma con la foto y el calendario arriba y los horarios
   debajo. Estilos en app/clases-apoyo/computacion.css (variables --cp-*). */

/* La M de Silkscreen tiene el pico tan corto que se lee como H. Se reemplaza
   por la M del folleto: la misma grilla de 7 × 5 celdas que dibujó para su
   título, con el pico bajando hasta el medio. Va en currentColor, así toma el
   color y la sombra del texto que la rodea. */
const CELDAS_M = [
  [0, 1, 5, 6],
  [0, 1, 2, 4, 5, 6],
  [0, 1, 2, 3, 4, 5, 6],
  [0, 1, 3, 5, 6],
  [0, 1, 5, 6],
];

function LetraM() {
  return (
    <svg className="cp-m" viewBox="0 0 7 5" shapeRendering="crispEdges" aria-hidden="true">
      {CELDAS_M.flatMap((fila, y) => fila.map(x => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />))}
    </svg>
  );
}

// El nombre en letra pixel con la M del folleto. La M de verdad sigue en el
// texto, oculta a la vista en su lugar: buscadores y lectores de pantalla leen
// "Computación" entero, y a la vista queda la M dibujada.
function NombrePixel({ texto }: { texto: string }) {
  return texto.split(/([mM])/).map((parte, i) =>
    /^[mM]$/.test(parte)
      ? <span key={i}><span className="sr-only">{parte}</span><LetraM /></span>
      : parte
  );
}

type MateriaComputacion = Pick<
  MateriaDB,
  'id' | 'slug' | 'label' | 'nombre_profesor' | 'whatsapp' | 'telefono_display' | 'imagenes' | 'en_construccion' | 'modo_manana' | 'dias_bloqueados' | 'horarios_bloqueados'
>;

export default function ComputacionPixel({ materia, parrafos }: { materia: MateriaComputacion; parrafos: string[] | null }) {
  const conFotos = (materia.imagenes?.length ?? 0) > 0;

  return (
    <div className={`cp ${fuentePixel.variable}`}>
      {/* El nombre de la materia conserva la letra pixel del folleto. */}
      <header className="cp-encabezado">
        <VolverAClases compacto />
        <h1 className="cp-h1">
          <Image src="/imagenes/clases-apoyo/computacion/computadora.svg" alt="" width={27} height={25} unoptimized className="cp-h1-icono" />
          <strong><NombrePixel texto={materia.label} /></strong>
        </h1>
      </header>

      <div className="cp-contacto">
        <span className="cp-contacto-rotulo">Consultar por WhatsApp</span>
        <WhatsappClase
          slug={materia.slug}
          whatsapp={materia.whatsapp}
          telefono={materia.telefono_display}
          profesor={materia.nombre_profesor}
          enConstruccion={materia.en_construccion}
          className="cp-whatsapp"
        />
      </div>

      <Herramientas />
      <Programacion />

      {/* Al cliente viaja sólo lo que la reserva usa, no la ficha entera. */}
      <ReservaClase
        materia={{
          id: materia.id,
          slug: materia.slug,
          modo_manana: materia.modo_manana,
          dias_bloqueados: materia.dias_bloqueados,
          horarios_bloqueados: materia.horarios_bloqueados,
        }}
        clase="cp-reserva"
        foto={conFotos ? (
          <section className="cp-ventana" aria-label="Fotos de las clases">
            <BarraVentana titulo="Fotos de clase" />
            <div className="cp-pantalla">
              <Carousel images={materia.imagenes} />
            </div>
          </section>
        ) : undefined}
        encabezadoCalendario={<BarraVentana titulo="Elegí el día" />}
        encabezadoHorarios={<BarraVentana titulo="Elegí el horario" />}
      />

      <ComputacionTexto label={materia.label} parrafos={parrafos} />
    </div>
  );
}

/* El texto existente de la base sigue a la reserva completa de día y horario. */
export function ComputacionTexto({ label, parrafos }: { label: string; parrafos: string[] | null }) {
  if (!parrafos?.length) return null;
  return (
    <div className={`cp cp-texto ${fuentePixel.variable}`}>
      <div className="cp-ventana">
        <BarraVentana titulo="Sobre las clases" />
        <TextoMateria label={label} parrafos={parrafos} />
      </div>
    </div>
  );
}
