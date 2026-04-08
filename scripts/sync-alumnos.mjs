/**
 * Sync Alumnos CAU — Scrapea ecampus.uesiglo21.edu.ar y guarda en Supabase
 * Uso: node scripts/sync-alumnos.mjs
 * Env: ECAMPUS_USERNAME, ECAMPUS_PASSWORD, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ECAMPUS_USER = process.env.ECAMPUS_USERNAME;
const ECAMPUS_PASS = process.env.ECAMPUS_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_KEY || !ECAMPUS_USER || !ECAMPUS_PASS) {
  console.error('Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function formatDate(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function parseDate(str) {
  if (!str || str === '-') return null;
  const parts = str.trim().split('/');
  if (parts.length !== 3) return null;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

async function getFrame(page) {
  for (const f of page.frames()) {
    if (f.url().includes('listadoAlumnosCAU')) return f;
  }
  return null;
}

async function loginAndSearch(page) {
  const hoy = new Date();
  const desde = new Date(hoy);
  desde.setDate(desde.getDate() - 14);

  console.log(`Buscando alumnos desde ${formatDate(desde)} hasta ${formatDate(hoy)}`);

  await page.goto('http://ecampus.uesiglo21.edu.ar/menu/', { timeout: 60000, waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(5000);

  await page.fill('input[name="j_username"]', ECAMPUS_USER);
  await page.fill('input[name="j_password"]', ECAMPUS_PASS);
  await page.waitForTimeout(1000);
  await page.click('button.btn-ingresar');
  await page.waitForTimeout(10000);

  await page.getByText('INFORMANTE CAUS').first().click();
  await page.waitForTimeout(3000);
  await page.getByText('Listado Alumnos por CAU').first().click();
  await page.waitForTimeout(8000);

  const frame = await getFrame(page);
  if (!frame) throw new Error('No se encontró el iframe de listado');

  await frame.getByText('Busqueda por fecha').first().click();
  await page.waitForTimeout(3000);

  // Setear fechas via JS (ZK datebox no es editable directo)
  const dateInputs = await frame.$$('input.z-datebox-input');
  const visibleDates = [];
  for (const inp of dateInputs) {
    if (await inp.isVisible()) visibleDates.push(inp);
  }

  if (visibleDates.length >= 2) {
    await visibleDates[0].evaluate((el, val) => {
      el.value = val;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    }, formatDate(desde));

    await visibleDates[1].evaluate((el, val) => {
      el.value = val;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
    }, formatDate(hoy));
  }

  // Seleccionar EDHome
  const radios = await frame.$$('input[type="radio"]');
  for (const r of radios) {
    if (await r.isVisible()) {
      const label = await r.evaluate(el => el.parentElement?.textContent?.trim() || '');
      if (label.includes('EDHome')) {
        await r.check();
        break;
      }
    }
  }

  await page.waitForTimeout(1000);

  // Click BUSCAR
  const btns = await frame.$$('button');
  for (const b of btns) {
    if (await b.isVisible()) {
      const txt = await b.innerText();
      if (txt.trim().toUpperCase().includes('BUSCAR')) {
        await b.click();
        break;
      }
    }
  }

  await page.waitForTimeout(10000);
  return frame;
}

async function parseResultsTable(frame) {
  const rows = await frame.$$('.z-row');
  const alumnos = [];

  for (const row of rows) {
    const cells = await row.$$('.z-row-content');
    if (cells.length < 6) continue;

    const legajo = (await cells[0].innerText()).trim();
    const nombre = (await cells[1].innerText()).trim();
    const ingreso = (await cells[2].innerText()).trim();
    const matricula = (await cells[3].innerText()).trim();
    const tickets = (await cells[4].innerText()).trim();
    const participo = (await cells[5].innerText()).trim();

    alumnos.push({
      legajo,
      nombre,
      fecha_ingreso: parseDate(ingreso),
      matricula_paga: matricula === 'SI',
      tickets_vencidos: parseInt(tickets) || 0,
      participo: participo === 'SI',
    });
  }

  return alumnos;
}

async function scrapeDatosPersonales(page, frame, index) {
  const nameSpans = await frame.$$('span.styleMov[style*="cursor:pointer"]');
  if (!nameSpans[index]) return null;

  await nameSpans[index].click();
  await page.waitForTimeout(6000);

  // Buscar iframe de datos personales
  let dpFrame = null;
  for (const f of page.frames()) {
    if (f.url().includes('datos_personales')) { dpFrame = f; break; }
  }

  if (!dpFrame) {
    console.warn('  No se encontró modal datos personales');
    return null;
  }

  const text = await dpFrame.locator('body').innerText();
  const get = (label) => {
    const re = new RegExp(label + '\\s*[:\\t]\\s*([^\\n\\t]+)', 'i');
    const m = text.match(re);
    return m ? m[1].trim() : null;
  };

  const datos = {
    email_primario: get('Email primario'),
    email_secundario: get('Email secundario'),
    documento: get('Documento'),
    fecha_nacimiento: parseDate(get('Fecha de Nacimiento')),
    edad: parseInt(get('Edad')) || null,
    sexo: get('Sexo'),
    domicilio_calle: get('Calle'),
    domicilio_numero: get('Número') || get('Numero'),
    domicilio_localidad: get('Localidad'),
    domicilio_cp: get('Código Postal') || get('Codigo Postal'),
    telefono_principal: get('Teléfono principal') || get('Telefono principal'),
    telefono_secundario: get('Teléfono secundario') || get('Telefono secundario'),
  };

  // Cerrar modal
  const closeBtns = await page.$$('.ui-dialog-titlebar-close');
  for (const cb of closeBtns) {
    if (await cb.isVisible()) { await cb.click(); break; }
  }
  await page.waitForTimeout(2000);

  return datos;
}

async function scrapeAnaliticos(page, frame, rowIndex) {
  const icons = await frame.$$('a.z-a[style*="cursor:pointer"]');
  const iconIdx = rowIndex * 2; // 2 icons per row: analiticos, mov.puntos
  if (!icons[iconIdx]) return { materias: [], plan: null, carrera: null, promedioSin: null, promedioCon: null };

  await icons[iconIdx].click({ force: true });
  await page.waitForTimeout(6000);

  let aFrame = null;
  for (const f of page.frames()) {
    if (f.url().includes('reporteAnalitico')) { aFrame = f; break; }
  }

  if (!aFrame) {
    console.warn('  No se encontró modal analíticos');
    return { materias: [], plan: null, carrera: null, promedioSin: null, promedioCon: null };
  }

  const text = await aFrame.locator('body').innerText();

  // Extraer plan y carrera del texto
  const planMatch = text.match(/Plan:\s*(\d+)/);
  const carreraMatch = text.match(/Carrera:\s*([^\n]+)/);
  const promedioSinMatch = text.match(/PROMEDIO SIN APLAZOS:\s*([\d.,]+)/i);
  const promedioConMatch = text.match(/PROMEDIO CON APLAZOS:\s*([\d.,]+)/i);

  const plan = planMatch ? planMatch[1] : null;
  const carrera = carreraMatch ? carreraMatch[1].trim() : null;
  const promedioSin = promedioSinMatch ? parseFloat(promedioSinMatch[1].replace(',', '.')) : null;
  const promedioCon = promedioConMatch ? parseFloat(promedioConMatch[1].replace(',', '.')) : null;

  // Parsear materias via DOM (el texto plano separa cada celda en líneas distintas)
  // Hay 3 grids ZK: 0=aprobadas, 1=habilitadas, 2=aplazos
  const tipoByGrid = ['aprobada', 'habilitada', 'aplazo'];
  const materias = await aFrame.evaluate((tipos) => {
    const grids = document.querySelectorAll('.z-grid');
    const results = [];
    grids.forEach((grid, idx) => {
      const tipo = tipos[idx];
      if (!tipo) return;
      const rows = grid.querySelectorAll('.z-row');
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('.z-row-content')).map(c => c.textContent.trim());
        if (cells.length >= 3 && cells[2]) {
          results.push({
            tipo,
            trimestre: parseInt(cells[0]) || null,
            materia: cells[2],
            // Para aprobadas: cells = [trim, '', materia, cred, per_regul, cant_apl, fecha, calif, libro, folio, obs]
            // Para habilitadas: cells = [trim, '', materia, fecha, calif, turno, regul]
            // Para aplazos: cells = [trim, '', materia, cred, per_regul, fecha, calif, libro, folio]
            creditos: tipo !== 'habilitada' && cells[3] ? parseInt(cells[3]) || null : null,
            fecha: null, // se parsea abajo
            calificacion: null,
            turno: null,
            regularidad: null,
          });
          const m = results[results.length - 1];
          if (tipo === 'habilitada') {
            m.fecha = cells[3] && cells[3] !== '-' ? cells[3] : null;
            m.calificacion = cells[4] && cells[4] !== '-' ? cells[4] : null;
            m.turno = cells[5] && cells[5] !== '-' ? cells[5] : null;
            m.regularidad = cells[6] && cells[6] !== '-' ? cells[6] : null;
          } else if (tipo === 'aprobada') {
            m.fecha = cells[6] && cells[6] !== '-' ? cells[6] : null;
            m.calificacion = cells[7] && cells[7] !== '-' ? cells[7] : null;
          } else { // aplazo
            m.fecha = cells[5] && cells[5] !== '-' ? cells[5] : null;
            m.calificacion = cells[6] && cells[6] !== '-' ? cells[6] : null;
          }
        }
      });
    });
    return results;
  }, tipoByGrid);

  // Convertir fechas DD/MM/YYYY a YYYY-MM-DD
  for (const m of materias) {
    if (m.fecha) m.fecha = parseDate(m.fecha);
  }

  // Cerrar modal
  const closeBtns = await page.$$('.ui-dialog-titlebar-close');
  for (const cb of closeBtns) {
    if (await cb.isVisible()) { await cb.click(); break; }
  }
  await page.waitForTimeout(2000);

  return { materias, plan, carrera, promedioSin, promedioCon };
}

async function scrapeMovPuntos(page, frame, rowIndex) {
  const icons = await frame.$$('a.z-a[style*="cursor:pointer"]');
  const iconIdx = rowIndex * 2 + 1; // second icon per row
  if (!icons[iconIdx]) return [];

  await icons[iconIdx].click({ force: true });
  await page.waitForTimeout(6000);

  let mFrame = null;
  for (const f of page.frames()) {
    if (f.url().includes('movimientosPuntos')) { mFrame = f; break; }
  }

  if (!mFrame) {
    console.warn('  No se encontró modal movimientos');
    return [];
  }

  const text = await mFrame.locator('body').innerText();
  const pagos = [];

  // Parsear tickets: "Nro ticket V260005642857 que vence el dia 07/05/2026 pagado el dia 07/04/2026"
  const ticketRegex = /Nro ticket\s+(\S+)\s+que vence el dia\s+(\S+)\s+pagado el dia\s+(\S+)/g;
  let match;
  while ((match = ticketRegex.exec(text)) !== null) {
    pagos.push({
      nro_ticket: match[1],
      fecha_vencimiento: parseDate(match[2]),
      fecha_pago: parseDate(match[3]),
    });
  }

  // Cerrar modal
  const closeBtns = await page.$$('.ui-dialog-titlebar-close');
  for (const cb of closeBtns) {
    if (await cb.isVisible()) { await cb.click(); break; }
  }
  await page.waitForTimeout(2000);

  return pagos;
}

async function saveToSupabase(alumnos) {
  const now = new Date().toISOString();

  for (const alumno of alumnos) {
    console.log(`  Guardando ${alumno.legajo} — ${alumno.nombre}`);

    // Upsert alumno principal
    const { error: upsertErr } = await supabase.from('alumnos_cau').upsert({
      legajo: alumno.legajo,
      nombre: alumno.nombre,
      fecha_ingreso: alumno.fecha_ingreso,
      matricula_paga: alumno.matricula_paga,
      tickets_vencidos: alumno.tickets_vencidos,
      participo: alumno.participo,
      email_primario: alumno.datos?.email_primario || null,
      email_secundario: alumno.datos?.email_secundario || null,
      documento: alumno.datos?.documento || null,
      fecha_nacimiento: alumno.datos?.fecha_nacimiento || null,
      edad: alumno.datos?.edad || null,
      sexo: alumno.datos?.sexo || null,
      domicilio_calle: alumno.datos?.domicilio_calle || null,
      domicilio_numero: alumno.datos?.domicilio_numero || null,
      domicilio_localidad: alumno.datos?.domicilio_localidad || null,
      domicilio_cp: alumno.datos?.domicilio_cp || null,
      telefono_principal: alumno.datos?.telefono_principal || null,
      telefono_secundario: alumno.datos?.telefono_secundario || null,
      plan: alumno.analiticos?.plan || null,
      carrera: alumno.analiticos?.carrera || null,
      promedio_sin_aplazos: alumno.analiticos?.promedioSin || null,
      promedio_con_aplazos: alumno.analiticos?.promedioCon || null,
      synced_at: now,
    }, { onConflict: 'legajo' });

    if (upsertErr) console.error(`  Error upsert alumno ${alumno.legajo}:`, upsertErr.message);

    // Reemplazar analíticos
    if (alumno.analiticos?.materias?.length) {
      await supabase.from('alumnos_analiticos').delete().eq('legajo', alumno.legajo);
      const { error: anaErr } = await supabase.from('alumnos_analiticos').insert(
        alumno.analiticos.materias.map(m => ({ ...m, legajo: alumno.legajo, synced_at: now }))
      );
      if (anaErr) console.error(`  Error insert analíticos ${alumno.legajo}:`, anaErr.message);
    }

    // Reemplazar pagos
    if (alumno.pagos?.length) {
      await supabase.from('alumnos_pagos').delete().eq('legajo', alumno.legajo);
      const { error: pagErr } = await supabase.from('alumnos_pagos').insert(
        alumno.pagos.map(p => ({ ...p, legajo: alumno.legajo, synced_at: now }))
      );
      if (pagErr) console.error(`  Error insert pagos ${alumno.legajo}:`, pagErr.message);
    }
  }
}

async function main() {
  console.log('=== Sync Alumnos CAU ===');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  try {
    const frame = await loginAndSearch(page);
    const alumnos = await parseResultsTable(frame);
    console.log(`Encontrados ${alumnos.length} alumnos`);

    for (let i = 0; i < alumnos.length; i++) {
      const alumno = alumnos[i];
      console.log(`\n[${i + 1}/${alumnos.length}] ${alumno.legajo} — ${alumno.nombre}`);

      // Datos personales
      console.log('  Scrapeando datos personales...');
      alumno.datos = await scrapeDatosPersonales(page, frame, i);

      // Analíticos
      console.log('  Scrapeando analíticos...');
      alumno.analiticos = await scrapeAnaliticos(page, frame, i);

      // Movimientos/Pagos
      console.log('  Scrapeando movimientos...');
      alumno.pagos = await scrapeMovPuntos(page, frame, i);
    }

    console.log('\n=== Guardando en Supabase ===');
    await saveToSupabase(alumnos);
    console.log('\nSync completado.');
  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: '/tmp/sync-alumnos-error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
