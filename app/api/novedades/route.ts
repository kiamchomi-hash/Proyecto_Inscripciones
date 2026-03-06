import { NextResponse } from 'next/server';
import { getNovedades } from '@/lib/data';

export function GET() {
  try {
    const data = getNovedades();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Datos de novedades invalidos' }, { status: 500 });
  }
}
