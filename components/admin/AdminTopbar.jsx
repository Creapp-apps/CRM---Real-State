'use client';

import Icon from './Icon';
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
          <Icon name="menu" size={22} />
        </button>
        <h1 className={styles.topbarTitle}>{title}</h1>
      </div>

      <div className={styles.topbarRight}>
        <button className={styles.topbarBtn} title="Notificaciones">
          <Icon name="bell" size={18} />
        </button>
        <div className={styles.topbarUser}>
          <div className={styles.topbarAvatar}>MC</div>
          <span className={styles.topbarUserName}>Mónica</span>
        </div>
      </div>
    </header>
  );
}
