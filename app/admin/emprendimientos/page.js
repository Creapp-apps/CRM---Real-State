'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';

const MOCK_DEVELOPMENTS = [
  { id: 'river-park-towers', title: 'River Park Towers', location: 'Puerto Madero', units: 120, status: 'active', progress: 75 },
  { id: 'villa-devoto-green', title: 'Villa Devoto Green', location: 'Villa Devoto', units: 48, status: 'active', progress: 40 },
  { id: 'nordelta-bay', title: 'Nordelta Bay Residences', location: 'Nordelta', units: 200, status: 'draft', progress: 10 },
];

export default function AdminEmprendimientos() {
  const [search, setSearch] = useState('');
  const filtered = MOCK_DEVELOPMENTS.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Emprendimientos</h2>
          <p className={styles.pageSubtitle}>Gestión completa de proyectos</p>
        </div>
        <Link href="/admin/emprendimientos/nuevo" className={styles.btnPrimary}>
          <Icon name="plus" size={16} />
          Nuevo Emprendimiento
        </Link>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div className={styles.searchBar}>
            <Icon name="search" size={16} />
            <input placeholder="Buscar emprendimientos..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Emprendimiento</th>
              <th>Ubicación</th>
              <th>Unidades</th>
              <th>Avance</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td style={{ color: 'var(--white)', fontWeight: 500 }}>{d.title}</td>
                <td>{d.location}</td>
                <td>{d.units}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', maxWidth: 80 }}>
                      <div style={{ height: '100%', width: `${d.progress}%`, background: 'var(--admin-gold)', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{d.progress}%</span>
                  </div>
                </td>
                <td>
                  <span className={`${styles.badge} ${d.status === 'active' ? styles.badgeGreen : styles.badgeGray}`}>
                    {d.status === 'active' ? 'Activo' : 'Borrador'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/admin/emprendimientos/${d.id}`} className={styles.btnIcon} title="Editar">
                      <Icon name="edit" size={14} />
                    </Link>
                    <button className={styles.btnIcon} title="Eliminar">
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
