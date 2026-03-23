import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Endpoint para subir y organizar imágenes de carreras directamente desde el editor.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const careerName = formData.get('career') as string;
    const type = formData.get('type') as string; // 'mobile', 'desktop', 'modalidad'

    if (!file || !careerName || !type) {
      return NextResponse.json({ error: 'Faltan datos (file, career o type)' }, { status: 400 });
    }

    // Validate file type
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido. Solo imágenes (jpg, png, webp, avif).' }, { status: 400 });
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Archivo demasiado grande (máx 10MB)' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize career name for directory — block path traversal
    const slug = careerName.trim().replace(/\.\./g, '').replace(/[/\\]/g, '');
    const publicDir = path.join(process.cwd(), 'public');
    const destDir = path.join(publicDir, 'imagenes/Modales', slug);

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Determine filename
    let finalFileName = '';
    const ext = path.extname(file.name) || (file.type === 'image/webp' ? '.webp' : '.png');
    
    if (type === 'mobile') {
      finalFileName = `tarjeta_${slug.toLowerCase().replace(/ /g, '_')}${ext}`;
    } else if (type === 'desktop') {
      finalFileName = `portada_desktop${ext}`;
    } else if (type === 'modalidad') {
      finalFileName = `${slug}${ext}`;
    } else {
      return NextResponse.json({ error: 'Tipo de imagen no válido' }, { status: 400 });
    }

    const finalPath = path.join(destDir, finalFileName);
    fs.writeFileSync(finalPath, buffer);

    // Return the public web path
    const webPath = `/imagenes/Modales/${slug}/${finalFileName}`;
    
    return NextResponse.json({ 
      success: true, 
      path: webPath,
      message: `Imagen guardada: ${finalFileName}`
    });

  } catch (error: any) {
    console.error('Error in upload API:', error);
    return NextResponse.json({ error: 'Error interno del servidor: ' + error.message }, { status: 500 });
  }
}
