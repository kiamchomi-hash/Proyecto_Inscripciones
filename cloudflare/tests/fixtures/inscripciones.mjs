import { CAMPOS, camposDe, columnaDe } from '../../../components/formularios/casas.ts';

// Capacidad y datos estrictamente sintéticos; nunca se despachan transportes.
const valores = Object.fromEntries(camposDe('teclab', 'preinscripcion').map(id =>
  [id, CAMPOS[id].opciones?.[0] ?? 'Dato sintético']));
Object.assign(valores, { nombre: 'Ana', apellido: 'Sintética', dni: '12345678',
  email: 'ana.sintetica@example.invalid', telefono: '1111111111', fechaNacimiento: '1990-01-01' });
export const CONSULTAS = [{ id: 900, casa: 'teclab', tipo_formulario: 'preinscripcion', carrera: 'Tecnicatura en Programación',
  ...Object.fromEntries(camposDe('teclab', 'preinscripcion').map(id => [columnaDe(CAMPOS[id]), valores[id]])) }];
export const PRECIOS = [{ carrera_id: 19, institucion: 'Teclab', conceptos: [{ concepto: 'Matrícula (fixture)', monto: '$ 123.456', descuento: null }],
  total: '$ 123.456', nota: 'Precio sintético', vigente_hasta: '2099-01-01' }];

const valor = v => v == null ? 'NULL' : typeof v === 'number' ? String(v)
  : `'${(typeof v === 'object' ? JSON.stringify(v) : String(v)).replaceAll("'", "''")}'`;
export function sqlInscripciones() {
  return [['consultas', CONSULTAS], ['precios_privados', PRECIOS]]
    .flatMap(([tabla, filas]) => filas.map(f => `INSERT INTO ${tabla}(${Object.keys(f).join(',')}) VALUES (${Object.values(f).map(valor).join(',')});`)).join('\n');
}
export async function insertarInscripciones(db) {
  for (const sql of sqlInscripciones().split('\n')) await db.prepare(sql).run();
}
