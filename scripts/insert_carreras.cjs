const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env
const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const carreras = JSON.parse(fs.readFileSync(path.join(__dirname, 'carreras_processed.json'), 'utf8'));

async function insert() {
  // Map to table schema
  const rows = carreras.map(c => ({
    nombre: c.nombre,
    nivel: c.nivel,
    duracion: c.duracion,
    titulo: c.titulo,
    enfoque: c.enfoque,
    modalidad: 'Distancia',
    descripcion: c.descripcion,
    seccion_duracion: c.seccion_duracion,
    seccion_modalidad: c.seccion_modalidad,
    plan_estudios: c.plan_estudios,
    imagenes: c.imagenes || [],
    orden: c.orden,
    activa: true,
  }));

  // Insert in batches of 20
  const batchSize = 20;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from('carreras').insert(batch);
    if (error) {
      console.error(`Error en batch ${i}:`, error.message);
      return;
    }
    inserted += batch.length;
    console.log(`Insertadas ${inserted}/${rows.length}`);
  }
  console.log('Listo!');
}

insert();
