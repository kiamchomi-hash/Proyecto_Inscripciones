import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const carpeta = formData.get('carpeta') as string | null;

    if (!file || !carpeta) {
      return NextResponse.json({ error: 'Faltan file o carpeta' }, { status: 400 });
    }

    // Validate file type
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo imágenes.' }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Archivo demasiado grande (máx 10MB)' }, { status: 400 });
    }

    // Sanitize folder name — block path traversal
    const safeCarpeta = carpeta.replace(/\.\./g, '').replace(/[/\\]/g, '').replace(/[^\w\s\-áéíóúñüÁÉÍÓÚÑÜ()]/g, '');
    if (!safeCarpeta) {
      return NextResponse.json({ error: 'Nombre de carpeta inválido' }, { status: 400 });
    }

    const dir = path.join(process.cwd(), 'public', 'imagenes', 'Modales', safeCarpeta);
    await mkdir(dir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.replace(/[^\w.\-áéíóúñüÁÉÍÓÚÑÜ]/g, '-');
    const filePath = path.join(dir, fileName);

    await writeFile(filePath, buffer);

    const publicPath = `/imagenes/Modales/${safeCarpeta}/${fileName}`;

    return NextResponse.json({ success: true, path: publicPath });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 });
  }
}
