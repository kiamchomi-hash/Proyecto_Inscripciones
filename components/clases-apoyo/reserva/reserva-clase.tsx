'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import TurnstileWidget from '@/components/turnstile-widget';
import { trackDiaClase, trackHorarioClase, trackSolicitudClase } from '@/lib/analytics';
import type { MateriaDB } from '@/components/clases-apoyo/tipos';

/* Bloque de reserva de clases de apoyo: calendario, horarios y contacto.
   La lógica se movió tal cual desde la app vieja de materias; sólo cambió el
   contenedor, que ahora es una tarjeta autónoma con estilo propio
   (app/clases-apoyo/reserva-clase.css) para verse igual en todas las materias. */

/* ── Monthly Calendar ── */
function MonthlyCalendar({ selectedDays, onToggleDay, locked, diasBloqueados, materiaSlug }: { selectedDays: Set<string>; onToggleDay: (key: string, dayInfo: { num: string; month: string; past: boolean }) => void; locked?: boolean; diasBloqueados?: string[]; materiaSlug: string }) {
  const bloqueadosSet = useMemo(() => {
    if (!diasBloqueados?.length) return new Set<string>();
    return new Set(diasBloqueados.map(iso => {
      const [y, m, d] = iso.split('-').map(Number);
      return `${y}-${m - 1}-${d}`;
    }));
  }, [diasBloqueados]);
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
        <div className="flex items-center justify-between py-2 px-1">
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors disabled:opacity-20"
            style={{ background: 'rgba(0,199,177,0.15)', color: 'var(--rc-acento)' }}
            aria-label="Mes anterior"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="text-sm font-extrabold uppercase tracking-wider capitalize" style={{ color: 'var(--rc-acento)' }}>
            {monthName} {viewYear}
          </span>
          <button
            onClick={goNext}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(0,199,177,0.15)', color: 'var(--rc-acento)' }}
            aria-label="Mes siguiente"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <header className="ca-cal-header">
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi'].map(d => (
            <div key={d} className="text-center py-1.5 text-xs font-extrabold uppercase tracking-wider" style={{ color: 'var(--rc-acento)' }}>{d}</div>
          ))}
        </header>

        <div className="flex-1 flex flex-col">
          {weeks.map((week, wi) => (
            <div key={wi} className="ca-day-grid">
              {week.map((day, di) => day.empty ? (
                <span key={di} className="ca-day empty" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  key={di}
                  className={`ca-day ${day.past || bloqueadosSet.has(day.key) ? 'past' : ''} ${selectedDays.has(day.key) ? 'selected' : ''} ${day.key === todayStr ? 'today' : ''} ${bloqueadosSet.has(day.key) ? 'blocked' : ''}`}
                  disabled={day.past || locked || bloqueadosSet.has(day.key)}
                  aria-label={`${day.num} de ${monthName} de ${viewYear}${day.past || bloqueadosSet.has(day.key) ? ', no disponible' : ''}`}
                  aria-pressed={selectedDays.has(day.key)}
                  onClick={() => {
                    if (day.past || day.empty || locked || bloqueadosSet.has(day.key)) return;
                    trackDiaClase(materiaSlug);
                    onToggleDay(day.key, { num: day.num.toString().padStart(2, '0'), month: monthName, past: day.past });
                  }}
                >
                  {day.num}
                </button>
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

function HourPills({ hours, selected, onToggle, disabled, cols, bloqueados }: {
  hours: { from: string; to: string }[];
  selected: Set<number>;
  onToggle: (i: number) => void;
  disabled: boolean;
  cols: string;
  bloqueados?: Set<string>;
}) {
  return (
    <div className={`grid gap-1.5 ${cols}`}>
      {hours.map((slot, i) => {
        const slotKey = `${slot.from}-${slot.to}`;
        const isBloqueado = bloqueados?.has(slotKey);
        return (
          <button
            key={slot.from}
            disabled={disabled || isBloqueado}
            onClick={() => onToggle(i)}
            className="flex items-center justify-center rounded-full text-[0.62rem] font-bold tabular-nums py-1 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background: isBloqueado ? 'rgba(255,255,255,0.03)' : selected.has(i) ? 'var(--rc-acento)' : 'rgba(0,199,177,0.1)',
              border: isBloqueado ? '1px solid rgba(255,255,255,0.08)' : selected.has(i) ? '1px solid var(--rc-acento)' : '1px solid rgba(0,199,177,0.25)',
              color: isBloqueado ? 'rgba(255,255,255,0.1)' : selected.has(i) ? 'var(--rc-texto-seleccion)' : 'var(--rc-texto)',
            }}
          >
            {slot.from}–{slot.to}
          </button>
        );
      })}
    </div>
  );
}

interface DayInfo { num: string; month: string; calendarKey?: string }

/** Convert calendar key "2026-2-25" to ISO date "2026-03-25" */
function calKeyToIso(key: string): string {
  const [y, mIdx, d] = key.split('-').map(Number);
  return `${y}-${String(mIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Parse mixed horarios_bloqueados: "14:00-15:00" (global) or "2026-03-25|14:00-15:00" (per-day) */
function parseHorariosBloqueados(arr: string[]): { global: Set<string>; perDay: Map<string, Set<string>> } {
  const global = new Set<string>();
  const perDay = new Map<string, Set<string>>();
  for (const entry of arr) {
    if (entry.includes('|')) {
      const [date, slot] = entry.split('|');
      if (!perDay.has(date)) perDay.set(date, new Set());
      perDay.get(date)!.add(slot);
    } else {
      global.add(entry);
    }
  }
  return { global, perDay };
}

function formatDay(d: DayInfo) { return `${d.num} de ${d.month}`; }

function SchedulePanel({ modoManana, materiaId, materiaSlug, selectedDays, onDone, onReset, onInteract, onLockCalendar, horariosBloqueados }: { modoManana: boolean; materiaId: string; materiaSlug: string; selectedDays: DayInfo[]; onDone: () => void; onReset: () => void; onInteract?: () => void; onLockCalendar?: (locked: boolean) => void; horariosBloqueados?: string[] }) {
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
  const parsedBloqueados = useMemo(() => parseHorariosBloqueados(horariosBloqueados || []), [horariosBloqueados]);
  const bloqueadosSet = parsedBloqueados.global;
  // Cambiar la key remonta el widget y pide un token nuevo (los tokens son de un solo uso)
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaPendiente, setCaptchaPendiente] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [confirmAction, setConfirmAction] = useState<'same' | 'perday'>('same');
  const pendingSubmitRef = useRef<'same' | 'perday' | null>(null);
  const soloDigitos = telefono.replace(/[\s\-\+]/g, '');
  const telefonoValido = soloDigitos.length >= 8 && /^\d+$/.test(soloDigitos.slice(-8));
  const datosCompletos = telefonoValido;

  const toggleHour = (i: number) => {
    const slot = hours[i];
    if (slot) trackHorarioClase(materiaSlug, `${slot.from}-${slot.to}`);
    setSelectedHours(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
    onInteract?.();
  };

  const togglePerDayHour = (day: string, i: number) => {
    const slot = hours[i];
    if (slot) trackHorarioClase(materiaSlug, `${slot.from}-${slot.to}`);
    setPerDayHours(prev => {
      const daySet = new Set(prev[day] || []);
      if (daySet.has(i)) daySet.delete(i); else daySet.add(i);
      return { ...prev, [day]: daySet };
    });
    onInteract?.();
  };

  const submitRows = async (rows: Array<Record<string, unknown>>, token: string) => {
    try {
      const response = await fetch('/api/formularios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'clase', token, payload: { rows } }),
      });
      // Una fila por turno pedido: sirve para ver si piden un horario o varios.
      if (response.ok) trackSolicitudClase(rows.length);
      return response.ok;
    } catch {
      return false;
    } finally {
      setTurnstileToken('');
      setCaptchaKey(k => k + 1);
    }
  };

  const handleChooseSame = async (token: string) => {
    setError(null);
    const horarios = Array.from(selectedHours).sort((a, b) => a - b).map(i => `${hours[i].from}-${hours[i].to}`);
    const dias = selectedDays.map(d => d.num);
    const ok = await submitRows([{
      materia_id: materiaId, dias, horarios, nombre: nombre.trim() || null, telefono: telefono.trim(), bloqueo_semanal: bloqueoSemanal,
    }], token);
    if (!ok) setError('Error al enviar. Intente más tarde.');
    else { setSubmittedDays([...selectedDays]); setMode('done'); onDone(); }
  };

  const handleChoosePerDay = () => {
    const initial: Record<string, Set<number>> = {};
    selectedDays.forEach(d => { initial[d.num] = new Set(selectedHours); });
    setPerDayHours(initial);
    setPerDayIdx(0);
    setMode('per-day');
  };

  const handleSubmitPerDay = async (token: string) => {
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

    const ok = await submitRows(rows, token);
    if (!ok) setError('Error al enviar. Intente más tarde.');
    else { setSubmittedDays(rows.map(r => selectedDays.find(d => d.num === r.dias[0])!)); setMode('done'); onDone(); }
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setCaptchaPendiente(false);
    const action = pendingSubmitRef.current;
    pendingSubmitRef.current = null;
    if (action === 'same') void handleChooseSame(token);
    else if (action === 'perday') void handleSubmitPerDay(token);
  };

  const requestSubmit = (action: 'same' | 'perday') => {
    if (turnstileToken) {
      if (action === 'same') void handleChooseSame(turnstileToken);
      else void handleSubmitPerDay(turnstileToken);
    } else {
      pendingSubmitRef.current = action;
      setCaptchaPendiente(true);
    }
  };

  const canProceed = selectedHours.size > 0 && selectedDays.length > 0;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden" style={{ borderLeft: '1px solid rgba(0,199,177,0.1)' }}>
      {/* Título fijo arriba */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-3 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.18)', borderBottom: '1px solid var(--rc-borde)' }}>
        <h3 className="text-sm font-extrabold whitespace-nowrap px-4 py-1.5 rounded-full text-white" style={{ background: 'rgba(0,85,135,0.15)', border: '1px solid rgba(0,85,135,0.4)' }}>Clases de Lunes a Viernes</h3>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, rgba(0,199,177,0.4), transparent)' }} />
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 flex flex-col justify-evenly items-stretch min-h-0 overflow-y-auto ca-schedule-scroll">

      {selectedDays.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-3">
          <div className="flex flex-col items-center justify-center gap-3 w-full py-6 rounded-xl" style={{ border: '2px dashed rgba(0,199,177,0.25)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--rc-texto-suave)', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[0.72rem] font-semibold text-center" style={{ color: 'var(--rc-texto-suave)' }}>
              Seleccioná uno o varios días<br />para empezar
            </span>
          </div>
        </div>
      ) : (
      <>
      {/* Hora pills principales — ocultas en per-day, confirm y done */}
      {mode !== 'per-day' && mode !== 'done' && mode !== 'confirm' && (
      <div className={`grid gap-2 px-3 my-2 ${cols}`}>
        {hours.map((slot, i) => {
          const slotKey = `${slot.from}-${slot.to}`;
          const isBloqueado = bloqueadosSet.has(slotKey);
          return (
            <button
              key={slot.from}
              disabled={isBloqueado}
              onClick={() => { toggleHour(i); if (mode === 'choose-mode') setMode('picking'); }}
              className="flex items-center justify-center rounded-full text-[0.68rem] font-bold tabular-nums py-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: isBloqueado ? 'rgba(255,255,255,0.03)' : selectedHours.has(i) ? 'var(--rc-acento)' : 'rgba(0,199,177,0.1)',
                border: isBloqueado ? '1px solid rgba(255,255,255,0.08)' : selectedHours.has(i) ? '1px solid var(--rc-acento)' : '1px solid rgba(0,199,177,0.25)',
                color: isBloqueado ? 'rgba(255,255,255,0.1)' : selectedHours.has(i) ? 'var(--rc-texto-seleccion)' : 'var(--rc-texto)',
              }}
            >
              {slot.from}–{slot.to}
            </button>
          );
        })}
      </div>
      )}

      {/* Zona inferior — cambia según el modo */}
      <div className="px-3 pb-3 flex flex-col gap-2 ca-schedule-transition">
        {mode === 'done' ? (
          <div className="ca-slide-in flex flex-col items-center gap-2 py-3 rounded-lg" style={{ background: 'rgba(0,199,177,0.12)' }}>
            <div className="flex items-center gap-2 text-[0.75rem] font-bold" style={{ color: 'var(--rc-acento)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Solicitud realizada con éxito
            </div>
            <span className="text-[0.62rem] capitalize" style={{ color: 'var(--rc-texto-suave)' }}>
              {submittedDays.length === 1
                ? `Día solicitado: ${formatDay(submittedDays[0])}`
                : `Días solicitados: ${submittedDays.map(formatDay).join(', ')}`}
            </span>
            <button
              onClick={() => { setMode('picking'); setSelectedHours(new Set()); setPerDayHours({}); setSubmittedDays([]); setTurnstileToken(''); setCaptchaPendiente(false); setBloqueoSemanal(false); onReset(); }}
              className="mt-1 px-4 py-1.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider transition-all hover:brightness-125"
              style={{ background: 'rgba(0,199,177,0.1)', border: '1px solid rgba(0,199,177,0.3)', color: 'var(--rc-acento)' }}
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
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,199,177,0.2)', color: 'var(--rc-texto)' }}
                onFocus={onInteract}
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={telefono}
                onChange={e => { setTelefono(e.target.value); if (showInputError) setShowInputError(false); }}
                className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-[0.68rem] font-medium outline-none transition-colors"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(0,199,177,0.2)', color: 'var(--rc-texto)' }}
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
            {/* Montado desde que se entra al paso: si apareciera recién al tocar
                Confirmar, correría el botón 71 px justo debajo del dedo. */}
            <TurnstileWidget
              key={captchaKey}
              onVerify={handleTurnstileVerify}
              onExpire={() => setTurnstileToken('')}
            />
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
            {/* Línea reservada para los avisos: la columna usa justify-evenly, así
                que insertar contenido movería el botón que se acaba de tocar. */}
            <div className="text-[0.6rem] leading-4 min-h-4 text-center" style={{ color: showInputError && !datosCompletos ? '#ff6b6b' : '#e69b05' }}>
              {showInputError && !datosCompletos
                ? (telefono.trim().length === 0
                  ? 'Ingresá tu teléfono para continuar.'
                  : 'Formato válido: +54 911xxxx-xxxx o 11-xxxx-xxxx')
                : captchaPendiente && !turnstileToken && datosCompletos
                  ? 'Marcá la casilla de verificación para enviar.'
                  : ''}
            </div>
            <button
              onClick={() => { setMode('picking'); setCaptchaPendiente(false); setTurnstileToken(''); setShowInputError(false); }}
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
              style={{ background: 'rgba(0,85,135,0.2)', border: '1px solid rgba(0,85,135,0.4)', color: 'var(--rc-texto)' }}
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
              <span className="text-[0.65rem] font-extrabold uppercase tracking-wider capitalize" style={{ color: 'var(--rc-acento)' }}>
                {formatDay(selectedDays[perDayIdx])}
              </span>
              <span className="text-[0.6rem] ml-1.5" style={{ color: 'var(--rc-texto-suave)' }}>
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
                bloqueados={(() => {
                  const merged = new Set(bloqueadosSet);
                  const ck = selectedDays[perDayIdx]?.calendarKey;
                  if (ck) {
                    const iso = calKeyToIso(ck);
                    parsedBloqueados.perDay.get(iso)?.forEach(s => merged.add(s));
                  }
                  return merged;
                })()}
              />
            </div>
            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5">
              {selectedDays.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPerDayIdx(i)}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{ background: i <= perDayIdx ? 'var(--rc-acento)' : 'rgba(0,199,177,0.25)' }}
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
                style={{ background: 'rgba(0,199,177,0.08)', border: '1px solid rgba(0,199,177,0.2)', color: 'var(--rc-acento)' }}
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

type MateriaReserva = Pick<MateriaDB, 'id' | 'slug' | 'modo_manana' | 'dias_bloqueados' | 'horarios_bloqueados'>;

export default function ReservaClase({ materia }: { materia: MateriaReserva }) {
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [selectedDayInfoMap, setSelectedDayInfoMap] = useState<Record<string, { num: string; month: string; calendarKey: string }>>({});
  const [requestDone, setRequestDone] = useState(false);
  const [calendarLocked, setCalendarLocked] = useState(false);
  // En móvil el panel de horarios queda debajo del calendario: al elegir un día
  // se lo acerca para que se vea qué sigue. Antes apuntaba al pie de la app.
  const horariosRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = useCallback(() => {
    if (window.innerWidth <= 768) {
      setTimeout(() => horariosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
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
      else next[key] = { num: dayInfo.num, month: dayInfo.month, calendarKey: key };
      return next;
    });
    scrollToBottom();
  };

  const [scheduleKey, setScheduleKey] = useState(0);

  const selectedDayInfos = Array.from(selectedDays).map(key => selectedDayInfoMap[key]).filter(Boolean) as DayInfo[];

  return (
    <section id="reservar" className="reserva-clase" aria-labelledby="reservar-titulo">
      <h2 id="reservar-titulo" className="rc-titulo">Reservá tu clase</h2>
      <div className="rc-grid">
        <div className="rc-calendario">
          <MonthlyCalendar selectedDays={selectedDays} onToggleDay={handleToggleDay} locked={requestDone || calendarLocked} diasBloqueados={materia.dias_bloqueados} materiaSlug={materia.slug} />
        </div>
        <div className="rc-horarios" ref={horariosRef}>
          <SchedulePanel key={scheduleKey} modoManana={materia.modo_manana} materiaId={materia.id} materiaSlug={materia.slug} selectedDays={selectedDayInfos} onDone={() => setRequestDone(true)} onReset={() => { setRequestDone(false); setCalendarLocked(false); setSelectedDays(new Set()); setSelectedDayInfoMap({}); }} onInteract={scrollToBottom} onLockCalendar={setCalendarLocked} horariosBloqueados={materia.horarios_bloqueados} />
        </div>
      </div>
    </section>
  );
}
