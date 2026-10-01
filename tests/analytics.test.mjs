import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

test('los eventos de conversión conservan origen y los avisos no llevan datos personales', async t => {
  const eventos = [];
  const avisos = [];
  const ventanaAnterior = globalThis.window;
  const fetchAnterior = globalThis.fetch;
  t.after(() => {
    globalThis.window = ventanaAnterior;
    globalThis.fetch = fetchAnterior;
  });
  globalThis.window = {
    navigator: { userAgentData: { mobile: true } },
    matchMedia: () => ({ matches: false }),
  };
  globalThis.fetch = async (url, opciones) => {
    avisos.push({ url, cuerpo: JSON.parse(opciones.body) });
    return new Response(null, { status: 200 });
  };
  const analytics = cargarTypescript('lib/analytics.ts', { '@vercel/analytics': { track: (nombre, datos) => eventos.push({ nombre, datos }) } });
  analytics.trackConsulta('contacto', null, null);
  analytics.trackWhatsapp('/teclab');
  analytics.trackPreguntaFaq('privada');
  analytics.trackSolicitudClase(2);
  analytics.trackMateriaClase('matematica');
  analytics.trackDiaClase('matematica');
  analytics.trackHorarioClase('matematica', '14:00-15:00');
  analytics.trackWhatsappClase('matematica');
  analytics.avisarFalloFormularioContacto('contacto', 'servidor');
  analytics.trackInicioFormulario('contacto', 'contacto');
  analytics.trackFormularioVisto('home', 'preinscripcion');
  analytics.trackCtaInscripcion('preinscripcion');
  analytics.trackAbandonoFormulario('home', 'preinscripcion', 'dni', 'validacion', 3);
  assert.deepEqual(eventos, [
    { nombre: 'consulta', datos: { origen: 'contacto', carrera: 'sin especificar', tipo: 'sin especificar' } },
    { nombre: 'whatsapp', datos: { origen: '/teclab' } },
    { nombre: 'pregunta-faq', datos: { modo: 'privada' } },
    { nombre: 'solicitud-clase', datos: { materias: 2 } },
    { nombre: 'clase-materia', datos: { materia: 'matematica' } },
    { nombre: 'clase-dia', datos: { materia: 'matematica' } },
    { nombre: 'clase-horario', datos: { materia: 'matematica', horario: '14:00-15:00' } },
    { nombre: 'clase-whatsapp', datos: { materia: 'matematica' } },
    { nombre: 'formulario-iniciado', datos: { origen: 'contacto', modo: 'contacto' } },
    { nombre: 'formulario-visto', datos: { origen: 'home', modo: 'preinscripcion' } },
    { nombre: 'cta-inscripcion', datos: { destino: 'preinscripcion' } },
    { nombre: 'formulario-abandonado', datos: { origen: 'home', modo: 'preinscripcion', ultimo_campo: 'dni', motivo: 'validacion', campos_completados: 3 } },
  ]);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(avisos.filter(aviso => ['whatsapp', 'clase-whatsapp', 'formulario-fallo'].includes(aviso.cuerpo.evento)), [
    { url: '/api/alertas-analytics', cuerpo: { evento: 'whatsapp', datos: { origen: '/teclab' } } },
    { url: '/api/alertas-analytics', cuerpo: { evento: 'clase-whatsapp', datos: { materia: 'matematica' } } },
    { url: '/api/alertas-analytics', cuerpo: { evento: 'formulario-fallo', datos: { origen: 'contacto', motivo: 'servidor' } } },
  ]);
});

test('el aviso general de WhatsApp se limita a dispositivos móviles sin enviar datos del dispositivo', async t => {
  const avisos = [];
  const ventanaAnterior = globalThis.window;
  const fetchAnterior = globalThis.fetch;
  t.after(() => {
    globalThis.window = ventanaAnterior;
    globalThis.fetch = fetchAnterior;
  });
  globalThis.fetch = async (_url, opciones) => {
    avisos.push(JSON.parse(opciones.body));
    return new Response(null, { status: 200 });
  };
  const analytics = cargarTypescript('lib/analytics.ts', { '@vercel/analytics': { track: () => {} } });

  globalThis.window = {
    navigator: { userAgentData: { mobile: false } },
    matchMedia: () => ({ matches: true }),
  };
  analytics.trackWhatsapp('/escritorio');
  globalThis.window = {
    navigator: {},
    matchMedia: consulta => ({ matches: consulta.includes('pointer: coarse') }),
  };
  analytics.trackWhatsapp('/movil-sin-client-hints');

  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(avisos, [
    { evento: 'whatsapp', datos: { origen: '/movil-sin-client-hints' } },
  ]);
});

test('sólo una falla de red o del servidor cuenta como fallo técnico del formulario', () => {
  const analytics = cargarTypescript('lib/analytics.ts', { '@vercel/analytics': { track: () => {} } });
  assert.equal(analytics.tipoFalloTecnicoFormulario(null), 'red');
  assert.equal(analytics.tipoFalloTecnicoFormulario(500), 'servidor');
  assert.equal(analytics.tipoFalloTecnicoFormulario(503), 'servidor');
  assert.equal(analytics.tipoFalloTecnicoFormulario(400), null);
  assert.equal(analytics.tipoFalloTecnicoFormulario(403), null);
  assert.equal(analytics.tipoFalloTecnicoFormulario(429), null);
});
