'use client';

import dynamic from 'next/dynamic';
import type { Carrera } from './types';
import { esCursoTeclab, esTeclab } from './teclab';

const CareerModal = dynamic(() => import('./career-modal'));
const CarouselModal = dynamic(() => import('./carousel-modal'));
const IAModal = dynamic(() => import('./ia-modal'));
const TeclabModal = dynamic(() => import('./teclab-modal'));

interface Props {
  carrera: Carrera;
  onClose: () => void;
}

export default function CareerInfoModal({ carrera, onClose }: Props) {
  if (carrera.nivel === 'Identidad Argentina') {
    return <IAModal carrera={carrera} onClose={onClose} />;
  }

  // Los cursos comparten el modal de las tecnicaturas: mismo armado desde los
  // campos de texto, con el ambar de curso en vez del acento de la familia.
  if (esTeclab(carrera) || esCursoTeclab(carrera)) {
    return <TeclabModal carrera={carrera} onClose={onClose} />;
  }

  if (carrera.slides && carrera.slides.length > 0) {
    return <CarouselModal carrera={carrera} onClose={onClose} />;
  }

  return <CareerModal carrera={carrera} onClose={onClose} />;
}
