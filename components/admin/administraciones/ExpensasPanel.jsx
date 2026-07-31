'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

export default function ExpensasPanel({ contratoId, inmuebleId }) {
  const [expensas, setExpensas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tipo: 'ordinaria', concepto: '', monto: '', periodo: '' });

  const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

  const fetchExpensas = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('expensas').select('*').order('periodo', { ascending: false });
    if (contratoId) query = query.eq('contrato_id', contratoId);
    if (inmuebleId) query = query.eq('inmueble_id', inmuebleId);
    const { data } = await query;
    setExpensas(data || []);
    setLoading(false);
  }, [contratoId, inmuebleId]);

  useEffect(() => { fetchExpensas(); }, [fetchExpensas]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.monto || !form.periodo) return alert('Monto y período son obligatorios');

    const { error } = await supabase.from('expensas').insert({
      contrato_id: contratoId || null,
      inmueble_id: inmuebleId || null,
      tipo: form.tipo,
      concepto: form.concepto,
      monto: parseFloat(form.monto),
      periodo: form.periodo,
    });

    if (error) return alert('Error: ' + error.message);
    setForm({ tipo: 'ordinaria', concepto: '', monto: '', periodo: '' });
    setShowForm(false);
    fetchExpensas();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta expensa?')) return;
    await supabase.from('expensas').delete().eq('id', id);
    fetchExpensas();
  };

  // Totals
  const currentExpensas = expensas.filter(e => e.periodo === currentPeriod);
  const totalOrdinarias = currentExpensas.filter(e => e.tipo === 'ordinaria').reduce((s, e) => s + Number(e.monto), 0);
  const totalExtraordinarias = currentExpensas.filter(e => e.tipo === 'extraordinaria').reduce((s, e) => s + Number(e.monto), 0);
  const totalAbonar = totalOrdinarias + totalExtraordinarias;

  return (
    <div className={styles.calcCard}>
      <div className={styles.calcSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className={styles.calcSectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Expensas
          </div>
          <button className={styles.btnSecondary} onClick={() => setShowForm(!showForm)} style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}>
            {showForm ? 'Cancelar' : '+ Agregar'}
          </button>
        </div>

        {/* Summary for current period */}
        <div className={styles.calcResultGrid} style={{ marginTop: '1rem' }}>
          <div className={styles.calcResultItem}>
            <div className={styles.calcResultItemLabel}>Ordinarias ({currentPeriod})</div>
            <div className={styles.calcResultItemValue}>
              $ {totalOrdinarias.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className={styles.calcResultItem}>
            <div className={styles.calcResultItemLabel}>Extraordinarias ({currentPeriod})</div>
            <div className={styles.calcResultItemValue}>
              $ {totalExtraordinarias.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className={styles.calcResultItem} style={{ border: '1px solid rgba(201,169,110,0.15)' }}>
            <div className={styles.calcResultItemLabel}>Total a Abonar</div>
            <div className={styles.calcResultItemValue} style={{ color: 'var(--gold)' }}>
              $ {totalAbonar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid rgba(201,169,110,0.08)' }}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo</label>
                <select className={styles.formSelect} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                  <option value="ordinaria">Ordinaria</option>
                  <option value="extraordinaria">Extraordinaria</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Período</label>
                <input className={styles.formInput} type="month" value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Concepto</label>
                <input className={styles.formInput} value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} placeholder="Ej: Expensas Marzo" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Monto ($)</label>
                <input className={styles.formInput} type="number" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} placeholder="15000" required />
              </div>
            </div>
            <button type="submit" className={styles.btnPrimary} style={{ marginTop: '0.75rem' }}>Guardar Expensa</button>
          </form>
        )}
      </div>

      {/* Expensas list */}
      {expensas.length > 0 && (
        <div className={styles.calcSection} style={{ padding: 0 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Período</th>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expensas.map(e => (
                <tr key={e.id}>
                  <td>{e.periodo}</td>
                  <td>
                    <span className={`${styles.badge} ${e.tipo === 'ordinaria' ? styles.badgeBlue : styles.badgeYellow}`}>
                      {e.tipo === 'ordinaria' ? 'Ordinaria' : 'Extraordinaria'}
                    </span>
                  </td>
                  <td>{e.concepto || '-'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--white)' }}>
                    $ {Number(e.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <button className={styles.btnIcon} onClick={() => handleDelete(e.id)} title="Eliminar" style={{ color: '#f87171' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
