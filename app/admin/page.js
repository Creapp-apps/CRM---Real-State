import Link from 'next/link';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

const ICONS = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  building: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="10" y2="6" /><line x1="14" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="10" y2="10" /><line x1="14" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="10" y2="14" /><line x1="14" y1="14" x2="16" y2="14" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  ),
  mail: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  file: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

export default async function AdminDashboard() {
  // Fetch stats concurrently
  const [
    { count: propertiesCount },
    { count: newContactsCount },
    { count: pendingValuationsCount },
    { data: recentActivity }
  ] = await Promise.all([
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('message_type', 'contacto').eq('is_read', false),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('message_type', 'tasacion').eq('is_read', false),
    supabase.from('messages').select('id, full_name, message_type, property_neighborhood, created_at, is_read')
      .order('created_at', { ascending: false })
      .limit(5)
  ]);

  const STATS = [
    { label: 'Propiedades Activas', value: propertiesCount || 0, icon: 'home', color: 'Blue' },
    { label: 'Emprendimientos', value: '0', icon: 'building', color: 'Green' }, // To be implemented
    { label: 'Nuevos Contactos', value: newContactsCount || 0, icon: 'mail', color: 'Gold' },
    { label: 'Tasaciones Pendientes', value: pendingValuationsCount || 0, icon: 'file', color: 'Purple' },
  ];

  // Helper formatting for timeframe (simplified)
  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  };

  return (
    <>
      {/* Stats */}
      <div className={styles.statsGrid}>
        {STATS.map((stat) => (
          <div key={stat.label} className={styles.statCard}>
            <div className={`${styles.statIconWrap} ${styles[`statIcon${stat.color}`]}`}>
              {ICONS[stat.icon]}
            </div>
            <div className={styles.statInfo}>
              <h3>{stat.label}</h3>
              <p>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Actividad Reciente</h2>
          <Link href="/admin/contacto" className={styles.btnSecondary}>
            Ver todo
          </Link>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Actividad</th>
              <th>Estado</th>
              <th>Tiempo</th>
            </tr>
          </thead>
          <tbody>
            {!recentActivity || recentActivity.length === 0 ? (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '2rem' }}>
                  Aún no hay mensajes recientes
                </td>
              </tr>
            ) : (
              recentActivity.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.message_type === 'contacto' 
                      ? `Nuevo mensaje de ${item.full_name}`
                      : `Tasación — ${item.property_neighborhood || 'Sin zona especificada'} (${item.full_name})`}
                  </td>
                  <td>
                    <span 
                      className={`${styles.badge} ${item.is_read ? styles.badgeGray : (item.message_type === 'tasacion' ? styles.badgeYellow : styles.badgeGreen)}`}
                    >
                      {item.is_read ? 'Leído' : 'Nuevo'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--gray-500)' }}>{formatTimeAgo(item.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <Link href="/admin/propiedades" className={styles.btnPrimary}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
          Gestionar Propiedades
        </Link>
        <Link href="/admin/emprendimientos/nuevo" className={styles.btnSecondary}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo Emprendimiento
        </Link>
        <Link href="/admin/contenido" className={styles.btnSecondary}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Editar Contenido
        </Link>
      </div>
    </>
  );
}
