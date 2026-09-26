import type { CSSProperties } from 'react';
import Image from 'next/image';
import WhatsappClase from '@/components/clases-apoyo/whatsapp-clase';
import type { MateriaDB } from '@/components/clases-apoyo/tipos';
import { fuentePixel } from './fuente';

/* Computación con el diseño del folleto pixel aprobado
   (contenidos/cau/aprobados/2026-09-22-folleto-computacion-pixel/). Los
   íconos son los SVG del folleto copiados por su marcador, no redibujados:
   viven en public/imagenes/clases-apoyo/computacion/. Estilos en
   app/clases-apoyo/computacion.css, con la paleta en variables --cp-*. */

const ICONOS = '/imagenes/clases-apoyo/computacion';

// Íconos decorativos: el texto de al lado ya dice lo mismo, así que van con
// alt vacío para que el lector de pantalla no lo repita.
function Pixel({ nombre, ancho, alto, className }: { nombre: string; ancho: number; alto: number; className?: string }) {
  return (
    <Image
      src={`${ICONOS}/${nombre}.svg`}
      alt=""
      width={ancho}
      height={alto}
      unoptimized
      className={className}
    />
  );
}

// Mismo orden que el folleto.
const DATOS = [
  { icono: 'dato-modalidad', ancho: 13, alto: 12, rotulo: 'Modalidad', valor: 'Presencial', color: '#2f7fc1' },
  { icono: 'dato-dias', ancho: 13, alto: 12, rotulo: 'Días', valor: 'De lunes a viernes', color: '#058c70' },
  { icono: 'dato-direccion', ancho: 11, alto: 11, rotulo: 'Ubicación', valor: 'Guaminí 4876, Villa Lugano', color: '#e0453b' },
];

const TEMAS = [
  { icono: 'tema-2', alto: 12, texto: 'Manejo de PC', color: '#49ca85' },
  { icono: 'tema-5', alto: 12, texto: 'Nivel inicial', color: '#35b671' },
  { icono: 'tema-1', alto: 17, texto: 'Word, Excel y PowerPoint', color: '#2c965d' },
  { icono: 'tema-3', alto: 12, texto: 'Internet, correo y trámites', color: '#22774a' },
  { icono: 'tema-4', alto: 12, texto: 'Trabajos prácticos y apoyo escolar', color: '#1a5b38' },
];

const PASOS = ['Elegí el día', 'Elegí el horario', 'Elegí el tema'];

type MateriaComputacion = Pick<MateriaDB, 'slug' | 'label' | 'nombre_profesor' | 'whatsapp' | 'telefono_display' | 'en_construccion'>;

export default function ComputacionPixel({ materia }: { materia: MateriaComputacion }) {
  return (
    <div className={`cp ${fuentePixel.variable}`}>
      {/* El h1 de todas las materias, completo para buscadores y lectores de
          pantalla; a la vista va el encabezado pixel del folleto. */}
      <header className="cp-encabezado">
        <h1 className="sr-only">Clases particulares de {materia.label} en Villa Lugano</h1>
        <div className="cp-titulo" aria-hidden="true">
          <div className="cp-titulo-antes">
            <Pixel nombre="logo" ancho={28} alto={28} className="cp-titulo-logo" />
            <span>Clases de</span>
            <Pixel nombre="computadora" ancho={27} alto={25} className="cp-titulo-compu" />
          </div>
          <div className="cp-titulo-palabra">
            {/* La M de Silkscreen se lee como H: la letra queda transparente y
                encima va la M dibujada del folleto, en la misma grilla. */}
            Co<span className="cp-m">m<Pixel nombre="letra-m" ancho={137} alto={102} className="cp-m-dibujo" /></span>putación
          </div>
        </div>
      </header>

      <div className="cp-portada">
        <div className="cp-ventana">
          <div className="cp-ventana-barra">
            <Pixel nombre="barra-icono" ancho={9} alto={8} className="cp-barra-icono" />
            <span className="cp-ventana-titulo">Mis proyectos</span>
            <span className="cp-barra-botones">
              <Pixel nombre="barra-minimizar" ancho={6} alto={5} />
              <Pixel nombre="barra-maximizar" ancho={6} alto={6} />
              <Pixel nombre="barra-cerrar" ancho={6} alto={6} />
            </span>
          </div>
          <div className="cp-ventana-cuerpo">
            <Pixel nombre="ilustracion" ancho={790} alto={550} className="cp-ilustracion" />
          </div>
        </div>

        <ul className="cp-datos">
          {DATOS.map(d => (
            <li key={d.rotulo} className="cp-dato" style={{ '--cp-franja': d.color } as CSSProperties}>
              <Pixel nombre={d.icono} ancho={d.ancho} alto={d.alto} className="cp-dato-icono" />
              <span className="cp-dato-texto">
                <span className="cp-rotulo">{d.rotulo}</span>
                <span className="cp-dato-valor">{d.valor}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <section className="cp-temas-seccion" aria-labelledby="cp-temas-titulo">
        <div className="cp-seccion-encabezado">
          <h2 id="cp-temas-titulo" className="cp-seccion-titulo">Aprendé a usar la PC y a trabajar con ella</h2>
          <span className="cp-regla" aria-hidden="true" />
        </div>
        <ul className="cp-temas">
          {TEMAS.map(t => (
            <li key={t.icono} className="cp-tema" style={{ '--cp-tema': t.color } as CSSProperties}>
              <span className="cp-tema-icono">
                <Pixel nombre={t.icono} ancho={17} alto={t.alto} />
              </span>
              <span className="cp-tema-nombre">{t.texto}</span>
            </li>
          ))}
        </ul>
      </section>

      <nav aria-label="Cómo reservar">
        <ol className="cp-pasos">
          {PASOS.map((paso, i) => (
            <li key={paso}>
              <a href="#reservar" className="cp-paso">
                <span className="cp-paso-cifra">{String(i + 1).padStart(2, '0')}</span>
                <span className="cp-paso-texto">{paso}</span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="cp-contacto">
        <span className="cp-rotulo cp-contacto-rotulo">WhatsApp</span>
        {/* Número y nombre desde la fila de la materia, como en las demás. */}
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
