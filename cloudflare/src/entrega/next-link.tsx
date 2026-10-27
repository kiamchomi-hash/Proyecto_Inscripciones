import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';

// Reemplazo mínimo de `next/link` para las islas React: un ancla común.
// No hay router de Next en Astro, así que la navegación es del navegador
// (recarga completa). Los props exclusivos de Next se aceptan y se ignoran:
// tocarlos en los componentes compartidos obligaría a bifurcar el sitio vigente.

type Href = string | { pathname?: string; query?: Record<string, string | number> };

type Props = {
  href: Href;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  prefetch?: boolean;
  scroll?: boolean;
  replace?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  target?: string;
  rel?: string;
  [clave: string]: unknown;
};

function urlDe(href: Href): string {
  if (typeof href === 'string') return href;
  const ruta = href.pathname ?? '';
  const query = href.query ?? {};
  const texto = Object.entries(query)
    .map(([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(String(valor))}`)
    .join('&');
  return texto ? `${ruta}?${texto}` : ruta;
}

export default function Link({
  href, children, className, style, onClick, target, rel, ...resto
}: Props) {
  // Sólo atributos de <a>; el resto (prefetch, scroll, passHref…) no se pinta.
  const extra: Record<string, unknown> = {};
  for (const clave of ['title', 'id', 'role', 'aria-label', 'aria-current', 'data-carrera']) {
    if (resto[clave] !== undefined) extra[clave] = resto[clave];
  }
  return (
    <a href={urlDe(href)} className={className} style={style} onClick={onClick}
      target={target} rel={rel} {...extra}>
      {children}
    </a>
  );
}
