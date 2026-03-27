import Image from 'next/image';
import HeroCarousel from './hero-carousel';

export default function Hero() {
  return (
    <header className="w-full mb-0 shadow-2xl overflow-hidden texture-petroleum grain-overlay"
      style={{ borderBottom: '3px solid var(--color-highlight)' }}>
      <div className="mx-auto w-full max-w-[2400px] p-4 sm:p-6 xl:px-20 flex flex-col xl:flex-row items-center justify-start xl:justify-center gap-6 xl:gap-8">

        {/* Banner carousel */}
        <div className="flex-1 w-full xl:max-w-4xl order-2 xl:order-1 flex flex-col items-center min-w-0 overflow-hidden">
          <HeroCarousel>
            {/* Slide 1: Inscripciones 2026 (Texto 3D sutil) */}
            <div className="banner-slide">
              <div className="w-full h-full relative min-h-[120px] texture-forest grain-overlay overflow-hidden flex flex-col items-center justify-center p-2 sm:p-4">
                {/* SVGs decorativos de fondo (pequeños y en los extremos absolutos) */}
                {/* SVGs decorativos de fondo (pequeños y en los extremos absolutos) */}
                <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden mix-blend-screen w-full">
                  {/* Birrete (Extremo Izquierdo) */}
                  <svg className="absolute top-1/2 -translate-y-1/2 left-1 min-[400px]:left-2 sm:left-4 md:left-6 lg:left-8 xl:left-4 2xl:left-8 w-10 h-10 min-[400px]:w-12 min-[400px]:h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-40 lg:h-40 xl:w-24 xl:h-24 2xl:w-32 2xl:h-32 text-[#00c7b1] opacity-[0.20] -rotate-12 hidden min-[320px]:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                  </svg>
                  {/* Libro abierto (Extremo Derecho) */}
                  <svg className="absolute top-1/2 -translate-y-1/2 right-1 min-[400px]:right-2 sm:right-4 md:right-6 lg:right-8 xl:right-4 2xl:right-8 w-10 h-10 min-[400px]:w-12 min-[400px]:h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-40 lg:h-40 xl:w-24 xl:h-24 2xl:w-32 2xl:h-32 text-[#00ff88] opacity-[0.15] rotate-12 hidden min-[320px]:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                
                <h2
                  className="relative z-10 text-white font-black text-[1.15rem] min-[380px]:text-[1.8rem] sm:text-[2.2rem] md:text-[2.5rem] lg:text-[3.5rem] xl:text-[2.5rem] 2xl:text-[3rem] text-center tracking-tight uppercase whitespace-nowrap"
                  style={{ textShadow: "1px 1px 0 #4b5563, 2px 2px 0 #374151, 3px 3px 0 #1f2937, 4px 4px 0 #111827, 4px 4px 10px rgba(0,0,0,0.6)" }}
                >
                  Inscripciones 2026
                </h2>
                <div className="flex flex-row items-center justify-center gap-1 min-[380px]:gap-2 sm:gap-3 mt-1 sm:mt-2 z-10 w-full px-1">
                  <span className="text-white font-bold text-[7px] min-[380px]:text-[8.5px] sm:text-[11px] md:text-[13px] lg:text-[15px] uppercase tracking-wider drop-shadow-md text-center">
                    Inscribite pulsando este botón:
                  </span>
                  <a
                    href="#formulario"
                    className="flex items-center justify-center bg-white hover:bg-[#e2faec] text-[#013729] font-black py-1 px-2.5 sm:py-1.5 sm:px-5 rounded-full shadow-[0_4px_15px_rgba(255,255,255,0.3)] transition-transform hover:scale-105 active:scale-95 text-[7.5px] min-[380px]:text-[9px] sm:text-[11px] lg:text-[13px] uppercase tracking-widest border border-transparent"
                  >
                    Ir al Formulario
                  </a>
                </div>
              </div>
            </div>

            {/* Slide 2: Cuotas (100% Vectorial y Adaptable) */}
            <div className="banner-slide">
              <div className="w-full h-full relative min-h-[120px] bg-[#ebfcf4] overflow-hidden flex flex-row items-center w-full">

                {/* ZONA 1: Círculo real recortado por overflow-hidden — solo el arco derecho ) es visible */}
                <div className="relative z-10 shrink-0 h-full flex items-center justify-center overflow-hidden w-[18%] sm:w-[25%] xl:w-[20%] 2xl:w-[25%]" style={{ minWidth: '55px' }}>
                  {/* Círculo grande desplazado a la izquierda. overflow-hidden del contenedor recorta todo salvo el arco derecho ) */}
                  <div
                    className="absolute rounded-full bg-teal-600 shadow-[5px_0_30px_rgba(13,148,136,0.2)]"
                    style={{ width: '220%', aspectRatio: '1', left: '-120%', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  {/* Tarjetas encima del arco */}
                  <div className="relative z-10 flex items-center justify-center w-[55px] h-[55px] sm:w-[85px] sm:h-[85px] md:w-[120px] md:h-[120px] lg:w-[150px] lg:h-[150px] xl:w-[90px] xl:h-[90px] 2xl:w-[120px] 2xl:h-[120px]">
                    <svg className="w-[3.2rem] h-[3.2rem] sm:w-16 sm:h-16 md:w-28 md:h-28 lg:w-36 lg:h-36 xl:w-20 xl:h-20 2xl:w-28 2xl:h-28 absolute transform -rotate-12 -translate-x-1 -translate-y-1 sm:-translate-x-2 sm:-translate-y-2 drop-shadow-xl" viewBox="0 0 100 65" fill="none">
                      <rect x="0" y="0" width="100" height="65" rx="8" fill="#2563eb"/>
                      <rect x="0" y="12" width="100" height="15" fill="#111827"/>
                      <rect x="10" y="38" width="30" height="5" rx="2.5" fill="#94a3b8"/>
                      <rect x="10" y="48" width="45" height="5" rx="2.5" fill="#64748b"/>
                    </svg>
                    <svg className="w-[3.2rem] h-[3.2rem] sm:w-16 sm:h-16 md:w-28 md:h-28 lg:w-36 lg:h-36 xl:w-20 xl:h-20 2xl:w-28 2xl:h-28 absolute transform rotate-6 translate-x-2 translate-y-2 drop-shadow-2xl" viewBox="0 0 100 65" fill="none">
                      <rect x="0" y="0" width="100" height="65" rx="8" fill="#f0f4f8"/>
                      <rect x="12" y="15" width="16" height="12" rx="2" fill="#fbbf24"/>
                      <path d="M16 15v12M24 15v12M12 21h16" stroke="#b45309" strokeWidth="1" opacity="0.4"/>
                      <rect x="12" y="38" width="45" height="5" rx="2.5" fill="#cbd5e1" />
                      <rect x="12" y="48" width="30" height="4" rx="2" fill="#e2e8f0"/>
                      <circle cx="70" cy="46" r="9" fill="#EB001B" />
                      <circle cx="82" cy="46" r="9" fill="#F79E1B" />
                    </svg>
                  </div>
                </div>

                {/* ZONA 2 (Centro Elástico): Textos Principales */}
                <div className="relative z-20 flex-1 min-w-0 h-full flex flex-row items-center justify-center pr-1 pl-1 sm:pl-2 sm:pr-2 xl:pl-0">
                  <div className="flex flex-row items-center justify-center min-w-0">
                    {/* En XL el texto DEBE achicarse porque la columna derecha reduce el carrusel */}
                    <span className="text-[3.2rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[7rem] xl:text-[4.5rem] 2xl:text-[5.5rem] font-black text-teal-600 leading-[0.85] tracking-tighter drop-shadow-sm shrink-0">
                      6
                    </span>
                    <div className="flex flex-col justify-center ml-1 sm:ml-2 md:ml-4 xl:ml-2 2xl:ml-4 py-1">
                      <span className="text-[0.9rem] sm:text-[1rem] md:text-[1.4rem] lg:text-[1.8rem] xl:text-[1.1rem] 2xl:text-[1.4rem] font-black uppercase tracking-wide sm:tracking-widest leading-none text-slate-800 whitespace-nowrap">Cuotas</span>
                      <span className="text-[0.9rem] sm:text-[1rem] md:text-[1.4rem] lg:text-[1.8rem] xl:text-[1.1rem] 2xl:text-[1.4rem] font-black uppercase tracking-wide sm:tracking-widest leading-none text-slate-800 whitespace-nowrap mt-0.5 md:mt-1">Sin Interés</span>
                    </div>
                  </div>
                </div>

                {/* ZONA 3 (Fluida ~25-30%): Caja Extra */}
                <div className="relative z-20 w-[28%] sm:w-[30%] lg:w-[25%] xl:w-[25%] 2xl:w-[22%] shrink-0 h-full flex items-center justify-center px-1 sm:px-2 md:px-4 xl:px-2 2xl:px-4">
                  <div className="flex flex-col items-center justify-center bg-teal-700 border border-teal-600 rounded-md md:rounded-xl px-1.5 sm:px-2 md:px-3 py-1.5 sm:py-1.5 md:py-2.5 shadow-md w-full max-w-[150px] md:max-w-[180px] lg:max-w-[200px] xl:max-w-[150px] 2xl:max-w-[180px]">
                    <span className="text-white font-bold text-[6px] min-[375px]:text-[7.5px] sm:text-[8px] md:text-[10px] lg:text-[12px] xl:text-[9.5px] 2xl:text-[11px] tracking-normal sm:tracking-widest uppercase mb-[1px] text-center w-full">Pagando con</span>
                    <span className="text-white font-black text-[7px] min-[375px]:text-[9.5px] sm:text-[10px] md:text-[12px] lg:text-[15px] xl:text-[11.5px] 2xl:text-[14px] uppercase text-center leading-[1.15] min-[375px]:leading-tight wrap-break-word w-full">Tarjetas Bancarias</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Slide 3: Benefits (Tailwind Reescrito y Blindado) */}
            <div className="banner-slide">
              <div className="w-full h-full relative min-h-[120px] bg-linear-to-br from-[#013729] to-[#0c2920] overflow-hidden flex flex-col items-center justify-evenly pt-2 sm:pt-2.5 md:pt-3 pb-2 px-1 sm:px-6 md:px-12 lg:px-24">

                {/* Encabezado (Centrado) */}
                <div className="flex items-center justify-center w-full gap-1 sm:gap-2 text-white text-[13px] sm:text-base md:text-xl font-black uppercase tracking-wider relative z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Beneficios
                </div>

                {/* Fila de Tarjetas (Grid Columnas de igual tamaño inquebrantables) */}
                <div className="grid grid-cols-3 items-stretch justify-center gap-2 sm:gap-4 xl:gap-2 w-full md:max-w-[900px] xl:max-w-[650px] 2xl:max-w-[800px] mb-1 sm:mb-0">

                  {/* Chip 1 */}
                  <div className="flex flex-col items-center justify-center text-center bg-white/5 border border-white/10 rounded-md sm:rounded-xl px-1 pt-1.5 pb-2.5 sm:p-3 xl:p-2 w-full h-full min-h-[75px] sm:min-h-[110px] xl:min-h-[90px] 2xl:min-h-[110px] min-w-0">
                    <div className="text-[20px] sm:text-2xl md:text-3xl xl:text-xl 2xl:text-3xl font-black text-white leading-none mb-0.5 sm:mb-1 xl:mb-0.5">10%</div>
                    <strong className="text-[#00ffe1] text-[9px] sm:text-[11px] md:text-[13px] xl:text-[10px] 2xl:text-[13px] font-bold leading-tight mt-0.5 w-full px-0.5 wrap-break-word">Deportistas<br />Federados</strong>
                  </div>

                  {/* Chip 2 */}
                  <div className="flex flex-col items-center justify-center text-center bg-white/5 border border-white/10 rounded-md sm:rounded-xl px-1 pt-1.5 pb-2.5 sm:p-3 xl:p-2 w-full h-full min-h-[75px] sm:min-h-[110px] xl:min-h-[90px] 2xl:min-h-[110px] min-w-0">
                    <div className="text-[20px] sm:text-2xl md:text-3xl xl:text-xl 2xl:text-3xl font-black text-white leading-none mb-0.5 sm:mb-1 xl:mb-0.5">10%</div>
                    <strong className="text-[#00ffe1] text-[9px] sm:text-[11px] md:text-[13px] xl:text-[10px] 2xl:text-[13px] font-bold leading-tight mt-0.5 w-full px-0.5 wrap-break-word">Organización<br />Amiga</strong>
                  </div>

                  {/* Chip 3 */}
                  <div className="flex flex-col items-center justify-center text-center bg-white/5 border border-white/10 rounded-md sm:rounded-xl px-1 pt-1.5 pb-2.5 sm:p-3 xl:p-2 w-full h-full min-h-[75px] sm:min-h-[110px] xl:min-h-[90px] 2xl:min-h-[110px] min-w-0">
                    <div className="text-[20px] sm:text-2xl md:text-3xl xl:text-xl 2xl:text-3xl font-black text-white leading-none mb-0.5 sm:mb-1 xl:mb-0.5">10%</div>
                    <strong className="text-[#00ffe1] text-[9px] sm:text-[11px] md:text-[13px] xl:text-[10px] 2xl:text-[13px] font-bold leading-tight mt-0.5 w-full px-0.5 wrap-break-word">Amigo<br />Referido</strong>
                  </div>

                </div>
              </div>
            </div>

          </HeroCarousel>
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
            <h1 className="font-black text-white leading-tight uppercase tracking-tighter whitespace-nowrap">
              <span className="text-xl md:text-2xl">CAU - VILLA LUGANO</span>
              <span className="block text-[0.65rem] md:text-xs font-semibold tracking-wide text-white/70 mt-0.5">Centro de Aprendizaje Universitario</span>
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
