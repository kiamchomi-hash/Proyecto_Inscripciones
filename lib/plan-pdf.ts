import type { AnioPlan } from '@/components/carreras/career-content';

/**
 * Arma el PDF del plan de estudios en el navegador, con los mismos datos que
 * ya están en la página. No hay archivo estático: el plan sale de la base y
 * así no queda un PDF viejo al lado de una ficha actualizada.
 *
 * Lo comparten el modal de Siglo 21 y el botón de las fichas de Teclab.
 * jsPDF se carga en el momento del clic: no viaja en el bundle inicial.
 */
export async function descargarPlanPDF(anios: AnioPlan[], carreraNombre: string): Promise<void> {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default ?? jsPDFModule.jsPDF;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const marginL = 18;
  const marginR = 18;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 15) {
      doc.addPage();
      y = 20;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(1, 55, 41); // #013729
  doc.text(carreraNombre.toUpperCase(), marginL, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('PLAN DE ESTUDIOS', marginL, y);
  y += 3;
  doc.setDrawColor(0, 199, 177); // #00c7b1
  doc.setLineWidth(0.6);
  doc.line(marginL, y, marginL + contentW, y);
  y += 10;

  const renderYear = (anio: AnioPlan) => {
    doc.setFillColor(232, 245, 243);
    doc.rect(marginL, y - 4, contentW, 8, 'F');
    doc.setFillColor(0, 199, 177);
    doc.rect(marginL, y - 4, 1.2, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(1, 55, 41);
    doc.text(anio.anio.toUpperCase(), marginL + 4, y + 1);
    y += 10;

    for (const cuatri of anio.cuatrimestres) {
      checkPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 85, 135); // #005587
      doc.text(cuatri.label.toUpperCase(), marginL + 5, y);
      y += 4;

      for (const materia of cuatri.materias) {
        checkPage(6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 51, 51);
        doc.setFillColor(0, 199, 177);
        doc.circle(marginL + 7, y - 1, 0.8, 'F');
        doc.text(materia, marginL + 11, y);
        y += 4.5;
      }
      y += 2;
    }
    y += 3;
  };

  // Primera página: hasta tres años. El resto sigue en la segunda.
  for (let i = 0; i < Math.min(3, anios.length); i++) {
    renderYear(anios[i]);
  }

  if (anios.length > 3) {
    doc.addPage();
    y = 20;
    for (let i = 3; i < anios.length; i++) {
      renderYear(anios[i]);
    }
  }

  doc.save(`Plan de Estudios - ${carreraNombre}.pdf`);
}
