type EstadoCarrusel = { indice: number; detenido: boolean };
type AccionCarrusel = { tipo: 'avanzar' | 'detener' } | { tipo: 'seleccionar'; indice: number };

export function reducirCarrusel(estado: EstadoCarrusel, accion: AccionCarrusel, cantidad: number): EstadoCarrusel {
  if (accion.tipo === 'detener') return { ...estado, detenido: true };
  if (accion.tipo === 'seleccionar') return { indice: (accion.indice + cantidad) % cantidad, detenido: true };
  return estado.detenido ? estado : { ...estado, indice: (estado.indice + 1) % cantidad };
}
