import 'server-only';

import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { createSupabaseAdmin } from '@/lib/supabase-admin';

const BUCKET = process.env.VENTAS_STORAGE_BUCKET ?? 'ventas-privadas';
const HTML_OBJECT = 'buscador/actual.html';
const META_OBJECT = 'buscador/actual.json';
const LOCAL_HTML = path.join(process.cwd(), 'ventas', 'buscador-carreras.html');

export const MAX_SNAPSHOT_BYTES = 3 * 1024 * 1024;

export interface VentasSnapshotMeta {
  actualizado: string;
  generado: string | null;
  carreras: number | null;
  instituciones: string[];
  periodo: string | null;
  promoHasta: string | null;
  bytes: number;
}

export interface VentasSnapshot {
  html: string;
  meta: VentasSnapshotMeta;
  source: 'supabase' | 'local';
}

function extraerDatosEmbebidos(html: string): Record<string, unknown> | null {
  const match = html.match(/<script\s+id=["']datos["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) return null;

  try {
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function institucionesDe(datos: Record<string, unknown>): string[] {
  const nombres = new Set<string>();
  const carreras = [
    ...(Array.isArray(datos.carreras) ? datos.carreras : []),
    ...(Array.isArray(datos.externas) ? datos.externas : []),
  ];

  for (const carrera of carreras) {
    if (!carrera || typeof carrera !== 'object') continue;
    const institucion = (carrera as Record<string, unknown>).institucion;
    nombres.add(typeof institucion === 'string' && institucion.trim()
      ? institucion.trim()
      : 'Universidad Siglo 21');
  }

  return [...nombres].sort((a, b) => a.localeCompare(b, 'es'));
}

export function validarSnapshot(html: string): VentasSnapshotMeta {
  const bytes = Buffer.byteLength(html, 'utf8');
  if (bytes > MAX_SNAPSHOT_BYTES) {
    throw new Error(`El buscador supera el límite de ${Math.round(MAX_SNAPSHOT_BYTES / 1024 / 1024)} MB`);
  }
  if (!/^\s*<!doctype html>/i.test(html) || !/<html[\s>]/i.test(html)) {
    throw new Error('El archivo no es un HTML completo');
  }

  const datos = extraerDatosEmbebidos(html);
  if (!datos) {
    throw new Error('El archivo no contiene el bloque de datos del buscador');
  }

  const internas = Array.isArray(datos.carreras) ? datos.carreras.length : 0;
  const externas = Array.isArray(datos.externas) ? datos.externas.length : 0;
  const carreras = internas + externas || null;
  if (!carreras) throw new Error('El buscador no contiene carreras');

  return {
    actualizado: new Date().toISOString(),
    generado: typeof datos.generado === 'string' ? datos.generado : null,
    carreras,
    instituciones: institucionesDe(datos),
    periodo: typeof datos.periodo === 'string' ? datos.periodo : null,
    promoHasta: typeof datos.promoHasta === 'string' ? datos.promoHasta : null,
    bytes,
  };
}

async function leerDeSupabase(): Promise<VentasSnapshot | null> {
  try {
    const storage = createSupabaseAdmin().storage.from(BUCKET);
    const [{ data: htmlBlob, error: htmlError }, { data: metaBlob, error: metaError }] = await Promise.all([
      storage.download(HTML_OBJECT),
      storage.download(META_OBJECT),
    ]);

    if (htmlError || !htmlBlob) return null;
    const html = await htmlBlob.text();
    const meta = metaError || !metaBlob
      ? validarSnapshot(html)
      : JSON.parse(await metaBlob.text()) as VentasSnapshotMeta;

    return { html, meta, source: 'supabase' };
  } catch {
    return null;
  }
}

async function leerLocal(): Promise<VentasSnapshot | null> {
  try {
    const [html, info] = await Promise.all([readFile(LOCAL_HTML, 'utf8'), stat(LOCAL_HTML)]);
    const meta = validarSnapshot(html);
    meta.actualizado = info.mtime.toISOString();
    return { html, meta, source: 'local' };
  } catch {
    return null;
  }
}

export async function leerVentasSnapshot(): Promise<VentasSnapshot | null> {
  return await leerDeSupabase() ?? await leerLocal();
}

async function asegurarBucketPrivado() {
  const admin = createSupabaseAdmin();
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw new Error(`No se pudo consultar Storage: ${error.message}`);

  const existente = buckets.find(bucket => bucket.name === BUCKET);
  if (existente) {
    if (existente.public) throw new Error(`El bucket ${BUCKET} existe pero es público`);
    return admin.storage.from(BUCKET);
  }

  const { error: createError } = await admin.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: MAX_SNAPSHOT_BYTES,
    allowedMimeTypes: ['text/html', 'application/json'],
  });
  if (createError) throw new Error(`No se pudo crear el bucket privado: ${createError.message}`);
  return admin.storage.from(BUCKET);
}

export async function guardarVentasSnapshot(html: string): Promise<VentasSnapshotMeta> {
  const meta = validarSnapshot(html);
  const storage = await asegurarBucketPrivado();

  const htmlFile = new Blob([html], { type: 'text/html' });
  const metaFile = new Blob([`${JSON.stringify(meta, null, 2)}\n`], { type: 'application/json' });
  const htmlUpload = await storage.upload(HTML_OBJECT, htmlFile, {
    contentType: 'text/html',
    cacheControl: '0',
    upsert: true,
  });
  if (htmlUpload.error) throw new Error(`No se pudo publicar el buscador: ${htmlUpload.error.message}`);

  const metaUpload = await storage.upload(META_OBJECT, metaFile, {
    contentType: 'application/json',
    cacheControl: '0',
    upsert: true,
  });
  if (metaUpload.error) throw new Error(`El buscador se guardó, pero falló su estado: ${metaUpload.error.message}`);

  return meta;
}
