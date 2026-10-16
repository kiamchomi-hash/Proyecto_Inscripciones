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
  assert.equal(armar().asunto, 'Precios - Programación - Teclab');
  const sinCorto = armar({ carrera: { ...carrera, nombre: 'Redes', nombre_corto: '  ' } });
  assert.equal(sinCorto.asunto, 'Precios - Redes - Teclab');
});

test('la píldora lleva el nombre completo de la carrera', () => {
  const { html, texto } = armar();
  assert.ok(html.includes(`>${nombreCompleto}</span>`), html);
  assert.ok(texto.includes(nombreCompleto));
});

// El cuerpo no lleva línea de fechas ni de inicio: la fecha queda en el aviso de
// la ficha, no en el mail.
test('el mail de Teclab no tiene línea de fechas, con o sin inscripción abierta', () => {
  for (const hoy of ['2026-10-03', '2026-10-20', '2026-11-10']) {
    const { html, texto } = armar({ hoy: dia(hoy) });
    for (const cuerpo of [html, texto]) {
      assert.doesNotMatch(cuerpo, /Todavía estás a tiempo|Las clases empezaron|Las clases arrancan|Tenés tiempo hasta|El precio de tu carrera/);
    }
  }
});

test('trae cada concepto, el total y la vigencia DD/MM, sin descuentos', () => {
  const { html, texto } = armar();
  for (const cuerpo of [html, texto]) {
    assert.match(cuerpo, /Matrícula/);
    assert.match(cuerpo, /Bimestre 2 \(diciembre-enero\)/);
    assert.match(cuerpo, /\$ 64\.227,75/);
    assert.match(cuerpo, /\$ 488\.131,28/);
    assert.doesNotMatch(cuerpo, /-75%|-24%|Descuento/);
    assert.match(cuerpo, /Total/);
    assert.match(cuerpo, /\$ 552\.359,03/);
    assert.match(cuerpo, /Precio vigente hasta el 07\/10/);
  }
});

test('dice qué cubre el pago y que el cuatrimestre siguiente se vuelve a pagar; sin bimestres, la nota', () => {
  const { html, texto } = armar();
  for (const cuerpo of [html, texto]) assert.match(cuerpo, /El cuatrimestre siguiente requiere un nuevo pago de matrícula y bimestres\./);

  const curso = armar({
    carrera: { ...carrera, duracion: '4 semanas', nivel: 'Teclab - Curso' },
    precio: { ...precio, conceptos: [{ concepto: 'Pago único', monto: '$ 1', descuento: null }] },
  });
  assert.match(curso.texto, /Ese pago cubre un bimestre de cursada\./);
});

// «Quiero inscribirme» lleva a la página dedicada de inscripción de la carrera.
test('los enlaces son absolutos: la inscripción dedicada y WhatsApp de Teclab', () => {
  const { html, texto } = armar();
  const slug = taxonomia.carreraToSlug(carrera);
  const inscripcion = `https://www.siglo21sur.com/carreras/${slug}/inscripcion`;
  assert.ok(texto.includes(inscripcion), texto);
  assert.ok(html.includes(`href="${inscripcion}"`));
  assert.match(html, />Quiero inscribirme</);

  const wa = `https://wa.me/${whatsapp.numeroWhatsAppDe('teclab')}?text=${encodeURIComponent(`Hola, quiero consultar por la ${nombreCompleto}`)}`;
  assert.equal(whatsapp.numeroWhatsAppDe('teclab'), '5491132973801');
  assert.ok(texto.includes(wa), texto);
  assert.ok(html.includes(`href="${wa}"`));
  assert.match(html, />Consultar por WhatsApp</);
});

test('WhatsApp no duplica el prefijo cuando Data Science ya tiene el nombre completo', () => {
  const { html, texto } = armar({
    carrera: {
      ...carrera,
      nombre: 'Tecnicatura Superior en Data Science',
      nombre_corto: 'Data Science',
    },
  });
  const enlace = texto.match(/Consultar por WhatsApp: (\S+)/)[1];
  assert.equal(new URL(enlace).searchParams.get('text'),
    'Hola, quiero consultar por la Tecnicatura Superior en Data Science');
  assert.ok(html.includes(`href="${enlace}"`));
  assert.ok(html.includes('>Tecnicatura Superior en Data Science</span>'));
});

test('el logo se pide por URL pública absoluta, nunca a un archivo local', () => {
  const { html } = armar();
  assert.ok(html.includes('src="https://www.siglo21sur.com/imagenes/teclab/mail/logo-teclab-blanco.png"'));
  assert.equal(html.includes('file://'), false);
});

test('es un resumen transaccional: sin enlace de baja ni enlaces muertos', () => {
  const { html, texto } = armar();
  assert.equal(html.includes('href="#"'), false);
  assert.doesNotMatch(html, /Anular suscripción/);
  for (const cuerpo of [html, texto]) {
    assert.match(cuerpo, /Te escribimos porque pediste el precio de esta carrera en siglo21sur\.com\./);
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
  assert.equal(porDefecto.asunto, 'Precios - Programación - Teclab');
});

test('el newsletter usa el mismo asunto que el resumen, sin la fecha de inicio', () => {
  for (const hoy of ['2026-10-03', '2026-10-20', '2026-11-10']) {
    const { asunto } = newsletter({ hoy: dia(hoy) });
    assert.equal(asunto, 'Precios - Programación - Teclab');
    assert.equal(/[—–·•]/.test(asunto), false);
  }
});

test('el pie del newsletter explica el envío y tiene una baja real, escapada', () => {
  const { html, texto } = newsletter();
  const pie = /Te escribimos desde el CAU porque pediste novedades de esta carrera en siglo21sur\.com\./;
  assert.match(html, pie);
  assert.match(texto, pie);
  assert.doesNotMatch(html, /pediste el precio/);
  assert.ok(html.includes(`href="${BAJA}"`), html);
  assert.match(html, />Anular suscripción<\/a>/);
  assert.ok(texto.includes(`Anular suscripción: ${BAJA}`), texto);
  assert.equal(html.includes('href="#"'), false);

  const conComillas = newsletter({ bajaUrl: 'https://www.siglo21sur.com/newsletter/baja?id=x"&y=<z>' });
  assert.ok(conComillas.html.includes('href="https://www.siglo21sur.com/newsletter/baja?id=x&quot;&amp;y=&lt;z&gt;"'));
});

test('el newsletter conserva el precio y los accesos de la plantilla', () => {
  const { html, texto } = newsletter();
  for (const cuerpo of [html, texto]) {
    assert.match(cuerpo, /\$ 552\.359,03/);
    assert.match(cuerpo, /Quiero inscribirme/);
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

test('Siglo 21 muestra lista 2027 y enlaza la preinscripción sin mensajes de Teclab', () => {
  const mail = armar({ carrera: { nombre: 'Abogacía', nivel: 'Grado' }, precio: { ...precio, nota: 'Precios de lista 2027.', conceptos: [
    { concepto: 'Matrícula 2027', monto: '$ 100', descuento: null },
    { concepto: 'Bimestre 1 2027', monto: '$ 200', descuento: null },
    { concepto: 'Bimestre 2 2027', monto: '$ 300', descuento: null },
  ] } });
  assert.match(mail.asunto, /Universidad Siglo 21/);
  for (const contenido of [mail.html, mail.texto]) {
    assert.match(contenido, /\/carreras\/abogacia\/inscripcion/);
    assert.doesNotMatch(contenido, /Teclab|Promo|imprescindible/);
    assert.match(contenido, /Bimestre 2 2027/);
  }
});

test('el mail de Siglo 21 dice qué cubre el pago, igual que el de Teclab, con un solo texto', () => {
  const carreraSiglo = { nombre: 'Administración', prefix: 'Licenciatura en', nombre_corto: 'Administración', duracion: '4 años', nivel: 'Licenciaturas' };
  const aclaracion = 'Este pago cubre la matrícula y los bimestres detallados. El cuatrimestre siguiente requiere un nuevo pago de matrícula y bimestres.';
  for (const hoy of ['2026-10-03', '2026-11-10']) {
    const mail = armar({ carrera: carreraSiglo, hoy: dia(hoy) });
    assert.ok(mail.html.includes(aclaracion), mail.html);
    assert.ok(mail.texto.includes(aclaracion), mail.texto);
  }
});

test('en Siglo 21 las cuotas se muestran como bimestres numerados, igual que en Teclab', () => {
  const mail = armar({
    carrera: { nombre: 'Administración', prefix: 'Licenciatura en', nombre_corto: 'Administración', duracion: '4 años', nivel: 'Licenciaturas' },
    precio: { ...precio, conceptos: [
      { concepto: 'Matrícula', monto: '$ 50.000,00', descuento: null },
      { concepto: 'Cuota mensual', monto: '$ 120.000,00', descuento: null },
      { concepto: 'Cuota mensual', monto: '$ 120.000,00', descuento: null },
    ] },
  });
  for (const cuerpo of [mail.html, mail.texto]) {
    assert.match(cuerpo, /Bimestre 1/);
    assert.match(cuerpo, /Bimestre 2/);
    assert.doesNotMatch(cuerpo, /Cuota mensual/);
  }
});
