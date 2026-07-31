'use client';

import { useState } from 'react';
import styles from '@/components/admin/admin.module.css';
import { supabase } from '@/lib/supabase';

const EMPTY_FORM = {
  nombre: '', dni_cuit: '', tipo: 'locatario', telefono: '', email: '',
  domicilio: '', cbu: '', banco: '', titular_cuenta: '', alias: '', notas: '',
};

export default function ClienteModal({ isOpen, onClose, onSaved, editData }) {
  const [form, setForm] = useState(editData || EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return alert('El nombre es obligatorio');
    setSaving(true);

    try {
      if (editData?.id) {
        const { error } = await supabase.from('clientes').update(form).eq('id', editData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clientes').insert(form);
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

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {editData?.id ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h3>
          <button className={styles.modalClose} onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre Completo *</label>
                <input className={styles.formInput} name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre y Apellido" required />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>DNI / CUIT</label>
                <input className={styles.formInput} name="dni_cuit" value={form.dni_cuit} onChange={handleChange} placeholder="20-12345678-9" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo *</label>
                <select className={styles.formSelect} name="tipo" value={form.tipo} onChange={handleChange}>
                  <option value="locador">Locador</option>
                  <option value="locatario">Locatario</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Teléfono</label>
                <input className={styles.formInput} name="telefono" value={form.telefono} onChange={handleChange} placeholder="+54 11 1234-5678" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input className={styles.formInput} name="email" type="email" value={form.email} onChange={handleChange} placeholder="cliente@email.com" />
              </div>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Domicilio</label>
                <input className={styles.formInput} name="domicilio" value={form.domicilio} onChange={handleChange} placeholder="Dirección completa" />
              </div>

              {/* Datos Bancarios */}
              <div className={`${styles.formGroup} ${styles.formGridFull}`} style={{ borderTop: '1px solid rgba(201,169,110,0.08)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <label className={styles.formLabel} style={{ color: 'var(--gold)', marginBottom: '0.75rem' }}>Datos Bancarios</label>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>CBU</label>
                <input className={styles.formInput} name="cbu" value={form.cbu} onChange={handleChange} placeholder="0000000000000000000000" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Banco</label>
                <input className={styles.formInput} name="banco" value={form.banco} onChange={handleChange} placeholder="Nombre del banco" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Titular de la Cuenta</label>
                <input className={styles.formInput} name="titular_cuenta" value={form.titular_cuenta} onChange={handleChange} placeholder="Nombre del titular" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Alias</label>
                <input className={styles.formInput} name="alias" value={form.alias} onChange={handleChange} placeholder="mi.alias.banco" />
              </div>

              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Notas</label>
                <textarea className={styles.formTextarea} name="notas" value={form.notas} onChange={handleChange} placeholder="Observaciones adicionales..." rows={3} />
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? 'Guardando...' : (editData?.id ? 'Guardar Cambios' : 'Crear Cliente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
