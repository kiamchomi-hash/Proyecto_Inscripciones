/**
 * Script para extraer descuentos de promoción desde el Excel embebido en la
 * página de precios CAU (Wix/OneDrive).
 *
 * Estrategia: usa Playwright para interceptar la URL de descarga del Excel,
 * luego lo descarga y parsea localmente con ExcelJS para leer la tabla promoA.
 *
 * El Excel se re-descarga automáticamente si el cache está vencido (fecha de
 * vencimiento de la última promo ya pasó). Hace hasta 3 intentos durante el
 * día porque a veces no lo actualizan automáticamente.
 *
 * Uso:
 *   node scripts/scrape-descuentos.mjs             # headless, actualiza Supabase
 *   node scripts/scrape-descuentos.mjs --dry-run   # solo muestra, no actualiza
 *   node scripts/scrape-descuentos.mjs --visible   # ver navegador
 *   node scripts/scrape-descuentos.mjs --cache     # forzar uso de cache
 *   node scripts/scrape-descuentos.mjs --force     # forzar re-descarga
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Leer credenciales: primero env vars del sistema (GitHub Actions), fallback a .env.local
const env = { ...process.env };
const envPath = resolve(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !env[match[1].trim()]) env[match[1].trim()] = match[2].trim();
  }
}

// Prefer service role key (bypasses RLS) for server-side scripts, fallback to anon key for read-only/dry-run
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey);
const dryRun = process.argv.includes('--dry-run');
const headless = !process.argv.includes('--visible');
const forceCache = process.argv.includes('--cache');
const forceDownload = process.argv.includes('--force');
const CACHE_PATH = '/tmp/precios.xlsx';
const META_PATH = '/tmp/precios-meta.json';

// CAU Villa Lugano
const CAU_SEGMENTO = 'A';
const CAU_CODIGO = 'VLG01';
const MAX_REINTENTOS = 3;
const ESPERA_REINTENTO_MS = 2 * 60 * 60 * 1000; // 2 horas entre reintentos

const NOMBRE_MAP = {
  // ── Grado (sin Lic.) ──
  'Abogacía': 'Abogacía',
  'Actuario': 'Actuario',
  'Contador Público': 'Contador Público',
  'Escribanía': 'Escribanía',

  // ── Grado — Licenciaturas ──
  'Ciencia de datos': 'Lic. en Ciencias de Datos',
  'Intelig. Art. Y Robótica': 'Lic. en Inteligencia Artificial y Robótica',
  'Lic Adm Empresas': 'Lic. en Administración',
  'Lic Adm Hotelera': 'Lic. en Administración Hotelera',
  'Lic Adm Pública': 'Lic. en Administración Pública',
  'Lic Admin Agraria': 'Lic. en Administración Agraria',
  'Lic Agroinformática': 'Lic. en Agroinformática',
  'Lic Amb Energ Renovables': 'Lic. en Ambiente y Energías Renovables',
  'Lic Bioinformática': 'Lic. en Bioinformática',
  'Lic Comercializac': 'Lic. en Comercialización',
  'Lic Comercio Intl': 'Lic. en Comercio Internacional',
  'Lic Crimi y Seg': 'Lic. en Criminología y Seguridad',
  'Lic Dis Animc Dig': 'Lic. en Diseño y Animación Digital',
  'Lic Gest Inf': 'Lic. en Gestión Informática',
  'Lic Gestión Deportiva': 'Lic. en Gestión Deportiva',
  'Lic Gtión Ambtal': 'Lic. en Gestión Ambiental',
  'Lic Gtión de RRHH': 'Lic. en Gestión de Recursos Humanos',
  'Lic Gtión Turíst': 'Lic. en Gestión Turística',
  'Lic Hidrocarburos y Geoc': 'Lic. en Hidrocarburos y Geociencias',
  'Lic HyS M.A Trab': 'Lic. en Higiene, Seguridad y Medio Ambiente del Trabajo',
  'Lic Informática': 'Lic. en Informática',
  'Lic Logist Global': 'Lic. en Logística Global',
  'Lic Negoc Digitales': 'Lic. en Negocios Digitales',
  'Lic Periodismo': 'Lic. en Periodismo',
  'Lic Publicidad': 'Lic. en Publicidad',
  'Lic Relac Intles': 'Lic. en Relaciones Internacionales',
  'Lic RRPP Instituc': 'Lic. en Relaciones Públicas e Institucionales',
  'Lic. Ciencia Política y Gob.': 'Lic. en Ciencia Política y Gobierno',
  'Lic. Educ. y Nvas. Tecnol.': 'Lic. en Educación y Nuevas Tecnologías',
  'Lic. Finanzas': 'Lic. en Finanzas',
  'Matemática': 'Lic. en Matemática',
  'Nutrición': 'Lic. en Nutrición',
  'Lic Sociología': 'Lic. en Sociología',
  'Seguridad Informática': 'Lic. en Seguridad Informática',
  'Antropol. Organizac.': 'Lic. en Antropología Organizacional',
  'Terapia Ocup.': 'Lic. en Terapia Ocupacional y Desarrollo Humano',

  // ── Grado (CCC) — Licenciaturas ──
  'Emprendimiento': 'Lic. en Emprendimiento (CCC)',
  'Geronto': 'Lic. en Gerontología (CCC)',
  'Lic Adm Serv Salud': 'Lic. en Administración de Servicios de Salud (CCC)',
  'Lic Des. Neg. Inmob.': 'Lic. en Desarrollo de Negocios Inmobiliarios (CCC)',
  'Lic Educación': 'Lic. en Educación (CCC)',
  'Lic Psicopedagogía': 'Lic. en Psicopedagogía (CCC)',
  'Prof U nivel Secundario y Superior': 'Profesorado Universitario para Nivel Secundario y Superior (CCC)',

  // ── Pregrado (sin Tec.) ──
  'Procurador': 'Procurador',
  'Tec Mart. Público': 'Martillero, Corredor Público y Corredor Inmobiliario',

  // ── Pregrado — Tecnicaturas ──
  'Tec Ad y G Pol Pb': 'Tec. en Administración y Gestión de Políticas Públicas',
  'Tec Adm y Gt Trib': 'Tec. en Administración y Gestión Tributaria',
  'Tec Clima Laboral': 'Tec. en Gestión del Clima Laboral de la Organización',
  'Tec Dir Equip Vts': 'Tec. en Dirección de Equipos de Venta',
  'Tec Dis Animc Dig': 'Tec. en Diseño y Animación Digital',
  'Tec Ges Emp Fliar': 'Tec. en Gestión de Empresas Familiares',
  'Tec Ges y Aud Amb': 'Tec. en Gestión y Auditorías Ambientales',
  'Tec Gest Cble Imp': 'Tec. en Gestión Contable e Impositiva',
  'Tec Gst ServSalud': 'Tec. en Gestión Administrativa de Servicios de Salud',
  'Tec Gtión de Moda': 'Tec. en Gestión de Moda',
  'Tec Gtión RR Tur': 'Tec. en Recursos Turísticos',
  'Tec HyS Laboral': 'Tec. en Higiene y Seguridad Laboral',
  'Tec Inv Esc Crime': 'Tec. en Investigación de la Escena del Crimen',
  'Tec Mkt Dig y Pub': 'Tec. en Marketing y Publicidad Digital',
  'Tec Pcolo Evtos': 'Tec. en Dirección de Protocolo, Organización de Eventos y RRPP',
  'Tec Pro. Com. NyA': 'Tec. en Promoción Comunitaria en Niñez y Adolescencia',
  'Tec Redes Inf y Telec': 'Tec. en Redes Informáticas y Telecomunicaciones',
  'Tec Relac Lborals': 'Tec. en Relaciones Laborales',
  'Tec Resp Gest Soc': 'Tec. en Responsabilidad y Gestión Social',
  'Tec. Adm. Prop. Horiz.': 'Tec. en Administración de la Propiedad Horizontal y Conjuntos Inmobiliarios',
  'Tec. Dño. y Drrllo. Videojuegos': 'Tec. en Diseño y Desarrollo de Videojuegos',
  'Tec. Hidro. y Geo': 'Tec. en Hidrocarburos y Geociencias',
  'Tec. Negoc. Agroecol.': 'Tec. en Negocios Agroecológicos',
  'Tec Estad Aplic y Análisis Avanzado': 'Tec. en Estadística Aplicada y Análisis Avanzado',
};

/** Extrae el valor de una celda ExcelJS (maneja fórmulas y richText). */
const rawCellVal = (v) => {
  if (v && typeof v === 'object' && 'result' in v) return v.result;
  if (v && typeof v === 'object' && 'richText' in v) return v.richText.map(t => t.text).join('');
  return v;
};

// URL directa al Excel embebido (sin necesidad de contraseña Wix)
const EMBED_URL = 'https://1drv.ms/x/c/5a51a3751f7943fc/IQRb9AL0kmd3T7Pzx07bkl1LAagdLmm3olCeulRnTx_Rwek?em=2&AllowTyping=True&Item=%27Distancia%20CAU%20N%27!A1%3AP29&wdHideGridlines=True&wdDownloadButton=True&wdInConfigurator=True';

/**
 * Determina si hay que re-descargar el Excel.
 * Re-descarga si:
 * - No existe cache
 * - --force flag
 * - Es el día de vencimiento de la promo o posterior, y no se agotaron los 3 reintentos del día
 *
 * Los reintentos se resetean cada día nuevo, así que si la PC estuvo apagada
 * el día anterior, al encenderla tiene 3 intentos frescos.
 */
function necesitaDescarga() {
  if (forceDownload) return true;
  if (forceCache && existsSync(CACHE_PATH)) return false;
  if (!existsSync(CACHE_PATH)) return true;

  // Leer metadata de última descarga
  let meta = { ultimaDescarga: null, promoHasta: null, reintentosHoy: 0, fechaReintentos: null };
  if (existsSync(META_PATH)) {
    try { meta = JSON.parse(readFileSync(META_PATH, 'utf-8')); } catch {}
  }

  const hoy = new Date().toISOString().split('T')[0];

  // Si es el día de vencimiento o posterior, intentar re-descargar
  if (meta.promoHasta && meta.promoHasta <= hoy) {
    // Reset reintentos cada día nuevo (cubre días que la PC estuvo apagada)
    if (meta.fechaReintentos !== hoy) {
      meta.reintentosHoy = 0;
      meta.fechaReintentos = hoy;
    }

    if (meta.reintentosHoy < MAX_REINTENTOS) {
      console.log(`   Promo vence/venció (${meta.promoHasta}). Reintento ${meta.reintentosHoy + 1}/${MAX_REINTENTOS} del día.`);
      meta.reintentosHoy++;
      writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
      return true;
    } else {
      console.log(`   Ya se hicieron ${MAX_REINTENTOS} reintentos hoy. Usando cache.`);
      return false;
    }
  }

  return false;
}

/**
 * Paso 1: Obtener la URL de descarga del Excel desde la API de OneDrive shares.
 */
async function getDownloadUrl() {
  console.log('1. Obteniendo URL de descarga del Excel...');

  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();

  let downloadUrl = null;

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('shares/') && url.includes('microsoftpersonalcontent') && response.status() === 200) {
      try {
        const body = await response.json();
        if (body['@content.downloadUrl']) {
          downloadUrl = body['@content.downloadUrl'];
        }
      } catch { /* ignore non-JSON */ }
    }
  });

  await page.goto(EMBED_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(20000);
  await browser.close();

  if (!downloadUrl) throw new Error('No se pudo obtener la URL de descarga');
  console.log('   URL obtenida.');
  return downloadUrl;
}

/**
 * Paso 2: Descargar el Excel.
 */
async function downloadExcel(url) {
  console.log('2. Descargando Excel...');
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Error descargando: ${resp.status}`);
  const buffer = Buffer.from(await resp.arrayBuffer());
  console.log(`   Descargado: ${(buffer.length / 1024 / 1024).toFixed(1)} MB`);
  return buffer;
}

/**
 * Paso 3: Parsear el Excel y extraer descuentos vigentes.
 *
 * La tabla promoA está en la hoja "promocionesA", rango AY3:BI~1271.
 * Columnas: ID, Vigente, segmento, carrera, desde, hasta, Matrícula, Ticket A, Ticket B
 *
 * Busca filas marcadas como "Vigente" para el segmento A (Villa Lugano).
 * Separa descuentos generales (carrera="Resto") de especiales (carrera específica).
 * Los descuentos especiales se identifican porque una carrera tiene un descuento
 * diferente al resto (ej: matrícula 80% en vez de 5%).
 */
async function parseDescuentos(buffer) {
  console.log('3. Parseando descuentos del Excel...');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const ws = workbook.getWorksheet('promocionesA');
  if (!ws) throw new Error('No se encontró la hoja "promocionesA"');

  // Columnas de la tabla promoA (AY=51 en base 1)
  const COL = {
    ID: 51,       // AY
    Vigente: 52,  // AZ
    segmento: 53, // BA
    carrera: 54,  // BB
    desde: 55,    // BC
    hasta: 56,    // BD
    Matricula: 57, // BE
    TicketA: 58,  // BF
    TicketB: 59,  // BG
  };

  // ExcelJS devuelve objetos { formula, result } para celdas con fórmulas.
  const cellVal = (row, col) => {
    const v = ws.getCell(row, col).value;
    if (v && typeof v === 'object' && 'result' in v) return v.result;
    return v;
  };

  const vigentesGeneral = [];
  const vigentesEspecial = [];

  for (let row = 4; row <= 1271; row++) {
    const vigente = cellVal(row, COL.Vigente);
    if (vigente !== 'Vigente') continue;

    const segmento = cellVal(row, COL.segmento);
    if (segmento !== CAU_SEGMENTO) continue;

    const carrera = cellVal(row, COL.carrera);
    const desde = cellVal(row, COL.desde);
    const hasta = cellVal(row, COL.hasta);
    const dDesde = desde instanceof Date ? desde : new Date(desde);
    const dHasta = hasta instanceof Date ? hasta : new Date(hasta);

    const entry = {
      segmento: String(segmento),
      carrera: String(carrera),
      desde: dDesde.toISOString().split('T')[0],
      hasta: dHasta.toISOString().split('T')[0],
      matricula: Number(cellVal(row, COL.Matricula)) || 0,
      ticketA: Number(cellVal(row, COL.TicketA)) || 0,
      ticketB: Number(cellVal(row, COL.TicketB)) || 0,
    };

    if (carrera === 'Resto') {
      vigentesGeneral.push(entry);
    } else {
      vigentesEspecial.push(entry);
    }
  }

  // Resultado
  const result = { general: null, especiales: [], promoHasta: null };

  if (vigentesGeneral.length > 0) {
    const promo = vigentesGeneral[0];
    result.general = promo;
    result.promoHasta = promo.hasta;

    console.log(`   Promoción general vigente:`);
    console.log(`     Matrícula: ${(promo.matricula * 100).toFixed(0)}%`);
    console.log(`     Ticket A:  ${(promo.ticketA * 100).toFixed(0)}%`);
    console.log(`     Ticket B:  ${(promo.ticketB * 100).toFixed(0)}%`);
    console.log(`     Vigente:   ${promo.desde} → ${promo.hasta}`);
  } else {
    console.log('   No se encontraron promociones generales vigentes.');
  }

  if (vigentesEspecial.length > 0) {
    // El Excel muestra el descuento TOTAL por carrera (incluye el general Siglo 21).
    // Para obtener la parte "especial" pura, restamos el descuento general.
    const baseMat = result.general?.matricula || 0;
    const baseTkA = result.general?.ticketA || 0;
    const baseTkB = result.general?.ticketB || 0;

    result.especiales = vigentesEspecial.map(e => ({
      ...e,
      // Parte especial = total Excel - base general
      matricula: Math.max(e.matricula - baseMat, 0),
      ticketA: Math.max(e.ticketA - baseTkA, 0),
      ticketB: Math.max(e.ticketB - baseTkB, 0),
      // Guardar también el total del Excel para referencia
      totalExcelMat: e.matricula,
      totalExcelTkA: e.ticketA,
      totalExcelTkB: e.ticketB,
    }));

    console.log(`\n   ★ Descuentos ESPECIALES (${vigentesEspecial.length}):`);
    for (const e of result.especiales) {
      console.log(`     ${e.carrera}: Excel=[Mat=${(e.totalExcelMat * 100).toFixed(0)}% TkA=${(e.totalExcelTkA * 100).toFixed(0)}% TkB=${(e.totalExcelTkB * 100).toFixed(0)}%] → Especial puro=[Mat=${(e.matricula * 100).toFixed(0)}% TkA=${(e.ticketA * 100).toFixed(0)}% TkB=${(e.ticketB * 100).toFixed(0)}%]`);
    }
  }

  return result;
}

/**
 * Paso 4: Actualizar Supabase.
 */
async function updateSupabase(result) {
  const { general, especiales } = result;

  if (!general && especiales.length === 0) {
    console.log('4. Sin datos para actualizar.');
    return;
  }

  if (general) {
    const porcentaje = Math.round(Math.max(general.matricula, general.ticketA, general.ticketB) * 100);

    if (dryRun) {
      console.log(`4. [DRY RUN] Se actualizaría descuento tipo='universidad' con porcentaje=${porcentaje}%`);
    } else {
      console.log(`4. Actualizando Supabase (tipo='universidad', porcentaje=${porcentaje}%)...`);
      const { error } = await supabase
        .from('descuentos')
        .update({ porcentaje, updated_at: new Date().toISOString() })
        .eq('tipo', 'universidad');

      if (error) {
        console.error('   Error actualizando Supabase:', error.message);
      } else {
        console.log('   Actualizado correctamente.');
      }
    }
  }

  // Los descuentos especiales se loguean pero no se actualizan automáticamente
  // (el usuario los carga manualmente en Supabase)
  if (especiales.length > 0) {
    console.log(`\n   ★ Descuentos especiales detectados — cargar manualmente en Supabase:`);
    for (const e of especiales) {
      console.log(`     ${e.carrera}: Mat=${(e.matricula * 100).toFixed(0)}% TkA=${(e.ticketA * 100).toFixed(0)}% TkB=${(e.ticketB * 100).toFixed(0)}%`);
    }
  }
}

/**
 * Paso 5: Limpiar descuentos especiales de carreras si la promo venció
 * y no se obtuvo una nueva. Sede y Siglo 21 se mantienen.
 */
async function limpiarEspecialesVencidos(promoHasta) {
  const hoy = new Date().toISOString().split('T')[0];
  if (!promoHasta || promoHasta >= hoy) return; // promo aún vigente

  if (dryRun) {
    console.log(`5. [DRY RUN] Promo vencida (${promoHasta}). Se limpiarían descuentos especiales de carreras.`);
    return;
  }

  console.log(`5. Promo vencida (${promoHasta}). Limpiando descuentos especiales de carreras...`);
  const { data, error } = await supabase
    .from('carreras')
    .update({ descuento_especial: null })
    .not('descuento_especial', 'is', null);

  if (error) {
    console.error('   Error limpiando especiales:', error.message);
  } else {
    const count = data?.length ?? 0;
    console.log(`   ${count > 0 ? `Limpiados ${count} registros.` : 'No había especiales que limpiar.'}`);
  }
}

/**
 * Paso 6: Parsear precios y financiación del Excel y subir a Supabase.
 * Tabla precios_carreras: precio base por carrera + descuento aplicable.
 * Tabla precios_meta: recargos Visa/Master, vigencia promo.
 */
async function syncPreciosSupabase(buffer, promoGeneral, promoEspecial) {
  console.log('6. Sincronizando precios a Supabase...');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Precios base (preciosA)
  const preciosA = workbook.getWorksheet('preciosA');
  let colMM = 56, colTKA = 57, colTKB = 58;
  const cv = (ws, r, c) => rawCellVal(ws.getCell(r, c).value);

  const headerMM = cv(preciosA, 3, colMM);
  if (!headerMM || !String(headerMM).endsWith('MM')) {
    for (let col = 58; col >= 11; col -= 3) {
      const h = cv(preciosA, 3, col - 2);
      if (h && String(h).endsWith('MM')) { colMM = col - 2; colTKA = col - 1; colTKB = col; break; }
    }
  }

  const rows = [];
  for (let row = 4; row <= 42550; row++) {
    const codigo = cv(preciosA, row, 9);
    if (codigo !== CAU_CODIGO) continue;
    const nombreExcel = cv(preciosA, row, 10);
    if (!nombreExcel) continue;
    const matricula = Number(cv(preciosA, row, colMM)) || 0;
    const ticketA = Number(cv(preciosA, row, colTKA)) || 0;
    const ticketB = Number(cv(preciosA, row, colTKB)) || 0;
    if (matricula === 0) continue;

    const promo = promoEspecial[nombreExcel] || promoGeneral;
    const esEspecial = !!promoEspecial[nombreExcel];

    rows.push({
      nombre_excel: nombreExcel,
      nombre_supabase: NOMBRE_MAP[nombreExcel] || nombreExcel,
      matricula, ticket_a: ticketA, ticket_b: ticketB,
      descuento_matricula: promo.matricula,
      descuento_ticket_a: promo.ticketA,
      descuento_ticket_b: promo.ticketB,
      es_especial: esEspecial,
      periodo: '1A',
      updated_at: new Date().toISOString(),
    });
  }

  // Financiación — Visa y Master Otros Bancos
  const finWs = workbook.getWorksheet('financiacion');
  let recargo3 = 0, recargo6 = 0;
  if (finWs) {
    for (let row = 13; row <= 40; row++) {
      const tarjeta = String(cv(finWs, row, 4) || '').toLowerCase();
      if (tarjeta.includes('visa') && tarjeta.includes('master') && tarjeta.includes('otros')) {
        recargo3 = Number(cv(finWs, row, 6)) || 0;
        recargo6 = Number(cv(finWs, row, 7)) || 0;
        break;
      }
    }
  }

  if (dryRun) {
    console.log(`   [DRY RUN] ${rows.length} carreras, recargo 3c=${(recargo3 * 100).toFixed(0)}% 6c=${(recargo6 * 100).toFixed(0)}%`);
    return;
  }

  // Upsert carreras (solo periodo 1A)
  const { error: delErr } = await supabase.from('precios_carreras').delete().eq('periodo', '1A');
  if (delErr) { console.error('   Error limpiando precios:', delErr.message); return; }

  const { error: insErr } = await supabase.from('precios_carreras').insert(rows);
  if (insErr) { console.error('   Error insertando precios:', insErr.message); return; }

  // Metadata
  const { error: metaErr } = await supabase.from('precios_meta').update({
    promo_desde: promoGeneral.desde || null,
    promo_hasta: promoGeneral.hasta || null,
    recargo_visa_master_3: recargo3,
    recargo_visa_master_6: recargo6,
    ultima_sync: new Date().toISOString(),
  }).eq('id', 1);

  if (metaErr) { console.error('   Error actualizando meta:', metaErr.message); return; }

  console.log(`   ✓ ${rows.length} carreras sincronizadas. Recargo Visa/Master: 3c=${(recargo3 * 100).toFixed(0)}% 6c=${(recargo6 * 100).toFixed(0)}%`);
}

/**
 * Paso 7: Parsear descuentos del periodo 1B desde promocionesB.
 *
 * promoB (tabla cols 15-24, filas 7+): descuento base por segmento.
 * adicionalProvinciaB (cols 49-57, filas 17+): descuento adicional por provincia/carrera.
 * Total = promoB base + adicional provincial.
 *
 * Periodo 1B solo tiene matrícula y un ticket único (no A/B).
 */
async function parseDescuentos1B(buffer) {
  console.log('7. Parseando descuentos periodo 1B...');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const ws = workbook.getWorksheet('promocionesB');
  if (!ws) { console.log('   Hoja promocionesB no encontrada'); return null; }

  const cv = (r, c) => rawCellVal(ws.getCell(r, c).value);

  // promoB tabla: headers fila 7, datos desde fila 8
  // Cols: 16=Vigente, 17=segmento, 18=carrera, 19=desde, 20=hasta, 21=Matrícula, 22=Ticket A
  let promoBase = null;
  for (let row = 8; row <= 33; row++) {
    const vigente = cv(row, 16);
    if (vigente !== 'Vigente') continue;
    const seg = cv(row, 17);
    if (seg !== CAU_SEGMENTO) continue;
    const carrera = cv(row, 18);
    if (carrera !== 'Resto') continue;

    const desde = cv(row, 19);
    const hasta = cv(row, 20);
    const dDesde = desde instanceof Date ? desde : new Date(desde);
    const dHasta = hasta instanceof Date ? hasta : new Date(hasta);

    promoBase = {
      matricula: Number(cv(row, 21)) || 0,
      ticket: Number(cv(row, 22)) || 0,
      desde: dDesde.toISOString().split('T')[0],
      hasta: dHasta.toISOString().split('T')[0],
    };
    break;
  }

  if (!promoBase) {
    console.log('   No se encontró promo base vigente en promoB para segmento A');
    return null;
  }

  // adicionalProvinciaB: cols 49=provincia, 53=Matrícula, 54=Ticket A, 57=Vigente
  let adicionalMat = 0;
  let adicionalTk = 0;
  for (let row = 17; row <= 156; row++) {
    const vigente = cv(row, 57);
    if (vigente !== 'Vigente') continue;
    const prov = cv(row, 49);
    if (prov !== 'BUENOS AIRES') continue;
    adicionalMat = Number(cv(row, 53)) || 0;
    adicionalTk = Number(cv(row, 54)) || 0;
    break;
  }

  console.log(`   Promo 1B vigente:`);
  console.log(`     Promo base: Mat=${(promoBase.matricula * 100).toFixed(0)}% Tk=${(promoBase.ticket * 100).toFixed(0)}%`);
  console.log(`     Beneficio BSAS: Mat=${(adicionalMat * 100).toFixed(0)}% Tk=${(adicionalTk * 100).toFixed(0)}%`);
  console.log(`     TOTAL: Mat=${((promoBase.matricula + adicionalMat) * 100).toFixed(0)}% Tk=${((promoBase.ticket + adicionalTk) * 100).toFixed(0)}%`);
  console.log(`     Vigente: ${promoBase.desde} → ${promoBase.hasta}`);

  return {
    promoMat: promoBase.matricula,       // parte promo (ej: 0.5)
    promoTk: promoBase.ticket,           // parte promo (ej: 0.2)
    beneficioMat: adicionalMat,          // parte beneficio provincial (ej: 0.3)
    beneficioTk: adicionalTk,            // parte beneficio provincial (ej: 0.0)
    desde: promoBase.desde,
    hasta: promoBase.hasta,
  };
}

/**
 * Paso 8: Parsear preciosB y subir periodo 1B a Supabase.
 *
 * preciosB: cols 9=caucodigo, 10=carrera, 11=01MM (matrícula), 12=01TK (ticket único).
 * El ticket único se mapea a ticket_b; ticket_a = 0 (no aplica en 1B).
 */
async function syncPrecios1BSupabase(buffer, promo1B) {
  console.log('8. Sincronizando precios periodo 1B a Supabase...');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const precB = workbook.getWorksheet('preciosB');
  if (!precB) { console.log('   Hoja preciosB no encontrada'); return; }

  const cv = (r, c) => rawCellVal(precB.getCell(r, c).value);

  const rows = [];
  for (let row = 4; row <= 24093; row++) {
    const codigo = cv(row, 9);
    if (codigo !== CAU_CODIGO) continue;
    const nombreExcel = cv(row, 10);
    if (!nombreExcel) continue;
    const matricula = Number(cv(row, 11)) || 0;
    const ticket = Number(cv(row, 12)) || 0;
    if (matricula === 0) continue;

    rows.push({
      nombre_excel: nombreExcel,
      nombre_supabase: NOMBRE_MAP[nombreExcel] || nombreExcel,
      matricula,
      ticket_a: 0,
      ticket_b: ticket,
      descuento_matricula: promo1B.promoMat,     // solo parte promo base
      descuento_ticket_a: 0,
      descuento_ticket_b: promo1B.promoTk,        // solo parte promo base
      es_especial: false,
      periodo: '1B',
      updated_at: new Date().toISOString(),
    });
  }

  if (dryRun) {
    console.log(`   [DRY RUN] ${rows.length} carreras periodo 1B`);
    return;
  }

  const { error: delErr } = await supabase.from('precios_carreras').delete().eq('periodo', '1B');
  if (delErr) { console.error('   Error limpiando precios 1B:', delErr.message); return; }

  const { error: insErr } = await supabase.from('precios_carreras').insert(rows);
  if (insErr) { console.error('   Error insertando precios 1B:', insErr.message); return; }

  const { error: metaErr } = await supabase.from('precios_meta').update({
    promo_desde_1b: promo1B.desde,
    promo_hasta_1b: promo1B.hasta,
    promo_especial_matricula_1b: promo1B.promoMat,
    promo_especial_tk_1b: promo1B.promoTk,
    beneficio_1b_mat: promo1B.beneficioMat,
    beneficio_1b_tk: promo1B.beneficioTk,
  }).eq('id', 1);

  if (metaErr) { console.error('   Error actualizando meta 1B:', metaErr.message); return; }

  console.log(`   ✓ ${rows.length} carreras periodo 1B sincronizadas.`);
}

// ── Main ──
async function main() {
  try {
    let buffer;
    let usandoCache = false;
    if (!necesitaDescarga()) {
      console.log(`Usando cache: ${CACHE_PATH}`);
      buffer = readFileSync(CACHE_PATH);
      usandoCache = true;
    } else {
      const downloadUrl = await getDownloadUrl();
      buffer = await downloadExcel(downloadUrl);
      writeFileSync(CACHE_PATH, buffer);
    }

    const result = await parseDescuentos(buffer);

    // Guardar metadata para control de re-descargas
    const meta = existsSync(META_PATH) ? JSON.parse(readFileSync(META_PATH, 'utf-8')) : {};
    meta.ultimaDescarga = new Date().toISOString();
    meta.promoHasta = result.promoHasta || meta.promoHasta;
    writeFileSync(META_PATH, JSON.stringify(meta, null, 2));

    await updateSupabase(result);

    // Construir promoGeneral y promoEspecial para sync de precios
    const promoGeneral = result.general
      ? { matricula: result.general.matricula, ticketA: result.general.ticketA, ticketB: result.general.ticketB, desde: result.general.desde, hasta: result.general.hasta }
      : { matricula: 0, ticketA: 0, ticketB: 0, desde: null, hasta: null };
    const promoEspecial = {};
    for (const e of result.especiales) {
      // Los especiales ya tienen la parte pura restada, pero para precios_carreras
      // guardamos el total del Excel (que es lo que se aplica al precio)
      promoEspecial[e.carrera] = {
        matricula: e.totalExcelMat, ticketA: e.totalExcelTkA, ticketB: e.totalExcelTkB,
      };
    }

    // Sync precios periodo 1A + financiación a Supabase
    await syncPreciosSupabase(buffer, promoGeneral, promoEspecial);

    // Sync precios periodo 1B
    const promo1B = await parseDescuentos1B(buffer);
    if (promo1B) {
      await syncPrecios1BSupabase(buffer, promo1B);
    }

    // Si la promo del Excel sigue vencida (no actualizaron), limpiar especiales
    // Sede y Siglo 21 se mantienen
    const hoy = new Date().toISOString().split('T')[0];
    if (result.promoHasta && result.promoHasta < hoy) {
      console.log(`\n   ⚠ El Excel sigue con la promo vieja (hasta ${result.promoHasta}).`);
      await limpiarEspecialesVencidos(result.promoHasta);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
  console.log('\nFinalizado.');
}

main();
