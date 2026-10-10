import test from 'node:test';
import ts from 'typescript';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

test('sólo las rutas dedicadas ocultan la navegación', () => {
  const { esRutaPreinscripcion } = cargarTypescript('lib/rutas-preinscripcion.ts', {});
  for (const ruta of ['/teclab/inscripcion', '/teclab/inscripcion/', '/carreras/eventos/inscripcion']) assert.equal(esRutaPreinscripcion(ruta), true);
  for (const ruta of ['/', '/teclab', '/carreras/eventos', '/admin/inscripcion', '/carreras/eventos/inscripcion/otra']) assert.equal(esRutaPreinscripcion(ruta), false);
  for (const archivo of ['components/navbar.tsx', 'components/scroll-to-top.tsx']) assert.match(readFileSync(archivo, 'utf8'), /if \(esRutaPreinscripcion\(pathname\)\) return null/);
});

test('ambas páginas muestran únicamente la preinscripción', () => {
  for (const archivo of ['app/carreras/[slug]/inscripcion/page.tsx', 'app/teclab/inscripcion/page.tsx']) {
    const pagina = readFileSync(archivo, 'utf8');
    assert.match(pagina, /alinearAlLlegar/);
    assert.match(pagina, /<h1 className="sr-only">/);
    assert.doesNotMatch(pagina, /SiteFooter|GuiaInscripcion|PreguntasInscripcion|FAQPage|inscripcion-migas/);
  }
});

test('la llegada es optativa y no abre el teclado móvil', () => {
  const formulario = readFileSync('components/formularios/formulario-lead.tsx', 'utf8');
  assert.match(formulario, /alinearAlLlegar = false/);
  assert.match(formulario, /if \(!alinearAlLlegar\) return/);
  assert.match(formulario, /requestAnimationFrame/);
  assert.match(formulario, /Number\.isFinite\(alto\) \? alto : 60/);

});

test('el ancla no enfoca una carrera precargada ni las páginas dedicadas', () => {
  const fuente = readFileSync('components/formularios/formulario-lead.tsx', 'utf8');
  const inicio = fuente.indexOf('  // Los CTA llegan por ancla');
  const efecto = fuente.slice(inicio, fuente.indexOf('  const poner =', inicio));
  for (const escenario of [
    { carreraInicial: 2, alinearAlLlegar: false, focos: 0 },
    { carreraInicial: undefined, alinearAlLlegar: true, focos: 0 },
    { carreraInicial: 2, alinearAlLlegar: true, focos: 0 },
    { carreraInicial: undefined, alinearAlLlegar: false, focos: 1 },
  ]) {
    let focos = 0;
    const ventana = {
      location: { hash: '#preinscripcion' },
      setTimeout: callback => { callback(); return 1; },
      clearTimeout: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    const documento = { getElementById: () => ({
      querySelector: () => ({ focus: () => { focos += 1; } }),
    }) };
    // Se ejecuta el efecto real, quitando sólo la anotación TypeScript.
    new Function('useEffect', 'window', 'document', 'idDestino',
      'alinearAlLlegar', 'carreraInicial', 'enDosColumnas',
      ts.transpileModule(efecto, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText)(
      callback => callback(), ventana, documento, 'preinscripcion',
      escenario.alinearAlLlegar, escenario.carreraInicial, () => true,
    );
    assert.equal(focos, escenario.focos, JSON.stringify(escenario));
  }
});

test('el selector muestra países y buscar Peru conserva el valor Peruana', async () => {
  const { CAMPOS } = await import('../components/formularios/casas.ts');
  const fuente = readFileSync('components/formularios/formulario-lead.tsx', 'utf8');
  const inicio = fuente.indexOf('function Desplegable(');
  const componente = fuente.slice(inicio, fuente.indexOf('/**\n * La fecha de nacimiento', inicio));
  const estados = [];
  let indice = 0;
  let valor = '';
  const jsx = (type, props) => ({ type, props });
  const construir = new Function('require', 'useState', 'useMemo', 'useCallback', 'useRef', 'useEffect',
    'CAMPO', 'BORDE_MAL', 'BORDE_OK', 'ALTO_LISTA', 'exports',
    ts.transpileModule(componente, { compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    } }).outputText + '; return Desplegable;');
  const Selector = construir(() => ({ jsx, jsxs: jsx }),
    inicial => {
      const posicion = indice++;
      if (!(posicion in estados)) estados[posicion] = inicial;
      return [estados[posicion], nuevo => { estados[posicion] = typeof nuevo === 'function' ? nuevo(estados[posicion]) : nuevo; }];
    }, callback => callback(), callback => callback, () => ({ current: null }), () => {},
    '', '', '', 220, {});
  const render = () => {
    indice = 0;
    return Selector({ id: 'nacionalidad', valor, opciones: CAMPOS.nacionalidad.opciones,
      etiquetasOpciones: CAMPOS.nacionalidad.etiquetasOpciones, onChange: nuevo => { valor = nuevo; } });
  };
  const nodos = arbol => {
    if (!arbol || typeof arbol !== 'object') return [];
    if (Array.isArray(arbol)) return arbol.flatMap(nodos);
    return [arbol, ...nodos(arbol.props?.children)];
  };
  let arbol = render();
  nodos(arbol).find(nodo => nodo.type === 'input').props.onFocus();
  arbol = render();
  assert.deepEqual(nodos(arbol).filter(nodo => nodo.props?.role === 'option').slice(0, 5)
    .map(nodo => nodo.props.children), ['Argentina', 'Paraguay', 'Bolivia', 'Venezuela', 'Perú']);
  nodos(arbol).find(nodo => nodo.type === 'input').props.onChange({ target: { value: 'Peru' } });
  arbol = render();
  const opciones = nodos(arbol).filter(nodo => nodo.props?.role === 'option');
  assert.equal(opciones.length, 1);
  assert.equal(opciones[0].props.children, 'Perú');
  opciones[0].props.onClick();
  arbol = render();
  assert.equal(valor, 'Peruana');
  assert.equal(nodos(arbol).find(nodo => nodo.type === 'input').props.value, 'Perú');
  nodos(arbol).find(nodo => nodo.type === 'input').props.onFocus();
  arbol = render();
  nodos(arbol).find(nodo => nodo.type === 'input').props.onKeyDown({
    key: 'Enter', preventDefault: () => {},
  });
  arbol = render();
  assert.equal(valor, 'Peruana');
  assert.equal(nodos(arbol).find(nodo => nodo.type === 'input').props['aria-expanded'], false);
  assert.equal(nodos(arbol).filter(nodo => nodo.props?.role === 'option').length, 0);

});

test('el contacto compacto sólo se activa en las páginas dedicadas', () => {
  const formulario = readFileSync('components/formularios/formulario-lead.tsx', 'utf8');
  assert.match(formulario, /alinearAlLlegar \? 'form-contacto-compacto' : ''/);
  // La preinscripción rotula la caja como un bloque más; la aclaración larga
  // del contacto sigue sin aparecer en las páginas dedicadas.
  assert.match(formulario, /esPreinscripcion \? \(\s*<p className=\{ROTULO_BLOQUE\}>\{ROTULO_GRUPO\.contacto\}<\/p>\s*\) : !alinearAlLlegar && \(/);
  assert.match(formulario, /role="group" aria-label="Datos de contacto"/);
  assert.match(formulario, /<label htmlFor=\{\x60\$\{prefijo\}-newsletter\x60\}/);
  const estilos = readFileSync('app/carreras/[slug]/inscripcion/inscripcion.css', 'utf8');
  assert.match(estilos, /\.inscripcion-page \.form-contacto-compacto \.form-field-error:empty\s*\{\s*display: none;/);
});

test('el CTA del modal de Teclab lleva a la pagina dedicada de inscripcion', async () => {
  const { readFile } = await import('node:fs/promises');
  const fuente = await readFile(new URL('../components/index/teclab-modal.tsx', import.meta.url), 'utf8');
  assert.match(fuente, /href=\{tieneInscripcionPropia\(carrera\) \? rutaInscripcion\(carrera\) : destinoFormulario\}/);
  // Abierta o anunciada, el CTA va a la preinscripcion, como la ficha.
  assert.match(fuente, /const destinoFormulario = '#preinscripcion';/);
  assert.doesNotMatch(fuente, /getElementById\('formulario'\)/);
});

test('los CTA del slide de precio llevan a la pagina dedicada de inscripcion', async () => {
  const { readFile } = await import('node:fs/promises');
  const fuente = await readFile(new URL('../components/index/ver-precio-teclab.tsx', import.meta.url), 'utf8');
  assert.equal(fuente.match(/href=\{`\/carreras\/\$\{slug\}\/inscripcion`\}/g)?.length, 2);
  assert.doesNotMatch(fuente, /urlAutoinscripcion/);
});

test('el error de Ver precio va en el boton y no corre el contenido', async () => {
  const { readFile } = await import('node:fs/promises');
  const fuente = await readFile(new URL('../components/index/ver-precio-teclab.tsx', import.meta.url), 'utf8');
  // Nada visible aparece debajo del botón: el mensaje entero queda para el
  // lector de pantalla y el botón muestra la versión corta.
  assert.doesNotMatch(fuente, /\{error && \(\s*<p id=\{errorId\} className="vp-aviso"/);
  assert.match(fuente, /<p id=\{errorId\} className="sr-only" role="alert">/);
  assert.match(fuente, /error\.corto/);
  assert.match(fuente, /vp-primario-error/);
});
