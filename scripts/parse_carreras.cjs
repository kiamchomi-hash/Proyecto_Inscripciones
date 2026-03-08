/**
 * Script para parsear datos_carreras.json, limpiar fullText
 * y separar en secciones para Supabase.
 */
const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'migracion_pendiente', 'datos_carreras.json'), 'utf8'
));

// Patrones de saludo a eliminar
const greetingPatterns = [
  /^Hola[_ ]*\n/i,
  /^Gracias por contactarnos\n?/i,
  /^Te escribe Analia[^\n]*\n?/i,
];

function cleanFullText(text) {
  if (!text) return null;
  let cleaned = text.trim();

  // Remove greeting lines (first 1-3 lines)
  const lines = cleaned.split('\n');
  let startIdx = 0;
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (
      /^Hola/i.test(line) ||
      /^Gracias por contactarnos/i.test(line) ||
      /^Te escribe Analia/i.test(line) ||
      line === ''
    ) {
      startIdx = i + 1;
    } else {
      break;
    }
  }
  cleaned = lines.slice(startIdx).join('\n').trim();
  return cleaned;
}

function extractSections(text) {
  if (!text) return { seccion_duracion: null, seccion_modalidad: null, plan_estudios: null };

  const cleaned = cleanFullText(text);
  if (!cleaned) return { seccion_duracion: null, seccion_modalidad: null, plan_estudios: null };

  // Find "PLAN DE ESTUDIOS" marker
  const planIdx = cleaned.search(/PLAN DE ESTUDIOS/i);

  // Find modalidad marker (DISTRIBUIDA HOME VIRTUAL or similar)
  const modalIdx = cleaned.search(/DISTRIBUIDA HOME VIRTUAL|La misma está disponible/i);

  // Find duration marker
  const durIdx = cleaned.search(/La carrera.*tiene una duración|tiene una duración/i);

  let seccion_duracion = null;
  let seccion_modalidad = null;
  let plan_estudios = null;

  if (planIdx > -1) {
    plan_estudios = cleaned.slice(planIdx).trim();
  }

  const endOfModalidad = planIdx > -1 ? planIdx : cleaned.length;

  if (durIdx > -1) {
    // Duration goes from durIdx to either modalIdx or planIdx
    const endOfDur = modalIdx > durIdx ? modalIdx : endOfModalidad;
    seccion_duracion = cleaned.slice(durIdx, endOfDur).trim();
  }

  if (modalIdx > -1) {
    seccion_modalidad = cleaned.slice(modalIdx, endOfModalidad).trim();
  }

  // If no sections found, put everything in seccion_duracion
  if (!seccion_duracion && !seccion_modalidad && !plan_estudios) {
    seccion_duracion = cleaned;
  }

  // Clean up: remove emoji arrows and excessive whitespace
  const cleanSection = (s) => {
    if (!s) return null;
    return s.replace(/👇\n?/g, '').replace(/\n{3,}/g, '\n\n').trim();
  };

  return {
    seccion_duracion: cleanSection(seccion_duracion),
    seccion_modalidad: cleanSection(seccion_modalidad),
    plan_estudios: cleanSection(plan_estudios),
  };
}

// Mapping level -> category for ordering
const categoryOrder = {
  'Grado': 1,
  'Grado (CCC)': 2,
  'Pregrado (Tecnicatura)': 3,
  'Posgrado': 4,
  'Certificación': 5,
  'APLV - Extragrado': 6,
  'Curso': 7,
};

const carreras = [];
let orden = 1;

for (const [nombre, data] of Object.entries(raw)) {
  const sections = extractSections(data.fullText);

  carreras.push({
    nombre,
    nivel: data.level,
    duracion: data.duration,
    titulo: data.degree,
    enfoque: data.focus,
    precio: data.price,
    descripcion: data.description,
    seccion_duracion: sections.seccion_duracion,
    seccion_modalidad: sections.seccion_modalidad,
    plan_estudios: sections.plan_estudios,
    imagenes: [],
    orden: orden++,
    activa: true,
  });
}

// Sort by category then original order
carreras.sort((a, b) => {
  const ca = categoryOrder[a.nivel] || 99;
  const cb = categoryOrder[b.nivel] || 99;
  if (ca !== cb) return ca - cb;
  return a.orden - b.orden;
});

// Reassign orden after sort
carreras.forEach((c, i) => c.orden = i + 1);

// Output stats
console.log(`Total: ${carreras.length} carreras`);
console.log(`Con secciones parseadas:`);
console.log(`  - seccion_duracion: ${carreras.filter(c => c.seccion_duracion).length}`);
console.log(`  - seccion_modalidad: ${carreras.filter(c => c.seccion_modalidad).length}`);
console.log(`  - plan_estudios: ${carreras.filter(c => c.plan_estudios).length}`);

// Show a sample
console.log('\n--- MUESTRA: Escribanía ---');
const sample = carreras.find(c => c.nombre === 'Escribanía');
if (sample) {
  console.log('DURACIÓN:', sample.seccion_duracion?.slice(0, 150), '...');
  console.log('MODALIDAD:', sample.seccion_modalidad?.slice(0, 150), '...');
  console.log('PLAN:', sample.plan_estudios?.slice(0, 150), '...');
}

// Save processed data
fs.writeFileSync(
  path.join(__dirname, 'carreras_processed.json'),
  JSON.stringify(carreras, null, 2),
  'utf8'
);
console.log('\nGuardado en scripts/carreras_processed.json');
