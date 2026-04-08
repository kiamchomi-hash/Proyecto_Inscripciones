# Alumnos CAU — Scraping eCampus Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agregar sección "Alumnos CAU" al panel admin que scrapea ecampus.uesiglo21.edu.ar y muestra el listado de alumnos con datos personales, analíticos y pagos.

**Architecture:** GitHub Action con Playwright scrapea ecampus y guarda en Supabase. Página admin lee de Supabase. Botón "Sincronizar" dispara el Action (mismo patrón que sync-precios). Credenciales en env vars/secrets.

**Tech Stack:** Playwright (ya instalado), GitHub Actions, Supabase (PostgreSQL), Next.js App Router

---

## Contexto del scraping

### Login
- URL: `http://ecampus.uesiglo21.edu.ar/menu/`
- POST a `j_security_check` con `j_username` y `j_password` (no usar campo `dni`)
- HTTP directo NO funciona (ZK framework requiere JS) → necesita Playwright

### Navegación post-login
1. Click "INFORMANTE CAUS" en sidebar
2. Click "Listado Alumnos por CAU" en submenu
3. El contenido carga en iframe: `https://ecampus.uesiglo21.edu.ar/ueMigraciones/jpdk/portalsiglo21/caus/listadoAlumnosCAU.zul?id=41916`

### Búsqueda por fecha
- Click tab "Busqueda por fecha" dentro del iframe
- Campos: Fecha Ingreso Desde, Fecha Ingreso Hasta
- Los inputs son `input.z-datebox-input` (NO editables directo, usar JS: `el.value = "DD/MM/YYYY"` + dispatch change/blur)
- Estado: "Todos" (default)
- Modalidad: seleccionar radio "EDHome (Cau de Referencia)"
- Click botón "BUSCAR"

### Parámetros fijos
- Fecha Hasta: hoy
- Fecha Desde: hoy - 14 días
- Estado: Todos
- Modalidad: EDHome (Cau de Referencia)

### Tabla de resultados
Columnas parseables de `.z-row`:
| Col | Selector | Ejemplo |
|---|---|---|
| Legajo | `span.styleMov` (1er span) | VPUS002230 |
| Alumno | `span.styleMov[style*="cursor:pointer"]` | Siciliano, Camila Aylen |
| Ingreso | `span.z-label` (3ra celda) | 07/04/2026 |
| Matrícula Paga | `span.z-label` (4ta celda) | SI/NO |
| Tickets Vencidos | `span.z-label` (5ta celda) | 0 |
| Participó | `span.z-label` (6ta celda) | NO |
| Analíticos | `a.z-a` icon (7ma celda) | clickeable |
| Mov. Puntos | `a.z-a` icon (8va celda) | clickeable |

### Modal 1 — Datos Personales (click en nombre del alumno)
Se abre jQuery UI dialog con iframe: `/ueCampus/jpdk/portalsiglo21/alumnos/datos_personales.zul`

Datos disponibles:
- Nombre completo, Email primario, Email secundario
- Documento (DNI), Fecha de nacimiento, Edad, Sexo
- Domicilio: Calle, Número, Piso, Torre, Depto, Barrio
- Localidad, Código Postal
- Teléfono principal, Teléfono secundario, Fax

### Modal 2 — Reporte Analítico (click en icono Analíticos)
Se abre dialog con iframe: `/ueCampus/jpdk/portalsiglo21/alumnos/reporteAnalitico.zul`

Datos disponibles:
- Alumno, Legajo, Documento, Plan (año), Carrera
- **Materias aprobadas**: Trimestre, Materia, Créditos, Período regularidad, Cant. aplazos, Fecha, Calificación, Libro, Folio, Obs
- **Materias habilitadas para rendir**: Trimestre, Materia, Fecha, Calificación, Turno, Regularidad
- **Aplazos**: misma estructura que aprobadas
- Promedio sin aplazos, Promedio con aplazos

### Modal 3 — Movimientos/Pagos (click en icono Mov. Puntos)
Se abre dialog con iframe: `/ueMigraciones/jpdk/portalsiglo21/alumnos/movimientosPuntos_popUp.zul?legajo=LEGAJO`

Datos disponibles:
- Título: "RESUMEN DE CUENTA Y PAGOS DEL ALUMNO"
- Lista de tickets: Nro ticket, fecha vencimiento, fecha pago

---

## Implementación

### Task 1: Variables de entorno

**Files:**
- Modify: `.env.local` (local dev)
- Modify: GitHub repo secrets (para Action)

```
ECAMPUS_USERNAME=ARODRIGUEZFALCON
ECAMPUS_PASSWORD=Analia2026!
```

### Task 2: Tablas Supabase

Crear via migration o dashboard:

```sql
-- Tabla principal de alumnos
CREATE TABLE alumnos_cau (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  legajo text UNIQUE NOT NULL,
  nombre text NOT NULL,
  fecha_ingreso date,
  matricula_paga boolean DEFAULT false,
  tickets_vencidos integer DEFAULT 0,
  participo boolean DEFAULT false,
  -- Datos personales (del modal 1)
  email_primario text,
  email_secundario text,
  documento text,
  fecha_nacimiento date,
  edad integer,
  sexo text,
  domicilio_calle text,
  domicilio_numero text,
  domicilio_localidad text,
  domicilio_cp text,
  telefono_principal text,
  telefono_secundario text,
  -- Metadata
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Materias del reporte analítico (del modal 2)
CREATE TABLE alumnos_analiticos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  legajo text NOT NULL REFERENCES alumnos_cau(legajo) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('aprobada', 'habilitada', 'aplazo')),
  trimestre integer,
  materia text NOT NULL,
  creditos integer,
  fecha date,
  calificacion text,
  turno text,
  regularidad text,
  synced_at timestamptz DEFAULT now()
);

-- Pagos/tickets (del modal 3)
CREATE TABLE alumnos_pagos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  legajo text NOT NULL REFERENCES alumnos_cau(legajo) ON DELETE CASCADE,
  nro_ticket text,
  fecha_vencimiento date,
  fecha_pago date,
  synced_at timestamptz DEFAULT now()
);

-- Promedios (del modal 2)
ALTER TABLE alumnos_cau ADD COLUMN plan text;
ALTER TABLE alumnos_cau ADD COLUMN carrera text;
ALTER TABLE alumnos_cau ADD COLUMN promedio_sin_aplazos numeric;
ALTER TABLE alumnos_cau ADD COLUMN promedio_con_aplazos numeric;
```

### Task 3: GitHub Action — sync-alumnos.yml

**Files:**
- Create: `.github/workflows/sync-alumnos.yml`
- Create: `scripts/sync-alumnos.ts` (o .mjs)

El script:
1. Lanza Playwright headless
2. Login → Navega → Busca por fecha (últimos 14 días, EDHome)
3. Parsea tabla de resultados
4. Por cada alumno:
   a. Click nombre → parsea datos personales → cierra modal
   b. Click analíticos → parsea materias → cierra modal
   c. Click mov. puntos → parsea tickets → cierra modal
5. Upsert todo en Supabase (usando SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)

Secrets necesarios en GitHub:
- `ECAMPUS_USERNAME`
- `ECAMPUS_PASSWORD`
- `SUPABASE_URL` (ya debería existir)
- `SUPABASE_SERVICE_ROLE_KEY`

### Task 4: API Route — trigger sync

**Files:**
- Create: `app/api/admin/sync-alumnos/route.ts`

Mismo patrón que `app/api/admin/sync-precios/route.ts`:
```typescript
// POST → dispara workflow sync-alumnos.yml via GitHub API
```

### Task 5: Página admin `/admin/alumnos`

**Files:**
- Create: `app/admin/alumnos/page.tsx`

**UI:**
- Header con botón volver + botón "Sincronizar" (dispara API)
- Input date "Fecha desde" (filtra client-side los datos de Supabase)
- Indicador de última sincronización
- Tabla principal: Legajo, Alumno, Ingreso, Matrícula Paga, Tickets, Participó
- Click en fila → modal con 3 tabs:
  - **Datos Personales**: email, documento, dirección, teléfonos
  - **Analítico**: carrera, plan, materias aprobadas/habilitadas/aplazos, promedios
  - **Pagos**: lista de tickets con fechas
- Estilo: mismo que el resto del admin (dark theme, colores del proyecto)

### Task 6: Card en dashboard admin

**Files:**
- Modify: `app/admin/page.tsx`

Agregar al array `cards[]`:
```typescript
{
  title: 'Alumnos CAU',
  description: 'Listado de alumnos, datos personales, analíticos y pagos',
  href: '/admin/alumnos',
  icon: /* users icon SVG */
}
```

---

## Orden de ejecución recomendado
1. Task 1 (env vars)
2. Task 2 (tablas Supabase)
3. Task 3 (GitHub Action + script scraper) — es la más compleja
4. Task 4 (API route trigger)
5. Task 5 (página admin) — se puede hacer en paralelo con Task 3 usando datos mock
6. Task 6 (card dashboard)
