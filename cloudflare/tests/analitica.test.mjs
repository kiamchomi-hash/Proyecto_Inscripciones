import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { registrarAlias } from './helpers/alias.mjs';

// `lib/analytics.ts` importa `@/lib/analytics-destino`. En este paquete el alias
// apunta al registrador local, sin red. El gancho es sólo resolución de módulos.
registrarAlias();
registerHooks({
  resolve(especificador, contexto, siguiente) {
    if (especificador === '@/lib/analytics-destino') {
      return {
        url: pathToFileURL(new URL('../src/entrega/analitica.ts', import.meta.url).pathname).href,
        shortCircuit: true,
      };
    }
    return siguiente(especificador, contexto);
  },
});

const { registrarEvento, leerEventos, limpiarEventos, MAX_EVENTOS } = await import('../src/entrega/analitica.ts');
const { sendGAEvent } = await import('../src/entrega/next-third-parties.ts');
const analytics = await import('../../lib/analytics.ts');

function instalarVentana({ romperDispatch = false } = {}) {
  const despachados = [];
  const ventana = {
    __cauAnalitica: [],
    dispatchEvent(evento) {
      if (romperDispatch) throw new Error('sin DOM');
      despachados.push(evento);
      return true;
    },
    addEventListener() {},
    removeEventListener() {},
    navigator: {},
    matchMedia: () => ({ matches: false }),
    location: { href: 'https://local.test/' },
  };
  globalThis.window = ventana;
  globalThis.CustomEvent = class CustomEvent {
    constructor(tipo, init) {
      this.type = tipo;
      this.detail = init?.detail;
    }
  };
  return { ventana, despachados };
}

function restaurarVentana() {
  delete globalThis.window;
  delete globalThis.CustomEvent;
}

function capturarConsola(t) {
  const llamadas = [];
  const originales = new Map();
  for (const nivel of ['log', 'info', 'warn', 'error']) {
    originales.set(nivel, console[nivel]);
    console[nivel] = (...argumentos) => llamadas.push({ nivel, argumentos });
  }
  t.after(() => {
    for (const [nivel, original] of originales) console[nivel] = original;
  });
  return llamadas;
}

test('analítica local: eventos planos, sin red, sin claves privadas y sin consola', async t => {
  const { despachados } = instalarVentana();
  t.after(restaurarVentana);
  const consola = capturarConsola(t);
  const llamadas = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    llamadas.push({ url: String(url), init });
    return new Response('{}', { status: 200 });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const registro = registrarEvento('consulta', {
    origen: 'home', carrera: 'Tecnicatura en Programación',
    email: 'persona@example.invalid', nombre: 'Ana', telefono: '11 1234-5678',
    extra: { anidado: true }, n: 2, ok: true,
  });
  assert.ok(registro);
  assert.equal(registro.evento, 'consulta');
  assert.deepEqual(registro.datos, { origen: 'home', carrera: 'Tecnicatura en Programación', n: 2, ok: true });
  assert.equal(despachados.length, 1);
  assert.equal(despachados[0].type, 'cau:analitica');
  assert.deepEqual(despachados[0].detail, registro);
  assert.equal(llamadas.length, 0, 'registrar un evento no hace red');
  assert.equal(consola.length, 0, 'no se registra nada en consola');

  // La firma real de `lib/analytics` llega al mismo registrador.
  analytics.trackInicioFormulario('home', 'contacto');
  analytics.trackFormularioVisto('teclab', 'preinscripcion');
  analytics.trackConsulta('home', 'Carrera X', 'preinscripcion');
  analytics.trackPreguntaFaq('privada');
  analytics.trackSolicitudClase(2);
  analytics.trackMateriaClase('Matemática');
  analytics.trackDiaClase('Matemática');
  analytics.trackHorarioClase('Matemática', '18:00-20:00');
  analytics.trackVocacional('vocacional-iniciado', {
    test: 'general', pregunta: 1, respondidas: 0, total: 10,
  });

  const nombres = leerEventos().map(evento => evento.evento);
  for (const nombre of [
    'formulario-iniciado', 'formulario-visto', 'consulta', 'pregunta-faq',
    'solicitud-clase', 'clase-materia', 'clase-dia', 'clase-horario', 'vocacional-iniciado',
  ]) assert.ok(nombres.includes(nombre), nombre);
  assert.equal(llamadas.length, 0, 'ningún track() sale a la red');

  // El aviso de fallo sí usa el endpoint propio, con un cuerpo sin datos personales.
  analytics.avisarFalloFormularioContacto('contacto', 'red');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].url, '/api/alertas-analytics');
  assert.equal(llamadas[0].init.method, 'POST');
  const cuerpo = JSON.parse(llamadas[0].init.body);
  assert.deepEqual(cuerpo, { evento: 'formulario-fallo', datos: { origen: 'contacto', motivo: 'red' } });
  assert.doesNotMatch(llamadas[0].init.body, /example\.invalid|persona@|1234/);

  // Google no se carga ni se llama: el helper compartido deja el evento local.
  sendGAEvent('event', 'career_card_click', { career_name: 'Carrera X', career_level: 'Pregrado' });
  assert.ok(leerEventos().some(evento => evento.evento === 'ga-career_card_click'));
  assert.equal(llamadas.length, 1);

  assert.equal(consola.length, 0, 'ni los eventos ni el fallo se escriben en consola');
});

test('analítica local: un DOM roto no interrumpe y la cola tiene tope', async t => {
  instalarVentana({ romperDispatch: true });
  t.after(restaurarVentana);
  const antes = leerEventos().length;
  const registro = registrarEvento('formulario-visto', { origen: 'home', modo: 'contacto' });
  assert.ok(registro, 'el evento se guarda aunque dispatchEvent falle');
  assert.equal(leerEventos().length, antes + 1);

  limpiarEventos();
  for (let i = 0; i < MAX_EVENTOS + 25; i += 1) registrarEvento('prueba', { i });
  const cola = leerEventos();
  assert.equal(cola.length, MAX_EVENTOS);
  assert.equal(cola.at(-1).datos.i, MAX_EVENTOS + 24);
});

test('analítica local: sin ventana no hace nada y nunca lanza', () => {
  delete globalThis.window;
  assert.equal(registrarEvento('prueba', { a: 1 }), null);
  assert.deepEqual(leerEventos(), []);
  limpiarEventos();
  assert.doesNotThrow(() => analytics.trackConsulta('home', null, null));
});
