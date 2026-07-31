'use client';

import { useState } from 'react';
import Link from 'next/link';
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nuevo Emprendimiento
        </Link>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <div className={styles.searchBar}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
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
                      <div style={{ height: '100%', width: `${d.progress}%`, background: 'var(--gold)', borderRadius: 3 }} />
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </Link>
                    <button className={styles.btnIcon} title="Eliminar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
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
