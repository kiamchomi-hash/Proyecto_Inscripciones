import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const fuente = readFileSync('components/index/flechas-de-scroll.tsx', 'utf8');
function cargar() {
  const modulo = { exports: {} };
  const codigo = ts.transpileModule(`${fuente}\nexport { zonasConScroll, contenidoPendiente };`, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(codigo, { exports: modulo.exports, module: modulo, require,
    getComputedStyle: () => ({ overflowY: 'auto' }), NodeFilter: { SHOW_TEXT: 4 },
  });
  return modulo.exports;
}
test('sólo las regiones de lectura declaradas participan, no los planes o índices', () => {
  const zona = { scrollHeight: 120, clientHeight: 100, closest: () => null };
  let selector;
  const raiz = { querySelectorAll(s) { selector = s; return [zona]; } };
  assert.equal(cargar().zonasConScroll(raiz).length, 1);
  assert.equal(selector, '[data-scroll-lectura]');
});
function zonaConTexto(bottom, texto = 'Contenido académico') {
  const nodo = { textContent: texto, parentElement: { closest: () => null } };
  let pendiente = true;
  return {
    ownerDocument: {
      createTreeWalker: () => ({ nextNode: () => pendiente ? (pendiente = false, nodo) : null }),
      createRange: () => ({ selectNodeContents() {}, getClientRects: () => [{ bottom, left: 0, right: 100, width: 100, height: 16 }] }),
    },
    querySelectorAll: () => [],
  };
}
test('el padding final no implica contenido pendiente aunque haya scroll', () => {
  assert.equal(cargar().contenidoPendiente(zonaConTexto(96), { bottom: 100, left: 0, right: 100 }), false);
});
test('una línea realmente cortada incluso por pocos píxeles mantiene el indicador', () => {
  assert.equal(cargar().contenidoPendiente(zonaConTexto(103), { bottom: 100, left: 0, right: 100 }), true);
});
test('texto vacío y redondeo de subpíxel no crean indicadores', () => {
  assert.equal(cargar().contenidoPendiente(zonaConTexto(160, '  '), { bottom: 100, left: 0, right: 100 }), false);
  assert.equal(cargar().contenidoPendiente(zonaConTexto(100.5), { bottom: 100, left: 0, right: 100 }), false);
});
test('una acción o imagen significativa cortada mantiene el indicador', () => {
  const zona = zonaConTexto(80);
  zona.querySelectorAll = () => [{ closest: () => null, getBoundingClientRect: () => ({ bottom: 130, left: 0, right: 100, width: 100, height: 40 }) }];
  assert.equal(cargar().contenidoPendiente(zona, { bottom: 100, left: 0, right: 100 }), true);
});
test('los controles ocultos no cuentan como lectura pendiente', () => {
  const zona = zonaConTexto(80);
  zona.querySelectorAll = () => [{ closest: () => ({}), getBoundingClientRect: () => ({ bottom: 130, left: 0, right: 100, width: 100, height: 40 }) }];
  assert.equal(cargar().contenidoPendiente(zona, { bottom: 100, left: 0, right: 100 }), false);
});
