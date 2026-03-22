import Link from 'next/link';

export default function IndexFooter() {
  return (
    <footer className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #06221f 0%, #071a18 100%)', borderTop: '2px solid rgba(0, 199, 177, 0.26)' }}>
      {/* Decorative glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full opacity-[0.06] pointer-events-none" style={{ background: 'radial-gradient(ellipse, #00c7b1, transparent 70%)' }} />

      <div className="relative container mx-auto px-6 pt-14 pb-10">
        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 text-center lg:text-left">

          {/* Col 1 — Brand */}
          <div className="lg:col-span-3 lg:pr-8 pb-8 lg:pb-0" style={{ borderBottom: '1px solid rgba(0,199,177,0.1)' }}>
            <p className="text-lg font-black text-white uppercase tracking-tight">CAU Villa Lugano</p>
            <p className="text-xs text-[#48b3a4] mt-1">Universidad Siglo 21</p>
            <p className="text-sm text-[#c0d5d0] leading-relaxed mt-4 max-w-xs mx-auto lg:mx-0">
              Centro de Aprendizaje Universitario. Formación universitaria con modalidad virtual y acompañamiento presencial.
            </p>
          </div>

          {/* Separator desktop */}
          <div className="hidden lg:block lg:col-span-1 lg:w-px lg:mx-auto" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,199,177,0.2), transparent)' }} />

          {/* Col 2 — Navegación */}
          <div className="lg:col-span-2 lg:px-4 pt-8 pb-8 lg:pt-0 lg:pb-0" style={{ borderBottom: '1px solid rgba(0,199,177,0.1)' }}>
            <h3 className="text-xs font-bold text-[#00c7b1] uppercase tracking-widest mb-4">Navegación</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/" className="text-[#c0d5d0] hover:text-white hover:lg:translate-x-1 inline-block transition-all duration-200">Inicio</Link></li>
              <li><Link href="/sobre-nosotros" className="text-[#c0d5d0] hover:text-white hover:lg:translate-x-1 inline-block transition-all duration-200">Sobre Nosotros</Link></li>
              <li><Link href="/clases-apoyo" className="text-[#c0d5d0] hover:text-white hover:lg:translate-x-1 inline-block transition-all duration-200">Clases de Apoyo</Link></li>
              <li><Link href="/faq" className="text-[#c0d5d0] hover:text-white hover:lg:translate-x-1 inline-block transition-all duration-200">Preguntas Frecuentes</Link></li>
              <li><Link href="/contacto" className="text-[#c0d5d0] hover:text-white hover:lg:translate-x-1 inline-block transition-all duration-200">Contacto</Link></li>
            </ul>
          </div>

          {/* Separator desktop */}
          <div className="hidden lg:block lg:col-span-1 lg:w-px lg:mx-auto" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,199,177,0.2), transparent)' }} />

          {/* Col 3 — Contacto */}
          <div className="lg:col-span-2 lg:px-4 pt-8 pb-8 lg:pt-0 lg:pb-0" style={{ borderBottom: '1px solid rgba(0,199,177,0.1)' }}>
            <h3 className="text-xs font-bold text-[#00c7b1] uppercase tracking-widest mb-4">Contacto</h3>
            <div className="flex justify-center lg:justify-start">
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(0, 199, 177, 0.1)', border: '1px solid rgba(0, 199, 177, 0.2)' }}>
                    <svg className="w-3.5 h-3.5 text-[#00c7b1]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <span className="text-[#c0d5d0] text-left">Guaminí 4876, Piso 1<br />Villa Lugano, CABA</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(0, 199, 177, 0.1)', border: '1px solid rgba(0, 199, 177, 0.2)' }}>
                    <svg className="w-3.5 h-3.5 text-[#00c7b1]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <a href="tel:+5491166522722" className="text-[#c0d5d0] hover:text-white transition-colors">11 6652-2722</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Separator desktop */}
          <div className="hidden lg:block lg:col-span-1 lg:w-px lg:mx-auto" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,199,177,0.2), transparent)' }} />

          {/* Col 4 — Horarios + Modalidad */}
          <div className="lg:col-span-2 lg:pl-4 pt-8 lg:pt-0">
            <h3 className="text-xs font-bold text-[#00c7b1] uppercase tracking-widest mb-4">Horarios</h3>
            <div className="rounded-xl p-4 space-y-3 max-w-xs mx-auto lg:mx-0" style={{ background: 'rgba(0, 199, 177, 0.05)', border: '1px solid rgba(0, 199, 177, 0.12)' }}>
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00c7b1]" />
                  <span className="text-[#c0d5d0]">Lunes a Viernes</span>
                </div>
                <span className="text-white font-semibold text-xs px-2 py-0.5 rounded-md ml-3.5 inline-block mt-1" style={{ background: 'rgba(0, 199, 177, 0.15)' }}>9 a 20 hs</span>
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7ca19b]/40" />
                  <span className="text-[#7ca19b]">Sábados y Domingos</span>
                </div>
                <span className="text-[#7ca19b] text-xs ml-3.5 inline-block mt-1">Cerrado</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2.5 rounded-xl px-4 py-3 max-w-xs mx-auto lg:mx-0" style={{ background: 'rgba(0, 85, 135, 0.12)', border: '1px solid rgba(0, 85, 135, 0.25)' }}>
              <svg className="w-5 h-5 text-[#48b3a4] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.264.26-2.467.732-3.558" /></svg>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Modalidad Virtual</p>
                <p className="text-xs text-[#c0d5d0] mt-0.5">Cursá online, exámenes desde casa o en el CAU</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 flex flex-col items-center gap-5" style={{ borderTop: '1px solid rgba(0, 199, 177, 0.1)' }}>
          {/* Redes sociales */}
          <div className="flex items-center gap-2.5">
            <a href="https://wa.me/5491166522722?text=Hola%2C%20me%20gustar%C3%ADa%20realizar%20una%20consulta" target="_blank" rel="noopener nofollow" aria-label="WhatsApp"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
              style={{ background: 'rgba(37, 211, 102, 0.12)', border: '1px solid rgba(37, 211, 102, 0.3)' }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </a>
            <a href="https://www.facebook.com/ceducativovillalugano/" target="_blank" rel="noopener nofollow" aria-label="Facebook"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
              style={{ background: 'rgba(24, 119, 242, 0.12)', border: '1px solid rgba(24, 119, 242, 0.3)' }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="https://www.instagram.com/centroeducativovillalugano/" target="_blank" rel="noopener nofollow" aria-label="Instagram"
              className="flex items-center justify-center w-9 h-9 rounded-lg text-white/70 hover:text-white transition-all duration-300 hover:scale-110"
              style={{ background: 'rgba(214, 36, 159, 0.12)', border: '1px solid rgba(214, 36, 159, 0.3)' }}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-[#7ca19b]/60 mb-4">
            &copy; {new Date().getFullYear()} CAU Villa Lugano &mdash; Universidad Siglo 21. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
