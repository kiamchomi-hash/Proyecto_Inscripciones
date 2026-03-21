'use client';

import { useEffect, useRef, useState } from 'react';

function useCountUp(target: number, duration: number, trigger: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setCount(current);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }, [trigger, target, duration]);

  return count;
}

export default function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const estudiantes = useCountUp(105, 2000, visible);
  const carreras = useCountUp(130, 2000, visible);
  const anios = useCountUp(30, 1500, visible);

  const stats = [
    { value: estudiantes, suffix: '+', label: 'Estudiantes este año', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
    { value: carreras, suffix: '+', label: 'Carreras disponibles', icon: 'M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5' },
    { value: anios, suffix: '', label: 'Años de experiencia', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  return (
    <div ref={ref} className="w-full py-5 sm:py-6 border-t border-[#00c7b1]/20" style={{ background: 'linear-gradient(135deg, #011f17 0%, #013729 50%, #01453a 100%)' }}>
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-3 gap-4 sm:gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-1 sm:gap-2">
            <svg className="w-5 h-5 sm:w-7 sm:h-7 text-[#00c7b1] mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
            </svg>
            <span className="text-2xl sm:text-4xl md:text-5xl font-black text-white tabular-nums leading-none">
              {stat.value}{stat.suffix}
            </span>
            <span className="text-[0.6rem] sm:text-xs md:text-sm font-semibold text-[#7ca19b] uppercase tracking-wider leading-tight">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
