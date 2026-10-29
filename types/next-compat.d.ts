// Tipos de los dos módulos heredados que no participan en el Worker.
// La entrega usa sus propias metas y no monta el componente de Google Analytics.
declare module 'next' {
  export interface Metadata {
    title?: string | { absolute: string };
    description?: string;
    keywords?: string[];
    alternates?: { canonical?: string };
    openGraph?: {
      title?: string;
      description?: string;
      url?: string;
      type?: string;
      images?: Array<{ url: string; width?: number; height?: number; alt?: string }>;
    };
  }
}

declare module 'next/script' {
  import type { ComponentType, ScriptHTMLAttributes } from 'react';
  const Script: ComponentType<ScriptHTMLAttributes<HTMLScriptElement> & {
    strategy?: 'lazyOnload' | 'afterInteractive' | 'beforeInteractive' | 'worker';
  }>;
  export default Script;
}
