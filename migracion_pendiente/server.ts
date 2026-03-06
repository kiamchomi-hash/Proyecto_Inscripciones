import express from 'express';
import path from 'path';
import fs from 'fs';
import { CarrerasDataSchema, NovedadesDataSchema } from './schemas';

const app = express();
const PORT = process.env.PORT || 8080;
const ROOT = path.resolve(__dirname, '..');

// ── Validar datos JSON al iniciar ──
function validateData() {
  const carrerasPath = path.join(ROOT, 'datos_carreras.json');
  const novedadesPath = path.join(ROOT, 'novedades_data.json');

  const carrerasRaw = JSON.parse(fs.readFileSync(carrerasPath, 'utf-8'));
  const carrerasResult = CarrerasDataSchema.safeParse(carrerasRaw);
  if (!carrerasResult.success) {
    console.error('❌ datos_carreras.json inválido:', carrerasResult.error.format());
  } else {
    console.log(`✅ datos_carreras.json válido (${Object.keys(carrerasResult.data).length} carreras)`);
  }

  const novedadesRaw = JSON.parse(fs.readFileSync(novedadesPath, 'utf-8'));
  const novedadesResult = NovedadesDataSchema.safeParse(novedadesRaw);
  if (!novedadesResult.success) {
    console.error('❌ novedades_data.json inválido:', novedadesResult.error.format());
  } else {
    console.log(`✅ novedades_data.json válido (${novedadesResult.data.items.length} items)`);
  }
}

// ── API endpoints con validación ──
app.get('/api/carreras', (_req, res) => {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'datos_carreras.json'), 'utf-8'));
  const result = CarrerasDataSchema.safeParse(raw);
  if (!result.success) {
    res.status(500).json({ error: 'Datos de carreras inválidos', details: result.error.format() });
    return;
  }
  res.json(result.data);
});

app.get('/api/novedades', (_req, res) => {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'novedades_data.json'), 'utf-8'));
  const result = NovedadesDataSchema.safeParse(raw);
  if (!result.success) {
    res.status(500).json({ error: 'Datos de novedades inválidos', details: result.error.format() });
    return;
  }
  res.json(result.data);
});

// ── Archivos estáticos (HTML, CSS, JS, imágenes, JSON) ──
app.use(express.static(ROOT, {
  extensions: ['html'],
  index: 'index.html',
}));

// ── Iniciar servidor ──
validateData();

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
