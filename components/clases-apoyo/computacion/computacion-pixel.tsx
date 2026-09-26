import Image from 'next/image';
import Carousel from '@/components/clases-apoyo/carrusel-materia';
import WhatsappClase from '@/components/clases-apoyo/whatsapp-clase';
import ReservaClase from '@/components/clases-apoyo/reserva/reserva-clase';
import TextoMateria from '@/components/clases-apoyo/texto-materia';
import type { MateriaDB } from '@/components/clases-apoyo/tipos';
import BarraVentana from './barra-ventana';
import { fuentePixel } from './fuente';
import Herramientas from './herramientas';

/* Computación: fotos, reserva y WhatsApp de la fila de `materias`, vestidos con
   el lenguaje del folleto pixel aprobado
   (contenidos/cau/aprobados/2026-09-22-folleto-computacion-pixel/): ventanas
   de sistema con barra y botones, bordes de píxel con las esquinas vacías,
   sombras de bloque y la paleta del folleto. La reserva es la misma de todas
   las materias; acá se arma con la foto y el calendario arriba y los horarios
   debajo. Estilos en app/clases-apoyo/computacion.css (variables --cp-*). */

type MateriaComputacion = Pick<
  MateriaDB,
  'id' | 'slug' | 'label' | 'nombre_profesor' | 'whatsapp' | 'telefono_display' | 'imagenes' | 'en_construccion' | 'modo_manana' | 'dias_bloqueados' | 'horarios_bloqueados'
>;

export default function ComputacionPixel({ materia }: { materia: MateriaComputacion }) {
  const conFotos = (materia.imagenes?.length ?? 0) > 0;

  return (
    <div className={`cp ${fuentePixel.variable}`}>
      {/* El h1 de todas las materias, completo y a la vista. Sólo el nombre
          de la materia va en letra pixel: una palabra, no una frase. */}
      <h1 className="cp-h1">
        <Image src="/imagenes/clases-apoyo/computacion/computadora.svg" alt="" width={27} height={25} unoptimized className="cp-h1-icono" />
        <span>
          Clases particulares de <strong>{materia.label}</strong> en Villa Lugano
        </span>
      </h1>

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

      <Herramientas />

      <div className="cp-contacto">
        <span className="cp-contacto-rotulo">Consultas por WhatsApp</span>
        <WhatsappClase
          slug={materia.slug}
          whatsapp={materia.whatsapp}
          telefono={materia.telefono_display}
          profesor={materia.nombre_profesor}
          enConstruccion={materia.en_construccion}
          className="cp-whatsapp"
        />
      </div>
    </div>
  );
}

/* "Sobre las clases de Computación" con el mismo diseño: el texto de la base
   dentro de una ventana pixel. Va aparte porque en la página se ubica más
   abajo, después de "Otras materias", igual que en las demás. */
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
