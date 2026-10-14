import Link from 'next/link';
import styles from '@/components/admin/admin.module.css';
import Icon from '@/components/admin/Icon';
import { supabase } from '@/lib/supabase';

const ICONS = {
  home: <Icon name="home" size={22} />,
  building: <Icon name="building" size={22} />,
  mail: <Icon name="mail" size={22} />,
  file: <Icon name="file-text" size={22} />,
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
          <Icon name="home" size={16} />
          Gestionar Propiedades
        </Link>
        <Link href="/admin/emprendimientos/nuevo" className={styles.btnSecondary}>
          <Icon name="plus" size={16} />
          Nuevo Emprendimiento
        </Link>
        <Link href="/admin/contenido" className={styles.btnSecondary}>
          <Icon name="edit" size={16} />
          Editar Contenido
        </Link>
      </div>
    </>
  );
}
