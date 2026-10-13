import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import vm from 'node:vm';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Se ejecutan los componentes reales con sesión y router simulados, sin red.
function render(path, initial = []) {
  let index = 0;
  const states = [...initial];
  const react = { ...require('react'), useState(value) {
    const slot = index++;
    if (!(slot in states)) states[slot] = value;
    return [states[slot], value => { states[slot] = value; }];
  }, useEffect() {}, useCallback(fn) { return fn; } };
  const componentModule = { exports: {} };
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  vm.runInNewContext(code, { module: componentModule, exports: componentModule.exports, window: { matchMedia: () => ({ matches: true }) }, require(name) {
    if (name === 'react') return react;
    if (name === 'next/link') return { __esModule: true, default: 'a' };
    if (name === 'next/navigation') return { usePathname: () => '/admin', useRouter: () => ({ replace() {}, push() {} }) };
    if (name === '@/lib/supabase-auth') return { createSupabaseBrowser: () => ({ auth: { signOut: async () => {} } }) };
    return require(name);
  } });
  const rerender = () => { index = 0; return componentModule.exports.default(); };
  return { tree: rerender(), rerender };
}
function elements(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(elements)];
}
test('la tarjeta completa de carreras es un enlace con foco visible', () => {
  const nodes = elements(render('app/admin/page.tsx', [{ rol: 'admin' }, 'usuario', false, [], [], null]).tree);
  const link = nodes.find(node => node.props?.href === '/admin/buscador');
  assert.ok(link);
  assert.equal(link.type, 'a');
  assert.match(link.props.className, /focus-visible/);
  assert.ok(elements(link).some(node => node.type === 'svg'));
  assert.ok(elements(link).some(node => node.type === 'h3'));
});
test('el menú no expande con un pointer táctil, pero sí con mouse', () => {
  const sidebar = render('components/admin/sidebar.tsx');
  assert.equal(sidebar.tree.props.style.width, 48);
  sidebar.tree.props.onPointerEnter({ pointerType: 'touch' });
  assert.equal(sidebar.rerender().props.style.width, 48);
  sidebar.tree.props.onPointerEnter({ pointerType: 'mouse' });
  assert.equal(sidebar.rerender().props.style.width, 200);
  sidebar.tree.props.onPointerLeave();
  assert.equal(sidebar.rerender().props.style.width, 48);
});
test('el menú tiene enlaces de 48 px y página actual accesible', () => {
  const links = elements(render('components/admin/sidebar.tsx').tree).filter(node => node.props?.href);
  assert.equal(links.length, 2);
  assert.equal(links[0].props['aria-current'], 'page');
  for (const link of links) {
    assert.equal(link.type, 'a');
    assert.equal(link.props.style.height, 48);
    assert.match(link.props.className, /focus-visible/);
  }
});
test('la espera del buscador anuncia carga sin revelar datos privados', () => {
  const nodes = elements(render('app/admin/buscador/loading.tsx').tree);
  const status = nodes.find(node => node.props?.role === 'status');
  assert.ok(status);
  assert.equal(status.props['aria-live'], 'polite');
  assert.ok(elements(status).some(node => String(node.props?.children).includes('Cargando carreras y precios')));
});
