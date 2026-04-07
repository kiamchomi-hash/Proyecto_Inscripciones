import type { Metadata } from 'next';
import ClasesApoyoPage from '@/components/clases-apoyo/clases-apoyo-page';
import { supabase } from '@/lib/supabase';
import { materiaSchema, parseArray } from '@/lib/schemas';
import './clases-apoyo.css';

export const metadata: Metadata = {
  title: 'Clases de Apoyo',
  description: 'Apoyo pedagógico y académico en Villa Lugano. Clases de Matemática, Lengua, Inglés y más.',
  keywords: ['clases de apoyo', 'villa lugano', 'matemática', 'lengua', 'inglés', 'apoyo escolar', 'clases particulares'],
  alternates: {
    canonical: '/clases-apoyo',
  },
};

export const dynamic = 'force-dynamic';

function buildCalendarWeeks() {
  const formatter = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: 'numeric', day: 'numeric',
  });
  const parts = formatter.formatToParts(new Date());
  const p: Record<string, string> = {};
  parts.forEach(pt => { p[pt.type] = pt.value; });
  const today = new Date(+p.year, +p.month - 1, +p.day);

  const dow = today.getDay();
  const anchor = new Date(today);
  if (dow === 6) {
    // Sábado → avanzar al lunes siguiente
    anchor.setDate(today.getDate() + 2);
  } else if (dow === 0) {
    // Domingo → avanzar al lunes siguiente
    anchor.setDate(today.getDate() + 1);
  } else {
    // Lun-Vie → retroceder al lunes de esta semana
    anchor.setDate(today.getDate() + (1 - dow));
  }

  const labels = ['Semana Actual', 'Próxima Semana', 'Semana Siguiente'];
  return labels.map((label, i) => {
    const weekMon = new Date(anchor);
    weekMon.setDate(anchor.getDate() + i * 7);
    const monthName = weekMon.toLocaleString('es-ES', { month: 'long' });

    const days = Array.from({ length: 5 }, (_, d) => {
      const cellDate = new Date(weekMon);
      cellDate.setDate(weekMon.getDate() + d);
      return {
        num: cellDate.getDate().toString().padStart(2, '0'),
        past: cellDate < today,
      };
    });

    return { label, month: monthName, days };
  });
}

export default async function Page() {
  const calendarWeeks = buildCalendarWeeks();

  const { data: materias } = await supabase
    .from('materias')
    .select('id, slug, label, nombre_profesor, whatsapp, telefono_display, descripcion, imagenes, en_construccion, orden, modo_manana, dias_bloqueados, horarios_bloqueados')
    .eq('activa', true)
    .order('orden', { ascending: true });

  const materiasValidadas = parseArray(materiaSchema, materias ?? [], 'materias');

  return (
    <ClasesApoyoPage
      calendarWeeks={calendarWeeks}
      materiasData={materiasValidadas}
    />
  );
}
