'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

/* ── Carousel ──
   Es la única pieza de la ficha genérica que necesita el navegador; el resto
   de materia-generica.tsx se pinta en el servidor. */
export default function Carousel({ images }: { images: string[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <div className="relative h-full overflow-hidden bg-black">
      <div
        className="ca-carousel-track"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {images.map((src, i) => (
          <div key={i} className="relative min-w-full h-full">
            <Image
              src={src}
              alt="Apoyo Escolar"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
              priority={i === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
