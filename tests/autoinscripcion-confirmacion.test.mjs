import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

// La confirmación de la preinscripción: dice que nos comunicamos y no promete
// credenciales. Desde la baja de la autoinscripción ya no recibe DNI ni
// solicitud; sólo el WhatsApp y, si hay precio vigente, el botón para verlo.
const { PasoListo } = cargarTypescript('components/formularios/autoinscripcion-teclab.tsx', {
  'next/image': { default: () => null },
  '@/components/turnstile-widget': { default: () => null },
  '@/components/icons': { WhatsAppIcon: () => null },
});

for (const conPrecio of [false, true]) {
  test(`la confirmación anuncia contacto sin credenciales (con precio vigente=${conPrecio})`, () => {
    const html = renderToStaticMarkup(createElement(PasoListo, {
      waHref: 'https://wa.me/541100000000',
      onVerPrecio: conPrecio ? () => {} : undefined,
    }));
    assert.match(html, /Nos comunicamos a la brevedad\./);
    assert.doesNotMatch(html, /Usuario|Contraseña|tu DNI|30123456|Entrar al portal|PAGO AUTOGESTIONADO|Pagos en línea/);
    assert.match(html, /Preinscripción enviada/);
    assert.match(html, /Escribinos por WhatsApp/);
    if (conPrecio) assert.match(html, /Ver precio/);
    else assert.doesNotMatch(html, /Ver precio/);
  });
}
