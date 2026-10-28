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
  /** Ruta tal como está guardada (`/imagenes/Modales/...`), con tildes y espacios. */
  ruta: string;
  alt: string;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
};

export default function ImagenResponsiva({ ruta, alt, sizes, className, style, loading, fetchPriority }: Props) {
  const src = encodeImagePath(ruta);
  const candidatos = srcSetDe(ruta);

  // `<img>` a propósito: en el paquete de Cloudflare `next/image` es un shim que
  // no optimiza nada, y el `srcset` ya elige el derivado más chico.
  // eslint-disable-next-line @next/next/no-img-element
  const respaldo = <img src={src} alt={alt} className={className} style={style} loading={loading} fetchPriority={fetchPriority} />;

  if (!candidatos) return respaldo;

  return (
    <picture>
      <source type="image/webp" srcSet={candidatos} sizes={sizes} />
      {respaldo}
    </picture>
  );
}
