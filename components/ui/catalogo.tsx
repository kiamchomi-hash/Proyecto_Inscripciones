import type { ReactNode } from 'react';
import { TarjetaSede } from './tarjeta-sede';

/**
 * El índice de la biblioteca de piezas. Lo lee `/laboratorio` para mostrarlas
 * renderizadas; agregar una pieza es agregar una entrada acá.
 *
 * Este archivo no se importa desde ninguna página del sitio: si lo hiciera,
 * arrastraría el CSS de todas las piezas al HTML de esa página (`inlineCss`
 * está prendido). Cada página importa sólo el componente que usa.
 */
export interface PiezaUI {
  /** Nombre del archivo sin extensión: `components/ui/<id>.tsx`. */
  id: string;
  titulo: string;
  /** Para qué sirve y cuándo conviene. Lo que uno quiere leer al elegir. */
  descripcion: string;
  /** De dónde salió, si vino de afuera. */
  origen?: string;
  /** Rutas del sitio donde ya está puesta. Vacío = todavía no se usa. */
  usadaEn: string[];
  /** Cómo se ve. Puede haber varias muestras si la pieza tiene variantes. */
  muestra: ReactNode;
}

export const CATALOGO: PiezaUI[] = [
  {
    id: 'tarjeta-sede',
    titulo: 'Tarjeta de sede',
    descripcion: 'Perfil institucional compacto con imagen, accesos a servicios y llamada a WhatsApp.',
    origen: 'Uiverse, fragmento CSS provisto por el usuario; adaptado a la identidad del CAU.',
    usadaEn: ['/sobre-nosotros'],
    muestra: <TarjetaSede />,
  },
];
