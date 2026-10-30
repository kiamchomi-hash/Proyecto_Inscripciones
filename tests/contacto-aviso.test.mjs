import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

// El cartel de éxito de `/contacto` se superpone a la tarjeta. Tailwind solo no
// alcanza: `.ct-channel-card > *` en contacto.css fuerza `position: relative` a
// los hijos y, al vivir fuera de una capa, le gana al `absolute` de la utilidad.
// Cuando eso pasó, el aviso cayó al flujo: quedó arriba de la tarjeta, la
// estiró ~50 px y empujó el formulario invisible hacia abajo.

const css = readFileSync(new URL('../components/contacto/contacto.css', import.meta.url), 'utf8');
const componente = readFileSync(new URL('../components/contacto/contacto-page.tsx', import.meta.url), 'utf8');

test('el aviso de éxito de /contacto tiene regla propia que lo superpone', () => {
  const regla = css.match(/\.ct-channel-card\s*>\s*\.ct-aviso-exito\s*\{([^}]*)\}/);
  assert.ok(regla, 'contacto.css debe declarar `.ct-channel-card > .ct-aviso-exito`');
  assert.match(regla[1], /position:\s*absolute/, 'la regla debe fijar position: absolute');
  assert.match(regla[1], /inset:\s*0/, 'la regla debe cubrir la tarjeta entera');
});

test('el cartel de éxito del formulario usa esa clase', () => {
  assert.match(componente, /className="ct-aviso-exito[^"]*absolute inset-0/,
    'el div del aviso debe llevar `ct-aviso-exito`');
});
