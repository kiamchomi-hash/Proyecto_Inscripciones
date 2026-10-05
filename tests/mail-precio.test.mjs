import test from 'node:test';
import { readFileSync } from 'node:fs';
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
const { armarMailPrecio, esIdSuscripcion } = cargarTypescript('components/formularios/mail-precio.ts', {
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

// El cuerpo no lleva titular grande (ocupaba demasiado alto): queda sólo la
// línea chica bajo la píldora. La fecha sigue en el asunto del newsletter.
test('antes del 14/10 no hay titular, sólo la línea de que todavía está a tiempo', () => {
  const { html, texto } = armar({ hoy: dia('2026-10-03') });
  for (const cuerpo of [html, texto]) assert.doesNotMatch(cuerpo, /Las clases arrancan/);
  assert.match(texto, /Todavía estás a tiempo de inscribirte\./);
  assert.match(html, /Todavía estás a tiempo de inscribirte\./);
});

test('entre el 14/10 y el 3/11 queda la línea de que las clases empezaron', () => {
  const { html, texto } = armar({ hoy: dia('2026-10-20') });
  for (const cuerpo of [html, texto]) assert.doesNotMatch(cuerpo, /Tenés tiempo hasta/);
  assert.match(texto, /Las clases empezaron el 14 de octubre\./);
  assert.match(html, /Las clases empezaron el 14 de octubre\./);
});

test('cerrada la inscripción no hay titular ni línea de fechas', () => {
  const { html, texto } = armar({ hoy: dia('2026-11-10') });
  for (const cuerpo of [html, texto]) {
    assert.doesNotMatch(cuerpo, /El precio de tu carrera|arrancan|Tenés tiempo|a tiempo de inscribirte|empezaron/);
  }
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

// «Quiero inscribirme» lleva a la ficha marcada con `desde=mail`: ahí titila
// el botón de inscripción (components/carreras/resaltar-inscripcion.tsx).
test('los enlaces son absolutos: la ficha marcada desde el mail y WhatsApp de Teclab', () => {
  const { html, texto } = armar();
  const slug = taxonomia.carreraToSlug(carrera);
  const inscripcion = `https://www.siglo21sur.com/carreras/${slug}?desde=mail`;
  assert.ok(texto.includes(inscripcion), texto);
  assert.ok(html.includes(`href="${inscripcion}"`));
  assert.match(html, />Quiero inscribirme</);

  const wa = `https://wa.me/${whatsapp.numeroWhatsAppDe('teclab')}?text=${encodeURIComponent(`Hola, quiero consultar por la ${nombreCompleto}`)}`;
  assert.equal(whatsapp.numeroWhatsAppDe('teclab'), '5491132973801');
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

// ── La variante newsletter: misma plantilla, otro asunto y pie con baja ──

const BAJA = 'https://www.siglo21sur.com/newsletter/baja?id=6f1c2a4e-1b2c-4d3e-8f90-a1b2c3d4e5f6';
const newsletter = (extra = {}) => armar({ tipo: 'newsletter', bajaUrl: BAJA, ...extra });

test('sin tipo, el mail sigue siendo el resumen del precio', () => {
  const porDefecto = armar();
  assert.deepEqual(armar({ tipo: 'resumen' }), porDefecto);
  assert.equal(porDefecto.asunto, 'Precio de Programación en Teclab');
});

test('el asunto del newsletter es la carrera corta, la casa y el titular en minúscula', () => {
  assert.equal(newsletter({ hoy: dia('2026-10-03') }).asunto, 'Programación en Teclab: las clases arrancan el 14 de octubre');
  assert.equal(newsletter({ hoy: dia('2026-10-20') }).asunto, 'Programación en Teclab: tenés tiempo hasta el 3 de noviembre');
  assert.equal(newsletter({ hoy: dia('2026-11-10') }).asunto, 'Programación en Teclab: el precio de esta semana');
  for (const hoy of ['2026-10-03', '2026-10-20', '2026-11-10']) {
    assert.equal(/[—–·•]/.test(newsletter({ hoy: dia(hoy) }).asunto), false);
  }
});

test('el pie del newsletter explica el envío y tiene una baja real, escapada', () => {
  const { html, texto } = newsletter();
  const pie = /Te escribimos desde el CAU porque pediste novedades de esta carrera en siglo21sur\.com\./;
  assert.match(html, pie);
  assert.match(texto, pie);
  assert.doesNotMatch(html, /pediste el precio/);
  assert.ok(html.includes(`href="${BAJA}"`), html);
  assert.match(html, />Dejar de recibir novedades<\/a>/);
  assert.ok(texto.includes(`Dejar de recibir novedades: ${BAJA}`), texto);
  assert.equal(html.includes('href="#"'), false);

  const conComillas = newsletter({ bajaUrl: 'https://www.siglo21sur.com/newsletter/baja?id=x"&y=<z>' });
  assert.ok(conComillas.html.includes('href="https://www.siglo21sur.com/newsletter/baja?id=x&quot;&amp;y=&lt;z&gt;"'));
});

test('el newsletter conserva el precio, los accesos y el remate de la plantilla', () => {
  const { html, texto } = newsletter();
  for (const cuerpo of [html, texto]) {
    assert.match(cuerpo, /\$ 552\.359,03/);
    assert.match(cuerpo, /Quiero inscribirme/);
    assert.match(cuerpo, /Para lo que viene sos/);
  }
  assert.equal(/<\/?[a-z][^>]*>/i.test(texto), false);
});

test('el id de la suscripción se valida como UUID', () => {
  assert.equal(esIdSuscripcion('6f1c2a4e-1b2c-4d3e-8f90-a1b2c3d4e5f6'), true);
  assert.equal(esIdSuscripcion('6F1C2A4E-1B2C-4D3E-8F90-A1B2C3D4E5F6'), true);
  for (const malo of ['', 'x', '6f1c2a4e1b2c4d3e8f90a1b2c3d4e5f6', '6f1c2a4e-1b2c-4d3e-8f90-a1b2c3d4e5f6 ', null, undefined, 7]) {
    assert.equal(esIdSuscripcion(malo), false, String(malo));
  }
});

// Restaurar Teclab no debe cambiar el destino de las otras casas.
test('WhatsApp conserva los destinos de Identidad y Siglo 21', () => {
  assert.equal(whatsapp.numeroWhatsAppDe('identidad'), '5491166522722');
  for (const casa of ['siglo21', null, undefined]) {
    assert.equal(whatsapp.numeroWhatsAppDe(casa), '5491132973801');
  }
});

test('el mail de inicio de Teclab apunta al número oficial', () => {
  const html = readFileSync(new URL('../docs/mails/mail-inicio-teclab.html', import.meta.url), 'utf8');
  assert.match(html, /https:\/\/wa\.me\/5491132973801\?/);
  assert.doesNotMatch(html, /5491166522722/);
});
