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

export default function DeferredEnrollmentForm({ carreras }: Props) {
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

  if (Form) {
    return <Form carreras={carreras} modo="contacto" />;
  }

  return (
    <section
      ref={placeholderRef}
      id="formulario"
      className="deferred-enrollment-placeholder"
      aria-label="Formulario de contacto"
    >
      <div>
        <span>Formulario de contacto</span>
        <p>Preparando el formulario…</p>
      </div>
    </section>
  );
}
