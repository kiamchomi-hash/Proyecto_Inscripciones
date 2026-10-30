import { useContext, useEffect, useRef, useState } from 'react';
import IsotipoIA from '@/components/index/ia-isotipo';
import {
  cargarScriptTurnstile, leerDemo, leerSitio, montarTurnstile,
  ANCHO_MINIMO_FLEXIBLE, TOKEN_DEMO,
  type DocumentoMinimo, type VentanaMinima,
} from './turnstile';
import { ContextoTurnstile } from './turnstile-contexto';

type Props = {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  /**
   * Qué marca lleva el marcador mientras el widget carga. Se declara acá y no
   * se importa de `casas.ts` para que el widget siga sirviendo a la FAQ y a
   * clases de apoyo, que no tienen casa.
   */
  marca?: 'siglo21' | 'teclab' | 'identidad';
  /** Modo invisible de Cloudflare: casi nunca pinta nada, sin marcador. */
  invisible?: boolean;
};

/** La marca de la casa, para el marcador. Identidad va en su isotipo propio. */
function Marca({ marca }: { marca: 'siglo21' | 'teclab' | 'identidad' }) {
  if (marca === 'identidad') return <IsotipoIA className="h-6 w-auto opacity-70" />;
  const src = marca === 'teclab'
    ? '/imagenes/teclab/logo-teclab.webp'
    : '/imagenes/imagenes_cau/siglo21-marca.svg';
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-6 w-auto opacity-40" />;
}

/**
 * Isla mínima del widget de Turnstile. Reemplaza a
 * `components/turnstile-widget.tsx` sólo en la procedencia de la site key: acá
 * sale del `<meta>` que arma el servidor con la variable de runtime (o del
 * contexto de la isla, para que el HTML renderizado en el servidor ya tenga el
 * hueco), en vez de `process.env` congelado en el build. El contrato hacia el
 * formulario es el mismo: un token de un solo uso y aviso de expiración.
 *
 * Los tres estados son los del sitio: sin site key no se pinta nada y no se
 * puede enviar; con site key se reserva el hueco de 71 px (140 px compacto con
 * el marcador «Verificación de seguridad» hasta que carga el iframe); en demo
 * no se toca Cloudflare y el token sale solo.
 */
export default function TurnstileWidget({ onVerify, onExpire, marca = 'siglo21', invisible = false }: Props) {
  const config = useContext(ContextoTurnstile);
  // En el servidor la configuración viene del contexto; el meta es el respaldo
  // para una página que no lo provea (se lee recién en el cliente).
  const [sitio, setSitio] = useState<string | null>(() => config?.sitio ?? null);
  const [demo, setDemo] = useState<boolean>(() => config?.demo ?? false);
  const contenedor = useRef<HTMLDivElement>(null);
  // Lo que se mide es el envoltorio y no el contenedor: en modo compacto el
  // envoltorio centra con flex y el contenedor se encoge al ancho del widget.
  const envoltorio = useRef<HTMLDivElement>(null);
  // Mientras Cloudflare no pintó el iframe, su lugar reservado es un hueco
  // vacío que aleja al botón de los datos. El marcador lo ocupa hasta que el
  // iframe termina de cargar; recién entonces se revela el widget.
  const [montado, setMontado] = useState(false);
  const [compacto, setCompacto] = useState(false);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  }, [onExpire, onVerify]);

  useEffect(() => {
    if (config) return;
    if (typeof document === 'undefined') return;
    setSitio(leerSitio(document as unknown as DocumentoMinimo));
    setDemo(leerDemo(document as unknown as DocumentoMinimo));
  }, [config]);

  // Demo: no se carga Cloudflare aunque haya site key y el token sale solo.
  useEffect(() => {
    if (demo) onVerifyRef.current(TOKEN_DEMO);
  }, [demo]);

  useEffect(() => {
    if (demo || !sitio || !contenedor.current) return;
    const documento = document as unknown as DocumentoMinimo;
    const ventana = window as unknown as VentanaMinima;
    let vigente = true;
    const medirCompacto = () =>
      (envoltorio.current ?? contenedor.current)!.clientWidth < ANCHO_MINIMO_FLEXIBLE;
    const control = montarTurnstile({
      sitio,
      contenedor: contenedor.current,
      documento,
      ventana,
      demo,
      cargar: () => cargarScriptTurnstile(documento, ventana),
      onVerify: token => onVerifyRef.current(token),
      onExpire: () => onExpireRef.current?.(),
      medirCompacto,
      onDibujado: elegido => {
        if (!vigente) return;
        setCompacto(elegido);
        setMontado(false);
      },
      onMontado: () => {
        if (vigente) setMontado(true);
      },
    });

    // El tamaño se elige al dibujar. Si el ancho cruza el umbral después
    // (girar el celular, achicar el navegador), el widget quedaba trabado en
    // el tamaño equivocado: el módulo se encarga de redibujar y descartar el
    // token anterior.
    let medidor: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      medidor = new ResizeObserver(() => control.redibujar());
      medidor.observe(envoltorio.current ?? contenedor.current);
    }

    return () => {
      vigente = false;
      medidor?.disconnect();
      control.desmontar();
    };
  }, [demo, invisible, sitio]);

  if (demo || !sitio) return null;

  // Invisible: el contenedor queda vacío y sólo crece si Cloudflare tiene que
  // mostrar el desafío.
  if (invisible) return <div ref={contenedor} className="flex justify-center" />;

  // El iframe del widget mide 71 px al montar (medido en prod, desktop y
  // mobile); sin reservar ese lugar, todo lo que está debajo salta cuando
  // aparece. El compacto mide 150 x 146 y va centrado.
  return (
    <div ref={envoltorio} className={compacto ? 'relative flex min-h-[146px] justify-center' : 'relative min-h-[71px]'}>
      {!montado && (
        // El marcador ocupa el lugar del widget y mide lo mismo que él. En
        // flexible se estira al ancho de la tarjeta (71 px de alto, como el
        // widget real). En compacto se queda en 150 x 146 centrado: estirado al
        // ancho de la tarjeta quedaba un rectángulo grande y el logotipo de la
        // marca se cortaba contra el borde derecho.
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute z-10 flex items-center justify-center border border-[var(--catalogo-acento)]/25 bg-[var(--catalogo-form-campo)] ${
            compacto
              ? 'inset-y-0 left-1/2 w-[150px] -translate-x-1/2 flex-col gap-2 px-3 text-center'
              : 'inset-0 gap-3 px-4'
          }`}
        >
          <span className={`flex justify-center gap-2 font-bold uppercase tracking-wider text-[var(--catalogo-etiqueta)] ${
            compacto ? 'flex-col items-center gap-1.5 text-[10px] leading-tight' : 'items-center text-[11px]'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--catalogo-acento)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Verificación de seguridad
          </span>
          {!compacto && <Marca marca={marca} />}
        </div>
      )}
      {/* Ocultar el iframe evita que se vea a través de fondos transparentes. */}
      <div ref={contenedor} style={{ visibility: montado ? 'visible' : 'hidden', opacity: montado ? 1 : 0 }} />
    </div>
  );
}
