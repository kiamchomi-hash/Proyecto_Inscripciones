'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import type { CarreraOpcion } from '@/components/index/types';
import type { CasaId, Modo } from '@/components/formularios/casas';

interface Props {
  carreras: CarreraOpcion[];
  /**
   * La carrera de esta ficha. Los dos formularios arrancan con ella elegida:
   * quien baja desde "Quiero inscribirme" ya dijo a qué se quiere anotar.
   */
  carreraInicial?: number;
  modoUnico?: Modo;
  /**
   * Fichas de Teclab: debajo de la preinscripción va «Generar usuario», el
   * legajo, con la casa fija porque sólo Teclab declara ese formulario.
   */
  conUsuarioTeclab?: boolean;
}

// El formulario no fija casa: la ficha ofrece toda la oferta en su buscador, así
// que la casa la decide la carrera que el lead termine eligiendo, igual que en
// la home. La excepción es el formulario de usuario de Teclab.
type FormProps = Omit<Props, 'conUsuarioTeclab'> & { modo: Modo; casa?: CasaId };

let formPromise: Promise<{ default: ComponentType<FormProps> }> | undefined;

function importarFormulario() {
  // El puente trae el componente y su CSS dentro del mismo chunk: en la ficha
  // no se usan hasta que el observador se acerca al hueco o se toca el CTA.
  formPromise ??= import('@/components/carreras/formulario-lead-diferido');
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

export default function DeferredEnrollmentForm({ carreras, carreraInicial, modoUnico, conUsuarioTeclab = false }: Props) {
  const placeholderRef = useRef<HTMLElement>(null);
  // Las anclas que este bloque atiende cuando monta un solo modo.
  const propios = useMemo(() => [
    modoUnico === 'contacto' ? '#formulario' : '#preinscripcion',
    ...(conUsuarioTeclab ? ['#usuario-teclab'] : []),
  ], [modoUnico, conUsuarioTeclab]);
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

  // Un toque en «Quiero inscribirme» salta al hueco antes de que el formulario
  // baje. Al crecer, el contacto empuja la preinscripción y el salto queda a
  // mitad de camino: se carga al tocar y se vuelve a saltar cuando ya está.
  useEffect(() => {
    if (Form) return;
    const alTocar = (event: MouseEvent) => {
      const enlace = (event.target as Element | null)?.closest?.('a[href="#formulario"], a[href="#preinscripcion"], a[href="#usuario-teclab"]');
      if (enlace && (!modoUnico || propios.includes(enlace.getAttribute('href') ?? ''))) loadForm();
    };
    document.addEventListener('click', alTocar, true);
    return () => document.removeEventListener('click', alTocar, true);
  }, [Form, loadForm, modoUnico, propios]);

  useEffect(() => {
    if (!Form) return;
    const destino = window.location.hash;
    if (destino !== '#formulario' && destino !== '#preinscripcion' && destino !== '#usuario-teclab') return;
    if (modoUnico && !propios.includes(destino)) return;
    document.getElementById(destino.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }, [Form, modoUnico, propios]);

  const usuario = conUsuarioTeclab
    ? (Form ? <Form carreras={carreras} modo="usuario" casa="teclab" carreraInicial={carreraInicial} />
      : <Hueco id="usuario-teclab" titulo="Generar usuario" />)
    : null;

  // Los dos, igual que en la home: el contacto es la puerta general y la
  // preinscripción arma el legajo. "Quiero inscribirme" baja a la segunda.
  if (Form) {
    if (modoUnico) return <><Form carreras={carreras} modo={modoUnico} carreraInicial={carreraInicial} />{usuario}</>;
    return (
      <>
        <Form carreras={carreras} modo="contacto" carreraInicial={carreraInicial} />
        <Form carreras={carreras} modo="preinscripcion" carreraInicial={carreraInicial} />
      </>
    );
  }

  if (modoUnico) {
    return (
      <section ref={placeholderRef} aria-label={modoUnico === 'contacto' ? 'Formulario de contacto' : 'Preinscripción'}>
        <Hueco id={modoUnico === 'contacto' ? 'formulario' : 'preinscripcion'} titulo={modoUnico === 'contacto' ? 'Formulario de contacto' : 'Preinscripción'} />
        {usuario}
      </section>
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
