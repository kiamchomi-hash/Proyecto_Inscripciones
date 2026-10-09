import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PERFILES, PREGUNTAS, perfilDe, puntuar, recomendar } from '../components/test-vocacional-teclab/puntaje.ts';

// Las 21 tecnicaturas activas de Teclab al 09/10/2026, tal como vienen de Supabase
// (id, nombre, nombre_corto y orden). El test no es la fuente de datos: sirve
// para probar que cada una tiene perfil y puede salir primera.
const CARRERAS = [
  [217, 'Tecnicatura Superior en Programación', 'Programación', 1001],
  [218, 'Tecnicatura Superior en Data Science', 'Data Science', 1002],
  [219, 'Tecnicatura Superior en Quality Assurance', 'Quality Assurance', 1003],
  [220, 'Tecnicatura Superior en Redes Informáticas', 'Redes Informáticas', 1004],
  [221, 'Tecnicatura Superior en Seguridad Informática', 'Seguridad Informática', 1005],
  [222, 'Tecnicatura Superior en Cloud Administration', 'Cloud Administration', 1006],
  [223, 'Tecnicatura Superior en Marketing Digital', 'Marketing Digital', 1007],
  [224, 'Tecnicatura Superior en Inbound Marketing', 'Inbound Marketing', 1008],
  [225, 'Tecnicatura Superior en Experiencia del Cliente', 'Customer Experience', 1009],
  [227, 'Tecnicatura Superior en Gestión Contable', 'Gestión Contable', 1011],
  [228, 'Tecnicatura Superior en Seguros', 'Seguros', 1012],
  [229, 'Tecnicatura Superior en Gestión Agraria', 'Gestión Agraria', 1013],
  [230, 'Tecnicatura Superior en Relaciones Laborales', 'Relaciones Laborales', 1014],
  [231, 'Tecnicatura Superior en Gestión Hotelera', 'Gestión Hotelera', 1015],
  [232, 'Tecnicatura Superior en Planificación y Organización de Eventos', 'Planificación y Organización de Eventos', 1016],
  [233, 'Tecnicatura Superior en Periodismo y Nuevas Tecnologías', 'Periodismo y Nuevas Tecnologías', 1017],
  [246, 'Tecnicatura Superior en Gestión de Alimentos', 'Gestión de Alimentos', 1104],
  [242, 'Tecnicatura Superior en Gestión de Energías Renovables', 'Gestión de Energías Renovables', 1105],
  [247, 'Tecnicatura Superior en Gestión de Proyectos Mineros', 'Gestión de Proyectos Mineros', 1106],
  [248, 'Tecnicatura Superior en Gestión Ambiental', 'Gestión Ambiental', 1107],
  [249, 'Tecnicatura Superior en Higiene y Seguridad en el Trabajo', 'Higiene y Seguridad en el Trabajo', 1108],
].map(([id, nombre, nombre_corto, orden]) => ({ id, nombre, nombre_corto, orden }));

test('cada carrera actual tiene un perfil propio, distinto del de las demás', () => {
  const perfiles = CARRERAS.map(carrera => perfilDe(carrera));
  CARRERAS.forEach((carrera, i) => assert.ok(perfiles[i], `${carrera.nombre} no tiene perfil`));
  assert.equal(new Set(perfiles).size, CARRERAS.length);
  assert.equal(PERFILES.length, CARRERAS.length);
});

test('el curso de IA no entra en el test', () => {
  const curso = { id: 235, nombre: 'Actualización Profesional en Inteligencia Artificial', nombre_corto: null, orden: 1018 };
  assert.equal(perfilDe(curso), null);
  const pagina = readFileSync(new URL('../app/teclab/test-vocacional/page.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(pagina, /Teclab - Curso|esCursoTeclab/);
});

test('una carrera sin perfil no rompe nada y queda fuera del resultado', () => {
  const nueva = { id: 999, nombre: 'Tecnicatura Superior en Algo Nuevo', nombre_corto: null, orden: 1 };
  assert.equal(perfilDe(nueva), null);
  const resultado = recomendar([nueva, ...CARRERAS], [0, 0, 0, 0, 0, 0]);
  assert.equal(resultado.length, 3);
  assert.ok(resultado.every(({ carrera }) => carrera.id !== 999));
  assert.deepEqual(recomendar([nueva], [0]), []);
});

test('las preguntas son de una sola respuesta y caben en el lugar reservado', () => {
  assert.ok(PREGUNTAS.length >= 6 && PREGUNTAS.length <= 8);
  const ids = new Set(PERFILES.map(perfil => perfil.id));
  for (const pregunta of PREGUNTAS) {
    assert.ok(pregunta.opciones.length >= 3 && pregunta.opciones.length <= 6, pregunta.pregunta);
    for (const opcion of pregunta.opciones) {
      for (const id of Object.keys(opcion.puntos)) assert.ok(ids.has(id), `${opcion.texto}: perfil ${id} inexistente`);
    }
  }
});

test('el puntaje suma por carrera e ignora respuestas fuera de rango', () => {
  const opcion = PREGUNTAS[0].opciones[0];
  assert.deepEqual(puntuar([0]), opcion.puntos);
  assert.deepEqual(puntuar([0, 99, -1]), opcion.puntos);
  assert.deepEqual(puntuar([]), {});
});

test('el resultado es determinístico y el empate se resuelve por orden del catálogo', () => {
  // Sin respuestas todas empatan en cero: manda el `orden`, después el `id`.
  const empate = recomendar([...CARRERAS].reverse(), []);
  assert.deepEqual(empate.map(({ carrera }) => carrera.id), [217, 218, 219]);
  const respuestas = [1, 3, 0, 0, 1, 1];
  assert.deepEqual(recomendar(CARRERAS, respuestas), recomendar([...CARRERAS].reverse(), respuestas));
  const puntos = recomendar(CARRERAS, respuestas).map(({ puntos }) => puntos);
  assert.deepEqual(puntos, [...puntos].sort((a, b) => b - a));
});

test('cada una de las 21 tecnicaturas puede salir primera con alguna combinación', () => {
  const ganadoras = new Map();
  const total = PREGUNTAS.reduce((producto, pregunta) => producto * pregunta.opciones.length, 1);
  for (let n = 0; n < total; n++) {
    let resto = n;
    const respuestas = PREGUNTAS.map(pregunta => {
      const indice = resto % pregunta.opciones.length;
      resto = Math.floor(resto / pregunta.opciones.length);
      return indice;
    });
    // Primera por puntos, sin ayuda del desempate por orden.
    const [primera, segunda] = recomendar(CARRERAS, respuestas, 2);
    if (primera.puntos > segunda.puntos && !ganadoras.has(primera.carrera.id)) ganadoras.set(primera.carrera.id, respuestas);
    if (ganadoras.size === CARRERAS.length) break;
  }
  const faltan = CARRERAS.filter(carrera => !ganadoras.has(carrera.id)).map(carrera => carrera.nombre_corto);
  assert.deepEqual(faltan, []);
});

test('el componente avanza con un toque, reserva el lugar y lleva a la ficha y a WhatsApp', () => {
  const componente = readFileSync(new URL('../components/test-vocacional-teclab/test-vocacional-teclab.tsx', import.meta.url), 'utf8');
  const estilos = readFileSync(new URL('../app/teclab/test-vocacional/test-vocacional-teclab.css', import.meta.url), 'utf8');
  assert.match(componente, /numeroWhatsAppDe\('teclab'\)/);
  assert.match(componente, /mensajeWhatsAppInfo\(/);
  assert.match(componente, /\/carreras\/\$\{carreraToSlug\(/);
  assert.match(componente, /Próximamente/);
  assert.doesNotMatch(componente, /<input|<textarea/);
  // La pregunta y las opciones tienen alto fijo: tocar no corre nada de lugar.
  assert.match(estilos, /\.tvt-pregunta\s*\{[^}]*height:/);
  assert.match(estilos, /\.tvt-opciones\s*\{[^}]*min-height:/);
});

test('la ruta está en el sitemap y enlazada desde /teclab', () => {
  const sitemap = readFileSync(new URL('../app/sitemap.ts', import.meta.url), 'utf8');
  const teclab = readFileSync(new URL('../app/teclab/page.tsx', import.meta.url), 'utf8');
  assert.match(sitemap, /\/teclab\/test-vocacional/);
  assert.match(teclab, /href="\/teclab\/test-vocacional"/);
});
