import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

const { crearAnalyticsVocacional } = cargarTypescript('lib/vocacional-analytics.ts', {});
function preparar(tipo = 'general', emitir) {
  const eventos = [];
  const control = crearAnalyticsVocacional(tipo, 3, emitir ?? ((nombre, datos) => eventos.push({ nombre, datos })));
  return { control, eventos, nombres: () => eventos.map(e => e.nombre) };
}

test('general: inicio real, preguntas únicas, retroceso, finalización y reinicio', () => {
  const { control: c, eventos, nombres } = preparar();
  c.salir();
  assert.equal(eventos.length, 0);
  c.iniciar(); c.iniciar(); c.avanzar(1); c.volver(0); c.avanzar(1); c.avanzar(2); c.avanzar(3); c.avanzar(3);
  assert.deepEqual(nombres(), ['vocacional-iniciado', 'vocacional-pregunta', 'vocacional-pregunta', 'vocacional-retroceso', 'vocacional-pregunta', 'vocacional-completado']);
  c.salir();
  assert.equal(eventos.length, 6);
  c.reiniciar(); c.salir();
  assert.equal(nombres().at(-1), 'vocacional-reiniciado');
  c.iniciar();
  assert.equal(nombres().filter(n => n === 'vocacional-iniciado').length, 2);
});

test('Teclab: la primera respuesta inicia y actualiza el progreso sin esperar render', () => {
  const { control: c, eventos } = preparar('teclab');
  c.avanzar(1); c.salir(); c.salir();
  assert.deepEqual(eventos.map(e => e.nombre), ['vocacional-iniciado', 'vocacional-pregunta', 'vocacional-pregunta', 'vocacional-salida']);
  assert.deepEqual(eventos.at(-1).datos, { test: 'teclab', pregunta: 2, respondidas: 1, total: 3 });
});

test('ciclo de vida: StrictMode, SPA, pagehide, pestaña oculta y BFCache', async () => {
  const { control: c, nombres } = preparar();
  const ventana = new EventTarget();
  c.iniciar();
  const limpiar = c.conectar(ventana);
  limpiar();
  const limpiarReal = c.conectar(ventana);
  await Promise.resolve();
  assert.equal(nombres().includes('vocacional-salida'), false);
  ventana.dispatchEvent(new Event('visibilitychange'));
  const cache = new Event('pagehide'); Object.defineProperty(cache, 'persisted', { value: true });
  ventana.dispatchEvent(cache); ventana.dispatchEvent(new Event('pageshow'));
  assert.equal(nombres().includes('vocacional-salida'), false);
  ventana.dispatchEvent(new Event('pagehide')); limpiarReal();
  await Promise.resolve();
  assert.equal(nombres().filter(n => n === 'vocacional-salida').length, 1);
  const spa = preparar(); spa.control.iniciar(); spa.control.conectar(ventana)();
  await Promise.resolve();
  assert.equal(spa.nombres().at(-1), 'vocacional-salida');
});

test('CTA sólo categórica y errores de analytics no rompen el recorrido', () => {
  const { control: c, eventos } = preparar();
  c.iniciar(); c.cta('carrera'); c.avanzar(3); c.cta('whatsapp');
  assert.equal(eventos[2].datos.etapa, 'preguntas');
  assert.equal(eventos.at(-1).datos.etapa, 'resultado');
  assert.equal(eventos.at(-1).datos.destino, 'whatsapp');
  const roto = preparar('teclab', () => { throw new Error('sin red'); }).control;
  assert.doesNotThrow(() => { roto.avanzar(1); roto.volver(0); roto.reiniciar(); roto.avanzar(3); roto.cta('oferta'); roto.salir(); });
});

test('emisor reconstruye payload permitido sin filtrar respuestas ni activar Telegram', () => {
  const eventos = [];
  const { trackVocacional } = cargarTypescript('lib/analytics.ts', { '@vercel/analytics': { track: (nombre, datos) => eventos.push({ nombre, datos }) } });
  trackVocacional('vocacional-cta', { test: 'general', pregunta: 2, respondidas: 1, total: 3, destino: 'carrera', etapa: 'preguntas', respuestas: 'secreto', perfil: 'secreto', url: '?email=secreto' });
  assert.deepEqual(eventos[0], { nombre: 'vocacional-cta', datos: { test: 'general', pregunta: 2, respondidas: 1, total: 3, destino: 'carrera', etapa: 'preguntas' } });
});

test('ambos componentes usan el hook y no duplican trackWhatsapp ni puntajes', () => {
  for (const ruta of ['components/test-vocacional/test-vocacional.tsx', 'components/test-vocacional-teclab/test-vocacional-teclab.tsx']) {
    const fuente = readFileSync(ruta, 'utf8');
    assert.match(fuente, /useAnalyticsVocacional\(/);
    assert.doesNotMatch(fuente, /trackWhatsapp/);
    assert.match(fuente, /medicion\.avanzar\(/);
    assert.match(fuente, /medicion\.reiniciar\(/);
  }
});

test('hook conecta y limpia la instancia estable para ambas casas', async t => {
  const anterior = globalThis.window;
  t.after(() => { globalThis.window = anterior; });
  for (const tipo of ['general', 'teclab']) {
    globalThis.window = new EventTarget();
    const eventos = [];
    let efecto;
    const { useAnalyticsVocacional: ejecutarHook } = cargarTypescript('components/test-vocacional/use-analytics-vocacional.ts', {
      react: { useState: crear => [crear()], useEffect: fn => { efecto = fn; } },
      '@/lib/analytics': { trackVocacional: (nombre, datos) => eventos.push({ nombre, datos }) },
      '@/lib/vocacional-analytics': { crearAnalyticsVocacional },
    });
    const medicion = ejecutarHook(tipo, 3);
    const limpiar = efecto();
    assert.equal(eventos.length, 0);
    medicion.avanzar(1);
    limpiar(); await Promise.resolve();
    assert.equal(eventos.at(-1).nombre, 'vocacional-salida');
    assert.equal(eventos.at(-1).datos.test, tipo);
  }
});

test('restauración BFCache conserva preguntas únicas y finalización única', () => {
  const { control: c, nombres } = preparar('teclab');
  const ventana = new EventTarget(); c.conectar(ventana); c.avanzar(1);
  const cache = new Event('pagehide'); Object.defineProperty(cache, 'persisted', { value: true });
  ventana.dispatchEvent(cache); ventana.dispatchEvent(new Event('pageshow'));
  c.avanzar(2); c.avanzar(3); c.avanzar(3);
  assert.equal(nombres().filter(n => n === 'vocacional-iniciado').length, 1);
  assert.equal(nombres().filter(n => n === 'vocacional-completado').length, 1);
  assert.equal(nombres().includes('vocacional-salida'), false);
  c.reiniciar(); c.avanzar(1); c.salir();
  assert.equal(nombres().filter(n => n === 'vocacional-iniciado').length, 2);
  assert.equal(nombres().at(-1), 'vocacional-salida');
});
