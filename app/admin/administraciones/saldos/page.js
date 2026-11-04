'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import styles from '@/components/admin/admin.module.css';
import Icon from '@/components/admin/Icon';
import { supabase } from '@/lib/supabase';
import SaldoModal from '@/components/admin/administraciones/SaldoModal';
import { fetchSaldos, fetchClientes } from '@/lib/admin-fetchers';
import { saldoPorContraparte, nombreContraparte } from '@/lib/administraciones-calc';

const PREFIJO = { ARS: '$', USD: 'US$' };
const money = (moneda, v) => `${PREFIJO[moneda] || '$'} ${Number(v || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

export default function SaldosPage() {
  const { data: saldos = [], isLoading: loading, mutate } = useSWR('saldos', fetchSaldos);
  const { data: clientes = [] } = useSWR('clientes', fetchClientes);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const acumulados = useMemo(() => saldoPorContraparte(saldos), [saldos]);

  const handleNew = () => { setEditData(null); setModalOpen(true); };
  const handleEdit = (s) => { setEditData(s); setModalOpen(true); };
  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este movimiento?')) return;
    const { error } = await supabase.from('saldos_cuenta').delete().eq('id', id);
    if (error) return alert('Error: ' + error.message);
    mutate(prev => prev.filter(s => s.id !== id), false);
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Saldos</h2>
          <p className={styles.pageSubtitle}>Cuentas corrientes y saldos sueltos entre partes</p>
        </div>
        <button className={styles.btnPrimary} onClick={handleNew}>
          <Icon name="plus" size={16} />
          Nuevo movimiento
        </button>
      </div>

      {/* Saldos acumulados por contraparte + moneda */}
      {acumulados.length > 0 && (
        <div className={styles.statsGrid} style={{ marginBottom: '1.5rem' }}>
          {acumulados.map(a => {
            const aFavor = a.saldo >= 0;
            return (
              <div key={`${a.contraparte}-${a.moneda}`} className={`${styles.summaryCard} ${aFavor ? styles.summaryCardGreen : styles.summaryCardRed}`}>
                <div className={styles.summaryCardLabel}>{a.contraparte} · {a.moneda}</div>
                <div className={styles.summaryCardValue}>{money(a.moneda, Math.abs(a.saldo))}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                  {aFavor ? 'a favor de la contraparte' : 'nos debe'} · {a.movimientos} mov.
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lista de movimientos */}
      <div className={styles.tableWrapper}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>Movimientos</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
            {loading ? 'Cargando...' : `${saldos.length} movimientos`}
          </span>
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Contraparte</th>
              <th>Concepto</th>
              <th>Sentido</th>
              <th style={{ textAlign: 'right' }}>Monto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Cargando...</td></tr>
            ) : saldos.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>
                  No hay movimientos registrados
                  <br /><br />
                  <button className={styles.btnPrimary} onClick={handleNew}>Registrar primer movimiento</button>
                </td>
              </tr>
            ) : (
              saldos.map(s => {
                const aFavor = s.sentido === 'a_favor';
                return (
                  <tr key={s.id}>
                    <td style={{ fontSize: '0.8rem' }}>{formatDate(s.fecha)}</td>
                    <td style={{ color: 'var(--white)', fontWeight: 500 }}>{nombreContraparte(s)}</td>
                    <td style={{ color: 'var(--gray-300)' }}>{s.concepto}</td>
                    <td>
                      <span className={`${styles.badge} ${aFavor ? styles.badgeGreen : styles.badgeRed}`}>
                        {aFavor ? 'A favor' : 'En contra'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: aFavor ? '#4ade80' : '#f87171' }}>
                      {aFavor ? '+' : '−'} {money(s.moneda, s.monto)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button className={styles.btnIcon} onClick={() => handleEdit(s)} title="Editar"><Icon name="edit" size={14} /></button>
                        <button className={styles.btnIcon} onClick={() => handleDelete(s.id)} title="Eliminar" style={{ color: '#f87171' }}><Icon name="trash" size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <SaldoModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null); }}
        onSaved={() => mutate()}
        editData={editData}
        clientes={clientes}
      />
    </>
  );
}
