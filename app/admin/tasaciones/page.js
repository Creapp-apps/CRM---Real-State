'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Icon from '@/components/admin/Icon';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';
import { fetchTasaciones } from '@/lib/admin-fetchers';
import { ESTADO_TASACION, formatUSD } from '@/lib/tasacion-engine';

export default function AdminTasaciones() {
  const router = useRouter();
  const { data: tasaciones = [], isLoading: loading } = useSWR('tasaciones', fetchTasaciones);
  const [creando, setCreando] = useState(false);

  const pendientes = tasaciones.filter(t => (t.estado || 'solicitada') === 'solicitada').length;

  const crearTasacion = async () => {
    setCreando(true);
    const { data, error } = await supabase
      .from('tasaciones')
      .insert({ origen: 'admin', estado: 'en_proceso', tipo_propiedad: 'Departamento', zona: 'CABA - Otros' })
      .select('id')
      .single();
    setCreando(false);
    if (error) { alert('Error al crear la tasación: ' + error.message); return; }
    router.push(`/admin/tasaciones/${data.id}`);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <>
      <div className={styles.pageHeader} style={{ alignItems: 'center' }}>
        <div>
          <h2 className={styles.pageTitle}>Solicitudes de Tasación</h2>
          <p className={styles.pageSubtitle}>
            {loading ? 'Cargando…' : `${pendientes} pendiente${pendientes === 1 ? '' : 's'} · ${tasaciones.length} en total`}
          </p>
        </div>
        <button className={styles.btnPrimary} onClick={crearTasacion} disabled={creando}>
          <Icon name="plus" size={16} /> {creando ? 'Creando…' : 'Crear nueva tasación'}
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Solicitante</th>
              <th>Tipo y Zona</th>
              <th>Dirección</th>
              <th>Valor estimado</th>
              <th>Fecha</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Cargando solicitudes…</td></tr>
            ) : tasaciones.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>No hay tasaciones registradas</td></tr>
            ) : (
              tasaciones.map(t => {
                const meta = ESTADO_TASACION[t.estado] || ESTADO_TASACION.solicitada;
                return (
                  <tr key={t.id} onClick={() => router.push(`/admin/tasaciones/${t.id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ color: 'var(--white)', fontWeight: 500 }}>{t.full_name || 'Sin nombre'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{t.phone || t.email || '—'}</div>
                    </td>
                    <td>
                      <div style={{ color: 'var(--white)' }}>{t.tipo_propiedad || '—'}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>{t.zona || t.barrio || '—'}</div>
                    </td>
                    <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.direccion || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap', color: t.valor_estimado_usd ? 'var(--admin-gold)' : 'var(--gray-600)', fontWeight: 600 }}>
                      {t.valor_estimado_usd ? formatUSD(t.valor_estimado_usd) : '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--gray-500)' }}>{formatDate(t.created_at)}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge${meta.color}`]}`}>{meta.label}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
