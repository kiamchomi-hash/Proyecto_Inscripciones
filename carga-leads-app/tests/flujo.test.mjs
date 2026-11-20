import test from 'node:test';
import assert from 'node:assert/strict';
import { ejecutarCarga } from '../aux/hubspot.mjs';

function adaptadorFalso() {
  const pasos = [];
  return {
    pasos,
    async sesion() { pasos.push('sesion'); },
    async contactoPorCorreo() { pasos.push('buscar-contacto'); return null; },
    async crearContacto() { pasos.push('crear-contacto'); return '101'; },
    async crearNegocio() { pasos.push('crear-negocio'); },
    async enviar() { pasos.push('enviar'); },
  };
}

test('crea contacto, negocio y envía en ese orden', async () => {
  const adaptador = adaptadorFalso();
  const resultado = await ejecutarCarga(adaptador, {
    nombre: 'Ejemplo', apellido: 'Prueba', telefono: '0000000000',
    correo: 'ejemplo@example.invalid', carrera: 'Abogacía', nivel: 'Grado',
  });
  assert.deepEqual(adaptador.pasos, ['sesion', 'buscar-contacto', 'crear-contacto', 'crear-negocio', 'enviar']);
  assert.deepEqual(resultado, { contacto: '101', negocio: null });
});

test('si falla el clic de envío se informa el error y no se reintenta', async () => {
  const adaptador = adaptadorFalso();
  adaptador.enviar = async () => { adaptador.pasos.push('enviar'); throw new Error('Falló Enviar'); };
  const eventos = [];
  await assert.rejects(ejecutarCarga(adaptador, { correo: 'prueba@example.test' }, {
    emitir: (_, datos) => eventos.push(datos.texto),
  }), /falló enviar/i);
  assert.equal(adaptador.pasos.filter(paso => paso === 'enviar').length, 1);
  assert.ok(!eventos.includes('Listo'));
});

test('reutiliza el contacto existente sin crear otro', async () => {
  const adaptador = adaptadorFalso();
  adaptador.contactoPorCorreo = async () => { adaptador.pasos.push('buscar-contacto'); return '99'; };
  await ejecutarCarga(adaptador, {
    nombre: 'Ejemplo', apellido: 'Prueba', telefono: '0000000000',
    correo: 'ejemplo@example.invalid', carrera: 'Abogacía', nivel: 'Grado',
  });
  assert.ok(!adaptador.pasos.includes('crear-contacto'));
});

test('el modo sin crear no crea un contacto inexistente', async () => {
  const adaptador = adaptadorFalso();
  await assert.rejects(
    () => ejecutarCarga(adaptador, {
      nombre: 'Ejemplo', apellido: 'Prueba', telefono: '0000000000',
      correo: 'ejemplo@example.invalid', carrera: 'Abogacía', nivel: 'Grado',
    }, { noCrear: true }),
    /no se encontró/i,
  );
  assert.ok(!adaptador.pasos.includes('crear-contacto'));
});

test('el modo sin envío no pulsa Enviar', async () => {
  const adaptador = adaptadorFalso();
  await ejecutarCarga(adaptador, {
    nombre: 'Ejemplo', apellido: 'Prueba', telefono: '0000000000',
    correo: 'ejemplo@example.invalid', carrera: 'Abogacía', nivel: 'Grado',
  }, { secar: true });
  assert.ok(!adaptador.pasos.includes('enviar'));
});
