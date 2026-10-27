// Contrato del traslado público, no un respaldo de Supabase ni de sus servicios.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, lstatSync, realpathSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COLUMNAS_CARRERA_PUBLICA, validarSlides } from '../../lib/datos/carrera-detalle.ts';
import { COLUMNAS_MATERIA_FICHA, materiaAFicha } from '../../lib/datos/materia.ts';
import { esCarreraVisible } from '../../components/index/types.ts';

export const BASE = 'https://www.siglo21sur.com';
export const RAIZ = fileURLToPath(new URL('../', import.meta.url));
export const DIRECTORIO = resolve(RAIZ, '.local/datos-publicos');
const columnas = s => [...new Set(s.split(',').map(c => c.trim()))];
export const CONTRATO = {
  carreras: { columnas: columnas(`${COLUMNAS_CARRERA_PUBLICA},created_at,updated_at`), filtros: { activa: 'eq.true' }, booleanos: ['activa','destacada','nueva','proximamente'], json: ['slides'] },
  materias: { columnas: columnas(`${COLUMNAS_MATERIA_FICHA},activa,created_at,updated_at`), filtros: { activa: 'eq.true' }, booleanos: ['activa','en_construccion','modo_manana'], json: ['descripcion','imagenes','dias_bloqueados','horarios_bloqueados','texto_seo'] },
  novedades: { columnas: columnas('id,titulo,contenido,extracto,fecha,tag,imagen_url,href,slug,pinned,publicada,created_at,updated_at'), filtros: { publicada: 'eq.true' }, booleanos: ['pinned','publicada'], json: [] },
  faq_preguntas: { columnas: columnas('id,titulo,descripcion,respuesta,created_at,updated_at,estado,destacada,orden,modo'), filtros: { estado: 'eq.aprobada', destacada: 'eq.true', modo: 'eq.publica' }, booleanos: ['destacada'], json: [] },
};
export const PRIVADAS = ['consultas','solicitudes_clase','suscripciones_newsletter','precios_privados','reservas_mail_precio','enlaces_inscripcion','robot_autoinscripciones','form_rate_limits','career_clicks','outbox','outbox_reclamos','newsletter_envios'];
export const huella = valor => createHash('sha256').update(JSON.stringify(valor)).digest('hex');
export function resumenTablas(tablas) {
  return Object.fromEntries(Object.entries(tablas).map(([tabla, filas]) => [tabla, { filas: filas.length, sha256: huella(filas) }]));
}
export function validarSnapshot(s) {
  assert.equal(s.version, 1, 'Versión de snapshot no admitida');
  assert.deepEqual(Object.keys(s).sort(), ['tablas','version']);
  assert.deepEqual(Object.keys(s.tablas).sort(), Object.keys(CONTRATO).sort(), 'Sólo cuatro tablas públicas');
  for (const [tabla, spec] of Object.entries(CONTRATO)) {
    assert.ok(Array.isArray(s.tablas[tabla]));
    let anterior;
    for (const f of s.tablas[tabla]) {
      assert.deepEqual(Object.keys(f).sort(), [...spec.columnas].sort(), `Columnas públicas de ${tabla}`);
      if (tabla === 'materias') assert.match(f.id, /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i);
      else assert.ok(Number.isSafeInteger(f.id) && f.id > 0, 'ID entero seguro requerido');
      assert.ok(anterior === undefined || f.id > anterior, 'IDs únicos y ordenados'); anterior = f.id;
      for (const [c, v] of Object.entries(f)) {
        if (spec.booleanos.includes(c)) assert.equal(typeof v, 'boolean', `Booleano ${tabla}.${c}`);
        else if (spec.json.includes(c)) {
          assert.ok(v === null || Array.isArray(v), `JSON de ${tabla}.${c}`);
          assert.ok(Buffer.byteLength(JSON.stringify(v)) < 1_500_000, 'JSON excede margen de D1');
        }
        else assert.ok(v === null || typeof v === 'string' || (typeof v === 'number' && Number.isSafeInteger(v)), `Tipo ${tabla}.${c}`);
        if (['slug'].includes(c) && v !== null) assert.match(v, /^[a-z0-9]+(?:-[a-z0-9]+)*$/i, 'Slug sin rutas arbitrarias');
        if (c.endsWith('_at') || c === 'fecha') {
          assert.equal(typeof v, 'string', 'Fecha pública requerida');
          assert.ok(Number.isFinite(Date.parse(v)), 'Fecha válida requerida');
        }
        if (typeof v === 'string') assert.ok(Buffer.byteLength(v) < 1_500_000, 'Celda excede margen de D1');
      }
      if (tabla === 'carreras') {
        assert.ok(f.activa && esCarreraVisible(f), 'Carrera fuera de oferta');
        assert.deepEqual(validarSlides(f.slides, f.id), f.slides, 'Slides con campos fuera de proyección pública');
      }
      if (tabla === 'materias') { assert.ok(f.activa); materiaAFicha(f); }
      if (tabla === 'novedades') assert.ok(f.publicada);
      if (tabla === 'faq_preguntas') assert.ok(f.estado === 'aprobada' && f.destacada && f.modo === 'publica');
    }
  }
  return s;
}
export function normalizarFila(tabla, fila) {
  const spec = CONTRATO[tabla];
  const f = Object.fromEntries(spec.columnas.map(c => [c, fila[c]]));
  if (tabla === 'carreras') f.slides = validarSlides(f.slides, f.id);
  // Las CHECK locales de materia/FAQ exigen milisegundos ISO. No se cambia el
  // instante por la fecha del traslado; el origen conserva su precisión original.
  if (['materias','faq_preguntas'].includes(tabla)) {
    for (const c of ['created_at','updated_at']) f[c] = new Date(f[c]).toISOString();
  }
  return f;
}
export function asegurarDirectorio() {
  // Nunca seguir symlinks desde .local hacia otra base o carpeta pública.
  let p = RAIZ;
  for (const parte of ['.local','datos-publicos']) {
    p = resolve(p, parte);
    if (existsSync(p)) assert.ok(lstatSync(p).isDirectory() && !lstatSync(p).isSymbolicLink());
    else mkdirSync(p, { mode: 0o700 });
  }
}
export function escribirPrivado(path, valor) {
  assert.ok(!relative(DIRECTORIO, resolve(path)).startsWith('..'));
  assert.equal(realpathSync(dirname(path)), resolve(dirname(path)));
  writeFileSync(path, JSON.stringify(valor), { mode: 0o600, flag: 'wx' });
}
export function ultimoSnapshot() {
  const puntero = JSON.parse(readFileSync(resolve(DIRECTORIO, 'ultimo.json'), 'utf8'));
  assert.match(puntero.lote, /^[0-9TZ.-]+-[0-9a-f-]{36}$/);
  const dir = resolve(DIRECTORIO, puntero.lote);
  assert.equal(realpathSync(dir), dir);
  for (const nombre of ['snapshot.json','fuente-seo.json','manifest.json']) {
    assert.ok(!lstatSync(resolve(dir, nombre)).isSymbolicLink());
  }
  const s = JSON.parse(readFileSync(resolve(dir, 'snapshot.json'), 'utf8'));
  const manifest = JSON.parse(readFileSync(resolve(dir, 'manifest.json'), 'utf8'));
  assert.equal(huella(s), manifest.snapshotSha256, 'Huella del snapshot alterada');
  return { dir, snapshot: validarSnapshot(s), manifest, seo: JSON.parse(readFileSync(resolve(dir, 'fuente-seo.json'), 'utf8')) };
}
