'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';
import { fetchDevelopments } from '@/lib/admin-fetchers';

export default function AdminEmprendimientos() {
  const { data: developments = [], isLoading: loading, mutate } = useSWR('developments', fetchDevelopments);
  const [search, setSearch] = useState('');

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este emprendimiento?')) return;
    mutate(prev => prev.filter(d => d.id !== id), false);
    await supabase.from('developments').delete().eq('id', id);
  }

  const filtered = developments.filter(d =>
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.location?.toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_LABEL = { active: 'Activo', draft: 'Borrador', sold_out: 'Vendido' };
  const STATUS_BADGE = { active: styles.badgeGreen, draft: styles.badgeGray, sold_out: styles.badgeBlue };

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
            <input
              placeholder="Buscar emprendimientos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
            {loading ? 'Cargando...' : `${filtered.length} emprendimiento${filtered.length !== 1 ? 's' : ''}`}
          </span>
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
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                  Cargando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                  No hay emprendimientos.{' '}
                  <Link href="/admin/emprendimientos/nuevo" style={{ color: 'var(--admin-gold)' }}>
                    Crear el primero
                  </Link>
                </td>
              </tr>
            ) : (
              filtered.map(d => (
                <tr key={d.id}>
                  <td style={{ color: 'var(--white)', fontWeight: 500 }}>{d.title}</td>
                  <td style={{ color: 'var(--gray-300)' }}>{d.location}</td>
                  <td style={{ color: 'var(--gray-300)' }}>{d.total_units || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden', maxWidth: 80 }}>
                        <div style={{ height: '100%', width: `${d.progress || 0}%`, background: 'var(--admin-gold)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{d.progress || 0}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${STATUS_BADGE[d.status] || styles.badgeGray}`}>
                      {STATUS_LABEL[d.status] || d.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link href={`/admin/emprendimientos/${d.id}`} className={styles.btnIcon} title="Editar">
                        <Icon name="edit" size={14} />
                      </Link>
                      <button className={styles.btnIcon} title="Eliminar" onClick={() => handleDelete(d.id)}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
