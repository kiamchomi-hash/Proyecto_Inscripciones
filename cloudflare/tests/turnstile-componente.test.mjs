import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

test('el componente publicado transmite el modo invisible y mide el ancho disponible', () => {
  const fuente = readFileSync(new URL('../src/entrega/TurnstileWidget.tsx', import.meta.url), 'utf8');
  const codigo = ts.transpileModule(fuente, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS } }).outputText;
  const efectos = [];
  const refs = [{ current: { clientWidth: 150 } }, { current: { clientWidth: 320 } }];
  let opciones;
  const react = {
    useContext: () => ({ sitio: 'clave-publica-ficticia', demo: false }),
    useState: inicial => [typeof inicial === 'function' ? inicial() : inicial, () => {}],
    useRef: valor => valor === null ? refs.shift() : { current: valor },
    useEffect: fn => efectos.push(fn),
  };
  const jsx = (tipo, props) => ({ tipo, props });
  const exports = {};
  const contexto = {
    exports,
    require: nombre => nombre === 'react' ? react : nombre === 'react/jsx-runtime' ? { jsx, jsxs: jsx } :
      nombre === './turnstile' ? { ANCHO_MINIMO_FLEXIBLE: 300, montarTurnstile: valor => { opciones = valor; return { desmontar() {}, redibujar() {} }; } } : {},
    document: {}, window: {},
  };
  vm.runInNewContext(codigo, contexto);
  exports.default({ onVerify() {}, invisible: true });
  efectos.forEach(efecto => efecto());
  assert.equal(opciones.invisible, true);
  assert.equal(opciones.medirCompacto(), false, 'se mide el envoltorio de 320 px y no el widget de 150 px');
});
