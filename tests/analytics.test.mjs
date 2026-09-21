import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

test('los eventos de conversión conservan origen y no llevan datos personales', () => {
  const eventos = [];
  const analytics = cargarTypescript('lib/analytics.ts', { '@vercel/analytics': { track: (nombre, datos) => eventos.push({ nombre, datos }) } });
  analytics.trackConsulta('contacto', null, null);
  analytics.trackWhatsapp('/teclab');
  analytics.trackPreguntaFaq('privada');
  analytics.trackSolicitudClase(2);
  analytics.trackMateriaClase('matematica');
  analytics.trackDiaClase('matematica');
  analytics.trackHorarioClase('matematica', '14:00-15:00');
  analytics.trackWhatsappClase('matematica');
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
});
