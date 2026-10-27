// Sólo datos sintéticos. Se siembran en bases efímeras, nunca en la compartida.
export const SUSCRIPCION_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
export const MATERIAS = [
  { id: '11111111-1111-1111-1111-111111111111', slug: 'matematica', label: 'Matemática', orden: 1 },
  { id: '22222222-2222-2222-2222-222222222222', slug: 'computacion', label: 'Computación', orden: 2, modo_manana: true },
  { id: '33333333-3333-3333-3333-333333333333', slug: 'arte', label: 'Arte', orden: 3, en_construccion: true },
  { id: '44444444-4444-4444-4444-444444444444', slug: 'oculta', label: 'Oculta', orden: 0, activa: false },
].map(m => ({ nombre_profesor: 'Docente sintético', whatsapp: '1111111111', telefono_display: '11 1111-1111',
  activa: true, en_construccion: false, modo_manana: false, descripcion: ['Descripción sintética de la materia.'],
  imagenes: ['/imagenes/imagenes_cau/Foto-entrada.webp'], dias_bloqueados: [], horarios_bloqueados: [], texto_seo: ['Información sintética de las clases.'], ...m }));
export const FAQS = Array.from({ length: 9 }, (_, i) => ({
  id: i + 1, titulo: `Pregunta sintética ${i + 1}`, descripcion: 'Descripción de prueba',
  respuesta: i === 1 ? 'Respuesta </script><script> local & segura.' : 'Respuesta sintética para la prueba.',
  estado: i === 7 ? 'pendiente' : 'aprobada', destacada: i !== 8, orden: i === 0 ? null : i,
  created_at: `2026-10-${String(10 + i).padStart(2, '0')}T00:00:00.000Z`,
  modo: 'publica', contacto: 'privado@example.invalid', nombre_contacto: 'Contacto privado',
}));

function valor(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return String(v);
  return `'${(typeof v === 'object' ? JSON.stringify(v) : v).replaceAll("'", "''")}'`;
}
export function sqlApoyoFaq() {
  const lineas = [];
  for (const [tabla, filas] of [['materias', MATERIAS], ['faq_preguntas', FAQS], ['suscripciones_newsletter', [{ id: SUSCRIPCION_ID, email: 'baja@example.invalid' }]]]) {
    for (const fila of filas) lineas.push(`INSERT INTO ${tabla} (${Object.keys(fila).join(',')}) VALUES (${Object.values(fila).map(valor).join(',')});`);
  }
  return lineas.join('\n');
}
export async function insertarApoyoFaq(db) {
  for (const sentencia of sqlApoyoFaq().split(';').filter(s => s.trim())) await db.prepare(sentencia).run();
}
