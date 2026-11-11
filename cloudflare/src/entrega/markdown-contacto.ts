// La versión markdown de la página de contacto: `/contacto.md`.
//
// Los datos de la sede viven en `lib/sede.ts` y en `lib/whatsapp.ts`, que ya
// usan el JSON-LD del layout y la página: acá no se copia ninguno.

import {
  EMAIL_CONTACTO, HORARIO_WHATSAPP, MAPS_URL, POSTAL_ADDRESS, TELEFONO_DISPLAY, TELEFONO_E164,
} from '@/lib/sede';
import { NUMERO_CAU } from '../../../lib/whatsapp.ts';
import { PAGINAS } from '@/lib/paginas';

export function construirMarkdownContacto(url: string): string {
  const direccion = [
    POSTAL_ADDRESS.streetAddress,
    POSTAL_ADDRESS.addressLocality,
    POSTAL_ADDRESS.addressRegion,
    POSTAL_ADDRESS.postalCode,
    POSTAL_ADDRESS.addressCountry,
  ].join(', ');

  const bloques: string[] = [
    '# Contacto',
    '',
    `> ${PAGINAS.contacto.descripcion}`,
    '',
    `- **WhatsApp:** ${TELEFONO_DISPLAY} — https://wa.me/${NUMERO_CAU}`,
    `- **Teléfono:** ${TELEFONO_E164}`,
    `- **Correo:** ${EMAIL_CONTACTO}`,
    `- **Horario de atención por WhatsApp:** ${HORARIO_WHATSAPP}`,
    `- **Dirección:** ${direccion}`,
    `- **Mapa:** ${MAPS_URL}`,
    `- **Página:** ${url}`,
  ];

  return `${bloques.join('\n').trim()}\n`;
}
