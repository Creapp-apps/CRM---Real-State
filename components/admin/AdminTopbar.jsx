'use client';

import styles from './admin.module.css';

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/propiedades': 'Propiedades',
  '/admin/emprendimientos': 'Emprendimientos',
  '/admin/contenido': 'Personalización Web',
  '/admin/media': 'Galería de Media',
  '/admin/administraciones/clientes': 'Clientes',
  '/admin/administraciones/contratos': 'Contratos',
  '/admin/administraciones/inmuebles': 'Inmuebles',
  '/admin/administraciones': 'Administraciones',
  '/admin/pipeline': 'Pipeline de Operaciones',
  '/admin/tasador': 'Tasador Online',
  '/admin/contacto': 'Mensajes de Contacto',
  '/admin/tasaciones': 'Solicitudes de Tasación',
};

export default function AdminTopbar({ pathname, onToggleSidebar }) {
  // Elegir el match más largo (ej. .../clientes gana sobre .../administraciones).
  const match = Object.keys(PAGE_TITLES)
    .filter((p) => pathname === p || (p !== '/admin' && pathname.startsWith(p)))
    .sort((a, b) => b.length - a.length)[0];
  const title = match ? PAGE_TITLES[match] : 'Admin';

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarLeft}>
        <button className={styles.hamburger} onClick={onToggleSidebar} aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className={styles.topbarTitle}>{title}</h1>
      </div>

      <div className={styles.topbarRight}>
        <button className={styles.topbarBtn} title="Notificaciones">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
        <div className={styles.topbarUser}>
          <div className={styles.topbarAvatar}>MC</div>
          <span className={styles.topbarUserName}>Mónica</span>
        </div>
      </div>
    </header>
  );
}
