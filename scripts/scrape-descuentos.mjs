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
const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const dryRun = process.argv.includes('--dry-run');
const headless = !process.argv.includes('--visible');
const forceCache = process.argv.includes('--cache');
const forceDownload = process.argv.includes('--force');
const CACHE_PATH = '/tmp/precios.xlsx';
const META_PATH = '/tmp/precios-meta.json';

// CAU Villa Lugano = segmento A
const CAU_SEGMENTO = 'A';
const MAX_REINTENTOS = 3;
const ESPERA_REINTENTO_MS = 2 * 60 * 60 * 1000; // 2 horas entre reintentos

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
