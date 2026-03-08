import { NextResponse } from 'next/server';

// TODO: conectar a Supabase tabla `carreras`
export function GET() {
  return NextResponse.json({ error: 'Endpoint pendiente de migración a Supabase' }, { status: 501 });
}
