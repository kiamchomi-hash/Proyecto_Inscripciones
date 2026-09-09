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
  analytics.trackInicioFormulario('contacto', 'contacto');
  assert.deepEqual(eventos, [
    { nombre: 'consulta', datos: { origen: 'contacto', carrera: 'sin especificar', tipo: 'sin especificar' } },
    { nombre: 'whatsapp', datos: { origen: '/teclab' } },
    { nombre: 'pregunta-faq', datos: { modo: 'privada' } },
    { nombre: 'solicitud-clase', datos: { materias: 2 } },
    { nombre: 'formulario-iniciado', datos: { origen: 'contacto', modo: 'contacto' } },
  ]);
});
