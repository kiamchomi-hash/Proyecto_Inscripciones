import type { CSSProperties } from 'react';

// Reemplazo mínimo de `next/image`: un <img> servido tal cual desde `publicDir`.
// No hay optimizador de imágenes en este paquete (`imageService: 'passthrough'`),
// así que `src` no se reescribe y `srcset` desaparece. Los props exclusivos de
// Next se aceptan y se descartan para no bifurcar los componentes compartidos.

type Props = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  quality?: number;
  sizes?: string;
  className?: string;
  style?: CSSProperties;
  unoptimized?: boolean;
  placeholder?: string;
  blurDataURL?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
  onLoad?: () => void;
  onError?: () => void;
  [clave: string]: unknown;
};

export default function Image({
  src, alt, width, height, fill, priority, loading, sizes, className, style,
  unoptimized: _unoptimized, quality: _quality, placeholder: _placeholder,
  blurDataURL: _blurDataURL, fetchPriority, ...resto
}: Props) {
  const relleno: CSSProperties | undefined = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
    : style;
  const props: Record<string, unknown> = {};
  if (!fill && width !== undefined && height !== undefined) {
    props.width = width;
    props.height = height;
  }
  for (const clave of ['id', 'role', 'aria-hidden', 'aria-label', 'title']) {
    if (resto[clave] !== undefined) props[clave] = resto[clave];
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={relleno}
      sizes={sizes}
      loading={loading ?? (priority ? 'eager' : undefined)}
      fetchPriority={fetchPriority ?? (priority ? 'high' : undefined)}
      {...props}
    />
  );
}
