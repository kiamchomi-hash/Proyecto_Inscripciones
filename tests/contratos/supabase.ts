import type { TablesInsert } from '@/lib/database.types';
import type { Campo } from '@/components/formularios/casas';
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
  // @ts-expect-error Una RPC inexistente no debe compilar.
  supabase.rpc('rpc_inexistente');
  // @ts-expect-error Los argumentos de la RPC deben coincidir con el esquema.
  supabase.rpc('check_form_rate_limit', { p_key: 'prueba' });
  void columna;
  void fila;
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
