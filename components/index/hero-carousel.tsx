'use client';

import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Carrusel de la portada. El track se sigue moviendo con `translateX` (un slide
 * por vista), pero los controles son nativos:
 *
 * - «anterior» y «siguiente» son `<button>`, no flechas decorativas;
 * - un botón por slide, con `aria-current` en el activo, en vez de puntos con
 *   `aria-hidden`;
 * - pausa explícita: el contenido rota solo cada cinco segundos y WCAG 2.2.2
 *   pide un control para detenerlo. `hover` y `touch` no alcanzan a quien
 *   navega con teclado;
 * - las slides que no se ven llevan `inert`, así el Tab no cae en enlaces de
 *   una slide fuera de vista;
 * - el cambio se anuncia en una región `role="status"`, y sólo cuando lo pide
 *   la persona: el avance automático no debe hablar cada cinco segundos.
 */
export default function HeroCarousel({ children }: Props) {
  const slides = Children.toArray(children);
  const total = slides.length;
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [enHover, setEnHover] = useState(false);
  const [anuncio, setAnuncio] = useState('');
  const touchStartRef = useRef<number | null>(null);

  const irA = useCallback(
    (indice: number) => {
      const destino = (indice + total) % total;
      setActual(destino);
      setAnuncio(`Slide ${destino + 1} de ${total}`);
    },
    [total],
  );

  useEffect(() => {
    if (pausado || enHover || total < 2) return;
    // La preferencia se consulta también al cambiarla, sin dejar un temporizador vivo.
    const movimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer: ReturnType<typeof setInterval> | undefined;
    const actualizar = () => {
      if (timer) clearInterval(timer);
      // Con movimiento reducido no rota sola: cambia sólo cuando la persona lo pide.
      if (!movimiento.matches) {
        timer = setInterval(() => setActual((prev) => (prev + 1) % total), 5000);
      }
    };
    actualizar();
    movimiento.addEventListener('change', actualizar);
    return () => {
      clearInterval(timer);
      movimiento.removeEventListener('change', actualizar);
    };
  }, [total, pausado, enHover, actual]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setEnHover(true);
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setEnHover(false);
    if (touchStartRef.current === null) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) irA(actual + (diff > 0 ? 1 : -1));
    touchStartRef.current = null;
  };

  const botonControl =
    'grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/70 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 transition-colors';

  return (
    <section
      className="banner-carousel-container relative"
      aria-roledescription="carrusel"
      aria-label="Novedades del CAU"
      onMouseEnter={() => setEnHover(true)}
      onMouseLeave={() => setEnHover(false)}
    >
      <div
        className="banner-carousel-track"
        style={{ transform: `translateX(-${actual * 100}%)` }}
      >
        {slides.map((slide, i) =>
          isValidElement(slide)
            ? cloneElement(slide as ReactElement<Record<string, unknown>>, {
                role: 'group',
                'aria-roledescription': 'slide',
                'aria-label': `${i + 1} de ${total}`,
                inert: i !== actual,
              })
            : slide,
        )}
      </div>

      <div
        className="flex w-full flex-wrap items-center justify-center gap-1 bg-black/30 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={() => irA(actual - 1)}
          aria-label="Slide anterior"
          className={botonControl}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="flex items-center gap-1">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => irA(i)}
              aria-label={`Ir a la slide ${i + 1} de ${total}`}
              aria-current={i === actual ? 'true' : undefined}
              className="grid h-6 w-6 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            >
              <span className={`carousel-dot ${i === actual ? 'active' : ''}`} aria-hidden="true" />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => irA(actual + 1)}
          aria-label="Slide siguiente"
          className={botonControl}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setPausado((prev) => !prev)}
          aria-pressed={pausado}
          aria-label={pausado ? 'Reanudar el carrusel' : 'Pausar el carrusel'}
          className={`${botonControl} ml-1`}
        >
          {pausado ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M8 5.5v13l11-6.5-11-6.5Z" />
            </svg>
          ) : (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
              <rect x="7" y="5" width="3.5" height="14" rx="1" />
              <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
            </svg>
          )}
        </button>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {anuncio}
      </p>
    </section>
  );
}
