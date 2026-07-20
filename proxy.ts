import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes (except login)
  const isPublicAdmin =
    pathname.startsWith('/admin/login') ||
    pathname.startsWith('/admin/auth/callback') ||
    pathname.startsWith('/admin/reset-password') ||
    pathname.startsWith('/admin/pendiente');

  const isProtected =
    (pathname.startsWith('/admin') && !isPublicAdmin) ||
    pathname.startsWith('/api/admin');

  if (!isProtected) return NextResponse.next();

  // Create Supabase client with request/response cookie handling
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    // API routes: return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    // Pages: redirect to login
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile, error: profileError } = await supabase
    .from('profesores')
    .select('estado, rol')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No se pudo verificar la cuenta' }, { status: 503 });
    }
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (!profile) {
    const { error: registerError } = await supabase.from('profesores').insert({
      user_id: user.id,
      nombre: user.user_metadata?.full_name || user.user_metadata?.name || null,
      email: user.email,
      estado: 'pendiente',
      rol: 'profesor',
      materia_id: null,
    });
    if (registerError && registerError.code !== '23505') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'No se pudo registrar la cuenta' }, { status: 503 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  if (!profile || profile.estado !== 'aprobado') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Cuenta no aprobada' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/admin/pendiente', request.url));
  }

  const requiresAdminRole =
    pathname === '/admin' ||
    pathname.startsWith('/api/admin');

  if (requiresAdminRole && profile.rol !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Se requiere rol administrador' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/admin/clases-apoyo', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
