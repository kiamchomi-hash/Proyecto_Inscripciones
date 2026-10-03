import test from 'node:test';
import assert from 'node:assert/strict';
import * as taxonomia from '../components/index/types.ts';
import * as inicio from '../components/index/inicio-teclab.ts';
import * as cobertura from '../components/formularios/cobertura-pago.ts';
import * as elegirCarrera from '../components/formularios/elegir-carrera.ts';
import * as whatsapp from '../lib/whatsapp.ts';
import * as vigilancia from '../lib/vigilancia-esperado.ts';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

// El módulo importa con el alias `@/`, que Node pelado no resuelve: se carga
// con sus dependencias reales inyectadas.
const { armarMailPrecio } = cargarTypescript('components/formularios/mail-precio.ts', {
  '@/components/formularios/cobertura-pago': cobertura,
  '@/components/formularios/elegir-carrera': elegirCarrera,
  '@/components/index/types': taxonomia,
  '@/components/index/inicio-teclab': inicio,
  '@/lib/whatsapp': whatsapp,
  '@/lib/vigilancia-esperado': vigilancia,
});

const carrera = {
  nombre: 'Programación',
  // Como en la base: el prefijo de Teclab trae la preposición.
  prefix: 'Tecnicatura Superior en',
  nombre_corto: 'Programación',
  duracion: '2 años',
  nivel: 'Teclab - Tecnología',
};

const precio = {
  conceptos: [
    { concepto: 'Matrícula', monto: '$ 64.227,75', descuento: 75 },
    { concepto: 'Bimestre (octubre-noviembre)', monto: '$ 488.131,28', descuento: 24 },
    { concepto: 'Bimestre (diciembre-enero)', monto: '$ 488.131,28', descuento: null },
  ],
  total: '$ 552.359,03',
  nota: 'Ese pago cubre un bimestre de cursada.',
  vigenteHasta: '2026-10-07',
};

// Mediodía en Argentina: el día calendario no depende del huso de la máquina.
const dia = iso => new Date(`${iso}T15:00:00Z`);
const HOY = dia('2026-10-03');
const armar = (extra = {}) => armarMailPrecio({ carrera, precio, hoy: HOY, ...extra });
// El nombre que muestra la ficha. `carreraFullName` arma el slug y se come el
// «Superior»: no sirve para el mail.
const nombreCompleto = 'Tecnicatura Superior en Programación';

test('el asunto nombra la carrera corta y la casa, sin puntuación decorativa', () => {
  assert.equal(armar().asunto, 'Precio de Programación en Teclab');
  const sinCorto = armar({ carrera: { ...carrera, nombre: 'Redes', nombre_corto: '  ' } });
  assert.equal(sinCorto.asunto, 'Precio de Redes en Teclab');
});

test('la píldora lleva el nombre completo de la carrera', () => {
  const { html, texto } = armar();
  assert.ok(html.includes(`>${nombreCompleto}</span>`), html);
  assert.ok(texto.includes(nombreCompleto));
});

test('antes del 14/10 el titular anuncia el inicio de clases', () => {
  const { html, texto } = armar({ hoy: dia('2026-10-03') });
  assert.match(texto, /Las clases arrancan el 14 de octubre/);
  assert.match(texto, /Todavía estás a tiempo de inscribirte\./);
  assert.match(html, /Las clases arrancan el 14(&nbsp;| )de(&nbsp;| )octubre/);
});

test('entre el 14/10 y el 3/11 el titular es el cierre de inscripción', () => {
  const { html, texto } = armar({ hoy: dia('2026-10-20') });
  assert.match(texto, /Tenés tiempo hasta el 3 de noviembre/);
  assert.match(texto, /Las clases empezaron el 14 de octubre\./);
  assert.match(html, /Tenés tiempo hasta el 3(&nbsp;| )de(&nbsp;| )noviembre/);
  assert.doesNotMatch(texto, /arrancan/);
});

test('cerrada la inscripción el titular es neutro y no hay bajada', () => {
  const { html, texto } = armar({ hoy: dia('2026-11-10') });
  assert.match(texto, /El precio de tu carrera/);
  assert.match(html, /El precio de tu carrera/);
  assert.doesNotMatch(texto, /arrancan|Tenés tiempo|a tiempo de inscribirte|empezaron/);
});

test('trae cada concepto, sus descuentos, el total y la promo DD/MM', () => {
  const { html, texto } = armar();
  for (const cuerpo of [html, texto]) {
    assert.match(cuerpo, /Matrícula/);
    assert.match(cuerpo, /Bimestre \(diciembre-enero\)/);
    assert.match(cuerpo, /\$ 64\.227,75/);
    assert.match(cuerpo, /\$ 488\.131,28/);
    assert.match(cuerpo, /-75%/);
    assert.match(cuerpo, /-24%/);
    assert.match(cuerpo, /Total/);
    assert.match(cuerpo, /\$ 552\.359,03/);
    assert.match(cuerpo, /Promo hasta el 07\/10/);
  }
  // Sin descuento no hay porcentaje inventado: hay exactamente dos.
  assert.equal(texto.match(/-\d+%/g).length, 2);
  assert.equal(html.match(/-\d+%<\/span>/g).length, 2);
});

test('dice qué cubre el pago con la duración; sin bimestres, la nota', () => {
  const { html, texto } = armar();
  for (const cuerpo of [html, texto]) assert.match(cuerpo, /4 cuatrimestres \(8 bimestres\)/);

  const curso = armar({
    carrera: { ...carrera, duracion: '4 semanas', nivel: 'Teclab - Curso' },
    precio: { ...precio, conceptos: [{ concepto: 'Pago único', monto: '$ 1', descuento: null }] },
  });
  assert.match(curso.texto, /Ese pago cubre un bimestre de cursada\./);
});

test('los enlaces son absolutos: autoinscripción con el slug y WhatsApp de Teclab', () => {
  const { html, texto } = armar();
  const slug = taxonomia.carreraToSlug(carrera);
  const inscripcion = `https://www.siglo21sur.com/carreras/${slug}?inscripcion=auto#preinscripcion`;
  assert.ok(texto.includes(inscripcion), texto);
  assert.ok(html.includes(`href="${inscripcion}"`));
  assert.match(html, />Quiero inscribirme</);

  const wa = `https://wa.me/${whatsapp.numeroWhatsAppDe('teclab')}?text=${encodeURIComponent(`Hola, quiero consultar por la ${nombreCompleto}`)}`;
  assert.equal(whatsapp.numeroWhatsAppDe('teclab'), '5491166522722');
  assert.ok(texto.includes(wa), texto);
  assert.ok(html.includes(`href="${wa}"`));
  assert.match(html, />Consultar por WhatsApp</);
});

test('el logo se pide por URL pública absoluta, nunca a un archivo local', () => {
  const { html } = armar();
  assert.ok(html.includes('src="https://www.siglo21sur.com/imagenes/teclab/mail/logo-teclab-blanco.png"'));
  assert.equal(html.includes('file://'), false);
});

test('es un resumen transaccional: sin enlace de baja ni enlaces muertos', () => {
  const { html, texto } = armar();
  assert.equal(html.includes('href="#"'), false);
  assert.doesNotMatch(html, /Dejar de recibir/);
  for (const cuerpo of [html, texto]) {
    assert.match(cuerpo, /Te escribimos porque pediste el precio de esta carrera en siglo21sur\.com\./);
    assert.match(cuerpo, /Para lo que viene sos/);
  }
});

test('todo lo interpolado sale escapado en el HTML', () => {
  const malicioso = {
    ...precio,
    conceptos: [{ concepto: '<script>alert("x")</script>', monto: '$ 1 & "2"', descuento: null }],
    total: '<b>$ 3</b>',
  };
  const { html } = armar({ carrera: { ...carrera, nombre: 'Redes <img src=x>' }, precio: malicioso });
  assert.equal(html.includes('<script>'), false);
  assert.equal(html.includes('<img src=x'), false);
  assert.equal(html.includes('<b>$ 3'), false);
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(html, /\$ 1 &amp; &quot;2&quot;/);
});

test('la versión de texto no lleva etiquetas HTML ni puntuación decorativa', () => {
  const { texto, html } = armar();
  assert.equal(/<\/?[a-z][^>]*>/i.test(texto), false, texto);
  assert.equal(/[—–·•]/.test(texto), false, texto);
  assert.equal(/[—–·•]/.test(html), false);
});
