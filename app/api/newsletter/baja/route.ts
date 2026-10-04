// Baja del newsletter: pone `activo = false` en esa suscripción.
//
// La usan dos caminos, los dos con POST (un GET no da de baja: los escáneres
// de enlaces de los correos abren todo lo que ven):
// - La baja de un clic de Gmail y compañía (RFC 8058): POST a la URL de
//   `List-Unsubscribe`, con el id en la query y `List-Unsubscribe=One-Click`
//   en el cuerpo. Responde 200.
// - El botón de `/newsletter/baja`: formulario con el id en el cuerpo.
//   Responde 303 a la confirmación.
//
// Un id que no existe responde igual que uno que sí, para no confirmar
// suscripciones a quien prueba ids.

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';
import { TABLA_NEWSLETTER } from '@/components/formularios/casas';
import { esIdSuscripcion } from '@/components/formularios/mail-precio';

export const dynamic = 'force-dynamic';

/** El id del cuerpo del formulario, si lo hay. Un cuerpo ilegible no es un error. */
async function idDelFormulario(request: NextRequest) {
  try {
    const valor = (await request.formData()).get('id');
    return typeof valor === 'string' ? valor : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const enQuery = new URL(request.url).searchParams.get('id');
  const desdeFormulario = !enQuery;
  const id = enQuery ?? await idDelFormulario(request);
  if (!esIdSuscripcion(id)) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }

  try {
    const { error } = await createSupabaseAdmin()
      .from(TABLA_NEWSLETTER)
      .update({ activo: false })
      .eq('id', id);
    if (error) {
      console.error('[newsletter] No se pudo dar de baja', { code: error.code });
      return NextResponse.json({ error: 'No se pudo procesar la baja' }, { status: 500 });
    }
  } catch (error) {
    console.error('[newsletter] No se pudo dar de baja', {
      code: error instanceof Error ? error.name : 'desconocido',
    });
    return NextResponse.json({ error: 'No se pudo procesar la baja' }, { status: 500 });
  }

  return desdeFormulario
    ? NextResponse.redirect(new URL('/newsletter/baja?listo=1', request.url), 303)
    : NextResponse.json({ ok: true });
}
