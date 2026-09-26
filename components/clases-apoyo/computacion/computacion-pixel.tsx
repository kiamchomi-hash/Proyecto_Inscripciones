import Image from 'next/image';
import { sanitizeContent } from '@/lib/sanitize-content';
import Carousel from '@/components/clases-apoyo/carrusel-materia';
import WhatsappClase from '@/components/clases-apoyo/whatsapp-clase';
import type { MateriaDB } from '@/components/clases-apoyo/tipos';
import { fuentePixel } from './fuente';

/* Computación: el mismo contenido que las demás materias (fotos, descripción
   y WhatsApp, todo desde la fila de `materias`), vestido con el lenguaje del
   folleto pixel aprobado
   (contenidos/cau/aprobados/2026-09-22-folleto-computacion-pixel/): ventanas
   de sistema con barra y botones, bordes de píxel con las esquinas vacías,
   sombras de bloque y la paleta del folleto. Los íconos de la barra son los
   SVG del folleto copiados por su marcador, no redibujados. Estilos en
   app/clases-apoyo/computacion.css, con la paleta en variables --cp-*. */

const ICONOS = '/imagenes/clases-apoyo/computacion';

function Pixel({ nombre, ancho, alto, className }: { nombre: string; ancho: number; alto: number; className?: string }) {
  return (
    <Image src={`${ICONOS}/${nombre}.svg`} alt="" width={ancho} height={alto} unoptimized className={className} />
  );
}

// La barra de ventana del folleto. Es decorativa: los botones no hacen nada,
// así que van ocultos para el lector de pantalla junto con el ícono.
function BarraVentana({ titulo }: { titulo: string }) {
  return (
    <div className="cp-barra">
      <Pixel nombre="barra-icono" ancho={9} alto={8} className="cp-barra-icono" />
      <span className="cp-barra-titulo">{titulo}</span>
      <span className="cp-barra-botones" aria-hidden="true">
        <Pixel nombre="barra-minimizar" ancho={6} alto={5} />
        <Pixel nombre="barra-maximizar" ancho={6} alto={6} />
        <Pixel nombre="barra-cerrar" ancho={6} alto={6} />
      </span>
    </div>
  );
}

type MateriaComputacion = Pick<MateriaDB, 'slug' | 'label' | 'nombre_profesor' | 'whatsapp' | 'telefono_display' | 'descripcion' | 'imagenes' | 'en_construccion'>;

export default function ComputacionPixel({ materia }: { materia: MateriaComputacion }) {
  const conFotos = (materia.imagenes?.length ?? 0) > 0;

  return (
    <div className={`cp ${fuentePixel.variable}`}>
      {/* El h1 de todas las materias, completo y a la vista. Sólo el nombre
          de la materia va en letra pixel: una palabra, no una frase. */}
      <h1 className="cp-h1">
        <Pixel nombre="computadora" ancho={27} alto={25} className="cp-h1-icono" />
        <span>
          Clases particulares de <strong>{materia.label}</strong> en Villa Lugano
        </span>
      </h1>

      <div className={`cp-cuerpo${conFotos ? '' : ' cp-cuerpo-solo'}`}>
        {conFotos && (
          <section className="cp-ventana" aria-label="Fotos de las clases">
            <BarraVentana titulo="Fotos de clase" />
            <div className="cp-pantalla">
              <Carousel images={materia.imagenes} />
            </div>
          </section>
        )}

        <section className="cp-ventana" aria-label="Qué se ve en las clases">
          <BarraVentana titulo="Qué vas a ver" />
          <ul className="cp-lista">
            {(materia.descripcion ?? []).map((item, i) => (
              <li key={i} className="cp-item" dangerouslySetInnerHTML={{ __html: sanitizeContent(item) }} />
            ))}
          </ul>
          <a href="#reservar" className="cp-reservar">Elegir día y horario</a>
        </section>
      </div>

      <WhatsappClase
        slug={materia.slug}
        whatsapp={materia.whatsapp}
        telefono={materia.telefono_display}
        profesor={materia.nombre_profesor}
        enConstruccion={materia.en_construccion}
        className="cp-whatsapp"
      />
    </div>
  );
}
