'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { WhatsAppIcon, FacebookIcon, InstagramIcon } from './icons';
import { supabase } from '@/lib/supabase';

/* ── Data ──────────────────────────────────────────────── */

interface FaqItem {
  question: string;
  keywords: string;
  content: React.ReactNode;
  /** Item #2 has a special header with social icons */
  headerSocials?: boolean;
}

const PIN_SVG = (
  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" style={{ color: '#00c7b1' }} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
  </svg>
);

const CHEVRON_SVG = (
  <svg className="faq-chevron w-6 h-6" style={{ color: 'var(--color-highlight)' }} fill="currentColor" viewBox="0 0 512 512" aria-hidden="true">
    <path d="M256 294.1L383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127z" />
  </svg>
);

function ZonaCard({ name }: { name: string }) {
  return (
    <div className="zona-card flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,199,177,0.07)', border: '1px solid rgba(0,199,177,0.28)' }}>
      {PIN_SVG}
      <span className="font-semibold text-sm" style={{ color: '#00c7b1' }}>{name}</span>
    </div>
  );
}

function SocialLink({ href, label, color, bgColor, borderColor, icon, children }: {
  href: string; label: string; color: string; bgColor: string; borderColor: string;
  icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <a href={href} target="_blank" rel="noopener" aria-label={label}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-opacity hover:opacity-80"
      style={{ background: bgColor, border: `1px solid ${borderColor}` }}>
      <span className="w-5 h-5 flex-shrink-0" style={{ color }}>{icon}</span>
      <span>
        {children}
      </span>
    </a>
  );
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: '¿Dónde queda el CAU Villa Lugano?',
    keywords: 'dónde queda cau villa lugano ubicacion direccion donde esta localizado cerca zona sur oeste caba mataderos liniers villa celina presencial sede',
    content: (
      <div className="px-5 pb-5 pt-1 leading-relaxed space-y-3" style={{ color: '#c8dedd' }}>
        <p>Nuestro CAU está ubicado en <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>Villa Lugano</strong>, Zona Sur/Oeste de CABA, a poca distancia de <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>Mataderos, Liniers y Villa Celina</strong>. Contactanos para confirmar dirección y horarios de atención.</p>
        <p style={{ fontSize: '0.78rem', color: '#5a8a80', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>cerca de</p>
        <div className="grid grid-cols-3 gap-2">
          <ZonaCard name="Villa Lugano" />
          <ZonaCard name="Mataderos" />
          <ZonaCard name="Liniers" />
          <ZonaCard name="Villa Celina" />
          <ZonaCard name="Zona Sur del GBA" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-3">
          <div className="flex flex-col gap-2 flex-1">
            <div className="rounded-lg overflow-hidden" style={{ height: 220 }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d287.30386866002505!2d-58.478021869563335!3d-34.68692280959655!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bcceb304e92bc7%3A0x2c1bd7e026f4751a!2sCentro%20de%20Capacitacion%20Lugano!5e0!3m2!1ses-419!2sus!4v1772370527929!5m2!1ses-419!2sus"
                width="100%" height="220" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <a href="https://maps.app.goo.gl/Bxfhe5BpQYUg1dxv7" target="_blank" rel="noopener"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm text-white hover:brightness-115"
              style={{ background: 'linear-gradient(135deg,#1a3a6e 0%,#006655 100%)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
              </svg>
              Cómo llegar desde mi ubicación
            </a>
          </div>
          <div className="hidden sm:block rounded-lg overflow-hidden flex-shrink-0" style={{ position: 'relative', width: 180, alignSelf: 'stretch' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/imagenes/imagenes_cau/Foto-entrada.webp" alt="Entrada del CAU Villa Lugano" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
          </div>
        </div>
      </div>
    ),
  },
  {
    question: '¿Cómo me puedo contactar con ustedes?',
    keywords: 'contacto contactarnos comunicarse hablar whatsapp telefono redes sociales facebook instagram llamar escribir mensaje',
    headerSocials: true,
    content: (
      <div className="px-5 pb-5 pt-1 leading-relaxed space-y-2" style={{ color: '#c8dedd' }}>
        <SocialLink href="https://wa.me/5491166522722" label="WhatsApp" color="#25D366" bgColor="rgba(37,211,102,0.1)" borderColor="rgba(37,211,102,0.3)"
          icon={<WhatsAppIcon className="w-5 h-5" />}>
          <span className="block font-semibold text-sm" style={{ color: '#25D366' }}>WhatsApp</span>
          <span className="block text-xs" style={{ color: '#c8dedd' }}>11 6652-2722</span>
        </SocialLink>
        <SocialLink href="https://www.facebook.com/ceducativovillalugano/" label="Facebook" color="#1877F2" bgColor="rgba(24,119,242,0.1)" borderColor="rgba(24,119,242,0.3)"
          icon={<FacebookIcon className="w-5 h-5" />}>
          <span className="block font-semibold text-sm" style={{ color: '#1877F2' }}>Facebook</span>
          <span className="block text-xs" style={{ color: '#c8dedd' }}>ceducativovillalugano</span>
        </SocialLink>
        <SocialLink href="https://www.instagram.com/centroeducativovillalugano/" label="Instagram" color="#e6683c" bgColor="rgba(230,104,60,0.1)" borderColor="rgba(230,104,60,0.3)"
          icon={<InstagramIcon className="w-5 h-5" />}>
          <span className="block font-semibold text-sm" style={{ color: '#e6683c' }}>Instagram</span>
          <span className="block text-xs" style={{ color: '#c8dedd' }}>@centroeducativovillalugano</span>
        </SocialLink>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" style={{ color: '#ef4444' }} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
          </svg>
          <span>
            <span className="block font-semibold text-sm" style={{ color: '#ef4444' }}>Visitanos presencialmente</span>
            <span className="block text-xs" style={{ color: '#c8dedd' }}>CAU Villa Lugano — Guaminí 4876</span>
          </span>
        </div>
      </div>
    ),
  },
  {
    question: '¿Cuáles son los requisitos de inscripción?\n¿Cómo me inscribo?',
    keywords: 'requisitos inscripcion como inscribirse anotarse inicio empezar comenzar ingresar carrera secundario titulo anoto registro',
    content: (
      <div className="px-5 pb-5 pt-1 leading-relaxed" style={{ color: '#c8dedd' }}>
        <p>Para inscribirte es necesario haber <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>finalizado el secundario</strong>. Podés iniciar el proceso <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>sin necesidad de venir</strong> contactándonos por WhatsApp o redes, o si preferís, también podés hacerlo <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>de forma presencial</strong> en el CAU.</p>
      </div>
    ),
  },
  {
    question: '¿Qué formas de pago tiene la Universidad?',
    keywords: 'formas pago aranceles cuotas precio costo cuanto sale vale bimestral cuatrimestre tarjeta credito matricula financiacion mensual',
    content: (
      <div className="px-5 pb-5 pt-1 leading-relaxed space-y-3" style={{ color: '#c8dedd' }}>
        <p><strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>Podés abonar los aranceles por cuatrimestre.</strong> Cada año tiene <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>dos cuatrimestres</strong> y requiere una <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>matrícula de inscripción</strong>. Podés pagar el <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>cuatrimestre completo</strong> o de forma <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>bimestral</strong>.</p>
        <p>También podés pagar en <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>cuotas</strong> con <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>tarjeta de crédito</strong> y otros medios de financiación, según la entidad bancaria o plataforma que elijas.</p>
      </div>
    ),
  },
  {
    question: '¿Qué validez tienen los títulos?',
    keywords: 'validez titulos oficiales nacionales reconocido convalidar diploma grado certificado habilitante acreditado ministerio',
    content: (
      <div className="px-5 pb-5 pt-1 leading-relaxed" style={{ color: '#c8dedd' }}>
        <p><strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>Todos los títulos de Universidad Siglo 21 son oficiales y tienen validez nacional</strong>. Están acreditados por la <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>Secretaría de Educación</strong>, lo que garantiza que tu formación cumple los estándares académicos requeridos en todo el país.</p>
      </div>
    ),
  },
  {
    question: '¿Toman equivalencias de otras universidades?',
    keywords: 'equivalencias otras universidades materias aprobadas convalidar transferir cambio universidad pasarme vengo historial academico',
    content: (
      <div className="px-5 pb-5 pt-1 leading-relaxed" style={{ color: '#c8dedd' }}>
        <p>Sí. En Universidad Siglo 21 <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>reconocemos equivalencias</strong> de numerosas universidades e instituciones educativas. Contactanos para analizar tu historial académico.</p>
      </div>
    ),
  },
  {
    question: '¿Otorgan becas?',
    keywords: 'becas descuentos rendimiento academico socioeconomico ayuda financiera reduccion precio barato subsidio porcentaje',
    content: (
      <div className="px-5 pb-5 pt-1 leading-relaxed space-y-3" style={{ color: '#c8dedd' }}>
        <p>Sí. Ofrecemos diversas opciones de becas para estudiantes con <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>alto rendimiento académico, mejor promedio de secundaria</strong> y para quienes enfrentan <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>dificultades socioeconómicas</strong>.</p>
        <p>Además contamos con beneficios, promociones y diferentes opciones de pago. Consultanos para conocer las que aplican a tu caso.</p>
      </div>
    ),
  },
  {
    question: '¿Tengo que hacer curso de nivelación?',
    keywords: 'nivelacion ingreso universitario primer año adaptacion ingresante sin examen introductorio curso introductorio',
    content: (
      <div className="px-5 pb-5 pt-1 leading-relaxed" style={{ color: '#c8dedd' }}>
        <p>No es obligatorio, aunque contamos con <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>Universitarios 21</strong>, un programa para ingresantes de Grado y Pregrado que te ayuda a prepararte para el <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>primer trayecto de tu carrera</strong>.</p>
      </div>
    ),
  },
  {
    question: '¿Cómo funciona la modalidad a distancia?',
    keywords: 'modalidad distancia online campus virtual clases presenciales como se estudia horario estudiar casa internet plataforma',
    content: (
      <div className="px-5 pb-5 pt-1 leading-relaxed space-y-3" style={{ color: '#c8dedd' }}>
        <p>La cursada es <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>100% online</strong> a través del campus virtual de Siglo 21: clases grabadas, materiales, foros y evaluaciones desde cualquier dispositivo, a tu ritmo.</p>
      </div>
    ),
  },
  {
    question: '¿Puedo inscribirme aunque no viva cerca?',
    keywords: 'inscripcion online distancia no vivo cerca lejos remoto sin venir puedo anotarme desde casa virtual',
    content: (
      <div className="px-5 pb-5 pt-1 leading-relaxed space-y-3" style={{ color: '#c8dedd' }}>
        <p>Sí. Podés iniciar tu inscripción <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>sin necesidad de venir al CAU</strong> — todo se gestiona por WhatsApp o redes sociales. La cursada también es completamente online a través del campus virtual de Siglo 21.</p>
      </div>
    ),
  },
  {
    question: 'Me mudé a la zona y estaba en otro CAU.\n¿Puedo cambiar de sede?',
    keywords: 'cambio sede cau mude mudé zona cercana otro cau transferir traslado cambiar centro aprendizaje universitario',
    content: (
      <div className="px-5 pb-5 pt-1 leading-relaxed space-y-3" style={{ color: '#c8dedd' }}>
        <p>Sí, es posible. El cambio de CAU se gestiona directamente con nosotros. <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>Tu historial académico y materias aprobadas se mantienen</strong> sin ningún inconveniente — la carrera sigue siendo la misma.</p>
        <p>Contactanos y te guiamos en el proceso de <strong style={{ color: 'var(--cau-brand-cream, #fef8f4)' }}>traslado de sede</strong> paso a paso.</p>
      </div>
    ),
  },
];

/* ── Fuzzy search helpers ─────────────────────────────── */

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d: number[][] = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = a[i - 1] === b[j - 1] ? d[i - 1][j - 1] : 1 + Math.min(d[i - 1][j], d[i][j - 1], d[i - 1][j - 1]);
  return d[m][n];
}

function fuzzyMatch(query: string, haystack: string): boolean {
  if (!query) return true;
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const hay = normalize(haystack);
  const hayWords = hay.split(/\W+/).filter(Boolean);
  return words.every(word => {
    if (hay.includes(word)) return true;
    if (word.length < 4) return false;
    const maxErr = word.length <= 6 ? 1 : 2;
    return hayWords.some(hw => hw.length >= 3 && levenshtein(word, hw) <= maxErr);
  });
}

/* ── Accordion Item ───────────────────────────────────── */

function FaqAccordionItem({ item, index, isOpen, onToggle }: {
  item: FaqItem; index: number; isOpen: boolean; onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (isOpen) {
      el.style.maxHeight = el.scrollHeight + 'px';
      el.style.opacity = '1';
    } else {
      el.style.maxHeight = '0';
      el.style.opacity = '0';
    }
  }, [isOpen]);

  // Resize handler
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      const el = contentRef.current;
      if (el) {
        el.style.maxHeight = 'none';
        el.style.maxHeight = el.scrollHeight + 'px';
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const questionLines = item.question.split('\n');

  if (item.headerSocials) {
    return (
      <div className={`faq-item rounded-xl overflow-hidden${isOpen ? ' is-open' : ''}`} style={{ background: 'var(--color-card-bg)', border: '1px solid rgba(0,199,177,0.28)', borderLeft: 'none' }}>
        <div className="faq-header-wrap flex items-center gap-2 pr-2 md:pr-5" onClick={onToggle}>
          <button type="button" className="faq-btn flex items-center gap-3 md:gap-4 text-left px-4 md:px-5 py-4 flex-1 min-w-0" aria-expanded={isOpen}>
            <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--cau-brand-green)' }}>{index + 1}</span>
            <span className="font-semibold flex-1 min-w-0 leading-snug text-sm md:text-lg" style={{ color: '#fff' }}>
              {questionLines.map((line, i) => <span key={i}>{line}{i < questionLines.length - 1 && <br />}</span>)}
            </span>
          </button>
          {!isOpen && (
            <div className="contact-socials-header flex items-center gap-1.5 flex-shrink-0">
              <a href="https://wa.me/5491166522722" target="_blank" rel="noopener" aria-label="WhatsApp" onClick={e => e.stopPropagation()}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: 'rgba(37,211,102,0.18)', color: '#25D366', border: '1px solid rgba(37,211,102,0.5)' }}>
                <WhatsAppIcon className="w-4 h-4" />
              </a>
              <a href="https://www.facebook.com/ceducativovillalugano/" target="_blank" rel="noopener" aria-label="Facebook" onClick={e => e.stopPropagation()}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: 'rgba(24,119,242,0.18)', color: '#1877F2', border: '1px solid rgba(24,119,242,0.5)' }}>
                <FacebookIcon className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/centroeducativovillalugano/" target="_blank" rel="noopener" aria-label="Instagram" onClick={e => e.stopPropagation()}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: 'rgba(230,104,60,0.18)', color: '#e6683c', border: '1px solid rgba(230,104,60,0.5)' }}>
                <InstagramIcon className="w-4 h-4" />
              </a>
            </div>
          )}
          <svg className="faq-chevron w-5 h-5 md:w-6 md:h-6 flex-shrink-0" style={{ color: 'var(--color-highlight)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="currentColor" viewBox="0 0 512 512" aria-hidden="true">
            <path d="M256 294.1L383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127z" />
          </svg>
        </div>
        <div ref={contentRef} className="faq-content overflow-hidden" style={{ maxHeight: 0, opacity: 0 }}>
          {item.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`faq-item rounded-xl overflow-hidden${isOpen ? ' is-open' : ''}`} style={{ background: 'var(--color-card-bg)', border: '1px solid rgba(0,199,177,0.28)', borderLeft: 'none' }}>
      <button type="button" className="faq-btn w-full flex items-center gap-3 md:gap-4 text-left px-4 md:px-5 py-4" aria-expanded={isOpen} onClick={onToggle}>
        <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: 'var(--cau-brand-green)' }}>{index + 1}</span>
        <span className="font-semibold flex-1 min-w-0 leading-snug text-sm md:text-lg" style={{ color: '#fff' }}>
          {questionLines.map((line, i) => <span key={i}>{line}{i < questionLines.length - 1 && <br />}</span>)}
        </span>
        <svg className="faq-chevron w-5 h-5 md:w-6 md:h-6 flex-shrink-0" style={{ color: 'var(--color-highlight)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="currentColor" viewBox="0 0 512 512" aria-hidden="true">
          <path d="M256 294.1L383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127z" />
        </svg>
      </button>
      <div ref={contentRef} className="faq-content overflow-hidden" style={{ maxHeight: 0, opacity: 0 }}>
        {item.content}
      </div>
    </div>
  );
}

/* ── Rate limit (client-side) ─────────────────────────── */

const RATE_LIMIT_KEY = 'faq-submissions';
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hora

function checkRateLimit(): boolean {
  const raw = localStorage.getItem(RATE_LIMIT_KEY);
  const timestamps: number[] = raw ? JSON.parse(raw) : [];
  const now = Date.now();
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  return recent.length < RATE_LIMIT_MAX;
}

function recordSubmission() {
  const raw = localStorage.getItem(RATE_LIMIT_KEY);
  const timestamps: number[] = raw ? JSON.parse(raw) : [];
  const now = Date.now();
  const recent = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
  recent.push(now);
  localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(recent));
}

/* ── Ask Modal ────────────────────────────────────────── */

function AskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [slide, setSlide] = useState(0);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [contactPub, setContactPub] = useState('');
  const [contactPriv, setContactPriv] = useState('');
  const [name, setName] = useState('');
  const [pubReadonly, setPubReadonly] = useState(false);
  const [privReadonly, setPrivReadonly] = useState(false);
  const [errorPub, setErrorPub] = useState(false);
  const [errorPriv, setErrorPriv] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const titleOk = title.trim().length >= 5;

  function reset() {
    setSlide(0); setTitle(''); setDesc('');
    setContactPub(''); setContactPriv(''); setName('');
    setPubReadonly(false); setPrivReadonly(false);
    setErrorPub(false); setErrorPriv(false); setRateLimited(false);
  }

  function handleClose() { reset(); onClose(); }

  function goPublish() {
    if (!titleOk) return;
    const saved = localStorage.getItem('faq-contact') || '';
    setContactPub(saved);
    setPubReadonly(!!saved);
    setSlide(1);
  }

  function goPrivate() {
    if (!titleOk) return;
    const saved = localStorage.getItem('faq-contact') || '';
    setContactPriv(saved);
    setPrivReadonly(!!saved);
    const savedName = localStorage.getItem('faq-contact-name') || '';
    if (savedName) setName(savedName);
    setSlide(2);
  }

  const [submitting, setSubmitting] = useState(false);

  async function submitPub() {
    if (!contactPub.trim()) { setErrorPub(true); return; }
    if (!checkRateLimit()) { setRateLimited(true); return; }
    const t = title.trim().slice(0, 120);
    const d = desc.trim().slice(0, 500) || null;
    const c = contactPub.trim().slice(0, 200);
    setErrorPub(false);
    setSubmitting(true);
    const { error } = await supabase.from('faq_preguntas').insert({
      titulo: t,
      descripcion: d,
      modo: 'publica',
      contacto: c,
    });
    setSubmitting(false);
    if (error) { setErrorPub(true); return; }
    recordSubmission();
    localStorage.setItem('faq-contact', c);
    setSlide(3);
  }

  async function submitPriv() {
    if (!contactPriv.trim()) { setErrorPriv(true); return; }
    if (!checkRateLimit()) { setRateLimited(true); return; }
    const t = title.trim().slice(0, 120);
    const d = desc.trim().slice(0, 500) || null;
    const c = contactPriv.trim().slice(0, 200);
    const n = name.trim().slice(0, 80) || null;
    setErrorPriv(false);
    setSubmitting(true);
    const { error } = await supabase.from('faq_preguntas').insert({
      titulo: t,
      descripcion: d,
      modo: 'privada',
      contacto: c,
      nombre_contacto: n,
    });
    setSubmitting(false);
    if (error) { setErrorPriv(true); return; }
    recordSubmission();
    localStorage.setItem('faq-contact', c);
    if (n) localStorage.setItem('faq-contact-name', n);
    setSlide(3);
  }

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: 'rgba(0,10,10,0.82)' }} role="dialog" aria-modal="true" onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="w-full max-w-[480px] rounded-2xl overflow-hidden relative" style={{ background: '#122e2e', border: '1px solid rgba(5,140,112,0.5)', boxShadow: '0 24px 64px rgba(0,0,0,0.55)' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-8 py-5 rounded-t-2xl relative" style={{ background: 'linear-gradient(135deg, #012a1f 0%, #0d3040 100%)', borderBottom: '1px solid rgba(0,199,177,0.2)' }}>
          <button type="button" onClick={handleClose} aria-label="Cerrar"
            style={{ position: 'absolute', top: '0.9rem', right: '1rem', background: 'none', border: 'none', color: 'var(--color-text-light)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1, padding: '0.25rem', zIndex: 1 }}>
            &times;
          </button>
          <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,199,177,0.15)', border: '1px solid rgba(0,199,177,0.35)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true" style={{ color: '#00c7b1' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold leading-tight" style={{ color: '#fff', fontSize: '1.05rem' }}>Hacé tu pregunta</h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(0,199,177,0.12)', border: '1px solid rgba(0,199,177,0.28)', borderRadius: 999, padding: '0.18rem 0.65rem', fontSize: '0.72rem', fontWeight: 600, color: '#00c7b1', marginTop: '0.25rem' }}>
              <span style={{ width: 6, height: 6, background: '#00c7b1', borderRadius: '50%', flexShrink: 0 }} />
              Te respondemos a la brevedad
            </span>
          </div>
        </div>

        {/* Carousel */}
        <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
          {/* Slide 0: Write + choose mode */}
          <div className={`ask-slide px-8 py-6 pb-8 ${slide === 0 ? 'active visible pointer-events-auto' : 'invisible pointer-events-none'}`} style={{ gridArea: '1 / 1' }}>
            <div className="space-y-4">
              <div>
                <label htmlFor="ask-title" className="block text-sm font-semibold mb-1.5" style={{ color: '#d6efed' }}>Título <span style={{ color: '#00c7b1' }}>*</span></label>
                <input type="text" id="ask-title" className="ask-input" placeholder="Ej: ¿Cómo funcionan los pagos?" maxLength={120} value={title} onChange={e => setTitle(e.target.value)} />
                <span className="block text-xs mt-1 text-right" style={{ color: title.length > 100 ? '#e67373' : '#4d8c85' }}>{title.length}/120</span>
              </div>
              <div>
                <label htmlFor="ask-question" className="block text-sm font-semibold mb-1.5" style={{ color: '#d6efed' }}>Descripción <span className="font-normal" style={{ color: '#4d8c85' }}>(opcional)</span></label>
                <textarea id="ask-question" className="ask-input" rows={3} placeholder="Contá con más detalle tu consulta…" maxLength={500} value={desc} onChange={e => setDesc(e.target.value)} />
                <span className="block text-xs mt-1 text-right" style={{ color: desc.length > 450 ? '#e67373' : '#4d8c85' }}>{desc.length}/500</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="flex flex-col items-center w-full rounded-[0.875rem] p-4 text-white cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale-[0.6] disabled:pointer-events-none" style={{ border: '1.5px solid rgba(0,199,177,0.4)', background: 'rgba(0,199,177,0.08)' }} disabled={!titleOk} onClick={goPublish}>
                  <div style={{ height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24" style={{ color: '#00c7b1' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3-3-3z" />
                    </svg>
                  </div>
                  <div className="font-bold text-sm mt-2 mb-1 min-h-[2.4em] flex items-center text-center leading-tight" style={{ color: '#4ddfd0' }}>Publicar en la página</div>
                  <div className="text-xs leading-relaxed" style={{ color: '#6a9b94' }}>Visible para todos. Te avisamos cuando sea respondida.</div>
                </button>
                <button type="button" className="flex flex-col items-center w-full rounded-[0.875rem] p-4 text-white cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale-[0.6] disabled:pointer-events-none" style={{ border: '1.5px solid rgba(55,181,170,0.4)', background: 'rgba(55,181,170,0.07)' }} disabled={!titleOk} onClick={goPrivate}>
                  <div style={{ height: '2.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: '#37b5aa' }}>
                      <circle cx="12" cy="7.5" r="3" /><path strokeLinecap="round" d="M5.5 21v-1a6.5 6.5 0 0113 0v1" />
                    </svg>
                  </div>
                  <div className="font-bold text-sm mt-2 mb-1 min-h-[2.4em] flex items-center text-center leading-tight" style={{ color: '#5ecbb9' }}>Respuesta personal</div>
                  <div className="text-xs leading-relaxed" style={{ color: '#4c7f78' }}>Te contactamos directamente a la brevedad.</div>
                </button>
              </div>
            </div>
          </div>

          {/* Slide 1: Publish */}
          <div className={`ask-slide px-8 py-6 pb-8 ${slide === 1 ? 'active visible pointer-events-auto' : 'invisible pointer-events-none'}`} style={{ gridArea: '1 / 1' }}>
            <button type="button" className="inline-flex items-center gap-1 mb-4 px-3 py-1 rounded-full text-xs font-semibold transition-all" style={{ background: 'rgba(0,199,177,0.07)', border: '1px solid rgba(0,199,177,0.2)', color: '#7de8d8' }} onClick={() => setSlide(0)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Volver
            </button>
            <h3 className="text-base font-bold mb-1" style={{ color: '#fff' }}>Publicar en la página</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-light)' }}>Tu pregunta quedará visible para otros visitantes. Te notificamos cuando sea respondida.</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="ask-contact-pub" className="block text-sm font-semibold mb-1.5" style={{ color: '#c8dedd' }}>Tu email <span style={{ color: 'var(--cau-brand-green)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type="email" id="ask-contact-pub" className="ask-input" placeholder="tucorreo@gmail.com" autoComplete="email"
                    value={contactPub} onChange={e => setContactPub(e.target.value)} readOnly={pubReadonly} style={{ width: '100%', paddingRight: '5.5rem' }} />
                  {pubReadonly && (
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[3.8rem] text-center text-xs font-semibold rounded-md px-2 py-1 cursor-pointer transition-colors" style={{ color: '#00c7b1', background: 'rgba(0,199,177,0.12)', border: '1px solid rgba(0,199,177,0.35)' }} onClick={() => setPubReadonly(false)}>Editar</button>
                  )}
                  {!pubReadonly && contactPub && (
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[3.8rem] text-center text-xs font-semibold rounded-md px-2 py-1 cursor-pointer transition-colors" style={{ color: '#013729', background: '#00c7b1', border: '1px solid #00c7b1' }} onClick={() => setPubReadonly(true)}>Listo</button>
                  )}
                </div>
                <div className={`text-xs mt-1 text-red-400 ${errorPub ? 'block' : 'hidden'}`}>Ingresá tu email para poder avisarte cuando sea respondida.</div>
                <div className={`text-xs mt-1 text-red-400 ${rateLimited ? 'block' : 'hidden'}`}>Alcanzaste el límite de preguntas por hora. Intentá más tarde.</div>
              </div>
              <button type="button" className="ask-cta-btn w-full flex items-center justify-center gap-2 font-bold py-3 px-5 rounded-xl text-white text-base disabled:opacity-50 disabled:cursor-not-allowed" onClick={submitPub} disabled={submitting}>
                {submitting ? 'Enviando...' : (<><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>Publicar pregunta</>)}
              </button>
            </div>
          </div>

          {/* Slide 2: Private */}
          <div className={`ask-slide px-8 py-6 pb-8 ${slide === 2 ? 'active visible pointer-events-auto' : 'invisible pointer-events-none'}`} style={{ gridArea: '1 / 1' }}>
            <button type="button" className="inline-flex items-center gap-1 mb-4 px-3 py-1 rounded-full text-xs font-semibold transition-all" style={{ background: 'rgba(0,199,177,0.07)', border: '1px solid rgba(0,199,177,0.2)', color: '#7de8d8' }} onClick={() => setSlide(0)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Volver
            </button>
            <h3 className="text-base font-bold mb-1" style={{ color: '#fff' }}>Tus datos de contacto</h3>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-light)' }}>Te respondemos a la brevedad por el medio que prefieras.</p>
            <div className="space-y-3">
              <div>
                <label htmlFor="ask-name" className="block text-sm font-semibold mb-1.5" style={{ color: '#c8dedd' }}>Tu nombre <span className="font-normal" style={{ color: 'var(--color-text-light)' }}>(opcional)</span></label>
                <input type="text" id="ask-name" className="ask-input" placeholder="Ej: María García" autoComplete="name" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="ask-wa" className="block text-sm font-semibold mb-1.5" style={{ color: '#c8dedd' }}>Tu WhatsApp o email <span style={{ color: 'var(--cau-brand-green)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input type="text" id="ask-wa" className="ask-input" placeholder="Ej: +54 9 11 1234-5678 ó tucorreo@gmail.com" autoComplete="off"
                    value={contactPriv} onChange={e => setContactPriv(e.target.value)} readOnly={privReadonly} style={{ width: '100%', paddingRight: '5.5rem' }} />
                  {privReadonly && (
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[3.8rem] text-center text-xs font-semibold rounded-md px-2 py-1 cursor-pointer transition-colors" style={{ color: '#00c7b1', background: 'rgba(0,199,177,0.12)', border: '1px solid rgba(0,199,177,0.35)' }} onClick={() => setPrivReadonly(false)}>Editar</button>
                  )}
                  {!privReadonly && contactPriv && (
                    <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 min-w-[3.8rem] text-center text-xs font-semibold rounded-md px-2 py-1 cursor-pointer transition-colors" style={{ color: '#013729', background: '#00c7b1', border: '1px solid #00c7b1' }} onClick={() => setPrivReadonly(true)}>Listo</button>
                  )}
                </div>
              </div>
              <div className={`text-xs mt-1 text-red-400 ${errorPriv ? 'block' : 'hidden'}`}>Ingresá un contacto para poder responderte.</div>
              <div className={`text-xs mt-1 text-red-400 ${rateLimited ? 'block' : 'hidden'}`}>Alcanzaste el límite de preguntas por hora. Intentá más tarde.</div>
              <button type="button" className="ask-cta-btn w-full flex items-center justify-center gap-2 font-bold py-3 px-5 rounded-xl text-white text-base disabled:opacity-50 disabled:cursor-not-allowed" onClick={submitPriv} disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar consulta'}
              </button>
            </div>
          </div>

          {/* Slide 3: Confirmation */}
          <div className={`ask-slide px-8 py-6 pb-8 ${slide === 3 ? 'active visible pointer-events-auto' : 'invisible pointer-events-none'}`} style={{ gridArea: '1 / 1', textAlign: 'center' }}>
            <svg className="w-14 h-14 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ color: 'var(--color-highlight)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#fff' }}>¡Consulta recibida!</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-light)' }}>Nos llegó tu pregunta y te respondemos a la brevedad. ¡Gracias!</p>
            <button type="button" onClick={handleClose}
              className="font-semibold py-2.5 px-6 rounded-xl text-white text-sm hover:bg-[rgba(0,199,177,0.35)]"
              style={{ background: 'rgba(0,199,177,0.2)', border: '1px solid rgba(0,199,177,0.45)', cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── User Questions Section (from Supabase) ──────────── */

function UserQuestionItem({ q, displayIndex, isOpen, onToggle }: { q: UserQuestion; displayIndex: number; isOpen: boolean; onToggle: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (isOpen) {
      el.style.maxHeight = el.scrollHeight + 'px';
      el.style.opacity = '1';
    } else {
      el.style.maxHeight = '0';
      el.style.opacity = '0';
    }
  }, [isOpen]);

  return (
    <div className={`faq-item-user rounded-xl overflow-hidden${isOpen ? ' is-open-user' : ''}`}>
      <button type="button" className="faq-btn-user w-full flex items-center gap-3 md:gap-4 text-left px-4 md:px-5 py-4" aria-expanded={isOpen} onClick={onToggle}>
        <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#37b5aa', color: '#012a1f' }}>
          {displayIndex}
        </span>
        <span className="font-semibold flex-1 min-w-0 leading-snug text-sm md:text-lg" style={{ color: '#fff' }}>{q.titulo}</span>
        <svg className="faq-chevron w-5 h-5 md:w-6 md:h-6 flex-shrink-0" style={{ color: '#37b5aa', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="currentColor" viewBox="0 0 512 512" aria-hidden="true">
          <path d="M256 294.1L383 167c9.4-9.4 24.6-9.4 33.9 0s9.3 24.6 0 34L273 345c-9.1 9.1-23.7 9.3-33.1.7L95 201.1c-4.7-4.7-7-10.9-7-17s2.3-12.3 7-17c9.4-9.4 24.6-9.4 33.9 0l127.1 127z" />
        </svg>
      </button>
      <div ref={contentRef} className="faq-content overflow-hidden" style={{ maxHeight: 0, opacity: 0 }}>
        <div className="px-5 pb-5 pt-1 leading-relaxed space-y-3" style={{ color: '#c8dedd' }}>
          {q.descripcion && (
            <p style={{ color: '#e0f0ee' }}>{q.descripcion}</p>
          )}
          {q.respuesta ? (
            <div className="rounded-lg px-4 py-3 text-sm leading-relaxed" style={{ background: 'rgba(0,199,177,0.08)', border: '1px solid rgba(0,199,177,0.2)' }}>
              <span className="text-xs font-semibold block mb-1.5" style={{ color: '#00c7b1' }}>Respuesta del CAU</span>
              {q.respuesta}
            </div>
          ) : (
            <p className="text-sm italic" style={{ color: '#c8dedd' }}>Pendiente de respuesta</p>
          )}
        </div>
      </div>
    </div>
  );
}

function UserQuestionsSection({ questions, openSet, setOpenSet, search }: {
  questions: UserQuestion[];
  openSet: Set<number>;
  setOpenSet: React.Dispatch<React.SetStateAction<Set<number>>>;
  search: string;
}) {
  const toggleQ = (id: number) => {
    setOpenSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = questions.filter(q => {
    const haystack = q.titulo + ' ' + (q.descripcion || '') + ' ' + (q.respuesta || '');
    return fuzzyMatch(search, haystack);
  });

  if (filtered.length === 0) return null;

  return (
    <div>
      {filtered.map((q, i) => (
        <UserQuestionItem key={q.id} q={q} displayIndex={i + 1} isOpen={openSet.has(q.id)} onToggle={() => toggleQ(q.id)} />
      ))}
    </div>
  );
}

/* ── Main FAQ Page Component ──────────────────────────── */

interface UserQuestion {
  id: number;
  titulo: string;
  descripcion: string | null;
  respuesta: string | null;
  created_at: string;
}

export default function FaqPage({ initialQuestions = [] }: { initialQuestions?: UserQuestion[] }) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  // Open first item on first visit (client-only to avoid hydration mismatch)
  useEffect(() => {
    if (!localStorage.getItem('faq-visited')) {
      localStorage.setItem('faq-visited', '1');
      setOpenItems(new Set([0]));
    }
  }, []);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const userQuestions = initialQuestions;
  const [openUserQ, setOpenUserQ] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const toggleItem = useCallback((index: number) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const visibleItems = FAQ_ITEMS.map((item, i) => {
    const haystack = item.keywords + ' ' + item.question;
    return { ...item, index: i, visible: fuzzyMatch(search, haystack) };
  });

  const visibleCount = visibleItems.filter(v => v.visible).length;

  function scrollToItem(index: number) {
    const el = itemRefs.current[index];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        if (!openItems.has(index)) {
          setOpenItems(prev => new Set(prev).add(index));
        }
      }, 300);
    }
  }

  return (
    <>
      <section className="faq-section w-full px-4 pt-2 pb-14 md:pt-4 md:pb-16">
        <div className="max-w-7xl mx-auto">

          {/* Layout */}
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-6 lg:items-start">

            {/* Mobile ask button */}
            <button type="button" className="lg:hidden w-full flex items-center justify-center gap-2 font-bold py-3 px-5 rounded-xl text-white text-base ask-cta-btn"
              onClick={() => setModalOpen(true)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Hacer una pregunta
            </button>

            {/* Main column */}
            <div className="flex-1 min-w-0">
              {/* Search */}
              <div className="relative mb-3">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-highlight)' }} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
                </svg>
                <input id="faq-search" type="search" placeholder="Busca la pregunta que necesites..." autoComplete="off"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl text-white text-base outline-none"
                  style={{ background: '#0d2525', border: '2px solid rgba(0,199,177,0.45)' }}
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              {visibleCount === 0 && (
                <p className="text-center mb-6" style={{ color: 'var(--color-text-light)' }}>
                  No se encontraron resultados. Intentá con otros términos.
                </p>
              )}

              {/* Accordion */}
              <div id="faq-list">
                {visibleItems.map(({ visible, index, ...item }) => (
                  <div key={index} ref={el => { itemRefs.current[index] = el; }} style={{ display: visible ? undefined : 'none' }}>
                    <FaqAccordionItem
                      item={item as FaqItem}
                      index={index}
                      isOpen={openItems.has(index)}
                      onToggle={() => toggleItem(index)}
                    />
                  </div>
                ))}
              </div>

              {/* User questions — below FAQ accordion */}
              {userQuestions.length > 0 && (
                <div id="user-questions-section" className="mt-3 md:mt-6 rounded-xl p-4 md:p-5" style={{ border: '1px solid rgba(55,181,170,0.25)', background: 'rgba(55,181,170,0.03)' }}>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-4" style={{ background: 'rgba(55,181,170,0.1)', border: '1px solid rgba(55,181,170,0.3)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: '#37b5aa' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 4H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h4a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    </svg>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#fff', letterSpacing: '0.08em' }}>Preguntas de usuarios</p>
                  </div>
                  <UserQuestionsSection questions={userQuestions} openSet={openUserQ} setOpenSet={setOpenUserQ} search={search} />
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="w-full lg:w-80 xl:w-[340px] flex-shrink-0 flex flex-col gap-3 lg:sticky lg:overflow-y-auto" style={{ top: 'calc(var(--navbar-height, 60px) + 0.75rem)', maxHeight: 'calc(100vh - var(--navbar-height, 60px) - 1.5rem)' }}>
              {/* Desktop ask button */}
              <button type="button" className="hidden lg:flex w-full items-center justify-center gap-2 font-bold py-4 px-5 rounded-xl text-white text-base ask-cta-btn"
                onClick={() => setModalOpen(true)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                Hacer una pregunta
              </button>

              {/* Quick links */}
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,85,135,0.45)' }}>
                <div className="px-4 py-2.5" style={{ background: 'rgba(0,85,135,0.45)' }}>
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--cau-brand-cream, #fef8f4)', letterSpacing: '0.1em', paddingLeft: '0.6rem' }}>Preguntas frecuentes</p>
                </div>
                <div style={{ background: 'rgba(0,40,80,0.55)' }}>
                  <ul>
                    {[
                      { idx: 0, label: '¿Dónde queda el CAU Villa Lugano?' },
                      { idx: 1, label: '¿Cómo contactarlos?' },
                      { idx: 2, label: '¿Cómo me inscribo?' },
                      { idx: 3, label: '¿Qué formas de pago hay?' },
                    ].map(({ idx, label }, i, arr) => (
                      <li key={idx} style={i < arr.length - 1 ? { borderBottom: '1px solid rgba(0,199,177,0.12)' } : undefined}>
                        <button className="flex items-start gap-2 w-full text-left px-2.5 py-2.5 text-sm leading-snug border-none bg-transparent cursor-pointer transition-colors hover:bg-[rgba(0,199,177,0.1)] hover:text-white" style={{ color: '#b8d4d0', fontFamily: 'inherit' }} onClick={() => scrollToItem(idx)}>{label}</button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sidebar user question titles */}
              {userQuestions.length > 0 && (
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(55,181,170,0.3)' }}>
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'rgba(55,181,170,0.15)' }}>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: '#37b5aa' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-1" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 4H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l4-4h4a2 2 0 002-2V6a2 2 0 00-2-2z" />
                    </svg>
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#fff', letterSpacing: '0.08em' }}>Preguntas de usuarios</p>
                  </div>
                  <div style={{ background: 'rgba(55,181,170,0.05)' }}>
                    <ul>
                      {userQuestions.map((q, i) => (
                        <li key={q.id} style={i < userQuestions.length - 1 ? { borderBottom: '1px solid rgba(55,181,170,0.12)' } : undefined}>
                          <button className="flex items-start gap-2 w-full text-left px-2.5 py-2.5 text-sm leading-snug border-none bg-transparent cursor-pointer transition-colors hover:bg-[rgba(55,181,170,0.08)] hover:text-white" style={{ color: '#c8dedd', fontFamily: 'inherit' }} onClick={() => {
                            document.getElementById('user-questions-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            setOpenUserQ(prev => new Set(prev).add(q.id));
                          }}>{q.titulo}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* WhatsApp contact */}
              <div className="rounded-xl p-4" style={{ background: 'rgba(5,140,112,0.18)', border: '1px solid rgba(5,140,112,0.5)' }}>
                <p className="text-sm mb-2.5" style={{ color: '#c8dedd' }}>¿No encontrás lo que buscás? Escribinos directamente.</p>
                <a href="https://wa.me/5491166522722" target="_blank" rel="noopener"
                  className="flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-lg text-sm text-white w-full hover:brightness-110"
                  style={{ background: '#25D366' }}>
                  <WhatsAppIcon className="w-4 h-4" />
                  Consultanos por WhatsApp
                </a>
              </div>
            </aside>

          </div>


        </div>
      </section>

      <AskModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
