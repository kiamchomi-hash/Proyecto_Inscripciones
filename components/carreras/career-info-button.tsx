'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { sendGAEvent } from '@next/third-parties/google';
import type { Carrera } from '@/components/index/types';
import CareerInfoModal from '@/components/index/career-info-modal';

interface Props {
  carrera: Carrera;
}

function InfoIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6M12 7h.01" />
    </svg>
  );
}

export default function CareerInfoButton({ carrera }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => {
    setIsOpen(true);

    if (process.env.NEXT_PUBLIC_GA_ID) {
      sendGAEvent('event', 'career_info_open', {
        career_name: carrera.nombre,
        career_level: carrera.nivel ?? 'sin_nivel',
        source: 'career_page',
      });
    }
  };

  return (
    <>
      <button
        type="button"
        className="career-button career-button--info"
        onClick={openModal}
        aria-haspopup="dialog"
      >
        Ver info <InfoIcon />
      </button>

      {isOpen && createPortal(
        <CareerInfoModal carrera={carrera} onClose={() => setIsOpen(false)} />,
        document.body,
      )}
    </>
  );
}
