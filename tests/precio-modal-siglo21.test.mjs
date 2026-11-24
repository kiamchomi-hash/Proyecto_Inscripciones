import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// El 24/11/2026 Siglo 21 dejó de mostrar el precio en los modales de la home.
// El precio sigue en la preinscripción y en el mail de precio: lo que no puede
// volver es la sección «Ver precios» ni el slide del precio.

test('los modales de Siglo 21 no montan el panel del precio', () => {
  for (const archivo of ['career-modal.tsx', 'carousel-modal.tsx']) {
    const fuente = readFileSync(`components/index/${archivo}`, 'utf8');
    assert.doesNotMatch(fuente, /PanelVerPrecio/, `${archivo} no debe montar PanelVerPrecio`);
    assert.doesNotMatch(fuente, /Ver precios/, `${archivo} no debe ofrecer «Ver precios»`);
  }
});

test('el modal de Siglo 21 no agrega un slide de precio al carrusel', () => {
  const fuente = readFileSync('components/index/carousel-modal.tsx', 'utf8');
  assert.match(fuente, /const totalSlides = slides\.length;/);
});

test('el cierre sin precio ofrece preinscribirse y no «Ver precio»', () => {
  const fuente = readFileSync('components/index/carousel-modal.tsx', 'utf8');
  // El cierre recibe el precio sólo si el modal se lo pasa; ya no lo hace.
  assert.match(fuente, /case 'cierre': return <SlideCierreView slide=\{slide\} carrera=\{carrera\} onInscribir=\{onInscribir\} \/>;/);
});

test('«Inscribite ya» de los modales de Siglo 21 lleva al formulario de la misma página', () => {
  for (const archivo of ['career-modal.tsx', 'carousel-modal.tsx']) {
    const fuente = readFileSync(`components/index/${archivo}`, 'utf8');
    assert.match(fuente, /href="#preinscripcion"/, `${archivo} debe bajar al formulario en vez de navegar`);
    assert.doesNotMatch(fuente, /\/inscripcion`/, `${archivo} no debe enlazar a la página de inscripción`);
    assert.match(fuente, /pedirCarreraEnFormulario|inscribir\(\)/, `${archivo} debe elegir la carrera al bajar`);
  }
});

test('el precio de Siglo 21 sigue entrando por la preinscripción', () => {
  const casas = readFileSync('components/formularios/casas.ts', 'utf8');
  assert.match(casas, /CASAS_CON_PRECIO: CasaId\[\] = \['teclab', 'siglo21'\]/);
});
