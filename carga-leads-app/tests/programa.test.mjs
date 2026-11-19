import assert from 'node:assert/strict';
import test from 'node:test';
import { patronProgramaHubSpot } from '../aux/adaptador-playwright.mjs';

test('Promoción Comunitaria apunta a la tecnicatura universitaria de HubSpot', () => {
  const patron = patronProgramaHubSpot('Tecnicatura en Promoción Comunitaria en Niñez y Adolescencia');
  assert.match('Tecnicatura Universitaria en Promoción Comunitaria en Niñez y Adolescencia', patron);
  assert.doesNotMatch('Tecnicatura en Promoción Comunitaria en Niñez y Adolescencia', patron);
});

test('Martillero apunta a la opción sin sufijo y no a la presencial', () => {
  const patron = patronProgramaHubSpot('Tecnicatura en Martillero, Corredor Público y Corredor Inmobiliario');
  const nombre = 'Martillero, Corredor Público Y Corredor Inmobiliario';
  assert.match(nombre, patron);
  assert.doesNotMatch(`${nombre} (Pres)`, patron);
});

test('Escena del Crimen apunta al nombre sin artículo de HubSpot', () => {
  const patron = patronProgramaHubSpot('Tecnicatura en la Investigación de la Escena del Crimen');
  assert.match('Tecnicatura en Investigación de la Escena del Crimen', patron);
  assert.doesNotMatch('Tecnicatura en la Investigación de la Escena del Crimen', patron);
});

test('Diseño y Animación Digital apunta a la tecnicatura universitaria de HubSpot', () => {
  const patron = patronProgramaHubSpot('Tecnicatura en Diseño y Animación Digital');
  assert.match('Tecnicatura Universitaria En Diseño Y Animación Digital', patron);
  assert.doesNotMatch('Licenciatura en Diseño y Animación Digital', patron);
});

test('Dirección de Equipos de Venta apunta al nombre plural de HubSpot', () => {
  const patron = patronProgramaHubSpot('Tecnicatura en Dirección de Equipos de Venta');
  assert.match('Tecnicatura En Dirección De Equipos De Ventas', patron);
  assert.doesNotMatch('Tecnicatura en Dirección de Equipos de Venta', patron);
});

test('Políticas Públicas apunta al nombre de HubSpot aprobado', () => {
  const patron = patronProgramaHubSpot('Tecnicatura en Administración y Gestión de Políticas Públicas');
  assert.match('Tecnicatura Universitaria En Administración Y Gestión De Políticas Públicas', patron);
  assert.doesNotMatch('Tecnicatura en Administración y Gestión de Políticas Públicas', patron);
});

test('Profesorado Universitario apunta al nombre de HubSpot aprobado', () => {
  const patron = patronProgramaHubSpot('Profesorado Universitario Nivel Secundario y Superior');
  assert.match('Profesorado Universitario para el Nivel Secundario y Superior', patron);
  assert.doesNotMatch('Profesorado Universitario Nivel Secundario y Superior', patron);
});

test('Negocios Digitales apunta al nombre de HubSpot aprobado', () => {
  const patron = patronProgramaHubSpot('Licenciatura en inteligencia en Negocios Digitales');
  assert.match('Licenciatura en Inteligencia de Negocios Digitales', patron);
  assert.doesNotMatch('Licenciatura en inteligencia en Negocios Digitales', patron);
});

test('Gerontología apunta a la variante CCC aprobada', () => {
  const patron = patronProgramaHubSpot('Licenciatura en Gerontología');
  assert.match('Licenciatura En Gerontología (CCC)', patron);
  assert.doesNotMatch('Licenciatura en Gerontología', patron);
});

test('Emprendimiento apunta a la variante CCC aprobada', () => {
  const patron = patronProgramaHubSpot('Licenciatura en Emprendimiento');
  assert.match('Licenciatura En Emprendimiento (CCC)', patron);
  assert.doesNotMatch('Licenciatura en Emprendimiento', patron);
});

test('Administración de Servicios de Salud apunta a la variante CCC aprobada', () => {
  const patron = patronProgramaHubSpot('Licenciatura en Administración de Servicios de Salud');
  assert.match('Licenciatura en Administración de Servicios de Salud (CCC)', patron);
  assert.doesNotMatch('Licenciatura en Administración de Servicios de Salud', patron);
});

test('la tecnicatura de Marketing coincide con su nombre exacto en HubSpot', () => {
  const patron = patronProgramaHubSpot('Tecnicatura en Marketing y Publicidad Digital');
  assert.match('Tecnicatura Universitaria En Marketing Y Publicidad Digital', patron);
  assert.doesNotMatch('Tecnicatura Universitaria En Marketing Y Publicidad Digital (otra)', patron);
  assert.doesNotMatch('Tecnicatura en Marketing Digital', patron);
});

test('las demás carreras conservan su nombre sin coincidencias parciales', () => {
  assert.match('ABOGACÍA', patronProgramaHubSpot('Abogacía'));
  assert.doesNotMatch('Abogacía (otra)', patronProgramaHubSpot('Abogacía'));
  assert.match('Licenciatura en Educación (CCC)', patronProgramaHubSpot('Licenciatura en Educación (CCC)'));
});
