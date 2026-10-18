import { COLUMNAS_MATERIA_CARD, COLUMNAS_MATERIA_NAV, COLUMNAS_MATERIA_FICHA, COLUMNAS_MATERIA_BASICA, materiaACard, materiaAFicha, materiaAFichaBasica, materiaANavegacion } from '@/lib/datos/materia';
import type { TablesInsert } from '@/lib/database.types';
import type { Campo } from '@/components/formularios/casas';
import { CAMPOS, columnaDe } from '@/components/formularios/casas';
import { supabase } from '@/lib/supabase';
import { carreraADetalle, carreraAPublica, COLUMNAS_FICHA_DETALLE, COLUMNAS_CARRERA_PUBLICA } from '@/lib/datos/carrera-detalle';

// Este módulo sólo se compila con typecheck; no ejecuta consultas.
export function verificarContrato() {
  // @ts-expect-error Una tabla inexistente no debe compilar.
  supabase.from('tabla_inexistente');
  // @ts-expect-error Una columna de formulario inexistente no debe compilar.
  const columna: Campo['columna'] = 'lugar_nacimiento';
  // @ts-expect-error Un tipo de valor incorrecto no debe compilar.
  const fila: TablesInsert<'consultas'> = { equivalencias: 'sí' };
  // @ts-expect-error Un checkbox sólo puede apuntar a columnas booleanas.
  const checkbox: Campo = { columna: 'email', tipo: 'checkbox', grupo: 'contacto', label: 'Prueba', max: 0 };
  // @ts-expect-error Un campo textual no puede escribir en una columna booleana.
  const textual: Campo = { columna: 'equivalencias', tipo: 'texto', grupo: 'consulta', label: 'Prueba', max: 20 };
  // @ts-expect-error El id generado no es una columna editable del formulario.
  const identidad: Campo = { columna: 'id', grupo: 'personales', label: 'Prueba', max: 20 };
  // @ts-expect-error Una RPC inexistente no debe compilar.
  supabase.rpc('rpc_inexistente');
  // @ts-expect-error Los argumentos de la RPC deben coincidir con el esquema.
  supabase.rpc('check_form_rate_limit', { p_key: 'prueba' });
  void columna;
  void fila;
  void checkbox;
  void textual;
  void identidad;
}

export function verificarEscrituraDeCampos(campo: Campo) {
  const fila: TablesInsert<'consultas'> = {};
  const email: 'email' = columnaDe('email');
  const equivalencias: 'equivalencias' = columnaDe('equivalencias');
  fila[email] = null;
  fila[email] = 'persona@example.test';
  fila[equivalencias] = false;
  // @ts-expect-error La columna textual no admite booleanos.
  fila[columnaDe(CAMPOS.email)] = true;
  // @ts-expect-error La columna booleana no admite texto.
  fila[columnaDe(CAMPOS.equivalencias)] = 'true';
  if (campo.tipo === 'checkbox') {
    fila[columnaDe(campo)] = true;
    // @ts-expect-error La definición estrechada conserva la columna booleana.
    fila[columnaDe(campo)] = 'sí';
  } else {
    fila[columnaDe(campo)] = null;
    // @ts-expect-error La definición estrechada conserva la columna textual.
    fila[columnaDe(campo)] = false;
  }
  // @ts-expect-error Tampoco se permite el id generado en un checkbox.
  const identidad: Campo = { columna: 'id', tipo: 'checkbox', grupo: 'personales', label: 'Prueba', max: 0 };
  // @ts-expect-error Omitir tipo significa texto, no un checkbox implícito.
  const implicito: Campo = { columna: 'equivalencias', grupo: 'consulta', label: 'Prueba', max: 0 };
  void identidad;
  void implicito;
}

// Las proyecciones reales deben alimentar los adaptadores sin casts ni any.
export async function verificarProyeccionesCarrera() {
  const detalle = await supabase.from('carreras').select(COLUMNAS_FICHA_DETALLE);
  detalle.data?.forEach(fila => {
    carreraADetalle(fila);
    // @ts-expect-error La proyección de detalle no contiene columnas privadas.
    void fila.descuento_especial;
    // @ts-expect-error El detalle no alcanza para construir una carrera completa.
    carreraAPublica(fila);
  });
  const publicas = await supabase.from('carreras').select(COLUMNAS_CARRERA_PUBLICA);
  publicas.data?.forEach(fila => {
    const carrera = carreraAPublica(fila);
    // @ts-expect-error La carrera publicada no expone el descuento privado.
    void carrera.descuento_especial;
    // @ts-expect-error El JSON del esquema no puede usarse como slides sin validar.
    const slides: typeof carrera.slides = fila.slides;
    void slides;
  });
  const incompleta = await supabase.from('carreras').select('id, slides');
  incompleta.data?.forEach(fila => {
    // @ts-expect-error Faltan campos requeridos por la proyección de detalle.
    carreraADetalle(fila);
  });
  const incorrecta = await supabase.from('carreras').select('id, columna_inexistente');
  incorrecta.data?.forEach(fila => {
    // @ts-expect-error Una selección inválida no satisface el adaptador.
    carreraADetalle(fila);
  });
}

// Las materias públicas se construyen sólo desde sus proyecciones exactas.
export async function verificarProyeccionesMateria() {
  const cards = await supabase.from('materias').select(COLUMNAS_MATERIA_CARD);
  cards.data?.forEach(fila => {
    materiaACard(fila);
    // @ts-expect-error El listado no consulta la ficha completa.
    materiaAFicha(fila);
    // @ts-expect-error La navegación no puede inventar imágenes ausentes.
    materiaANavegacion(fila);
  });
  const fichas = await supabase.from('materias').select(COLUMNAS_MATERIA_FICHA);
  fichas.data?.forEach(fila => {
    const ficha = materiaAFicha(fila);
    // @ts-expect-error Json no demuestra que los párrafos sean strings.
    const parrafos: typeof ficha.texto_seo = fila.texto_seo;
    // @ts-expect-error La ficha pública no publica datos de infraestructura.
    void ficha.created_at;
    void parrafos;
  });
  const basicas = await supabase.from('materias').select(COLUMNAS_MATERIA_BASICA);
  basicas.data?.forEach(fila => {
    materiaAFichaBasica(fila);
    // @ts-expect-error El fallback no consultó texto_seo.
    materiaAFicha(fila);
  });
  const nav = await supabase.from('materias').select(COLUMNAS_MATERIA_NAV);
  nav.data?.forEach(fila => {
    materiaANavegacion(fila);
    // @ts-expect-error La navegación no consulta contenido SEO ajeno.
    void fila.texto_seo;
  });
  const incorrecta = await supabase.from('materias').select('id, columna_inexistente');
  incorrecta.data?.forEach(fila => {
    // @ts-expect-error Una proyección inválida no satisface el adaptador.
    materiaACard(fila);
  });
}
