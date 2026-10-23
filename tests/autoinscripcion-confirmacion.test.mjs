import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const { PasoListo } = cargarTypescript('components/formularios/autoinscripcion-teclab.tsx', {
  'next/image': { default: () => null },
  '@/components/turnstile-widget': { default: () => null },
  '@/components/icons': { WhatsAppIcon: () => null },
});

for (const solicitud of [false, true]) {
  for (const dni of ['30.123.456', '']) {
    test(`la confirmación anuncia contacto para la preinscripción sin credenciales (solicitud=${solicitud}, con DNI=${Boolean(dni)})`, () => {
      const html = renderToStaticMarkup(createElement(PasoListo, {
        waHref: 'https://wa.me/541100000000', dni, solicitud, onVerPrecio: () => {},
      }));
      assert.match(html, /Nos comunicamos a la brevedad para realizar tu preinscripción\./);
      assert.doesNotMatch(html, /Usuario|Contraseña|tu DNI|30123456|Entrar al portal|PAGO AUTOGESTIONADO|Pagos en línea/);
      assert.match(html, /Escribinos por WhatsApp/);
      assert.match(html, /Ver precio/);
    });
  }
}
