'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  return (
    <header className="w-full mb-0 shadow-2xl overflow-hidden"
      style={{ backgroundColor: '#013729', borderBottom: '3px solid var(--color-highlight)' }}>
      <div className="mx-auto w-full p-4 sm:p-6 xl:px-20 flex flex-col xl:flex-row items-center justify-start gap-6 xl:gap-8">

        {/* Banner carousel */}
        <div className="flex-1 w-full xl:max-w-4xl order-2 xl:order-1 flex flex-col items-center min-w-0 overflow-hidden">
          <div className="banner-carousel-container">
            <div className="banner-carousel-track"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}>

              {/* Slide 1: Banner placeholder */}
              <div className="banner-slide">
                <div className="banner-placeholder">
                  <strong>Banner 1</strong>
                  <span>Desktop 1400 x 163 px</span>
                  <span>Mobile 750 x 375 px</span>
                </div>
              </div>

              {/* Slide 2: Banner placeholder */}
              <div className="banner-slide">
                <div className="banner-placeholder">
                  <strong>Banner 2</strong>
                  <span>Desktop 1400 x 163 px</span>
                  <span>Mobile 750 x 375 px</span>
                </div>
              </div>

              {/* Slide 3: Benefits */}
              <div className="banner-slide">
                <div className="banner-benefits-slide">
                  <div className="bbs-header">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Beneficios por convenio
                  </div>
                  <div className="bbs-items">
                    <div className="bbs-chip">
                      <div className="bbs-discount">10%</div>
                      <div className="bbs-chip-text">
                        <strong>Deportistas Federados</strong>
                        <span>bonificacion en aranceles</span>
                      </div>
                    </div>
                    <div className="bbs-chip">
                      <div className="bbs-discount">10%</div>
                      <div className="bbs-chip-text">
                        <strong>Organizacion Amiga</strong>
                        <span>familias y empresas con convenio</span>
                      </div>
                    </div>
                    <div className="bbs-chip">
                      <div className="bbs-discount">10%</div>
                      <div className="bbs-chip-text">
                        <strong>Amigo Referido</strong>
                        <span>para quien recomienda y el ingresante</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 py-2">
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  className={`carousel-dot ${i === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Separator (desktop) */}
        <div className="hidden xl:block xl:order-2 w-px bg-white opacity-10 h-32 self-center mx-3" />

        {/* Branding block (desktop) */}
        <div className="hidden xl:flex items-center justify-center gap-8 order-1 xl:order-3 shrink-0">
          <Image
            src="/imagenes/imagenes_cau/logo_cau.png"
            alt="Logo CAU Villa Lugano - Universidad Siglo 21"
            width={96}
            height={96}
            className="w-24 h-24 object-contain brightness-0 invert"
            loading="lazy"
          />
          <div className="flex flex-col h-auto justify-center gap-1 py-1 min-w-[200px]">
            <h1 className="text-xl md:text-2xl font-black text-white leading-tight uppercase tracking-tighter whitespace-nowrap">
              CAU - VILLA LUGANO
            </h1>
            <p className="text-lg md:text-xl font-black text-[#00c7b1] uppercase tracking-wider leading-none">
              SIGLO 21
            </p>
            <span className="text-lg md:text-xl font-bold text-white uppercase leading-none tracking-tight">
              30 años de experiencia
            </span>
            <span className="flex items-center gap-1.5 text-sm text-white font-semibold leading-none mt-1">
              <span className="w-4 h-4 flex items-center justify-center text-[#00c7b1] shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Guaminí 4876
            </span>
          </div>
        </div>

      </div>
    </header>
  );
}
