import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import assert from 'node:assert/strict';
import { assertLocalStatus, isolatedEnvironment, assertLocalDockerEndpoint, containerEnvironment, assertTemporaryCleanupPath, applyPolicies } from '../herramientas/supabase-local.mjs';
const status = { API_URL: 'http://127.0.0.1:55421', DB_URL: 'postgresql://postgres:postgres@127.0.0.1:55422/postgres', ANON_KEY: 'local-anon', SERVICE_ROLE_KEY: 'local-service' };
test('los SQL reales se envían a PostgreSQL sin la marca BOM de Windows', async () => {
  const queries = [];
  await applyPolicies({ query: async sql => queries.push(sql) });
  assert.equal(queries.length, 4);
  for (const sql of queries) assert.equal(sql.startsWith('\uFEFF'), false);
  assert.match(queries[0], /^BEGIN;/);
  assert.match(queries[1], /^BEGIN;/);
  assert.equal(queries[3], "NOTIFY pgrst, 'reload schema'");
});
test('integración acepta únicamente los puertos y direcciones locales dedicados', () => {
  assert.doesNotThrow(() => assertLocalStatus(status));
  for (const API_URL of ['https://example.supabase.co', 'http://localhost:55421', 'http://127.0.0.1:54321', 'http://127.0.0.1:55421/evil', 'http://user@127.0.0.1:55421']) assert.throws(() => assertLocalStatus({ ...status, API_URL }), /aislado/);
  assert.throws(() => assertLocalStatus({ ...status, DB_URL: 'postgresql://postgres:postgres@remote:55422/postgres' }), /aislado/);
  assert.throws(() => assertLocalStatus({ ...status, SERVICE_ROLE_KEY: '' }), /credenciales/);
});
test('entorno del servidor no hereda secretos ni configuración del sitio real', () => {
  const env = isolatedEnvironment(status, { PATH: 'bin', SYSTEMROOT: 'Windows', TURNSTILE_SECRET_KEY: 'real', SUPABASE_ACCESS_TOKEN: 'real', NEXT_PUBLIC_SUPABASE_URL: 'real', VERCEL: '1' });
  assert.equal(env.PATH, 'bin');
  assert.equal(env.TURNSTILE_SECRET_KEY, undefined);
  assert.equal(env.SUPABASE_ACCESS_TOKEN, undefined);
  assert.equal(env.VERCEL, undefined);
  assert.equal(env.NEXT_PUBLIC_SUPABASE_URL, status.API_URL);
  assert.equal(env.NEXT_PUBLIC_FORMULARIOS_PRUEBA_LOCAL, '1');
});

test('Docker rechaza contextos TCP, SSH y named pipes remotos', () => {
  for (const endpoint of ['unix:///var/run/docker.sock', 'npipe:////./pipe/docker_engine']) assert.doesNotThrow(() => assertLocalDockerEndpoint(endpoint));
  for (const endpoint of ['tcp://127.0.0.1:2375', 'ssh://remote', 'npipe:////remote/pipe/docker_engine', undefined]) assert.throws(() => assertLocalDockerEndpoint(endpoint), /local/);
});

test('overrides Docker remotos se rechazan antes de invocar procesos', () => {
  for (const [key,value] of [['DOCKER_HOST','tcp://remote:2375'],['DOCKER_CONTEXT','remote'],['docker_host','ssh://remote'],['DOCKER_CONFIG','remote-config']]) assert.throws(() => containerEnvironment({PATH:'bin',[key]:value}, 'unix:///var/run/docker.sock'), /override/);
  const env=containerEnvironment({PATH:'bin'}, 'unix:///var/run/docker.sock');
  assert.equal(env.DOCKER_HOST,'unix:///var/run/docker.sock');
  assert.equal(env.DOCKER_CONTEXT,undefined);
});
test('limpieza recursiva sólo acepta hijo temporal directo creado por el harness', () => {
  assert.doesNotThrow(() => assertTemporaryCleanupPath('/tmp/cau-guardrails-abc','/tmp'));
  for(const path of ['/tmp', '/tmp/otro', '/outside/cau-guardrails-abc', '/tmp/cau-guardrails-abc/nested']) assert.throws(() => assertTemporaryCleanupPath(path,'/tmp'), /temporal/);
});

test('CLI fail-closed rechaza override remoto sin contactar Docker', async () => {
  await assert.rejects(promisify(execFile)(process.execPath, ['herramientas/supabase-local.mjs', 'estado'], { env: {...process.env, DOCKER_HOST:'tcp://remote.invalid:2375'}, timeout:10000, windowsHide:true }), error => {
    assert.equal(error.code,2);
    assert.match(error.stderr,/override Docker/);
    return true;
  });
});
