import type { CSSProperties } from 'react';
import { encodeImagePath } from '@/lib/imagenes/rutas';
import { srcSetDe } from '@/lib/imagenes/responsivas';

/**
 * Imagen con derivados: si `public/derivados` tiene versiones webp más chicas de
 * la foto, el navegador elige una según `sizes`. Si no las tiene, sale el mismo
 * `<img>` de siempre contra el original.
 *
 * La foto la generan `herramientas/derivar-imagenes.mjs` y el manifiesto
 * `lib/imagenes/derivadas.ts`. No se usa `next/image`: en el paquete de
 * Cloudflare ese shim no optimiza nada.
 */
type Props = {
  /** Ruta tal como está guardada (`/imagenes/...`), con tildes y espacios. */
  ruta: string;
  alt: string;
  sizes?: string;
  /** Ocupa todo el contenedor, como `fill` de next/image. */
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  style?: CSSProperties;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Conserva la imagen original cuando el recorte exige la máxima calidad. */
  original?: boolean;
};

export default function ImagenResponsiva({
  ruta, alt, sizes, fill, width, height, priority, className, style, loading, fetchPriority, original,
}: Props) {
  const src = encodeImagePath(ruta);
  const candidatos = original ? undefined : srcSetDe(ruta);

  const relleno: CSSProperties | undefined = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style }
    : style;

  // `<img>` a propósito: en el paquete de Cloudflare `next/image` es un shim que
  // no optimiza nada, y el `srcset` ya elige el derivado más chico.
  const respaldo = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={relleno}
      sizes={sizes}
      width={!fill && width !== undefined ? width : undefined}
      height={!fill && height !== undefined ? height : undefined}
      loading={loading ?? (priority ? 'eager' : undefined)}
      fetchPriority={fetchPriority ?? (priority ? 'high' : undefined)}
    />
  );

  if (!candidatos) return respaldo;

  return (
    <picture>
      <source type="image/webp" srcSet={candidatos} sizes={sizes} />
      {respaldo}
    </picture>
  );
}
