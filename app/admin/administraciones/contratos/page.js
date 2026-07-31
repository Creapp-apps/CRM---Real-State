'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';
import ContratoModal from '@/components/admin/administraciones/ContratoModal';

const ESTADO_BADGE = {
  activo: styles.badgeGreen,
  proximo_a_vencer: styles.badgeYellow,
  vencido: styles.badgeRed,
  rescindido: styles.badgeGray,
};

const ESTADO_LABEL = {
  activo: 'Activo',
  proximo_a_vencer: 'Próx. vencer',
  vencido: 'Vencido',
  rescindido: 'Rescindido',
};

export default function ContratosPage() {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchContratos = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('contratos')
      .select('*, locador:clientes!contratos_locador_id_fkey(nombre), locatario:clientes!contratos_locatario_id_fkey(nombre), inmueble:inmuebles_administrados!contratos_inmueble_id_fkey(direccion)')
      .order('created_at', { ascending: false });

    if (filterEstado !== 'todos') {
      query = query.eq('estado', filterEstado);
    }

    const { data, error } = await query;
    if (!error && data) setContratos(data);
    setLoading(false);
  }, [filterEstado]);

  useEffect(() => { fetchContratos(); }, [fetchContratos]);

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleNew = () => { setEditData(null); setModalOpen(true); };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este contrato?')) return;
    const { error } = await supabase.from('contratos').delete().eq('id', id);
    if (error) return alert('Error: ' + error.message);
    fetchContratos();
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Contratos</h2>
          <p className={styles.pageSubtitle}>Gestión de contratos de locación</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Cargar Contrato
        </button>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        {['todos', 'activo', 'proximo_a_vencer', 'vencido', 'rescindido'].map(t => (
          <button
            key={t}
            className={`${styles.filterTab} ${filterEstado === t ? styles.filterTabActive : ''}`}
            onClick={() => setFilterEstado(t)}
          >
            {t === 'todos' ? 'Todos' : ESTADO_LABEL[t]}
          </button>
        ))}
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Lista de Contratos</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
            {loading ? 'Cargando...' : `${contratos.length} contratos`}
          </span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Inmueble</th>
              <th>Locador</th>
              <th>Locatario</th>
              <th>Monto</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Cargando contratos...</td></tr>
            ) : contratos.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                  No hay contratos registrados
                  <br /><br />
                  <button className={styles.btnPrimary} onClick={handleNew}>Cargar primer contrato</button>
                </td>
              </tr>
            ) : (
              contratos.map(c => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--white)', fontWeight: 500 }}>{c.inmueble?.direccion || '-'}</td>
                  <td>{c.locador?.nombre || '-'}</td>
                  <td>{c.locatario?.nombre || '-'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--white)' }}>
                    {c.moneda} {Number(c.monto_inicial).toLocaleString('es-AR')}
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {formatDate(c.fecha_inicio)}<br />
                    <span style={{ color: 'var(--gray-500)' }}>al {formatDate(c.fecha_fin)}</span>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${ESTADO_BADGE[c.estado] || styles.badgeGray}`}>
                      {ESTADO_LABEL[c.estado] || c.estado}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <Link href={`/admin/administraciones/contratos/${c.id}`} className={styles.btnIcon} title="Ver detalle">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                        </svg>
                      </Link>
                      <button className={styles.btnIcon} onClick={() => { setEditData(c); setModalOpen(true); }} title="Editar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button className={styles.btnIcon} onClick={() => handleDelete(c.id)} title="Eliminar" style={{ color: '#f87171' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ContratoModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSaved={fetchContratos}
        editData={editData}
      />
    </>
  );
}
