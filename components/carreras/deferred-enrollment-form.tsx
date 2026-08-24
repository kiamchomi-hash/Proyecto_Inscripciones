'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import type { CarreraOpcion } from '@/components/index/types';
import type { Modo } from '@/components/formularios/casas';

interface Props {
  carreras: CarreraOpcion[];
  /**
   * La carrera de esta ficha. Los dos formularios arrancan con ella elegida:
   * quien baja desde "Quiero inscribirme" ya dijo a qué se quiere anotar.
   */
  carreraInicial?: number;
}

// El formulario no fija casa: la ficha ofrece toda la oferta en su buscador, así
// que la casa la decide la carrera que el lead termine eligiendo, igual que en
// la home.
type FormProps = Props & { modo: Modo };

let formPromise: Promise<{ default: ComponentType<FormProps> }> | undefined;

function importarFormulario() {
  formPromise ??= import('@/components/formularios/formulario-lead');
  return formPromise;
}

/**
 * Hueco con el `id` del formulario que todavía no bajó. Existe desde el primer
 * HTML a propósito: los botones de la ficha son anclas, y sin el `id` puesto un
 * clic antes de la carga no salta a ningún lado.
 */
function Hueco({ id, titulo }: { id: string; titulo: string }) {
  return (
    <div id={id} className="deferred-enrollment-placeholder" aria-label={titulo}>
      <div>
        <span>{titulo}</span>
        <p>Preparando el formulario…</p>
      </div>
    </div>
  );
}

export default function DeferredEnrollmentForm({ carreras, carreraInicial }: Props) {
  const placeholderRef = useRef<HTMLElement>(null);
  const [Form, setForm] = useState<ComponentType<FormProps> | null>(null);

  const loadForm = useCallback(() => {
    void importarFormulario().then((module) => {
      setForm(() => module.default);
    });
  }, []);

  useEffect(() => {
    const placeholder = placeholderRef.current;
    if (!placeholder || Form) return;

    if (!('IntersectionObserver' in window)) {
      loadForm();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        loadForm();
      },
      { rootMargin: '1200px 0px' },
    );

    observer.observe(placeholder);
    return () => observer.disconnect();
  }, [Form, loadForm]);

  // Los dos, igual que en la home: el contacto es la puerta general y la
  // preinscripción arma el legajo. "Quiero inscribirme" baja a la segunda.
  if (Form) {
    return (
      <>
        <Form carreras={carreras} modo="contacto" carreraInicial={carreraInicial} />
        <Form carreras={carreras} modo="preinscripcion" carreraInicial={carreraInicial} />
      </>
    );
  }

  // Un solo observador para los dos huecos: están pegados y el margen de 1200px
  // los alcanza a los dos.
  return (
    <section ref={placeholderRef} aria-label="Formularios de contacto y preinscripción">
      <Hueco id="formulario" titulo="Formulario de contacto" />
      <Hueco id="preinscripcion" titulo="Preinscripción" />
    </section>
  );
}
