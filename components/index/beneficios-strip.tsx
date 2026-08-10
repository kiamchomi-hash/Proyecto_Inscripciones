// RETIRADO — no lo importa nadie. Se guarda entero para poder reponerlo.
//
// Era la banda de beneficios que iba entre los filtros del catálogo y la primera
// fila de tarjetas, visible sólo en ≥768px. Se sacó el 10/08/2026 por decisión
// del usuario: en desktop empujaba las carreras hacia abajo y ese espacio es
// justo el que se mira primero.
//
// Para reponerlo: importar este componente en `careers-catalog.tsx` y ponerlo de
// nuevo entre el bloque de las píldoras de categoría y `<div className="main-grid">`.
// Los estilos viajan con él en `beneficios-strip.css`, así que mientras nadie lo
// importe tampoco pesan en el CSS de la home — que va inlineado en el HTML, donde
// cada KB de CSS cuesta unos 2,9 KB de documento.
//
// Los tres beneficios son los mismos que anuncia la slide 3 del carrusel del
// header (`hero.tsx`), así que sacarlo de acá no los deja sin contar en ningún
// lado.

import './beneficios-strip.css';

export default function BeneficiosStrip() {
  return (
    <div className="benefits-strip">
      <div className="benefits-strip-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
        Beneficios
      </div>
      <div className="benefits-strip-chips">
        <div className="sidebar-benefit-chip">
          <div className="sidebar-benefit-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 100 100" fill="none">
              <defs>
                <clipPath id="tennis-clip">
                  <circle cx="50" cy="50" r="46"/>
                </clipPath>
              </defs>
              <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="3"/>
              <g clipPath="url(#tennis-clip)" stroke="currentColor" strokeWidth="3">
                <path d="M 18,8 Q 30,50 18,92"/>
                <path d="M 82,8 Q 70,50 82,92"/>
              </g>
            </svg>
          </div>
          <div>
            <strong>Deportistas Federados</strong>
            <span><b className="sidebar-benefit-pct">10%</b> bonificacion en aranceles</span>
          </div>
        </div>
        <div className="sidebar-benefit-chip">
          <div className="sidebar-benefit-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="18"/><line x1="4" y1="21" x2="20" y2="21"/><rect x="7" y="6" width="3" height="3"/><rect x="14" y="6" width="3" height="3"/><rect x="7" y="12" width="3" height="3"/><rect x="14" y="12" width="3" height="3"/><rect x="10" y="18" width="4" height="3"/>
            </svg>
          </div>
          <div>
            <strong>Organizacion Amiga</strong>
            <span><b className="sidebar-benefit-pct">10%</b> familias y empresas con convenio</span>
          </div>
        </div>
        <div className="sidebar-benefit-chip">
          <div className="sidebar-benefit-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="7" r="4"/><path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2"/>
            </svg>
          </div>
          <div>
            <strong>Amigo Referido</strong>
            <span><b className="sidebar-benefit-pct">10%</b> para quien recomienda y el ingresante</span>
          </div>
        </div>
      </div>
    </div>
  );
}
