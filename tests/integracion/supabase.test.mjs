import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { localStatus, fixtureDatabase, startApp, applyPolicies } from '../../herramientas/supabase-local.mjs';

const options = { auth: { persistSession: false, autoRefreshToken: false } };

test('Supabase real local: RLS, grants y entrega HTTP del endpoint', { timeout: 180000 }, async t => {
  const status = await localStatus(); // Ausencia de Docker/stack es fallo, nunca skip/aprobado.
  const db = await fixtureDatabase(status);
  const lock = await db.query('SELECT pg_try_advisory_lock(554215542) AS acquired');
  if (!lock.rows[0].acquired) { await db.end(); throw new Error('Otra prueba local está usando el fixture. Esperá a que termine.'); }
  const service = createClient(status.API_URL, status.SERVICE_ROLE_KEY, options);
  const anon = createClient(status.API_URL, status.ANON_KEY, options);
  const users = [];
  let app;
  const run = randomUUID();
  const materiaA = randomUUID(), materiaB = randomUUID();
  const makeUser = async role => {
    const email = `${role}-${run}@example.invalid`, password = `Local-${randomUUID()}!`;
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    assert.equal(error, null);
    users.push(data.user.id);
    const client = createClient(status.API_URL, status.ANON_KEY, options);
    const login = await client.auth.signInWithPassword({ email, password });
    assert.equal(login.error, null);
    return { id: data.user.id, client };
  };
  const noError = result => assert.equal(result.error, null, result.error?.message);
  const denied = result => { assert.ok(result.error, 'Se esperaba rechazo real de PostgREST'); assert.equal(result.error.code, '42501', result.error.message); };
  const unchanged = async (client, id) => {
    const result = await client.from('materias').update({ descripcion: 'NO AUTORIZADO' }).eq('id', id).select('id');
    noError(result);
    assert.deepEqual(result.data, []);
    const actual = await service.from('materias').select('descripcion').eq('id', id).single();
    noError(actual);
    assert.notEqual(actual.data.descripcion, 'NO AUTORIZADO');
  };
  try {
    await applyPolicies(db);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await db.query('TRUNCATE public.profesores, public.solicitudes_clase, public.materias, public.consultas, public.faq_preguntas, public.form_rate_limits');
    noError(await service.from('materias').insert([{ id: materiaA, nombre: 'Materia ficticia A' }, { id: materiaB, nombre: 'Materia ficticia B' }]));
    const pending = await makeUser('pendiente'), approved = await makeUser('aprobado'), admin = await makeUser('admin'), fresh = await makeUser('registro');
    const pendingAdmin = await makeUser('admin-pendiente'), rejectedAdmin = await makeUser('admin-rechazado');
    noError(await service.from('profesores').insert([
      { user_id: pending.id, estado: 'pendiente', rol: 'profesor', materia_id: materiaA },
      { user_id: approved.id, estado: 'aprobado', rol: 'profesor', materia_id: materiaA },
      { user_id: admin.id, estado: 'aprobado', rol: 'admin' },
      { user_id: pendingAdmin.id, estado: 'pendiente', rol: 'admin' },
      { user_id: rejectedAdmin.id, estado: 'rechazado', rol: 'admin' },
    ]));
    // Cambio de rol/JWT real de PostgreSQL sobre tabla sintética, NO API Storage.
    const asRole = async (user, query, values) => {
      await db.query('BEGIN');
      try {
        await db.query(user ? 'SET LOCAL ROLE authenticated' : 'SET LOCAL ROLE anon');
        await db.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: user?.id, role: user ? 'authenticated' : 'anon' })]);
        return await db.query(query, values);
      } finally { await db.query('ROLLBACK'); }
    };
    const roles = [null, fresh, approved, pendingAdmin, rejectedAdmin, admin];
    await t.test('SQL real reaplicable: policies obsoletas ausentes y ACL de funciones cerradas', async () => {
      const stale = await db.query(`SELECT policyname FROM pg_policies WHERE
        (schemaname = 'storage' AND tablename = 'objects' AND policyname IN ('Upload autenticado novedades', 'Delete autenticado novedades')) OR
        (schemaname = 'public' AND tablename = 'consultas' AND policyname = 'Allow anonymous inserts with validation') OR
        (schemaname = 'public' AND tablename = 'faq_preguntas' AND policyname = 'faq_anon_insert') OR
        (schemaname = 'public' AND tablename = 'solicitudes_clase' AND policyname = 'anon puede insertar solicitudes limitado')`);
      assert.equal(stale.rowCount, 0);
      for (const name of ['check_faq_rate_limit', 'check_solicitud_rate_limit', 'update_updated_at']) {
        for (const role of ['anon', 'authenticated', 'service_role']) {
          const acl = await db.query('SELECT has_function_privilege($1, $2, $3) AS allowed', [role, `public.${name}()`, 'EXECUTE']);
          assert.equal(acl.rows[0].allowed, role === 'service_role', `${role}: ${name}`);
        }
        for (const user of roles) await assert.rejects(() => asRole(user, `SELECT public.${name}()`), { code: '42501' });
        // El trigger sintético sigue funcionando tras revocar EXECUTE público.
        await db.query('BEGIN');
        try {
          await db.query(`CREATE TRIGGER fixture_acl BEFORE INSERT ON public.guardrails_fixture FOR EACH ROW EXECUTE FUNCTION public.${name}()`);
          await db.query('SET LOCAL ROLE service_role');
          assert.equal((await db.query('INSERT INTO public.guardrails_fixture (id) VALUES (1)')).rowCount, 1);
        } finally { await db.query('ROLLBACK'); }
      }
    });
    await t.test('Storage SQL: sólo admin aprobado escribe novedades y no otro bucket', async () => {
      for (const user of roles) {
        const allowed = user === admin;
        const seed = randomUUID();
        await db.query('INSERT INTO storage.objects (id, bucket_id, name) VALUES ($1, $2, $3)', [seed, 'novedades', seed]);
        try {
          const insert = () => asRole(user, "INSERT INTO storage.objects (bucket_id, name) VALUES ('novedades', $1) RETURNING id", [randomUUID()]);
          if (allowed) assert.equal((await insert()).rowCount, 1);
          else await assert.rejects(insert, { code: '42501' });
          assert.equal((await asRole(user, 'DELETE FROM storage.objects WHERE id = $1 RETURNING id', [seed])).rowCount, allowed ? 1 : 0);
          assert.equal((await db.query('SELECT 1 FROM storage.objects WHERE id = $1', [seed])).rowCount, 1, 'La transacción de prueba debe revertirse');
          await assert.rejects(() => asRole(user, "INSERT INTO storage.objects (bucket_id, name) VALUES ('otro-bucket', $1)", [randomUUID()]), { code: '42501' });
          assert.equal((await asRole(user, "UPDATE storage.objects SET name = 'prohibido' WHERE id = $1 RETURNING id", [seed])).rowCount, 0);
          await db.query("UPDATE storage.objects SET bucket_id = 'otro-bucket' WHERE id = $1", [seed]);
          assert.equal((await asRole(user, 'DELETE FROM storage.objects WHERE id = $1 RETURNING id', [seed])).rowCount, 0);
        } finally { await db.query('DELETE FROM storage.objects WHERE id = $1', [seed]); }
      }
    });
    await t.test('precios PostgREST: insertar, borrar y actualizar meta exige admin aprobado', async () => {
      for (const user of roles) {
        const client = user?.client ?? anon, allowed = user === admin;
        const seed = randomUUID(), inserted = randomUUID();
        await db.query('INSERT INTO public.precios_carreras (id, valor) VALUES ($1, 1)', [seed]);
        await db.query("INSERT INTO public.precios_meta (id, valor) VALUES ($1, 'original')", [seed]);
        try {
          const insert = await client.from('precios_carreras').insert({ id: inserted, valor: 2 });
          if (allowed) noError(insert); else denied(insert);
          const deletion = await client.from('precios_carreras').delete().eq('id', seed).select('id');
          noError(deletion); assert.equal(deletion.data.length, allowed ? 1 : 0);
          const update = await client.from('precios_meta').update({ valor: 'nuevo' }).eq('id', seed).select('id');
          noError(update); assert.equal(update.data.length, allowed ? 1 : 0);
          const stored = await db.query('SELECT valor FROM public.precios_meta WHERE id = $1', [seed]);
          assert.equal(stored.rows[0].valor, allowed ? 'nuevo' : 'original');
          assert.equal((await db.query('SELECT 1 FROM public.precios_carreras WHERE id = $1', [seed])).rowCount, allowed ? 0 : 1);
          assert.equal((await db.query('SELECT 1 FROM public.precios_carreras WHERE id = $1', [inserted])).rowCount, allowed ? 1 : 0);
        } finally {
          await db.query('DELETE FROM public.precios_carreras WHERE id IN ($1, $2)', [seed, inserted]);
          await db.query('DELETE FROM public.precios_meta WHERE id = $1', [seed]);
        }
      }
    });
    await t.test('anon y autenticado no insertan formularios ni leen datos privados', async () => {
      for (const client of [anon, approved.client]) {
        for (const table of ['consultas', 'faq_preguntas', 'solicitudes_clase']) denied(await client.from(table).insert({}));
        for (const table of ['consultas', 'solicitudes_clase']) denied(await client.from(table).select('id'));
        denied(await client.from('faq_preguntas').select('contacto'));
        denied(await client.rpc('check_form_rate_limit', { p_key: run, p_max_requests: 5, p_window_seconds: 600 }));
      }
      noError(await service.from('faq_preguntas').insert([{ titulo: 'Visible ficticia', estado: 'aprobada', contacto: 'private@example.invalid' }, { titulo: 'Oculta ficticia', estado: 'pendiente' }]));
      const visible = await anon.from('faq_preguntas').select('titulo');
      noError(visible);
      assert.deepEqual(visible.data.map(row => row.titulo), ['Visible ficticia']);
    });
    await t.test('profesor pendiente y no asignado no actualizan; aprobado sólo columnas permitidas', async () => {
      await unchanged(pending.client, materiaA);
      await unchanged(approved.client, materiaB);
      const update = await approved.client.from('materias').update({ descripcion: 'Autorizado' }).eq('id', materiaA).select('id');
      noError(update);
      assert.equal(update.data.length, 1);
      const stored = await service.from('materias').select('descripcion').eq('id', materiaA).single();
      noError(stored); assert.equal(stored.data.descripcion, 'Autorizado');
      denied(await approved.client.from('materias').update({ nombre: 'Prohibido' }).eq('id', materiaA));
      denied(await approved.client.from('profesores').update({ estado: 'aprobado' }).eq('user_id', pending.id));
      const adminUpdate = await admin.client.from('materias').update({ descripcion: 'Admin' }).eq('id', materiaB).select('id');
      noError(adminUpdate); assert.equal(adminUpdate.data.length, 1);
      denied(await admin.client.from('materias').update({ activa: false }).eq('id', materiaB));
    });
    await t.test('registro propio pendiente sin elevar rol ni asignación', async () => {
      for (const extra of [{ estado: 'aprobado' }, { rol: 'admin' }, { materia_id: materiaA }, { user_id: admin.id }]) denied(await fresh.client.from('profesores').insert({ user_id: fresh.id, estado: 'pendiente', rol: 'profesor', ...extra }));
      noError(await fresh.client.from('profesores').insert({ user_id: fresh.id, estado: 'pendiente', rol: 'profesor' }));
      const own = await fresh.client.from('profesores').select('user_id');
      noError(own); assert.deepEqual(own.data.map(row => row.user_id), [fresh.id]);
    });
    app = await startApp(status);
    const post = (kind, payload, token = 'rate-limit-only', ip = run) => fetch('http://127.0.0.1:55430/api/formularios', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify({ kind, payload, token }), signal: AbortSignal.timeout(30000) });
    await t.test('consulta, FAQ y clase entregan HTTP 201 y persisten filas reales', async () => {
      const email = `lead-${run}@example.invalid`;
      const payloads = [
        ['consulta', { casa: 'siglo21', tipoFormulario: 'contacto', nombre: 'Prueba ficticia', email, telefono: '1100000000' }, 'consultas', 'email', email],
        ['faq', { titulo: `Pregunta ficticia ${run}`, contacto: email }, 'faq_preguntas', 'contacto', email],
        ['clase', { rows: [{ materia_id: materiaA, dias: ['Lunes'], horarios: ['9:00-10:00'], nombre: 'Prueba ficticia', telefono: '1100000000' }] }, 'solicitudes_clase', 'materia_id', materiaA],
      ];
      for (const [kind, payload, table, column, value] of payloads) {
        const response = await post(kind, payload);
        assert.equal(response.status, 201, `${kind}: ${await response.text()}`);
        const saved = await service.from(table).select('id').eq(column, value);
        noError(saved); assert.equal(saved.data.length, 1);
      }
    });
    await t.test('token inválido consume cuota real sin insertar y sexto envío devuelve 429', async () => {
      const email = `quota-${run}@example.invalid`, payload = { email };
      const ip = `quota-${run}`;
      assert.equal((await post('consulta', payload, 'invalido', ip)).status, 403);
      let rows = await service.from('consultas').select('id').eq('email', email);
      noError(rows); assert.equal(rows.data.length, 0);
      for (let i = 0; i < 4; i++) assert.equal((await post('consulta', payload, 'rate-limit-only', ip)).status, 201);
      assert.equal((await post('consulta', payload, 'rate-limit-only', ip)).status, 429);
      rows = await service.from('consultas').select('id').eq('email', email);
      noError(rows); assert.equal(rows.data.length, 4);
    });
  } finally {
    try {
      await app?.stop();
      await db.query('ROLLBACK');
      await db.query('TRUNCATE public.profesores, public.solicitudes_clase, public.materias, public.consultas, public.faq_preguntas, public.form_rate_limits, public.precios_carreras, public.precios_meta');
      await db.query('TRUNCATE storage.objects');
      for (const id of users) { const result = await service.auth.admin.deleteUser(id); noError(result); }
    } finally { await db.end(); }
  }
});
