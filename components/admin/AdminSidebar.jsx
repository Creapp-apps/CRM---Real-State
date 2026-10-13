'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './Icon';
import styles from './admin.module.css';

const NAV_ITEMS = [
  {
    section: 'General',
    items: [
      { label: 'Dashboard', href: '/admin', icon: 'dashboard' },
    ],
  },
  {
    section: 'Gestión',
    items: [
      { label: 'Propiedades', href: '/admin/propiedades', icon: 'building' },
      { label: 'Emprendimientos', href: '/admin/emprendimientos', icon: 'layers' },
      { label: 'Contenido', href: '/admin/contenido', icon: 'edit' },
      { label: 'Media', href: '/admin/media', icon: 'image' },
    ],
  },
  {
    section: 'Administraciones',
    items: [
      { label: 'Panel', href: '/admin/administraciones', icon: 'grid' },
      { label: 'Clientes', href: '/admin/administraciones/clientes', icon: 'users' },
      { label: 'Contratos', href: '/admin/administraciones/contratos', icon: 'file-text' },
      { label: 'Inmuebles', href: '/admin/administraciones/inmuebles', icon: 'home' },
    ],
  },
  {
    section: 'Herramientas',
    items: [
      { label: 'Pipeline', href: '/admin/pipeline', icon: 'activity' },
      { label: 'Tasador', href: '/admin/tasador', icon: 'dollar' },
    ],
  },
  {
    section: 'Comunicación',
    items: [
      { label: 'Contacto', href: '/admin/contacto', badge: 3, icon: 'message' },
      { label: 'Tasaciones', href: '/admin/tasaciones', badge: 2, icon: 'clipboard' },
    ],
  },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
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
            <div key={section.section} className={styles.navSection}>
              <div className={styles.navSectionTitle}>{section.section}</div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}
                  onClick={onClose}
                >
                  <span className={styles.navIcon}><Icon name={item.icon} size={20} /></span>
                  {item.label}
                  {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
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
