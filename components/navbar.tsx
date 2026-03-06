'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { WhatsAppIcon, FacebookIcon, InstagramIcon } from './icons';

const NAV_LINKS = [
  { href: '/', label: 'INICIO/CARRERAS' },
  { href: '/clases-apoyo', label: 'Clases de Apoyo' },
  { href: '/novedades/1', label: 'Novedades' },
  { href: '/sobre-nosotros', label: 'Sobre Nosotros' },
  { href: '/faq', label: 'Preguntas Frecuentes' },
  { href: '/contactos', label: 'Contacto' },
];

const SOCIALS = [
  { href: 'https://wa.me/5491166522722', label: 'WhatsApp', Icon: WhatsAppIcon, cssClass: 'social-whatsapp' },
  { href: 'https://www.facebook.com/ceducativovillalugano/', label: 'Facebook', Icon: FacebookIcon, cssClass: 'social-facebook' },
  { href: 'https://www.instagram.com/centroeducativovillalugano/', label: 'Instagram', Icon: InstagramIcon, cssClass: 'social-instagram' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu(); };
    const handleClick = () => closeMenu();
    document.addEventListener('keydown', handleKey);
    document.addEventListener('click', handleClick);
    document.body.classList.add('overflow-hidden');
    document.documentElement.classList.add('overflow-hidden');
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('click', handleClick);
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, [menuOpen, closeMenu]);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/novedades')) return pathname.startsWith('/novedades');
    return pathname === href;
  }

  return (
    <nav className="main-navbar">
      <div className="navbar-container">
        {/* Mobile toggle */}
        <button
          className="mobile-menu-btn"
          aria-label="Abrir menu de navegacion"
          aria-expanded={menuOpen}
          onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <line x1="4" y1="7" x2="20" y2="7" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="12" x2="20" y2="12" strokeWidth="2" strokeLinecap="round" />
            <line x1="4" y1="17" x2="20" y2="17" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Mobile branding */}
        <div className="flex lg:hidden flex-1 items-center min-w-0">
          <h1 className="flex-1 text-center text-2xl whitespace-nowrap" style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 600, color: 'white', lineHeight: 1 }}>
            CAU <span style={{ fontFamily: "'Unbounded',sans-serif", color: '#00c7b1' }}>Siglo 21</span>
          </h1>
        </div>

        {/* Menu */}
        <div className={`navbar-menu${menuOpen ? ' active' : ''}`} role="dialog" aria-label="Menu de navegacion" onClick={(e) => e.stopPropagation()}>
          <div className="menu-header lg:hidden">
            <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontSize: '1.875rem', fontWeight: 600, color: 'white', lineHeight: 1 }}>
              CAU <span style={{ fontFamily: "'Unbounded',sans-serif", color: '#00c7b1' }}>Siglo 21</span>
            </h2>
            <button className="menu-close-btn" aria-label="Cerrar menu" onClick={closeMenu}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`navbar-link${isActive(href) ? ' active' : ''}`}
              onClick={closeMenu}
            >
              {label}
            </Link>
          ))}

          <div className="menu-footer lg:hidden">
            <div className="menu-footer-social" style={{ justifyContent: 'center' }}>
              {SOCIALS.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener" aria-label={label}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop socials */}
        <div className="navbar-social hidden lg:flex items-center flex-shrink-0" style={{ marginLeft: 8, alignSelf: 'stretch' }}>
          {SOCIALS.map(({ href, label, Icon, cssClass }) => (
            <a key={label} href={href} target="_blank" rel="noopener" aria-label={label} className={`navbar-social-icon ${cssClass}`}>
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
