/**
 * Identidad de la sede en Google Maps y datos postales.
 *
 * Fuente única: hasta julio de 2026 estos valores estaban copiados a mano en
 * `app/layout.tsx`, `paginas/sobre-nosotros/index.tsx`, `components/faq-page.tsx` y
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

/**
 * `PostalAddress` de schema.org, tal cual va en el JSON-LD.
 *
 * La región va con el nombre completo y no con la sigla: es lo que declara la
 * ficha de Google y Google compara los datos de la sede campo por campo. Hasta
 * el 08/11/2026 el layout decía "CABA" y las páginas de materias decían el
 * nombre completo, así que la misma dirección se publicaba de dos maneras.
 */
export const POSTAL_ADDRESS = {
  "@type": "PostalAddress",
  "streetAddress": "Guaminí 4876",
  "addressLocality": "Villa Lugano",
  "addressRegion": "Ciudad Autónoma de Buenos Aires",
  "postalCode": "C1439",
  "addressCountry": "AR",
} as const;

/**
 * `@id` de la sede como nodo de schema.org. Se declara una sola vez, en
 * `cloudflare/src/layouts/Sitio.astro`, y las páginas que hablan de la sede lo
 * referencian en vez de repetir la dirección: dos copias del mismo dato se
 * desincronizan y Google lee dos sedes distintas.
 */
export const ORGANIZACION_ID = "https://www.siglo21sur.com/#organizacion";

/**
 * Los teléfonos de la sede, en las dos formas en que se escriben.
 *
 * El que atiende el WhatsApp y el que declara el JSON-LD son el mismo número:
 * el primero como lo escribe la gente, el segundo en formato internacional.
 */
export const TELEFONO_DISPLAY = '11 3297-3801';
export const TELEFONO_E164 = '+5491132973801';

/** El correo de contacto: el mismo desde el que salen los mails de precio. */
export const EMAIL_CONTACTO = 'inscripciones@siglo21sur.com';

/**
 * El horario del WhatsApp. **No es el de la sede**: la sede atiende de 9 a 20
 * y el WhatsApp arranca una hora antes. Son dos cosas distintas, no una
 * diferencia para emparejar (lo dice también la respuesta de la sede en
 * `components/faq-page.tsx`).
 */
export const HORARIO_WHATSAPP = 'Lun a Vie, 8 a 20 hs';
