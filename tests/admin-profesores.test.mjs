import test from 'node:test';
import assert from 'node:assert/strict';
import { cargarTypescript } from './helpers/cargar-typescript.mjs';

function escenario({ usuario = { id: 'admin-prueba' }, perfil = { estado: 'aprobado', rol: 'admin' }, errorAuth = null, errorPerfil = null, lanza = false, errorEscritura = null } = {}) {
  const escrituras = [];
  let clientesPrivilegiados = 0;
  const next = { NextResponse: { json: (body, opciones = {}) => ({ status: opciones.status ?? 200, body }) } };
  const { exigirAdmin } = cargarTypescript('lib/auth/exigir-admin.ts', {
    'server-only': {},
    'next/server': next,
    '@/lib/supabase-server': { createSupabaseServer: async () => {
      if (lanza) throw new Error('Sin conexión');
      return {
        auth: { getUser: async () => ({ data: { user: usuario }, error: errorAuth }) },
        from: tabla => {
          assert.equal(tabla, 'profesores');
          return { select: columnas => {
            assert.equal(columnas, 'estado, rol');
            return { eq: (columna, id) => {
              assert.equal(columna, 'user_id');
              assert.equal(id, usuario.id);
              return { maybeSingle: async () => ({ data: perfil, error: errorPerfil }) };
            } };
          } };
        },
      };
    } },
  });
  const ruta = cargarTypescript('app/api/admin/profesores/route.ts', {
    'next/server': next,
    '@/lib/auth/exigir-admin': { exigirAdmin },
    '@/lib/supabase-admin': { createSupabaseAdmin: () => {
      clientesPrivilegiados++;
      return { from: tabla => {
        assert.equal(tabla, 'profesores');
        const operacion = (tipo, datos) => ({ eq: async (columna, id) => {
          escrituras.push({ tipo, datos, columna, id });
          return { error: errorEscritura };
        } });
        return { update: datos => operacion('update', datos), delete: () => operacion('delete') };
      } };
    } },
  });
  return { ruta, escrituras, clientes: () => clientesPrivilegiados };
}

const payload = { id: 'profesor-prueba', estado: 'aprobado', rol: 'profesor', materia_id: 'materia-prueba' };
const pedido = (body = payload) => ({ url: 'https://example.test/api/admin/profesores?id=profesor-prueba', json: async () => body });

test('PATCH y DELETE autorizan dentro del handler sin depender del proxy', async () => {
  for (const [opciones, status] of [
    [{ usuario: null }, 401],
    [{ errorAuth: new Error('Sesión inválida') }, 401],
    [{ perfil: null }, 403],
    [{ perfil: { estado: 'pendiente', rol: 'admin' } }, 403],
    [{ perfil: { estado: 'rechazado', rol: 'admin' } }, 403],
    [{ perfil: { estado: 'aprobado', rol: 'profesor' } }, 403],
    [{ errorPerfil: new Error('Base inaccesible') }, 503],
    [{ lanza: true }, 503],
  ]) {
    const caso = escenario(opciones);
    for (const metodo of ['PATCH', 'DELETE']) assert.equal((await caso.ruta[metodo](pedido())).status, status);
    assert.equal(caso.clientes(), 0);
    assert.deepEqual(caso.escrituras, []);
  }
});

test('admin aprobado puede actualizar y eliminar con los filtros esperados', async () => {
  const caso = escenario();
  assert.equal((await caso.ruta.PATCH(pedido())).status, 200);
  assert.equal((await caso.ruta.DELETE(pedido())).status, 200);
  assert.deepEqual(caso.escrituras, [
    { tipo: 'update', datos: { estado: 'aprobado', rol: 'profesor', materia_id: 'materia-prueba' }, columna: 'id', id: 'profesor-prueba' },
    { tipo: 'delete', datos: undefined, columna: 'id', id: 'profesor-prueba' },
  ]);
});

test('PATCH rechaza JSON inválido y cuerpos inválidos antes de crear el cliente privilegiado', async () => {
  const caso = escenario();
  const roto = { ...pedido(), json: async () => { throw new SyntaxError('JSON inválido'); } };
  assert.equal((await caso.ruta.PATCH(roto)).status, 400);
  for (const body of [null, [], 'texto', 1, {}, { ...payload, rol: 'otro' }, { ...payload, materia_id: null }]) {
    assert.equal((await caso.ruta.PATCH(pedido(body))).status, 400);
  }
  assert.equal((await caso.ruta.DELETE({ url: 'https://example.test/api/admin/profesores' })).status, 400);
  assert.equal(caso.clientes(), 0);
});

test('los errores de escritura no se informan como éxito', async () => {
  const caso = escenario({ errorEscritura: new Error('Escritura rechazada') });
  for (const metodo of ['PATCH', 'DELETE']) assert.equal((await caso.ruta[metodo](pedido())).status, 500);
});
