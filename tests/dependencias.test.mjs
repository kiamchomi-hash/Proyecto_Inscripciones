import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { getRootDirs } = require('@next/eslint-plugin-next/dist/utils/get-root-dirs.js')

test('el consumidor real de Next conserva rootDir y filtra archivos', () => {
  const base = mkdtempSync(join(tmpdir(), 'cau-dependencias-'))
  try {
    const primero = join(base, 'apps', 'primero')
    const segundo = join(base, 'apps', 'segundo')
    mkdirSync(primero, { recursive: true })
    mkdirSync(segundo, { recursive: true })
    writeFileSync(join(base, 'apps', 'archivo.txt'), 'No es un directorio')
    const normalizar = ruta => ruta.replaceAll('\\', '/')
    const resolver = rootDir => getRootDirs({ cwd: base, settings: { next: { rootDir } } }).map(normalizar).sort()
    assert.deepEqual(getRootDirs({ cwd: base, settings: {} }), [base])
    assert.deepEqual(resolver(primero), [normalizar(primero)])
    assert.deepEqual(resolver([primero, segundo]), [normalizar(primero), normalizar(segundo)])
    assert.deepEqual(resolver(join(base, 'apps', '*')), [normalizar(primero), normalizar(segundo)])
    assert.deepEqual(resolver(join(base, 'inexistente', '*')), [])
    assert.deepEqual(resolver([primero, null, 42]), [normalizar(primero)])
  } finally {
    rmSync(base, { recursive: true, force: true })
  }
})
