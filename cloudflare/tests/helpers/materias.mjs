export const MATERIA_ID = '11111111-1111-1111-1111-111111111111';
export const OTRA_MATERIA_ID = '22222222-2222-2222-2222-222222222222';

export async function insertarMateria(db, cambios = {}) {
  const fila = {
    id: MATERIA_ID, slug: 'materia-sintetica', label: 'Materia sintética',
    nombre_profesor: 'Docente sintético', whatsapp: '1111111111',
    telefono_display: '11 1111-1111', ...cambios,
  };
  // Sólo claves de fixtures controlados, nunca columnas recibidas del público.
  const columnas = Object.keys(fila);
  await db.prepare(`INSERT INTO materias(${columnas.join(',')})
    VALUES (${columnas.map(() => '?').join(',')})`).bind(...Object.values(fila)).run();
}
