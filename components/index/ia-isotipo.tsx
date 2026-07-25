// Isotipo de la Academia Identidad Argentina (mismo path que el render de
// Remotion). Vive aparte porque lo usan el modal ('use client') y la pagina
// server-rendered de /carreras/[slug].

export const IA_AZUL = '#0090c1';
export const IA_AMARILLO = '#f1cf1c';

export default function IsotipoIA({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 2094 1502" role="img" aria-label="Academia Identidad Argentina">
      <polygon fill={IA_AZUL} points="8.78,1501.47 8.78,0 356.27,0 356.27,1501.47" />
      <path
        fill={IA_AMARILLO}
        d="M409.76 1501.47l261.12 -585.82 346.86 0.25 -251.91 585.57 -356.07 0zm669.23 -1501.46l343.19 0 671.38 1501.46 -364.64 0c-51.85,-125.8 -656.89,-1469.04 -649.92,-1501.46zm-334.61 1179.72l92.23 -263.83 772.18 0 94.37 263.83 -958.79 0z"
      />
    </svg>
  );
}
