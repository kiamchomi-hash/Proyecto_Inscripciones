import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { readFileSync, existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const CACHE_PATH = '/tmp/precios.xlsx';
const CAU_SEGMENTO = 'A';
const CAU_CODIGO = '30A01';

const NOMBRE_MAP: Record<string, string> = {
  'Abogacía': 'Abogacía',
  'Actuario': 'Actuario',
  'Ciencia de datos': 'Ciencias de Datos',
  'Contador Público': 'Contador Público',
  'Emprendimiento': 'Emprendimiento (CCC)',
  'Escribanía': 'Escribanía',
  'Geronto': 'Gerontología (CCC)',
  'Intelig. Art. Y Robótica': 'Inteligencia Artificial y Robótica',
  'Lic Adm Empresas': 'Administración',
  'Lic Adm Hotelera': 'Administración Hotelera',
  'Lic Adm Pública': 'Administración Pública',
  'Lic Adm Serv Salud': 'Administración de Servicios de Salud (CCC)',
  'Lic Admin Agraria': 'Administración Agraria',
  'Lic Bioinformática': 'Bioinformática',
  'Lic Comercializac': 'Comercialización',
  'Lic Comercio Intl': 'Comercio Internacional',
  'Lic Crimi y Seg': 'Criminología y Seguridad',
  'Lic Des. Neg. Inmob.': 'Desarrollo De Negocios Inmobiliarios (CCC)',
  'Lic Dis Animc Dig': 'Diseño y Animación Digital',
  'Lic Educación': 'Educación (CCC)',
  'Lic Gest Inf': 'Informática',
  'Lic Gestión Deportiva': 'Gestión Deportiva',
  'Lic Gtión Ambtal': 'Gestión Ambiental',
  'Lic Gtión de RRHH': 'Licenciatura en Gestión de Recursos Humanos',
  'Lic Gtión Turíst': 'Gestión Turística',
  'Lic HyS M.A Trab': 'Higiene, Seguridad y Medio ambiente del Trabajo',
  'Lic Informática': 'Informática',
  'Lic Logist Global': 'Logística Global',
  'Lic Negoc Digitales': 'Negocios Digitales',
  'Lic Periodismo': 'Periodismo',
  'Lic Psicopedagogía': 'Psicopedagogía (CCC)',
  'Lic Publicidad': 'Publicidad',
  'Lic Relac Intles': 'Relaciones Internacionales',
  'Lic RRPP Instituc': 'Relaciones Públicas e Institucionales',
  'Lic. Ciencia Política y Gob.': 'Ciencia Política y Gobierno',
  'Lic. Educ. y Nvas. Tecnol.': 'Educación y Nuevas Tecnologías',
  'Lic. Finanzas': 'Finanzas',
  'Matemática': 'Matemática',
  'Nutrición': 'Nutrición',
  'Procurador': 'Procurador',
  'Prof U nivel Secundario y Superior': 'Profesorado Universitario para Nivel Secundario y Superior (CCC)',
  'Seguridad Informática': 'Seguridad Informática',
  'Terapia Ocup.': 'Terapia Ocupacional y Desarrollo Humano',
  'Tec Ad y G Pol Pb': 'Tecnicatura Universitaria en Administración y Gestión de Políticas Públicas',
  'Tec Adm y Gt Trib': 'Tecnicatura en Administración y Gestión Tributaria',
  'Tec Clima Laboral': 'Tecnicatura Universitaria en Gestión del Clima Laboral de la Organización',
  'Tec Dir Equip Vts': 'Tecnicatura en Dirección de Equipos de venta',
  'Tec Dis Animc Dig': 'Tecnicatura Universitaria en Diseño y Animación Digital',
  'Tec Ges Emp Fliar': 'Tecnicatura en Gestión de Empresas Familiares',
  'Tec Ges y Aud Amb': 'Tecnicatura Universitaria en Gestión y Auditorías Ambientales',
  'Tec Gest Cble Imp': 'Tecnicatura en Gestión Contable e impositiva',
  'Tec Gst ServSalud': 'Tecnicatura en Gestión Administrativas de Servicios de Salud',
  'Tec Gtión de Moda': 'Tecnicatura Universitaria en Gestión de Moda',
  'Tec Gtión RR Tur': 'Tecnicatura Universitaria en Recursos Turísticos',
  'Tec HyS Laboral': 'Tecnicatura en Higiene y Seguridad Laboral',
  'Tec Inv Esc Crime': 'Tecnicatura en investigación de la escena del crimen',
  'Tec Mart. Público': 'Martillero, Corredor Público y Corredor Inmobiliario',
  'Tec Mkt Dig y Pub': 'Tecnicatura en Marketing y Publicidad Digital',
  'Tec Pcolo Evtos': 'Tecnicatura en Dirección de Protocolo, Organización de Eventos y RRPP',
  'Tec Pro. Com. NyA': 'Tecnicatura Universitaria en Promoción Comunitaria en Niñez y Adolescencia',
  'Tec Redes Inf y Telec': 'Tecnicatura Universitaria en Redes Informáticas y Telecomunicaciones',
  'Tec Relac Lborals': 'Tecnicatura en Relaciones Laborales',
  'Tec Resp Gest Soc': 'Tecnicatura en Responsabilidad y Gestión Social',
  'Tec. Adm. Prop. Horiz.': 'Tecnicatura Universitaria en Administración de la Propiedad Horizontal y Conjuntos Inmobiliarios',
  'Tec. Dño. y Drrllo. Videojuegos': 'Tecnicatura en Diseño y Desarrollo de Videojuegos',
  'Tec. Hidro. y Geo': 'Tecnicatura Universitaria en Hidrocarburos y Geociencias',
  'Tec. Negoc. Agroecol.': 'Tecnicatura Universitaria en Negocios Agroecológicos',
};

function cellVal(ws: ExcelJS.Worksheet, r: number, c: number) {
  const v = ws.getCell(r, c).value;
  if (v && typeof v === 'object' && 'result' in v) return (v as { result: unknown }).result;
  if (v && typeof v === 'object' && 'richText' in v) return (v as { richText: { text: string }[] }).richText.map(t => t.text).join('');
  return v;
}

export async function GET() {
  if (!existsSync(CACHE_PATH)) {
    return NextResponse.json({ error: 'No hay Excel cacheado. Ejecutar primero: node scripts/scrape-descuentos.mjs' }, { status: 404 });
  }

  try {
    const buffer = readFileSync(CACHE_PATH);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // 1. Precios base (preciosA)
    const preciosA = workbook.getWorksheet('preciosA');
    if (!preciosA) throw new Error('Hoja preciosA no encontrada');

    let colMM = 56, colTKA = 57, colTKB = 58;
    const headerMM = cellVal(preciosA, 3, colMM);
    if (!headerMM || !String(headerMM).endsWith('MM')) {
      for (let col = 58; col >= 11; col -= 3) {
        const h = cellVal(preciosA, 3, col - 2);
        if (h && String(h).endsWith('MM')) { colMM = col - 2; colTKA = col - 1; colTKB = col; break; }
      }
    }

    const precios: { nombreExcel: string; nombre: string; matricula: number; ticketA: number; ticketB: number }[] = [];
    for (let row = 4; row <= 42550; row++) {
      const codigo = cellVal(preciosA, row, 9);
      if (codigo !== CAU_CODIGO) continue;
      const nombreExcel = cellVal(preciosA, row, 10) as string;
      if (!nombreExcel) continue;
      const matricula = Number(cellVal(preciosA, row, colMM)) || 0;
      const ticketA = Number(cellVal(preciosA, row, colTKA)) || 0;
      const ticketB = Number(cellVal(preciosA, row, colTKB)) || 0;
      if (matricula === 0) continue;
      precios.push({ nombreExcel, nombre: NOMBRE_MAP[nombreExcel] || nombreExcel, matricula, ticketA, ticketB });
    }

    // 2. Promociones (promocionesA)
    const promoA = workbook.getWorksheet('promocionesA');
    const promoGeneral = { matricula: 0, ticketA: 0, ticketB: 0, desde: '', hasta: '' };
    const promoEspecial: Record<string, { matricula: number; ticketA: number; ticketB: number }> = {};

    if (promoA) {
      for (let row = 4; row <= 1271; row++) {
        const vigente = cellVal(promoA, row, 52);
        if (vigente !== 'Vigente') continue;
        const segmento = cellVal(promoA, row, 53);
        if (segmento !== CAU_SEGMENTO) continue;
        const carrera = cellVal(promoA, row, 54) as string;
        const mat = Number(cellVal(promoA, row, 57)) || 0;
        const tka = Number(cellVal(promoA, row, 58)) || 0;
        const tkb = Number(cellVal(promoA, row, 59)) || 0;
        const desde = cellVal(promoA, row, 55);
        const hasta = cellVal(promoA, row, 56);

        if (carrera === 'Resto') {
          promoGeneral.matricula = mat;
          promoGeneral.ticketA = tka;
          promoGeneral.ticketB = tkb;
          promoGeneral.desde = desde instanceof Date ? desde.toISOString().split('T')[0] : String(desde || '');
          promoGeneral.hasta = hasta instanceof Date ? hasta.toISOString().split('T')[0] : String(hasta || '');
        } else {
          promoEspecial[carrera] = { matricula: mat, ticketA: tka, ticketB: tkb };
        }
      }
    }

    // 3. Financiación — Visa y Master Otros Bancos (fila 13 de financiacion)
    const finWs = workbook.getWorksheet('financiacion');
    let recargo3 = 0, recargo6 = 0;
    if (finWs) {
      for (let row = 13; row <= 40; row++) {
        const tarjeta = String(cellVal(finWs, row, 4) || '').toLowerCase();
        if (tarjeta.includes('visa') && tarjeta.includes('master') && tarjeta.includes('otros')) {
          recargo3 = Number(cellVal(finWs, row, 6)) || 0;
          recargo6 = Number(cellVal(finWs, row, 7)) || 0;
          break;
        }
      }
    }

    // 4. Descuentos de Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: descuentos } = await supabase.from('descuentos').select('*').eq('activo', true);
    const sede = descuentos?.find((d: { tipo: string }) => d.tipo === 'sede');
    const siglo = descuentos?.find((d: { tipo: string }) => d.tipo === 'universidad');
    const sedeVal = (sede?.porcentaje ?? 0) / 100;
    const sigloVal = (siglo?.porcentaje ?? 0) / 100;

    // 5. Calcular precios finales
    const resultado = precios.map(p => {
      const promo = promoEspecial[p.nombreExcel] || promoGeneral;
      const esEspecial = !!promoEspecial[p.nombreExcel];

      // Promo aplica a todo, sede solo a tickets
      const matFinal = Math.round(p.matricula * (1 - promo.matricula));
      const tkaFinal = Math.round(p.ticketA * (1 - promo.ticketA) * (1 - sedeVal));
      const tkbFinal = Math.round(p.ticketB * (1 - promo.ticketB) * (1 - sedeVal));

      // Cuotas con recargo Visa/Master otros bancos
      const tkaEn3 = Math.round(tkaFinal * (1 + recargo3));
      const tkaEn6 = Math.round(tkaFinal * (1 + recargo6));
      const tkbEn3 = Math.round(tkbFinal * (1 + recargo3));
      const tkbEn6 = Math.round(tkbFinal * (1 + recargo6));

      return {
        nombre: p.nombre,
        esEspecial,
        lista: { matricula: p.matricula, ticketA: p.ticketA, ticketB: p.ticketB },
        final: { matricula: matFinal, ticketA: tkaFinal, ticketB: tkbFinal },
        cuotas3: { ticketA: tkaEn3, ticketB: tkbEn3 },
        cuotas6: { ticketA: tkaEn6, ticketB: tkbEn6 },
        descuento: { matricula: promo.matricula, ticketA: promo.ticketA, ticketB: promo.ticketB },
      };
    });

    return NextResponse.json({
      descuentos: {
        sede: sede?.porcentaje ?? 0,
        siglo21: siglo?.porcentaje ?? 0,
        promoGeneral,
        especiales: Object.entries(promoEspecial).map(([carrera, d]) => ({
          carrera,
          nombre: NOMBRE_MAP[carrera] || carrera,
          ...d,
        })),
      },
      financiacion: {
        tarjeta: 'Visa y Mastercard - Otros Bancos',
        recargo3: Math.round(recargo3 * 100),
        recargo6: Math.round(recargo6 * 100),
      },
      carreras: resultado,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
