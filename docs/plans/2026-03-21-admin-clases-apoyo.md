# Admin Panel — Clases de Apoyo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Panel de administración protegido con Supabase Auth donde cada profesor gestiona su materia (descripción, imágenes, bloqueo de días/horarios) y el admin gestiona todo.

**Architecture:** Supabase Auth con email/password. Tabla `profesores` vincula `auth.users.id` con `materias.id`. RLS en `materias` permite UPDATE solo al profesor asignado o al admin. Frontend en `/admin/clases-apoyo` con login y CRUD. Las imágenes de clases se suben a Supabase Storage (bucket `clases-apoyo`). Se agrega columna `dias_bloqueados` y `horarios_bloqueados` a `materias` para que el profesor marque qué días/horarios no están disponibles.

**Tech Stack:** Supabase Auth, Supabase Storage, Next.js App Router, Tailwind CSS, RLS policies

---

## Modelo de datos

### Tabla `profesores` (nueva)
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid FK → auth.users(id) | Cuenta de auth |
| materia_id | uuid FK → materias(id) | Materia asignada |
| rol | text | 'profesor' o 'admin' |
| created_at | timestamptz | now() |

### Columnas nuevas en `materias`
| Columna | Tipo | Default | Descripción |
|---------|------|---------|-------------|
| dias_bloqueados | jsonb | '[]' | Array de strings: ["2026-03-25", "2026-04-01"] |
| horarios_bloqueados | jsonb | '[]' | Array de strings: ["14:00-15:00", "16:00-17:00"] |

### Supabase Storage
- Bucket: `clases-apoyo` (público para lectura)
- Path: `{materia_slug}/imagen-1.jpg`, `{materia_slug}/imagen-2.jpg`

---

### Task 1: Migración DB — tabla `profesores` y columnas nuevas en `materias`

**Files:**
- Create: `supabase/migrations/20260321_admin_clases_apoyo.sql`

**Step 1: Escribir y aplicar la migración**

```sql
-- Columnas de bloqueo en materias
ALTER TABLE materias ADD COLUMN IF NOT EXISTS dias_bloqueados jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE materias ADD COLUMN IF NOT EXISTS horarios_bloqueados jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Tabla profesores
CREATE TABLE IF NOT EXISTS profesores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_id uuid REFERENCES materias(id) ON DELETE SET NULL,
  rol text NOT NULL DEFAULT 'profesor' CHECK (rol IN ('profesor', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS en profesores
ALTER TABLE profesores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios autenticados leen su propio perfil"
  ON profesores FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admin lee todos los perfiles"
  ON profesores FOR SELECT
  USING (EXISTS (SELECT 1 FROM profesores p WHERE p.user_id = auth.uid() AND p.rol = 'admin'));

-- RLS UPDATE en materias para profesores
CREATE POLICY "Profesor edita su materia"
  ON materias FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profesores p WHERE p.user_id = auth.uid() AND p.materia_id = materias.id))
  WITH CHECK (EXISTS (SELECT 1 FROM profesores p WHERE p.user_id = auth.uid() AND p.materia_id = materias.id));
CREATE POLICY "Admin edita cualquier materia"
  ON materias FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profesores p WHERE p.user_id = auth.uid() AND p.rol = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profesores p WHERE p.user_id = auth.uid() AND p.rol = 'admin'));

-- Profesor puede leer todas las materias activas (ya existe policy SELECT para anon)
-- Admin puede leer todas
CREATE POLICY "Autenticado lee materias"
  ON materias FOR SELECT
  USING (auth.role() = 'authenticated');

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('clases-apoyo', 'clases-apoyo', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Profesor sube imágenes de su materia"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'clases-apoyo'
    AND EXISTS (
      SELECT 1 FROM profesores p
      JOIN materias m ON p.materia_id = m.id
      WHERE p.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.slug
    )
  );
CREATE POLICY "Cualquiera lee imágenes de clases"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'clases-apoyo');
CREATE POLICY "Profesor borra imágenes de su materia"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'clases-apoyo'
    AND EXISTS (
      SELECT 1 FROM profesores p
      JOIN materias m ON p.materia_id = m.id
      WHERE p.user_id = auth.uid()
      AND (storage.foldername(name))[1] = m.slug
    )
  );
CREATE POLICY "Admin sube cualquier imagen"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'clases-apoyo'
    AND EXISTS (SELECT 1 FROM profesores p WHERE p.user_id = auth.uid() AND p.rol = 'admin')
  );
CREATE POLICY "Admin borra cualquier imagen"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'clases-apoyo'
    AND EXISTS (SELECT 1 FROM profesores p WHERE p.user_id = auth.uid() AND p.rol = 'admin')
  );
```

Aplicar con: `mcp__supabase__execute_sql` o `mcp__supabase__apply_migration`

**Step 2: Crear cuenta admin (tu cuenta)**

```sql
-- Después de crear el usuario en Supabase Auth (email: kiamchomi@gmail.com)
-- Insertar en profesores con rol admin
INSERT INTO profesores (user_id, rol) VALUES ('<tu-auth-uid>', 'admin');
```

**Step 3: Crear cuentas de los 6 profesores**

Usar Supabase Auth API o dashboard para crear usuarios con email/password para cada profesor, luego vincular en tabla `profesores`.

---

### Task 2: Supabase client con auth — `lib/supabase-auth.ts`

**Files:**
- Create: `lib/supabase-auth.ts`

**Step 1: Crear cliente browser-side con persistencia de sesión**

```typescript
import { createBrowserClient } from '@supabase/ssr';

export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Instalar: `npm install @supabase/ssr`

---

### Task 3: Página de login — `/admin/login`

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/admin.css`

**Step 1: Crear página de login**

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Email o contraseña incorrectos');
      setLoading(false);
      return;
    }
    router.push('/admin/clases-apoyo');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-deep-dark-bg)' }}>
      <form onSubmit={handleLogin} className="w-full max-w-sm p-8 rounded-2xl" style={{ background: 'var(--color-card-bg)' }}>
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Panel Profesores</h1>
        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-[#0f2825] text-white border border-[#00c7b1]/20 mb-3 outline-none focus:border-[#00c7b1]" />
        <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-[#0f2825] text-white border border-[#00c7b1]/20 mb-4 outline-none focus:border-[#00c7b1]" />
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-lg font-bold text-white bg-[#00c7b1] hover:bg-[#00b3a0] disabled:opacity-50 transition">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
```

---

### Task 4: Layout admin con auth guard — `/admin/layout.tsx`

**Files:**
- Create: `app/admin/layout.tsx`

**Step 1: Layout que verifica sesión**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    // Login page doesn't need auth check
    if (pathname === '/admin/login') { setReady(true); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/admin/login');
      else setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/admin/login');
    });
    return () => subscription.unsubscribe();
  }, [pathname, router, supabase.auth]);

  if (!ready && pathname !== '/admin/login') {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-deep-dark-bg)' }}>
      <div className="text-[#7ca19b]">Cargando...</div>
    </div>;
  }

  return <>{children}</>;
}
```

---

### Task 5: Panel principal — `/admin/clases-apoyo/page.tsx`

**Files:**
- Create: `app/admin/clases-apoyo/page.tsx`

Componente principal que:
1. Carga el perfil del profesor (tabla `profesores`) para saber rol y materia asignada
2. Si es **admin**: muestra todas las materias en tabs
3. Si es **profesor**: muestra solo su materia
4. Para cada materia muestra 4 secciones editables:
   - **Descripción** (3 bullets, textarea con HTML básico)
   - **Imágenes** (preview + subir/reemplazar, máximo 2)
   - **Bloquear días** (calendario similar al del frontend público, click para bloquear/desbloquear)
   - **Bloquear horarios** (pills de horas, click para bloquear/desbloquear)

El panel usa los mismos colores y fuentes que el sitio.

**Secciones del editor:**

```
┌─────────────────────────────────────┐
│  [Matemática] [Lengua] [Comp...]    │  ← tabs (admin ve todas, profe ve 1)
├─────────────────────────────────────┤
│  📝 Descripción                     │
│  ┌───────────────────────────────┐  │
│  │ Bullet 1 (textarea)          │  │
│  │ Bullet 2 (textarea)          │  │
│  │ Bullet 3 (textarea)          │  │
│  │ [+ Agregar] [Guardar]        │  │
│  └───────────────────────────────┘  │
│                                     │
│  🖼️ Imágenes                        │
│  ┌──────┐  ┌──────┐                 │
│  │ img1 │  │ img2 │  [Subir]        │
│  └──────┘  └──────┘                 │
│                                     │
│  📅 Días Bloqueados                 │
│  [Calendario 3 semanas — click]     │
│                                     │
│  🕐 Horarios Bloqueados             │
│  [14:00] [15:00] [16:00] ...        │
│  (click para bloquear/desbloquear)  │
│                                     │
│  [Cerrar sesión]                    │
└─────────────────────────────────────┘
```

---

### Task 6: Integrar bloqueos en frontend público

**Files:**
- Modify: `app/clases-apoyo/page.tsx` — incluir `dias_bloqueados` y `horarios_bloqueados` en el SELECT
- Modify: `components/clases-apoyo/clases-apoyo-page.tsx`:
  - Agregar `dias_bloqueados` y `horarios_bloqueados` a `MateriaDB`
  - En el calendario, marcar días bloqueados como no-clickeables (mismo estilo que `past`)
  - En las pills de horarios, deshabilitar los bloqueados
  - Mostrar indicador visual "No disponible" en días/horarios bloqueados

---

### Task 7: Migrar imágenes de clases a Supabase Storage

**Files:**
- Modify: `app/admin/clases-apoyo/page.tsx` — upload via `supabase.storage.from('clases-apoyo').upload()`
- Modify: `components/clases-apoyo/clases-apoyo-page.tsx` — usar URLs de Storage en vez de paths locales

Las imágenes actuales están en `imagenes` (jsonb array de paths locales). Migrar a URLs de Supabase Storage para que los profesores puedan subir desde el panel sin acceso al repo.

---

### Task 8: Crear cuentas de profesores

Crear 6 cuentas en Supabase Auth y vincular en tabla `profesores`:

| Profesor | Materia | Rol |
|----------|---------|-----|
| kiamchomi@gmail.com | — | admin |
| (email Liliana) | Matemática | profesor |
| (email Julieta) | Lengua | profesor |
| (email Matías) | Computación | profesor |
| (email prof Inglés) | Inglés | profesor |
| (email Gabriela) | Arte | profesor |
| (email prof Secundario) | Apoyo Secundario | profesor |

**Nota:** Necesitamos los emails reales de cada profesor para crear las cuentas.

---

### Task 9: Notificación al admin cuando un profesor hace cambios

**Files:**
- Modify: Edge Function `notificar` — agregar handler para UPDATE en `materias`

Opcional: cuando un profesor modifica su materia, notificar al admin (email/telegram) con los cambios.

---

## Orden de ejecución

1. **Task 1** — Migración DB (base de todo)
2. **Task 2** — Cliente Supabase con auth
3. **Task 3** — Login page
4. **Task 4** — Layout con auth guard
5. **Task 5** — Panel principal (el más grande)
6. **Task 6** — Integrar bloqueos en frontend público
7. **Task 7** — Migrar imágenes a Storage
8. **Task 8** — Crear cuentas (necesita emails reales)
9. **Task 9** — Notificaciones (opcional)

## Dependencias externas

- Emails de los 6 profesores para crear cuentas
- `npm install @supabase/ssr` para manejo de auth en browser
