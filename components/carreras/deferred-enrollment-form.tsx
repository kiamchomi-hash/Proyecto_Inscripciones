'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import type { CarreraOpcion } from '@/components/index/types';

interface Props {
  carreras: CarreraOpcion[];
}

let enrollmentFormPromise:
  | Promise<{ default: ComponentType<Props> }>
  | undefined;

function importEnrollmentForm() {
  enrollmentFormPromise ??= import('@/components/index/enrollment-form');
  return enrollmentFormPromise;
}

export default function DeferredEnrollmentForm({ carreras }: Props) {
  const placeholderRef = useRef<HTMLElement>(null);
  const [Form, setForm] = useState<ComponentType<Props> | null>(null);

  const loadForm = useCallback(() => {
    void importEnrollmentForm().then((module) => {
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
    return <Form carreras={carreras} />;
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
