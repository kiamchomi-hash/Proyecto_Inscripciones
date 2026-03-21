'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Turnstile } from 'react-turnstile';
import { supabase } from '@/lib/supabase';

export interface CalendarWeek {
  label: string;
  month: string;
  days: { num: string; past: boolean }[];
}

export interface MateriaDB {
  id: string;
  slug: string;
  label: string;
  nombre_profesor: string;
  whatsapp: string;
  telefono_display: string;
  descripcion: string[];
  imagenes: string[];
  en_construccion: boolean;
  orden: number;
  modo_manana: boolean;
}

/* ── WhatsApp SVG ── */
function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/* ── Construction Banner ── */
function ConstructionBanner() {
  return (
    <div className="ca-construction flex flex-col items-center justify-center h-full p-5 text-center" style={{ background: 'rgba(0,0,0,0.1)' }}>
      <svg className="ca-construction-icon mb-4" width="80" height="80" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L1 21h22L12 2zm0 3.45L20.14 19H3.86L12 5.45zM11 16h2v2h-2v-2zm0-7h2v5h-2V9z" />
      </svg>
      <div className="text-2xl font-extrabold uppercase tracking-widest mb-2">Sección en Construcción</div>
      <div className="text-sm mt-2" style={{ color: 'var(--ca-text-muted)' }}>
        Estamos trabajando intensamente en esta sección para brindarte el mejor contenido.<br />¡Vuelve pronto!
      </div>
    </div>
  );
}

/* ── Carousel ── */
function Carousel({ images }: { images: string[] }) {
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

/* ── Description Panel ── */
function DescriptionPanel({ desc }: { desc: string[] }) {
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--ca-bg-temas)' }}>
      <div className="flex-1 flex flex-col rounded-xl m-[1.5vh_20px] p-[1vh_25px]" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,199,177,0.1)' }}>
        <ul className="list-none flex flex-col h-full justify-evenly">
          {desc.map((item, i) => (
            <li key={i} className="ca-desc-item" dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Monthly Calendar ── */
function MonthlyCalendar({ selectedDays, onToggleDay, locked }: { selectedDays: Set<string>; onToggleDay: (key: string, dayInfo: { num: string; month: string; past: boolean }) => void; locked?: boolean }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const todayStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  const monthName = new Date(viewYear, viewMonth).toLocaleString('es-ES', { month: 'long' });

  // Build weeks grid for the month (only weekdays Mon-Fri)
  const weeks = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const result: { num: number; key: string; past: boolean; empty: boolean }[][] = [];
    let currentWeek: { num: number; key: string; past: boolean; empty: boolean }[] = [];

    // Fill empty slots before the first weekday
    const firstDow = firstDay.getDay(); // 0=Sun
    // Convert to Mon=0..Fri=4, Sat/Sun=-1
    const moStart = firstDow === 0 ? -1 : firstDow - 1;
    if (moStart > 0 && moStart <= 4) {
      for (let i = 0; i < moStart; i++) {
        currentWeek.push({ num: 0, key: '', past: true, empty: true });
      }
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(viewYear, viewMonth, d);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue; // Skip weekends

      const isPast = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const key = `${viewYear}-${viewMonth}-${d}`;
      currentWeek.push({ num: d, key, past: isPast, empty: false });

      if (dow === 5) { // Friday = end of week
        result.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 5) {
        currentWeek.push({ num: 0, key: '', past: true, empty: true });
      }
      result.push(currentWeek);
    }
    return result;
  }, [viewYear, viewMonth, now.getFullYear(), now.getMonth(), now.getDate()]);

  const canGoPrev = viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth > now.getMonth());

  const goNext = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const goPrev = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  return (
    <div className="flex flex-col items-center h-full min-h-0 w-full p-[8px_15px] overflow-hidden">
      {/* Day headers */}
      <div className="ca-cal-box flex-1" style={locked ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
        {/* Month navigation — inside ca-cal-box to align with grid */}
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-20"
            style={{ background: 'rgba(0,199,177,0.15)', color: 'var(--ca-teal)' }}
            aria-label="Mes anterior"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-extrabold uppercase tracking-wider capitalize" style={{ color: 'var(--ca-teal)' }}>
            {monthName} {viewYear}
          </span>
          <button
            onClick={goNext}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(0,199,177,0.15)', color: 'var(--ca-teal)' }}
            aria-label="Mes siguiente"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <header className="ca-cal-header">
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi'].map(d => (
            <div key={d} className="text-center py-1.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--ca-teal)' }}>{d}</div>
          ))}
        </header>

        <div className="flex-1 flex flex-col">
          {weeks.map((week, wi) => (
            <div key={wi} className="ca-day-grid">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`ca-day ${day.empty ? 'empty' : ''} ${day.past && !day.empty ? 'past' : ''} ${selectedDays.has(day.key) ? 'selected' : ''} ${day.key === todayStr ? 'today' : ''}`}
                  onClick={() => !day.past && !day.empty && !locked && onToggleDay(day.key, { num: day.num.toString().padStart(2, '0'), month: monthName, past: day.past })}
                >
                  {day.empty ? '' : day.num}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Schedule Panel ── */
function buildHours(modoManana: boolean) {
  const start = modoManana ? 8 : 14;
  const end = 20;
  return Array.from({ length: end - start }, (_, i) => {
    const h = start + i;
    return { from: `${h}:00`, to: `${h + 1}:00` };
  });
}

type ScheduleMode = 'picking' | 'choose-mode' | 'per-day' | 'confirm' | 'done';

function HourPills({ hours, selected, onToggle, disabled, cols }: {
  hours: { from: string; to: string }[];
  selected: Set<number>;
  onToggle: (i: number) => void;
  disabled: boolean;
  cols: string;
}) {
  return (
    <div className={`grid gap-1.5 ${cols}`}>
      {hours.map((slot, i) => (
        <button
          key={slot.from}
          disabled={disabled}
          onClick={() => onToggle(i)}
          className="flex items-center justify-center rounded-full text-[0.62rem] font-bold tabular-nums py-1 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: selected.has(i) ? 'var(--ca-teal)' : 'rgba(0,199,177,0.1)',
            border: selected.has(i) ? '1px solid var(--ca-teal)' : '1px solid rgba(0,199,177,0.25)',
            color: selected.has(i) ? 'var(--ca-selected-text)' : 'var(--ca-text-main)',
          }}
        >
          {slot.from}–{slot.to}
        </button>
      ))}
    </div>
  );
}

interface DayInfo { num: string; month: string }

function formatDay(d: DayInfo) { return `${d.num} de ${d.month}`; }

function SchedulePanel({ modoManana, materiaId, materiaSlug, selectedDays, onDone, onReset, onInteract, onLockCalendar }: { modoManana: boolean; materiaId: string; materiaSlug: string; selectedDays: DayInfo[]; onDone: () => void; onReset: () => void; onInteract?: () => void; onLockCalendar?: (locked: boolean) => void }) {
  const [mode, _setMode] = useState<ScheduleMode>('picking');
  const setMode = (m: ScheduleMode) => {
    _setMode(m);
    onLockCalendar?.(m !== 'picking');
  };
  const [error, setError] = useState<string | null>(null);
  const [selectedHours, setSelectedHours] = useState<Set<number>>(new Set());
  const [perDayHours, setPerDayHours] = useState<Record<string, Set<number>>>({});
  const [perDayIdx, setPerDayIdx] = useState(0);
  const [submittedDays, setSubmittedDays] = useState<DayInfo[]>([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [bloqueoSemanal, setBloqueoSemanal] = useState(false);
  const [showInputError, setShowInputError] = useState(false);
  const hours = buildHours(modoManana);
  const cols = modoManana ? 'grid-cols-4' : 'grid-cols-3';
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [confirmAction, setConfirmAction] = useState<'same' | 'perday'>('same');
  const pendingSubmitRef = useRef<'same' | 'perday' | null>(null);
  const soloDigitos = telefono.replace(/[\s\-\+]/g, '');
  const telefonoValido = soloDigitos.length >= 8 && /^\d+$/.test(soloDigitos.slice(-8));
  const datosCompletos = telefonoValido;

  const toggleHour = (i: number) => {
    setSelectedHours(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
    onInteract?.();
  };

  const togglePerDayHour = (day: string, i: number) => {
    setPerDayHours(prev => {
      const daySet = new Set(prev[day] || []);
      if (daySet.has(i)) daySet.delete(i); else daySet.add(i);
      return { ...prev, [day]: daySet };
    });
    onInteract?.();
  };

  const handleChooseSame = async () => {
    setError(null);
    const horarios = Array.from(selectedHours).sort((a, b) => a - b).map(i => `${hours[i].from}-${hours[i].to}`);
    const dias = selectedDays.map(d => d.num);
    const { error: e } = await supabase.from('solicitudes_clase').insert({
      materia_id: materiaId, dias, horarios, nombre: nombre.trim() || null, telefono: telefono.trim(), bloqueo_semanal: bloqueoSemanal,
    });
    if (e) setError('Error al enviar. Intente más tarde.');
    else { setSubmittedDays([...selectedDays]); setMode('done'); onDone(); }
  };

  const handleChoosePerDay = () => {
    const initial: Record<string, Set<number>> = {};
    selectedDays.forEach(d => { initial[d.num] = new Set(selectedHours); });
    setPerDayHours(initial);
    setPerDayIdx(0);
    setMode('per-day');
  };

  const handleSubmitPerDay = async () => {
    setError(null);
    const rows = selectedDays.map(day => ({
      materia_id: materiaId,
      dias: [day.num],
      horarios: Array.from(perDayHours[day.num] || []).sort((a, b) => a - b).map(i => `${hours[i].from}-${hours[i].to}`),
      nombre: nombre.trim() || null,
      telefono: telefono.trim(),
      bloqueo_semanal: bloqueoSemanal,
    })).filter(r => r.horarios.length > 0);

    if (rows.length === 0) { setError('Seleccioná al menos un horario por día.'); return; }

    const { error: e } = await supabase.from('solicitudes_clase').insert(rows);
    if (e) setError('Error al enviar. Intente más tarde.');
    else { setSubmittedDays(rows.map(r => selectedDays.find(d => d.num === r.dias[0])!)); setMode('done'); onDone(); }
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    const action = pendingSubmitRef.current;
    if (action === 'same') handleChooseSame();
    else if (action === 'perday') handleSubmitPerDay();
    pendingSubmitRef.current = null;
  };

  const requestSubmit = (action: 'same' | 'perday') => {
    if (turnstileToken) {
      if (action === 'same') handleChooseSame();
      else handleSubmitPerDay();
    } else {
      pendingSubmitRef.current = action;
      setShowTurnstile(true);
    }
  };

  const canProceed = selectedHours.size > 0 && selectedDays.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden" style={{ borderLeft: '1px solid rgba(0,199,177,0.1)' }}>
      {/* Título fijo arriba */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-3 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.18)', borderBottom: '1px solid var(--ca-border-light)' }}>
        <h3 className="text-sm font-extrabold whitespace-nowrap px-4 py-1.5 rounded-full text-white" style={{ background: 'rgba(0,85,135,0.15)', border: '1px solid rgba(0,85,135,0.4)' }}>Clases de Lunes a Viernes</h3>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(0,199,177,0.4), transparent)' }} />
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 flex flex-col justify-evenly items-stretch min-h-0 overflow-y-auto ca-schedule-scroll">

      {selectedDays.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-3">
          <div className="flex flex-col items-center justify-center gap-3 w-full py-6 rounded-xl" style={{ border: '2px dashed rgba(0,199,177,0.25)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--ca-text-muted)', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[0.72rem] font-semibold text-center" style={{ color: 'var(--ca-text-muted)' }}>
              Seleccioná uno o varios días<br />para empezar
            </span>
          </div>
        </div>
      ) : (
      <>
      {/* Hora pills principales — ocultas en per-day, confirm y done */}
      {mode !== 'per-day' && mode !== 'done' && mode !== 'confirm' && (
      <div className={`grid gap-2 px-3 my-2 ${cols}`}>
        {hours.map((slot, i) => (
          <button
            key={slot.from}
            onClick={() => { toggleHour(i); if (mode === 'choose-mode') setMode('picking'); }}
            className="flex items-center justify-center rounded-full text-[0.68rem] font-bold tabular-nums py-1.5 transition-colors cursor-pointer"
            style={{
              background: selectedHours.has(i) ? 'var(--ca-teal)' : 'rgba(0,199,177,0.1)',
              border: selectedHours.has(i) ? '1px solid var(--ca-teal)' : '1px solid rgba(0,199,177,0.25)',
              color: selectedHours.has(i) ? 'var(--ca-selected-text)' : 'var(--ca-text-main)',
            }}
          >
            {slot.from}–{slot.to}
          </button>
        ))}
      </div>
      )}

      {/* Zona inferior — cambia según el modo */}
      <div className="px-3 pb-3 flex flex-col gap-2 ca-schedule-transition">
        {mode === 'done' ? (
          <div className="ca-slide-in flex flex-col items-center gap-2 py-3 rounded-lg" style={{ background: 'rgba(0,199,177,0.12)' }}>
            <div className="flex items-center gap-2 text-[0.75rem] font-bold" style={{ color: 'var(--ca-teal)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Solicitud realizada con éxito
            </div>
            <span className="text-[0.62rem] capitalize" style={{ color: 'var(--ca-text-muted)' }}>
              {submittedDays.length === 1
                ? `Día solicitado: ${formatDay(submittedDays[0])}`
                : `Días solicitados: ${submittedDays.map(formatDay).join(', ')}`}
            </span>
            <button
              onClick={() => { setMode('picking'); setSelectedHours(new Set()); setPerDayHours({}); setSubmittedDays([]); setTurnstileToken(''); setShowTurnstile(false); setBloqueoSemanal(false); onReset(); }}
              className="mt-1 px-4 py-1.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider transition-all hover:brightness-125"
              style={{ background: 'rgba(0,199,177,0.1)', border: '1px solid rgba(0,199,177,0.3)', color: 'var(--ca-teal)' }}
            >
              Nueva solicitud
            </button>
          </div>
        ) : mode === 'picking' ? (
          <>
            <button
              disabled={selectedHours.size === 0}
              onClick={() => {
                onInteract?.();
                if (selectedDays.length > 1) { setMode('choose-mode'); } else { setConfirmAction('same'); setMode('confirm'); }
              }}
              className="w-full py-2 rounded-lg text-[0.75rem] font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, var(--cau-brand-blue, #005587) 0%, var(--cau-brand-green, #058c70) 100%)' }}
            >
              Solicitar clase
            </button>
            {selectedHours.size > 0 && (
              <div className="rounded-lg px-3 py-2 text-[0.62rem] leading-relaxed text-center ca-slide-in" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,199,177,0.12)', color: '#ffffff' }}>
                Solicitar una clase no garantiza la reserva. La profesora confirmará disponibilidad.
              </div>
            )}
          </>
        ) : mode === 'confirm' ? (
          <div className="flex flex-col gap-2 ca-slide-in">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={e => { setNombre(e.target.value); if (showInputError) setShowInputError(false); }}
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-[0.68rem] font-medium outline-none transition-colors"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,199,177,0.2)', color: 'var(--ca-text-main)' }}
                onFocus={onInteract}
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={telefono}
                onChange={e => { setTelefono(e.target.value); if (showInputError) setShowInputError(false); }}
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-[0.68rem] font-medium outline-none transition-colors"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,199,177,0.2)', color: 'var(--ca-text-main)' }}
                onFocus={onInteract}
              />
            </div>
            {materiaSlug === 'matematica' && (
              <button
                type="button"
                onClick={() => setBloqueoSemanal(!bloqueoSemanal)}
                className="w-full py-2 rounded-lg text-[0.75rem] font-bold uppercase tracking-wider transition-all duration-300"
                style={{
                  background: bloqueoSemanal ? 'linear-gradient(180deg, #093838, #002425)' : 'linear-gradient(45deg, #000 0%, #333 100%)',
                  border: bloqueoSemanal ? '1.5px solid #00c7b1' : '1.5px solid rgba(230,155,5,0.3)',
                  color: bloqueoSemanal ? '#fff' : '#e69b05',
                  boxShadow: bloqueoSemanal ? '0 0 14px rgba(0,199,177,0.25)' : 'none',
                }}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <svg className={`w-4 h-4 ${bloqueoSemanal ? 'ca-check-animate' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="#00c7b1" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Reservar todas las semanas
                </span>
                <span className="block text-[0.58rem] font-normal uppercase tracking-widest mt-0.5" style={{ color: bloqueoSemanal ? 'rgba(255,255,255,0.6)' : 'rgba(230,155,5,0.5)' }}>Descuento por continuidad</span>
              </button>
            )}
            {showTurnstile && !turnstileToken && (
              <Turnstile
                sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
                onVerify={handleTurnstileVerify}
                onExpire={() => setTurnstileToken('')}
                theme="dark"
                size="flexible"
              />
            )}
            <button
              onClick={() => {
                onInteract?.();
                if (!datosCompletos) { setShowInputError(true); return; }
                setShowInputError(false);
                requestSubmit(confirmAction);
              }}
              className="w-full py-2 rounded-lg text-[0.75rem] font-bold uppercase tracking-wider text-white transition-all hover:brightness-110"
              style={{
                background: showInputError && !datosCompletos
                  ? 'linear-gradient(135deg, #cc2936 0%, #8b1a1a 100%)'
                  : 'linear-gradient(135deg, var(--cau-brand-blue, #005587) 0%, var(--cau-brand-green, #058c70) 100%)',
              }}
            >
              {showInputError && !datosCompletos ? 'Completá el teléfono' : 'Confirmar solicitud'}
            </button>
            {showInputError && !datosCompletos && (
              <div className="text-[0.6rem] text-center ca-slide-in" style={{ color: '#ff6b6b' }}>
                {telefono.trim().length === 0
                  ? 'Ingresá tu teléfono para continuar.'
                  : 'Formato válido: +54 911xxxx-xxxx o 11-xxxx-xxxx'}
              </div>
            )}
            <button
              onClick={() => { setMode('picking'); setShowTurnstile(false); setTurnstileToken(''); setShowInputError(false); }}
              className="w-full py-1.5 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider transition-all hover:brightness-125"
              style={{ background: 'rgba(200,50,50,0.1)', border: '1.5px solid rgba(220,60,60,0.7)', color: '#e8a0a0' }}
            >
              Cancelar selección
            </button>
          </div>
        ) : mode === 'choose-mode' ? (
          <div className="flex flex-col gap-2 ca-slide-in">
            <button
              onClick={() => { onInteract?.(); setConfirmAction('same'); setMode('confirm'); }}
              className="w-full py-2 rounded-lg text-[0.7rem] font-bold text-white transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, var(--cau-brand-blue, #005587) 0%, var(--cau-brand-green, #058c70) 100%)' }}
            >
              Mismo horario para todos los días
            </button>
            <button
              onClick={() => { onInteract?.(); handleChoosePerDay(); }}
              className="w-full py-2 rounded-lg text-[0.7rem] font-bold transition-all hover:brightness-110"
              style={{ background: 'rgba(0,85,135,0.2)', border: '1px solid rgba(0,85,135,0.4)', color: 'var(--ca-text-main)' }}
            >
              Diferentes horarios por día
            </button>
            <button
              onClick={() => setMode('picking')}
              className="w-full py-1.5 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider transition-all hover:brightness-125"
              style={{ background: 'rgba(200,50,50,0.1)', border: '1.5px solid rgba(220,60,60,0.7)', color: '#e8a0a0' }}
            >
              Cancelar selección
            </button>
          </div>
        ) : mode === 'per-day' ? (
          <div className="flex flex-col gap-2 ca-slide-in">
            {/* Day title */}
            <div className="text-center">
              <span className="text-[0.65rem] font-extrabold uppercase tracking-wider capitalize" style={{ color: 'var(--ca-teal)' }}>
                {formatDay(selectedDays[perDayIdx])}
              </span>
              <span className="text-[0.6rem] ml-1.5" style={{ color: 'var(--ca-text-muted)' }}>
                (día {perDayIdx + 1} de {selectedDays.length})
              </span>
            </div>
            {/* Hour pills for current day */}
            <div key={selectedDays[perDayIdx].num} className="rounded-lg p-2 ca-slide-in" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,199,177,0.12)' }}>
              <HourPills
                hours={hours}
                selected={perDayHours[selectedDays[perDayIdx].num] || new Set()}
                onToggle={(i) => togglePerDayHour(selectedDays[perDayIdx].num, i)}
                disabled={false}
                cols={cols}
              />
            </div>
            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5">
              {selectedDays.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPerDayIdx(i)}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{ background: i <= perDayIdx ? 'var(--ca-teal)' : 'rgba(0,199,177,0.25)' }}
                />
              ))}
            </div>
            {/* Confirm current day / Continue to next */}
            <button
              disabled={(perDayHours[selectedDays[perDayIdx].num]?.size || 0) === 0}
              onClick={() => {
                onInteract?.();
                if (perDayIdx < selectedDays.length - 1) {
                  setPerDayIdx(prev => prev + 1);
                } else {
                  setConfirmAction('perday');
                  setMode('confirm');
                }
              }}
              className="w-full py-2 rounded-lg text-[0.75rem] font-bold uppercase tracking-wider text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, var(--cau-brand-blue, #005587) 0%, var(--cau-brand-green, #058c70) 100%)' }}
            >
              {perDayIdx < selectedDays.length - 1
                ? `Confirmar ${formatDay(selectedDays[perDayIdx])}`
                : `Confirmar ${formatDay(selectedDays[perDayIdx])}`}
            </button>
            {/* Back to previous day */}
            {perDayIdx > 0 && (
              <button
                onClick={() => setPerDayIdx(prev => prev - 1)}
                className="w-full py-1.5 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider transition-all hover:brightness-125"
                style={{ background: 'rgba(0,199,177,0.08)', border: '1px solid rgba(0,199,177,0.2)', color: 'var(--ca-teal)' }}
              >
                Volver al día anterior
              </button>
            )}
            {/* Cancel */}
            <button
              onClick={() => { setMode('picking'); setPerDayHours({}); setPerDayIdx(0); }}
              className="w-full py-1.5 rounded-lg text-[0.6rem] font-bold uppercase tracking-wider transition-all hover:brightness-125"
              style={{ background: 'rgba(200,50,50,0.1)', border: '1.5px solid rgba(220,60,60,0.7)', color: '#e8a0a0' }}
            >
              Cancelar selección
            </button>
          </div>
        ) : null}
        {error && (
          <div className="text-center text-[0.65rem] font-bold" style={{ color: '#ff6b6b' }}>{error}</div>
        )}
      </div>
      </>
      )}
      </div>{/* fin contenido scrollable */}
    </div>
  );
}

/* ── Sidebar Button ── */
function SidebarButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`ca-sb-btn ${active ? 'on' : ''}`}
      onClick={onClick}
      role="tab"
      aria-selected={active}
    >
      <span className="ca-sb-bar" />
      <span className="ca-sb-dot" />
      <span className="font-bold text-[0.72rem] uppercase tracking-wide">{label}</span>
    </button>
  );
}

/* ── Main Page Component ── */
export default function ClasesApoyoPage({ materiasData, initialSlug }: { calendarWeeks?: CalendarWeek[]; materiasData: MateriaDB[]; initialSlug?: string }) {
  const router = useRouter();
  const activeIdx = initialSlug ? materiasData.findIndex(m => m.slug === initialSlug) : null;

  const switchMateria = useCallback((i: number) => {
    const slug = materiasData[i]?.slug;
    if (slug) {
      router.replace(`/clases-apoyo/${slug}`, { scroll: false });
    } else {
      router.replace('/clases-apoyo', { scroll: false });
    }
  }, [materiasData, router]);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [selectedDayInfoMap, setSelectedDayInfoMap] = useState<Record<string, { num: string; month: string }>>({});
  const [requestDone, setRequestDone] = useState(false);
  const [calendarLocked, setCalendarLocked] = useState(false);
  const materia = activeIdx !== null ? materiasData[activeIdx] : null;
  const footerRef = useRef<HTMLElement>(null);
  const scrollToBottom = useCallback(() => {
    if (window.innerWidth <= 768) {
      setTimeout(() => footerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    }
  }, []);

  const handleToggleDay = (key: string, dayInfo: { num: string; month: string; past: boolean }) => {
    setSelectedDays(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      if (next.size === 0) setScheduleKey(k => k + 1);
      return next;
    });
    setSelectedDayInfoMap(prev => {
      const next = { ...prev };
      if (prev[key]) delete next[key];
      else next[key] = { num: dayInfo.num, month: dayInfo.month };
      return next;
    });
    scrollToBottom();
  };

  const [scheduleKey, setScheduleKey] = useState(0);

  const selectedDayInfos = Array.from(selectedDays).map(key => selectedDayInfoMap[key]).filter(Boolean) as { num: string; month: string }[];

  if (!materiasData.length) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ color: 'var(--ca-text-muted)' }}>
        No hay materias disponibles.
      </div>
    );
  }

  return (
    <div className="flex flex-col md:h-[calc(100dvh-var(--navbar-height,60px))] max-md:min-h-[calc(100dvh-var(--navbar-height,60px))]">
      <div className="flex-1 min-h-0 flex justify-center items-stretch p-2 md:p-2 max-md:p-0 max-md:overflow-visible">
        <div className="ca-app w-full max-w-[1400px]">
          {/* Mobile tabs (above header) */}
          <div className="ca-mobile-tabs overflow-x-auto" role="tablist" style={{ background: '#051211', borderBottom: '1px solid var(--ca-border-light)' }}>
            {materiasData.map((m, i) => (
              <button
                key={m.id}
                onClick={() => switchMateria(i)}
                role="tab"
                aria-selected={activeIdx === i}
                className="ca-mobile-tab flex-shrink-0 px-4 py-2.5 text-[0.7rem] font-bold uppercase tracking-wide transition-colors"
                style={{
                  color: activeIdx === i ? '#fff' : 'var(--ca-text-muted)',
                  background: activeIdx === i ? '#051d1a' : 'transparent',
                  borderBottom: activeIdx === i ? '2px solid var(--ca-teal)' : '2px solid transparent',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Header */}
          <header className="ca-header">
            <button
              onClick={() => { router.replace('/clases-apoyo', { scroll: false }); }}
              className="ca-header-brand flex items-center justify-center px-4 cursor-pointer transition-opacity hover:opacity-80"
              style={{ background: 'rgba(0,0,0,0.15)', borderRightWidth: '1px', borderRightStyle: 'solid', borderRightColor: 'var(--ca-border-light)' }}
            >
            <div className="relative h-8 w-32">
              <Image
                src="/imagenes/imagenes_cau/logo_cau.png"
                alt="Logo CAU — Volver al inicio"
                fill
                className="object-contain brightness-0 invert opacity-90"
              />
            </div>
            </button>
            <div className="flex items-center justify-center w-full">
              <span className="text-base font-bold uppercase tracking-widest" style={{ color: 'var(--ca-teal)' }}>
                {materia ? materia.label : 'Clases de Apoyo'}
              </span>
            </div>
          </header>

          {/* Body */}
          <div className="ca-body">
            {/* Sidebar */}
            <nav className="ca-sidebar" role="tablist" aria-orientation="vertical">
              {materiasData.map((m, i) => (
                <SidebarButton
                  key={m.id}
                  label={m.label}
                  active={activeIdx === i}
                  onClick={() => switchMateria(i)}
                />
              ))}
              <div className="flex-1" />
            </nav>

            {/* Main content */}
            <main className="ca-main">
              {materia ? (
                <div className="ca-panel flex flex-col h-full overflow-hidden" key={materia.id}>
                  {materia.en_construccion ? (
                    <ConstructionBanner />
                  ) : (
                    <>
                      {/* Row 1: Carousel + Description */}
                      <div className="ca-r1">
                        <Carousel images={materia.imagenes} />
                        <DescriptionPanel desc={materia.descripcion} />
                      </div>

                      {/* Row 2: Calendar + Schedule */}
                      <div className="ca-r2">
                        <MonthlyCalendar selectedDays={selectedDays} onToggleDay={handleToggleDay} locked={requestDone || calendarLocked} />
                        <SchedulePanel key={scheduleKey} modoManana={materia.modo_manana} materiaId={materia.id} materiaSlug={materia.slug} selectedDays={selectedDayInfos} onDone={() => setRequestDone(true)} onReset={() => { setRequestDone(false); setCalendarLocked(false); setSelectedDays(new Set()); setSelectedDayInfoMap({}); }} onInteract={scrollToBottom} onLockCalendar={setCalendarLocked} />
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center h-full p-6"
                  style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(0,199,177,0.12) 0%, transparent 60%), linear-gradient(170deg, #051211 0%, #082422 50%, #051d1a 100%)' }}
                >
                  <div className="flex flex-col items-center text-center w-full max-w-3xl">
                    <div className="flex items-center gap-4 md:gap-6 mb-5 md:mb-8">
                    <div className="relative w-16 h-16 md:w-24 md:h-24">
                      <Image
                        src="/imagenes/imagenes_cau/logo_cau.png"
                        alt="Logo Centro Educativo Villa Lugano"
                        fill
                        className="object-contain brightness-0 invert opacity-90"
                      />
                    </div>
                      <div className="text-left">
                        <span className="block text-xl md:text-3xl font-black uppercase tracking-tight leading-tight" style={{ color: 'var(--ca-text-main)' }}>
                          Centro Educativo
                        </span>
                        <span className="block text-2xl md:text-4xl font-black uppercase tracking-tight" style={{ color: 'var(--ca-teal)' }}>
                          Villa Lugano
                        </span>
                      </div>
                    </div>

                    <p className="text-sm md:text-lg mb-6 md:mb-8" style={{ color: 'var(--ca-text-muted)' }}>
                      Talleres, clases de apoyo y capacitaciones para toda la comunidad
                    </p>

                    <div className="grid grid-cols-3 gap-3 md:gap-4 w-full">
                      {materiasData.map((m, i) => (
                        <button
                          key={m.id}
                          onClick={() => switchMateria(i)}
                          className="flex items-center justify-center rounded-xl font-bold text-sm md:text-base uppercase tracking-wide transition-all hover:scale-[1.03]"
                          style={{
                            color: '#e7d6b4',
                            background: 'linear-gradient(160deg, rgba(0,199,177,0.1) 0%, rgba(0,199,177,0.03) 100%)',
                            border: '1px solid rgba(0,199,177,0.2)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
                            height: 'clamp(70px, 12vh, 130px)',
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* Footer */}
          <footer ref={footerRef} className="ca-footer flex items-center justify-between px-10" style={{ background: 'var(--ca-bg-footer)', borderTop: '1px solid var(--ca-border-light)', zIndex: 200 }}>
            <div className="ca-footer-info flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-[34px] h-[34px] grid place-items-center rounded-md flex-shrink-0" style={{ background: 'var(--ca-teal)' }}>
                  <svg className="w-5 h-5 text-[#042926]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <span className="block text-[0.5rem] font-extrabold uppercase tracking-[0.2em]" style={{ color: 'var(--ca-accent)' }}>Ubicación</span>
                  <span className="text-[0.95rem] font-bold" style={{ fontFamily: "'Unbounded', sans-serif", color: 'var(--ca-text-main)' }}>Guaminí 4876</span>
                </div>
              </div>
            </div>
            {materia ? (
              <a
                href={`https://wa.me/${materia.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="ca-wa-link"
              >
                <WhatsAppIcon />
                <span>
                  {materia.nombre_profesor} <span className="opacity-40 font-normal mx-1">|</span> {materia.telefono_display}
                </span>
              </a>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--ca-teal)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--ca-teal)' }}>
                  Lunes a Viernes
                </span>
              </div>
            )}
          </footer>
        </div>
      </div>
    </div>
  );
}
