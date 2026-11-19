import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FUENTE = path.join(AQUI, '..', 'conocimiento', 'siglo21.md');
const DESTINO = path.join(AQUI, 'carreras.json');
const NOMBRES_CORREGIDOS = new Map([
  ['Licenciatura en Desarrollos de Negocios Inmobiliarios', 'Licenciatura en Desarrollo de Negocios Inmobiliarios'],
]);

export function parsearCarreras(texto) {
  const resultado = [];
  let nombre = null;
  for (const linea of texto.split(/\r?\n/)) {
    const titulo = linea.match(/^##\s+(.+?)\s*$/);
    if (titulo) { nombre = titulo[1].trim(); continue; }
    const nivel = linea.match(/^\s*-\s+\*\*Nivel local:\*\*\s*(Grado|Pregrado)/i);
    if (nombre && nivel) {
      resultado.push({
        nombre: NOMBRES_CORREGIDOS.get(nombre) ?? nombre,
        nivel: nivel[1].toLowerCase() === 'grado' ? 'Grado' : 'Pregrado',
      });
      nombre = null;
    }
  }
  return resultado.filter((carrera, indice, todas) =>
    todas.findIndex(otra => otra.nombre === carrera.nombre) === indice);
}

export async function main() {
  const carreras = parsearCarreras(await readFile(FUENTE, 'utf8'));
  if (carreras.length < 50) throw new Error('La fuente no dio la cantidad esperada de carreras.');
  await writeFile(DESTINO, JSON.stringify(carreras, null, 2) + '\n', 'utf8');
  return carreras.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(`${await main()} carreras escritas en ${DESTINO}`);
}
