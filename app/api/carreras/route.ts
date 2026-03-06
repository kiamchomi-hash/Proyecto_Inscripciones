import { NextResponse } from 'next/server';
import { getCarreras } from '@/lib/data';

export function GET() {
  try {
    const data = getCarreras();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Datos de carreras invalidos' }, { status: 500 });
  }
}
