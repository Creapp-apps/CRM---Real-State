'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';
import AdminSelect from '@/components/admin/AdminSelect';
import { supabase } from '@/lib/supabase';
import { fetchMessagesTasacion } from '@/lib/admin-fetchers';

export default function AdminTasaciones() {
  const { data: tasaciones = [], isLoading: loading, mutate } = useSWR('messages-tasacion', fetchMessagesTasacion);
  const [selected, setSelected] = useState(null);

  const getStatus = (t) => {
    if (t.is_archived) return 'completed';
    if (t.is_read) return 'in-progress';
    return 'pending';
  };

  const handleStatusChange = async (id, newStatus) => {
    const updates =
      newStatus === 'pending'     ? { is_read: false, is_archived: false } :
      newStatus === 'in-progress' ? { is_read: true,  is_archived: false } :
                                    { is_read: true,  is_archived: true  };

    mutate(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t), false);
    if (selected?.id === id) setSelected(prev => ({ ...prev, ...updates }));
    await supabase.from('messages').update(updates).eq('id', id);
  };

  const statusLabels = { 'pending': 'Pendiente', 'in-progress': 'En proceso', 'completed': 'Completada' };
  const statusColors = { 'pending': 'Yellow', 'in-progress': 'Blue', 'completed': 'Green' };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Solicitudes de Tasación</h2>
          <p className={styles.pageSubtitle}>
            {loading ? 'Cargando...' : `${tasaciones.filter(t => getStatus(t) === 'pending').length} pendientes`}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Solicitante</th>
                <th>Tipo y Zona</th>
                <th>Dirección</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem', color: 'var(--gray-500)'}}>Cargando solicitudes...</td></tr>
              ) : tasaciones.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem', color: 'var(--gray-500)'}}>No hay tasaciones registradas</td></tr>
              ) : (
                tasaciones.map(t => {
                  const status = getStatus(t);
                  return (
                    <tr key={t.id} onClick={() => setSelected(t)} style={{ cursor: 'pointer', background: selected?.id === t.id ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                      <td>
                        <div style={{ color: 'var(--white)', fontWeight: 500 }}>{t.full_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{t.phone || t.email}</div>
                      </td>
                      <td>
                        <div style={{ color: 'var(--white)' }}>{t.property_type || '-'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{t.property_neighborhood || '-'}</div>
                      </td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.property_address || '-'}</td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--gray-500)' }}>{formatDate(t.created_at)}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[`badge${statusColors[status]}`]}`}>
                          {statusLabels[status]}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--white)', fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>Detalle de Tasación</h3>
              <button onClick={() => setSelected(null)} className={styles.btnIcon}>
                <Icon name="x" size={14} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Nombre</span><div style={{ color: 'var(--white)', marginTop: '0.25rem' }}>{selected.full_name}</div></div>
                <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Email</span><div style={{ color: 'var(--admin-gold)', marginTop: '0.25rem' }}>{selected.email}</div></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Tipo</span><div style={{ color: 'var(--white)', marginTop: '0.25rem' }}>{selected.property_type || '-'}</div></div>
                <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Barrio/Zona</span><div style={{ color: 'var(--white)', marginTop: '0.25rem' }}>{selected.property_neighborhood || '-'}</div></div>
              </div>
              <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Dirección</span><div style={{ color: 'var(--white)', marginTop: '0.25rem' }}>{selected.property_address || '-'}</div></div>
              <div><span style={{ color: 'var(--gray-500)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Mensaje ADICIONAL</span><div style={{ color: 'var(--gray-300)', marginTop: '0.25rem', lineHeight: 1.6 }}>{selected.message || 'Sin observaciones.'}</div></div>
            </div>
            <div className={styles.formGroup} style={{ marginTop: 'auto' }}>
              <label className={styles.formLabel}>Cambiar Estado</label>
              <AdminSelect
                value={getStatus(selected)}
                onChange={(val) => handleStatusChange(selected.id, val)}
                options={[
                  { value: 'pending', label: 'Pendiente' },
                  { value: 'in-progress', label: 'En proceso' },
                  { value: 'completed', label: 'Completada' },
                ]}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <a href={`mailto:${selected.email}?subject=Tasación Cardoso Propiedades — ${selected.property_address || selected.property_neighborhood}`} className={styles.btnPrimary}>
                Contactar Cliente
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
