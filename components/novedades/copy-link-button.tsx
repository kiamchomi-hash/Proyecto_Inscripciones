'use client';

import { useCompartir, textoCompartir } from '@/components/index/use-compartir';
import IconoCompartir from '@/components/index/icono-compartir';

export default function CopyLinkButton({ url, titulo }: { url: string; titulo?: string }) {
  const { compartir, estado } = useCompartir(url, titulo);

  return (
    <button
      type="button"
      onClick={compartir}
      aria-live="polite"
      className="inline-flex items-center justify-center gap-2 w-[9.5rem] px-4 py-2 rounded-full text-xs font-bold transition-all hover:brightness-110"
      style={
        estado === 'copiado'
          ? { color: '#013729', background: 'var(--color-highlight)', border: '1px solid var(--color-highlight)' }
          : { color: 'var(--color-highlight)', background: 'rgba(0,199,177,0.1)', border: '1px solid rgba(0,199,177,0.25)' }
      }
    >
      <IconoCompartir estado={estado} />
      {estado === 'idle' ? 'Copiar enlace' : textoCompartir(estado)}
    </button>
  );
}
