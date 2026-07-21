// Isotipo de Academia Identidad Argentina (franja azul + "A" amarilla).
// Se usa como marca de agua en las tarjetas y en el modal del convenio.
export function IdentidadArgentinaMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 2094 1502" aria-hidden="true" focusable="false">
      <polygon fill="var(--ia-blue)" points="8.78,1501.47 8.78,0 356.27,0 356.27,1501.47" />
      <path fill="var(--ia-yellow)" d="M409.76 1501.47l261.12 -585.82 346.86 0.25 -251.91 585.57 -356.07 0zm669.23 -1501.46l343.19 0 671.38 1501.46 -364.64 0c-51.85,-125.8 -656.89,-1469.04 -649.92,-1501.46zm-334.61 1179.72l92.23 -263.83 772.18 0 94.37 263.83 -958.79 0z" />
    </svg>
  );
}
