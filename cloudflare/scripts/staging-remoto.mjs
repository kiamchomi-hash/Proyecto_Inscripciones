// Plan puro: no llama a Cloudflare, no lee credenciales y no tiene CLI de deploy.
import assert from 'node:assert/strict';
import { CONTRATO, validarSnapshot, resumenTablas } from './datos-publicos.mjs';

export function validarDestinoRemoto(destino, observado) {
  assert.equal(destino.autorizado, 'staging-publico-protegido');
  assert.match(destino.nombre, /^cau-staging-[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.doesNotMatch(destino.nombre, /(?:^|-)(?:prod|production|produccion|local|dev)(?:-|$)/);
  assert.match(destino.id, /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/);
  assert.notEqual(destino.id, '00000000-0000-0000-0000-000000000001');
  assert.equal(observado.nombre, destino.nombre);
  assert.equal(observado.id, destino.id);
  assert.equal(observado.creadoParaStaging, true);
  assert.equal(destino.cuenta, observado.cuenta);
  assert.match(destino.cuenta, /^[a-f0-9]{32}$/);
  return true;
}

export function planImportacionRemota(snapshot, destino, observado) {
  validarDestinoRemoto(destino, observado);
  validarSnapshot(snapshot);
  const consultas = [];
  for (const [tabla, filas] of Object.entries(snapshot.tablas)) for (const fila of filas) {
    const spec = CONTRATO[tabla];
    const columnas = [...spec.columnas];
    const params = columnas.map(c => spec.booleanos.includes(c) ? Number(fila[c])
      : spec.json.includes(c) && fila[c] !== null ? JSON.stringify(fila[c]) : fila[c]);
    if (tabla === 'faq_preguntas') { columnas.push('contacto'); params.push(''); }
    consultas.push({ sql: `INSERT INTO ${tabla} (${columnas.join(',')}) VALUES (${columnas.map(()=>'?').join(',')})`, params });
  }
  return { consultas, tablas: resumenTablas(snapshot.tablas) };
}

export function validarPublicacionStaging(config, destino, observado) {
  validarDestinoRemoto(destino, observado);
  const permitidas = ['name','main','account_id','compatibility_date','compatibility_flags','workers_dev',
    'preview_urls','vars','assets','d1_databases','triggers','observability','upload_source_maps'];
  assert.ok(Object.keys(config).every(k => permitidas.includes(k)), 'Config fuera del alcance staging');
  assert.equal(config.name, destino.nombre);
  assert.equal(config.account_id, destino.cuenta);
  assert.equal(config.main, '../../staging/publicar-worker.ts');
  assert.deepEqual(config.compatibility_flags, ['nodejs_compat']);
  assert.equal(config.compatibility_date, '2026-10-25');
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, false);
  assert.deepEqual(config.triggers, { crons: [] });
  assert.deepEqual(config.observability, { enabled: false });
  assert.equal(config.upload_source_maps, false);
  assert.deepEqual(config.assets, { directory: '../../dist/client', binding: 'ASSETS', run_worker_first: true });
  // El ensayo de correo es opcional y se declara con dos variables como máximo.
  // El destinatario autorizado vive sólo en la configuración privada, nunca en
  // el repositorio; habilitar sin él no tiene sentido y se rechaza.
  const { STAGING_CORREO_PARA: para, STAGING_CORREO_HABILITADO: habilitado,
    STAGING_FORMULARIO_HABILITADO: formulario, PUBLIC_TURNSTILE_SITE_KEY: sitekey,
    TURNSTILE_EXPECTED_HOSTNAME: hostname, ...base } = config.vars ?? {};
  assert.deepEqual(base, { APP_STAGE:'staging', DB_STAGE:'staging', DB_NAME:destino.nombre,
    STAGING_ACCESS:'basic-sha256', OUTBOUND_MODE:'disabled' });
  if (habilitado !== undefined) assert.ok(['si', 'no'].includes(habilitado), 'Estado de correo inválido');
  if (para !== undefined) {
    assert.equal(para, para.trim().toLowerCase());
    assert.match(para, /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/);
  }
  if (habilitado === 'si') assert.ok(para, 'Habilitar el correo exige destinatario autorizado');
  if (formulario !== undefined) assert.ok(['si', 'no'].includes(formulario), 'Estado de formulario inválido');
  if (hostname !== undefined) {
    assert.ok(hostname.startsWith(config.name + '.') && hostname.endsWith('.workers.dev'), 'Hostname no corresponde a este staging');
    assert.match(hostname, /^[a-z0-9.-]+$/);
  }
  if (sitekey !== undefined && sitekey !== '') assert.match(sitekey, /^0x[a-zA-Z0-9_-]+$/);
  if (formulario === 'si') {
    assert.ok(para && sitekey && hostname, 'Formulario exige allowlist y widget staging');
    assert.notEqual(habilitado, 'si', 'No habilitar correo y formulario a la vez');
  }
  assert.deepEqual(config.d1_databases, [{ binding:'DB', database_name:destino.nombre, database_id:destino.id, remote:true }]);
  return true;
}
