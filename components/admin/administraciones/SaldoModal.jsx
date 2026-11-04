'use client';

import { useState, useEffect } from 'react';
import styles from '@/components/admin/admin.module.css';
import Icon from '@/components/admin/Icon';
import AdminSelect from '@/components/admin/AdminSelect';
import { supabase } from '@/lib/supabase';

const TEXTO_LIBRE = '__texto__';

const hoyISO = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  fecha: hoyISO(), concepto: '', monto: '', moneda: 'ARS', sentido: 'a_favor',
  contraparte_cliente_id: '', contraparte_texto: '',
};

export default function SaldoModal({ isOpen, onClose, onSaved, editData, clientes = [] }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [usaTexto, setUsaTexto] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      setForm({ ...EMPTY_FORM, ...editData, monto: String(editData.monto ?? ''), contraparte_cliente_id: editData.contraparte_cliente_id || '', contraparte_texto: editData.contraparte_texto || '' });
      setUsaTexto(!editData.contraparte_cliente_id && !!editData.contraparte_texto);
    } else {
      setForm({ ...EMPTY_FORM, fecha: hoyISO() });
      setUsaTexto(false);
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.concepto.trim()) return alert('El concepto es obligatorio');
    const monto = parseFloat(form.monto);
    if (!monto || monto <= 0) return alert('Ingresá un monto mayor a 0');
    if (usaTexto ? !form.contraparte_texto.trim() : !form.contraparte_cliente_id) {
      return alert('Elegí o escribí una contraparte');
    }
    setSaving(true);
    try {
      const payload = {
        fecha: form.fecha,
        concepto: form.concepto.trim(),
        monto,
        moneda: form.moneda,
        sentido: form.sentido,
        contraparte_cliente_id: usaTexto ? null : form.contraparte_cliente_id,
        contraparte_texto: usaTexto ? form.contraparte_texto.trim() : null,
      };
      if (editData?.id) {
        const { error } = await supabase.from('saldos_cuenta').update(payload).eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('saldos_cuenta').insert(payload);
        if (error) throw error;
      }
      onSaved?.();
      onClose();
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const clienteOptions = [
    ...clientes.map(c => ({ value: c.id, label: c.nombre })),
    { value: TEXTO_LIBRE, label: '✎ Otra (escribir)…' },
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{editData?.id ? 'Editar movimiento' : 'Nuevo movimiento'}</h3>
          <button className={styles.modalClose} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Fecha *</label>
                <input className={styles.formInput} type="date" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Monto *</label>
                <input className={styles.formInput} type="number" step="0.01" min="0" value={form.monto} onChange={(e) => set('monto', e.target.value)} placeholder="0,00" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Moneda *</label>
                <AdminSelect value={form.moneda} onChange={(v) => set('moneda', v)}
                  options={[{ value: 'ARS', label: 'Pesos (ARS)' }, { value: 'USD', label: 'Dólares (USD)' }]} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sentido *</label>
                <AdminSelect value={form.sentido} onChange={(v) => set('sentido', v)}
                  options={[{ value: 'a_favor', label: 'A favor de la contraparte' }, { value: 'en_contra', label: 'En contra (nos debe)' }]} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contraparte *</label>
                <AdminSelect
                  value={usaTexto ? TEXTO_LIBRE : form.contraparte_cliente_id}
                  onChange={(v) => {
                    if (v === TEXTO_LIBRE) { setUsaTexto(true); set('contraparte_cliente_id', ''); }
                    else { setUsaTexto(false); set('contraparte_cliente_id', v); }
                  }}
                  options={clienteOptions}
                  placeholder="Elegí un cliente o escribí…"
                />
              </div>
              {usaTexto && (
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Nombre contraparte *</label>
                  <input className={styles.formInput} value={form.contraparte_texto} onChange={(e) => set('contraparte_texto', e.target.value)} placeholder="Ej: Lorena" />
                </div>
              )}

              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Concepto *</label>
                <input className={styles.formInput} value={form.concepto} onChange={(e) => set('concepto', e.target.value)} placeholder="Ej: saldo a favor por reparación" required />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando...' : (editData?.id ? 'Guardar cambios' : 'Registrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
