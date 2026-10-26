'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from '@/components/admin/admin.module.css';
import Icon from '@/components/admin/Icon';
import AdminSelect from '@/components/admin/AdminSelect';
import { supabase } from '@/lib/supabase';

export default function ImpuestosPanel({ inmuebleId }) {
  const [impuestos, setImpuestos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', monto: '', periodo: '', estado: 'pendiente', fecha_vencimiento: '' });

  const fetchImpuestos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('impuestos')
      .select('*')
      .eq('inmueble_id', inmuebleId)
      .order('periodo', { ascending: false });
    setImpuestos(data || []);
    setLoading(false);
  }, [inmuebleId]);

  useEffect(() => { if (inmuebleId) fetchImpuestos(); }, [inmuebleId, fetchImpuestos]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.monto || !form.periodo) return alert('Nombre, monto y período son obligatorios');

    const { error } = await supabase.from('impuestos').insert({
      inmueble_id: inmuebleId,
      nombre: form.nombre,
      monto: parseFloat(form.monto),
      periodo: form.periodo,
      estado: form.estado,
      fecha_vencimiento: form.fecha_vencimiento || null,
    });

    if (error) return alert('Error: ' + error.message);
    setForm({ nombre: '', monto: '', periodo: '', estado: 'pendiente', fecha_vencimiento: '' });
    setShowForm(false);
    fetchImpuestos();
  };

  const toggleEstado = async (imp) => {
    const newEstado = imp.estado === 'pagado' ? 'pendiente' : 'pagado';
    await supabase.from('impuestos').update({ estado: newEstado }).eq('id', imp.id);
    fetchImpuestos();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este impuesto?')) return;
    await supabase.from('impuestos').delete().eq('id', id);
    fetchImpuestos();
  };

  // Totals
  const totalPendiente = impuestos.filter(i => i.estado === 'pendiente').reduce((s, i) => s + Number(i.monto), 0);
  const totalPagado = impuestos.filter(i => i.estado === 'pagado').reduce((s, i) => s + Number(i.monto), 0);

  if (!inmuebleId) {
    return (
      <div className={styles.calcCard}>
        <div className={styles.calcSection} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
          Seleccioná un inmueble para ver los impuestos
        </div>
      </div>
    );
  }

  return (
    <div className={styles.calcCard}>
      <div className={styles.calcSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className={styles.calcSectionTitle}>
            <span style={{ color: 'var(--admin-gold)', display: 'inline-flex' }}>
              <Icon name="credit-card" size={18} />
            </span>
            Impuestos Regionales / Municipales
          </div>
          <button className={styles.btnSecondary} onClick={() => setShowForm(!showForm)} style={{ fontSize: '0.75rem', padding: '0.375rem 0.75rem' }}>
            {showForm ? 'Cancelar' : '+ Agregar'}
          </button>
        </div>

        {/* Summary */}
        <div className={styles.calcResultGrid} style={{ marginTop: '1rem' }}>
          <div className={styles.calcResultItem} style={{ border: '1px solid rgba(239,68,68,0.15)' }}>
            <div className={styles.calcResultItemLabel}>Total Pendiente</div>
            <div className={styles.calcResultItemValue} style={{ color: '#f87171' }}>
              $ {totalPendiente.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className={styles.calcResultItem}>
            <div className={styles.calcResultItemLabel}>Total Pagado</div>
            <div className={styles.calcResultItemValue} style={{ color: '#4ade80' }}>
              $ {totalPagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', border: '1px solid var(--admin-gold-08)' }}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Impuesto</label>
                <AdminSelect
                  value={form.nombre}
                  onChange={(val) => setForm({ ...form, nombre: val })}
                  options={[
                    { value: 'Municipal', label: 'Municipal' },
                    { value: 'ABL', label: 'ABL' },
                    { value: 'Tasa de servicios', label: 'Tasa de Servicios' },
                    { value: 'Contribuciones', label: 'Contribuciones' },
                    { value: 'Otro', label: 'Otro' },
                  ]}
                  placeholder="— Seleccionar —"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Período</label>
                <input className={styles.formInput} type="month" value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Monto ($)</label>
                <input className={styles.formInput} type="number" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} placeholder="5000" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha Vencimiento</label>
                <input className={styles.formInput} type="date" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} />
              </div>
            </div>
            <button type="submit" className={styles.btnPrimary} style={{ marginTop: '0.75rem' }}>Guardar Impuesto</button>
          </form>
        )}
      </div>

      {/* Impuestos list */}
      {impuestos.length > 0 && (
        <div className={styles.calcSection} style={{ padding: 0 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Período</th>
                <th>Impuesto</th>
                <th>Monto</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {impuestos.map(i => (
                <tr key={i.id}>
                  <td>{i.periodo}</td>
                  <td style={{ color: 'var(--white)', fontWeight: 500 }}>{i.nombre}</td>
                  <td style={{ fontWeight: 600, color: 'var(--white)' }}>
                    $ {Number(i.monto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>{i.fecha_vencimiento ? new Date(i.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-AR') : '-'}</td>
                  <td>
                    <button
                      className={`${styles.badge} ${i.estado === 'pagado' ? styles.badgeGreen : styles.badgeRed}`}
                      onClick={() => toggleEstado(i)}
                      style={{ cursor: 'pointer', border: 'none' }}
                      title="Click para cambiar estado"
                    >
                      {i.estado === 'pagado' ? '✓ Pagado' : '⏳ Pendiente'}
                    </button>
                  </td>
                  <td>
                    <button className={styles.btnIcon} onClick={() => handleDelete(i.id)} title="Eliminar" style={{ color: '#f87171' }}>
                      <Icon name="x" size={12} />
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
