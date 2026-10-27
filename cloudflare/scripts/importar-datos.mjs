import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { CONTRATO, PRIVADAS, validarSnapshot, resumenTablas, ultimoSnapshot } from './datos-publicos.mjs';
export { validarSnapshot, resumenTablas } from './datos-publicos.mjs';

function aD1(tabla, fila) {
  return Object.fromEntries(Object.entries(fila).map(([c,v]) => [c,
    CONTRATO[tabla].booleanos.includes(c) ? Number(v) : CONTRATO[tabla].json.includes(c) && v !== null ? JSON.stringify(v) : v]));
}
function deD1(tabla, fila) {
  return Object.fromEntries(Object.entries(fila).map(([c,v]) => [c,
    CONTRATO[tabla].booleanos.includes(c) ? v === 1 : CONTRATO[tabla].json.includes(c) && v !== null ? JSON.parse(v) : v]));
}
async function privadasVacias(db) {
  const filas = {};
  for (const tabla of PRIVADAS) {
    filas[tabla] = await db.prepare(`SELECT count(*) AS n FROM ${tabla}`).first('n');
    assert.equal(filas[tabla], 0, `Destino no vacío: ${tabla}`);
  }
  return filas;
}
export function validarDestinoImportacion(destino) {
  assert.ok(destino && ['local', 'staging'].includes(destino.etapa), 'Etapa explícita local/staging requerida');
  assert.equal(destino.remoto, false, 'Destino remoto no autorizado: sólo local explícito');
  assert.equal(typeof destino.nombre, 'string');
  assert.match(destino.nombre, destino.etapa === 'staging'
    ? /^cau-staging-[a-z0-9]+(?:-[a-z0-9]+)*$/ : /^cau-(?:publico|d1|local)-[a-z0-9-]+$/);
  assert.doesNotMatch(destino.nombre, /(?:^|-)(?:prod|production|produccion)(?:-|$)/);
}

export async function importarPublico(db, snapshot, opciones = {}) {
  assert.ok(opciones.dryRun === true || opciones.escribir === true, 'Sin flag explícito no se importa');
  assert.ok(!(opciones.dryRun && opciones.escribir), 'Modos excluyentes');
  validarDestinoImportacion(opciones.destino);
  validarSnapshot(snapshot);
  // Dry-run no toca siquiera el binding: valida datos/destino y calcula el plan.
  // No promete que una base remota exista ni que admita estos datos.
  if (opciones.dryRun) return { dryRun: true, tablas: resumenTablas(snapshot.tablas) };
  await privadasVacias(db);
  const actuales = {};
  for (const [tabla, spec] of Object.entries(CONTRATO)) {
    actuales[tabla] = (await db.prepare(`SELECT ${spec.columnas.join(',')} FROM ${tabla} ORDER BY id`).all()).results.map(f => deD1(tabla, f));
  }
  if (Object.values(actuales).some(f => f.length)) {
    assert.deepEqual(resumenTablas(actuales), resumenTablas(snapshot.tablas), 'Destino ya ocupado: no se mezcla ni se sobrescribe');
    return { repeticion: true };
  }
  const sentencias = [];
  for (const [tabla, filas] of Object.entries(snapshot.tablas)) for (const fila of filas) {
    const f = aD1(tabla, fila);
    // Se conserva el ID y el texto público de FAQ, pero nunca su contacto.
    // La columna heredada exige NOT NULL: vacío significa deliberadamente
    // «no trasladado», no un contacto inventado ni una dirección ficticia.
    if (tabla === 'faq_preguntas') f.contacto = '';
    const cols = Object.keys(f);
    sentencias.push(db.prepare(`INSERT INTO ${tabla} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).bind(...Object.values(f)));
  }
  // Un único batch local y atómico: no quedan tablas parcialmente cargadas.
  if (sentencias.length) await db.batch(sentencias);
  return { repeticion: false };
}
export async function verificarPublico(db, snapshot) {
  validarSnapshot(snapshot);
  const tablas = {};
  for (const [tabla, spec] of Object.entries(CONTRATO)) {
    const filas = (await db.prepare(`SELECT ${spec.columnas.join(',')} FROM ${tabla} ORDER BY id`).all()).results;
    tablas[tabla] = filas.map(f => deD1(tabla, f));
  }
  const resumen = resumenTablas(tablas);
  assert.deepEqual(resumen, resumenTablas(snapshot.tablas), 'Conteos/IDs/campos/huellas distintos');
  const privadas = await privadasVacias(db);
  const fk = (await db.prepare('PRAGMA foreign_key_check').all()).results;
  assert.deepEqual(fk, [], 'Referencias inválidas');
  assert.equal(await db.prepare("SELECT count(*) AS n FROM sqlite_master WHERE type='trigger'").first('n'), 0);
  assert.equal(await db.prepare("SELECT count(*) AS n FROM faq_preguntas WHERE contacto <> '' OR nombre_contacto IS NOT NULL").first('n'), 0);
  return { tablas: resumen, privadas, fk };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  if (process.argv.length !== 3 || process.argv[2] !== '--dry-run') {
    console.error('Importación sin CLI arbitraria: sólo --dry-run; escrituras requieren destino local explícito en el ensayo.');
    process.exitCode = 2;
  } else {
    const { snapshot } = ultimoSnapshot();
    console.log(JSON.stringify(await importarPublico(null, snapshot, {
      dryRun: true, destino: { etapa: 'staging', remoto: false, nombre: 'cau-staging-plan' },
    })));
  }
}
