'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: 'Precios',
    href: '/admin/precios',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Clases de Apoyo',
    href: '/admin/clases-apoyo',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    ),
  },
  {
    label: 'Alumnos',
    href: '/admin/alumnos',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013 17.16V15.87a4.5 4.5 0 018.243-2.664M12.75 7.5a3 3 0 11-6 0 3 3 0 016 0zm8.25 2.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
];

// Fixed icon column width — all items use this to stay centered
const ICON_W = 48;
const EXPANDED_W = 200;
const COLLAPSED_W = ICON_W;

export default function AdminSidebar() {
  const [expanded, setExpanded] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  return (
    <nav
      className="sticky top-0 h-screen flex flex-col shrink-0 border-r z-30"
      style={{
        width: expanded ? EXPANDED_W : COLLAPSED_W,
        transition: 'width 200ms ease',
        background: 'var(--admin-card)',
        borderColor: 'var(--admin-border)',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo row */}
      <div
        className="flex items-center border-b shrink-0"
        style={{ height: 48, borderColor: 'var(--admin-border)' }}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: ICON_W, height: 48 }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
            style={{ background: 'var(--admin-accent)' }}
          >
            A
          </div>
        </div>
        <span
          className="text-sm font-bold text-white whitespace-nowrap transition-opacity duration-150"
          style={{ opacity: expanded ? 1 : 0 }}
        >
          Admin
        </span>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map(item => {
          const active = isActive(item.href);
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex items-center cursor-pointer transition-colors duration-150 relative"
              style={{
                height: 40,
                color: active ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                background: active ? 'var(--admin-accent-glow)' : 'transparent',
              }}
              title={item.label}
            >
              {/* Active indicator bar */}
              {active && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                  style={{ width: 3, height: 20, background: 'var(--admin-accent)' }}
                />
              )}
              {/* Icon — always centered in ICON_W */}
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: ICON_W }}
              >
                {item.icon}
              </div>
              {/* Label */}
              <span
                className="text-[13px] font-medium whitespace-nowrap transition-opacity duration-150"
                style={{ opacity: expanded ? 1 : 0 }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div className="border-t py-2" style={{ borderColor: 'var(--admin-border)' }}>
        <button
          onClick={logout}
          className="flex items-center cursor-pointer transition-colors duration-150 w-full hover:text-red-400"
          style={{ height: 40, color: 'var(--admin-text-dimmed)' }}
          title="Cerrar sesión"
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: ICON_W }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </div>
          <span
            className="text-[13px] font-medium whitespace-nowrap transition-opacity duration-150"
            style={{ opacity: expanded ? 1 : 0 }}
          >
            Cerrar sesión
          </span>
        </button>
      </div>
    </nav>
  );
}
