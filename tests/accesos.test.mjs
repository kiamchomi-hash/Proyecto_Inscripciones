import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

test('el proxy aplica la matriz de acceso y no aprueba errores de sesión o perfil', async () => {
  let perfil = null, usuario = null, errorPerfil = null;
  const { proxy } = cargarTypescript('proxy.ts', {
    '@supabase/ssr': { createServerClient: () => ({
      auth: { getUser: async () => ({ data: { user: usuario }, error: null }) },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: perfil, error: errorPerfil }) }) }), insert: async () => ({ error: null }) }),
    }) },
    'next/server': { NextResponse: {
      next: () => ({ status: 200, cookies: { set() {} } }),
      json: (body, options) => ({ status: options.status, body }),
      redirect: url => ({ status: 307, destino: url.pathname }),
    } },
  });
  const entrar = ruta => proxy({ url: 'https://example.test' + ruta, nextUrl: { pathname: ruta }, method: 'GET', headers: new Headers(), cookies: { getAll: () => [] } });
  assert.equal((await entrar('/api/admin/profesores')).status, 401);
  assert.equal((await entrar('/admin')).destino, '/admin/login');
  usuario = { id: 'usuario-de-prueba', user_metadata: {} };
  for (const estado of ['pendiente', 'rechazado']) {
    perfil = { estado, rol: 'admin' };
    assert.equal((await entrar('/api/admin/profesores')).status, 403);
  }
  perfil = { estado: 'aprobado', rol: 'profesor' };
  assert.equal((await entrar('/admin/clases-apoyo')).status, 200);
  assert.equal((await entrar('/admin')).destino, '/admin/clases-apoyo');
  assert.equal((await entrar('/api/admin/profesores')).status, 403);
  perfil.rol = 'admin';
  assert.equal((await entrar('/admin')).status, 200);
  assert.equal((await entrar('/api/admin/profesores')).status, 200);
  errorPerfil = { message: 'base inaccesible' };
  assert.equal((await entrar('/api/admin/profesores')).status, 503);
});
