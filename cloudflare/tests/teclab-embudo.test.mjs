import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { crearD1 } from './helpers/d1.mjs';
import { manejarAlertaAnalytics } from '../src/api/alertas-analytics.ts';
import { MAXIMO_POR_IP, registrarEventoTeclab } from '../src/datos/teclab-embudo.ts';
import {
  EVENTOS_TECLAB, PASOS_FICHA_TECLAB, PASOS_MODAL_TECLAB, PASOS_TECLAB, SUPERFICIES_TECLAB,
  crearMedicionTeclab, ctaDelEnlace,
} from '../../lib/teclab-embudo.ts';

// El modal de Teclab no cambia la URL y la ficha es una sola página larga: sin
// esta tabla no se sabía en qué parte se iba la gente ni desde dónde escribía.
// Estas pruebas fijan el contador del servidor y las reglas de una visita.

const hash = ip => createHash('sha256').update(ip).digest('hex');

const pedirAlerta = (cuerpo, headers = {}) => new Request('https://local.test/api/alertas-analytics', {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(cuerpo),
});

const filas = db => db.prepare(
  `SELECT fecha, superficie, carrera, evento, paso, movil, veces FROM teclab_embudo
   ORDER BY superficie, carrera, evento, paso, movil`,
).all().then(r => r.results);

test('cada paso se cuenta por día, superficie, carrera, evento, paso y dispositivo, sin aviso', async t => {
  const { db } = await crearD1(t);
  const enviados = [];
  const telegram = async texto => { enviados.push(texto); return true; };
  const carrera = 'tecnicatura-superior-en-programacion';

  const pasos = [
    { superficie: 'modal', carrera, evento: 'alcanzado', paso: 'portada', movil: 1 },
    { superficie: 'modal', carrera, evento: 'alcanzado', paso: 'portada', movil: 1 },
    { superficie: 'modal', carrera, evento: 'whatsapp', paso: 'precio', movil: 1 },
    { superficie: 'ficha', carrera, evento: 'alcanzado', paso: 'faq', movil: 0 },
    { superficie: 'ficha', carrera, evento: 'cerrado', paso: 'plan', movil: 1 },
    { superficie: 'ficha', carrera, evento: 'consulta', paso: 'formulario', movil: 0 },
  ];
  for (const [n, datos] of pasos.entries()) {
    const r = await manejarAlertaAnalytics(
      pedirAlerta({ evento: 'teclab-embudo', datos }, { 'cf-connecting-ip': `198.51.100.${n + 1}` }),
      db, { telegram },
    );
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
  }

  const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
  assert.deepEqual(await filas(db), [
    { fecha: hoy, superficie: 'ficha', carrera, evento: 'alcanzado', paso: 'faq', movil: 0, veces: 1 },
    { fecha: hoy, superficie: 'ficha', carrera, evento: 'cerrado', paso: 'plan', movil: 1, veces: 1 },
    { fecha: hoy, superficie: 'ficha', carrera, evento: 'consulta', paso: 'formulario', movil: 0, veces: 1 },
    { fecha: hoy, superficie: 'modal', carrera, evento: 'alcanzado', paso: 'portada', movil: 1, veces: 2 },
    { fecha: hoy, superficie: 'modal', carrera, evento: 'whatsapp', paso: 'precio', movil: 1, veces: 1 },
  ]);
  assert.deepEqual(enviados, []);
});

test('un dato fuera de la lista, o de la otra superficie, no se guarda', async t => {
  const { db } = await crearD1(t);
  const cabeceras = { 'cf-connecting-ip': '198.51.100.20' };
  const base = { superficie: 'ficha', carrera: 'tecnicatura-en-redes', evento: 'alcanzado', paso: 'portada', movil: 0 };
  const invalidos = [
    { ...base, superficie: 'home' },
    { ...base, superficie: undefined },
    { ...base, carrera: '/' },
    { ...base, carrera: 'Con Mayusculas' },
    { ...base, carrera: 'a'.repeat(121) },
    { ...base, evento: 'abierto' },
    { ...base, paso: 'inexistente' },
    // «precio» y «cierre» son slides del modal; «faq», una sección de la ficha.
    { ...base, paso: 'precio' },
    { ...base, superficie: 'modal', paso: 'faq' },
    // El modal no tiene relacionadas ni formulario propio.
    { ...base, superficie: 'modal', evento: 'relacionada' },
    { ...base, superficie: 'modal', evento: 'consulta' },
    { ...base, movil: 2 },
    { ...base, movil: '1' },
  ];
  for (const datos of invalidos) {
    const r = await manejarAlertaAnalytics(pedirAlerta({ evento: 'teclab-embudo', datos }, cabeceras), db, {});
    assert.equal(r.status, 200, JSON.stringify(datos));
    assert.deepEqual(await r.json(), { ok: false }, JSON.stringify(datos));
  }
  assert.deepEqual(await filas(db), []);
});

test('la migración acepta exactamente lo que manda el navegador', () => {
  // La última migración que define la tabla (0018 rehízo el CHECK de pasos).
  const migracion = readFileSync(new URL('../migrations/0018_teclab_embudo_preinscripcion.sql', import.meta.url), 'utf8');
  const lista = nombre => migracion.match(new RegExp(`${nombre} IN \\(([^)]*)\\)`))[1]
    .split(',').map(v => v.trim().replace(/'/g, ''));
  assert.deepEqual(lista('superficie'), [...SUPERFICIES_TECLAB]);
  assert.deepEqual(lista('evento'), [...EVENTOS_TECLAB]);
  assert.deepEqual(lista('paso'), [...PASOS_TECLAB]);
  for (const paso of [...PASOS_MODAL_TECLAB, ...PASOS_FICHA_TECLAB]) {
    assert.ok(PASOS_TECLAB.includes(paso), paso);
  }
});

test('las claves de los slides del modal son los pasos declarados', () => {
  const modal = readFileSync(new URL('../../components/index/teclab-modal.tsx', import.meta.url), 'utf8');
  const claves = [...modal.matchAll(/key: '([a-z]+)'/g)].map(m => m[1]);
  assert.deepEqual([...new Set(claves)].sort(), [...PASOS_MODAL_TECLAB].sort());
});

test('cada IP tiene cupo y la IP no se guarda en claro', async t => {
  const { db } = await crearD1(t);
  const ip = '198.51.100.30';
  const clave = `teclab-embudo:${hash(ip)}`;
  const datos = { superficie: 'ficha', carrera: 'tecnicatura-en-redes', evento: 'alcanzado', paso: 'portada', movil: 1 };

  assert.equal(await registrarEventoTeclab(db, datos, ip), true);
  const claves = await db.prepare('SELECT key FROM form_rate_limits').all().then(r => r.results.map(f => f.key));
  assert.ok(claves.includes(clave));
  assert.ok(claves.every(k => !k.includes(ip)));

  await db.prepare('UPDATE form_rate_limits SET request_count = ?1 WHERE key = ?2').bind(MAXIMO_POR_IP, clave).run();
  assert.equal(await registrarEventoTeclab(db, datos, ip), false);
  assert.equal((await filas(db))[0].veces, 1);
});

test('una visita: cada paso una vez, las CTA terminales anulan el cierre y las otras no', () => {
  const emitidos = [];
  const modal = crearMedicionTeclab((e, p) => emitidos.push(`${e}:${p}`), ['whatsapp', 'inscripcion']);
  modal.alcanzar('portada');
  modal.alcanzar('plan');
  modal.alcanzar('portada');
  modal.cerrar('plan');
  modal.cerrar('plan');
  assert.deepEqual(emitidos, ['alcanzado:portada', 'alcanzado:plan', 'cerrado:plan']);

  const conCta = [];
  const otra = crearMedicionTeclab((e, p) => conCta.push(`${e}:${p}`), ['whatsapp', 'inscripcion']);
  otra.cta('whatsapp', 'precio');
  otra.cta('whatsapp', 'precio');
  otra.cerrar('precio');
  assert.deepEqual(conCta, ['whatsapp:precio']);

  // En la ficha, inscribirse baja al formulario: irse después sigue contando.
  const ficha = [];
  const f = crearMedicionTeclab((e, p) => ficha.push(`${e}:${p}`), ['whatsapp', 'relacionada', 'consulta']);
  f.cta('inscripcion', 'portada');
  f.cerrar('formulario');
  assert.deepEqual(ficha, ['inscripcion:portada', 'cerrado:formulario']);

  const rota = crearMedicionTeclab(() => { throw new Error('sin red'); }, []);
  assert.doesNotThrow(() => { rota.alcanzar('portada'); rota.cerrar('portada'); });
});

test('qué enlaces son una CTA', () => {
  const actual = '/carreras/tecnicatura-en-redes';
  assert.equal(ctaDelEnlace('https://wa.me/5491100000000?text=hola', actual), 'whatsapp');
  assert.equal(ctaDelEnlace('#preinscripcion', actual), 'inscripcion');
  assert.equal(ctaDelEnlace('#formulario', actual), 'inscripcion');
  assert.equal(ctaDelEnlace('/carreras/tecnicatura-en-redes/inscripcion', actual), 'inscripcion');
  assert.equal(ctaDelEnlace('/carreras/tecnicatura-en-seguros', actual), 'relacionada');
  assert.equal(ctaDelEnlace(actual, actual), null);
  assert.equal(ctaDelEnlace('/#carreras', actual), null);
  assert.equal(ctaDelEnlace('#plan', actual), null);
});
