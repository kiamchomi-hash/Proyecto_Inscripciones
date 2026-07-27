/**
 * Identidad de la sede en Google Maps y datos postales.
 *
 * Fuente única: hasta julio de 2026 estos valores estaban copiados a mano en
 * `app/layout.tsx`, `app/sobre-nosotros/page.tsx`, `components/faq-page.tsx` y
 * `components/contacto/contacto-page.tsx`. Google tiene dos fichas del mismo
 * lugar — "Siglo 21" (la correcta) y "Centro de Capacitacion Lugano" — y al
 * corregir sólo dos de los cuatro archivos, `/faq` y `/contacto` quedaron
 * mandando gente a la ficha equivocada. Importar de acá, no pegar la URL.
 */

/** Ficha "Siglo 21" en Google Maps (botones "Cómo llegar"). */
export const MAPS_URL = 'https://maps.app.goo.gl/mXu8TUH6FCLQvuYYA';

/**
 * `src` del iframe embebido. Apunta a la misma ficha que `MAPS_URL`; el `!2d`
 * y el `!3d` tienen que coincidir con `GEO`. Si hay que regenerarlo, copiar el
 * embed completo desde Google en vez de editar parámetros sueltos.
 */
export const MAPS_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d287.30386866002505!2d-58.4775718!3d-34.6870295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcceb30061ee91%3A0x9da28c537a0065b1!2sSiglo%2021!5e0!3m2!1ses-419!2sus!4v1772370527929!5m2!1ses-419!2sus';

/** Coordenadas de la ficha correcta, para el JSON-LD. */
export const GEO = { latitude: -34.6870295, longitude: -58.4775718 } as const;

/** `title` del iframe, compartido por las tres páginas que lo muestran. */
export const MAPS_TITLE = 'Ubicación del CAU Villa Lugano en Google Maps';

/** `PostalAddress` de schema.org, tal cual va en el JSON-LD. */
export const POSTAL_ADDRESS = {
  "@type": "PostalAddress",
  "streetAddress": "Guaminí 4876",
  "addressLocality": "Villa Lugano",
  "addressRegion": "CABA",
  "postalCode": "C1439",
  "addressCountry": "AR",
} as const;
