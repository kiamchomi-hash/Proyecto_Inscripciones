'use client';

// Modal de las tecnicaturas de Teclab. Mismo formato de slides que el modal de
// convenio (ia-modal), pero con el lenguaje visual del render de Remotion
// (Desktop\Teclab Info\remotion-teclab-carreras): fondo tinta #071822, tarjetas
// blancas con sombra dura de color, tipografia pesada en mayusculas y chips de
// tipo. El acento cambia por familia: cian en tecnologia, violeta en gestion.
//
// El material de marca -logo, fotos de portada, logos de las empresas que
// cocrearon cada carrera- sale de la ficha oficial de teclab.edu.ar, a la que
// cada slide enlaza (ver FICHAS en ./teclab).

import Image from 'next/image';
import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { type Carrera, carreraToSlug } from './types';
import {
  acentoTeclab,
  getFamiliaTeclab,
  getFichaTeclab,
  getTipoTeclab,
  parseCompetenciasTeclab,
  parseEnfoqueTeclab,
  parsePlanTeclab,
  partirDescripcionTeclab,
  type TeclabFicha,
  type TeclabPeriodo,
} from './teclab';

interface Props {
  carrera: Carrera;
  onClose: () => void;
}

// El violeta de marca sobre el fondo tinta apaga los textos chicos, asi que los
// rotulos usan una version aclarada de cada acento.
const CLARO: Record<string, string> = {
  '#2ee7d7': '#8ff5ec',
  '#8e2cf2': '#c9a0ff',
};

/** Flecha de enlace externo, el motivo `>` de la marca */
function IconoExterno({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1h4" />
    </svg>
  );
}

/** Enlace a la ficha oficial de la carrera en teclab.edu.ar */
function EnlaceFicha({ ficha, acento, className = '' }: { ficha: TeclabFicha; acento: string; className?: string }) {
  return (
    <a
      href={ficha.url}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-1.5 text-[0.6rem] font-black uppercase tracking-[0.12em] transition-opacity hover:opacity-75 ${className}`}
      style={{ color: CLARO[acento] }}
    >
      Ver en teclab.edu.ar
      <IconoExterno className="w-3 h-3" />
    </a>
  );
}

/**
 * Foto de portada de la ficha oficial, en su marco con la sombra dura desplazada
 * que es el motivo de la marca. Decorativa: lo que informa es el texto de al lado.
 */
function FotoFicha({ ficha, acento, className = '' }: { ficha: TeclabFicha; acento: string; className?: string }) {
  return (
    <div className={`teclab-foto ${className}`} style={{ boxShadow: `6px 6px 0 ${acento}` }}>
      <Image
        src={ficha.imagen}
        alt=""
        fill
        quality={90}
        sizes="(max-width: 768px) 92vw, 20rem"
        className="object-cover"
      />
    </div>
  );
}

/** "Cocreada con" + el logo blanco que publica la ficha oficial */
function BloqueCocreacion({ ficha, acento, className = '' }: { ficha: TeclabFicha; acento: string; className?: string }) {
  if (!ficha.partner) return null;
  return (
    <div
      className={`flex items-center gap-3 rounded px-3 py-2 ${className}`}
      style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}
    >
      <span className="text-[0.55rem] font-black uppercase tracking-[0.14em] leading-tight" style={{ color: CLARO[acento] }}>
        Carrera
        <span className="block">cocreada con</span>
      </span>
      {ficha.partner.logo ? (
        <Image
          src={ficha.partner.logo}
          alt={ficha.partner.nombre}
          width={420}
          height={110}
          className="h-4 sm:h-5 w-auto flex-shrink-0"
        />
      ) : (
        <span className="text-sm font-bold text-white leading-tight">{ficha.partner.nombre}</span>
      )}
    </div>
  );
}

/** Rotulo de seccion de un slide */
function Rotulo({ children, acento }: { children: React.ReactNode; acento: string }) {
  return (
    <p
      className="flex-shrink-0 text-[0.6rem] font-black uppercase tracking-[0.16em]"
      style={{ color: CLARO[acento] }}
    >
      {children}
    </p>
  );
}

/** Bloque de dato: el principal va lleno con el acento, como en el render */
function BloqueDato({
  label,
  valor,
  acento,
  principal,
  className = '',
}: {
  label: string;
  valor: string;
  acento: string;
  principal?: boolean;
  className?: string;
}) {
  const textoPrincipal = acento === '#2ee7d7' ? '#071822' : '#fff';
  return (
    <div
      className={`rounded px-2.5 py-1.5 ${className}`}
      style={
        principal
          ? { background: acento, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)' }
          : { background: 'rgba(255,255,255,0.075)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }
      }
    >
      <span
        className="block text-[0.55rem] font-black uppercase tracking-[0.14em]"
        style={{ color: principal ? `${textoPrincipal}b3` : CLARO[acento] }}
      >
        {label}
      </span>
      <span
        className="block text-[0.78rem] sm:text-sm font-bold leading-tight mt-0.5"
        style={{ color: principal ? textoPrincipal : '#fff' }}
      >
        {valor}
      </span>
    </div>
  );
}

// ── Slide 1: portada ──
function SlidePortada({ carrera, acento, ficha }: { carrera: Carrera; acento: string; ficha: TeclabFicha | null }) {
  const { modalidad, certificado } = parseEnfoqueTeclab(carrera.enfoque);
  const tipo = getTipoTeclab(carrera);
  const nombre = carrera.nombre_corto || carrera.nombre;
  const { perfil } = partirDescripcionTeclab(carrera.descripcion);

  return (
    // En desktop es una grilla: el texto a la izquierda y la foto a la derecha,
    // arrancando a la altura del titulo y estirandose hasta los cuadros de
    // datos, asi no queda un hueco muerto abajo cuando la pantalla es alta.
    // En mobile es una columna y la foto entra despues de los chips.
    <div className="teclab-slide teclab-portada h-full flex flex-col gap-3 p-5 sm:p-7 overflow-y-auto custom-scrollbar">
      <div className="teclab-portada-titulo flex-shrink-0 flex gap-3">
        <div className="w-[3px] rounded-sm flex-shrink-0 self-stretch" style={{ background: acento }} />
        <div className="min-w-0">
          {carrera.prefix && (
            <p
              className="text-[0.6rem] sm:text-xs font-black uppercase tracking-[0.16em] mb-1"
              style={{ color: acento }}
            >
              {carrera.prefix}
            </p>
          )}
          <h2
            className={`font-black text-white uppercase leading-[1.03] tracking-tight ${
              nombre.length > 38 ? 'text-lg sm:text-3xl' : 'text-2xl sm:text-4xl'
            }`}
          >
            {nombre}
          </h2>
        </div>
      </div>

      <div className="teclab-portada-chips flex-shrink-0 flex flex-wrap gap-1.5">
        {tipo && <span className="teclab-chip teclab-chip-tipo">{tipo}</span>}
        <span className="teclab-chip">{modalidad}</span>
        <span className="teclab-chip">{carrera.duracion}</span>
        <span className="teclab-chip">Título oficial</span>
      </div>

      {ficha && (
        <div className="teclab-portada-foto flex-shrink-0 flex flex-col gap-2">
          <FotoFicha ficha={ficha} acento={acento} />
          <BloqueCocreacion ficha={ficha} acento={acento} />
        </div>
      )}

      {perfil && (
        <div className="teclab-portada-perfil flex-shrink-0 flex flex-col gap-2">
          <Rotulo acento={acento}>Perfil profesional</Rotulo>
          <p className="text-[0.88rem] sm:text-[0.95rem] text-[#c3d8e6] leading-relaxed">{perfil}</p>
          {ficha && <EnlaceFicha ficha={ficha} acento={acento} className="mt-1" />}
        </div>
      )}

      {/* Los dos cuadros van del mismo ancho y cada uno con su alto: si se
          estiran para igualarse, el del titulo queda enorme al lado de un
          certificado de dos lineas. */}
      <div className="teclab-portada-datos flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
        <BloqueDato label="Título" valor={carrera.titulo} acento={acento} principal />
        {certificado && <BloqueDato label="Certificado intermedio" valor={certificado} acento={acento} />}
      </div>
    </div>
  );
}

// ── Slide 2: competencias y salida laboral ──
function SlideCompetencias({ competencias, salida, acento }: { competencias: string[]; salida: string; acento: string }) {
  return (
    <div className="teclab-slide h-full flex flex-col gap-3 p-5 sm:p-7 overflow-y-auto custom-scrollbar">
      <Rotulo acento={acento}>Competencias profesionales</Rotulo>
      <h3 className="flex-shrink-0 text-xl sm:text-3xl font-black text-white uppercase leading-tight tracking-tight">
        Qué vas a saber hacer
      </h3>
      {/* La salida laboral va arriba: las competencias son varias y largas, y si
          queda al pie hay que scrollear para encontrarla. */}
      {salida && (
        <div
          className="flex-shrink-0 rounded p-3"
          style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', borderLeft: `3px solid ${acento}` }}
        >
          <p className="text-[0.55rem] font-black uppercase tracking-[0.16em]" style={{ color: CLARO[acento] }}>
            Dónde vas a trabajar
          </p>
          <p className="text-[0.82rem] sm:text-[0.88rem] text-white leading-snug mt-1">{salida}</p>
        </div>
      )}
      <ul className="flex-1 min-h-fit flex flex-col justify-center gap-2.5">
        {competencias.map((texto, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[0.85rem] sm:text-[0.92rem] text-[#c3d8e6] leading-relaxed">
            <span className="mt-[0.5em] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: acento }} />
            <span>{texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Slide 3: plan de estudios ──
function SlidePlan({ carrera, periodos, acento }: { carrera: Carrera; periodos: TeclabPeriodo[]; acento: string }) {
  const [activo, setActivo] = useState(0);
  const periodo = periodos[activo];
  const textoActivo = acento === '#2ee7d7' ? '#071822' : '#fff';

  return (
    <div className="teclab-slide h-full flex flex-col gap-3 p-4 sm:p-6 overflow-hidden">
      <div className="flex-shrink-0 flex items-baseline justify-between gap-3">
        <Rotulo acento={acento}>Plan de estudios</Rotulo>
        <span className="text-[0.5rem] font-black uppercase tracking-[0.14em] text-white/50">
          {periodos.length} períodos · {carrera.duracion}
        </span>
      </div>

      {/* Mobile: el plan completo, con scroll */}
      <div
        className="md:hidden flex-1 min-h-0 overflow-y-auto custom-scrollbar rounded-lg p-2.5 flex flex-col gap-2.5"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.035)' }}
      >
        {periodos.map((p, i) => (
          <PeriodoDetalle key={i} periodo={p} acento={acento} enTarjeta />
        ))}
      </div>

      {/* Desktop: indice a la izquierda y un periodo por vez, sin scroll */}
      <div
        className="hidden md:flex flex-1 min-h-0 flex-row overflow-hidden rounded-lg"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.035)' }}
      >
        <div
          className="flex-shrink-0 flex flex-col gap-1 p-1.5 overflow-y-auto w-[10.5rem] custom-scrollbar"
          style={{ background: 'rgba(0,0,0,0.22)' }}
        >
          {periodos.map((p, i) => (
            <button
              key={i}
              onClick={() => setActivo(i)}
              className="flex-shrink-0 px-2.5 py-2 rounded text-[0.55rem] font-black uppercase tracking-[0.08em] text-left transition-all cursor-pointer"
              style={
                activo === i
                  ? { background: acento, color: textoActivo, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)' }
                  : { background: 'rgba(255,255,255,0.05)', color: CLARO[acento], boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }
              }
            >
              {p.año}
              <span className="block font-bold opacity-80">{p.label}</span>
            </button>
          ))}
        </div>

        {periodo && (
          <div
            className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 flex flex-col justify-center-safe"
            style={{ borderLeft: `3px solid ${acento}` }}
          >
            <PeriodoDetalle periodo={periodo} acento={acento} />
          </div>
        )}
      </div>
    </div>
  );
}

function PeriodoDetalle({ periodo, acento, enTarjeta }: { periodo: TeclabPeriodo; acento: string; enTarjeta?: boolean }) {
  return (
    <div
      className={enTarjeta ? 'flex-shrink-0 rounded p-3' : undefined}
      style={
        enTarjeta
          ? {
              background: 'rgba(255,255,255,0.05)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
              borderLeft: `3px solid ${acento}`,
            }
          : undefined
      }
    >
      <p className="text-[0.55rem] font-black uppercase tracking-[0.16em]" style={{ color: CLARO[acento] }}>
        {periodo.año}
      </p>
      <p className="text-[0.9rem] md:text-lg font-bold text-white leading-snug mt-0.5">{periodo.label}</p>
      <ul className="flex flex-col gap-1.5 mt-2 md:mt-3">
        {periodo.materias.map((materia, j) => (
          <li key={j} className="flex items-start gap-2 text-[0.78rem] md:text-[0.92rem] text-[#a9c4d6] leading-snug">
            <span className="mt-[0.5em] w-1 h-1 rounded-full flex-shrink-0" style={{ background: acento }} />
            <span>{materia}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Slide 4: cierre ──
function SlideCierre({ carrera, acento, ficha }: { carrera: Carrera; acento: string; ficha: TeclabFicha | null }) {
  const { modalidad, certificado } = parseEnfoqueTeclab(carrera.enfoque);
  const beneficios = [
    { titulo: 'Título', detalle: carrera.titulo },
    { titulo: 'Modalidad', detalle: modalidad },
    { titulo: 'Duración', detalle: carrera.duracion },
    { titulo: 'Certificado intermedio', detalle: certificado || 'Al finalizar el primer año' },
  ];
  const waHref = `https://wa.me/5491166522722?text=${encodeURIComponent(
    `Hola, quiero consultar precios y fechas de ${carrera.nombre}`,
  )}`;

  return (
    <div className="teclab-slide teclab-cierre h-full flex flex-col gap-3 p-5 sm:p-7 overflow-y-auto custom-scrollbar">
      {/* La segunda foto de la ficha, de fondo y bajo un velo tinta */}
      {ficha && (
        <div className="teclab-cierre-fondo" aria-hidden="true">
          <Image src={ficha.imagenCierre} alt="" fill quality={90} sizes="(max-width: 768px) 100vw, 64rem" className="object-cover" />
          <div className="teclab-cierre-velo" />
        </div>
      )}

      <div className="flex-shrink-0">
        <h3 className="text-2xl sm:text-4xl font-black text-white uppercase leading-none tracking-tight">
          Educación para
          <span className="block" style={{ color: acento }}>
            cambiarlo todo
          </span>
        </h3>
        <p className="text-[#a9c4d6] text-[0.8rem] sm:text-sm mt-2">
          {ficha?.resumen ||
            'Tecnicatura oficial de Teclab, Instituto Técnico Superior con validez nacional.'}
        </p>
      </div>

      <div className="flex-1 min-h-fit grid grid-cols-1 sm:grid-cols-2 gap-2 content-center">
        {beneficios.map(b => (
          <div
            key={b.titulo}
            className="rounded p-3"
            style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}
          >
            <p className="text-[0.55rem] font-black uppercase tracking-[0.16em]" style={{ color: CLARO[acento] }}>
              {b.titulo}
            </p>
            <p className="text-[0.85rem] font-bold text-white leading-snug mt-0.5">{b.detalle}</p>
          </div>
        ))}
      </div>

      {ficha?.partner && (
        <div className="flex-shrink-0">
          <BloqueCocreacion ficha={ficha} acento={acento} />
        </div>
      )}

      <div className="flex-shrink-0 flex flex-wrap gap-2">
        <a
          href={waHref}
          target="_blank"
          rel="noopener nofollow"
          className="flex-1 min-w-[10rem] flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#25d366] text-white font-bold text-sm hover:brightness-110 transition-all"
        >
          Consultar precios
        </a>
        {ficha && (
          <a
            href={ficha.url}
            target="_blank"
            rel="noopener"
            className="flex-1 min-w-[10rem] flex items-center justify-center gap-2 py-2.5 rounded-lg font-bold text-sm transition-all hover:brightness-110"
            style={{ color: CLARO[acento], boxShadow: `inset 0 0 0 1px ${acento}` }}
          >
            Ficha oficial
            <IconoExterno className="w-3.5 h-3.5" />
          </a>
        )}
        <a
          href="https://maps.google.com/?q=Guamini+4876+Villa+Lugano+Buenos+Aires"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[10rem] flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-bold text-sm transition-all"
          style={{ background: 'rgba(255,255,255,0.08)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.18)' }}
        >
          Guaminí 4876
        </a>
      </div>

      {/* Lockup oficial: la carrera es de Teclab y articula con la Siglo 21 */}
      <Image
        src="/imagenes/teclab/logo-teclab-siglo21.webp"
        alt="Teclab, Instituto Técnico Superior — Universidad Siglo 21"
        width={380}
        height={69}
        className="flex-shrink-0 h-7 sm:h-8 w-auto mx-auto opacity-80"
      />
    </div>
  );
}

// ── Modal ──
export default function TeclabModal({ carrera, onClose }: Props) {
  const familia = getFamiliaTeclab(carrera) ?? 'gestion';
  const acento = acentoTeclab(familia);
  const textoAcento = acento === '#2ee7d7' ? '#071822' : '#fff';

  const ficha = useMemo(() => getFichaTeclab(carrera), [carrera]);
  const competencias = useMemo(() => parseCompetenciasTeclab(carrera.seccion_modalidad), [carrera.seccion_modalidad]);
  const periodos = useMemo(() => parsePlanTeclab(carrera.plan_estudios), [carrera.plan_estudios]);
  const salida = useMemo(() => partirDescripcionTeclab(carrera.descripcion).salida, [carrera.descripcion]);

  const slides = useMemo(() => {
    const s: { key: string; node: React.ReactNode }[] = [
      { key: 'portada', node: <SlidePortada carrera={carrera} acento={acento} ficha={ficha} /> },
    ];
    if (competencias.length) s.push({ key: 'competencias', node: <SlideCompetencias competencias={competencias} salida={salida} acento={acento} /> });
    if (periodos.length) s.push({ key: 'plan', node: <SlidePlan carrera={carrera} periodos={periodos} acento={acento} /> });
    s.push({ key: 'cierre', node: <SlideCierre carrera={carrera} acento={acento} ficha={ficha} /> });
    return s;
  }, [carrera, acento, competencias, ficha, periodos, salida]);

  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const nombre = carrera.nombre_corto || carrera.nombre;

  useEffect(() => {
    openerRef.current = document.activeElement as HTMLElement | null;
    const inerted: Element[] = [];
    let current: Element | null = dialogRef.current;
    while (current?.parentElement) {
      for (const sibling of Array.from(current.parentElement.children)) {
        if (sibling !== current && !sibling.hasAttribute('inert')) {
          sibling.setAttribute('inert', '');
          inerted.push(sibling);
        }
      }
      current = current.parentElement;
    }
    requestAnimationFrame(() => setVisible(true));
    closeBtnRef.current?.focus();
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
      inerted.forEach(el => el.removeAttribute('inert'));
      openerRef.current?.focus();
    };
  }, []);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }
      if (e.key === 'ArrowRight') {
        setIdx(i => Math.min(slides.length - 1, i + 1));
        return;
      }
      if (e.key === 'ArrowLeft') {
        setIdx(i => Math.max(0, i - 1));
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose, slides.length]);

  const waHref = `https://wa.me/5491166522722?text=${encodeURIComponent(
    `Hola, me gustaría recibir más información sobre ${carrera.nombre}`,
  )}`;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/carreras/${carreraToSlug(carrera)}` : '';

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detalles de ${carrera.nombre}`}
    >
      <div
        className={`absolute inset-0 backdrop-blur-[3px] transition-opacity duration-300 ${visible && !closing ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'rgba(3,10,16,0.86)' }}
        onClick={handleClose}
      />

      {/* El tope en rem evita que en pantallas altas (tablet vertical) el modal
          se estire mucho mas de lo que el contenido necesita y queden huecos. */}
      <div
        className={`teclab-${familia} relative z-10 rounded-2xl w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl md:w-[min(64rem,75vw)]
          h-[88dvh] sm:h-[min(92vh,52rem)] max-h-[88dvh] sm:max-h-[min(92vh,52rem)] overflow-hidden flex flex-col`}
        style={{
          background: '#071822',
          border: `2px solid ${acento}`,
          boxShadow: `0 0 50px ${acento}40`,
        }}
      >
        {/* Encabezado: la marca del instituto vive aca, no en cada slide */}
        <div
          className="teclab-modal-header flex-shrink-0 px-4 py-2.5 sm:px-6 sm:py-3 border-b"
          style={{ background: '#04121a', borderColor: `${acento}59` }}
        >
          <div className="relative flex justify-between items-center gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Logotipo oficial, tal como lo publica teclab.edu.ar */}
              <Image
                src="/imagenes/teclab/logo-teclab.webp"
                alt="Teclab, Instituto Técnico Superior"
                width={296}
                height={100}
                className="h-8 sm:h-10 w-auto flex-shrink-0"
              />
              {idx > 0 && (
                <>
                  <span className="hidden sm:block w-px h-7 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <h3 className="hidden sm:block text-sm md:text-base font-black text-white uppercase tracking-tight leading-tight truncate min-w-0">
                    {nombre}
                  </h3>
                </>
              )}
            </div>
            {ficha && <EnlaceFicha ficha={ficha} acento={acento} className="hidden md:inline-flex ml-auto flex-shrink-0" />}
            <button
              ref={closeBtnRef}
              onClick={handleClose}
              className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-red-600/20 text-red-500 hover:bg-red-600/40 hover:text-red-400 transition-colors"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Slides */}
        <div className="flex-1 min-h-0 overflow-hidden relative" style={{ contain: 'strict' }}>
          <div
            className="flex h-full will-change-transform transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {slides.map(s => (
              <div
                key={s.key}
                className="flex-shrink-0 w-full h-full overflow-hidden"
                style={{ contain: 'layout paint', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
              >
                {s.node}
              </div>
            ))}
          </div>
        </div>

        {/* Navegacion */}
        <div className="flex-shrink-0 flex justify-between items-center px-2 py-2.5 sm:px-6 sm:py-3 border-t" style={{ background: '#04121a', borderColor: `${acento}40` }}>
          <button
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            disabled={idx === 0}
            aria-label="Slide anterior"
            className="flex items-center gap-1 sm:gap-2 text-[0.6rem] sm:text-sm font-bold uppercase tracking-wider px-2 py-1.5 sm:px-4 sm:py-2 rounded transition-all disabled:opacity-30 disabled:pointer-events-none"
            style={{ color: CLARO[acento], boxShadow: `inset 0 0 0 1px ${acento}73` }}
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden min-[360px]:inline">Anterior</span>
          </button>
          <div className="flex justify-center items-center gap-1.5 sm:gap-2.5">
            {slides.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setIdx(i)}
                className="rounded-full transition-all cursor-pointer"
                style={{
                  width: idx === i ? 22 : 8,
                  height: 8,
                  background: idx === i ? acento : 'rgba(255,255,255,0.25)',
                }}
                aria-label={`Ir a slide ${i + 1}`}
                aria-current={idx === i ? 'step' : undefined}
              />
            ))}
          </div>
          <button
            onClick={() => setIdx(i => Math.min(slides.length - 1, i + 1))}
            disabled={idx === slides.length - 1}
            aria-label="Slide siguiente"
            className="flex items-center gap-1 sm:gap-2 text-[0.6rem] sm:text-sm font-bold uppercase tracking-wider px-2 py-1.5 sm:px-4 sm:py-2 rounded transition-all disabled:opacity-30 disabled:pointer-events-none hover:brightness-110"
            style={{ background: acento, color: textoAcento, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)' }}
          >
            <span className="hidden min-[360px]:inline">Siguiente</span>
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Pie */}
        <div className="flex-shrink-0 p-3 border-t flex flex-wrap gap-2 items-center" style={{ background: '#04121a', borderColor: `${acento}59` }}>
          <div className="order-1 sm:order-2 w-full sm:w-auto flex items-center gap-2 justify-end sm:flex-shrink-0">
            <a
              href={waHref}
              target="_blank"
              rel="noopener nofollow"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] text-white font-bold rounded-lg hover:brightness-110 transition-colors text-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
            <a
              href="#formulario"
              onClick={e => {
                e.preventDefault();
                handleClose();
                setTimeout(() => {
                  document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' });
                }, 350);
              }}
              className="w-36 flex items-center justify-center gap-2 py-2 font-bold rounded-lg hover:brightness-110 transition-colors text-sm whitespace-nowrap"
              style={{ background: acento, color: textoAcento }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Inscribite ya
            </a>
          </div>

          <div className="order-2 sm:order-1 w-full sm:flex-1 flex items-center gap-1.5 min-w-0">
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={e => (e.target as HTMLInputElement).select()}
              className="flex-1 min-w-0 px-3 py-2 rounded-lg text-[11px] font-mono focus:outline-none cursor-text transition-colors truncate"
              style={{ background: '#0d222e', border: `1px solid ${acento}59`, color: '#6b9fc0' }}
            />
            <button
              onClick={() => navigator.clipboard?.writeText(shareUrl)}
              title="Compartir enlace"
              className="w-36 flex-shrink-0 flex items-center justify-center gap-1.5 py-2 font-bold rounded-lg hover:brightness-110 transition-colors text-sm"
              style={{ background: 'transparent', border: `1px solid ${acento}`, color: CLARO[acento] }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Compartir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
