'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Icon from './Icon';
import styles from './admin.module.css';

// Pre-computa qué hrefs tienen hijos en el nav para usar exact-match en ellos
const ALL_HREFS_FLAT = [];
const _RAW_NAV = [
  { section: null, items: [{ href: '/admin' }] },
  { section: 'Cartera', items: [{ href: '/admin/propiedades' }, { href: '/admin/emprendimientos' }] },
  { section: 'Clientes', items: [{ href: '/admin/contacto' }, { href: '/admin/tasaciones' }, { href: '/admin/administraciones/clientes' }] },
  { section: 'Operaciones', items: [{ href: '/admin/pipeline' }, { href: '/admin/administraciones/contratos' }, { href: '/admin/administraciones' }] },
  { section: 'Herramientas', items: [{ href: '/admin/tasador' }] },
  { section: 'Contenido', items: [{ href: '/admin/contenido' }, { href: '/admin/media' }] },
];
_RAW_NAV.forEach(s => s.items.forEach(i => ALL_HREFS_FLAT.push(i.href)));
const PARENT_HREFS = new Set(
  ALL_HREFS_FLAT.filter(h => ALL_HREFS_FLAT.some(other => other !== h && other.startsWith(h + '/')))
);

const NAV_ITEMS = [
  {
    section: null,
    items: [
      { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
    ],
  },
  {
    section: 'Cartera',
    items: [
      { label: 'Propiedades', href: '/admin/propiedades', icon: 'building' },
      { label: 'Emprendimientos', href: '/admin/emprendimientos', icon: 'layers' },
    ],
  },
  {
    section: 'Clientes',
    items: [
      { label: 'Consultas', href: '/admin/contacto', icon: 'message' },
      { label: 'Tasaciones', href: '/admin/tasaciones', icon: 'clipboard' },
      { label: 'Clientes', href: '/admin/administraciones/clientes', icon: 'users' },
    ],
  },
  {
    section: 'Operaciones',
    items: [
      { label: 'Pipeline', href: '/admin/pipeline', icon: 'activity' },
      { label: 'Contratos', href: '/admin/administraciones/contratos', icon: 'file-text' },
      { label: 'Administración', href: '/admin/administraciones', icon: 'home' },
    ],
  },
  {
    section: 'Herramientas',
    items: [
      { label: 'Tasador', href: '/admin/tasador', icon: 'dollar' },
    ],
  },
  {
    section: 'Contenido',
    items: [
      { label: 'Sitio web', href: '/admin/contenido', icon: 'edit' },
      { label: 'Media', href: '/admin/media', icon: 'image' },
    ],
  },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [badges, setBadges] = useState({ consultas: null, tasaciones: null });

  useEffect(() => {
    async function fetchBadges() {
      const [{ count: c1 }, { count: c2 }] = await Promise.all([
        supabase.from('messages').select('id', { count: 'exact', head: true })
          .eq('message_type', 'contacto').eq('is_read', false).eq('is_archived', false),
        supabase.from('tasaciones').select('id', { count: 'exact', head: true })
          .eq('estado', 'solicitada'),
      ]);
      setBadges({ consultas: c1 || 0, tasaciones: c2 || 0 });
    }
    fetchBadges();
  }, [pathname]);

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    if (PARENT_HREFS.has(href)) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  const getBadge = (href) => {
    if (href === '/admin/contacto') return badges.consultas || null;
    if (href === '/admin/tasaciones') return badges.tasaciones || null;
    return null;
  };

  return (
    <>
      {isOpen && (
        <div className={styles.mobileOverlay} onClick={onClose} />
      )}
      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <Link href="/admin" className={styles.sidebarLogo}>
          <div className={styles.topbarAvatar}>MC</div>
          <div className={styles.sidebarLogoText}>
            Cardoso Propiedades
            <span>Panel Admin</span>
          </div>
        </Link>

        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map((section) => (
            <div key={section.section ?? '_top'} className={styles.navSection}>
              {section.section && <div className={styles.navSectionTitle}>{section.section}</div>}
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}
                  onClick={onClose}
                >
                  <span className={styles.navIcon}><Icon name={item.icon} size={20} /></span>
                  {item.label}
                  {getBadge(item.href) > 0 && <span className={styles.navBadge}>{getBadge(item.href)}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.sidebarVisitSite} target="_blank">
            <Icon name="external-link" size={14} />
            Ver sitio web
          </Link>
        </div>
      </aside>
    </>
  );
}
