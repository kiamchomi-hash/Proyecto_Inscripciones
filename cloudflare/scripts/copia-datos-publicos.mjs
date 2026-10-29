import assert from 'node:assert/strict';
import { CONTRATO, normalizarFila, validarSnapshot } from './datos-publicos.mjs';
import { esCarreraVisible } from '../../components/index/types.ts';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Sólo las proyecciones públicas aprobadas: jamás se consulta una tabla privada
// ni el contacto de la persona que hizo una pregunta. El binding de origen lo
// suministra el llamador; este módulo no abre conexiones ni escribe archivos.
const CONDICIONES = {
  carreras: 'activa = 1',
  materias: 'activa = 1',
  novedades: 'publicada = 1',
  faq_preguntas: "estado = 'aprobada' AND destacada = 1 AND modo = 'publica'",
};

export async function extraerDatosPublicos(db) {
  const tablas = {};
  for (const [tabla, spec] of Object.entries(CONTRATO)) {
    const sql = `SELECT ${spec.columnas.join(',')} FROM ${tabla} WHERE ${CONDICIONES[tabla]} ORDER BY id`;
    const resultado = await db.prepare(sql).all();
    assert.ok(Array.isArray(resultado.results), `Lectura incompleta de ${tabla}`);
    const filas = resultado.results.map(fila => {
      const convertida = { ...fila };
      for (const columna of spec.booleanos) {
        assert.ok(fila[columna] === 0 || fila[columna] === 1, `Booleano inválido: ${tabla}.${columna}`);
        convertida[columna] = fila[columna] === 1;
      }
      for (const columna of spec.json) {
        convertida[columna] = fila[columna] === null ? null : JSON.parse(fila[columna]);
      }
      return normalizarFila(tabla, convertida);
    });
    tablas[tabla] = tabla === 'carreras' ? filas.filter(esCarreraVisible) : filas;
  }
  return validarSnapshot({ version: 1, tablas });
}

/** Adaptador de sólo lectura para la herramienta D1 existente. Nunca escribe SQL. */
export function lectorD1Produccion({ ejecutar = promisify(execFile) } = {}) {
  const script = fileURLToPath(new URL('../../herramientas/d1.mjs', import.meta.url));
  const permitidas = new Set(Object.entries(CONTRATO).map(([tabla, spec]) =>
    `SELECT ${spec.columnas.join(',')} FROM ${tabla} WHERE ${CONDICIONES[tabla]} ORDER BY id`));
  return {
    prepare(sql) {
      assert.ok(permitidas.has(sql), 'Consulta fuera del contrato público');
      return {
        async all() {
          const { stdout } = await ejecutar(process.execPath, [script, sql], {
            encoding: 'utf8', maxBuffer: 128 * 1024 * 1024,
          });
          const results = stdout.split('\n').filter(Boolean).map(linea => JSON.parse(linea));
          return { results };
        },
      };
    },
  };
}

/** SQL de carga para una D1 efímera migrada; no incluye tablas privadas. */
export function sqlDatosPublicos(snapshot) {
  validarSnapshot(snapshot);
  const valor = v => v === null ? 'NULL'
    : typeof v === 'boolean' ? (v ? '1' : '0')
    : typeof v === 'number' ? String(v)
    : `'${(typeof v === 'string' ? v : JSON.stringify(v)).replaceAll("'", "''")}'`;
  const sentencias = [];
  for (const [tabla, spec] of Object.entries(CONTRATO)) {
    for (const fila of snapshot.tablas[tabla]) {
      const columnas = [...spec.columnas];
      const valores = columnas.map(c => valor(fila[c]));
      // La tabla heredada exige contacto no nulo pero no se traslada el dato.
      if (tabla === 'faq_preguntas') { columnas.push('contacto'); valores.push("''"); }
      sentencias.push(`INSERT INTO ${tabla} (${columnas.join(',')}) VALUES (${valores.join(',')});`);
    }
  }
  return `${sentencias.join('\n')}\n`;
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  try {
    assert.deepEqual(process.argv.slice(2), ['--sql'], 'Sólo se admite --sql');
    const origen = lectorD1Produccion();
    const primero = await extraerDatosPublicos(origen);
    const segundo = await extraerDatosPublicos(origen);
    assert.deepEqual(segundo, primero, 'Los datos cambiaron durante la lectura; repetir');
    process.stdout.write(sqlDatosPublicos(primero));
  } catch (error) {
    console.error(`No se pudo preparar la copia pública: ${error.message}`);
    process.exitCode = 1;
  }
}
