import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Script para organizar imágenes de carreras.
 * Uso: node scripts/organizar-imagenes.js "Nombre de la Carrera"
 * 
 * Busca archivos en public/imagenes/ con prefijos:
 * - mob_  -> tarjeta_[carrera].png
 * - desk_ -> portada_desktop.jpg
 * - mod_  -> [carrera].webp
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');

function organize(careerName) {
  if (!careerName) {
    console.error('Error: Debes proporcionar el nombre de la carrera entre comillas.');
    return;
  }

  const slug = careerName.trim();
  const destDir = path.join(PUBLIC_DIR, 'imagenes/Modales', slug);
  
  // Crear carpeta de destino si no existe
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log(`Carpeta creada: ${destDir}`);
  }

  const sourceDir = path.join(PUBLIC_DIR, 'imagenes');
  const files = fs.readdirSync(sourceDir);

  const mapping = {
    'mob_': `tarjeta_${slug.toLowerCase().replace(/ /g, '_')}`,
    'desk_': `portada_desktop`,
    'mod_': `${slug}`
  };

  let movedCount = 0;

  files.forEach(file => {
    // Evitar procesar directorios
    if (fs.lstatSync(path.join(sourceDir, file)).isDirectory()) return;

    for (const [prefix, newNameBase] of Object.entries(mapping)) {
      if (file.toLowerCase().startsWith(prefix)) {
        const ext = path.extname(file);
        const oldPath = path.join(sourceDir, file);
        const newPath = path.join(destDir, newNameBase + ext);
        
        try {
          fs.renameSync(oldPath, newPath);
          console.log(`✅ Movido: ${file} -> ${newPath.replace(PUBLIC_DIR, '')}`);
          movedCount++;
        } catch (err) {
          console.error(`❌ Error moviendo ${file}:`, err.message);
        }
      }
    }
  });

  if (movedCount === 0) {
    console.log('No se encontraron archivos con los prefijos mob_, desk_ o mod_ en public/imagenes/');
  } else {
    console.log(`\nProceso finalizado. Se movieron ${movedCount} archivos.`);
  }
}

const args = process.argv.slice(2);
organize(args[0]);
