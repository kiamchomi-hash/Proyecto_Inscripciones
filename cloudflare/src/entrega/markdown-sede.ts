// Las líneas de contacto de la sede, en markdown.
//
// Las usan tres páginas —la home, `/contacto` y `/sobre-nosotros`— y las tres
// tienen que decir lo mismo. El dato vive en `lib/sede.ts`, que también usan el
// JSON-LD del layout y la página de contacto; acá sólo se le da formato.

import {
  EMAIL_CONTACTO, HORARIO_WHATSAPP, MAPS_URL, POSTAL_ADDRESS, TELEFONO_DISPLAY, TELEFONO_E164,
} from '@/lib/sede';
import { NUMERO_CAU } from '../../../lib/whatsapp.ts';

/** La dirección postal completa, en una línea. */
export const DIRECCION = [
  POSTAL_ADDRESS.streetAddress,
  POSTAL_ADDRESS.addressLocality,
  POSTAL_ADDRESS.addressRegion,
  POSTAL_ADDRESS.postalCode,
  POSTAL_ADDRESS.addressCountry,
].join(', ');

/**
 * WhatsApp, teléfono, correo, horario, dirección y mapa.
 *
 * El horario es el del WhatsApp y no el de la sede: la sede atiende de 9 a 20
 * y el WhatsApp arranca una hora antes (ver `HORARIO_WHATSAPP`).
 */
export const LINEAS_DE_CONTACTO: readonly string[] = [
  `- **WhatsApp:** ${TELEFONO_DISPLAY} — https://wa.me/${NUMERO_CAU}`,
  `- **Teléfono:** ${TELEFONO_E164}`,
  `- **Correo:** ${EMAIL_CONTACTO}`,
  `- **Horario de atención por WhatsApp:** ${HORARIO_WHATSAPP}`,
  `- **Dirección:** ${DIRECCION}`,
  `- **Mapa:** ${MAPS_URL}`,
];
