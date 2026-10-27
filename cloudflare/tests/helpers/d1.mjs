import assert from 'node:assert/strict';
import { createTestHarness } from 'wrangler';

export async function crearD1(t, migrar = true, migrationsDir = './migrations') {
  const server = createTestHarness({ workers: [{ config: {
    name: 'cau-d1-fixture',
    main: './tests/fixtures/worker-d1.mjs',
    compatibility_date: '2026-10-24',
    dev: { ip: '127.0.0.1', port: 0 },
    d1_databases: [{
      binding: 'DB', database_name: 'cau-d1-fixture',
      database_id: '00000000-0000-0000-0000-000000000001',
      migrations_dir: migrationsDir, remote: false,
    }],
  } }] });
  t.after(() => server.close());
  const { url } = await server.listen();
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  const worker = server.getWorker();
  const { DB } = await worker.getEnv();
  if (migrar) await worker.applyD1Migrations('DB');
  return { db: DB, worker };
}

export async function insertarCarrera(db, id = 1, cambios = {}) {
  const fila = {
    id, nombre: 'Carrera sintética', nivel: 'Pregrado', modalidad: 'A distancia',
    activa: 1, proximamente: 0, destacada: 0, nueva: 0, orden: null,
    ...cambios,
  };
  // Sólo columnas del fixture controlado, no parámetros del sitio ni red externa.
  const columnas = Object.keys(fila);
  await db.prepare(`INSERT INTO carreras (${columnas.join(',')}) VALUES (${columnas.map((_, i) => `?${i + 1}`).join(',')})`)
    .bind(...Object.values(fila)).run();
}

export async function insertarPrecio(db, carreraId = 1, cambios = {}) {
  const fila = {
    carrera_id: carreraId, institucion: 'fixture', conceptos: '[]',
    total: 'importe sintético', nota: null, vigente_hasta: '2028-02-29', ...cambios,
  };
  const columnas = Object.keys(fila);
  await db.prepare(`INSERT INTO precios_privados (${columnas.join(',')}) VALUES (${columnas.map((_, i) => `?${i + 1}`).join(',')})`)
    .bind(...Object.values(fila)).run();
}
