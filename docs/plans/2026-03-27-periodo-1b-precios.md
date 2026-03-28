# Periodo 1B — Precios y Selector de Periodo

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Soportar el periodo 1B (matrícula + ticket único) junto al 1A existente, con un selector en admin que controle qué periodo se muestra en el slide público de descuentos.

**Architecture:** Agregar columna `periodo` a `precios_carreras` para distinguir filas 1A/1B. Agregar `periodo_activo` a `precios_meta` para que el admin elija qué periodo ve el público. Extender el script de sync para parsear también `preciosB` + `promocionesB`. El periodo 1B solo tiene matrícula y un ticket único (mapeado a `ticket_b`; `ticket_a` = 0).

**Tech Stack:** Supabase (PostgreSQL migrations), Next.js App Router, React client components, ExcelJS

---

## Contexto: Diferencias entre periodos

| Aspecto | Periodo 1A | Periodo 1B |
|---------|-----------|-----------|
| Precios Excel | `preciosA` (cols MM, TKA, TKB) | `preciosB` (cols 01MM, 01TK) |
| Promos Excel | `promocionesA` tabla `promoA` | `promocionesB` tabla `promoB` + `adicionalProvinciaB` |
| Conceptos | Matrícula + Ticket A + Ticket B | Matrícula + Ticket único (→ ticket_b) |
| Descuento actual | Mat 5%, TkA 5%, TkB 5% | Mat 80% (50% base + 30% provincial), Tk 20% |
| CAU código | VLG01 (col 9 en preciosA) | VLG01 (col 9 en preciosB) |

---

### Task 1: Migración Supabase — agregar columnas

**Files:**
- Supabase Dashboard → SQL Editor (o MCP `apply_migration`)

**Step 1: Agregar `periodo` a `precios_carreras` y `periodo_activo` a `precios_meta`**

```sql
-- Agregar columna periodo a precios_carreras (default '1A' para datos existentes)
ALTER TABLE precios_carreras
  ADD COLUMN IF NOT EXISTS periodo text NOT NULL DEFAULT '1A';

-- Agregar periodo_activo a precios_meta
ALTER TABLE precios_meta
  ADD COLUMN IF NOT EXISTS periodo_activo text NOT NULL DEFAULT '1A';

-- Agregar campos de promo 1B a precios_meta (para el banner del slide)
ALTER TABLE precios_meta
  ADD COLUMN IF NOT EXISTS promo_desde_1b text,
  ADD COLUMN IF NOT EXISTS promo_hasta_1b text,
  ADD COLUMN IF NOT EXISTS promo_especial_matricula_1b numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS promo_especial_tk_1b numeric DEFAULT 0;
```

**Step 2: Verificar**

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name IN ('precios_carreras', 'precios_meta')
  AND column_name IN ('periodo', 'periodo_activo', 'promo_desde_1b', 'promo_hasta_1b', 'promo_especial_matricula_1b', 'promo_especial_tk_1b');
```

Esperado: 6 filas con los tipos correctos.

**Step 3: Commit**

```bash
git add -A && git commit -m "chore: document periodo 1B migration SQL"
```

---

### Task 2: Extender `scrape-descuentos.mjs` — parsear periodo 1B

**Files:**
- Modify: `scripts/scrape-descuentos.mjs`

**Step 1: Agregar función `parseDescuentos1B` después de `parseDescuentos`**

Parsea `promocionesB`:
- **promoB** (tabla en cols 15-24, filas 7+): segmento 'A', carrera 'Resto' → matrícula base + ticket base
- **adicionalProvinciaB** (cols 49-55, filas 17+): provincia 'BUENOS AIRES', por carrera → matrícula adicional + ticket adicional
- Suma: descuento total mat = promoB.mat + adicional.mat, ticket = promoB.tk + adicional.tk

```javascript
async function parseDescuentos1B(buffer) {
  console.log('3b. Parseando descuentos periodo 1B...');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const ws = workbook.getWorksheet('promocionesB');
  if (!ws) { console.log('   Hoja promocionesB no encontrada'); return null; }

  const cv = (r, c) => rawCellVal(ws.getCell(r, c).value);

  // promoB tabla: headers en fila 7, datos desde fila 8
  // Cols: 15=ID, 16=Vigente, 17=segmento, 18=carrera, 19=desde, 20=hasta, 21=Matrícula, 22=Ticket A
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

  // adicionalProvinciaB: cols 49=provincia, 50=carrera, 51=desde, 52=hasta, 53=Matrícula, 54=Ticket A, 55=Ticket B, 57=Vigente
  // Buscar fila vigente para BUENOS AIRES (usamos la primera como referencia general)
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

  const totalMat = promoBase.matricula + adicionalMat;
  const totalTk = promoBase.ticket + adicionalTk;

  console.log(`   Promo 1B vigente:`);
  console.log(`     Base: Mat=${(promoBase.matricula * 100).toFixed(0)}% Tk=${(promoBase.ticket * 100).toFixed(0)}%`);
  console.log(`     Adicional BSAS: Mat=${(adicionalMat * 100).toFixed(0)}% Tk=${(adicionalTk * 100).toFixed(0)}%`);
  console.log(`     TOTAL: Mat=${(totalMat * 100).toFixed(0)}% Tk=${(totalTk * 100).toFixed(0)}%`);
  console.log(`     Vigente: ${promoBase.desde} → ${promoBase.hasta}`);

  return {
    matricula: totalMat,
    ticket: totalTk,
    desde: promoBase.desde,
    hasta: promoBase.hasta,
  };
}
```

**Step 2: Agregar función `syncPrecios1BSupabase` después de `syncPreciosSupabase`**

Lee `preciosB` (cols 9=caucodigo, 10=carrera, 11=01MM, 12=01TK) para VLG01.
Guarda en `precios_carreras` con `periodo='1B'`, `ticket_a=0`.

```javascript
async function syncPrecios1BSupabase(buffer, promo1B) {
  console.log('7. Sincronizando precios periodo 1B a Supabase...');

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
      ticket_a: 0,          // No aplica en periodo 1B
      ticket_b: ticket,      // Ticket único → ticket_b
      descuento_matricula: promo1B.matricula,
      descuento_ticket_a: 0,
      descuento_ticket_b: promo1B.ticket,
      es_especial: false,    // En 1B el descuento es uniforme
      periodo: '1B',
      updated_at: new Date().toISOString(),
    });
  }

  if (dryRun) {
    console.log(`   [DRY RUN] ${rows.length} carreras periodo 1B`);
    return;
  }

  // Limpiar periodo 1B existente y reinsertar
  const { error: delErr } = await supabase.from('precios_carreras').delete().eq('periodo', '1B');
  if (delErr) { console.error('   Error limpiando precios 1B:', delErr.message); return; }

  const { error: insErr } = await supabase.from('precios_carreras').insert(rows);
  if (insErr) { console.error('   Error insertando precios 1B:', insErr.message); return; }

  // Metadata 1B
  const { error: metaErr } = await supabase.from('precios_meta').update({
    promo_desde_1b: promo1B.desde,
    promo_hasta_1b: promo1B.hasta,
    promo_especial_matricula_1b: promo1B.matricula,
    promo_especial_tk_1b: promo1B.ticket,
  }).eq('id', 1);

  if (metaErr) { console.error('   Error actualizando meta 1B:', metaErr.message); return; }

  console.log(`   ✓ ${rows.length} carreras periodo 1B sincronizadas.`);
}
```

**Step 3: Modificar `syncPreciosSupabase` para que el delete filtre por periodo '1A'**

Cambiar línea del delete:
```javascript
// Antes:
const { error: delErr } = await supabase.from('precios_carreras').delete().neq('id', 0);

// Después:
const { error: delErr } = await supabase.from('precios_carreras').delete().eq('periodo', '1A');
```

También agregar `periodo: '1A'` a cada row del push en `syncPreciosSupabase`.

**Step 4: Modificar `main()` para llamar las nuevas funciones**

Después de `await syncPreciosSupabase(buffer, promoGeneral, promoEspecial);` agregar:

```javascript
// Periodo 1B
const promo1B = await parseDescuentos1B(buffer);
if (promo1B) {
  await syncPrecios1BSupabase(buffer, promo1B);
}
```

**Step 5: Verificar con --dry-run**

```bash
node scripts/scrape-descuentos.mjs --cache --dry-run
```

Esperado: Debería mostrar "X carreras periodo 1B" además de las 1A.

**Step 6: Ejecutar real (sin --dry-run) y verificar en Supabase**

```bash
node scripts/scrape-descuentos.mjs --cache
```

Verificar en Supabase que hay filas con `periodo='1B'` en `precios_carreras`.

**Step 7: Commit**

```bash
git add scripts/scrape-descuentos.mjs
git commit -m "feat: sync precios periodo 1B desde preciosB + promocionesB"
```

---

### Task 3: Selector de periodo en `admin/precios`

**Files:**
- Modify: `app/admin/precios/page.tsx`

**Cambios necesarios:**

1. **Agregar estado `periodo`** ('1A' | '1B') con toggle en el header
2. **Filtrar datos por periodo** al hacer fetch
3. **Cuando periodo = '1B'**: ocultar columnas TKA (lista, dto, final), renombrar TKB → "Cuota"
4. **Botón para cambiar `periodo_activo` en Supabase** (esto controla qué ve el público en el slide)

**Step 1: Agregar `periodo_activo` al fetch y estado de toggle**

En `fetchData()`, agregar al select de `precios_meta`: `periodo_activo`.
En `PageData`, agregar `periodoActivo: string`.

Agregar al componente:
```typescript
const [periodo, setPeriodo] = useState<'1A' | '1B'>('1A');
const [periodoActivo, setPeriodoActivo] = useState<'1A' | '1B'>('1A');
```

**Step 2: Filtrar `precios_carreras` por periodo**

Cambiar el fetch de precios_carreras para traer todo y filtrar en el cliente según `periodo`:
```typescript
const carreras = precios
  .filter((p: { periodo: string }) => p.periodo === periodo)
  .map(/* ... existing mapping ... */);
```

**Step 3: Toggle visual en el header**

Después del título "Precios y Descuentos", agregar tabs/botones:
```tsx
<div className="flex gap-1 mt-2">
  {(['1A', '1B'] as const).map(p => (
    <button
      key={p}
      onClick={() => setPeriodo(p)}
      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
        periodo === p ? 'text-white' : 'text-[#7ca19b] hover:text-white'
      }`}
      style={{
        background: periodo === p ? 'rgba(0,199,177,0.2)' : 'transparent',
        border: `1px solid ${periodo === p ? 'rgba(0,199,177,0.4)' : 'rgba(0,199,177,0.1)'}`,
      }}
    >
      Periodo {p}
      {p === '1B' && ' (Mat+Cuota)'}
    </button>
  ))}
</div>
```

**Step 4: Ocultar columnas TKA cuando periodo = '1B'**

En la tabla, condicionar las columnas TKA:
- Header: `{periodo === '1A' && <th>TkA</th>}`
- Body: `{periodo === '1A' && <td>...</td>}`
- Renombrar TkB → "Cuota" cuando periodo = '1B'
- Ajustar colSpan de los group headers

**Step 5: Botón para activar periodo en el slide público**

Debajo del toggle de periodo, agregar:
```tsx
<button
  onClick={async () => {
    await supabase.from('precios_meta').update({ periodo_activo: periodo }).eq('id', 1);
    setPeriodoActivo(periodo);
  }}
  disabled={periodoActivo === periodo}
  className="px-3 py-1 rounded-lg text-xs font-bold"
  style={{
    background: periodoActivo === periodo ? 'rgba(0,199,177,0.1)' : 'rgba(230,155,5,0.2)',
    color: periodoActivo === periodo ? '#7ca19b' : '#e69b05',
    border: `1px solid ${periodoActivo === periodo ? 'rgba(0,199,177,0.1)' : 'rgba(230,155,5,0.4)'}`,
  }}
>
  {periodoActivo === periodo ? `✓ Periodo ${periodo} activo en slide` : `Activar ${periodo} en slide público`}
</button>
```

**Step 6: Ajustar cálculo de total y cuotas para 1B**

En 1B: `total = matFinal + tkbFinal` (sin tkaFinal que es 0).
El cálculo ya da bien porque ticket_a = 0 para 1B, pero verificar visualmente.

**Step 7: Verificar en localhost:3000/admin/precios**

- Toggle entre 1A y 1B
- 1A: muestra Mat, TkA, TkB como siempre
- 1B: muestra Mat, Cuota (sin TkA)
- Botón "Activar en slide" funciona

**Step 8: Commit**

```bash
git add app/admin/precios/page.tsx
git commit -m "feat: selector de periodo 1A/1B en admin precios"
```

---

### Task 4: Slide público — leer periodo activo

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/index/carousel-modal.tsx` (DescuentosCards)
- Modify: `components/index/types.ts` (DescuentoEspecial)

**Step 1: En `app/page.tsx`, leer `periodo_activo` de `precios_meta`**

Agregar `periodo_activo` al select de precios_meta. Usar los campos de promo correspondientes según el periodo:

```typescript
const periodoActivo = meta?.periodo_activo || '1A';

// Elegir promo según periodo activo
let promoGlobalMat, promoGlobalTkA, promoGlobalTkB;
if (periodoActivo === '1B') {
  promoGlobalMat = Number(meta?.promo_especial_matricula_1b) || 0;
  promoGlobalTkA = 0; // No aplica en 1B
  promoGlobalTkB = Number(meta?.promo_especial_tk_1b) || 0;
} else {
  promoGlobalMat = Number(meta?.promo_especial_matricula) || 0;
  promoGlobalTkA = Number(meta?.promo_especial_tka) || 0;
  promoGlobalTkB = Number(meta?.promo_especial_tkb) || 0;
}
```

**Step 2: En DescuentosCards, manejar periodo 1B**

Cuando `ticket_a` es null/0 y `ticket_b` existe, mostrar:
- Card matrícula con el % de matrícula
- Card "En las cuotas" con el % de ticket (sin distinguir 1ra/2da)

Esto ya funciona parcialmente porque el código chequea `valores.length === 1` y `todosIguales`. Pero si tanto mat como tkB tienen valor y son distintos, necesitamos que para 1B no muestre "1ra cuota" / "2da cuota" sino "En la matrícula" + "En las cuotas".

La lógica actual en `DescuentosCards` ya maneja esto correctamente:
- Si `mat != null` y `tkB != null` (y `tkA == null`): entra en el branch `else` (líneas 1247-1251) y genera 2 cards: "En la matrícula" + "En la 2da cuota"

El label "2da cuota" debería ser "En las cuotas" cuando estamos en 1B. Para esto, pasar `periodoActivo` como prop a DescuentosCards, o mejor, simplemente renombrar "2da cuota" → "En las cuotas" cuando `tkA == null` (que solo ocurre en 1B).

Cambio mínimo en DescuentosCards línea ~1250:
```typescript
// Antes:
if (tkB != null) { ... aplica: 'En la 2da cuota' ... }

// Después:
if (tkB != null) { ... aplica: tkA == null ? 'En las cuotas' : 'En la 2da cuota' ... }
```

**Step 3: Verificar visualmente**

Activar periodo 1B desde admin → recargar home → abrir modal de carrera → ir al último slide → verificar que muestre:
- Sede Local: X%
- Siglo 21: Y%
- Promo matrícula: 80% (desglosado)
- Promo cuotas: 20% (desglosado)

**Step 4: Commit**

```bash
git add app/page.tsx components/index/carousel-modal.tsx
git commit -m "feat: slide público lee periodo_activo para mostrar descuentos 1A/1B"
```

---

### Task 5: Limpiar script inspect-excel.mjs

**Files:**
- Modify: `scripts/inspect-excel.mjs`

El script de inspección fue modificado ad-hoc durante la investigación. Dejarlo en un estado útil para futuras inspecciones o eliminarlo si ya no es necesario.

**Step 1: Restaurar a una versión limpia de utilidad general o `git checkout`**

```bash
git checkout -- scripts/inspect-excel.mjs
```

(O dejarlo como está si se quiere conservar como referencia.)

**Step 2: Commit si se hicieron cambios**

```bash
git add scripts/inspect-excel.mjs
git commit -m "chore: clean up inspect-excel script"
```

---

## Resumen de cambios por capa

| Capa | Cambio |
|------|--------|
| **Supabase** | `precios_carreras.periodo`, `precios_meta.periodo_activo` + campos promo 1B |
| **Script sync** | Parsear `preciosB` + `promocionesB`, subir con `periodo='1B'` |
| **Admin** | Toggle 1A/1B, ocultar TKA en 1B, botón activar periodo en slide |
| **Slide público** | Leer `periodo_activo`, usar promos 1B, label "En las cuotas" |
| **GitHub Actions** | Sin cambios — el script ya corre `--force` y ahora sincroniza ambos periodos |
