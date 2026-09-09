import test from 'node:test';
import assert from 'node:assert/strict';
import { conciliarPorDia } from '../herramientas/conciliacion.mjs';

test('la conciliación usa el timestamp de Analytics y cruza por día UTC', () => {
  assert.deepEqual(conciliarPorDia([
    { timestamp: '2026-09-01T00:00:00Z', count: 2 },
    { timestamp: '2026-08-31T23:30:00-03:00', count: 1 },
  ], [{ dia_utc: '2026-09-01' }, { dia_utc: '2026-09-02' }]), [
    { dia: '2026-09-01', eventos: 3, filas: 1 },
    { dia: '2026-09-02', eventos: 0, filas: 1 },
  ]);
});
test('una fuente ausente no se convierte en cero y un formato desconocido falla', () => {
  assert.equal(conciliarPorDia(null, [{ dia_utc: '2026-09-01' }])[0].eventos, null);
  assert.throws(() => conciliarPorDia([{ day: '2026-09-01', count: 1 }], []), /formato esperado/);
});
