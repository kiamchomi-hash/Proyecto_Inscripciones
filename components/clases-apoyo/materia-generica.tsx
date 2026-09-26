import { sanitizeContent } from '@/lib/sanitize-content';
import Carousel from '@/components/clases-apoyo/carrusel-materia';
import WhatsappClase from '@/components/clases-apoyo/whatsapp-clase';
import type { MateriaDB } from '@/components/clases-apoyo/tipos';

/* Contenido de una materia sin diseño propio: fotos y descripción (o el cartel
   de construcción) y el WhatsApp de la materia. Computación tiene el suyo en
   computacion/computacion-pixel.tsx; otras pueden sumarse igual. */

/* ── Construction Banner ── */
export function ConstructionBanner() {
  return (
    <div className="ca-construction flex flex-col items-center justify-center h-full p-5 text-center" style={{ background: 'rgba(0,0,0,0.1)' }}>
      <svg className="ca-construction-icon mb-4" width="80" height="80" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2L1 21h22L12 2zm0 3.45L20.14 19H3.86L12 5.45zM11 16h2v2h-2v-2zm0-7h2v5h-2V9z" />
      </svg>
      <div className="text-2xl font-extrabold uppercase tracking-widest mb-2">Sección en Construcción</div>
      <div className="text-sm mt-2" style={{ color: 'var(--ca-text-muted)' }}>
        Estamos trabajando intensamente en esta sección para brindarte el mejor contenido.<br />¡Vuelve pronto!
      </div>
    </div>
  );
}

/* ── Description Panel ── */
function DescriptionPanel({ desc }: { desc: string[] }) {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--ca-bg-temas)' }}>
      <div className="flex-1 flex flex-col justify-center rounded-xl m-[1.5vh_20px] p-[1vh_25px]" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,199,177,0.1)' }}>
        <ul className="list-none flex flex-col h-full justify-evenly">
          {desc.map((item, i) => (
            <li key={i} className="ca-desc-item" dangerouslySetInnerHTML={{ __html: sanitizeContent(item) }} />
          ))}
        </ul>
      </div>
    </div>
  );
}

type MateriaFicha = Pick<MateriaDB, 'slug' | 'label' | 'nombre_profesor' | 'whatsapp' | 'telefono_display' | 'descripcion' | 'imagenes' | 'en_construccion'>;

export default function MateriaGenerica({ materia }: { materia: MateriaFicha }) {
  const conFotos = (materia.imagenes?.length ?? 0) > 0;

  return (
    <div className="ca-ficha">
      {/* El h1 completo y a la vista: quien entra desde Google lee acá mismo
          que las clases son en Villa Lugano. */}
      <h1 className="ca-ficha-h1">
        Clases particulares de <strong>{materia.label}</strong> en Villa Lugano
      </h1>

      {materia.en_construccion ? (
        <div className="ca-ficha-construccion">
          <ConstructionBanner />
        </div>
      ) : (
        // Sin fotos cargadas, el carrusel dejaba medio bloque en negro: en ese
        // caso la descripción toma el ancho entero.
        <div className={`ca-ficha-cuerpo${conFotos ? '' : ' ca-ficha-solo'}`}>
          {conFotos && (
            <div className="ca-ficha-fotos">
              <Carousel images={materia.imagenes} />
            </div>
          )}
          <div className="ca-ficha-desc">
            <DescriptionPanel desc={materia.descripcion ?? []} />
          </div>
        </div>
      )}

      <WhatsappClase
        slug={materia.slug}
        whatsapp={materia.whatsapp}
        telefono={materia.telefono_display}
        profesor={materia.nombre_profesor}
        enConstruccion={materia.en_construccion}
      />
    </div>
  );
}
