import fs from 'fs';
import path from 'path';
import { CarrerasDataSchema, NovedadesDataSchema } from '@/src/schemas';

export function getCarreras() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'datos_carreras.json'), 'utf-8'));
  return CarrerasDataSchema.parse(raw);
}

export function getNovedades() {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'novedades_data.json'), 'utf-8'));
  return NovedadesDataSchema.parse(raw);
}
