import test from 'node:test';
import assert from 'node:assert/strict';

import { inicioTeclab, fechaArgentina } from '../components/index/inicio-teclab.ts';
import { esCursoTeclab, esTeclab } from '../components/index/teclab.ts';

const tecnicatura = { nivel: 'Teclab - Tecnología' };
const gestion = { nivel: 'Teclab - Gestión' };
const curso = { nivel: 'Teclab - Curso' };

// Mediodia en Argentina (UTC-3): el dia calendario no depende del huso de la maquina.
const dia = (iso) => new Date(`${iso}T15:00:00Z`);

test('la tecnicatura muestra el inicio mientras la inscripcion esta abierta', () => {
  assert.deepEqual(inicioTeclab(tecnicatura, dia('2026-10-02')), {
    inicio: '2026-10-14',
    inicioTexto: '14 de octubre',
    abierta: true,
    empezo: false,
    hasta: '2026-11-03',
    hastaTexto: '3 de noviembre',
  });
  assert.equal(inicioTeclab(gestion, dia('2026-10-02'))?.inicioTexto, '14 de octubre');
});

test('el ultimo dia de inscripcion todavia se muestra', () => {
  assert.equal(inicioTeclab(tecnicatura, dia('2026-11-03'))?.inicio, '2026-10-14');
});

test('antes del inicio la tecnicatura todavia no empezo', () => {
  assert.equal(inicioTeclab(tecnicatura, dia('2026-10-13'))?.empezo, false);
});

test('desde el dia de inicio y hasta el cierre, la tecnicatura ya empezo', () => {
  const r = inicioTeclab(tecnicatura, dia('2026-10-14'));
  assert.equal(r?.empezo, true);
  assert.equal(r?.hastaTexto, '3 de noviembre');
  assert.equal(inicioTeclab(tecnicatura, dia('2026-11-03'))?.empezo, true);
});

test('el curso nunca figura como empezado: se vende hasta el dia anterior', () => {
  const r = inicioTeclab(curso, dia('2026-10-12'));
  assert.equal(r?.empezo, false);
  assert.equal(r?.hastaTexto, '12 de octubre');
});

test('cerrada la inscripcion de la tecnicatura no se muestra nada', () => {
  assert.equal(inicioTeclab(tecnicatura, dia('2026-11-04')), null);
});

test('el curso muestra la edicion cuya venta contiene el dia de hoy', () => {
  assert.equal(inicioTeclab(curso, dia('2026-10-12'))?.inicioTexto, '13 de octubre');
  assert.equal(inicioTeclab(curso, dia('2026-10-13'))?.inicioTexto, '17 de noviembre');
  assert.equal(inicioTeclab(curso, dia('2026-11-16'))?.inicio, '2026-11-17');
});

test('fuera de toda ventana de venta el curso no muestra nada', () => {
  assert.equal(inicioTeclab(curso, dia('2026-11-17')), null);
  assert.equal(inicioTeclab(curso, dia('2026-09-07')), null);
});

test('las carreras que no son de Teclab no muestran nada', () => {
  assert.equal(inicioTeclab({ nivel: 'Licenciatura' }, dia('2026-10-02')), null);
  assert.equal(inicioTeclab({ nivel: 'Identidad Argentina' }, dia('2026-10-02')), null);
});

test('el dia se toma en hora de Argentina y no en UTC', () => {
  // 01:00 UTC del 4 de noviembre son las 22:00 del 3 en Buenos Aires.
  const noche = new Date('2026-11-04T01:00:00Z');
  assert.equal(fechaArgentina(noche), '2026-11-03');
  assert.equal(inicioTeclab(tecnicatura, noche)?.inicio, '2026-10-14');
  assert.equal(inicioTeclab(tecnicatura, new Date('2026-11-04T03:00:00Z')), null);
});

test('la clasificacion coincide con la de ./teclab', () => {
  // El modulo no puede importar valores de ./teclab (node --test no resuelve
  // imports sin extension), asi que repite los niveles: aca se cuida que no
  // se desfasen.
  for (const nivel of ['Teclab - Tecnología', 'Teclab - Gestión', 'Teclab - Curso', 'Licenciatura', 'Identidad Argentina']) {
    const esDeTeclab = esTeclab({ nivel }) || esCursoTeclab({ nivel });
    assert.equal(inicioTeclab({ nivel }, dia('2026-10-02')) !== null, esDeTeclab, nivel);
  }
});

test('nunca se muestra un codigo de periodo', () => {
  for (const c of [tecnicatura, curso]) {
    const r = inicioTeclab(c, dia('2026-10-02'));
    assert.doesNotMatch(r.inicioTexto, /\d[AB]\b|bimestre/i);
  }
});
