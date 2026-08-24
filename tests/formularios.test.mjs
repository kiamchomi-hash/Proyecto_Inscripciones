import test from 'node:test';
import assert from 'node:assert/strict';

import { CAMPOS, CASAS, armarPayload, camposComunes, camposDe, camposPosibles, casaDeCarrera, columnaDe, obligatoriosDe } from '../components/formularios/casas.ts';
import { esCarreraVisible } from '../components/index/types.ts';

// La oferta que el sitio publica hoy, segun getCategoryForCarrera().
const NIVELES_DE_LA_OFERTA = [
  'Grado', 'Grado (CCC)', 'Pregrado', 'Identidad Argentina',
  'Teclab - Tecnología', 'Teclab - Curso', 'Teclab - Gestión',
];

test('cada campo declara la columna real de la tabla', () => {
  // Las dos que rompieron produccion el 23/08: la tabla las llama asi.
  assert.equal(columnaDe('lugarNacimiento'), 'localidad_nacimiento');
  assert.equal(columnaDe('domicilio'), 'direccion');
});

test('ningun campo comparte columna con otro', () => {
  const columnas = Object.values(CAMPOS).map(campo => campo.columna);
  assert.equal(new Set(columnas).size, columnas.length);
});

test('la casa sale del nivel de la carrera', () => {
  assert.equal(casaDeCarrera({ nivel: 'Grado' }), 'siglo21');
  assert.equal(casaDeCarrera({ nivel: 'Grado (CCC)' }), 'siglo21');
  assert.equal(casaDeCarrera({ nivel: 'Pregrado' }), 'siglo21');
  assert.equal(casaDeCarrera({ nivel: 'Teclab - Tecnología' }), 'teclab');
  assert.equal(casaDeCarrera({ nivel: 'Teclab - Gestión' }), 'teclab');
  assert.equal(casaDeCarrera({ nivel: 'Teclab - Curso' }), 'teclab');
  assert.equal(casaDeCarrera({ nivel: 'Identidad Argentina' }), 'identidad');
});

test('una carrera fuera de la oferta no tiene casa', () => {
  // Posgrado y Certificacion no se dictan: `esCarreraVisible` ya las filtra.
  assert.equal(casaDeCarrera({ nivel: 'Posgrado' }), null);
  assert.equal(casaDeCarrera(null), null);
});

test('Identidad no pide legajo: no hay requisitos de ingreso', () => {
  const campos = camposDe('identidad', 'preinscripcion');
  for (const ausente of ['colegio', 'nivelEstudios', 'estadoCivil', 'domicilio', 'medioPago']) {
    assert.ok(!campos.includes(ausente), `identidad no deberia pedir ${ausente}`);
  }
  assert.ok(campos.includes('dni'));
  assert.ok(campos.includes('localidad'));
});

test('las equivalencias son solo de Siglo 21', () => {
  assert.ok(camposDe('siglo21', 'contacto').includes('equivalencias'));
  assert.ok(!camposDe('teclab', 'contacto').includes('equivalencias'));
  assert.ok(!camposDe('identidad', 'contacto').includes('equivalencias'));
});

test('el contacto es corto en las tres casas', () => {
  for (const casa of ['siglo21', 'teclab', 'identidad']) {
    assert.ok(camposDe(casa, 'contacto').length <= 8, `el contacto de ${casa} se hizo largo`);
  }
});

test('todo campo declarado por una casa existe en el registro', () => {
  for (const casa of ['siglo21', 'teclab', 'identidad']) {
    for (const modo of ['contacto', 'preinscripcion']) {
      for (const campo of camposDe(casa, modo)) {
        assert.ok(CAMPOS[campo], `${casa}.${modo} declara un campo inexistente: ${campo}`);
      }
    }
  }
});

test('las casas cubren toda la oferta visible, y nada mas', () => {
  // Si manana entra un nivel nuevo a la taxonomia, este test avisa: sin casa,
  // esa carrera no podria preinscribirse desde ningun formulario.
  const declarados = Object.values(CASAS).flatMap(casa => casa.niveles);
  for (const nivel of declarados) {
    assert.ok(esCarreraVisible({ nivel }), `${nivel} no es parte de la oferta visible`);
  }
  for (const nivel of NIVELES_DE_LA_OFERTA) {
    assert.ok(declarados.includes(nivel), `ninguna casa reclama el nivel ${nivel}`);
  }
});

test('lo que la casa no pide no viaja, aunque este cargado', () => {
  // El lead completo medio legajo de Siglo 21 y despues eligio una diplomatura.
  const estado = {
    nombre: 'Ana', apellido: 'Diaz', dni: '30111222',
    colegio: 'Normal 5', medioPago: 'Tarjeta', estadoCivil: 'Soltero/a',
  };
  const payload = armarPayload('identidad', 'preinscripcion', estado);

  assert.equal(payload.nombre, 'Ana');
  assert.equal(payload.dni, '30111222');
  for (const ausente of ['colegio', 'medioPago', 'estadoCivil']) {
    assert.equal(ausente in payload, false, `${ausente} no deberia viajar a identidad`);
  }
});

test('el sobre lleva la casa y el modo', () => {
  const payload = armarPayload('teclab', 'preinscripcion', {});
  assert.equal(payload.casa, 'teclab');
  assert.equal(payload.tipoFormulario, 'preinscripcion');
});

test('las equivalencias no se cuelan en una casa que no las ofrece', () => {
  // El caso real: lo tildo con una licenciatura elegida y despues paso a Teclab.
  const payload = armarPayload('teclab', 'contacto', { equivalencias: true, nombre: 'Ana' });
  assert.equal('equivalencias' in payload, false);
  assert.equal(payload.nombre, 'Ana');
});

test('un campo vacio viaja igual: borrar un dato tiene que poder guardarse', () => {
  const payload = armarPayload('identidad', 'preinscripcion', { nombre: '', dni: '30111222' });
  assert.equal('nombre' in payload, true);
  assert.equal(payload.nombre, '');
});

test('la preinscripcion de Siglo 21 es la del portal', () => {
  const campos = camposDe('siglo21', 'preinscripcion');

  // Los que suma respecto de Teclab.
  for (const propio of ['tipoDocumento', 'paisResidencia', 'tipoDomicilio', 'torre', 'barrio']) {
    assert.ok(campos.includes(propio), `Siglo 21 pide ${propio}`);
  }
  // Los que el portal NO pide, aunque Teclab si.
  for (const ajeno of ['nivelEstudios', 'colegio', 'colegioLocalidad', 'medioPago', 'equivalencias']) {
    assert.ok(!campos.includes(ajeno), `el portal de Siglo 21 no pide ${ajeno}`);
  }
});

test('los obligatorios de una casa son campos que esa casa pide', () => {
  for (const casa of ['siglo21', 'teclab', 'identidad']) {
    for (const modo of ['contacto', 'preinscripcion']) {
      const campos = camposDe(casa, modo);
      for (const campo of obligatoriosDe(casa, modo)) {
        assert.ok(campos.includes(campo), `${casa}.${modo} exige ${campo} sin pedirlo`);
      }
    }
  }
});

test('el contacto no exige nada: la regla es mail o telefono', () => {
  // Un contacto que bloquea pierde el lead. El legajo si puede exigir.
  for (const casa of ['siglo21', 'teclab', 'identidad']) {
    assert.deepEqual(obligatoriosDe(casa, 'contacto'), []);
  }
  assert.ok(obligatoriosDe('siglo21', 'preinscripcion').length > 0);
});

test('no se pregunta la modalidad: toda la oferta es virtual', () => {
  for (const casa of ['siglo21', 'teclab', 'identidad']) {
    for (const modo of ['contacto', 'preinscripcion']) {
      assert.ok(!camposDe(casa, modo).includes('modalidad'), `${casa}.${modo} sigue pidiendo modalidad`);
    }
  }
});

test('sin carrera elegida se piden los campos que toda casa comparte', () => {
  // La home antes de que el lead elija: no se puede saber la casa todavia.
  const contacto = camposComunes('contacto');
  assert.deepEqual(contacto, ['nombre', 'apellido', 'localidad', 'email', 'telefono']);
  // Nada exclusivo de una casa puede colarse ahi.
  assert.ok(!contacto.includes('equivalencias'));

  const pre = camposComunes('preinscripcion');
  for (const casa of ['siglo21', 'teclab', 'identidad']) {
    for (const campo of pre) {
      assert.ok(camposDe(casa, 'preinscripcion').includes(campo), `${casa} no pide ${campo}`);
    }
  }
});

test('cada campo cae en un grupo conocido', () => {
  const grupos = ['consulta', 'personales', 'domicilio', 'estudios', 'contacto'];
  for (const [id, campo] of Object.entries(CAMPOS)) {
    assert.ok(grupos.includes(campo.grupo), `${id} tiene un grupo raro: ${campo.grupo}`);
  }
});

test('equivalencias no se ofrecen hasta saber que la casa es Siglo 21', () => {
  // Solo Siglo 21 las acredita. Mostrarlas "por las dudas" en la home promete
  // algo que Teclab e Identidad no pueden cumplir.
  assert.ok(!camposComunes('contacto').includes('equivalencias'));
  assert.ok(camposDe('siglo21', 'contacto').includes('equivalencias'));
  for (const casa of ['teclab', 'identidad']) {
    for (const modo of ['contacto', 'preinscripcion']) {
      assert.ok(!camposDe(casa, modo).includes('equivalencias'), `${casa} no acredita equivalencias`);
    }
  }
});

test('el contacto reserva el lugar de todo lo que alguna casa pide', () => {
  // Sin esto el formulario se agranda y se achica al cambiar de carrera: es el
  // checkbox de equivalencias, que solo tiene Siglo 21.
  const posibles = camposPosibles('contacto');
  for (const casa of ['siglo21', 'teclab', 'identidad']) {
    for (const campo of camposDe(casa, 'contacto')) {
      assert.ok(posibles.includes(campo), `${casa} pide ${campo} y no esta reservado`);
    }
  }
  assert.ok(posibles.includes('equivalencias'));
  // Y sigue sin viajar cuando la casa no lo pide.
  assert.equal('equivalencias' in armarPayload('teclab', 'contacto', { equivalencias: true }), false);
});

test('el codigo postal es obligatorio en Siglo 21', () => {
  const obl = obligatoriosDe('siglo21', 'preinscripcion');
  assert.ok(obl.includes('codigoPostal'));
  // Los que dependen de como sea el domicilio siguen sin exigirse.
  for (const suelto of ['domicilioPiso', 'domicilioDepartamento', 'torre', 'telefono']) {
    assert.ok(!obl.includes(suelto), `${suelto} no puede ser obligatorio`);
  }
});

test('piso, depto y torre son opcionales por lo que son, no por la casa', () => {
  // Un domicilio tiene piso o no lo tiene: no depende de la institucion. Sin
  // esto, en Teclab -que aun no declaro obligatorios- se leian como exigidos.
  for (const id of ['domicilioPiso', 'domicilioDepartamento', 'torre']) {
    assert.equal(CAMPOS[id].siempreOpcional, true, `${id} deberia ser siempre opcional`);
  }
  // Y ninguna casa puede exigirlos.
  for (const casa of ['siglo21', 'teclab', 'identidad']) {
    for (const id of obligatoriosDe(casa, 'preinscripcion')) {
      assert.ok(!CAMPOS[id].siempreOpcional, `${casa} exige ${id}, que es siempre opcional`);
    }
  }
});
