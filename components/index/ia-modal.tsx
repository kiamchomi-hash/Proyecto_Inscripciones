'use client';

// Modal de las diplomaturas de convenio (Academia Identidad Argentina).
// Mismo formato de slides que los modales de Siglo 21 (carousel-modal), pero con
// el lenguaje visual de la marca del convenio: fondo tinta #101820 con lavados
// ambientales amarillo/azul, trama fina, tipografia pesada en mayusculas y el
// isotipo de la academia. Referencias: identidadargentina.com.ar y el render de
// Remotion (Desktop\Academia Identidad Argentina\remotion-diplomaturas).

import { useEffect, useLayoutEffect, useCallback, useRef, useState, useMemo } from 'react';
import { type Carrera, carreraToSlug } from './types';
import { getEscuelaIA } from './identidad-argentina';

interface Props {
  carrera: Carrera;
  onClose: () => void;
}

const AZUL = '#0090c1';
const AMARILLO = '#f1cf1c';

// ── Parsers de los campos que llegan de Supabase ──

/** enfoque: "Cursada: ...\nModalidad: ...\nDuración: ...\nCertificación: ..." */
function parseEnfoque(enfoque: string | null) {
  const out: Record<string, string> = {};
  for (const line of (enfoque || '').split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) out[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
  }
  return {
    cursada: out['cursada'] || 'Plataforma Innova Virtual con encuentros en vivo',
    modalidad: out['modalidad'] || '100% Online',
    certificacion: out['certificación'] || out['certificacion'] || 'Nacional e Internacional',
  };
}

/**
 * descripcion: objetivos en oraciones + cola "Docente: X. Escuela Y — Convenio ...".
 * Se corta la cola y se parte en bullets por oracion.
 */
function parseObjetivos(descripcion: string | null): string[] {
  if (!descripcion) return [];
  let texto = descripcion;
  const corte = texto.search(/\s(?:Docente:|Escuela\s+de\b|Convenio\s+Academia)/);
  if (corte > 0) texto = texto.slice(0, corte);
  return texto
    .split(/(?<=\.)\s+(?=[A-ZÁÉÍÓÚÑ¿])/)
    .map(s => s.trim().replace(/\.$/, ''))
    .filter(s => s.length > 12);
}

/**
 * seccion_modalidad: primera linea el nombre, el resto la bio.
 * Algunas fichas traen la bio en lineas "· item" y otras en una sola linea con
 * los items separados por "·", asi que se normalizan los dos casos.
 */
function parseDocente(raw: string | null): { nombre: string; bio: string[] } | null {
  const lines = (raw || '').split('\n').map(l => l.trim()).filter(Boolean);
  if (!lines.length) return null;
  const bio = lines
    .slice(1)
    .flatMap(l => l.split('·'))
    .map(l => l.trim())
    .filter(Boolean);
  return { nombre: lines[0], bio };
}

/** plan_estudios: bloques "Módulo N: titulo" + lineas "• contenido" */
interface Modulo { etiqueta: string; titulo: string; items: string[]; destacado: boolean }

function parsePlan(plan: string | null): Modulo[] {
  const modulos: Modulo[] = [];
  for (const bloque of (plan || '').split(/\n\s*\n+/)) {
    const lines = bloque.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) continue;
    const cabecera = lines[0];
    const destacado = /^masterclass/i.test(cabecera);
    const m = cabecera.match(/^((?:Módulo|Modulo|Masterclass)\s*\d*)\s*[:.–-]?\s*(.*)$/i);
    modulos.push({
      etiqueta: m ? m[1].trim() : `Bloque ${modulos.length + 1}`,
      titulo: m ? m[2].trim() : cabecera,
      items: lines.slice(1).map(l => l.replace(/^[•·-]\s*/, '')),
      destacado,
    });
  }
  return modulos;
}

/** Iniciales del docente para el avatar */
function iniciales(nombre: string): string {
  return nombre
    .replace(/\b(Lic\.?|Dr\.?|Dra\.?|Mg\.?|Prof\.?|Cr\.?)\s*/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0])
    .join('')
    .toUpperCase();
}

// ── Isotipo de la academia (mismo path que el render de Remotion) ──
function Isotipo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 2094 1502" role="img" aria-label="Academia Identidad Argentina">
      <polygon fill={AZUL} points="8.78,1501.47 8.78,0 356.27,0 356.27,1501.47" />
      <path
        fill={AMARILLO}
        d="M409.76 1501.47l261.12 -585.82 346.86 0.25 -251.91 585.57 -356.07 0zm669.23 -1501.46l343.19 0 671.38 1501.46 -364.64 0c-51.85,-125.8 -656.89,-1469.04 -649.92,-1501.46zm-334.61 1179.72l92.23 -263.83 772.18 0 94.37 263.83 -958.79 0z"
      />
    </svg>
  );
}

/** Rotulo de seccion de un slide */
function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex-shrink-0 text-[0.55rem] font-black uppercase tracking-[0.16em]" style={{ color: AZUL }}>
      {children}
    </p>
  );
}

/**
 * Lista con vinetas que se recorta al alto disponible.
 *
 * Los slides no scrollean, asi que sobra contenido en pantallas bajas. En vez
 * de dejar que se corte a mitad de linea, se mide cuantos items entran y se
 * descartan los ultimos: el recorte cae siempre en items enteros.
 */
function ListaAjustada({ items, rotulo }: { items: string[]; rotulo?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tope, setTope] = useState(items.length);
  // Contador que fuerza un render: si solo reseteamos `tope` al valor que ya
  // tiene, React no vuelve a renderizar y la lista no se remide.
  const [, setPasada] = useState(0);
  // Los padres arman `items` en cada render, asi que las dependencias tienen
  // que mirar el contenido y no la identidad del array
  const clave = items.join('|');

  // Converge sacando un item por pasada hasta que la lista entra. Al correr en
  // useLayoutEffect el ajuste queda resuelto antes de pintar.
  // Se suma la altura de los items en vez de mirar scrollHeight: con
  // justify-center el sobrante se reparte arriba y abajo, y scrollHeight solo
  // refleja la mitad de abajo.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || tope <= 1) return;
    const gap = parseFloat(getComputedStyle(el).rowGap) || 0;
    const hijos = Array.from(el.children) as HTMLElement[];
    const alto = hijos.reduce((t, h) => t + h.offsetHeight, 0) + gap * Math.max(0, hijos.length - 1);
    if (alto > el.clientHeight + 1) setTope(t => t - 1);
  });

  // Vuelve a abrir la lista para recalcular: al cambiar el contenido, cuando
  // cambia el alto disponible y cuando terminan de cargar las fuentes (hasta
  // ese momento el texto ocupa menos y entrarian items de mas).
  const reabrir = useCallback(() => {
    setTope(items.length);
    setPasada(p => p + 1);
  }, [items.length]);

  useLayoutEffect(() => setTope(items.length), [clave, items.length]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    document.fonts?.ready.then(reabrir).catch(() => {});
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(reabrir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [reabrir]);

  const visibles = items.slice(0, tope);

  // El rotulo va adentro del area medida para que quede pegado a los items:
  // centrando la lista por separado se abria un hueco entre ambos.
  return (
    <div ref={ref} className="flex-1 min-h-0 overflow-hidden flex flex-col justify-center gap-2">
      {rotulo && <Rotulo>{rotulo}</Rotulo>}
      <ul className="flex flex-col gap-2.5">
        {visibles.map((texto, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[0.88rem] sm:text-[0.95rem] text-[#c3d8e6] leading-relaxed">
            <span className="mt-[0.5em] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: AMARILLO }} />
            <span>{texto}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Slide 1: portada ──
function SlidePortada({ carrera }: { carrera: Carrera }) {
  const { modalidad, certificacion } = parseEnfoque(carrera.enfoque);
  const objetivos = parseObjetivos(carrera.descripcion);
  const escuela = getEscuelaIA(carrera);
  const nombre = carrera.nombre_corto || carrera.nombre;
  const online = /100\s*%\s*online/i.test(modalidad);

  return (
    <div className="ia-slide h-full flex flex-col gap-3 p-5 sm:p-7 overflow-hidden">
      <div className="flex-shrink-0 flex gap-3">
        <div className="w-[3px] rounded-sm flex-shrink-0 self-stretch" style={{ background: AMARILLO }} />
        <div className="min-w-0">
          {carrera.prefix && (
            <p className="text-[0.6rem] sm:text-xs font-black uppercase tracking-[0.16em] mb-1" style={{ color: AMARILLO }}>
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

      <p className="flex-shrink-0 text-sm sm:text-base font-black uppercase tracking-wider text-white">
        {online ? '100% Online' : modalidad}
      </p>

      {objetivos.length > 0 && (
        <ListaAjustada items={objetivos} rotulo="Objetivos" />
      )}

      {/* Bloques de dato: el principal (escuela) va lleno en amarillo */}
      <div className="flex-shrink-0 grid grid-cols-2 sm:grid-cols-3 gap-2">
        <BloqueDato label="Escuela" valor={escuela || 'Convenio'} principal />
        <BloqueDato label="Duración" valor={carrera.duracion} />
        <BloqueDato label="Certificación" valor={certificacion} className="col-span-2 sm:col-span-1" />
      </div>
    </div>
  );
}

function BloqueDato({ label, valor, principal, className = '' }: { label: string; valor: string; principal?: boolean; className?: string }) {
  return (
    <div
      className={`rounded px-2.5 py-1.5 ${className}`}
      style={
        principal
          ? { background: 'rgba(241,207,28,0.94)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)' }
          : { background: 'rgba(255,255,255,0.075)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)' }
      }
    >
      <span
        className="block text-[0.5rem] font-black uppercase tracking-[0.14em]"
        style={{ color: principal ? 'rgba(16,24,32,0.7)' : '#7ecbe6' }}
      >
        {label}
      </span>
      <span
        className="block text-[0.78rem] sm:text-sm font-bold leading-tight mt-0.5"
        style={{ color: principal ? '#101820' : '#fff' }}
      >
        {valor}
      </span>
    </div>
  );
}

// ── Slide 2: docente y cursada ──
function SlideDocente({ carrera }: { carrera: Carrera }) {
  const docente = parseDocente(carrera.seccion_modalidad);
  const { cursada, modalidad, certificacion } = parseEnfoque(carrera.enfoque);

  return (
    <div className="ia-slide h-full flex flex-col gap-3 p-5 sm:p-7 overflow-hidden">
      <Rotulo>A cargo de</Rotulo>

      {docente && (
        <div className="flex-shrink-0 flex items-center gap-4">
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 text-lg sm:text-xl font-black text-white"
            style={{
              background: `linear-gradient(145deg, ${AZUL}, rgba(0,144,193,0.35))`,
              boxShadow: `inset 0 0 0 2px ${AMARILLO}`,
            }}
          >
            {iniciales(docente.nombre)}
          </div>
          <h3 className="text-xl sm:text-3xl font-black text-white uppercase leading-tight tracking-tight min-w-0">
            {docente.nombre}
          </h3>
        </div>
      )}

      {docente && docente.bio.length > 0 && <ListaAjustada items={docente.bio} />}

      <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
        <BloqueDato label="Cursada" valor={cursada} className="sm:col-span-3" />
        <BloqueDato label="Modalidad" valor={modalidad} />
        <BloqueDato label="Duración" valor={carrera.duracion} />
        <BloqueDato label="Certificación" valor={certificacion} />
      </div>
    </div>
  );
}

// ── Slide 3: plan de estudios ──
function SlidePlan({ carrera, modulos }: { carrera: Carrera; modulos: Modulo[] }) {
  // Se muestra un modulo por vez: asi cada vista entra sin scroll
  const [activo, setActivo] = useState(0);
  const modulo = modulos[activo];

  return (
    <div className="ia-slide h-full flex flex-col gap-3 p-4 sm:p-6 overflow-hidden">
      <div className="flex-shrink-0 flex items-baseline justify-between gap-3">
        <Rotulo>Plan de estudios</Rotulo>
        <span className="text-[0.5rem] font-black uppercase tracking-[0.14em] text-white/50">
          {modulos.length} módulos · {carrera.duracion}
        </span>
      </div>

      {/* Mobile: el programa completo, con scroll */}
      <div
        className="md:hidden flex-1 min-h-0 overflow-y-auto custom-scrollbar rounded-lg p-2.5 flex flex-col gap-2.5"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.035)' }}
      >
        {modulos.map((m, i) => (
          <ModuloDetalle key={i} modulo={m} enTarjeta />
        ))}
      </div>

      {/* Desktop: indice a la izquierda y un modulo por vez, sin scroll */}
      <div
        className="hidden md:flex flex-1 min-h-0 flex-row overflow-hidden rounded-lg"
        style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.035)' }}
      >
        <div
          className="flex-shrink-0 flex flex-col gap-1 p-1.5 overflow-y-auto w-[9.5rem] custom-scrollbar"
          style={{ background: 'rgba(0,0,0,0.22)' }}
        >
          {modulos.map((m, i) => (
            <BotonModulo
              key={i}
              activo={activo === i}
              destacado={m.destacado}
              onClick={() => setActivo(i)}
              texto={m.etiqueta}
            />
          ))}
        </div>

        {modulo && (
          <div
            className="flex-1 min-h-0 overflow-hidden p-4 flex flex-col justify-center"
            style={{ borderLeft: `3px solid ${modulo.destacado ? AMARILLO : AZUL}` }}
          >
            <ModuloDetalle modulo={modulo} />
          </div>
        )}
      </div>
    </div>
  );
}

/** Cabecera y contenidos de un modulo */
function ModuloDetalle({ modulo, enTarjeta }: { modulo: Modulo; enTarjeta?: boolean }) {
  return (
    <div
      className={enTarjeta ? 'flex-shrink-0 rounded p-3' : undefined}
      style={
        enTarjeta
          ? {
              background: 'rgba(255,255,255,0.05)',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
              borderLeft: `3px solid ${modulo.destacado ? AMARILLO : AZUL}`,
            }
          : undefined
      }
    >
      <p
        className="text-[0.5rem] font-black uppercase tracking-[0.16em]"
        style={{ color: modulo.destacado ? AMARILLO : '#7ecbe6' }}
      >
        {modulo.etiqueta}
      </p>
      {modulo.titulo && (
        <p className="text-[0.9rem] md:text-lg font-bold text-white leading-snug mt-0.5">{modulo.titulo}</p>
      )}
      {modulo.items.length > 0 && (
        <ul className="flex flex-col gap-1.5 mt-2 md:mt-3">
          {modulo.items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-[0.78rem] md:text-[0.92rem] text-[#a9c4d6] leading-snug">
              <span className="mt-[0.5em] w-1 h-1 rounded-full flex-shrink-0" style={{ background: AZUL }} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BotonModulo({ activo, destacado, onClick, texto }: { activo: boolean; destacado?: boolean; onClick: () => void; texto: string }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-2.5 py-2 rounded text-[0.55rem] font-black uppercase tracking-[0.08em] whitespace-nowrap md:whitespace-normal md:text-left transition-all cursor-pointer"
      style={
        activo
          ? {
              background: destacado ? AMARILLO : AZUL,
              color: destacado ? '#101820' : '#fff',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.22)',
            }
          : {
              background: 'rgba(255,255,255,0.05)',
              color: destacado ? AMARILLO : '#7ecbe6',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
            }
      }
    >
      {texto}
    </button>
  );
}

// ── Slide 4: cierre ──
function SlideCierre({ carrera }: { carrera: Carrera }) {
  const { cursada, modalidad, certificacion } = parseEnfoque(carrera.enfoque);
  const beneficios = [
    { titulo: 'Certificación', detalle: certificacion },
    { titulo: 'Modalidad', detalle: modalidad },
    { titulo: 'Cursada', detalle: cursada },
    { titulo: 'Duración', detalle: carrera.duracion },
  ];
  const waHref = `https://wa.me/5491166522722?text=${encodeURIComponent(
    `Hola, quiero consultar precios y fechas de ${carrera.nombre}`,
  )}`;

  return (
    <div className="ia-slide h-full flex flex-col gap-3 p-5 sm:p-7 overflow-hidden">
      <div className="flex-shrink-0">
        <h3 className="text-2xl sm:text-4xl font-black text-white uppercase leading-none tracking-tight">
          Estudiá con
          <span className="block" style={{ color: AMARILLO }}>
            certificación real
          </span>
        </h3>
        <p className="text-[#a9c4d6] text-[0.8rem] sm:text-sm mt-2 line-clamp-2">
          Diplomatura de convenio entre el CAU Villa Lugano y la Academia Identidad Argentina.
        </p>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 sm:grid-cols-2 gap-2 content-center overflow-hidden">
        {beneficios.map(b => (
          <div
            key={b.titulo}
            className="rounded p-3"
            style={{ background: 'rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}
          >
            <p className="text-[0.5rem] font-black uppercase tracking-[0.16em]" style={{ color: AZUL }}>
              {b.titulo}
            </p>
            <p className="text-[0.85rem] font-bold text-white leading-snug mt-0.5">{b.detalle}</p>
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 flex flex-wrap gap-2">
        <a
          href={waHref}
          target="_blank"
          rel="noopener nofollow"
          className="flex-1 min-w-[10rem] flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#25d366] text-white font-bold text-sm hover:brightness-110 transition-all"
        >
          Consultar precios
        </a>
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
      <p className="flex-shrink-0 text-center text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white/45">
        identidadargentina.com.ar
      </p>
    </div>
  );
}

// ── Modal ──
export default function IAModal({ carrera, onClose }: Props) {
  const modulos = useMemo(() => parsePlan(carrera.plan_estudios), [carrera.plan_estudios]);
  const docente = useMemo(() => parseDocente(carrera.seccion_modalidad), [carrera.seccion_modalidad]);

  const slides = useMemo(() => {
    const s: { key: string; node: React.ReactNode }[] = [
      { key: 'portada', node: <SlidePortada carrera={carrera} /> },
    ];
    if (docente) s.push({ key: 'docente', node: <SlideDocente carrera={carrera} /> });
    if (modulos.length) s.push({ key: 'plan', node: <SlidePlan carrera={carrera} modulos={modulos} /> });
    s.push({ key: 'cierre', node: <SlideCierre carrera={carrera} /> });
    return s;
  }, [carrera, docente, modulos]);

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
        style={{ background: 'rgba(5,15,25,0.85)' }}
        onClick={handleClose}
      />

      <div
        className="relative z-10 rounded-2xl w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl md:w-[min(64rem,75vw)]
          h-[88dvh] sm:h-[92vh] max-h-[88dvh] sm:max-h-[92vh] overflow-hidden flex flex-col"
        style={{
          background: '#101820',
          border: `2px solid ${AZUL}`,
          boxShadow: '0 0 50px rgba(0,144,193,0.3)',
        }}
      >
        {/* Encabezado: la marca del convenio vive aca, no en cada slide */}
        <div className="ia-modal-header flex-shrink-0 px-4 py-2.5 sm:px-6 sm:py-3 border-b" style={{ background: '#0a1219', borderColor: 'rgba(0,144,193,0.35)' }}>
          <div className="relative flex justify-between items-center gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Isotipo className="h-6 sm:h-8 w-auto flex-shrink-0" />
              <p className="text-[0.5rem] sm:text-[0.6rem] font-black uppercase tracking-[0.18em] text-white/70 leading-tight flex-shrink-0">
                Academia
                <span className="block text-white">Identidad Argentina</span>
              </p>
              {idx > 0 && (
                <>
                  <span className="hidden sm:block w-px h-7 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }} />
                  <h3 className="hidden sm:block text-sm md:text-base font-black text-white uppercase tracking-tight leading-tight truncate min-w-0">
                    {nombre}
                  </h3>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                ref={closeBtnRef}
                onClick={handleClose}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-red-600/20 text-red-500 hover:bg-red-600/40 hover:text-red-400 transition-colors"
                aria-label="Cerrar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
        <div className="flex-shrink-0 flex justify-between items-center px-2 py-2.5 sm:px-6 sm:py-3 border-t" style={{ background: '#0a1219', borderColor: 'rgba(0,144,193,0.25)' }}>
          <button
            onClick={() => setIdx(i => Math.max(0, i - 1))}
            disabled={idx === 0}
            aria-label="Slide anterior"
            className="flex items-center gap-1 sm:gap-2 text-[0.6rem] sm:text-sm font-bold uppercase tracking-wider px-2 py-1.5 sm:px-4 sm:py-2 rounded transition-all disabled:opacity-30 disabled:pointer-events-none"
            style={{ color: '#7ecbe6', boxShadow: 'inset 0 0 0 1px rgba(0,144,193,0.45)' }}
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
                  background: idx === i ? AMARILLO : 'rgba(255,255,255,0.25)',
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
            className="flex items-center gap-1 sm:gap-2 text-white text-[0.6rem] sm:text-sm font-bold uppercase tracking-wider px-2 py-1.5 sm:px-4 sm:py-2 rounded transition-all disabled:opacity-30 disabled:pointer-events-none hover:brightness-110"
            style={{ background: AZUL, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)' }}
          >
            <span className="hidden min-[360px]:inline">Siguiente</span>
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Pie */}
        <div className="flex-shrink-0 p-3 border-t flex flex-wrap gap-2 items-center" style={{ background: '#0a1219', borderColor: 'rgba(0,144,193,0.35)' }}>
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
              className="w-36 flex items-center justify-center gap-2 py-2 text-white font-bold rounded-lg hover:brightness-110 transition-colors text-sm whitespace-nowrap"
              style={{ background: AZUL }}
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
              style={{ background: '#16242e', border: '1px solid rgba(0,144,193,0.35)', color: '#6b9fc0' }}
            />
            <button
              onClick={() => navigator.clipboard?.writeText(shareUrl)}
              title="Compartir enlace"
              className="w-36 flex-shrink-0 flex items-center justify-center gap-1.5 py-2 font-bold rounded-lg hover:brightness-110 transition-colors text-sm"
              style={{ background: 'transparent', border: `1px solid ${AZUL}`, color: '#7ecbe6' }}
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
