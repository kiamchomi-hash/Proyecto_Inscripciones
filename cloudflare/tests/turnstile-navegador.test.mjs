import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setTimeout as esperar } from 'node:timers/promises';
import {
  cargarScriptTurnstile, leerDemo, leerSitio, montarTurnstile,
  ANCHO_MINIMO_FLEXIBLE, META_DEMO, META_SITEKEY, SCRIPT_ID, SCRIPT_SRC, TOKEN_DEMO,
} from '../src/entrega/turnstile.ts';
import { configTurnstile } from '../src/entrega/entorno-publico.ts';

// El widget de Turnstile, sin red: dobles del documento y de la API de
// Cloudflare. Se comprueba que se monte y se limpie, y sobre todo que falle
// cerrado cuando falta la site key o el script no carga.

function documentoFalso({ meta, demo, scriptExistente = null } = {}) {
  const creados = [];
  const cabecera = [];
  const documento = {
    querySelector: selector => (selector === `meta[name="${META_SITEKEY}"]`
      ? (meta === undefined ? null : { getAttribute: () => meta })
      : selector === `meta[name="${META_DEMO}"]`
        ? (demo === undefined ? null : { getAttribute: () => demo })
        : null),
    getElementById: id => (id === SCRIPT_ID ? scriptExistente : null),
    createElement: etiqueta => {
      assert.equal(etiqueta, 'script');
      const elemento = {
        oyentes: {},
        addEventListener(evento, cb) { elemento.oyentes[evento] = cb; },
        disparar(evento) { elemento.oyentes[evento]?.(); },
      };
      creados.push(elemento);
      return elemento;
    },
    head: { appendChild: nodo => cabecera.push(nodo) },
  };
  return { documento, creados, cabecera };
}

function apiFalsa() {
  const llamadas = { render: [], remove: [] };
  const expirados = [];
  return {
    llamadas,
    expirados,
    api: {
      render: (contenedor, opciones) => {
        llamadas.render.push({ contenedor, opciones });
        return `widget-${llamadas.render.length}`;
      },
      remove: id => llamadas.remove.push(id),
    },
  };
}

test('sin site key no se carga el script ni se entrega token', () => {
  const { documento } = documentoFalso();
  let cargado = false;
  const estados = [];
  let token = null;
  const control = montarTurnstile({
    sitio: '   ',
    contenedor: {},
    documento,
    ventana: {},
    cargar: async () => { cargado = true; throw new Error('no debería cargar'); },
    onVerify: valor => { token = valor; },
    onEstado: estado => estados.push(estado),
  });
  control.desmontar();
  assert.equal(cargado, false);
  assert.deepEqual(estados, ['sin-configurar']);
  assert.equal(token, null);
});

test('con site key monta, entrega el token y la limpieza desmonta el widget', async () => {
  const { documento } = documentoFalso({ meta: '  clave-publica-ficticia  ' });
  const { api, llamadas } = apiFalsa();
  const estados = [];
  const tokens = [];
  let expiraciones = 0;
  const control = montarTurnstile({
    sitio: 'clave-publica-ficticia',
    contenedor: 'contenedor',
    documento,
    ventana: { turnstile: api },
    cargar: async () => api,
    onVerify: valor => tokens.push(valor),
    onExpire: () => { expiraciones++; },
    onEstado: estado => estados.push(estado),
  });

  await esperar(0);
  assert.deepEqual(estados, ['cargando', 'montado']);
  assert.equal(llamadas.render.length, 1);
  assert.equal(llamadas.render[0].contenedor, 'contenedor');
  assert.equal(llamadas.render[0].opciones.sitekey, 'clave-publica-ficticia');
  assert.equal(llamadas.render[0].opciones.theme, 'dark');
  assert.equal(llamadas.render[0].opciones.size, 'flexible');
  assert.equal(llamadas.render[0].opciones.appearance, undefined);

  llamadas.render[0].opciones.callback('token-uno');
  llamadas.render[0].opciones['expired-callback']();
  assert.deepEqual(tokens, ['token-uno']);
  assert.equal(expiraciones, 1);

  control.desmontar();
  assert.deepEqual(llamadas.remove, ['widget-1']);
  llamadas.render[0].opciones.callback('token-tarde');
  llamadas.render[0].opciones['expired-callback']();
  assert.deepEqual(tokens, ['token-uno']);
  assert.equal(expiraciones, 1);
});

test('desmontar antes de que cargue no dibuja nada ni entrega token', async () => {
  const { documento } = documentoFalso();
  const { api, llamadas } = apiFalsa();
  let resolver;
  const pendiente = new Promise(completar => { resolver = completar; });
  let token = null;
  const control = montarTurnstile({
    sitio: 'clave-publica-ficticia',
    contenedor: {},
    documento,
    ventana: {},
    cargar: () => pendiente,
    onVerify: valor => { token = valor; },
  });
  control.desmontar();
  resolver(api);
  await esperar(0);
  assert.equal(llamadas.render.length, 0);
  assert.deepEqual(llamadas.remove, []);
  assert.equal(token, null);
});

test('si el script no carga no hay token y el estado queda en error', async () => {
  const { documento } = documentoFalso();
  const estados = [];
  let token = null;
  const control = montarTurnstile({
    sitio: 'clave-publica-ficticia',
    contenedor: {},
    documento,
    ventana: {},
    cargar: async () => { throw new Error('sin red'); },
    onVerify: valor => { token = valor; },
    onEstado: estado => estados.push(estado),
  });
  await esperar(0);
  assert.deepEqual(estados, ['cargando', 'error']);
  assert.equal(token, null);
  control.desmontar();
});

test('el widget invisible pide interaction-only', async () => {
  const { documento } = documentoFalso();
  const { api, llamadas } = apiFalsa();
  montarTurnstile({
    sitio: 'clave-publica-ficticia',
    contenedor: {},
    documento,
    ventana: {},
    cargar: async () => api,
    onVerify: () => {},
    invisible: true,
  });
  await esperar(0);
  assert.equal(llamadas.render[0].opciones.appearance, 'interaction-only');
});

test('el cargador pone el script una sola vez y espera su load', async () => {
  const { documento, creados, cabecera } = documentoFalso();
  const { api } = apiFalsa();
  const ventana = {};
  const promesa = cargarScriptTurnstile(documento, ventana);
  assert.equal(creados.length, 1);
  assert.equal(cabecera.length, 1);
  assert.equal(creados[0].id, SCRIPT_ID);
  assert.equal(creados[0].src, SCRIPT_SRC);
  assert.equal(creados[0].async, true);
  assert.equal(creados[0].defer, true);
  ventana.turnstile = api;
  creados[0].disparar('load');
  assert.equal(await promesa, api);

  // Con el script ya puesto no se agrega otro: se espera el load del existente.
  const otro = documentoFalso({ scriptExistente: creados[0] });
  const segunda = cargarScriptTurnstile(otro.documento, ventana);
  assert.equal(otro.creados.length, 0);
  assert.equal(await segunda, api);
});

test('un error de red en el script rechaza la carga', async () => {
  const { documento, creados } = documentoFalso();
  const promesa = cargarScriptTurnstile(documento, {});
  creados[0].disparar('error');
  await assert.rejects(promesa, /No se pudo cargar Turnstile/);
});

test('la site key se lee del meta que arma el servidor y no del build', () => {
  assert.equal(leerSitio(documentoFalso({ meta: '  clave-publica  ' }).documento), 'clave-publica');
  assert.equal(leerSitio(documentoFalso({ meta: '' }).documento), null);
  assert.equal(leerSitio(documentoFalso().documento), null);

  const fuente = readFileSync(new URL('../src/entrega/turnstile.ts', import.meta.url), 'utf8');
  // Ninguna clave literal ni el nombre de la secreta en el código del navegador.
  assert.doesNotMatch(fuente, /0x[0-9A-Za-z_-]{10,}/);
  assert.doesNotMatch(fuente, /TURNSTILE_SECRET|SECRET_KEY/);
});

test('la CSP vigente permite el origen del script de Turnstile', () => {
  // La política vive en `cabeceras.ts`; el middleware sólo la aplica.
  const cabeceras = readFileSync(new URL('../src/entrega/cabeceras.ts', import.meta.url), 'utf8');
  const middleware = readFileSync(new URL('../src/middleware.ts', import.meta.url), 'utf8');
  assert.match(middleware, /aplicarCabeceras\(/);
  assert.match(cabeceras, /script-src[^"]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(cabeceras, /frame-src https:\/\/challenges\.cloudflare\.com/);
  assert.match(cabeceras, /connect-src[^"]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(SCRIPT_SRC, /^https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js\?render=explicit$/);
});

test('el tamaño compacto se elige debajo de 300 px y se avisa al componente', async () => {
  const { documento } = documentoFalso();
  const { api, llamadas } = apiFalsa();
  const tamanos = [];
  montarTurnstile({
    sitio: 'clave-publica-ficticia',
    contenedor: {},
    documento,
    ventana: {},
    cargar: async () => api,
    onVerify: () => {},
    medirCompacto: () => true,
    onDibujado: compacto => tamanos.push(compacto),
  });
  await esperar(0);
  assert.equal(ANCHO_MINIMO_FLEXIBLE, 300);
  assert.equal(llamadas.render[0].opciones.size, 'compact');
  assert.deepEqual(tamanos, [true]);
});

test('al cruzar el ancho se redibuja, se descarta el token y se elige el otro tamaño', async () => {
  const { documento } = documentoFalso();
  const { api, llamadas } = apiFalsa();
  let compacto = false;
  let expiraciones = 0;
  const tokens = [];
  const tamanos = [];
  const control = montarTurnstile({
    sitio: 'clave-publica-ficticia',
    contenedor: {},
    documento,
    ventana: {},
    cargar: async () => api,
    onVerify: valor => tokens.push(valor),
    onExpire: () => { expiraciones++; },
    medirCompacto: () => compacto,
    onDibujado: valor => tamanos.push(valor),
  });
  await esperar(0);
  assert.equal(llamadas.render.length, 1);
  assert.equal(llamadas.render[0].opciones.size, 'flexible');

  // Sin cruce no se toca el widget ni se descarta el token.
  control.redibujar();
  assert.deepEqual(llamadas.remove, []);
  assert.equal(expiraciones, 0);
  assert.equal(llamadas.render.length, 1);

  compacto = true;
  control.redibujar();
  assert.deepEqual(llamadas.remove, ['widget-1']);
  assert.equal(expiraciones, 1);
  assert.equal(llamadas.render.length, 2);
  assert.equal(llamadas.render[1].opciones.size, 'compact');
  assert.deepEqual(tamanos, [false, true]);

  // El widget viejo ya no entrega tokens; el nuevo sí.
  llamadas.render[0].opciones.callback('token-viejo');
  llamadas.render[1].opciones.callback('token-nuevo');
  assert.deepEqual(tokens, ['token-nuevo']);

  control.desmontar();
  assert.deepEqual(llamadas.remove, ['widget-1', 'widget-2']);
  llamadas.render[1].opciones.callback('token-tarde');
  assert.deepEqual(tokens, ['token-nuevo']);
});

test('el modo demo entrega el token sin cargar el script aunque haya site key', async () => {
  const { documento } = documentoFalso();
  const { api, llamadas } = apiFalsa();
  const estados = [];
  const tokens = [];
  let cargado = false;
  const control = montarTurnstile({
    sitio: 'clave-publica-ficticia',
    demo: true,
    contenedor: {},
    documento,
    ventana: {},
    cargar: async () => { cargado = true; return api; },
    onVerify: valor => tokens.push(valor),
    onEstado: estado => estados.push(estado),
  });
  await esperar(0);
  assert.equal(cargado, false);
  assert.equal(llamadas.render.length, 0);
  assert.deepEqual(estados, ['demo']);
  assert.deepEqual(tokens, [TOKEN_DEMO]);
  assert.equal(TOKEN_DEMO, 'demo');
  control.desmontar();
  control.redibujar();
});

test('el modo demo se lee del meta que sólo emite el servidor local', () => {
  assert.equal(leerDemo(documentoFalso({ demo: '1' }).documento), true);
  assert.equal(leerDemo(documentoFalso({ demo: '0' }).documento), false);
  assert.equal(leerDemo(documentoFalso().documento), false);
  assert.equal(META_DEMO, 'formularios-demo');
});

test('la configuración pública del captcha sale del entorno de runtime', () => {
  assert.deepEqual(configTurnstile({}), { sitio: null, demo: false });
  assert.deepEqual(
    configTurnstile({ PUBLIC_TURNSTILE_SITE_KEY: '  clave-publica  ' }),
    { sitio: 'clave-publica', demo: false },
  );
  // En producción la bandera no habilita nada, aunque esté en 1.
  assert.deepEqual(
    configTurnstile({ APP_STAGE: 'produccion', FORMULARIOS_DEMO: '1' }),
    { sitio: null, demo: false },
  );
  assert.deepEqual(
    configTurnstile({ APP_STAGE: 'local', FORMULARIOS_DEMO: '1' }),
    { sitio: null, demo: true },
  );
  // Una variable vacía no es una site key: el widget queda cerrado.
  assert.deepEqual(configTurnstile({ PUBLIC_TURNSTILE_SITE_KEY: '   ' }), { sitio: null, demo: false });
});

test('el marcador se saca cuando aparece el input del widget, aunque el iframe no esté en el DOM liviano', async () => {
  // Cloudflare deja el iframe dentro de un shadow root: su `load` no llega y
  // antes el marcador quedaba encima hasta el tope de 10 s.
  const Original = globalThis.MutationObserver;
  let observar = null;
  globalThis.MutationObserver = class {
    constructor(fn) { observar = fn; }
    observe() {}
    disconnect() {}
  };
  try {
    const { documento } = documentoFalso();
    const { api } = apiFalsa();
    let hayInput = false;
    const contenedor = {
      querySelector: selector => (selector === 'iframe' ? null : hayInput ? { input: true } : null),
    };
    let montado = false;
    const control = montarTurnstile({
      sitio: 'clave-publica-ficticia',
      contenedor,
      documento,
      ventana: {},
      cargar: async () => api,
      onVerify: () => {},
      onMontado: () => { montado = true; },
    });
    await esperar(0);
    assert.equal(montado, false, 'sin widget dibujado el marcador sigue');

    hayInput = true;
    observar?.();
    assert.equal(montado, true, 'con el input del widget el marcador se retira');
    control.desmontar();
  } finally {
    globalThis.MutationObserver = Original;
  }
});
