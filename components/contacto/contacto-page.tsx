'use client';

import Image from 'next/image';
import { WhatsAppIcon, FacebookIcon, InstagramIcon } from '@/components/icons';
import './contacto.css';

/* ── Publicaciones ────────────────────────────────────── *
 *  Cada post tiene: imagen local, link al post original,  *
 *  y opcionalmente una descripción corta.                 *
 * ──────────────────────────────────────────────────────── */

interface SocialPost {
  image: string;
  alt: string;
  href: string;
  caption?: string;
}

const FB_POSTS: SocialPost[] = [
  {
    image: '/imagenes/facebook_redsocial/472318429_2808601529321785_8299342114654005939_n.jpg',
    alt: 'Evento CAUS - Centro Educativo Villa Lugano',
    href: 'https://www.facebook.com/ceducativovillalugano/posts/1904009456447668',
    caption: 'Evento CAUS Siglo 21',
  },
];

const IG_POSTS: SocialPost[] = [
  {
    image: '/imagenes/instagram_redsocial/Captura desde 2026-03-15 00-47-17.png',
    alt: 'Inscripciones abiertas marzo 2026 - Universidad Siglo 21',
    href: 'https://www.instagram.com/p/DUiieGkDNOt/',
    caption: 'Inscripciones abiertas - Marzo 2026',
  },
];

const ZONAS = ['Villa Lugano', 'Mataderos', 'Liniers', 'Villa Celina', 'Ciudad Madero', 'Zona Sur', 'Comuna 8', 'Villa Soldati'];

/* ── Page ──────────────────────────────────────────────── */

export default function ContactoPageContent() {
  return (
    <main className="max-w-6xl mx-auto px-5 sm:px-8">

      {/* Spacer */}
      <div className="pt-2" />

      {/* ─── 3 CANALES ────────────────────────────────────── */}
      <section className="mb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ── WhatsApp ────────────────────────────────────── */}
          <div className="ct-channel-card ct-channel-whatsapp rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 pb-0">
              <div
                className="ct-icon-ring w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}
              >
                <WhatsAppIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">WhatsApp</h2>
                <p className="text-xs font-semibold" style={{ color: '#25D366' }}>11 6652-2722</p>
              </div>
            </div>

            {/* Description */}
            <div className="px-6 pt-3 pb-2">
              <p className="text-xs leading-relaxed" style={{ color: '#8fada7' }}>
                Consultas sobre <strong className="text-white font-semibold">inscripciones, aranceles y carreras</strong>. Atención humana.
              </p>
            </div>

            {/* Chips */}
            <div className="px-6 pb-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ color: '#25D366', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}>
                Lun a Vie, 8 a 20 hs
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ color: '#25D366', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}>
                Respuesta rápida
              </span>
            </div>

            {/* Divider */}
            <div className="mx-6 mb-3" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(37,211,102,0.25), transparent 80%)' }} />

            {/* Mini chat animation */}
            <div className="px-5 pb-3">
              <div className="rounded-xl overflow-hidden" style={{ background: '#0b1a19' }}>
                {/* Chat header */}
                <div className="flex items-center gap-2 px-3 py-2" style={{ background: '#075e54' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: '#ffffff', padding: '1px' }}>
                    <Image src="/imagenes/imagenes_cau/logo_cau.png" alt="Logo CAU" width={24} height={24} />
                  </div>
                  <span className="text-[10px] font-bold text-white/90">CAU Villa Lugano</span>
                  <span className="ml-auto text-[8px] text-white/50">en línea</span>
                </div>
                {/* Messages */}
                <div className="px-3 py-3 flex flex-col gap-2 ct-chat-messages">
                  {/* User message 1 */}
                  <div className="ct-chat-msg ct-chat-msg-1 flex justify-end opacity-0">
                    <div className="rounded-lg px-2.5 py-1.5 max-w-[75%]" style={{ background: '#1f3834' }}>
                      <p className="text-[10px] text-white/90">Hola! 👋</p>
                      <p className="text-[7px] text-right mt-0.5" style={{ color: '#7ca19b' }}>14:02</p>
                    </div>
                  </div>
                  {/* CAU reply 1 */}
                  <div className="ct-chat-msg ct-chat-msg-2 flex justify-start opacity-0">
                    <div className="rounded-lg px-2.5 py-1.5 max-w-[80%]" style={{ background: '#143330' }}>
                      <p className="text-[10px] font-semibold" style={{ color: '#25D366' }}>CAU Villa Lugano</p>
                      <p className="text-[10px] text-white/90">Hola! ¿Cómo estás? ¿En qué puedo ayudarte?</p>
                      <p className="text-[7px] text-right mt-0.5" style={{ color: '#7ca19b' }}>14:02</p>
                    </div>
                  </div>
                  {/* User message 2 */}
                  <div className="ct-chat-msg ct-chat-msg-3 flex justify-end opacity-0">
                    <div className="rounded-lg px-2.5 py-1.5 max-w-[80%]" style={{ background: '#1f3834' }}>
                      <p className="text-[10px] text-white/90">No puedo entrar a la plataforma, ¿me ayudás?</p>
                      <p className="text-[7px] text-right mt-0.5" style={{ color: '#7ca19b' }}>14:03</p>
                    </div>
                  </div>
                  {/* CAU reply 2 */}
                  <div className="ct-chat-msg ct-chat-msg-4 flex justify-start opacity-0">
                    <div className="rounded-lg px-2.5 py-1.5 max-w-[80%]" style={{ background: '#143330' }}>
                      <p className="text-[10px] font-semibold" style={{ color: '#25D366' }}>CAU Villa Lugano</p>
                      <p className="text-[10px] text-white/90">Dale, ya te ayudo a ingresar 💪</p>
                      <p className="text-[7px] text-right mt-0.5" style={{ color: '#7ca19b' }}>14:03</p>
                    </div>
                  </div>
                  {/* User message 3 */}
                  <div className="ct-chat-msg ct-chat-msg-5 flex justify-end opacity-0">
                    <div className="rounded-lg px-2.5 py-1.5 max-w-[75%]" style={{ background: '#1f3834' }}>
                      <p className="text-[10px] text-white/90">Gracias por la ayuda! 🙌</p>
                      <p className="text-[7px] text-right mt-0.5" style={{ color: '#7ca19b' }}>14:05</p>
                    </div>
                  </div>
                  {/* CAU reply 3 */}
                  <div className="ct-chat-msg ct-chat-msg-6 flex justify-start opacity-0">
                    <div className="rounded-lg px-2.5 py-1.5 max-w-[80%]" style={{ background: '#143330' }}>
                      <p className="text-[10px] font-semibold" style={{ color: '#25D366' }}>CAU Villa Lugano</p>
                      <p className="text-[10px] text-white/90">No es nada! Cualquier consulta estoy a tu disposición 😊</p>
                      <p className="text-[7px] text-right mt-0.5" style={{ color: '#7ca19b' }}>14:05</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacer to push CTA to bottom */}
            <div className="flex-1" />

            {/* Divider */}
            <div className="mx-6" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(37,211,102,0.25), transparent 80%)' }} />

            {/* CTA */}
            <div className="p-6 pt-4">
              <a
                href="https://wa.me/5491166522722?text=Hola%2C%20me%20gustar%C3%ADa%20realizar%20una%20consulta"
                target="_blank"
                rel="noopener"
                className="ct-btn-whatsapp flex items-center justify-center gap-2 w-full py-3 rounded-full font-bold text-white text-sm transition-all hover:brightness-110 "
                style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)' }}
              >
                <WhatsAppIcon className="w-4 h-4" />
                Escribinos
              </a>
            </div>
          </div>

          {/* ── Facebook ────────────────────────────────────── */}
          <div className="ct-channel-card ct-channel-facebook rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 pb-0">
              <div
                className="ct-icon-ring w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(24,119,242,0.15)', border: '1px solid rgba(24,119,242,0.3)' }}
              >
                <FacebookIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Facebook</h2>
                <p className="text-xs font-semibold" style={{ color: '#1877F2' }}>ceducativovillalugano</p>
              </div>
            </div>

            {/* Description */}
            <div className="px-6 pt-3 pb-2">
              <p className="text-xs leading-relaxed" style={{ color: '#8fada7' }}>
                <strong className="text-white font-semibold">Eventos y novedades</strong> del CAU. Talleres, inscripciones y actividades.
              </p>
            </div>

            {/* Tags */}
            <div className="px-6 pb-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ color: '#1877F2', background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.2)' }}>
                Eventos
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ color: '#1877F2', background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.2)' }}>
                Noticias
              </span>
            </div>

            {/* Divider */}
            <div className="mx-6 mb-3" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(24,119,242,0.25), transparent 80%)' }} />

            {/* Posts */}
            <div className="px-6 pb-4 flex flex-col gap-3">
              {FB_POSTS.map((post) => (
                <a
                  key={post.href}
                  href={post.href}
                  target="_blank"
                  rel="noopener"
                  className="ct-post-card ct-post-fb group block rounded-xl overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background: '#111a1b' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ background: '#ffffff', padding: '1px' }}>
                      <Image
                        src="/imagenes/imagenes_cau/logo_cau.png"
                        alt="Logo CAU"
                        width={30}
                        height={30}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white/90 truncate">Centro Educativo Villa Lugano</p>
                      <p className="text-[10px]" style={{ color: '#7ca19b' }}>21 de septiembre de 2021</p>
                    </div>
                  </div>
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.alt}
                      fill
                      className="object-cover transition-transform duration-500 "
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {post.caption && (
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-xs font-semibold text-white/90 drop-shadow">{post.caption}</p>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Divider */}
            <div className="mx-6" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(24,119,242,0.25), transparent 80%)' }} />

            {/* CTA */}
            <div className="p-6 pt-4">
              <a
                href="https://www.facebook.com/ceducativovillalugano/"
                target="_blank"
                rel="noopener"
                className="ct-btn-facebook flex items-center justify-center gap-2 w-full py-3 rounded-full font-bold text-white text-sm transition-all hover:brightness-110 "
                style={{ background: 'linear-gradient(135deg, #1877F2 0%, #0d5bbf 100%)' }}
              >
                <FacebookIcon className="w-4 h-4" />
                Seguinos
              </a>
            </div>
          </div>

          {/* ── Instagram ───────────────────────────────────── */}
          <div className="ct-channel-card ct-channel-instagram rounded-2xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 p-6 pb-0">
              <div
                className="ct-icon-ring w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(214,36,159,0.12)', border: '1px solid rgba(214,36,159,0.3)' }}
              >
                <InstagramIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Instagram</h2>
                <p className="text-xs font-semibold" style={{ color: '#D6249F' }}>@centroeducativovillalugano</p>
              </div>
            </div>

            {/* Description */}
            <div className="px-6 pt-3 pb-2">
              <p className="text-xs leading-relaxed" style={{ color: '#8fada7' }}>
                <strong className="text-white font-semibold">Carreras e inscripciones</strong> en imágenes. Reels y vida en el CAU.
              </p>
            </div>

            {/* Tags */}
            <div className="px-6 pb-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ color: '#D6249F', background: 'rgba(214,36,159,0.08)', border: '1px solid rgba(214,36,159,0.2)' }}>
                Carreras
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ color: '#D6249F', background: 'rgba(214,36,159,0.08)', border: '1px solid rgba(214,36,159,0.2)' }}>
                Inscripciones
              </span>
            </div>

            {/* Divider */}
            <div className="mx-6 mb-3" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(214,36,159,0.25), transparent 80%)' }} />

            {/* Posts */}
            <div className="px-6 pb-4 flex flex-col gap-3">
              {IG_POSTS.length > 0 ? IG_POSTS.map((post) => (
                <a
                  key={post.href}
                  href={post.href}
                  target="_blank"
                  rel="noopener"
                  className="ct-post-card ct-post-ig group block rounded-xl overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background: '#111a1b' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ background: '#ffffff', padding: '1px' }}>
                      <Image
                        src="/imagenes/imagenes_cau/logo_cau.png"
                        alt="Logo CAU"
                        width={30}
                        height={30}
                      />
                    </div>
                    <p className="text-xs font-bold text-white/90 truncate">centroeducativovillalugano</p>
                  </div>
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.alt}
                      fill
                      className="object-cover transition-transform duration-500 "
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {post.caption && (
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-xs font-semibold text-white/90 drop-shadow">{post.caption}</p>
                      </div>
                    )}
                  </div>
                </a>
              )) : (
                <a
                  href="https://www.instagram.com/centroeducativovillalugano/"
                  target="_blank"
                  rel="noopener"
                  className="ct-post-card ct-post-ig group block rounded-xl overflow-hidden"
                >
                  <div
                    className="relative flex flex-col items-center justify-center py-10 px-6 text-center transition-all group-hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, rgba(131,58,180,0.15) 0%, rgba(253,29,29,0.1) 50%, rgba(252,176,69,0.08) 100%)' }}
                  >
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                      style={{ background: 'linear-gradient(135deg, #833AB4, #FD1D1D, #FCB045)', padding: '2px' }}>
                      <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: '#122e2e' }}>
                        <Image src="/imagenes/imagenes_cau/logo_cau.png" alt="Logo CAU" width={36} height={36} className="brightness-0 invert" />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white">@centroeducativovillalugano</p>
                    <p className="text-xs mt-1" style={{ color: '#8fada7' }}>Mirá nuestras publicaciones</p>
                  </div>
                </a>
              )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Divider */}
            <div className="mx-6" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(214,36,159,0.25), transparent 80%)' }} />

            {/* CTA */}
            <div className="p-6 pt-4">
              <a
                href="https://www.instagram.com/centroeducativovillalugano/"
                target="_blank"
                rel="noopener"
                className="ct-btn-instagram flex items-center justify-center gap-2 w-full py-3 rounded-full font-bold text-white text-sm transition-all hover:brightness-110 "
                style={{ background: 'linear-gradient(135deg, #833AB4 0%, #FD1D1D 50%, #FCB045 100%)' }}
              >
                <InstagramIcon className="w-4 h-4" />
                Seguinos
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ─── SEDE + MAPA ────────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row gap-0 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)' }}>
          {/* Info */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#ef4444' }}>
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                </svg>
              </div>
              <p className="text-sm font-bold" style={{ color: '#ef4444' }}>Visitanos presencialmente</p>
              <p className="text-base font-black text-white tracking-tight">Guaminí 4876, Villa Lugano, CABA</p>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: '#ef4444' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="text-xs font-semibold" style={{ color: '#c8dedd' }}>Lun a Vie, 8 a 20 hs</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {ZONAS.map((z) => (
                <span
                  key={z}
                  className="px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ color: '#e69b05', background: 'rgba(230,155,5,0.1)', border: '1px solid rgba(230,155,5,0.25)' }}
                >
                  {z}
                </span>
              ))}
            </div>

            <a
              href="https://maps.app.goo.gl/Bxfhe5BpQYUg1dxv7"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-full font-bold text-sm text-white transition-all hover:brightness-110 mt-1"
              style={{ background: 'rgba(239,68,68,0.85)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
              </svg>
              Cómo llegar
            </a>
          </div>

          {/* Map — right side */}
          <div className="md:w-[280px] lg:w-[320px] flex-shrink-0">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d287.30386866002505!2d-58.478021869563335!3d-34.68692280959655!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcceb304e92bc7%3A0x2c1bd7e026f4751a!2sCentro%20de%20Capacitacion%20Lugano!5e0!3m2!1ses-419!2sus!4v1772370527929!5m2!1ses-419!2sus"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block', minHeight: '180px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación del CAU Villa Lugano en Google Maps"
            />
          </div>
        </div>
      </section>

    </main>
  );
}
