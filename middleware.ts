import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes (except login)
  const isProtected =
    (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) ||
    pathname.startsWith('/api/admin');

  if (!isProtected) return NextResponse.next();

  // Create Supabase client with request/response cookie handling
  let response = NextResponse.next({ request });

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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // API routes: return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    // Pages: redirect to login
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
