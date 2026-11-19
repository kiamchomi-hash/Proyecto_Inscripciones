import test from 'node:test';
import assert from 'node:assert/strict';
import { validarLead, normalizarTelefono, nivelDe, evento, esVer, pidDeSingleton } from '../aux/dominio.mjs';

const base = {
  nombre: 'Ejemplo', apellido: 'Prueba', telefono: '0000000000',
  correo: 'ejemplo@example.invalid', carrera: 'Abogacía',
};

test('acepta un lead completo', () => {
  assert.equal(validarLead(base), null);
});

test('rechaza correo, teléfono y campos vacíos', () => {
  assert.match(validarLead({ ...base, correo: 'sin-arroba' }), /correo/i);
  assert.match(validarLead({ ...base, telefono: 'abc' }), /teléfono/i);
  assert.match(validarLead({ ...base, nombre: '  ' }), /nombre/i);
});

test('normaliza el teléfono a dígitos sin agregar prefijo', () => {
  assert.equal(normalizarTelefono('00 0000-0000'), '0000000000');
  assert.equal(normalizarTelefono('+54 9 00 0000-0000'), '5490000000000');
});

test('derive el nivel de la lista generada', () => {
  const carreras = [{ nombre: 'Abogacía', nivel: 'Grado' }, { nombre: 'Tecnicatura en Redes', nivel: 'Pregrado' }];
  assert.equal(nivelDe(carreras, 'Abogacía'), 'Grado');
  assert.equal(nivelDe(carreras, 'Tecnicatura en Redes'), 'Pregrado');
  assert.equal(nivelDe(carreras, 'Inexistente'), null);
});

test('serializa eventos como JSON de una línea', () => {
  assert.equal(evento('paso', { texto: 'Abriendo HubSpot' }), '{"evento":"paso","texto":"Abriendo HubSpot"}');
});

test('detecta el modo ver desde los argumentos', () => {
  assert.equal(esVer(['node', 'cargar.mjs', '--ver']), true);
  assert.equal(esVer(['node', 'cargar.mjs', '--secar']), false);
});

test('lee el proceso del bloqueo del perfil', () => {
  assert.equal(pidDeSingleton('mi-pc-108148'), '108148');
  assert.equal(pidDeSingleton('missing'), null);
});
