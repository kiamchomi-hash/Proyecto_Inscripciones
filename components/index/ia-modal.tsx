'use client';

import ModalShell from './modal-shell';
import { useFocoModal } from './use-foco-modal';
// Modal de las diplomaturas de Academia Identidad Argentina.
// Mismo formato de slides que los modales de Siglo 21 (carousel-modal), pero con
// el lenguaje visual de la Academia: fondo tinta #101820 con lavados
// ambientales amarillo/azul, trama fina, tipografia pesada en mayusculas y el
// isotipo de la academia. Referencias: identidadargentina.com.ar y el render de
// Remotion histórico de diplomaturas (no es necesario para ejecutar el sitio).

import { useEffect, useRef, useState, useMemo } from 'react';
import { type Carrera, carreraToSlug } from './types';
import { getEscuelaIA } from './identidad-argentina';
import Isotipo from './ia-isotipo';
import { mensajeWhatsAppInfo, mensajeWhatsAppPrecios } from '@/components/carreras/career-content';
import { useCompartir, textoCompartir } from './use-compartir';
import AvisoCompartir from './aviso-compartir';
import IconoCompartir from './icono-compartir';
import { pedirCarreraEnFormulario } from '@/components/formularios/elegir-carrera';
import { NUMERO_TECLAB_IDENTIDAD } from '@/lib/whatsapp';

interface Props {
  carrera: Carrera;
  onClose: () => void;
}

const AZUL = '#0090c1';
const AMARILLO = '#f1cf1c';
// El azul de marca sobre el fondo tinta queda muy apagado en textos chicos, asi
// que los rotulos usan esta version aclarada.
const AZUL_CLARO = '#7ecbe6';

// ── Parsers de los campos que llegan de D1 ──

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

/** Rotulo de seccion de un slide */
function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex-shrink-0 text-3xs font-black uppercase tracking-etiqueta-ancha" style={{ color: AZUL_CLARO }}>
      {children}
    </p>
  );
}

// ── Slide 1: portada ──
function SlidePortada({ carrera }: { carrera: Carrera }) {
  const { cursada, modalidad, certificacion } = parseEnfoque(carrera.enfoque);
  const objetivos = parseObjetivos(carrera.descripcion);
  const escuela = getEscuelaIA(carrera);
  const nombre = carrera.nombre_corto || carrera.nombre;
  const online = /100\s*%\s*online/i.test(modalidad);

  // overflow-x-hidden: el isotipo de fondo se sale por la derecha y sin recorte
  // aparece una barra de scroll horizontal al pie del slide.
  return (
    <div data-scroll-lectura className="ia-slide relative h-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      {/* El isotipo grande y apagado, como en el cierre: da fondo sin tapar
          nada. En mobile no entra, igual que antes. */}
      <Isotipo className="ia-portada-isotipo" />

      <div className="ia-portada relative min-h-full flex flex-col gap-4 p-5 sm:p-8">
        <div className="flex-shrink-0 flex gap-3">
          <div className="w-[3px] rounded-sm flex-shrink-0 self-stretch" style={{ background: AMARILLO }} />
          <div className="min-w-0">
            {carrera.prefix && (
              <p className="text-3xs sm:text-xs font-black uppercase tracking-etiqueta-ancha mb-1" style={{ color: AMARILLO }}>
                {carrera.prefix}
              </p>
            )}
            <h2
              className={`font-black text-white uppercase leading-[1.03] tracking-tight ${
                nombre.length > 38 ? 'text-xl sm:text-3xl' : 'text-2xl sm:text-4xl'
              }`}
            >
              {nombre}
            </h2>
          </div>
        </div>

        <p className="flex-shrink-0 text-sm sm:text-base font-black uppercase tracking-wider text-white">
          {online ? '100% Online' : modalidad}
        </p>

        {cursada && <p className="ia-portada-cursada flex-shrink-0">{cursada}</p>}

        {objetivos.length > 0 && (
          <div className="flex-shrink-0">
            <Rotulo>Objetivos</Rotulo>
            <ul className="ia-portada-objetivos mt-2">
              {objetivos.map((texto, i) => (
                <li key={i}>{texto}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Los tres datos cierran el slide en una sola fila con filete arriba.
            Antes cada uno era una caja -la de la escuela, llena de amarillo- y
            competian con el titulo: eran lo mas fuerte de la pantalla para decir
            lo menos importante. */}
        <dl className="ia-portada-datos">
          <div>
            <dt>Escuela</dt>
            <dd>{escuela || 'Academia'}</dd>
          </div>
          <div>
            <dt>Duración</dt>
            <dd>{carrera.duracion}</dd>
          </div>
          <div>
            <dt>Certificación</dt>
            <dd>{certificacion}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

// ── Slide 3: plan de estudios ──
// Una sola superficie de lectura: indice a la izquierda -sin cajas, con el
// activo marcado por un filo azul- y el contenido a la derecha, separados por
// un filete. En el telefono scrollea el slide entero y los modulos se separan
// con filetes: antes eran tarjetas dentro de otra tarjeta con scroll propio.
function SlidePlan({ carrera, modulos }: { carrera: Carrera; modulos: Modulo[] }) {
  // -1 = programa completo, >= 0 = un modulo
  const [activo, setActivo] = useState(-1);
  const visibles = activo === -1 ? modulos : [modulos[activo]];
  const titulo = activo === -1 ? 'Programa completo' : modulos[activo]?.etiqueta;

  return (
    <div data-scroll-lectura className="ia-slide ia-plan-slide h-full overflow-y-auto custom-scrollbar p-4 sm:p-6">
      <div className="flex-shrink-0 flex items-baseline justify-between gap-3">
        <Rotulo>Plan de estudios</Rotulo>
        <span className="text-5xs font-black uppercase tracking-etiqueta text-white/50">
          {modulos.length} módulos · {carrera.duracion}
        </span>
      </div>

      {/* Mobile: el programa completo, con el scroll del propio slide */}
      <div className="md:hidden mt-4 flex flex-col gap-4">
        {modulos.map((m, i) => (
          <ModuloDetalle key={i} modulo={m} />
        ))}
      </div>

      {/* Desktop: indice a la izquierda, contenido a la derecha */}
      <div className="hidden md:flex ia-plan">
        <nav className="ia-plan-indice" aria-label="Módulos del plan">
          <BotonModulo activo={activo === -1} onClick={() => setActivo(-1)} texto="Programa completo" />
          {modulos.map((m, i) => (
            <BotonModulo
              key={i}
              activo={activo === i}
              destacado={m.destacado}
              onClick={() => setActivo(i)}
              texto={m.etiqueta}
            />
          ))}
        </nav>

        <div data-scroll-lectura className="ia-plan-detalle custom-scrollbar">
          <p className="ia-plan-titulo">{titulo}</p>
          {visibles.map((m, i) => m && <ModuloDetalle key={i} modulo={m} />)}
        </div>
      </div>
    </div>
  );
}

/** Cabecera y contenidos de un modulo */
function ModuloDetalle({ modulo }: { modulo: Modulo }) {
  return (
    <div className="ia-modulo">
      <p className="ia-modulo-etiqueta" style={modulo.destacado ? { color: AMARILLO } : undefined}>
        {modulo.etiqueta}
      </p>
      {modulo.titulo && <p className="ia-modulo-titulo">{modulo.titulo}</p>}
      {modulo.items.length > 0 && (
        <ul className="ia-modulo-items">
          {modulo.items.map((item, j) => (
            <li key={j}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BotonModulo({ activo, destacado, onClick, texto }: { activo: boolean; destacado?: boolean; onClick: () => void; texto: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={activo ? 'true' : undefined}
      className={`ia-plan-boton${activo ? ' is-activo' : ''}${destacado ? ' is-destacado' : ''}`}
    >
      {texto}
    </button>
  );
}

// ── Slide 4: cierre ──
// Mismo armado que el cierre de Teclab: los datos como chips en vez de cuatro
// cintas rotuladas, todo el contenido en un solo bloque centrado en el alto, y
// el aire sobrante ocupado por la marca -alla la foto de la ficha, aca el
// isotipo de la Academia, que es lo unico que hay-.
function SlideCierre({ carrera, onInscribir }: { carrera: Carrera; onInscribir: () => void }) {
  const { modalidad, certificacion } = parseEnfoque(carrera.enfoque);
  // La cursada no entra: es una frase, no un dato de dos palabras. Queda en la
  // portada.
  // El chip no lleva rotulo como el cuadro de la portada, asi que "Nacional e
  // Internacional" a secas no decia de que hablaba: va con la palabra adelante.
  const chipCertificacion =
    certificacion && (/^certificaci[oó]n/i.test(certificacion) ? certificacion : `Certificación ${certificacion}`);
  const chips = [modalidad, carrera.duracion, chipCertificacion].filter(Boolean);
  const waHref = `https://wa.me/${NUMERO_TECLAB_IDENTIDAD}?text=${encodeURIComponent(mensajeWhatsAppPrecios(carrera))}`;

  return (
    <div data-scroll-lectura className="ia-slide ia-cierre relative h-full flex flex-col gap-3 p-5 sm:p-7 overflow-y-auto overflow-x-hidden custom-scrollbar">
      {/* El isotipo, grande y apagado, ocupando el alto que sobra */}
      <Isotipo className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[24rem] sm:w-[34rem] max-w-[135%] opacity-[0.09]" />

      {/* Sin repetir la bajada institucional: lo dice la placa
          de los slides de adentro, y era el texto mas largo del slide. */}
      <div className="relative flex-shrink-0 flex flex-col gap-2.5">
        {/* Centrado tambien en desktop, como el cierre de Teclab: alineado a la
            izquierda quedaba desbalanceado contra el isotipo, que va al medio. */}
        <h3 className="text-[2.2rem] min-[380px]:text-[2.6rem] sm:text-4xl font-black text-white uppercase leading-[0.95] tracking-tight text-center">
          Estudiá con
          <span className="block" style={{ color: AMARILLO }}>
            nosotros
          </span>
        </h3>

        <div className="flex flex-wrap justify-center gap-1.5">
          {chips.map(c => (
            <span key={c} className="ia-cierre-chip">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Pegado al titulo. En el telefono los botones van en columna, a todo el
          ancho y mas altos: a media pantalla cada uno quedaban chicos.
          Sin el enlace a identidadargentina.com.ar que iba al pie: el contacto
          pasa por WhatsApp o por el formulario del CAU, no por el sitio del
          Centro Educativo. Al lado va la inscripción, donde antes estaba la
          dirección de la sede: se sacó como en Teclab, porque se cursa a
          distancia y una dirección se lee como un requisito de asistencia. */}
      <div className="relative flex-shrink-0 flex flex-col gap-2.5">
        <div className="flex flex-col sm:flex-row gap-2">
          <a
            href={waHref}
            target="_blank"
            rel="noopener nofollow"
            className="flex-1 min-w-[10rem] flex items-center justify-center gap-2 py-3 sm:py-2.5 rounded-lg bg-[#25d366] text-white font-bold text-[0.95rem] sm:text-sm hover:brightness-110 transition-all"
          >
            Consultar precios
          </a>
          <a
            href="#preinscripcion"
            onClick={e => { e.preventDefault(); onInscribir(); }}
            className="flex-1 min-w-[10rem] flex items-center justify-center gap-2 py-3 sm:py-2.5 rounded-lg text-white font-bold text-[0.95rem] sm:text-sm hover:brightness-110 transition-all"
            style={{ background: AZUL }}
          >
            Inscribite ya
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Modal ──
export default function IAModal({ carrera, onClose }: Props) {
  const modulos = useMemo(() => parsePlan(carrera.plan_estudios), [carrera.plan_estudios]);

  // El slide de cierre se arma antes que handleClose: llama por ref a la
  // inscripción, que se completa en el efecto de abajo.
  const inscribirRef = useRef(() => {});
  const slides = useMemo(() => {
    const s: { key: string; node: React.ReactNode }[] = [
      { key: 'portada', node: <SlidePortada carrera={carrera} /> },
    ];
    if (modulos.length) s.push({ key: 'plan', node: <SlidePlan carrera={carrera} modulos={modulos} /> });
    s.push({ key: 'cierre', node: <SlideCierre carrera={carrera} onInscribir={() => inscribirRef.current()} /> });
    return s;
  }, [carrera, modulos]);

  const [idx, setIdx] = useState(0);
  const { dialogRef, closeBtnRef, abierto, cerrar: handleClose } = useFocoModal({ onClose });
  const nombre = carrera.nombre_corto || carrera.nombre;

  useEffect(() => {
    inscribirRef.current = () => {
      // La carrera viaja con el clic: abajo el formulario la elige sola.
      pedirCarreraEnFormulario(carrera.id);
      handleClose();
      setTimeout(() => {
        document.getElementById('preinscripcion')?.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    };
  }, [carrera.id, handleClose]);

  // Escape y Tab los maneja useFocoModal; las flechas pasan de slide.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setIdx(i => Math.min(slides.length - 1, i + 1));
        return;
      }
      if (e.key === 'ArrowLeft') {
        setIdx(i => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [slides.length]);

  const waHref = `https://wa.me/${NUMERO_TECLAB_IDENTIDAD}?text=${encodeURIComponent(mensajeWhatsAppInfo(carrera))}`;
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/carreras/${carreraToSlug(carrera)}` : '';
  const { compartir, estado: estadoCompartir } = useCompartir(shareUrl, carrera.nombre);

  return (
    <ModalShell
      dialogRef={dialogRef}
      abierto={abierto}
      onCerrar={handleClose}
      aria-label={`Detalles de ${carrera.nombre}`}
      colorVelo="rgba(5,15,25,0.85)"
      className="ia-modal"
      style={{
        background: '#101820',
        border: `2px solid ${AZUL}`,
        boxShadow: '0 0 50px rgba(0,144,193,0.3)',
      }}
    >
        {/* Encabezado: la marca de la Academia vive aca, no en cada slide */}
        <div className="ia-modal-header flex-shrink-0 px-4 py-2.5 sm:px-6 sm:py-3 border-b" style={{ background: '#0a1219', borderColor: 'rgba(0,144,193,0.35)' }}>
          <div className="relative flex justify-between items-center gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Isotipo className="h-6 sm:h-8 w-auto flex-shrink-0" />
              <p className="text-5xs sm:text-3xs font-black uppercase tracking-[0.18em] text-white/70 leading-tight flex-shrink-0">
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
            className="flex items-center gap-1 sm:gap-2 text-3xs sm:text-sm font-bold uppercase tracking-wider px-2 py-1.5 sm:px-4 sm:py-2 rounded transition-all disabled:opacity-30 disabled:pointer-events-none"
            style={{ color: AZUL_CLARO, boxShadow: 'inset 0 0 0 1px rgba(0,144,193,0.45)' }}
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
          {/* Navegar entre slides no compite con inscribirse: el relleno del
              azul queda para "Inscribite ya", el unico CTA del modal. */}
          <button
            onClick={() => setIdx(i => Math.min(slides.length - 1, i + 1))}
            disabled={idx === slides.length - 1}
            aria-label="Slide siguiente"
            className="flex items-center gap-1 sm:gap-2 text-white text-3xs sm:text-sm font-bold uppercase tracking-wider px-2 py-1.5 sm:px-4 sm:py-2 rounded transition-all disabled:opacity-30 disabled:pointer-events-none hover:bg-[#00648a]"
            style={{ background: '#1b2a36', boxShadow: 'inset 0 0 0 1px rgba(0,144,193,0.5)' }}
          >
            <span className="hidden min-[360px]:inline">Siguiente</span>
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Pie: una sola fila. Se fue el campo con la URL -ocupaba un renglon
            entero en el telefono y repetia lo que hace "Compartir"- y los dos
            botones quedaron como en el cierre: WhatsApp con borde verde, la
            inscripcion llena en azul. */}
        <div className="ia-modal-pie">
          <button
            type="button"
            onClick={compartir}
            title="Compartir enlace"
            aria-label="Compartir enlace"
            className="ia-pie-compartir"
          >
            <IconoCompartir estado={estadoCompartir} />
            <span className="hidden sm:inline">{textoCompartir(estadoCompartir)}</span>
          </button>
          <AvisoCompartir estado={estadoCompartir} />
          <a
            href={waHref}
            target="_blank"
            rel="noopener nofollow"
            className="ia-pie-wa"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
          <a
            href="#preinscripcion"
            onClick={e => {
              e.preventDefault();
              // La carrera viaja con el clic: abajo el formulario la elige
              // sola, en vez de dejar al lead buscando lo que ya eligio.
              pedirCarreraEnFormulario(carrera.id);
              handleClose();
              setTimeout(() => {
                document.getElementById('preinscripcion')?.scrollIntoView({ behavior: 'smooth' });
              }, 350);
            }}
            className="ia-pie-cta"
          >
            Inscribite ya
          </a>
        </div>
    </ModalShell>
  );
}
