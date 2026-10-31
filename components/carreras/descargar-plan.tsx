'use client';

import { useState } from 'react';
import type { AnioPlan } from './career-content';
import { descargarPlanPDF } from '@/lib/plan-pdf';

/**
 * Botón de descarga del plan de estudios de la ficha.
 *
 * Si Teclab publicó el programa oficial de esa carrera, éste es un enlace
 * directo al PDF (`oficial`): es el documento completo, con habilidades, áreas
 * de trabajo y ficha técnica. Si no lo publicó —las anunciadas «Próximamente»—,
 * se arma uno con el plan que ya está en la página, igual que el modal de
 * Siglo 21 (lib/plan-pdf.ts), para que la ficha no se quede sin descarga.
 */
export default function DescargarPlan({
  anios,
  carreraNombre,
  oficial,
}: {
  anios: AnioPlan[];
  carreraNombre: string;
  oficial?: string | null;
}) {
  const [armando, setArmando] = useState(false);

  if (oficial) {
    return (
      <a className="career-plan-download" href={oficial} download>
        <IconoDescarga />
        <span className="career-plan-download-label">Descargar plan de estudios</span>
      </a>
    );
  }

  async function descargar() {
    setArmando(true);
    try {
      await descargarPlanPDF(anios, carreraNombre);
    } finally {
      setArmando(false);
    }
  }

  return (
    <button
      type="button"
      className="career-plan-download"
      onClick={descargar}
      disabled={armando}
      aria-busy={armando || undefined}
    >
      <IconoDescarga />
      <span className="career-plan-download-label">Descargar plan de estudios</span>
    </button>
  );
}

function IconoDescarga() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
