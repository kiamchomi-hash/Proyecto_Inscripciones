import type { TablesInsert } from '@/lib/database.types';
import type { Campo } from '@/components/formularios/casas';
import { supabase } from '@/lib/supabase';

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
