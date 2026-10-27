import { CAMPOS, camposDe, columnaDe } from '../../../components/formularios/casas.ts';

/** Sólo fixtures sintéticos: no importa consultas reales ni envía inscripciones. */
export async function insertarConsulta(db, cambios = {}) {
  const valores = {};
  for (const id of camposDe('teclab', 'preinscripcion')) {
    valores[id] = CAMPOS[id].opciones?.[0] ?? 'Fixture sintético';
  }
  Object.assign(valores, { dni: '12345678', email: 'fixture@example.invalid', telefono: '1111111111', fechaNacimiento: '1990-01-01' });
  const fila = { casa: 'teclab', tipo_formulario: 'preinscripcion', carrera: 'Carrera sintética' };
  for (const id of camposDe('teclab', 'preinscripcion')) fila[columnaDe(CAMPOS[id])] = valores[id];
  Object.assign(fila, cambios);
  const columnas = Object.keys(fila);
  return db.prepare(`INSERT INTO consultas(${columnas.join(',')}) VALUES (${columnas.map((_, i) => `?${i + 1}`).join(',')}) RETURNING id`)
    .bind(...Object.values(fila)).first('id');
}
