import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const fuente = readFileSync(new URL('../components/turnstile-widget.tsx', import.meta.url), 'utf8');
const codigo = ts.transpileModule(fuente, { compilerOptions: {
  jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS,
} }).outputText;

// Ejecuta el componente y sus efectos con un iframe controlado, sin red.
function montar({ inmediato = true, ancho = 320, invisible = false } = {}) {
  const estados = [];
  const efectos = [];
  const timers = new Map();
  const eventos = new Map();
  let cursor = 0;
  let iframePresente = inmediato;
  let observar;
  let opciones;
  let redimensionar;
  let dibujos = 0;
  let vencidos = 0;
  let removido = false;
  let desconectado = false;
  const iframe = {
    addEventListener: (nombre, fn) => eventos.set(nombre, fn),
    removeEventListener: (nombre) => eventos.delete(nombre),
  };
  const contenedor = { clientWidth: ancho, querySelector: () => iframePresente ? iframe : null };
  const react = {
    useRef: (valor) => ({ current: valor === null ? contenedor : valor }),
    useState: (inicial) => {
      const indice = cursor++;
      if (!(indice in estados)) estados[indice] = inicial;
      return [estados[indice], (valor) => { estados[indice] = valor; }];
    },
    useEffect: (fn) => efectos.push(fn),
  };
  const jsx = (tipo, props) => ({ tipo, props });
  const exports = {};
  const contexto = {
    exports,
    require: (nombre) => nombre === 'react' ? react : nombre === 'react/jsx-runtime' ? { jsx, jsxs: jsx } : { default: () => null },
    process: { env: { NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'prueba' } },
    window: { turnstile: { render: (_, config) => { opciones = config; dibujos++; return 'widget'; }, remove: () => { removido = true; } } },
    document: { getElementById: () => null },
    MutationObserver: class {
      constructor(fn) { observar = fn; }
      observe() {}
      disconnect() { desconectado = true; }
    },
    ResizeObserver: class {
      constructor(fn) { redimensionar = fn; }
      observe() {}
      disconnect() {}
    },
    setTimeout: (fn) => { timers.set(1, fn); return 1; },
    clearTimeout: (id) => timers.delete(id),
  };
  vm.runInNewContext(codigo, contexto);
  const render = () => { cursor = 0; efectos.length = 0; return exports.default({ onVerify() {}, onExpire() { vencidos++; }, invisible }); };
  const inicial = render();
  const limpiezas = efectos.map(fn => fn());
  return {
    inicial, render, timers, eventos,
    insertar: () => { iframePresente = true; observar(); },
    cargar: () => eventos.get('load')?.(),
    limpiar: () => limpiezas.forEach(fn => fn?.()),
    redimensionar: (nuevo) => { contenedor.clientWidth = nuevo; redimensionar?.(); },
    get dibujos() { return dibujos; },
    get vencidos() { return vencidos; },
    get opciones() { return opciones; },
    get removido() { return removido; },
    get desconectado() { return desconectado; },
  };
}

function widget(arbol) { return arbol.props.children[1]; }

for (const ancho of [320, 250]) {
  test(`el iframe de ${ancho}px queda oculto hasta cargar, aunque el fondo sea transparente`, () => {
    const caso = montar({ ancho });
    assert.equal(widget(caso.inicial).props.style?.visibility, 'hidden');
    assert.equal(widget(caso.inicial).props.style?.opacity, 0);
    assert.match(caso.inicial.props.children[0].props.className, /\bz-10\b/);
    caso.cargar();
    const listo = caso.render();
    assert.equal(listo.props.children[0], false);
    assert.equal(widget(listo).props.style.visibility, 'visible');
    assert.equal(widget(listo).props.style.opacity, 1);
    assert.equal(caso.opciones.size, ancho < 300 ? 'compact' : 'flexible');
    caso.limpiar();
  });
}

test('el fallback también revela un iframe insertado inmediatamente que nunca emite load', () => {
  const caso = montar();
  assert.equal(caso.timers.size, 1);
  caso.timers.get(1)();
  assert.equal(widget(caso.render()).props.style.visibility, 'visible');
  caso.limpiar();
});

test('un iframe tardío revela el widget y limpia la espera al cargar', () => {
  const caso = montar({ inmediato: false });
  caso.insertar();
  caso.cargar();
  assert.equal(caso.desconectado, true);
  assert.equal(caso.timers.size, 0);
  caso.limpiar();
  assert.equal(caso.eventos.size, 0);
  assert.equal(caso.removido, true);
});

test('el modo invisible no oculta los desafíos interactivos ni reserva marcador', () => {
  const caso = montar({ invisible: true });
  assert.equal(caso.inicial.props.style, undefined);
  assert.equal(caso.inicial.props.children, undefined);
  assert.equal(caso.opciones.appearance, 'interaction-only');
  caso.limpiar();
});

test('si el ancho cruza los 300 px después de dibujarse, el widget se vuelve a dibujar con el tamaño que corresponde', () => {
  const caso = montar({ ancho: 250 });
  assert.equal(caso.opciones.size, 'compact');
  caso.redimensionar(338);
  assert.equal(caso.removido, true);
  assert.equal(caso.dibujos, 2);
  assert.equal(caso.opciones.size, 'flexible');
  // El token del widget anterior ya no sirve: se avisa para que no se envíe.
  assert.equal(caso.vencidos, 1);
  caso.limpiar();
});

test('un cambio de ancho que no cruza los 300 px no vuelve a dibujar el widget', () => {
  const caso = montar({ ancho: 320 });
  caso.redimensionar(338);
  assert.equal(caso.dibujos, 1);
  assert.equal(caso.vencidos, 0);
  caso.limpiar();
});
